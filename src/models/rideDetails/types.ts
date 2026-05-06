export interface RideDetailsVehicle {
  licensePlate?: string;
  brand?: string;
  model?: string;
  color?: string;
}

export interface RideDetailsPerson {
  id: string;
  name: string;
  rating?: number;
  photoUrl?: string;
  vehicle?: RideDetailsVehicle;
}

export interface RideDetailsRide {
  id: string;
  status: string;
  passengerId?: string;
  driverId?: string;
  serviceCategoryId?: string;
  paymentMethodId?: string;
  cardBrandId?: string;
  estimatedPrice?: number;
  finalPrice?: number | null;
  distanceKm?: number;
  durationMinutes?: number;
  surge?: number;
  requestedAt?: string;
  createdAt?: string;
  passenger?: RideDetailsPerson;
  driver?: RideDetailsPerson;
}

export interface RideDetailsRouteParams {
  ride?: unknown;
}
