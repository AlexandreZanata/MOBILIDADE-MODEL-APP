import { z } from 'zod';
import { Ride, RidesPage } from '@/models/rides/types';

const ridePersonSummarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    rating: z.number().optional(),
    photoUrl: z.string().optional(),
  })
  .passthrough();

const rideDriverSummarySchema = ridePersonSummarySchema.extend({
  vehicle: z
    .object({
      licensePlate: z.string(),
      brand: z.string(),
      model: z.string(),
      color: z.string(),
    })
    .optional(),
});

export const rideSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    estimatedPrice: z.number().optional(),
    finalPrice: z.number().nullable().optional(),
    distanceKm: z.number().optional(),
    durationMinutes: z.number().optional(),
    requestedAt: z.string().optional(),
    createdAt: z.string().optional(),
    passenger: ridePersonSummarySchema.optional(),
    driver: rideDriverSummarySchema.optional(),
  })
  .passthrough();

export const ridesPageSchema = z
  .object({
    items: z.array(rideSchema),
    nextCursor: z.string().nullable(),
    prevCursor: z.string().nullable(),
    hasMore: z.boolean(),
  })
  .passthrough();

export function parseRide(payload: unknown): Ride {
  return rideSchema.parse(payload);
}

export function parseRidesPage(payload: unknown): RidesPage {
  return ridesPageSchema.parse(payload);
}
