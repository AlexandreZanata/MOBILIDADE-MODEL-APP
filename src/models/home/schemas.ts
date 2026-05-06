import { z } from 'zod';
import { HomeApiRide, HomeDestination, HomeLocation } from '@/models/home/types';

const numericLike = z.union([z.number(), z.string()]).transform((value) => Number(value));

const latLngSchema = z.object({
  lat: numericLike,
  lng: numericLike,
});

const ridePartySchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    rating: z.number().optional(),
    vehicle: z.string().optional(),
  })
  .optional();

export const homeDestinationSchema = z
  .object({
    place_id: z.union([z.string(), z.number()]),
    name: z.string(),
    display_name: z.string(),
    lat: z.union([z.string(), z.number()]),
    lon: z.union([z.string(), z.number()]),
    type: z.string(),
  })
  .transform<HomeDestination>((value) => ({
    placeId: String(value.place_id),
    name: value.name,
    displayName: value.display_name,
    // Empty string from autocomplete results maps to NaN — kept intentionally
    // so hydrateDestination knows it must fetch coordinates via place details.
    lat: value.lat === '' || value.lat === null ? NaN : Number(value.lat),
    lon: value.lon === '' || value.lon === null ? NaN : Number(value.lon),
    type: value.type,
  }));

export const homeLocationSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export const homeApiRideSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    pickup: latLngSchema.optional(),
    origin: latLngSchema.optional(),
    destination: latLngSchema.optional(),
    estimatedPrice: z.number().optional(),
    estimated_fare: z.number().optional(),
    finalPrice: z.number().optional(),
    final_fare: z.number().optional(),
    distanceKm: z.number().optional(),
    distance_km: z.number().optional(),
    durationMinutes: z.number().optional(),
    duration_seconds: z.number().optional(),
    driver: ridePartySchema,
    driverId: z.string().optional(),
  })
  .transform<HomeApiRide>((value) => value);

export function parseHomeDestination(payload: unknown): HomeDestination {
  return homeDestinationSchema.parse(payload);
}

export function parseHomeLocation(payload: unknown): HomeLocation {
  return homeLocationSchema.parse(payload);
}

export function parseHomeApiRide(payload: unknown): HomeApiRide {
  return homeApiRideSchema.parse(payload);
}
