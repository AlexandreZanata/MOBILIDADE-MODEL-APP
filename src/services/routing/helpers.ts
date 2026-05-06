import { MIN_DISTANCE_METERS } from './constants';
import { Coordinates, DistanceValidationResult, RouteRequest } from './types';

export function calculateDistance(origin: Coordinates, destination: Coordinates): number {
  const earthRadius = 6371000;
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLon = ((destination.lon - origin.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

export function validateDistance(
  origin: Coordinates,
  destination: Coordinates
): DistanceValidationResult {
  const distance = calculateDistance(origin, destination);
  if (distance < MIN_DISTANCE_METERS) {
    return {
      valid: false,
      distance,
      error: `Origem e destino muito próximos (${Math.round(distance)}m, mínimo ${MIN_DISTANCE_METERS}m)`,
    };
  }

  return { valid: true, distance };
}

export function buildRouteRequest(
  origin: Coordinates,
  destination: Coordinates,
  includeSteps = false,
  includeGeometry = true
): RouteRequest {
  return {
    originLat: origin.lat,
    originLng: origin.lon,
    destinationLat: destination.lat,
    destinationLng: destination.lon,
    includeSteps,
    includeGeometry,
  };
}
