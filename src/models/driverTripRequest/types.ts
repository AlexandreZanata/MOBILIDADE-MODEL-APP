export interface DriverTripRequestLocation {
  lat: number;
  lng: number;
}

export interface DriverTripRequestPaymentInfo {
  id?: string;
  name?: string;
  slug?: string;
}

export interface DriverTripRequestPassenger {
  id?: string;
  name: string;
  rating?: number;
  phone?: string;
  photoUri?: string;
}

export interface DriverTripRequestData {
  tripId: string;
  origin: DriverTripRequestLocation;
  destination: DriverTripRequestLocation;
  estimatedFare: number;
  assignmentExpiresAt: string;
  category?: string;
  requestedAt?: string;
  passenger?: DriverTripRequestPassenger;
  distanceKm?: number;
  durationSeconds?: number;
  paymentMethod?: DriverTripRequestPaymentInfo;
  paymentBrand?: DriverTripRequestPaymentInfo;
}

export interface DriverTripRequestViewData {
  visible: boolean;
  tripData: DriverTripRequestData | null;
  originAddress: string;
  destinationAddress: string;
  timeLeft: number | null;
}
