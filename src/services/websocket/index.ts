/**
 * @file websocket/index.ts
 * @description Barrel export for all WebSocket clients and their message types.
 *
 * Usage:
 *   import { driverWebSocket } from '@/services/websocket';
 *   import type { DriverServerMessage } from '@/services/websocket';
 */

// ─── Singleton clients ────────────────────────────────────────────────────────
export { driverWebSocket } from './DriverWebSocket';
export { passengerWebSocket } from './PassengerWebSocket';
export { chatWebSocket } from './ChatWebSocket';
export type { ChatUserType } from './ChatWebSocket';

// ─── Driver types ─────────────────────────────────────────────────────────────
export type {
  DriverOperationalStatus,
  DriverClientMessage,
  DriverServerMessage,
  DriverLocationUpdateMessage,
  DriverStatusUpdateMessage,
  DriverRideResponseMessage,
  DriverRideOfferMessage,
  DriverActiveRideMessage,
  DriverPassengerLocationMessage,
} from './types/driver.types';

// ─── Passenger types ──────────────────────────────────────────────────────────
export type {
  PassengerClientMessage,
  PassengerServerMessage,
  PassengerLocationUpdateMessage,
  RideDriverAcceptedMessage,
  RideDriverOnTheWayMessage,
  RideDriverNearbyMessage,
  RideDriverArrivedMessage,
  RideStatusUpdateMessage,
  RideCancelledMessage,
} from './types/passenger.types';

// ─── Chat types ───────────────────────────────────────────────────────────────
export type {
  ChatDeliveryStatus,
  ChatClientMessage,
  ChatServerMessage,
  ChatMessageServer,
  ChatDeliveryConfirmedServer,
  ChatReadConfirmedServer,
  ChatUnreadCountServer,
  ChatUserOnlineStatusServer,
} from './types/chat.types';

// ─── Ride / trip shared types ─────────────────────────────────────────────────
export type {
  TripStatus,
  TripAssignedPayload,
  TripStatusChangedPayload,
  DriverLocationUpdatePayload,
} from './types/ride.types';

// ─── Base types (for facade implementations) ─────────────────────────────────
export type {
  MessageCallback,
  ConnectionStateCallback,
  ErrorCallback,
  WebSocketConfig,
} from './base/BaseWebSocket';
