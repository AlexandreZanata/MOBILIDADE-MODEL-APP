import { z } from 'zod';
import {
  GeocodingResponse,
  PlaceAutocompleteResponse,
  PlaceDetailsResponse,
  QuotaStats,
  RateLimitStats,
} from './types';

const placeAutocompleteResultSchema = z.object({
  placeId: z.string(),
  description: z.string(),
  mainText: z.string(),
  secondaryText: z.string(),
  types: z.array(z.string()),
  matchedSubstrings: z
    .array(
      z.object({
        offset: z.number(),
        length: z.number(),
      })
    )
    .optional(),
});

const placeAutocompleteResponseSchema = z.object({
  predictions: z.array(placeAutocompleteResultSchema),
  cached: z.boolean(),
  source: z.string(),
  queriedAt: z.string(),
});

const geocodingResultSchema = z.object({
  placeId: z.string(),
  formattedAddress: z.string(),
  lat: z.number(),
  lng: z.number(),
  locationType: z.string().optional(),
  confidence: z.string().optional(),
});

const geocodingResponseSchema = z.object({
  results: z.array(geocodingResultSchema),
  cached: z.boolean(),
  source: z.string(),
  queriedAt: z.string(),
});

const placeDetailsResponseSchema = z.object({
  placeId: z.string(),
  name: z.string(),
  formattedAddress: z.string(),
  lat: z.number(),
  lng: z.number(),
  addressComponents: z
    .array(
      z.object({
        longName: z.string(),
        shortName: z.string(),
        types: z.array(z.string()),
      })
    )
    .optional(),
  types: z.array(z.string()),
  cached: z.boolean(),
  source: z.string(),
  queriedAt: z.string(),
});

const genericRecordSchema = z.record(z.string(), z.unknown());

export function parseAutocompleteResponse(input: unknown): PlaceAutocompleteResponse {
  return placeAutocompleteResponseSchema.parse(input);
}

export function parseGeocodingResponse(input: unknown): GeocodingResponse {
  return geocodingResponseSchema.parse(input);
}

export function parsePlaceDetailsResponse(input: unknown): PlaceDetailsResponse {
  return placeDetailsResponseSchema.parse(input);
}

export function parseQuotaStats(input: unknown): QuotaStats {
  return genericRecordSchema.parse(input);
}

export function parseRateLimitStats(input: unknown): RateLimitStats {
  return genericRecordSchema.parse(input);
}
