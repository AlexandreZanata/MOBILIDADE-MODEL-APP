import type { TripStatus } from '@/services/websocket';

export interface TripOrigin {
  lat: number;
  lng: number;
  address?: string;
}

export interface TripDestination {
  lat: number;
  lng: number;
  address?: string;
}

export interface TripDriver {
  id: string;
  name: string;
  rating?: number;
  phone?: string;
  vehicle?: { brand?: string; model?: string; plate?: string; color?: string };
  location?: { lat: number; lng: number };
}

export interface TripPassenger {
  id: string;
  name: string;
  rating?: number;
  phone?: string;
}

export interface ActiveTrip {
  id: string;
  status: TripStatus;
  origin: TripOrigin;
  destination: TripDestination;
  estimated_fare: number;
  final_fare?: number;
  distance_km?: number;
  duration_seconds?: number;
  category?: { id: string; name: string };
  driver?: TripDriver;
  passenger?: TripPassenger;
  payment_method_id?: string;
  payment_brand_id?: string;
  created_at?: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  assignment_expires_at?: string;
}

export interface PendingTripRequest {
  trip_id: string;
  origin: TripOrigin;
  destination: TripDestination;
  estimated_fare: number;
  assignment_expires_at: string;
  category?: string;
  requested_at?: string;
  passenger?: TripPassenger;
  distance_km?: number;
  duration_seconds?: number;
}

export interface TripContextData {
  activeTrip: ActiveTrip | null;
  isLoading: boolean;
  isWebSocketConnected: boolean;
  pendingTripRequest: PendingTripRequest | null;
  driverLocation: { lat: number; lng: number } | null;
  createTrip: (
    origin: TripOrigin,
    destination: TripDestination,
    tripCategoryId: string,
    paymentMethodId: string,
    paymentBrandId?: string,
    estimatedFare?: number
  ) => Promise<{ success: boolean; tripId?: string; error?: string }>;
  cancelTrip: (reason?: string) => Promise<{ success: boolean; error?: string }>;
  rateTrip: (rating: number, comment?: string) => Promise<{ success: boolean; error?: string }>;
  acceptTrip: (tripId: string) => Promise<{ success: boolean; error?: string }>;
  rejectTrip: (tripId: string) => Promise<void>;
  cancelDriverRide: (rideId: string) => Promise<{ success: boolean; error?: string }>;
  updateTripStatus: (status: TripStatus, reason?: string) => Promise<{ success: boolean; error?: string }>;
  refreshTrip: () => Promise<void>;
  loadTripFromStorage: () => Promise<void>;
  clearTrip: () => void;
  connectWebSocket: () => Promise<boolean>;
  disconnectWebSocket: () => void;
}
