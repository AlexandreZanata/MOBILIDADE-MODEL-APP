import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Vibration, type AppStateStatus } from 'react-native';
import { apiService, type ChatMessageData } from '@/services/api';
import {
  chatWebSocket,
  type ChatDeliveryConfirmedServer,
  type ChatReadConfirmedServer,
  type ChatServerMessage,
  type ChatUnreadCountServer,
  type ChatUserOnlineStatusServer,
} from '@/services/websocket';
import { fetchRideStatus } from './api';
import { initialChatState } from './constants';
import { isRideActiveForChat, toChatMessage } from './helpers';
import { runLongPolling } from './polling';
import type { UserRole } from '@/models/Auth';
import { isDriver, isPassenger } from '@/models/User';
import type { ChatContextType, ChatMessage, ChatState } from './types';

type SessionUser = { roles?: string[]; type?: string; userId?: string; id?: string };

function useUserType(user?: SessionUser | null): 'driver' | 'passenger' | null {
  if (!user) return null;
  const roleLike = { roles: (user.roles ?? []) as UserRole[], type: user.type };
  if (isDriver(roleLike)) return 'driver';
  if (isPassenger(roleLike)) return 'passenger';
  return null;
}

export function useChatProvider(isAuthenticated: boolean, user?: SessionUser | null): ChatContextType {
  const [chatState, setChatState] = useState<ChatState>(initialChatState);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const messagesCache = useRef<Map<string, ChatMessage[]>>(new Map());
  const cursorCache = useRef<Map<string, string | null>>(new Map());
  const longPollingActive = useRef(false);
  const longPollingCursor = useRef<string | undefined>(undefined);
  const currentRideIdRef = useRef<string | null>(null);
  const rideStatusRef = useRef<string | undefined>(undefined);
  const isChatAvailableRef = useRef(false);
  const userType = useUserType(user);
  const currentUserId = user?.userId || user?.id || '';
  const loadMessages = useCallback(async (rideId: string) => {
    setChatState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await apiService.getChatMessages(rideId);
      if (!response.success || !response.data) return;
      const data = response.data;
      const messages = data.items.map((item: ChatMessageData) => toChatMessage(item));
      messagesCache.current.set(rideId, messages);
      if (data.nextCursor) cursorCache.current.set(rideId, data.nextCursor);
      setChatState((prev) => ({
        ...prev,
        messages,
        hasMoreMessages: data.hasMore,
        isLoading: false,
      }));
    } finally {
      setChatState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const refreshUnreadCountForRide = useCallback(async (rideId: string) => {
    if (!rideId) return;
    const response = await apiService.getUnreadMessagesCount(rideId);
    if (response.success && response.data) {
      const unreadCount = response.data.unreadCount;
      setChatState((prev) => ({ ...prev, unreadCount }));
    }
  }, []);

  const stopLongPolling = useCallback(() => {
    longPollingActive.current = false;
  }, []);
  const startLongPolling = useCallback(async (rideId: string) => {
    if (longPollingActive.current) return;
    longPollingActive.current = true;
    await runLongPolling({
      rideId,
      isActive: longPollingActive,
      cursor: longPollingCursor,
      messagesCache,
      currentRideIdRef,
      onCurrentRideMessage: (mapped) =>
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.some((item) => item.id === mapped.id) ? prev.messages : [...prev.messages, mapped],
        })),
    });
  }, []);

  const handleWebSocketMessage = useCallback(
    (message: ChatServerMessage) => {
      if (message.type === 'chat_message') {
        const mapped = toChatMessage(message.data);
        const isMine = mapped.senderId === currentUserId;
        const cached = messagesCache.current.get(mapped.rideId) ?? [];
        if (!cached.some((item) => item.id === mapped.id)) messagesCache.current.set(mapped.rideId, [...cached, mapped]);
        setChatState((prev) => {
          if (currentRideIdRef.current !== mapped.rideId) {
            if (!isMine && Platform.OS !== 'web') Vibration.vibrate(200);
            return !isMine ? { ...prev, unreadCount: prev.unreadCount + 1 } : prev;
          }
          const exists = prev.messages.some((item) => item.id === mapped.id);
          return {
            ...prev,
            messages: exists ? prev.messages.map((item) => (item.id === mapped.id ? mapped : item)) : [...prev.messages, mapped],
            unreadCount: !isMine && !isChatOpen ? prev.unreadCount + 1 : prev.unreadCount,
          };
        });
      }
      if (message.type === 'unread_count') {
        const data = (message as ChatUnreadCountServer).data;
        setChatState((prev) => ({ ...prev, unreadCount: data.unreadCount }));
      }
      if (message.type === 'user_online_status') {
        const data = (message as ChatUserOnlineStatusServer).data;
        setChatState((prev) => ({ ...prev, isOnline: data.isOnline, lastSeenAt: data.lastSeenAt }));
      }
      if (message.type === 'delivery_confirmed' || message.type === 'read_confirmed') {
        const data = (message as ChatDeliveryConfirmedServer | ChatReadConfirmedServer).data;
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((item) =>
            item.id === data.messageId
              ? {
                  ...item,
                  deliveryStatus: message.type === 'delivery_confirmed' ? 'DELIVERED' : 'READ',
                  deliveredAt: 'deliveredAt' in data ? data.deliveredAt : item.deliveredAt,
                  readAt: 'readAt' in data ? data.readAt : item.readAt,
                }
              : item
          ),
        }));
      }
    },
    [currentUserId, isChatOpen]
  );

  useEffect(() => {
    currentRideIdRef.current = currentRideId;
    chatWebSocket.setCurrentRideId(currentRideId);
  }, [currentRideId]);

  useEffect(() => {
    rideStatusRef.current = chatState.rideStatus;
    isChatAvailableRef.current = chatState.isChatAvailable;
  }, [chatState.rideStatus, chatState.isChatAvailable]);

  useEffect(() => {
    if (!isAuthenticated || !userType) return;
    chatWebSocket.connectAs(userType);
    chatWebSocket.setOnMessage(handleWebSocketMessage);
    chatWebSocket.setOnConnectionStateChange((connected) => {
      setChatState((prev) => ({ ...prev, isConnected: connected }));
      if (connected) stopLongPolling();
      if (!connected && currentRideIdRef.current && isChatOpen) void startLongPolling(currentRideIdRef.current);
    });
    return () => {
      chatWebSocket.disconnect();
      chatWebSocket.setOnMessage(null);
      chatWebSocket.setOnConnectionStateChange(null);
      stopLongPolling();
    };
  }, [handleWebSocketMessage, isAuthenticated, isChatOpen, startLongPolling, stopLongPolling, userType]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isAuthenticated && userType && !chatWebSocket.isConnected) chatWebSocket.connectAs(userType);
        if (currentRideIdRef.current) void refreshUnreadCountForRide(currentRideIdRef.current);
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isAuthenticated, refreshUnreadCountForRide, userType]);

  const openChat: ChatContextType['openChat'] = useCallback(async (rideId, otherUserName, otherUserPhoto, rideStatus, otherUserId) => {
    if (!rideId?.trim()) return;
    const trimmedRideId = rideId.trim();
    const status = rideStatus ?? (await fetchRideStatus(trimmedRideId));
    const available = isRideActiveForChat(status);
    setCurrentRideId(trimmedRideId);
    currentRideIdRef.current = trimmedRideId;
    setIsChatOpen(true);
    const cachedMessages = messagesCache.current.get(trimmedRideId);
    setChatState((prev) => ({
      ...prev,
      messages: cachedMessages || [],
      isLoading: !cachedMessages,
      otherUserName,
      otherUserPhoto,
      otherUserId,
      rideStatus: status,
      isChatAvailable: available,
    }));
    if (!cachedMessages) await loadMessages(trimmedRideId);
    await refreshUnreadCountForRide(trimmedRideId);
  }, [loadMessages, refreshUnreadCountForRide]);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    stopLongPolling();
  }, [stopLongPolling]);

  const sendMessage = useCallback(async (content: string) => {
    const rideId = currentRideIdRef.current?.trim();
    if (!rideId || !content?.trim() || !isChatAvailableRef.current) return false;
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      rideId,
      senderId: currentUserId,
      recipientId: '',
      content: content.trim(),
      deliveryStatus: 'SENDING',
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    setChatState((prev) => ({ ...prev, messages: [...prev.messages, optimisticMessage] }));
    try {
      const response = await apiService.sendChatMessage(rideId, content.trim());
      if (!response.success || !response.data) throw new Error();
      const persisted = toChatMessage(response.data);
      setChatState((prev) => ({
        ...prev,
        messages: prev.messages.map((item) => (item.id === optimisticId ? persisted : item)),
      }));
      return true;
    } catch {
      setChatState((prev) => ({
        ...prev,
        messages: prev.messages.map((item) => (item.id === optimisticId ? { ...item, deliveryStatus: 'FAILED', isOptimistic: false } : item)),
      }));
      return false;
    }
  }, [currentUserId]);

  const markAsRead = useCallback((messageIds: string[], rideIdOverride?: string) => {
    const rideId = (rideIdOverride ?? currentRideIdRef.current)?.trim();
    if (!rideId || !messageIds.length) return;
    chatWebSocket.markAsRead(rideId, messageIds);
    setChatState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) => (messageIds.includes(msg.id) ? { ...msg, deliveryStatus: 'READ' } : msg)),
      unreadCount: Math.max(0, prev.unreadCount - messageIds.length),
    }));
    void apiService.markChatMessagesAsRead(rideId, messageIds);
  }, []);

  const loadMoreMessages = useCallback(async () => {
    const rideId = currentRideIdRef.current;
    if (!rideId || chatState.isLoading || !chatState.hasMoreMessages) return;
    const cursor = cursorCache.current.get(rideId);
    if (!cursor) return;
    setChatState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await apiService.getChatMessages(rideId, cursor);
      if (!response.success || !response.data) return;
      const data = response.data;
      const newMessages = data.items.map((item: ChatMessageData) => toChatMessage(item));
      setChatState((prev) => ({ ...prev, messages: [...newMessages, ...prev.messages], hasMoreMessages: data.hasMore, isLoading: false }));
      cursorCache.current.set(rideId, data.nextCursor ?? null);
    } finally {
      setChatState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [chatState.hasMoreMessages, chatState.isLoading]);

  const refreshUnreadCount = useCallback(async () => {
    if (currentRideIdRef.current) await refreshUnreadCountForRide(currentRideIdRef.current);
  }, [refreshUnreadCountForRide]);

  const updateRideStatus = useCallback((status: string) => {
    setChatState((prev) => ({ ...prev, rideStatus: status, isChatAvailable: isRideActiveForChat(status) }));
    rideStatusRef.current = status;
    isChatAvailableRef.current = isRideActiveForChat(status);
  }, []);

  const connectChat = useCallback(() => {
    if (isAuthenticated && userType) chatWebSocket.connectAs(userType);
  }, [isAuthenticated, userType]);

  const disconnectChat = useCallback(() => {
    chatWebSocket.disconnect();
    stopLongPolling();
  }, [stopLongPolling]);

  return {
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
  };
}
