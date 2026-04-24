/**
 * Contexto de Chat para gerenciamento de estado global de mensagens
 * Integra com WebSocket para comunicação em tempo real
 * Seguindo a documentação "Sistema de Chat em Tempo Real"
 * 
 * Funcionalidades:
 * - Carregamento de histórico via REST API (lazy loading)
 * - WebSocket para mensagens em tempo real
 * - Long polling como fallback
 * - Status de entrega (SENDING → DELIVERED → READ)
 * - Contador de mensagens não lidas (badge)
 * - Status online do outro usuário
 * - Cache inteligente de mensagens por corrida
 * - Validação de corrida ativa antes de enviar mensagens
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, Vibration, Platform } from 'react-native';
import {
  chatWebSocket,
  type ChatServerMessage,
  type ChatMessageServer,
  type ChatChatUnreadCountServer,
  type ChatChatUserOnlineStatusServer,
  type ChatChatDeliveryStatus,
} from '@/services/websocket';
import { apiService, ChatMessageData } from '@/services/api';
import { useAuth } from './AuthContext';

// ============================================
// STATUS DE CORRIDA QUE PERMITEM CHAT
// ============================================

/**
 * Status de corrida que indicam que o chat está disponível
 * Baseado na documentação WebSocket oficial - Máquina de Estados da Corrida:
 * 
 * Chat disponível desde que o motorista aceita até a corrida ser finalizada:
 * - MOTORISTA_ENCONTRADO: Sistema encontrou motorista
 * - MOTORISTA_ACEITOU: Motorista aceitou a corrida
 * - MOTORISTA_A_CAMINHO: Motorista indo ao ponto de embarque
 * - MOTORISTA_PROXIMO: Motorista próximo (≤500m)
 * - MOTORISTA_CHEGOU: Motorista chegou (≤100m)
 * - PASSAGEIRO_EMBARCADO: Passageiro entrou no veículo
 * - EM_ROTA: Em rota para o destino
 * - PROXIMO_DESTINO: Próximo ao destino (≤500m)
 * 
 * Chat também disponível após finalização (para avaliação):
 * - CORRIDA_FINALIZADA: Corrida finalizada
 * - AGUARDANDO_AVALIACAO: Aguardando avaliação
 * 
 * Equivalentes em inglês do painel admin
 */
const ACTIVE_RIDE_STATUSES = [
  // Status em português (conforme documentação WebSocket)
  'MOTORISTA_ENCONTRADO',
  'MOTORISTA_ACEITOU',
  'MOTORISTA_A_CAMINHO',
  'MOTORISTA_PROXIMO',
  'MOTORISTA_CHEGOU',
  'PASSAGEIRO_EMBARCADO',
  'EM_ROTA',
  'PROXIMO_DESTINO',
  'CORRIDA_FINALIZADA',
  'AGUARDANDO_AVALIACAO',
  
  // Equivalentes em inglês (painel admin)
  'DRIVER_FOUND',
  'DRIVER_ASSIGNED',
  'DRIVER_ON_THE_WAY',
  'DRIVER_NEARBY',
  'DRIVER_ARRIVING',
  'DRIVER_ARRIVED',
  'PASSENGER_BOARDED',
  'IN_PROGRESS',
  'IN_ROUTE',
  'NEAR_DESTINATION',
  'WAITING_AT_DESTINATION',
  'COMPLETED',
  'AWAITING_REVIEW',
  'ACCEPTED', // Adicionado para garantir compatibilidade
];

/**
 * Verifica se o status da corrida permite uso do chat
 */
function isRideActiveForChat(status?: string): boolean {
  if (!status) return false;
  return ACTIVE_RIDE_STATUSES.includes(status);
}

// ============================================
// TIPOS
// ============================================

export interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  recipientId: string;
  content: string;
  deliveryStatus: ChatDeliveryStatus;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  // Flag local para mensagens optimistic
  isOptimistic?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  unreadCount: number;
  isOnline: boolean;
  lastSeenAt?: string;
  isConnected: boolean;
  isLoading: boolean;
  hasMoreMessages: boolean;
  otherUserName?: string;
  otherUserPhoto?: string;
  otherUserId?: string;
  rideStatus?: string; // Status atual da corrida
  isChatAvailable: boolean; // Indica se o chat está disponível baseado no status
}

interface ChatContextType {
  // Estado
  chatState: ChatState;
  isChatOpen: boolean;
  currentRideId: string | null;

  // Ações
  openChat: (rideId: string, otherUserName?: string, otherUserPhoto?: string, rideStatus?: string, otherUserId?: string) => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<boolean>;
  markAsRead: (messageIds: string[], rideIdOverride?: string) => void;
  loadMoreMessages: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  updateRideStatus: (status: string) => void; // Nova função para atualizar status da corrida
  
  // Controle de conexão
  connectChat: () => void;
  disconnectChat: () => void;
}

const initialChatState: ChatState = {
  messages: [],
  unreadCount: 0,
  isOnline: false,
  isConnected: false,
  isLoading: false,
  hasMoreMessages: false,
  rideStatus: undefined,
  isChatAvailable: false,
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [chatState, setChatState] = useState<ChatState>(initialChatState);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  
  // Refs
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const messagesCache = useRef<Map<string, ChatMessage[]>>(new Map());
  const cursorCache = useRef<Map<string, string | null>>(new Map());
  const longPollingActive = useRef(false);
  const longPollingCursor = useRef<string | undefined>(undefined);
  const currentRideIdRef = useRef<string | null>(null); // Ref para acesso síncrono
  const rideStatusRef = useRef<string | undefined>(undefined); // Ref para status da corrida
  const isChatAvailableRef = useRef<boolean>(false); // Ref para disponibilidade do chat

  // Atualiza ref quando currentRideId muda
  useEffect(() => {
    currentRideIdRef.current = currentRideId;
    // Também atualiza no serviço de WebSocket
    chatWebSocket.setCurrentRideId(currentRideId);
    console.log('[ChatContext] 🔄 currentRideId atualizado:', currentRideId);
  }, [currentRideId]);

  // Atualiza ref quando rideStatus ou isChatAvailable mudam
  useEffect(() => {
    rideStatusRef.current = chatState.rideStatus;
    isChatAvailableRef.current = chatState.isChatAvailable;
    console.log('[ChatContext] 🔄 Status da corrida atualizado:', {
      rideStatus: chatState.rideStatus,
      isChatAvailable: chatState.isChatAvailable,
    });
  }, [chatState.rideStatus, chatState.isChatAvailable]);

  // Determina o tipo de usuário
  const userType: 'driver' | 'passenger' | null = user?.roles?.includes('driver')
    ? 'driver'
    : user?.roles?.includes('passenger') || user?.type === 'passenger'
    ? 'passenger'
    : null;

  const currentUserId = user?.userId || user?.id;

  // ============================================
  // CONEXÃO WEBSOCKET
  // ============================================

  const connectChat = useCallback(() => {
    if (!isAuthenticated || !userType) {
      console.log('[ChatContext] ⚠️ Não autenticado ou tipo de usuário não definido');
      return;
    }

    console.log('[ChatContext] 🔌 Conectando ao WebSocket de chat...', { userType });
    chatWebSocket.connectAs(userType);
  }, [isAuthenticated, userType]);

  const disconnectChat = useCallback(() => {
    console.log('[ChatContext] 🔌 Desconectando do WebSocket de chat...');
    chatWebSocket.disconnect();
    stopLongPolling();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userType) {
      return;
    }

    console.log('[ChatContext] 🔌 Inicializando conexão WebSocket...', { userType, userId: currentUserId });
    chatWebSocket.connectAs(userType);

    // Configura callbacks
    chatWebSocket.setOnMessage(handleWebSocketMessage);
    chatWebSocket.setOnConnectionStateChange((connected) => {
      console.log('[ChatContext] 📡 Estado da conexão:', connected);
      setChatState((prev) => ({ ...prev, isConnected: connected }));
      
      if (connected) {
        // Reconectou - para long polling e recarrega mensagens
        stopLongPolling();
        
        // Recarrega mensagens se o chat estiver aberto
        if (currentRideIdRef.current && isChatOpen) {
          console.log('[ChatContext] 🔄 Reconectado! Recarregando mensagens...');
          loadMessages(currentRideIdRef.current);
        }
      } else if (!connected && currentRideIdRef.current && isChatOpen) {
        // Desconectou - inicia long polling como fallback
        console.log('[ChatContext] ⚠️ Desconectado! Iniciando long polling...');
        startLongPolling(currentRideIdRef.current);
      }
    });

    return () => {
      console.log('[ChatContext] 🔌 Cleanup: desconectando WebSocket...');
      chatWebSocket.disconnect();
      chatWebSocket.setOnMessage(null);
      chatWebSocket.setOnConnectionStateChange(null);
      stopLongPolling();
    };
  }, [isAuthenticated, userType]);

  // ============================================
  // APP STATE (foreground/background)
  // ============================================

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App voltou ao foreground
        if (isAuthenticated && userType && !chatWebSocket.isConnected) {
          console.log('[ChatContext] 📱 App voltou ao foreground, reconectando...');
          chatWebSocket.connectAs(userType);
        }
        
        // Atualiza contador de não lidas
        if (currentRideIdRef.current) {
          refreshUnreadCount();
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, userType]);

  // ============================================
  // LONG POLLING (fallback)
  // ============================================

  const startLongPolling = useCallback(async (rideId: string) => {
    if (longPollingActive.current) return;
    
    console.log('[ChatContext] 🔄 Iniciando long polling para rideId:', rideId);
    longPollingActive.current = true;
    
    while (longPollingActive.current && !chatWebSocket.isConnected) {
      try {
        const response = await apiService.pollChatMessages(rideId, 30, longPollingCursor.current);
        
        if (response.success && response.data && response.data.items.length > 0) {
          // Processa novas mensagens
          response.data.items.forEach((msg) => {
            handleNewMessage({
              type: 'chat_message',
              data: msg,
            });
          });
          
          if (response.data.nextCursor) {
            longPollingCursor.current = response.data.nextCursor;
          }
        }
      } catch (error) {
        console.error('[ChatContext] ❌ Erro no long polling:', error);
        // Aguarda 5s antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    
    console.log('[ChatContext] 🔄 Long polling parado');
  }, []);

  const stopLongPolling = useCallback(() => {
    longPollingActive.current = false;
  }, []);

  // ============================================
  // PROCESSAMENTO DE MENSAGENS WEBSOCKET
  // ============================================

  const handleWebSocketMessage = useCallback((message: ChatServerMessage) => {
    console.log('[ChatContext] 📨 WebSocket message recebida:', message.type);
    
    switch (message.type) {
      case 'chat_message':
        handleNewMessage(message);
        break;
      case 'unread_count':
        handleUnreadCount(message);
        break;
      case 'user_online_status':
        handleOnlineStatus(message);
        break;
      case 'delivery_confirmed':
        handleDeliveryConfirmed(message);
        break;
      case 'read_confirmed':
        handleReadConfirmed(message);
        break;
      case 'pong':
        // Heartbeat response - ignorar
        break;
      case 'error':
        console.error('[ChatContext] ❌ Erro do servidor:', JSON.stringify(message.data));
        break;
    }
  }, []);

  // Nova mensagem recebida
  const handleNewMessage = useCallback((message: ChatMessageServer) => {
    const chatMessage: ChatMessage = {
      id: message.data.id,
      rideId: message.data.rideId,
      senderId: message.data.senderId,
      recipientId: message.data.recipientId,
      content: message.data.content,
      deliveryStatus: message.data.deliveryStatus,
      deliveredAt: message.data.deliveredAt,
      createdAt: message.data.createdAt,
    };

    const isMyMessage = chatMessage.senderId === currentUserId;

    console.log('[ChatContext] 📩 Nova mensagem:', {
      isMyMessage,
      currentRideId: currentRideIdRef.current,
      messageRideId: message.data.rideId,
      senderId: chatMessage.senderId,
      recipientId: chatMessage.recipientId,
    });

    // Atualiza cache sempre
    const cached = messagesCache.current.get(message.data.rideId) || [];
    // Evita duplicatas
    if (!cached.some((m) => m.id === chatMessage.id)) {
      const updated = [...cached, chatMessage];
      messagesCache.current.set(message.data.rideId, updated);
    }

    setChatState((prev) => {
      // Verifica se é a corrida atual usando o estado mais atualizado
      const isCurrentRide = currentRideIdRef.current === message.data.rideId;
      
      // Se é a corrida atual, atualiza mensagens
      if (isCurrentRide) {
        // Verifica se já existe (evita duplicata de optimistic update)
        const exists = prev.messages.some((m) => m.id === chatMessage.id);
        if (exists) {
          // Remove versão optimistic e adiciona a real
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === chatMessage.id || (m.isOptimistic && m.content === chatMessage.content)
                ? chatMessage
                : m
            ),
          };
        }

        console.log('[ChatContext] ✅ Adicionando mensagem ao estado:', {
          messageId: chatMessage.id,
          isMyMessage,
          isCurrentRide,
        });

        return {
          ...prev,
          messages: [...prev.messages, chatMessage],
          unreadCount: !isMyMessage && !isChatOpen ? prev.unreadCount + 1 : prev.unreadCount,
        };
      }

      // Se não é a corrida atual, apenas incrementa contador
      if (!isMyMessage) {
        // Vibra para notificar nova mensagem
        if (Platform.OS !== 'web') {
          Vibration.vibrate(200);
        }
        
        console.log('[ChatContext] ⚠️ Mensagem não é da corrida atual, apenas incrementando contador:', {
          currentRideId: currentRideIdRef.current,
          messageRideId: message.data.rideId,
        });
        
        return {
          ...prev,
          unreadCount: prev.unreadCount + 1,
        };
      }

      return prev;
    });
  }, [currentUserId, isChatOpen]);

  // Atualização de contador de não lidas
  const handleUnreadCount = useCallback((message: ChatUnreadCountServer) => {
    setChatState((prev) => ({
      ...prev,
      unreadCount: message.data.unreadCount,
    }));
  }, []);

  // Atualização de status online
  const handleOnlineStatus = useCallback((message: ChatUserOnlineStatusServer) => {
    console.log('[ChatContext] 👤 Status online atualizado:', {
      userId: message.data.userId,
      isOnline: message.data.isOnline,
      lastSeenAt: message.data.lastSeenAt,
    });
    
    setChatState((prev) => ({
      ...prev,
      isOnline: message.data.isOnline,
      lastSeenAt: message.data.lastSeenAt,
    }));
  }, []);

  // Confirmação de entrega (1 check cinza)
  const handleDeliveryConfirmed = useCallback((message: any) => {
    console.log('[ChatContext] ✓ Confirmação de entrega recebida:', {
      messageId: message.data.messageId,
      deliveredAt: message.data.deliveredAt,
    });
    
    setChatState((prev) => {
      const updatedMessages = prev.messages.map((msg) =>
        msg.id === message.data.messageId
          ? { ...msg, deliveryStatus: 'DELIVERED' as const, deliveredAt: message.data.deliveredAt }
          : msg
      );

      // Atualiza cache
      if (currentRideIdRef.current) {
        messagesCache.current.set(currentRideIdRef.current, updatedMessages);
      }

      return {
        ...prev,
        messages: updatedMessages,
      };
    });
  }, []);

  // Confirmação de leitura (2 checks azuis)
  const handleReadConfirmed = useCallback((message: any) => {
    console.log('[ChatContext] ✓✓ Confirmação de leitura recebida:', {
      messageId: message.data.messageId,
      readAt: message.data.readAt,
    });
    
    setChatState((prev) => {
      const updatedMessages = prev.messages.map((msg) =>
        msg.id === message.data.messageId
          ? { ...msg, deliveryStatus: 'READ' as const, readAt: message.data.readAt }
          : msg
      );

      // Atualiza cache
      if (currentRideIdRef.current) {
        messagesCache.current.set(currentRideIdRef.current, updatedMessages);
      }

      return {
        ...prev,
        messages: updatedMessages,
      };
    });
  }, []);

  // ============================================
  // AÇÕES PÚBLICAS
  // ============================================

  /**
   * Busca o status atual da corrida via API
   */
  const fetchRideStatus = useCallback(async (rideId: string): Promise<string | undefined> => {
    try {
      console.log('[ChatContext] 🔍 Buscando status da corrida via API:', rideId);
      
      // Tenta buscar via endpoint de passageiro primeiro
      const passengerEndpoint = `/passengers/rides/${rideId}`;
      console.log('[ChatContext] 📡 Tentando endpoint de passageiro:', `GET ${passengerEndpoint}`);
      
      let response = await apiService.request<any>(passengerEndpoint, {
        method: 'GET',
      });
      
      if (response.success && response.data) {
        const status = response.data.status;
        console.log('[ChatContext] ✅ Status obtido via endpoint de passageiro:', status);
        return status;
      }
      
      console.log('[ChatContext] ⚠️ Endpoint de passageiro falhou, tentando endpoint de motorista...');
      console.log('[ChatContext] 📊 Resposta do endpoint de passageiro:', {
        success: response.success,
        status: response.status,
        error: response.error,
        message: response.message,
      });
      
      // Se falhar, tenta via endpoint de motorista
      const driverEndpoint = `/drivers/rides/${rideId}`;
      console.log('[ChatContext] 📡 Tentando endpoint de motorista:', `GET ${driverEndpoint}`);
      
      response = await apiService.request<any>(driverEndpoint, {
        method: 'GET',
      });
      
      if (response.success && response.data) {
        const status = response.data.status;
        console.log('[ChatContext] ✅ Status obtido via endpoint de motorista:', status);
        return status;
      }
      
      console.warn('[ChatContext] ⚠️ Ambos endpoints falharam (não é crítico se status foi fornecido)');
      console.log('[ChatContext] 📊 Resposta do endpoint de motorista:', {
        success: response.success,
        status: response.status,
        error: response.error,
        message: response.message,
      });
      
      return undefined;
    } catch (error) {
      console.warn('[ChatContext] ⚠️ Exceção ao buscar status via API (não é crítico se status foi fornecido):', error);
      return undefined;
    }
  }, []);

  /**
   * Abre o chat para uma corrida específica
   * @param rideId - ID da corrida
   * @param otherUserName - Nome do outro usuário (motorista ou passageiro)
   * @param otherUserPhoto - Foto do outro usuário
   * @param rideStatus - Status atual da corrida (opcional, será buscado via API se não fornecido)
   */
  const openChat = useCallback(async (
    rideId: string,
    otherUserName?: string,
    otherUserPhoto?: string,
    rideStatus?: string,
    otherUserId?: string
  ) => {
    if (!rideId || rideId.trim() === '') {
      console.error('[ChatContext] ❌ rideId é obrigatório para abrir o chat!');
      return;
    }

    const trimmedRideId = rideId.trim();
    
    // Tenta buscar status atual via API APENAS se não foi fornecido
    // (o status fornecido como parâmetro já é confiável e evita requisições desnecessárias)
    console.log('[ChatContext] 📡 Verificando status da corrida...', {
      rideId: trimmedRideId,
      statusFornecido: rideStatus,
      otherUserId
    });
    
    let fetchedStatus: string | undefined;
    
    // Só busca na API se o status não foi fornecido
    if (!rideStatus) {
      console.log('[ChatContext] 🔍 Status não fornecido, buscando via API...');
      fetchedStatus = await fetchRideStatus(trimmedRideId);
    } else {
      console.log('[ChatContext] ✅ Status fornecido, pulando busca via API:', rideStatus);
    }
    
    // Prioriza status fornecido, usa buscado apenas se fornecido for undefined
    const finalStatus = rideStatus || fetchedStatus;
    
    const isChatAvailable = isRideActiveForChat(finalStatus);
    
    console.log('[ChatContext] 📱 Abrindo chat:', {
      rideId: trimmedRideId,
      statusFornecido: rideStatus,
      statusBuscado: fetchedStatus,
      statusFinal: finalStatus,
      isChatAvailable,
      statusPermitidos: ACTIVE_RIDE_STATUSES.join(', '),
    });
    
    // Define o rideId ANTES de abrir o chat
    setCurrentRideId(trimmedRideId);
    currentRideIdRef.current = trimmedRideId; // Atualiza ref imediatamente
    chatWebSocket.setCurrentRideId(trimmedRideId);
    
    setIsChatOpen(true);

    // Verifica cache
    const cachedMessages = messagesCache.current.get(trimmedRideId);
    
    // Atualiza estado com status e disponibilidade
    setChatState((prev) => ({
      ...prev,
      messages: cachedMessages || [],
      isLoading: !cachedMessages,
      otherUserName,
      otherUserPhoto,
      otherUserId,
      rideStatus: finalStatus,
      isChatAvailable,
    }));

    // Atualiza refs imediatamente após atualizar estado
    rideStatusRef.current = finalStatus;
    isChatAvailableRef.current = isChatAvailable;

    // Busca status online inicial se tiver ID
    if (otherUserId) {
      checkUserOnlineStatus(otherUserId);
    }

    // Carrega mensagens do servidor se não tiver cache
    if (!cachedMessages) {
      await loadMessages(trimmedRideId);
    }

    // Busca contador de não lidas
    refreshUnreadCountForRide(trimmedRideId);
  }, [fetchRideStatus]);

  const checkUserOnlineStatus = async (userId: string) => {
    try {
      console.log('[ChatContext] 🔍 Buscando status online inicial:', userId);
      const response = await apiService.getUserOnlineStatus(userId);
      if (response.success && response.data) {
        const data = response.data;
        console.log('[ChatContext] ✅ Status online inicial obtido:', data);
        setChatState(prev => ({
          ...prev,
          isOnline: data.isOnline,
          lastSeenAt: data.lastSeenAt
        }));
      }
    } catch (error) {
      console.warn('[ChatContext] ⚠️ Erro ao buscar status online inicial:', error);
    }
  };

  /**
   * Fecha o chat
   */
  const closeChat = useCallback(() => {
    console.log('[ChatContext] 📱 Fechando chat');
    setIsChatOpen(false);
    stopLongPolling();
    // Não limpa currentRideId para manter contexto do badge
  }, [stopLongPolling]);

  /**
   * Atualiza o status da corrida
   * Deve ser chamado sempre que o status da corrida mudar
   */
  const updateRideStatus = useCallback((status: string) => {
    const isChatAvailable = isRideActiveForChat(status);
    
    console.log('[ChatContext] 🔄 Atualizando status da corrida:', {
      statusAnterior: rideStatusRef.current,
      statusNovo: status,
      isChatAvailableAnterior: isChatAvailableRef.current,
      isChatAvailableNovo: isChatAvailable,
    });
    
    // Atualiza estado
    setChatState((prev) => ({
      ...prev,
      rideStatus: status,
      isChatAvailable,
    }));

    // Atualiza refs imediatamente
    rideStatusRef.current = status;
    isChatAvailableRef.current = isChatAvailable;
  }, []);

  /**
   * Envia uma mensagem
   * NOTA: Usando REST API diretamente (mais confiável) + WebSocket para receber
   */
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    // Usa a ref para garantir o valor mais recente
    const rideId = currentRideIdRef.current;
    const rideStatus = rideStatusRef.current;
    const isChatAvailable = isChatAvailableRef.current;
    
    console.log('[ChatContext] 📤 Tentando enviar mensagem:', {
      rideId,
      rideStatus,
      isChatAvailable,
      contentLength: content?.length,
      wsConnected: chatWebSocket.isConnected,
    });

    if (!rideId || rideId.trim() === '') {
      console.error('[ChatContext] ❌ ERRO: Nenhuma corrida ativa para enviar mensagem!', {
        currentRideId,
        currentRideIdRef: currentRideIdRef.current,
      });
      return false;
    }

    // Valida se a corrida está em um status que permite chat
    if (!isChatAvailable) {
      console.error('[ChatContext] ❌ ERRO: Chat não está disponível para o status atual da corrida!', {
        rideId,
        rideStatus,
        isChatAvailable,
        allowedStatuses: ACTIVE_RIDE_STATUSES,
      });
      return false;
    }

    if (!content || content.trim() === '') {
      console.warn('[ChatContext] ⚠️ Conteúdo da mensagem é obrigatório');
      return false;
    }

    const trimmedRideId = rideId.trim();
    const trimmedContent = content.trim();

    // Cria mensagem optimistic (aparece imediatamente com status SENDING)
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      rideId: trimmedRideId,
      senderId: currentUserId || '',
      recipientId: '', // Será preenchido pelo servidor
      content: trimmedContent,
      deliveryStatus: 'SENDING',
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Adiciona mensagem optimistic
    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, optimisticMessage],
    }));

    // SEMPRE usa REST API para enviar (mais confiável)
    // WebSocket é usado apenas para RECEBER mensagens em tempo real
    console.log('[ChatContext] 📤 Enviando via REST API (método confiável)...');
    
    try {
      const response = await apiService.sendChatMessage(trimmedRideId, trimmedContent);
      
      if (response.success && response.data) {
        console.log('[ChatContext] ✅ Mensagem enviada via REST API com sucesso!', response.data);
        // Substitui mensagem optimistic pela real
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === optimisticId
              ? { ...response.data!, isOptimistic: false }
              : m
          ),
        }));
        return true;
      } else {
        console.error('[ChatContext] ❌ Erro ao enviar via REST:', response.error, response.message, response.status);
        // Marca como falha
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === optimisticId
              ? { ...m, deliveryStatus: 'FAILED' as const, isOptimistic: false }
              : m
          ),
        }));
        return false;
      }
    } catch (error) {
      console.error('[ChatContext] ❌ Exceção ao enviar mensagem:', error);
      // Marca como falha
      setChatState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === optimisticId
            ? { ...m, deliveryStatus: 'FAILED' as const, isOptimistic: false }
            : m
        ),
      }));
      return false;
    }
  }, [currentUserId]);

  /**
   * Marca mensagens como lidas
   */
  const markAsRead = useCallback((messageIds: string[], rideIdOverride?: string) => {
    const rideId = rideIdOverride ?? currentRideIdRef.current;
    
    // Validação rigorosa
    if (!rideId || rideId.trim() === '') {
      console.warn('[ChatContext] ⚠️ Não é possível marcar como lida: rideId não está definido', {
        currentRideId: currentRideId,
        currentRideIdRef: currentRideIdRef.current,
      });
      return;
    }

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      console.warn('[ChatContext] ⚠️ Não é possível marcar como lida: nenhuma mensagem fornecida');
      return;
    }

    const trimmedRideId = rideId.trim();
    console.log('[ChatContext] 📖 Marcando como lidas:', { 
      rideId: trimmedRideId, 
      count: messageIds.length,
      messageIds: messageIds.slice(0, 5), // Log apenas os primeiros 5 IDs
    });

    // Envia via WebSocket
    const wsSuccess = chatWebSocket.markAsRead(trimmedRideId, messageIds);
    if (!wsSuccess) {
      console.warn('[ChatContext] ⚠️ Falha ao enviar marcação de lida via WebSocket');
    }

    // Atualiza estado local imediatamente
    setChatState((prev) => {
      const updatedMessages = prev.messages.map((msg) =>
        messageIds.includes(msg.id)
          ? { ...msg, deliveryStatus: 'READ' as const }
          : msg
      );

      // Atualiza cache
      messagesCache.current.set(trimmedRideId, updatedMessages);

      return {
        ...prev,
        messages: updatedMessages,
        unreadCount: Math.max(0, prev.unreadCount - messageIds.length),
      };
    });

    // Também envia via REST para garantir
    apiService.markChatMessagesAsRead(trimmedRideId, messageIds).catch((error) => {
      console.warn('[ChatContext] ⚠️ Erro ao marcar como lido via REST:', error);
    });
  }, [currentRideId]);

  /**
   * Carrega histórico de mensagens (lazy loading)
   */
  const loadMessages = useCallback(async (rideId: string) => {
    console.log('[ChatContext] 📥 Carregando mensagens para rideId:', rideId);
    setChatState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await apiService.getChatMessages(rideId);
      
      if (response.success && response.data) {
        const messages: ChatMessage[] = response.data.items.map((item: ChatMessageData) => ({
          ...item,
          isOptimistic: false,
        }));

        console.log('[ChatContext] 📥 Mensagens carregadas:', messages.length);

        // Atualiza cache
        messagesCache.current.set(rideId, messages);
        
        if (response.data.nextCursor) {
          cursorCache.current.set(rideId, response.data.nextCursor);
        }

        setChatState((prev) => ({
          ...prev,
          messages,
          hasMoreMessages: response.data!.hasMore,
          isLoading: false,
        }));
      } else {
        console.warn('[ChatContext] ⚠️ Nenhuma mensagem encontrada ou erro:', response.error);
        setChatState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('[ChatContext] ❌ Erro ao carregar mensagens:', error);
      setChatState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Carrega mais mensagens (paginação)
   */
  const loadMoreMessages = useCallback(async () => {
    const rideId = currentRideIdRef.current;
    
    if (!rideId || chatState.isLoading || !chatState.hasMoreMessages) {
      return;
    }

    const cursor = cursorCache.current.get(rideId);
    if (!cursor) return;

    console.log('[ChatContext] 📥 Carregando mais mensagens...');
    setChatState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await apiService.getChatMessages(rideId, cursor);
      
      if (response.success && response.data) {
        const newMessages: ChatMessage[] = response.data.items.map((item: ChatMessageData) => ({
          ...item,
          isOptimistic: false,
        }));

        // Atualiza cache
        const cached = messagesCache.current.get(rideId) || [];
        const updated = [...newMessages, ...cached];
        messagesCache.current.set(rideId, updated);
        
        if (response.data.nextCursor) {
          cursorCache.current.set(rideId, response.data.nextCursor);
        } else {
          cursorCache.current.delete(rideId);
        }

        setChatState((prev) => ({
          ...prev,
          messages: [...newMessages, ...prev.messages],
          hasMoreMessages: response.data!.hasMore,
          isLoading: false,
        }));
      } else {
        setChatState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('[ChatContext] ❌ Erro ao carregar mais mensagens:', error);
      setChatState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [chatState.isLoading, chatState.hasMoreMessages]);

  /**
   * Atualiza contador de mensagens não lidas para um rideId específico
   */
  const refreshUnreadCountForRide = useCallback(async (rideId: string) => {
    if (!rideId) return;

    try {
      const response = await apiService.getUnreadMessagesCount(rideId);
      
      if (response.success && response.data) {
        setChatState((prev) => ({
          ...prev,
          unreadCount: response.data!.unreadCount,
        }));
      }
    } catch (error) {
      console.warn('[ChatContext] ⚠️ Erro ao buscar contador de não lidas:', error);
    }
  }, []);

  /**
   * Atualiza contador de mensagens não lidas (usa currentRideId)
   */
  const refreshUnreadCount = useCallback(async () => {
    const rideId = currentRideIdRef.current;
    if (!rideId) return;
    await refreshUnreadCountForRide(rideId);
  }, [refreshUnreadCountForRide]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <ChatContext.Provider
      value={{
        chatState,
        isChatOpen,
        currentRideId,
        openChat,
        closeChat,
        sendMessage,
        markAsRead,
        loadMoreMessages,
        refreshUnreadCount,
        updateRideStatus,
        connectChat,
        disconnectChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat deve ser usado dentro de um ChatProvider');
  }
  return context;
};
