/**
 * @file ChatWebSocket.ts
 * @description WebSocket client for the real-time chat channel.
 * Handles: message send/receive, delivery/read receipts, unread badge, online status.
 *
 * Endpoints:
 *   Driver:    wss://vamu.joaoflavio.com/ws/drivers/chat?token=<JWT>
 *   Passenger: wss://vamu.joaoflavio.com/ws/passengers/chat?token=<JWT>
 *
 * Heartbeat: every 30 seconds (mandatory per server contract).
 * Rate limits: 10 messages/second burst, 30 messages/minute.
 */

import { BaseWebSocket } from './base/BaseWebSocket';
import {
  ChatClientMessage,
  ChatServerMessage,
  ChatSendMessageClient,
  ChatMarkReadClient,
} from './types/chat.types';

/** The user role determines which chat endpoint to connect to. */
export type ChatUserType = 'driver' | 'passenger';

// ─── Rate limiter ─────────────────────────────────────────────────────────────

class RateLimiter {
  private burstCount = 0;
  private burstResetAt = 0;
  private minuteCount = 0;
  private minuteResetAt = 0;

  private readonly MAX_BURST = 10;
  private readonly MAX_PER_MINUTE = 30;

  /** Returns `true` if the message is allowed, `false` if rate-limited. */
  check(): boolean {
    const now = Date.now();

    if (now - this.burstResetAt >= 1_000) {
      this.burstCount = 0;
      this.burstResetAt = now;
    }
    if (now - this.minuteResetAt >= 60_000) {
      this.minuteCount = 0;
      this.minuteResetAt = now;
    }

    if (this.burstCount >= this.MAX_BURST) {
      console.warn('[ChatWebSocket] Rate limit: max 10 messages/second reached.');
      return false;
    }
    if (this.minuteCount >= this.MAX_PER_MINUTE) {
      console.warn('[ChatWebSocket] Rate limit: max 30 messages/minute reached.');
      return false;
    }

    this.burstCount++;
    this.minuteCount++;
    return true;
  }
}

// ─── ChatWebSocketClient ──────────────────────────────────────────────────────

class ChatWebSocketClient extends BaseWebSocket<ChatServerMessage, ChatClientMessage> {
  private userType: ChatUserType | null = null;
  private currentRideId: string | null = null;
  private readonly rateLimiter = new RateLimiter();

  constructor() {
    super({
      heartbeatIntervalMs: 30_000,
      maxReconnectAttempts: 10,
      initialReconnectDelayMs: 1_000,
      maxReconnectDelayMs: 60_000,
    });
  }

  // ─── BaseWebSocket implementation ─────────────────────────────────────────

  protected buildUrl(): string | null {
    if (!this.userType) return null;
    const path = this.userType === 'driver' ? '/ws/drivers/chat' : '/ws/passengers/chat';
    return this.buildBaseUrl(path);
  }

  protected onServerMessage(message: ChatServerMessage): void {
    switch (message.type) {
      case 'chat_message':
        console.log('[ChatWebSocket] Message received:', message.data.id);
        break;
      case 'delivery_confirmed':
        console.log('[ChatWebSocket] Delivery confirmed:', message.data.messageId);
        break;
      case 'read_confirmed':
        console.log('[ChatWebSocket] Read confirmed:', message.data.messageId);
        break;
      case 'unread_count':
        console.log('[ChatWebSocket] Unread count:', message.data.unreadCount);
        break;
      case 'user_online_status':
        console.log('[ChatWebSocket] User online status:', message.data.userId, message.data.isOnline);
        break;
      case 'pong':
        // Heartbeat acknowledged — no action needed.
        break;
      case 'error':
        console.error('[ChatWebSocket] Server error:', message.data.message);
        break;
    }
  }

  // ─── Connection ───────────────────────────────────────────────────────────

  /**
   * Connects to the chat WebSocket for the given user type.
   * Must be called before sending any messages.
   *
   * @param userType - `'driver'` or `'passenger'`.
   */
  async connectAs(userType: ChatUserType): Promise<boolean> {
    this.userType = userType;
    return this.connect();
  }

  // ─── State ────────────────────────────────────────────────────────────────

  /**
   * Sets the active ride ID used for message routing.
   * Must be set before calling `sendMessage` or `markAsRead`.
   *
   * @param rideId - The active ride ID, or `null` to clear.
   */
  setCurrentRideId(rideId: string | null): void {
    this.currentRideId = rideId;
    console.log('[ChatWebSocket] Active ride ID set:', rideId);
  }

  /** Returns the currently active ride ID. */
  getCurrentRideId(): string | null {
    return this.currentRideId;
  }

  // ─── Domain actions ───────────────────────────────────────────────────────

  /**
   * Sends a chat message for the given ride.
   *
   * @param rideId  - The ride ID (required).
   * @param content - The message text (required, non-empty).
   * @returns `true` on success, `false` if validation or rate-limit fails.
   */
  sendMessage(rideId: string, content: string): boolean {
    const trimmedRideId = rideId?.trim();
    const trimmedContent = content?.trim();

    if (!trimmedRideId) {
      console.error('[ChatWebSocket] sendMessage: rideId is required.');
      return false;
    }
    if (!trimmedContent) {
      console.warn('[ChatWebSocket] sendMessage: content is required.');
      return false;
    }
    if (!this.rateLimiter.check()) return false;

    const message: ChatSendMessageClient = {
      type: 'chat_message',
      data: { rideId: trimmedRideId, content: trimmedContent },
    };
    return this.send(message);
  }

  /**
   * Marks a list of messages as read for the given ride.
   *
   * @param rideId     - The ride ID (required).
   * @param messageIds - Array of message IDs to mark as read.
   * @returns `true` on success, `false` if validation fails.
   */
  markAsRead(rideId: string, messageIds: string[]): boolean {
    const trimmedRideId = rideId?.trim();

    if (!trimmedRideId) {
      console.error('[ChatWebSocket] markAsRead: rideId is required.');
      return false;
    }
    if (!messageIds?.length) {
      console.warn('[ChatWebSocket] markAsRead: no message IDs provided.');
      return false;
    }

    const message: ChatMarkReadClient = {
      type: 'mark_read',
      data: { rideId: trimmedRideId, messageIds },
    };
    return this.send(message);
  }
}

/** Singleton chat WebSocket client. */
export const chatWebSocket = new ChatWebSocketClient();
