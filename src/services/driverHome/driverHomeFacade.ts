import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivePassengerMapItem, NearbyDriverMapItem, PendingTripData } from '@/models/driverHome/types';
import { ACTIVE_PASSENGER_STATUSES, DRIVER_HOME_CACHE_KEYS } from '@/hooks/driverHome/constants';
import { normalizeRideStatus } from '@/hooks/driverHome/helpers';
import { DriverRideOfferMessage } from '@/services/websocket';
import { driverHomeService } from '@/services/driverHome/driverHomeService';
import { ApiResponse } from '@/services/api';

export interface DriverActiveRide {
  id: string;
  status: string;
  pickup?: { lat: number; lng: number };
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  estimatedPrice?: number;
  estimated_fare?: number;
  finalPrice?: number;
  final_fare?: number;
  distanceKm?: number;
  distance_km?: number;
  durationMinutes?: number;
  duration_seconds?: number;
  passenger?: { id?: string; name?: string; rating?: number };
  passengerId?: string;
}

export interface PersistedActiveTripData {
  id: string;
  status: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  estimated_fare: number;
  final_fare?: number;
  distance_km?: number;
  duration_seconds: number;
  passenger?: { id?: string; name?: string; rating?: number };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const readNumber = (value: unknown): number | undefined => (typeof value === 'number' ? value : undefined);
const readString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);
const parseRecordArray = (json: string): Record<string, unknown>[] => {
  const parsed: unknown = JSON.parse(json);
  return Array.isArray(parsed) ? parsed.filter((item): item is Record<string, unknown> => isRecord(item)) : [];
};

export function mapNearbyDrivers(data: unknown, currentUserId?: string): NearbyDriverMapItem[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((driver): driver is Record<string, unknown> => isRecord(driver))
    .filter(
      (driver) =>
        driver.is_available === true &&
        readString(driver.driver_id) !== currentUserId &&
        typeof driver.latitude === 'number' &&
        typeof driver.longitude === 'number'
    )
    .map((driver) => ({
      id: readString(driver.driver_id) || readString(driver.id) || '',
      lat: readNumber(driver.latitude) || 0,
      lon: readNumber(driver.longitude) || 0,
      type: 'car',
      bearing: readNumber(driver.heading),
    }));
}

export function mapActivePassengers(data: unknown): ActivePassengerMapItem[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((passenger): passenger is Record<string, unknown> => isRecord(passenger))
    .filter(
      (passenger) =>
        typeof passenger.latitude === 'number' &&
        typeof passenger.longitude === 'number' &&
        ACTIVE_PASSENGER_STATUSES.includes((readString(passenger.trip_status) || '') as (typeof ACTIVE_PASSENGER_STATUSES)[number])
    )
    .map((passenger) => ({
      id: readString(passenger.passenger_id) || readString(passenger.id) || '',
      lat: readNumber(passenger.latitude) || 0,
      lon: readNumber(passenger.longitude) || 0,
    }));
}

export function normalizeRideForNavigation(rideData: DriverActiveRide): PersistedActiveTripData {
  const origin = rideData.pickup || rideData.origin || { lat: 0, lng: 0 };
  const destination = rideData.destination || { lat: 0, lng: 0 };

  return {
    id: rideData.id,
    status: normalizeRideStatus(rideData.status),
    origin,
    destination,
    estimated_fare: rideData.estimatedPrice || rideData.estimated_fare || 0,
    final_fare: rideData.finalPrice || rideData.final_fare,
    distance_km: rideData.distanceKm || rideData.distance_km,
    duration_seconds: rideData.durationMinutes ? rideData.durationMinutes * 60 : rideData.duration_seconds || 0,
    passenger: rideData.passenger
      ? { id: rideData.passenger.id || rideData.passengerId, name: rideData.passenger.name, rating: rideData.passenger.rating }
      : undefined,
  };
}

export async function fetchNearbyMapData(lat: number, lon: number, currentUserId?: string): Promise<{
  drivers: NearbyDriverMapItem[];
  passengers: ActivePassengerMapItem[];
}> {
  const [driversResponse, passengersResponse] = await Promise.all([
    driverHomeService.getNearbyDrivers(lat, lon),
    driverHomeService.getActivePassengers(lat, lon),
  ]);

  return {
    drivers: driversResponse.success ? mapNearbyDrivers(driversResponse.data, currentUserId) : [],
    passengers: passengersResponse.success ? mapActivePassengers(passengersResponse.data) : [],
  };
}

export async function resolveTripPaymentLabels(message: DriverRideOfferMessage): Promise<{
  paymentMethodName: string;
  paymentBrandName: string | null;
}> {
  let paymentMethodName = message.payment_method || 'Nao especificado';
  let paymentBrandName = message.payment_brand || null;

  const [cachedMethods, cachedBrands] = await Promise.all([
    AsyncStorage.getItem(DRIVER_HOME_CACHE_KEYS.PAYMENT_METHODS),
    AsyncStorage.getItem(DRIVER_HOME_CACHE_KEYS.PAYMENT_BRANDS),
  ]);

  if (cachedMethods) {
    const paymentMethods = parseRecordArray(cachedMethods);
    const method = paymentMethods.find(
      (item) => readString(item.slug) === message.payment_method || (readString(item.name) || '').toLowerCase() === (message.payment_method || '').toLowerCase()
    );
    const methodName = method ? readString(method.name) : undefined;
    if (methodName) paymentMethodName = methodName;
  }

  const paymentBrandSlug = message.payment_brand;
  if (cachedBrands && paymentBrandSlug) {
    const cardBrands = parseRecordArray(cachedBrands);
    const brand = cardBrands.find(
      (item) => readString(item.slug) === paymentBrandSlug || (readString(item.name) || '').toLowerCase() === paymentBrandSlug.toLowerCase()
    );
    const brandName = brand ? readString(brand.name) : undefined;
    if (brandName) paymentBrandName = brandName;
  }

  return { paymentMethodName, paymentBrandName };
}

export async function getDriverActiveRide(): Promise<ApiResponse<DriverActiveRide>> {
  const response = await driverHomeService.getDriverActiveRide();
  if (!response.success || !response.data) {
    return { success: false, message: response.message };
  }
  const candidate = response.data;
  if (!isRecord(candidate) || typeof candidate.id !== 'string' || typeof candidate.status !== 'string') {
    return { success: false, message: 'Formato de corrida ativa invalido.' };
  }
  return {
    success: true,
    data: {
      id: candidate.id,
      status: candidate.status,
      pickup: isRecord(candidate.pickup) ? { lat: Number(candidate.pickup.lat) || 0, lng: Number(candidate.pickup.lng) || 0 } : undefined,
      origin: isRecord(candidate.origin) ? { lat: Number(candidate.origin.lat) || 0, lng: Number(candidate.origin.lng) || 0 } : undefined,
      destination: isRecord(candidate.destination)
        ? { lat: Number(candidate.destination.lat) || 0, lng: Number(candidate.destination.lng) || 0 }
        : undefined,
      estimatedPrice: readNumber(candidate.estimatedPrice),
      estimated_fare: readNumber(candidate.estimated_fare),
      finalPrice: readNumber(candidate.finalPrice),
      final_fare: readNumber(candidate.final_fare),
      distanceKm: readNumber(candidate.distanceKm),
      distance_km: readNumber(candidate.distance_km),
      durationMinutes: readNumber(candidate.durationMinutes),
      duration_seconds: readNumber(candidate.duration_seconds),
      passenger: isRecord(candidate.passenger)
        ? {
            id: readString(candidate.passenger.id),
            name: readString(candidate.passenger.name),
            rating: readNumber(candidate.passenger.rating),
          }
        : undefined,
      passengerId: readString(candidate.passengerId),
    },
  };
}

export function mapRideOfferToPendingTrip(message: DriverRideOfferMessage): PendingTripData {
  return {
    trip_id: message.trip_id,
    origin: message.origin,
    destination: message.destination,
    estimated_fare: message.estimated_fare,
    distance_km: message.distance_km,
    duration_seconds: message.duration_seconds,
    assignment_expires_at: message.assignment_expires_at,
    passenger: {
      id: message.passenger.id,
      name: message.passenger.name,
      rating: message.passenger.rating,
      ...(message.passenger.photoUrl && { photoUrl: message.passenger.photoUrl }),
    },
  };
}
