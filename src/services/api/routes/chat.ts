import { API_BASE_URL, type ApiResponse } from '../types/common';
import type { ChatMessageData, ChatMessagesResponse, ChatPollResponse, UnreadCountResponse, UserOnlineStatus } from '../types/chat';
import { apiCoreClient } from '../core/client';

export const chatRoutes = {
  getChatMessages(rideId: string, cursor?: string, limit: number = 50): Promise<ApiResponse<ChatMessagesResponse>> {
    let endpoint = `/chat/messages?rideId=${encodeURIComponent(rideId)}&limit=${limit}`;
    if (cursor) endpoint += `&cursor=${encodeURIComponent(cursor)}`;
    return apiCoreClient.request(endpoint, { method: 'GET' });
  },
  sendChatMessage(rideId: string, content: string): Promise<ApiResponse<ChatMessageData>> {
    return apiCoreClient.request('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ rideId, content }),
    });
  },
  markChatMessagesAsRead(rideId: string, messageIds: string[]): Promise<ApiResponse<void>> {
    if (!rideId.trim()) {
      return Promise.resolve({ success: false, error: 'rideId é obrigatório', message: 'ID da corrida é obrigatório.' });
    }
    if (messageIds.length === 0) {
      return Promise.resolve({ success: false, error: 'messageIds é obrigatório', message: 'IDs das mensagens são obrigatórios.' });
    }
    return apiCoreClient.request('/chat/messages/read', {
      method: 'POST',
      body: JSON.stringify({ rideId: rideId.trim(), messageIds }),
    });
  },
  getUserOnlineStatus(userId: string): Promise<ApiResponse<UserOnlineStatus>> {
    return apiCoreClient.request(`/chat/users/${encodeURIComponent(userId)}/online-status`, { method: 'GET' });
  },
  getUnreadMessagesCount(rideId?: string): Promise<ApiResponse<UnreadCountResponse>> {
    const endpoint = rideId ? `/chat/messages/unread?rideId=${encodeURIComponent(rideId)}` : '/chat/messages/unread';
    return apiCoreClient.request(endpoint, { method: 'GET' });
  },
  async pollChatMessages(rideId: string, timeout: number = 30, cursor?: string): Promise<ApiResponse<ChatPollResponse>> {
    let url = `${API_BASE_URL}/chat/messages/poll?rideId=${encodeURIComponent(rideId)}&timeout=${timeout}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), (timeout + 5) * 1000);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiCoreClient.getAccessToken() ? { Authorization: `Bearer ${apiCoreClient.getAccessToken()}` } : {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const text = await response.text();
      const data: unknown = text ? JSON.parse(text) : {};
      if (!response.ok) {
        const errorData = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;
        return { success: false, error: String(errorData.message ?? errorData.error ?? 'Erro ao buscar novas mensagens'), status: response.status };
      }
      return { success: true, data: data as ChatPollResponse };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: true, data: { items: [], hasMore: false } };
      }
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido', message: 'Erro na conexão com o servidor.' };
    }
  },
};
