export interface HomeLocation {
  lat: number;
  lon: number;
}

export interface HomeDestination {
  placeId: string;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  type: string;
}

export interface HomeSearchLocationContext {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
}

export interface HomeRideParty {
  id?: string;
  name?: string;
  rating?: number;
  vehicle?: string;
}

export interface HomeApiRide {
  id: string;
  status: string;
  pickup?: HomeLatLng;
  origin?: HomeLatLng;
  destination?: HomeLatLng;
  estimatedPrice?: number;
  estimated_fare?: number;
  finalPrice?: number;
  final_fare?: number;
  distanceKm?: number;
  distance_km?: number;
  durationMinutes?: number;
  duration_seconds?: number;
  driver?: HomeRideParty;
  driverId?: string;
}

export interface HomeLatLng {
  lat: number;
  lng: number;
}

export interface HomeNavigationTripData {
  id: string;
  trip_id: string;
  origin: HomeLatLng;
  destination: HomeLatLng;
  estimated_fare: number;
  final_fare?: number;
  distance_km?: number;
  duration_seconds: number;
  driver?: HomeRideParty;
  status: string;
}
