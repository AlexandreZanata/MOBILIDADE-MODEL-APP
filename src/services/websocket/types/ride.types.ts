/**
 * @file ride.types.ts
 * @description Shared ride status and payload types used across WebSocket
 * clients, contexts, and screens.
 */

// ─── Ride status ──────────────────────────────────────────────────────────────

/**
 * All possible ride status values — covers both English and legacy
 * Portuguese variants returned by the backend.
 */
export type TripStatus =
  | 'REQUESTED'
  | 'DRIVER_ASSIGNED'
  | 'MOTORISTA_ACEITOU'
  | 'AGUARDANDO_MOTORISTA'
  | 'MOTORISTA_ENCONTRADO'
  | 'DRIVER_ON_THE_WAY'
  | 'MOTORISTA_A_CAMINHO'
  | 'DRIVER_NEARBY'
  | 'MOTORISTA_PROXIMO'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED'
  | 'MOTORISTA_CHEGOU'
  | 'PASSENGER_BOARDED'
  | 'PASSAGEIRO_EMBARCADO'
  | 'IN_ROUTE'
  | 'EM_ROTA'
  | 'NEAR_DESTINATION'
  | 'PROXIMO_DESTINO'
  | 'IN_PROGRESS'
  | 'WAITING_AT_DESTINATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CANCELED_BY_DRIVER'
  | 'CANCELED_BY_PASSENGER'
  | 'CANCELADA_PASSAGEIRO'
  | 'CANCELADA_MOTORISTA'
  | 'CANCELADA_ADMIN'
  | 'NO_SHOW'
  | 'EXPIRED';

// ─── Legacy payload types (used by TripContext) ───────────────────────────────

/** Payload received when a trip is assigned to a driver. */
export interface TripAssignedPayload {
  trip_id: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  estimated_fare: number;
  assignment_expires_at: string;
  category?: { id: string; name: string };
  requested_at: string;
  passenger?: {
    id: string;
    name: string;
    rating?: number;
    phone?: string;
  };
  distance_km?: number;
  duration_seconds?: number;
}

/** Payload received when a trip status changes. */
export interface TripStatusChangedPayload {
  trip_id: string;
  status: TripStatus;
  driver_id?: string;
  passenger_id?: string;
  timestamps?: {
    requested_at?: string;
    accepted_at?: string;
    arrived_at?: string;
    started_at?: string;
    completed_at?: string;
    cancelled_at?: string;
  };
  driver_snapshot?: {
    name: string;
    rating?: number;
    vehicle?: {
      brand: string;
      model: string;
      plate: string;
      color: string;
    };
    location?: { lat: number; lng: number };
  };
}

/** Payload received when a driver's location is updated. */
export interface DriverLocationUpdatePayload {
  driver_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}
