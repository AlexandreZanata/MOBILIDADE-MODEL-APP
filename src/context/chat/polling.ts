import { apiService } from '@/services/api';
import { chatWebSocket, type ChatMessageServer } from '@/services/websocket';
import type { MutableRefObject } from 'react';
import type { ChatMessage } from './types';
import { toChatMessage } from './helpers';

interface PollingArgs {
  rideId: string;
  isActive: MutableRefObject<boolean>;
  cursor: MutableRefObject<string | undefined>;
  messagesCache: MutableRefObject<Map<string, ChatMessage[]>>;
  currentRideIdRef: MutableRefObject<string | null>;
  onCurrentRideMessage: (message: ChatMessage) => void;
}

export async function runLongPolling({
  rideId,
  isActive,
  cursor,
  messagesCache,
  currentRideIdRef,
  onCurrentRideMessage,
}: PollingArgs): Promise<void> {
  while (isActive.current && !chatWebSocket.isConnected) {
    try {
      const response = await apiService.pollChatMessages(rideId, 30, cursor.current);
      if (response.success && response.data) {
        response.data.items.forEach((msg) => {
          const nextMessage: ChatMessageServer = { type: 'chat_message', data: msg };
          const mapped = toChatMessage(nextMessage.data);
          const cached = messagesCache.current.get(mapped.rideId) ?? [];
          if (!cached.some((item) => item.id === mapped.id)) {
            messagesCache.current.set(mapped.rideId, [...cached, mapped]);
          }
          if (currentRideIdRef.current === mapped.rideId) onCurrentRideMessage(mapped);
        });
        cursor.current = response.data.nextCursor;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
