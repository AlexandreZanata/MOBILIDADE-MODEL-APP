import { z } from 'zod';

const locationCoordsSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  heading: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
});

const locationObjectSchema = z.object({
  coords: locationCoordsSchema,
  timestamp: z.number(),
});

const taskPayloadSchema = z.object({
  locations: z.array(locationObjectSchema).min(1),
});

export function parseLocationTaskPayload(payload: unknown): z.infer<typeof taskPayloadSchema> | null {
  const parsed = taskPayloadSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}
