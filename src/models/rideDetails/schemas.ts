import { z } from 'zod';
import { RideDetailsRide, RideDetailsRouteParams } from '@/models/rideDetails/types';

const vehicleSchema = z
  .object({
    licensePlate: z.string().optional(),
    license_plate: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    color: z.string().optional(),
  })
  .transform((value) => ({
    licensePlate: value.licensePlate ?? value.license_plate,
    brand: value.brand,
    model: value.model,
    color: value.color,
  }));

const personSchema = z
  .object({
    id: z.string().optional(),
    userId: z.string().optional(),
    user_id: z.string().optional(),
    name: z.string().optional(),
    full_name: z.string().optional(),
    rating: z.number().optional(),
    photoUrl: z.string().optional(),
    photo_url: z.string().optional(),
    profile_photo: z.string().optional(),
    vehicle: vehicleSchema.optional(),
  })
  .transform((value) => ({
    id: value.id ?? value.userId ?? value.user_id ?? '',
    name: value.name ?? value.full_name ?? '',
    rating: value.rating,
    photoUrl: value.photoUrl ?? value.photo_url ?? value.profile_photo,
    vehicle: value.vehicle,
  }));

const rideSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    passengerId: z.string().optional(),
    passenger_id: z.string().optional(),
    driverId: z.string().optional(),
    driver_id: z.string().optional(),
    serviceCategoryId: z.string().optional(),
    service_category_id: z.string().optional(),
    paymentMethodId: z.string().optional(),
    payment_method_id: z.string().optional(),
    cardBrandId: z.string().optional(),
    card_brand_id: z.string().optional(),
    estimatedPrice: z.number().optional(),
    estimated_price: z.number().optional(),
    finalPrice: z.number().nullable().optional(),
    final_price: z.number().nullable().optional(),
    distanceKm: z.number().optional(),
    distance_km: z.number().optional(),
    durationMinutes: z.number().optional(),
    duration_minutes: z.number().optional(),
    surge: z.number().optional(),
    requestedAt: z.string().optional(),
    requested_at: z.string().optional(),
    createdAt: z.string().optional(),
    created_at: z.string().optional(),
    passenger: personSchema.optional(),
    driver: personSchema.optional(),
  })
  .transform<RideDetailsRide>((value) => ({
    id: value.id,
    status: value.status,
    passengerId: value.passengerId ?? value.passenger_id ?? value.passenger?.id,
    driverId: value.driverId ?? value.driver_id ?? value.driver?.id,
    serviceCategoryId: value.serviceCategoryId ?? value.service_category_id,
    paymentMethodId: value.paymentMethodId ?? value.payment_method_id,
    cardBrandId: value.cardBrandId ?? value.card_brand_id,
    estimatedPrice: value.estimatedPrice ?? value.estimated_price,
    finalPrice: value.finalPrice ?? value.final_price,
    distanceKm: value.distanceKm ?? value.distance_km,
    durationMinutes: value.durationMinutes ?? value.duration_minutes,
    surge: value.surge,
    requestedAt: value.requestedAt ?? value.requested_at,
    createdAt: value.createdAt ?? value.created_at,
    passenger: value.passenger?.id ? value.passenger : undefined,
    driver: value.driver?.id ? value.driver : undefined,
  }));

const routeParamsSchema = z.object({
  ride: z.unknown().optional(),
});

export function parseRideDetailsRide(payload: unknown): RideDetailsRide {
  return rideSchema.parse(payload);
}

export function parseRideDetailsRouteParams(payload: unknown): RideDetailsRouteParams {
  return routeParamsSchema.parse(payload);
}
