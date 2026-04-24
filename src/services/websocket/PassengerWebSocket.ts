/**
 * @file PassengerWebSocket.ts
 * @description WebSocket client for the passenger channel.
 * Handles: ride status updates, driver location events, cancellation.
 *
 * Endpoint: wss://vamu.joaoflavio.com/ws/passengers?token=<JWT>
 * Heartbeat: every 10 seconds.
 */

import { BaseWebSocket } from './base/BaseWebSocket';
import {
  PassengerClientMessage,
  PassengerServerMessage,
  PassengerLocationUpdateMessage,
} from './types/passenger.types';

class PassengerWebSocketClient extends BaseWebSocket<PassengerServerMessage, PassengerClientMessage> {
  constructor() {
    super({
      heartbeatIntervalMs: 10_000,
      maxReconnectAttempts: 5,
      initialReconnectDelayMs: 1_000,
      maxReconnectDelayMs: 30_000,
    });
  }

  // ─── BaseWebSocket implementation ─────────────────────────────────────────

  protected buildUrl(): string | null {
    return this.buildBaseUrl('/ws/passengers');
  }

  protected onServerMessage(message: PassengerServerMessage): void {
    switch (message.type) {
      case 'connected':
        console.log('[PassengerWebSocket] Connection established.');
        break;
      case 'location_updated':
        console.log('[PassengerWebSocket] Location acknowledged.');
        break;
      case 'pong':
        // Heartbeat acknowledged — no action needed.
        break;
      case 'ride_driver_accepted':
        console.log('[PassengerWebSocket] Driver accepted ride:', message.rideId);
        break;
      case 'ride_driver_on_the_way':
        console.log('[PassengerWebSocket] Driver on the way:', message.rideId);
        break;
      case 'ride_driver_nearby':
        console.log('[PassengerWebSocket] Driver nearby:', message.rideId);
        break;
      case 'ride_driver_arrived':
        console.log('[PassengerWebSocket] Driver arrived:', message.rideId);
        break;
      case 'ride_status_update':
        console.log('[PassengerWebSocket] Ride status update:', message.data.status);
        break;
      case 'ride_cancelled':
        console.log('[PassengerWebSocket] Ride cancelled:', message.rideId);
        break;
      case 'error':
        console.error('[PassengerWebSocket] Server error:', message.message);
        break;
    }
  }

  // ─── Domain actions ───────────────────────────────────────────────────────

  /**
   * Sends the passenger's current GPS location to the server.
   *
   * @param payload - Location data including lat, lng, and optional heading/speed.
   */
  sendLocationUpdate(payload: Omit<PassengerLocationUpdateMessage, 'type'>): boolean {
    return this.send({ type: 'location_update', ...payload });
  }
}

/** Singleton passenger WebSocket client. */
export const passengerWebSocket = new PassengerWebSocketClient();
