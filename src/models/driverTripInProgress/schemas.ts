import { z } from 'zod';
import { DriverTripCoordinate, DriverTripData, DriverTripPassengerInfo } from '@/models/driverTripInProgress/types';

const coordinateSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

const passengerSchema = z
  .object({
    id: z.string().optional(),
    userId: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    photoUrl: z.string().optional(),
  })
  .transform<DriverTripPassengerInfo>((value) => ({
    id: value.id ?? value.userId,
    name: value.name ?? 'Passageiro',
    phone: value.phone,
    photoUrl: value.photoUrl,
  }));

const locationInputSchema = z
  .object({
    lat: z.number(),
    lng: z.number().optional(),
    lon: z.number().optional(),
  })
  .transform<DriverTripCoordinate>((value) => ({
    lat: value.lat,
    lon: value.lon ?? value.lng ?? 0,
  }));

const tripSchema = z
  .object({
    id: z.string(),
    status: z.string().optional(),
    estimated_fare: z.number().optional(),
    estimatedPrice: z.number().optional(),
    final_fare: z.number().optional(),
    finalPrice: z.number().optional(),
    passenger: passengerSchema.optional(),
    passengerId: z.string().optional(),
    passengerName: z.string().optional(),
    origin: locationInputSchema.optional(),
    destination: locationInputSchema.optional(),
  })
  .transform<DriverTripData>((value) => ({
    id: value.id,
    status: value.status ?? 'DRIVER_ASSIGNED',
    estimatedFare: value.estimated_fare ?? value.estimatedPrice,
    finalFare: value.final_fare ?? value.finalPrice,
    passenger: value.passenger,
    passengerId: value.passengerId,
    passengerName: value.passengerName,
    origin: value.origin,
    destination: value.destination,
  }));

const passengerLocationMessageSchema = z.object({
  type: z.literal('passenger_location'),
  rideId: z.string(),
  lat: z.number(),
  lng: z.number().optional(),
  lon: z.number().optional(),
});

export function parseDriverTripData(payload: unknown): DriverTripData {
  return tripSchema.parse(payload);
}

export function parseDriverTripLocation(payload: unknown): DriverTripCoordinate {
  return locationInputSchema.parse(payload);
}

export function parsePassengerLocationMessage(payload: unknown): {
  rideId: string;
  location: DriverTripCoordinate;
} {
  const parsed = passengerLocationMessageSchema.parse(payload);
  return {
    rideId: parsed.rideId,
    location: { lat: parsed.lat, lon: parsed.lon ?? parsed.lng ?? 0 },
  };
}
