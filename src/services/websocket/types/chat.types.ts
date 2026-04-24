/**
 * @file chat.types.ts
 * @description Typed message contracts for the Chat WebSocket connection.
 * Endpoints:
 *   Driver:    wss://vamu.joaoflavio.com/ws/drivers/chat?token=<JWT>
 *   Passenger: wss://vamu.joaoflavio.com/ws/passengers/chat?token=<JWT>
 */

// ─── Delivery status ──────────────────────────────────────────────────────────

/** Message delivery lifecycle states. */
export type ChatDeliveryStatus = 'SENDING' | 'DELIVERED' | 'READ' | 'FAILED';

// ─── Client → Server ─────────────────────────────────────────────────────────

export interface ChatSendMessageClient {
  type: 'chat_message';
  data: {
    rideId: string;
    content: string;
  };
}

export interface ChatMarkReadClient {
  type: 'mark_read';
  data: {
    rideId: string;
    messageIds: string[];
  };
}

export interface ChatHeartbeatClient {
  type: 'heartbeat';
}

/** Discriminated union of all client → server messages for the chat channel. */
export type ChatClientMessage =
  | ChatSendMessageClient
  | ChatMarkReadClient
  | ChatHeartbeatClient;

// ─── Server → Client ─────────────────────────────────────────────────────────

export interface ChatMessageServer {
  type: 'chat_message';
  data: {
    id: string;
    rideId: string;
    senderId: string;
    recipientId: string;
    content: string;
    deliveryStatus: ChatDeliveryStatus;
    deliveredAt?: string;
    createdAt: string;
  };
}

export interface ChatDeliveryConfirmedServer {
  type: 'delivery_confirmed';
  data: {
    messageId: string;
    deliveryStatus: 'DELIVERED';
    deliveredAt: string;
  };
}

export interface ChatReadConfirmedServer {
  type: 'read_confirmed';
  data: {
    messageId: string;
    readAt: string;
  };
}

export interface ChatUnreadCountServer {
  type: 'unread_count';
  data: {
    rideId: string;
    unreadCount: number;
  };
}

export interface ChatUserOnlineStatusServer {
  type: 'user_online_status';
  data: {
    userId: string;
    isOnline: boolean;
    lastSeenAt: string;
  };
}

export interface ChatPongServer {
  type: 'pong';
  data?: Record<string, unknown>;
}

export interface ChatErrorServer {
  type: 'error';
  data: {
    message: string;
    code?: string;
  };
}

/** Discriminated union of all server → client messages for the chat channel. */
export type ChatServerMessage =
  | ChatMessageServer
  | ChatDeliveryConfirmedServer
  | ChatReadConfirmedServer
  | ChatUnreadCountServer
  | ChatUserOnlineStatusServer
  | ChatPongServer
  | ChatErrorServer;
