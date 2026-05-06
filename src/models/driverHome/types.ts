export interface DriverHomeLocation {
  lat: number;
  lon: number;
}

export interface PendingTripData {
  trip_id: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  estimated_fare: number;
  distance_km?: number;
  duration_seconds?: number;
  /** ISO expiry for the offer; optional when the API omits it (UI uses a local fallback). */
  assignment_expires_at?: string;
  category?: string;
  requested_at?: string;
  passenger?: {
    id?: string;
    name?: string;
    rating?: number;
    phone?: string;
    photoUrl?: string;
  };
  payment_method?: {
    id?: string;
    name?: string;
    slug?: string;
  };
  payment_brand?: {
    id?: string;
    name?: string;
    slug?: string;
  };
}

export interface NearbyDriverMapItem {
  id: string;
  lat: number;
  lon: number;
  type: 'car';
  bearing?: number;
}

export interface ActivePassengerMapItem {
  id: string;
  lat: number;
  lon: number;
}

export interface DriverOperationalStatusData {
  operationalStatus: 'AVAILABLE' | 'BUSY' | 'PAUSED' | 'OFFLINE';
  /** Whether the driver is currently connected to the WebSocket server. */
  isOnline: boolean;
  canReceiveRides: boolean;
}

export interface DriverValidationVehicle {
  status?: 'APPROVED' | 'PENDING' | 'REJECTED' | string;
}

export interface DriverValidationStatusData {
  workflowStatus?: 'ACTIVE' | 'COMPLETE' | 'AWAITING_CNH' | 'AWAITING_VEHICLE' | string;
  cnh?: {
    status?: 'MISSING' | 'PENDING' | 'REJECTED' | 'APPROVED' | string;
    rejectionReason?: string;
  };
  vehicles?: DriverValidationVehicle[];
}
