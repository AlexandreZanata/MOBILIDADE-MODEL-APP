import { ACCEPTED_DRIVER_STATUSES } from './constants';
import { getCoords, normalizeTripStatus } from './helpers';
import type { ActiveTrip, TripDriver } from './types';

type RideRecord = Record<string, unknown>;
type DriverRecord = {
  id?: string;
  name?: string;
  rating?: number;
  vehicle?: { brand?: string; model?: string; licensePlate?: string; plate?: string; color?: string };
};

function getDriver(rawRide: RideRecord): DriverRecord | undefined {
  return typeof rawRide.driver === 'object' && rawRide.driver !== null ? (rawRide.driver as DriverRecord) : undefined;
}

function getObject(value: unknown): RideRecord | undefined {
  return typeof value === 'object' && value !== null ? (value as RideRecord) : undefined;
}

function getString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function getNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function getOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function getOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function mapDriverData(rawRide: RideRecord, status: ReturnType<typeof normalizeTripStatus>): TripDriver | undefined {
  const driver = getDriver(rawRide);
  if (!driver || !ACCEPTED_DRIVER_STATUSES.includes(status)) return undefined;
  return {
    id: driver.id ?? '',
    name: driver.name ?? '',
    rating: driver.rating,
    vehicle: driver.vehicle
      ? {
          brand: driver.vehicle.brand,
          model: driver.vehicle.model,
          plate: driver.vehicle.licensePlate || driver.vehicle.plate,
          color: driver.vehicle.color,
        }
      : undefined,
    location: rawRide.driverLocation ? getCoords(getObject(rawRide.driverLocation)) : undefined,
  };
}

export function mapRideToActiveTrip(rawRide: RideRecord): ActiveTrip {
  const origin = rawRide.origin || rawRide.pickup || rawRide.passengerLocation || rawRide.passenger_location;
  const destination = rawRide.destination || rawRide.dropoff;
  const status = normalizeTripStatus(getString(rawRide.status, 'REQUESTED'));
  const category = getObject(rawRide.category);
  const passenger = getObject(rawRide.passenger);
  const serviceCategoryId = getString(rawRide.serviceCategoryId);
  return {
    id: getString(rawRide.id) || getString(rawRide.rideId),
    status,
    origin: getCoords(getObject(origin)),
    destination: getCoords(getObject(destination)),
    estimated_fare: getNumber(rawRide.estimated_fare, getNumber(rawRide.estimatedPrice, 0)),
    final_fare: getOptionalNumber(rawRide.final_fare) ?? getOptionalNumber(rawRide.finalPrice),
    distance_km: getOptionalNumber(rawRide.distance_km) ?? getOptionalNumber(rawRide.distanceKm),
    duration_seconds:
      typeof rawRide.duration_seconds === 'number'
        ? rawRide.duration_seconds
        : typeof rawRide.durationMinutes === 'number'
        ? rawRide.durationMinutes * 60
        : undefined,
    category: category
      ? { id: getString(category.id), name: getString(category.name) }
      : serviceCategoryId
      ? { id: serviceCategoryId, name: '' }
      : undefined,
    passenger: passenger
      ? {
          id: getString(passenger.id),
          name: getString(passenger.name),
          rating: typeof passenger.rating === 'number' ? passenger.rating : undefined,
        }
      : undefined,
    driver: mapDriverData(rawRide, status),
    payment_method_id: getOptionalString(rawRide.paymentMethodId),
    payment_brand_id: getOptionalString(rawRide.cardBrandId) ?? getOptionalString(rawRide.card_brand_id),
    created_at: getOptionalString(rawRide.createdAt) ?? getOptionalString(rawRide.requestedAt) ?? getOptionalString(rawRide.requested_at),
    accepted_at: getOptionalString(rawRide.acceptedAt) ?? getOptionalString(rawRide.accepted_at),
    started_at: getOptionalString(rawRide.startedAt) ?? getOptionalString(rawRide.started_at),
    completed_at: getOptionalString(rawRide.completedAt) ?? getOptionalString(rawRide.completed_at),
    cancelled_at: getOptionalString(rawRide.cancelledAt) ?? getOptionalString(rawRide.cancelled_at),
  };
}
