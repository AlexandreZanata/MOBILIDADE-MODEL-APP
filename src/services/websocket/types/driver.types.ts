/**
 * @file driver.types.ts
 * @description Typed message contracts for the Driver WebSocket connection.
 * Endpoint: wss://vamu.joaoflavio.com/ws/drivers?token=<JWT>
 */

// ─── Operational status ───────────────────────────────────────────────────────

/** Driver availability states. */
export type DriverOperationalStatus = 'AVAILABLE' | 'BUSY' | 'PAUSED' | 'OFFLINE';

// ─── Client → Server ─────────────────────────────────────────────────────────

export interface DriverLocationUpdateMessage {
  type: 'location_update';
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}

export interface DriverHeartbeatMessage {
  type: 'heartbeat';
}

export interface DriverStatusUpdateMessage {
  type: 'status_update';
  status: DriverOperationalStatus;
}

export interface DriverRideResponseMessage {
  type: 'ride_response';
  /** Backend expects `rideId` in the response message. */
  rideId: string;
  action: 'accept' | 'reject';
}

/** Discriminated union of all client → server messages for the driver channel. */
export type DriverClientMessage =
  | DriverLocationUpdateMessage
  | DriverHeartbeatMessage
  | DriverStatusUpdateMessage
  | DriverRideResponseMessage;

// ─── Server → Client ─────────────────────────────────────────────────────────

export interface DriverConnectedMessage {
  type: 'connected';
  message: string;
}

export interface DriverLocationAcknowledgedMessage {
  type: 'location_update';
  message: string;
}

export interface DriverPongMessage {
  type: 'pong';
  message: string;
}

export interface DriverStatusUpdatedMessage {
  type: 'status_updated';
  message: string;
}

export interface DriverPassengerLocationMessage {
  type: 'passenger_location';
  rideId: string;
  passengerId: string;
  lat: number;
  lng: number;
}

export interface DriverRideOfferMessage {
  type: 'ride_offer';
  trip_id: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  estimated_fare: number;
  distance_km: number;
  duration_seconds: number;
  eta_to_pickup_minutes: number;
  /** ISO timestamp — offer expires at this time. */
  assignment_expires_at: string;
  passenger: {
    id: string;
    name: string;
    photoUrl?: string;
    rating: number;
  };
  payment_method: string | null;
  payment_brand: string | null;
}

export interface DriverRideAcceptedMessage {
  type: 'ride_accepted';
  message: string;
}

export interface DriverRideRejectedMessage {
  type: 'ride_rejected';
  message: string;
}

export interface DriverActiveRideMessage {
  type: 'active_ride';
  rideId: string;
  passengerId: string;
  status: string;
  estimatedPrice: number;
  finalPrice: number | null;
  distanceKm: number;
  durationMinutes: number;
  surge: number;
  requestedAt: string;
  passenger: {
    id: string;
    name: string;
    rating: number;
  };
  passengerLocation: { lat: number; lng: number } | null;
}

export interface DriverErrorMessage {
  type: 'error';
  message: string;
}

/** Discriminated union of all server → client messages for the driver channel. */
export type DriverServerMessage =
  | DriverConnectedMessage
  | DriverLocationAcknowledgedMessage
  | DriverPongMessage
  | DriverStatusUpdatedMessage
  | DriverPassengerLocationMessage
  | DriverRideOfferMessage
  | DriverRideAcceptedMessage
  | DriverRideRejectedMessage
  | DriverActiveRideMessage
  | DriverErrorMessage;
