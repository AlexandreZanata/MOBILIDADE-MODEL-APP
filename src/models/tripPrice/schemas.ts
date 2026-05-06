import { z } from 'zod';
import { FareEstimateApiResponse } from '@/models/tripPrice/types';

const fareEstimateCategorySchema = z
  .object({
    categoryId: z.string(),
    categoryName: z.string(),
    categorySlug: z.string().optional(),
    estimatedPrice: z.number(),
    distanceKm: z.number(),
    durationMinutes: z.number(),
    surge: z.number().optional(),
  })
  .passthrough();

const fareEstimateResponseSchema = z
  .object({
    estimateId: z.string(),
    categories: z.array(fareEstimateCategorySchema),
  })
  .passthrough();

export function parseFareEstimateResponse(payload: unknown): FareEstimateApiResponse {
  return fareEstimateResponseSchema.parse(payload);
}
