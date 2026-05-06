import { StackNavigationProp } from '@react-navigation/stack';

export interface TripPriceLocation {
  lat: number;
  lng: number;
}

export interface TripPriceRouteParams {
  origin?: TripPriceLocation;
  destination?: TripPriceLocation;
}

export type TripPriceScreenNavigationProp = StackNavigationProp<Record<string, object | undefined>>;

export interface TripPriceScreenRoute {
  params?: TripPriceRouteParams;
}

export interface FareEstimateApiCategory {
  categoryId: string;
  categoryName: string;
  categorySlug?: string;
  estimatedPrice: number;
  distanceKm: number;
  durationMinutes: number;
  surge?: number;
}

export interface FareEstimateApiResponse {
  estimateId: string;
  categories: FareEstimateApiCategory[];
}

export interface TripCategoryOption {
  id: string;
  name: string;
  description?: string;
  finalFare: number;
  distanceKm: number;
  durationSeconds: number;
  priceMultiplier?: number;
  active: boolean;
}
