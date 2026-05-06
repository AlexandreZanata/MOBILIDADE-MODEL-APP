export interface RidePersonSummary {
  id: string;
  name: string;
  rating?: number;
  photoUrl?: string;
}

export interface RideDriverSummary extends RidePersonSummary {
  vehicle?: {
    licensePlate: string;
    brand: string;
    model: string;
    color: string;
  };
}

export interface Ride {
  id: string;
  status: string;
  estimatedPrice?: number;
  finalPrice?: number | null;
  distanceKm?: number;
  durationMinutes?: number;
  requestedAt?: string;
  createdAt?: string;
  passenger?: RidePersonSummary;
  driver?: RideDriverSummary;
}

export interface RidesPage {
  items: Ride[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

export interface RideQueryParams {
  cursor?: string;
  limit?: number;
  sort?: string;
}
