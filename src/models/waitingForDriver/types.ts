export interface WaitingDriverVehicle {
  brand?: string;
  model?: string;
  plate?: string;
  color?: string;
}

export interface WaitingDriver {
  id: string;
  name: string;
  rating?: number;
  photoUrl?: string;
  vehicle?: WaitingDriverVehicle;
}

export interface WaitingTripSnapshot {
  rideId: string;
  status: string;
  estimatedFare: number | null;
  origin: { lat: number; lon: number } | null;
  destination: { lat: number; lng: number } | null;
  driver: WaitingDriver | null;
}

export interface WaitingActiveRideResponse {
  id: string;
  status?: string;
  estimated_fare?: number;
  final_fare?: number;
  origin?: { lat?: number; lng?: number; lon?: number };
  destination?: { lat?: number; lng?: number; lon?: number };
  driver?: {
    id: string;
    name: string;
    rating?: number;
    vehicle?: {
      brand?: string;
      model?: string;
      plate?: string;
      licensePlate?: string;
      color?: string;
    };
  };
}
