import { z } from 'zod';
import { RateLimitResponse, RouteResponse } from './types';

const routeStepSchema = z.object({
  distanceMeters: z.number(),
  durationSeconds: z.number(),
  instruction: z.string(),
  name: z.string(),
  maneuver: z.string(),
});

const routeGeometrySchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

const routeResponseSchema = z.object({
  distanceMeters: z.number(),
  distanceKm: z.number(),
  durationSeconds: z.number(),
  durationMinutes: z.number(),
  durationFormatted: z.string(),
  cached: z.boolean().optional(),
  calculatedAt: z.string().optional(),
  steps: z.array(routeStepSchema).optional(),
  geometry: routeGeometrySchema.optional(),
});

const rateLimitSchema = z.object({
  remaining: z.number(),
  limit: z.number(),
  resetAt: z.number(),
  resetInSeconds: z.number(),
});

export function parseRouteResponse(input: unknown): RouteResponse {
  return routeResponseSchema.parse(input);
}

export function parseRateLimitResponse(input: unknown): RateLimitResponse {
  return rateLimitSchema.parse(input);
}
