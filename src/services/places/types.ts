export interface PlaceAutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
  matchedSubstrings?: Array<{
    offset: number;
    length: number;
  }>;
}

export interface PlaceAutocompleteResponse {
  predictions: PlaceAutocompleteResult[];
  cached: boolean;
  source: string;
  queriedAt: string;
}

export interface LocationBias {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
}

export interface GeocodingResult {
  placeId: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  locationType?: string;
  confidence?: string;
}

export interface GeocodingResponse {
  results: GeocodingResult[];
  cached: boolean;
  source: string;
  queriedAt: string;
}

export interface PlaceDetailsResponse {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  addressComponents?: Array<{
    longName: string;
    shortName: string;
    types: string[];
  }>;
  types: string[];
  cached: boolean;
  source: string;
  queriedAt: string;
}

export interface PlacesSearchResult {
  place_id: string | number;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  formatted_address?: string;
}

export interface PlacesReverseResult {
  place_id: string;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  formatted_address?: string;
}

export interface GeocodeCache {
  address: string;
  timestamp: number;
}

export type QuotaStats = Record<string, unknown>;
export type RateLimitStats = Record<string, unknown>;
