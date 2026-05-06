export interface TripPricingSettings {
  id: string;
  minimum_fare: string;
  price_per_km: string;
  base_fee: string;
  surge_multiplier: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface TripPricingResponse {
  settings: TripPricingSettings;
}
