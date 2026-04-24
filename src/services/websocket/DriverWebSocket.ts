/**
 * @file DriverWebSocket.ts
 * @description WebSocket client for the driver channel.
 * Handles: location streaming, ride offers, status updates, active-ride recovery.
 *
 * Endpoint: wss://vamu.joaoflavio.com/ws/drivers?token=<JWT>
 * Heartbeat: every 10 seconds.
 */

import { BaseWebSocket } from './base/BaseWebSocket';
import {
  DriverClientMessage,
  DriverServerMessage,
  DriverLocationUpdateMessage,
  DriverStatusUpdateMessage,
  DriverRideResponseMessage,
  DriverOperationalStatus,
} from './types/driver.types';

class DriverWebSocketClient extends BaseWebSocket<DriverServerMessage, DriverClientMessage> {
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
    return this.buildBaseUrl('/ws/drivers');
  }

  protected onServerMessage(message: DriverServerMessage): void {
    switch (message.type) {
      case 'connected':
        console.log('[DriverWebSocket] Connection established.');
        break;
      case 'location_update':
        console.log('[DriverWebSocket] Location acknowledged.');
        break;
      case 'pong':
        // Heartbeat acknowledged — no action needed.
        break;
      case 'status_updated':
        console.log('[DriverWebSocket] Status updated:', message.message);
        break;
      case 'passenger_location':
        console.log('[DriverWebSocket] Passenger location received:', message.rideId);
        break;
      case 'ride_offer':
        console.log('[DriverWebSocket] Ride offer received:', message.trip_id);
        break;
      case 'ride_accepted':
        console.log('[DriverWebSocket] Ride accepted.');
        break;
      case 'ride_rejected':
        console.log('[DriverWebSocket] Ride rejected.');
        break;
      case 'active_ride':
        console.log('[DriverWebSocket] Active ride received on reconnect:', message.rideId);
        break;
      case 'error':
        console.error('[DriverWebSocket] Server error:', message.message);
        break;
    }
  }

  // ─── Domain actions ───────────────────────────────────────────────────────

  /**
   * Sends a GPS location update to the server.
   * Should be called every 3 seconds while the driver is active.
   *
   * @param payload - Location data including lat, lng, and optional heading/speed.
   */
  sendLocationUpdate(payload: Omit<DriverLocationUpdateMessage, 'type'>): boolean {
    return this.send({ type: 'location_update', ...payload });
  }

  /**
   * Updates the driver's operational status.
   *
   * @param status - The new operational status.
   */
  updateOperationalStatus(status: DriverOperationalStatus): boolean {
    const message: DriverStatusUpdateMessage = { type: 'status_update', status };
    return this.send(message);
  }

  /**
   * Responds to a ride offer (accept or reject).
   *
   * @param tripId - The trip ID from the `ride_offer` message.
   * @param action - `'accept'` or `'reject'`.
   */
  respondToRideOffer(tripId: string, action: 'accept' | 'reject'): boolean {
    const message: DriverRideResponseMessage = {
      type: 'ride_response',
      rideId: tripId,
      action,
    };
    console.log('[DriverWebSocket] Sending ride response:', { tripId, action });
    return this.send(message);
  }
}

/** Singleton driver WebSocket client. */
export const driverWebSocket = new DriverWebSocketClient();
