import { driverWebSocket } from '@/services/websocket';

/**
 * Waits until the driver WebSocket reports connected or the timeout elapses.
 * {@link BaseWebSocket.connect} resolves before the socket `open` event, so
 * callers must wait before sending `status_update` / `location_update`.
 */
export async function waitUntilDriverSocketOpen(timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (driverWebSocket.isConnected) return true;
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  }
  return driverWebSocket.isConnected;
}
