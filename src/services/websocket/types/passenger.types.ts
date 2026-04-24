/**
 * @file passenger.types.ts
 * @description Typed message contracts for the Passenger WebSocket connection.
 * Endpoint: wss://vamu.joaoflavio.com/ws/passengers?token=<JWT>
 */

// ─── Client → Server ─────────────────────────────────────────────────────────

export interface PassengerLocationUpdateMessage {
  type: 'location_update';
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}

export interface PassengerHeartbeatMessage {
  type: 'heartbeat';
}

/** Discriminated union of all client → server messages for the passenger channel. */
export type PassengerClientMessage =
  | PassengerLocationUpdateMessage
  | PassengerHeartbeatMessage;

// ─── Server → Client ─────────────────────────────────────────────────────────

export interface PassengerConnectedMessage {
  type: 'connected';
  message: string;
}

export interface PassengerLocationAcknowledgedMessage {
  type: 'location_updated';
  message: string;
}

export interface PassengerPongMessage {
  type: 'pong';
  message: string;
}

export interface RideDriverAcceptedMessage {
  type: 'ride_driver_accepted';
  rideId: string;
  message: string;
  data: {
    driverId: string;
    status: string;
    driver?: {
      id: string;
      name: string;
      rating?: number;
      vehicle?: {
        licensePlate?: string;
        plate?: string;
        brand?: string;
        model?: string;
        color?: string;
      };
    };
  };
}

export interface RideDriverOnTheWayMessage {
  type: 'ride_driver_on_the_way';
  rideId: string;
  message: string;
  data: { driverId: string; status: string };
}

export interface RideDriverNearbyMessage {
  type: 'ride_driver_nearby';
  rideId: string;
  message: string;
  data: { driverId: string; status: string };
}

export interface RideDriverArrivedMessage {
  type: 'ride_driver_arrived';
  rideId: string;
  message: string;
  data: { driverId: string; status: string };
}

export interface RideStatusUpdateMessage {
  type: 'ride_status_update';
  rideId: string;
  message: string;
  data: { status: string; driverId: string };
}

export interface RideCancelledMessage {
  type: 'ride_cancelled';
  rideId: string;
  message: string;
  data: {
    status: string;
    cancelledBy: string;
    cancellationReason?: string;
  };
}

export interface PassengerErrorMessage {
  type: 'error';
  message: string;
}

/** Discriminated union of all server → client messages for the passenger channel. */
export type PassengerServerMessage =
  | PassengerConnectedMessage
  | PassengerLocationAcknowledgedMessage
  | PassengerPongMessage
  | RideDriverAcceptedMessage
  | RideDriverOnTheWayMessage
  | RideDriverNearbyMessage
  | RideDriverArrivedMessage
  | RideStatusUpdateMessage
  | RideCancelledMessage
  | PassengerErrorMessage;
