export interface ChatMessageData {
  id: string;
  rideId: string;
  senderId: string;
  recipientId: string;
  content: string;
  deliveryStatus: 'SENDING' | 'DELIVERED' | 'READ' | 'FAILED';
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface ChatMessagesResponse {
  items: ChatMessageData[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface ChatPollResponse {
  items: ChatMessageData[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface UserOnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface UnreadCountResponse {
  rideId?: string;
  unreadCount: number;
}
