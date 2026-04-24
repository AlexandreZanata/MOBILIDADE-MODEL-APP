/**
 * Serviço de WebSocket para passageiros
 * Seguindo a documentação WebSocket_cliente.txt
 * Endpoint: ws://host:port/ws/passengers?token=<JWT_TOKEN>
 */

import { apiService } from './api';

// Configurações do WebSocket
// Novo domínio: https://vamu.joaoflavio.com
const WS_HOST = 'vamu.joaoflavio.com';
const WS_SCHEME = 'wss'; // wss para HTTPS

// Tipos de mensagens enviadas pelo cliente (passageiro)
export type PassengerClientMessageType = 'location_update' | 'heartbeat';

// Tipos de mensagens recebidas do servidor (passageiro)
export type PassengerServerMessageType = 
  | 'connected' 
  | 'location_updated' 
  | 'pong' 
  | 'ride_driver_accepted'
  | 'ride_driver_on_the_way'
  | 'ride_driver_nearby'
  | 'ride_driver_arrived'
  | 'ride_status_update'
  | 'ride_cancelled'
  | 'error';

// Mensagem de atualização de localização
export interface PassengerLocationUpdateMessage {
  type: 'location_update';
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}

// Mensagem de heartbeat
export interface PassengerHeartbeatMessage {
  type: 'heartbeat';
}

// Tipo união para mensagens do cliente (passageiro)
export type PassengerClientMessage = PassengerLocationUpdateMessage | PassengerHeartbeatMessage;

// Mensagem de conexão estabelecida
export interface PassengerConnectedMessage {
  type: 'connected';
  message: string;
}

// Mensagem de confirmação de localização
export interface PassengerLocationUpdatedMessage {
  type: 'location_updated';
  message: string;
}

// Mensagem de pong (resposta ao heartbeat)
export interface PassengerPongMessage {
  type: 'pong';
  message: string;
}

// Mensagem de motorista aceitou corrida
export interface RideDriverAcceptedMessage {
  type: 'ride_driver_accepted';
  rideId: string;
  message: string;
  data: {
    driverId: string;
    status: string;
    driver?: {
      id: string;
      name: string;
      rating?: number;
      vehicle?: {
        licensePlate?: string;
        plate?: string;
        brand?: string;
        model?: string;
        color?: string;
      };
    };
  };
}

// Mensagem de motorista a caminho
export interface RideDriverOnTheWayMessage {
  type: 'ride_driver_on_the_way';
  rideId: string;
  message: string;
  data: {
    driverId: string;
    status: string;
  };
}

// Mensagem de motorista próximo
export interface RideDriverNearbyMessage {
  type: 'ride_driver_nearby';
  rideId: string;
  message: string;
  data: {
    driverId: string;
    status: string;
  };
}

// Mensagem de motorista chegou
export interface RideDriverArrivedMessage {
  type: 'ride_driver_arrived';
  rideId: string;
  message: string;
  data: {
    driverId: string;
    status: string;
  };
}

// Mensagem de atualização de status
export interface RideStatusUpdateMessage {
  type: 'ride_status_update';
  rideId: string;
  message: string;
  data: {
    status: string;
    driverId: string;
  };
}

// Mensagem de corrida cancelada
export interface RideCancelledMessage {
  type: 'ride_cancelled';
  rideId: string;
  message: string;
  data: {
    status: string;
    cancelledBy: string;
    cancellationReason?: string;
  };
}

// Mensagem de erro
export interface PassengerErrorMessage {
  type: 'error';
  message: string;
}

// Tipo união para mensagens do servidor (passageiro)
export type PassengerServerMessage = 
  | PassengerConnectedMessage 
  | PassengerLocationUpdatedMessage 
  | PassengerPongMessage
  | RideDriverAcceptedMessage
  | RideDriverOnTheWayMessage
  | RideDriverNearbyMessage
  | RideDriverArrivedMessage
  | RideStatusUpdateMessage
  | RideCancelledMessage
  | PassengerErrorMessage;

// Callbacks
type PassengerMessageCallback = (message: PassengerServerMessage) => void;
type PassengerConnectionStateCallback = (connected: boolean) => void;
type PassengerErrorCallback = (error: Error | Event) => void;

class PassengerWebSocketService {
  private ws: WebSocket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private locationUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // 1 segundo inicial
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  // Callbacks
  private onMessage: PassengerMessageCallback | null = null;
  private onConnectionStateChange: PassengerConnectionStateCallback | null = null;
  private onError: PassengerErrorCallback | null = null;

  // Configurações de intervalos (conforme documentação)
  private readonly HEARTBEAT_INTERVAL_MS = 10000; // 10 segundos
  private readonly LOCATION_UPDATE_INTERVAL_MS = 3000; // 3 segundos (conforme documentação: 2-5s)

  /**
   * Conecta ao WebSocket do servidor
   * Endpoint: ws://host:port/ws/passengers?token=<JWT_TOKEN>
   */
  async connect(): Promise<boolean> {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      console.log('[PassengerWebSocket] Já conectado');
      return true;
    }

    // Desconecta se já estiver conectado
    if (this.ws) {
      this.disconnect();
    }

    try {
      const accessToken = apiService.getAccessToken();
      if (!accessToken) {
        console.error('[PassengerWebSocket] Token de acesso não disponível');
        return false;
      }

      // Constrói a URL do WebSocket
      const wsUrl = `${WS_SCHEME}://${WS_HOST}/ws/passengers?token=${encodeURIComponent(accessToken)}`;
      
      console.log('[PassengerWebSocket] Conectando...', { 
        url: wsUrl.replace(accessToken, '***'),
        scheme: WS_SCHEME,
        host: WS_HOST,
        fullUrl: wsUrl.replace(accessToken, '***')
      });

      // Cria conexão WebSocket
      this.ws = new WebSocket(wsUrl);

      // Event listeners
      this.ws.onopen = () => {
        console.log('[PassengerWebSocket] Conectado com sucesso');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.onConnectionStateChange?.(true);
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: PassengerServerMessage = JSON.parse(event.data);
          console.log('[PassengerWebSocket] Mensagem recebida:', message);
          this.handleServerMessage(message);
        } catch (error) {
          console.error('[PassengerWebSocket] Erro ao parsear mensagem:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[PassengerWebSocket] Erro de conexão:', error);
        this.onError?.(error);
      };

      this.ws.onclose = (event) => {
        console.log('[PassengerWebSocket] Conexão fechada', { code: event.code, reason: event.reason });
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
      console.error('[PassengerWebSocket] Erro ao conectar:', error);
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

    console.log(`[PassengerWebSocket] Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Processa mensagens recebidas do servidor
   */
  private handleServerMessage(message: PassengerServerMessage): void {
    switch (message.type) {
      case 'connected':
        console.log('[PassengerWebSocket] Conexão estabelecida:', message.message);
        break;
      case 'location_updated':
        console.log('[PassengerWebSocket] Localização atualizada:', message.message);
        break;
      case 'pong':
        console.log('[PassengerWebSocket] Heartbeat confirmado:', message.message);
        break;
      case 'ride_driver_accepted':
        console.log('[PassengerWebSocket] Motorista aceitou corrida:', message);
        break;
      case 'ride_driver_on_the_way':
        console.log('[PassengerWebSocket] Motorista a caminho:', message);
        break;
      case 'ride_driver_nearby':
        console.log('[PassengerWebSocket] Motorista próximo:', message);
        break;
      case 'ride_driver_arrived':
        console.log('[PassengerWebSocket] Motorista chegou:', message);
        break;
      case 'ride_status_update':
        console.log('[PassengerWebSocket] Status atualizado:', message);
        break;
      case 'ride_cancelled':
        console.log('[PassengerWebSocket] Corrida cancelada:', message);
        break;
      case 'error':
        console.error('[PassengerWebSocket] Erro do servidor:', message.message);
        break;
    }

    // Chama callback genérico
    this.onMessage?.(message);
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
    const message: PassengerHeartbeatMessage = { type: 'heartbeat' };
    this.send(message);
  }

  /**
   * Inicia o envio periódico de atualizações de localização
   * A localização deve ser fornecida externamente via sendLocationUpdate()
   */
  startLocationUpdates(): void {
    this.stopLocationUpdates();
    console.log('[PassengerWebSocket] Atualizações de localização iniciadas');
  }

  /**
   * Para o envio de atualizações de localização
   */
  stopLocationUpdates(): void {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
  }

  /**
   * Envia atualização de localização
   */
  sendLocationUpdate(message: PassengerLocationUpdateMessage): void {
    this.send(message);
  }

  /**
   * Envia uma mensagem para o servidor
   */
  private send(message: PassengerClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[PassengerWebSocket] Erro ao enviar mensagem:', error);
        this.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    } else {
      console.warn('[PassengerWebSocket] WebSocket não está aberto, mensagem não enviada:', message);
    }
  }

  /**
   * Desconecta do WebSocket
   */
  disconnect(): void {
    console.log('[PassengerWebSocket] Desconectando...');

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
    console.log('[PassengerWebSocket] Token atualizado, reconectando...');
    this.reconnect();
  }

  /**
   * Define callback para mensagens recebidas
   */
  setOnMessage(callback: PassengerMessageCallback | null): void {
    this.onMessage = callback;
  }

  /**
   * Define callback para mudança de estado de conexão
   */
  setOnConnectionStateChange(callback: PassengerConnectionStateCallback | null): void {
    this.onConnectionStateChange = callback;
  }

  /**
   * Define callback para erros
   */
  setOnError(callback: PassengerErrorCallback | null): void {
    this.onError = callback;
  }
}

// Exporta instância singleton
export const passengerWebSocketService = new PassengerWebSocketService();

