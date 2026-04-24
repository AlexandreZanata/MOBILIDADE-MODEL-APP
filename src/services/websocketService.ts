/**
 * Serviço de WebSocket para rastreamento de motoristas
 * Seguindo a documentação WebSocket.txt
 * Endpoint: ws://host:port/ws/drivers?token=<JWT_TOKEN>
 */

import { apiService } from './api';

// Configurações do WebSocket
// Novo domínio: https://vamu.joaoflavio.com
const WS_HOST = 'vamu.joaoflavio.com';
const WS_SCHEME = 'wss'; // wss para HTTPS

// Tipos de mensagens enviadas pelo cliente
export type ClientMessageType = 'location_update' | 'heartbeat' | 'status_update';

// Tipos de mensagens recebidas do servidor
export type ServerMessageType = 
  | 'connected' 
  | 'location_update' 
  | 'pong' 
  | 'status_updated' 
  | 'passenger_location'
  | 'ride_offer'
  | 'ride_accepted'
  | 'ride_rejected'
  | 'active_ride'
  | 'error';

// Status operacional do motorista
export type OperationalStatus = 'AVAILABLE' | 'BUSY' | 'PAUSED' | 'OFFLINE';

// Mensagem de atualização de localização
export interface LocationUpdateMessage {
  type: 'location_update';
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}

// Mensagem de heartbeat
export interface HeartbeatMessage {
  type: 'heartbeat';
}

// Mensagem de atualização de status
export interface StatusUpdateMessage {
  type: 'status_update';
  status: OperationalStatus;
}

// Mensagem de resposta de oferta de corrida
export interface RideResponseMessage {
  type: 'ride_response';
  rideId: string;
  action: 'accept' | 'reject';
}

// Tipo união para mensagens do cliente
export type ClientMessage = LocationUpdateMessage | HeartbeatMessage | StatusUpdateMessage | RideResponseMessage;

// Mensagem de conexão estabelecida
export interface ConnectedMessage {
  type: 'connected';
  message: string;
}

// Mensagem de confirmação de localização
export interface LocationUpdatedMessage {
  type: 'location_update';
  message: string;
}

// Mensagem de pong (resposta ao heartbeat)
export interface PongMessage {
  type: 'pong';
  message: string;
}

// Mensagem de status atualizado
export interface StatusUpdatedMessage {
  type: 'status_updated';
  message: string;
}

// Mensagem de erro
export interface ErrorMessage {
  type: 'error';
  message: string;
}

// Mensagem de localização do passageiro
export interface PassengerLocationMessage {
  type: 'passenger_location';
  rideId: string;
  passengerId: string;
  lat: number;
  lng: number;
}

// Mensagem de oferta de corrida (novo formato)
export interface RideOfferMessage {
  type: 'ride_offer';
  trip_id: string;
  origin: {
    lat: number;
    lng: number;
  };
  destination: {
    lat: number;
    lng: number;
  };
  estimated_fare: number;
  distance_km: number;
  duration_seconds: number;
  eta_to_pickup_minutes: number;
  assignment_expires_at: string; // ISO timestamp
  passenger: {
    id: string;
    name: string;
    photoUrl?: string;
    rating: number;
  };
  payment_method: string | null; // "dinheiro", "credito", "debito", etc.
  payment_brand: string | null; // "visa", "mastercard", "amex", etc.
}

// Mensagem de corrida aceita
export interface RideAcceptedMessage {
  type: 'ride_accepted';
  message: string;
}

// Mensagem de corrida recusada
export interface RideRejectedMessage {
  type: 'ride_rejected';
  message: string;
}

// Mensagem de corrida ativa (enviada após reconexão)
export interface ActiveRideMessage {
  type: 'active_ride';
  rideId: string;
  passengerId: string;
  status: string;
  estimatedPrice: number;
  finalPrice: number | null;
  distanceKm: number;
  durationMinutes: number;
  surge: number;
  requestedAt: string;
  passenger: {
    id: string;
    name: string;
    rating: number;
  };
  passengerLocation: {
    lat: number;
    lng: number;
  } | null;
}

// Tipo união para mensagens do servidor
export type ServerMessage = 
  | ConnectedMessage 
  | LocationUpdatedMessage 
  | PongMessage 
  | StatusUpdatedMessage 
  | PassengerLocationMessage
  | RideOfferMessage
  | RideAcceptedMessage
  | RideRejectedMessage
  | ActiveRideMessage
  | ErrorMessage;

// Callbacks
type MessageCallback = (message: ServerMessage) => void;
type ConnectionStateCallback = (connected: boolean) => void;
type ErrorCallback = (error: Error | Event) => void;

class DriverWebSocketService {
  private ws: WebSocket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private locationUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // 1 segundo inicial
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  // Callbacks
  private onMessage: MessageCallback | null = null;
  private onConnectionStateChange: ConnectionStateCallback | null = null;
  private onError: ErrorCallback | null = null;
  private messageCallbacks: MessageCallback[] = []; // Array para múltiplos callbacks

  // Configurações de intervalos (conforme documentação)
  private readonly HEARTBEAT_INTERVAL_MS = 10000; // 10 segundos (conforme documentação)
  private readonly LOCATION_UPDATE_INTERVAL_MS = 3000; // 3 segundos (conforme documentação: 2-5s, recomendado 3s)

  /**
   * Conecta ao WebSocket do servidor
   * Endpoint: ws://host:port/ws/drivers?token=<JWT_TOKEN>
   */
  async connect(): Promise<boolean> {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      console.log('[DriverWebSocket] Já conectado');
      return true;
    }

    // Desconecta se já estiver conectado
    if (this.ws) {
      this.disconnect();
    }

    try {
      const accessToken = apiService.getAccessToken();
      if (!accessToken) {
        console.error('[DriverWebSocket] Token de acesso não disponível');
        return false;
      }

      // Constrói a URL do WebSocket
      const wsUrl = `${WS_SCHEME}://${WS_HOST}/ws/drivers?token=${encodeURIComponent(accessToken)}`;
      
      console.log('[DriverWebSocket] Conectando...', { url: wsUrl.replace(accessToken, '***') });

      // Cria conexão WebSocket
      this.ws = new WebSocket(wsUrl);

      // Event listeners
      this.ws.onopen = () => {
        console.log('[DriverWebSocket] Conectado com sucesso');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.onConnectionStateChange?.(true);
        this.startHeartbeat();
        this.startLocationUpdates();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          console.log('[DriverWebSocket] Mensagem recebida:', message);
          this.handleServerMessage(message);
        } catch (error) {
          console.error('[DriverWebSocket] Erro ao parsear mensagem:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[DriverWebSocket] Erro de conexão:', error);
        this.onError?.(error);
      };

      this.ws.onclose = (event) => {
        console.log('[DriverWebSocket] Conexão fechada', { code: event.code, reason: event.reason });
        this.isConnected = false;
        this.onConnectionStateChange?.(false);
        this.stopHeartbeat();
        this.stopLocationUpdates();

        // Tenta reconectar se não foi um fechamento intencional
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      return true;
    } catch (error) {
      console.error('[DriverWebSocket] Erro ao conectar:', error);
      this.onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Agenda uma tentativa de reconexão
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30s

    console.log(`[DriverWebSocket] Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Processa mensagens recebidas do servidor
   */
  private handleServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'connected':
        console.log('[DriverWebSocket] Conexão estabelecida:', message.message);
        break;
      case 'location_update':
        console.log('[DriverWebSocket] Localização atualizada:', message.message);
        break;
      case 'pong':
        console.log('[DriverWebSocket] Heartbeat confirmado:', message.message);
        break;
      case 'status_updated':
        console.log('[DriverWebSocket] Status atualizado:', message.message);
        break;
      case 'passenger_location':
        console.log('[DriverWebSocket] Localização do passageiro recebida:', message);
        break;
      case 'ride_offer':
        console.log('[DriverWebSocket] Oferta de corrida recebida:', message);
        break;
      case 'ride_accepted':
        console.log('[DriverWebSocket] Corrida aceita:', message.message);
        break;
      case 'ride_rejected':
        console.log('[DriverWebSocket] Corrida recusada:', message.message);
        break;
      case 'active_ride':
        console.log('[DriverWebSocket] Corrida ativa recebida após reconexão:', message);
        break;
      case 'error':
        console.error('[DriverWebSocket] Erro do servidor:', message.message);
        break;
    }

    // Chama todos os callbacks registrados
    console.log(`[DriverWebSocket] Executando ${this.messageCallbacks.length} callbacks registrados para mensagem tipo: ${message.type}`);
    this.messageCallbacks.forEach((callback, index) => {
      try {
        console.log(`[DriverWebSocket] Executando callback ${index + 1}/${this.messageCallbacks.length}`);
        callback(message);
      } catch (error) {
        console.error('[DriverWebSocket] Erro ao executar callback:', error);
      }
    });
    
    // Mantém compatibilidade com callback único (último registrado)
    if (this.onMessage) {
      console.log('[DriverWebSocket] Executando callback único (compatibilidade)');
      this.onMessage(message);
    }
  }

  /**
   * Inicia o envio periódico de heartbeat
   * Recomendado: a cada 10 segundos
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Para o envio de heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Envia mensagem de heartbeat
   */
  private sendHeartbeat(): void {
    const message: HeartbeatMessage = { type: 'heartbeat' };
    this.send(message);
  }

  /**
   * Inicia o envio periódico de atualizações de localização
   * Recomendado: a cada 2-5 segundos
   * 
   * Nota: A localização deve ser fornecida externamente via sendLocationUpdate()
   * pois React Native usa expo-location que precisa ser importado no componente
   */
  private startLocationUpdates(): void {
    this.stopLocationUpdates();
    // A localização será enviada externamente via sendLocationUpdate()
    // quando o componente tiver acesso ao expo-location
    console.log('[DriverWebSocket] Atualizações de localização devem ser enviadas via sendLocationUpdate()');
  }

  /**
   * Para o envio de atualizações de localização
   */
  private stopLocationUpdates(): void {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
  }

  /**
   * Envia atualização de localização
   */
  sendLocationUpdate(message: LocationUpdateMessage): void {
    this.send(message);
  }

  /**
   * Atualiza o status operacional do motorista
   */
  updateStatus(status: OperationalStatus): void {
    const message: StatusUpdateMessage = {
      type: 'status_update',
      status,
    };
    this.send(message);
  }

  /**
   * Responde a uma oferta de corrida (aceitar ou recusar)
   * Aceita tanto trip_id (novo formato) quanto rideId (compatibilidade)
   */
  respondToRideOffer(tripId: string, action: 'accept' | 'reject'): void {
    const message: RideResponseMessage = {
      type: 'ride_response',
      rideId: tripId, // Backend espera rideId na mensagem de resposta
      action,
    };
    console.log('[DriverWebSocket] Enviando resposta de corrida:', JSON.stringify(message));
    this.send(message);
  }

  /**
   * Envia uma mensagem para o servidor
   */
  private send(message: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const messageString = JSON.stringify(message);
        console.log('[DriverWebSocket] Enviando mensagem para servidor:', messageString);
        console.log('[DriverWebSocket] Tipo da mensagem:', message.type);
        this.ws.send(messageString);
      } catch (error) {
        console.error('[DriverWebSocket] Erro ao enviar mensagem:', error);
        this.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    } else {
      console.warn('[DriverWebSocket] WebSocket não está aberto, mensagem não enviada:', message);
      console.warn('[DriverWebSocket] Estado do WebSocket:', {
        ws: !!this.ws,
        readyState: this.ws?.readyState,
        OPEN: WebSocket.OPEN,
        isConnected: this.isConnected,
      });
    }
  }

  /**
   * Desconecta do WebSocket
   */
  disconnect(): void {
    console.log('[DriverWebSocket] Desconectando...');

    this.stopHeartbeat();
    this.stopLocationUpdates();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      // Fecha intencionalmente (código 1000)
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
   * Reconecta ao WebSocket
   */
  async reconnect(): Promise<boolean> {
    this.disconnect();
    // Aguarda um pouco antes de reconectar
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.connect();
  }

  /**
   * Atualiza o token de autenticação (após refresh)
   */
  updateAuthToken(): void {
    console.log('[DriverWebSocket] Token atualizado, reconectando...');
    this.reconnect();
  }

  /**
   * Define callback para mensagens recebidas
   * Permite múltiplos callbacks usando um array interno
   */
  setOnMessage(callback: MessageCallback | null): void {
    if (callback) {
      // Se já existe um callback, adiciona à lista ao invés de substituir
      // Isso permite que múltiplos componentes escutem as mesmas mensagens
      if (!this.messageCallbacks.includes(callback)) {
        console.log(`[DriverWebSocket] Adicionando novo callback. Total de callbacks: ${this.messageCallbacks.length + 1}`);
        this.messageCallbacks.push(callback);
      } else {
        console.log(`[DriverWebSocket] Callback já existe na lista. Total de callbacks: ${this.messageCallbacks.length}`);
      }
      // Mantém compatibilidade com código antigo
      this.onMessage = callback;
    } else {
      // Se callback é null, limpa tudo
      console.log('[DriverWebSocket] Limpando todos os callbacks');
      this.messageCallbacks = [];
      this.onMessage = null;
    }
  }
  
  /**
   * Remove um callback específico da lista
   */
  removeOnMessage(callback: MessageCallback): void {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    if (this.onMessage === callback) {
      this.onMessage = this.messageCallbacks.length > 0 ? this.messageCallbacks[this.messageCallbacks.length - 1] : null;
    }
  }

  /**
   * Define callback para mudança de estado de conexão
   */
  setOnConnectionStateChange(callback: ConnectionStateCallback | null): void {
    this.onConnectionStateChange = callback;
  }

  /**
   * Define callback para erros
   */
  setOnError(callback: ErrorCallback | null): void {
    this.onError = callback;
  }

  /**
   * Para atualizações automáticas de localização (útil quando motorista está offline)
   */
  pauseLocationUpdates(): void {
    this.stopLocationUpdates();
  }

  /**
   * Retoma atualizações automáticas de localização
   */
  resumeLocationUpdates(): void {
    if (this.isConnected) {
      this.startLocationUpdates();
    }
  }
}

// Exporta instância singleton
export const websocketService = new DriverWebSocketService();

// Exporta tipos para compatibilidade (se necessário)
export type TripStatus = 
  | 'REQUESTED'
  | 'DRIVER_ASSIGNED'
  | 'MOTORISTA_ACEITOU'
  | 'AGUARDANDO_MOTORISTA'
  | 'MOTORISTA_ENCONTRADO'
  | 'DRIVER_ON_THE_WAY'
  | 'MOTORISTA_A_CAMINHO'
  | 'DRIVER_NEARBY'
  | 'MOTORISTA_PROXIMO'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED'
  | 'MOTORISTA_CHEGOU'
  | 'PASSENGER_BOARDED'
  | 'PASSAGEIRO_EMBARCADO'
  | 'IN_ROUTE'
  | 'EM_ROTA'
  | 'NEAR_DESTINATION'
  | 'PROXIMO_DESTINO'
  | 'IN_PROGRESS'
  | 'WAITING_AT_DESTINATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CANCELED_BY_DRIVER'
  | 'CANCELED_BY_PASSENGER'
  | 'CANCELADA_PASSAGEIRO'
  | 'CANCELADA_MOTORISTA'
  | 'CANCELADA_ADMIN'
  | 'NO_SHOW'
  | 'EXPIRED';

// Interfaces vazias para compatibilidade (se necessário)
export interface TripAssignedPayload {
  trip_id: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  estimated_fare: number;
  assignment_expires_at: string;
  category?: {
    id: string;
    name: string;
  };
  requested_at: string;
  passenger?: {
    id: string;
    name: string;
    rating?: number;
    phone?: string;
  };
  distance_km?: number;
  duration_seconds?: number;
}

export interface TripStatusChangedPayload {
  trip_id: string;
  status: TripStatus;
  driver_id?: string;
  passenger_id?: string;
  timestamps?: {
    requested_at?: string;
    accepted_at?: string;
    arrived_at?: string;
    started_at?: string;
    completed_at?: string;
    cancelled_at?: string;
  };
  driver_snapshot?: {
    name: string;
    rating?: number;
    vehicle?: {
      brand: string;
      model: string;
      plate: string;
      color: string;
    };
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export interface DriverLocationUpdatePayload {
  driver_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}
