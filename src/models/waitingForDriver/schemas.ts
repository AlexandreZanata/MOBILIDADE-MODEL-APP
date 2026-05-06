import { z } from 'zod';
import { WaitingActiveRideResponse } from '@/models/waitingForDriver/types';

const coordinatesSchema = z
  .object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    lon: z.number().optional(),
  })
  .passthrough();

const vehicleSchema = z
  .object({
    brand: z.string().optional(),
    model: z.string().optional(),
    plate: z.string().optional(),
    licensePlate: z.string().optional(),
    color: z.string().optional(),
  })
  .passthrough();

const driverSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    rating: z.number().optional(),
    vehicle: vehicleSchema.optional(),
  })
  .passthrough();

export const waitingActiveRideResponseSchema = z
  .object({
    id: z.string(),
    status: z.string().optional(),
    estimated_fare: z.number().optional(),
    final_fare: z.number().optional(),
    origin: coordinatesSchema.optional(),
    destination: coordinatesSchema.optional(),
    driver: driverSchema.optional(),
  })
  .passthrough();

export function parseWaitingActiveRide(payload: unknown): WaitingActiveRideResponse {
  return waitingActiveRideResponseSchema.parse(payload);
}
