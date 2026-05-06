import { z } from 'zod';
import { DriverTripRequestData, DriverTripRequestPassenger } from '@/models/driverTripRequest/types';

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const paymentInfoSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  slug: z.string().optional(),
});

const passengerSchema = z
  .object({
    id: z.string().optional(),
    passengerId: z.string().optional(),
    passenger_id: z.string().optional(),
    name: z.string().optional(),
    full_name: z.string().optional(),
    rating: z.number().optional(),
    phone: z.string().optional(),
    photoUrl: z.string().optional(),
    photo_url: z.string().optional(),
    profile_photo: z.string().optional(),
    avatar: z.string().optional(),
    avatar_url: z.string().optional(),
  })
  .transform<DriverTripRequestPassenger>((value) => ({
    id: value.id ?? value.passengerId ?? value.passenger_id,
    name: value.name ?? value.full_name ?? 'Passageiro',
    rating: value.rating,
    phone: value.phone,
    photoUri: value.photoUrl ?? value.photo_url ?? value.profile_photo ?? value.avatar ?? value.avatar_url,
  }));

const inputSchema = z
  .object({
    trip_id: z.string(),
    origin: locationSchema,
    destination: locationSchema,
    estimated_fare: z.number(),
    assignment_expires_at: z.string(),
    category: z.string().optional(),
    requested_at: z.string().optional(),
    passenger: passengerSchema.optional(),
    passenger_id: z.string().optional(),
    distance_km: z.number().optional(),
    duration_seconds: z.number().optional(),
    payment_method: paymentInfoSchema.optional(),
    payment_brand: paymentInfoSchema.optional(),
  })
  .transform<DriverTripRequestData>((value) => {
    const passengerId = value.passenger_id;
    return {
      tripId: value.trip_id,
      origin: value.origin,
      destination: value.destination,
      estimatedFare: value.estimated_fare,
      assignmentExpiresAt: value.assignment_expires_at,
      category: value.category,
      requestedAt: value.requested_at,
      passenger: value.passenger
        ? {
            ...value.passenger,
            id: value.passenger.id ?? passengerId,
          }
        : undefined,
      distanceKm: value.distance_km,
      durationSeconds: value.duration_seconds,
      paymentMethod: value.payment_method,
      paymentBrand: value.payment_brand,
    };
  });

export function parseDriverTripRequestData(payload: unknown): DriverTripRequestData {
  return inputSchema.parse(payload);
}
