/**
 * Serviço de WebSocket para Chat em Tempo Real
 * Seguindo a documentação "Sistema de Chat em Tempo Real"
 * 
 * Endpoints:
 * - Motoristas: wss://host/ws/drivers/chat?token={JWT}
 * - Passageiros: wss://host/ws/passengers/chat?token={JWT}
 * 
 * Funcionalidades:
 * - Conexão WebSocket com autenticação via token JWT
 * - Heartbeat a cada 30 segundos (obrigatório)
 * - Reconexão automática com Exponential Backoff
 * - Envio e recebimento de mensagens em tempo real
 * - Status de entrega (SENDING → DELIVERED → READ)
 * - Contador de mensagens não lidas (badge)
 * - Status online do outro usuário
 */

import { apiService } from './api';

// Configurações do WebSocket
const WS_HOST = 'vamu.joaoflavio.com';
const WS_SCHEME = 'wss'; // WSS para HTTPS

// ============================================
// TIPOS DE MENSAGENS - CLIENTE → SERVIDOR
// ============================================

// Tipo base para mensagens enviadas pelo cliente
export type ChatClientMessageType = 'chat_message' | 'mark_read' | 'heartbeat';

// Mensagem de chat enviada pelo cliente
// Formato conforme documentação oficial com 'data' aninhado
export interface ChatMessageClient {
  type: 'chat_message';
  data: {
    rideId: string;
    content: string;
  };
}

// Mensagem para marcar como lida
export interface MarkReadClient {
  type: 'mark_read';
  data: {
    rideId: string;
    messageIds: string[];
  };
}

// Mensagem de heartbeat
export interface HeartbeatClient {
  type: 'heartbeat';
}

// União de todas as mensagens do cliente
export type ChatClientMessage = ChatMessageClient | MarkReadClient | HeartbeatClient;

// ============================================
// TIPOS DE MENSAGENS - SERVIDOR → CLIENTE
// ============================================

export type ChatServerMessageType =
  | 'chat_message'
  | 'delivery_confirmed'
  | 'read_confirmed'
  | 'unread_count'
  | 'user_online_status'
  | 'pong'
  | 'error';

// Status de entrega da mensagem
export type DeliveryStatus = 'SENDING' | 'DELIVERED' | 'READ' | 'FAILED';

// Mensagem de chat recebida do servidor
export interface ChatMessageServer {
  type: 'chat_message';
  data: {
    id: string;
    rideId: string;
    senderId: string;
    recipientId: string;
    content: string;
    deliveryStatus: DeliveryStatus;
    deliveredAt?: string;
    createdAt: string;
  };
}

// Confirmação de entrega (2 checks cinzas)
export interface DeliveryConfirmedServer {
  type: 'delivery_confirmed';
  data: {
    messageId: string;
    deliveryStatus: 'DELIVERED';
    deliveredAt: string;
  };
}

// Confirmação de leitura (2 checks azuis)
export interface ReadConfirmedServer {
  type: 'read_confirmed';
  data: {
    messageId: string;
    readAt: string;
  };
}

// Contador de não lidas (badge)
export interface UnreadCountServer {
  type: 'unread_count';
  data: {
    rideId: string;
    unreadCount: number;
  };
}

// Status online do outro usuário
export interface UserOnlineStatusServer {
  type: 'user_online_status';
  data: {
    userId: string;
    isOnline: boolean;
    lastSeenAt: string;
  };
}

// Resposta de heartbeat
export interface PongServer {
  type: 'pong';
  data?: any;
}

// Erro do servidor
export interface ErrorServer {
  type: 'error';
  data: {
    message: string;
    code?: string;
  };
}

// União de todas as mensagens do servidor
export type ChatServerMessage =
  | ChatMessageServer
  | DeliveryConfirmedServer
  | ReadConfirmedServer
  | UnreadCountServer
  | UserOnlineStatusServer
  | PongServer
  | ErrorServer;

// ============================================
// CALLBACKS
// ============================================

type ChatMessageCallback = (message: ChatServerMessage) => void;
type ConnectionStateCallback = (connected: boolean) => void;
type ErrorCallback = (error: Error | Event) => void;

// ============================================
// SERVIÇO DE WEBSOCKET
// ============================================

class ChatWebSocketService {
  private ws: WebSocket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectDelay: number = 1000; // 1 segundo inicial
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private userType: 'driver' | 'passenger' | null = null;
  private currentRideId: string | null = null; // Armazena rideId atual para reconexão

  // Configurações (conforme documentação)
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly MAX_RECONNECT_DELAY_MS = 60000; // 60 segundos máximo
  private readonly HEARTBEAT_INTERVAL_MS = 30000; // 30 segundos (obrigatório!)

  // Rate limiting local (10 mensagens/segundo burst, 30/minuto)
  private messageBurstCount: number = 0;
  private messageBurstResetTime: number = 0;
  private messageMinuteCount: number = 0;
  private messageMinuteResetTime: number = 0;
  private readonly MAX_BURST_MESSAGES = 10;
  private readonly MAX_MINUTE_MESSAGES = 30;

  // Callbacks
  private messageCallbacks: ChatMessageCallback[] = [];
  private onConnectionStateChange: ConnectionStateCallback | null = null;
  private onError: ErrorCallback | null = null;

  /**
   * Define o rideId atual para uso nas mensagens
   */
  setCurrentRideId(rideId: string | null): void {
    console.log('[ChatWebSocket] 🔄 rideId atualizado:', rideId);
    this.currentRideId = rideId;
  }

  /**
   * Obtém o rideId atual
   */
  getCurrentRideId(): string | null {
    return this.currentRideId;
  }

  /**
   * Conecta ao WebSocket do servidor de chat
   * @param userType - 'driver' ou 'passenger'
   */
  async connect(userType: 'driver' | 'passenger'): Promise<boolean> {
    // Se já está conectado, retorna
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      console.log('[ChatWebSocket] Já conectado');
      return true;
    }

    // Desconecta se houver conexão anterior
    if (this.ws) {
      this.disconnect();
    }

    this.userType = userType;

    try {
      const accessToken = apiService.getAccessToken();
      if (!accessToken) {
        console.error('[ChatWebSocket] ❌ Token de acesso não disponível');
        return false;
      }

      // Constrói a URL conforme documentação
      const endpoint = userType === 'driver' ? '/ws/drivers/chat' : '/ws/passengers/chat';
      const wsUrl = `${WS_SCHEME}://${WS_HOST}${endpoint}?token=${encodeURIComponent(accessToken)}`;

      console.log('[ChatWebSocket] 🔌 Conectando...', { userType, endpoint });

      // Cria conexão WebSocket
      this.ws = new WebSocket(wsUrl);

      // ============================================
      // EVENT LISTENERS
      // ============================================

      this.ws.onopen = () => {
        console.log('[ChatWebSocket] ✅ Conectado com sucesso');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000; // Reset do delay
        this.onConnectionStateChange?.(true);
        
        // Inicia heartbeat (OBRIGATÓRIO a cada 30s)
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: ChatServerMessage = JSON.parse(event.data);
          
          console.log('[ChatWebSocket] 📨 Mensagem recebida:', message.type, message);
          
          this.handleServerMessage(message);
        } catch (error) {
          console.error('[ChatWebSocket] ❌ Erro ao parsear mensagem:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[ChatWebSocket] ❌ Erro de conexão:', error);
        this.onError?.(error);
      };

      this.ws.onclose = (event) => {
        console.log('[ChatWebSocket] 🔌 Conexão fechada', { code: event.code, reason: event.reason });
        this.isConnected = false;
        this.onConnectionStateChange?.(false);
        this.stopHeartbeat();

        // Reconecta automaticamente se não foi fechamento intencional (código 1000)
        if (event.code !== 1000 && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.scheduleReconnect();
        }
      };

      return true;
    } catch (error) {
      console.error('[ChatWebSocket] ❌ Erro ao conectar:', error);
      this.onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Agenda reconexão com Exponential Backoff
   * Delay: 1s → 2s → 4s → 8s → ... → max 60s
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.MAX_RECONNECT_DELAY_MS
    );

    console.log(
      `[ChatWebSocket] 🔄 Reconectando em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`
    );

    this.reconnectTimeout = setTimeout(() => {
      if (this.userType) {
        this.connect(this.userType);
      }
    }, delay);
  }

  /**
   * Processa mensagens recebidas do servidor
   */
  private handleServerMessage(message: ChatServerMessage): void {
    // Notifica todos os callbacks registrados
    this.messageCallbacks.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error('[ChatWebSocket] ❌ Erro ao executar callback:', error);
      }
    });
  }

  // ============================================
  // HEARTBEAT (OBRIGATÓRIO a cada 30s)
  // ============================================

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    // Envia heartbeat a cada 30 segundos
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL_MS);
    
    console.log('[ChatWebSocket] 💓 Heartbeat iniciado (30s)');
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private sendHeartbeat(): void {
    const message: HeartbeatClient = { type: 'heartbeat' };
    this.send(message, true); // bypass rate limit for heartbeat
  }

  // ============================================
  // RATE LIMITING (proteção local)
  // ============================================

  private checkRateLimit(): boolean {
    const now = Date.now();

    // Reset burst counter após 1 segundo
    if (now - this.messageBurstResetTime >= 1000) {
      this.messageBurstCount = 0;
      this.messageBurstResetTime = now;
    }

    // Reset minute counter após 1 minuto
    if (now - this.messageMinuteResetTime >= 60000) {
      this.messageMinuteCount = 0;
      this.messageMinuteResetTime = now;
    }

    // Verifica limites
    if (this.messageBurstCount >= this.MAX_BURST_MESSAGES) {
      console.warn('[ChatWebSocket] ⚠️ Rate limit: máximo de 10 mensagens/segundo atingido');
      return false;
    }

    if (this.messageMinuteCount >= this.MAX_MINUTE_MESSAGES) {
      console.warn('[ChatWebSocket] ⚠️ Rate limit: máximo de 30 mensagens/minuto atingido');
      return false;
    }

    return true;
  }

  private incrementRateCounters(): void {
    this.messageBurstCount++;
    this.messageMinuteCount++;
  }

  // ============================================
  // ENVIO DE MENSAGENS
  // ============================================

  /**
   * Envia uma mensagem para o servidor
   */
  private send(message: ChatClientMessage, bypassRateLimit: boolean = false): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Verifica rate limit (exceto para heartbeat)
      if (!bypassRateLimit && !this.checkRateLimit()) {
        return false;
      }

      try {
        const messageString = JSON.stringify(message);
        
        if (message.type !== 'heartbeat') {
          console.log('[ChatWebSocket] 📤 Enviando:', message.type, message);
        }
        
        this.ws.send(messageString);
        
        if (!bypassRateLimit) {
          this.incrementRateCounters();
        }
        
        return true;
      } catch (error) {
        console.error('[ChatWebSocket] ❌ Erro ao enviar mensagem:', error);
        this.onError?.(error instanceof Error ? error : new Error(String(error)));
        return false;
      }
    } else {
      console.warn('[ChatWebSocket] ⚠️ WebSocket não está conectado. Estado:', this.ws?.readyState);
      return false;
    }
  }

  /**
   * Envia uma mensagem de chat
   * @param rideId - ID da corrida (OBRIGATÓRIO)
   * @param content - Conteúdo da mensagem (texto)
   */
  sendMessage(rideId: string, content: string): boolean {
    // Validação rigorosa do rideId
    if (!rideId || rideId.trim() === '') {
      console.error('[ChatWebSocket] ❌ ERRO: rideId é obrigatório para enviar mensagem!', { rideId });
      return false;
    }

    if (!content || content.trim() === '') {
      console.warn('[ChatWebSocket] ⚠️ Conteúdo da mensagem é obrigatório');
      return false;
    }

    const trimmedRideId = rideId.trim();
    const trimmedContent = content.trim();

    console.log('[ChatWebSocket] 📝 Preparando mensagem:', { 
      rideId: trimmedRideId, 
      contentLength: trimmedContent.length,
      wsConnected: this.isConnected,
      wsState: this.ws?.readyState
    });

    // Formato conforme documentação oficial: { type, data: { rideId, content } }
    const message: ChatMessageClient = {
      type: 'chat_message',
      data: {
        rideId: trimmedRideId,
        content: trimmedContent,
      },
    };

    return this.send(message);
  }

  /**
   * Marca mensagens como lidas
   * @param rideId - ID da corrida (OBRIGATÓRIO)
   * @param messageIds - Array de IDs das mensagens
   */
  markAsRead(rideId: string, messageIds: string[]): boolean {
    // Validação rigorosa do rideId
    if (!rideId || rideId.trim() === '') {
      console.error('[ChatWebSocket] ❌ ERRO: rideId é obrigatório para marcar como lido!', { 
        rideId,
        rideIdType: typeof rideId,
        rideIdLength: rideId?.length,
      });
      return false;
    }

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      console.warn('[ChatWebSocket] ⚠️ Nenhuma mensagem para marcar como lida');
      return false;
    }

    const trimmedRideId = rideId.trim();

    // Validação adicional após trim
    if (!trimmedRideId || trimmedRideId.length === 0) {
      console.error('[ChatWebSocket] ❌ ERRO: rideId está vazio após trim!', { 
        originalRideId: rideId,
        trimmedRideId,
      });
      return false;
    }

    console.log('[ChatWebSocket] 📝 Marcando como lidas:', { 
      rideId: trimmedRideId, 
      messageCount: messageIds.length,
      messageIds: messageIds.slice(0, 3), // Log apenas os primeiros 3 IDs
    });

    // Formato conforme documentação oficial: { type, data: { rideId, messageIds } }
    const message: MarkReadClient = {
      type: 'mark_read',
      data: {
        rideId: trimmedRideId,
        messageIds: messageIds,
      },
    };

    console.log('[ChatWebSocket] 📤 Mensagem completa a ser enviada:', JSON.stringify(message, null, 2));

    return this.send(message);
  }

  // ============================================
  // CONTROLE DE CONEXÃO
  // ============================================

  /**
   * Desconecta do WebSocket
   */
  disconnect(): void {
    console.log('[ChatWebSocket] 🔌 Desconectando...');

    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      // Fecha com código 1000 (fechamento normal)
      this.ws.close(1000, 'Desconexão intencional');
      this.ws = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.onConnectionStateChange?.(false);
  }

  /**
   * Verifica se está conectado
   */
  getIsConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Obtém o estado atual do WebSocket
   */
  getConnectionState(): { isConnected: boolean; readyState: number | null; userType: string | null } {
    return {
      isConnected: this.isConnected,
      readyState: this.ws?.readyState ?? null,
      userType: this.userType,
    };
  }

  /**
   * Força reconexão
   */
  async reconnect(): Promise<boolean> {
    this.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    if (this.userType) {
      return this.connect(this.userType);
    }
    return false;
  }

  /**
   * Atualiza token (após refresh)
   */
  updateAuthToken(): void {
    console.log('[ChatWebSocket] 🔑 Token atualizado, reconectando...');
    this.reconnect();
  }

  // ============================================
  // CALLBACKS
  // ============================================

  /**
   * Registra callback para mensagens recebidas
   */
  setOnMessage(callback: ChatMessageCallback | null): void {
    if (callback) {
      if (!this.messageCallbacks.includes(callback)) {
        this.messageCallbacks.push(callback);
      }
    } else {
      this.messageCallbacks = [];
    }
  }

  /**
   * Remove um callback específico
   */
  removeOnMessage(callback: ChatMessageCallback): void {
    this.messageCallbacks = this.messageCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * Registra callback para mudança de estado de conexão
   */
  setOnConnectionStateChange(callback: ConnectionStateCallback | null): void {
    this.onConnectionStateChange = callback;
  }

  /**
   * Registra callback para erros
   */
  setOnError(callback: ErrorCallback | null): void {
    this.onError = callback;
  }
}

// Exporta instância singleton
export const chatWebSocketService = new ChatWebSocketService();
