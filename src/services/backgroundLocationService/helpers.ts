import { LOCATION_UPDATE_INTERVAL, MIN_DISTANCE_THRESHOLD } from './constants';
import { LastLocationPoint } from './types';

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadius = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const haversine =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadius * angularDistance;
}

export function shouldSendLocationUpdate(
  previous: LastLocationPoint | null,
  current: LastLocationPoint
): boolean {
  if (!previous) {
    return true;
  }

  const distance = calculateDistanceMeters(previous.lat, previous.lng, current.lat, current.lng);
  const elapsed = Date.now() - previous.timestamp;
  return distance >= MIN_DISTANCE_THRESHOLD || elapsed >= LOCATION_UPDATE_INTERVAL;
}

export function toOptionalHeading(value: number | null | undefined): number | undefined {
  return value ?? undefined;
}

export function toOptionalSpeedKmH(value: number | null | undefined): number | undefined {
  return value !== null && value !== undefined ? value * 3.6 : undefined;
}
