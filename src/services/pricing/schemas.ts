import { z } from 'zod';
import { TripPricingResponse, TripPricingSettings } from './types';

const tripPricingSettingsSchema = z.object({
  id: z.string(),
  minimum_fare: z.string(),
  price_per_km: z.string(),
  base_fee: z.string(),
  surge_multiplier: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.union([z.string(), z.null()]).optional(),
});

const tripPricingResponseSchema = z.object({
  settings: tripPricingSettingsSchema,
});

export function parseTripPricingSettings(input: unknown): TripPricingSettings {
  return tripPricingSettingsSchema.parse(input);
}

export function parseTripPricingResponse(input: unknown): TripPricingResponse {
  return tripPricingResponseSchema.parse(input);
}
