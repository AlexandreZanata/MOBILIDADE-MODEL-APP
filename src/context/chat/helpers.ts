import type { ChatMessageData } from '@/services/api';
import type { ChatMessage } from './types';
import { ACTIVE_RIDE_STATUSES } from './constants';

export function isRideActiveForChat(status?: string): boolean {
  if (!status) return false;
  return ACTIVE_RIDE_STATUSES.includes(status as (typeof ACTIVE_RIDE_STATUSES)[number]);
}

export function toChatMessage(message: ChatMessageData): ChatMessage {
  return {
    ...message,
    isOptimistic: false,
  };
}
