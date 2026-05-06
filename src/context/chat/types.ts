import type { MutableRefObject } from 'react';
import type { ChatDeliveryStatus } from '@/services/websocket';

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
  rideStatus?: string;
  isChatAvailable: boolean;
}

export interface ChatContextType {
  chatState: ChatState;
  isChatOpen: boolean;
  currentRideId: string | null;
  openChat: (
    rideId: string,
    otherUserName?: string,
    otherUserPhoto?: string,
    rideStatus?: string,
    otherUserId?: string
  ) => void | Promise<void>;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<boolean>;
  markAsRead: (messageIds: string[], rideIdOverride?: string) => void;
  loadMoreMessages: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  updateRideStatus: (status: string) => void;
  connectChat: () => void;
  disconnectChat: () => void;
}

export interface ChatRefs {
  currentRideIdRef: MutableRefObject<string | null>;
  rideStatusRef: MutableRefObject<string | undefined>;
  isChatAvailableRef: MutableRefObject<boolean>;
}
