/**
 * @file waitingForDriverFacade.ts
 * @description Facade for the WaitingForDriver feature.
 * Handles: active ride polling, geocoding, route calculation, and rating submission.
 *
 * Architecture: all external I/O goes through this facade — hooks never call
 * apiService, routingService, or reverseGeocode directly.
 */
import { apiService } from '@/services/api';
import { reverseGeocode } from '@/services/places';
import { routingService } from '@/services/routing';
import { parseWaitingActiveRide } from '@/models/waitingForDriver/schemas';
import type { WaitingTripSnapshot } from '@/models/waitingForDriver/types';
import type { RoutePoint } from '@/components/molecules/TileMap';

// ─── Status sets ──────────────────────────────────────────────────────────────

const ACCEPTED_STATUSES = new Set([
  'MOTORISTA_ACEITOU',
  'MOTORISTA_A_CAMINHO',
  'MOTORISTA_PROXIMO',
  'MOTORISTA_CHEGOU',
  'PASSAGEIRO_EMBARCADO',
  'EM_ROTA',
  'DRIVER_ARRIVING',
  'DRIVER_NEARBY',
  'DRIVER_ARRIVED',
  'IN_PROGRESS',
  'DRIVER_ASSIGNED',
  'MOTORISTA_ENCONTRADO',
  'AGUARDANDO_MOTORISTA',
]);

const FINAL_STATUSES = new Set([
  'COMPLETED',
  'CORRIDA_FINALIZADA',
  'CONCLUIDA',
]);

// ─── Facade ───────────────────────────────────────────────────────────────────

class WaitingForDriverFacade {
  /** Returns true when a driver has been matched and is en route. */
  isDriverAccepted(status?: string): boolean {
    return Boolean(status && ACCEPTED_STATUSES.has(status.toUpperCase()));
  }

  /** Returns true when the trip has reached a terminal state. */
  isFinalStatus(status?: string): boolean {
    return Boolean(status && FINAL_STATUSES.has(status.toUpperCase()));
  }

  /**
   * Fetches the current active ride snapshot from the API.
   * Returns null on any failure so callers can handle gracefully.
   */
  async fetchActiveRideSnapshot(fallbackRideId: string): Promise<WaitingTripSnapshot | null> {
    const response = await apiService.getPassengerActiveRide();
    if (!response.success || !response.data) return null;

    const parsed = parseWaitingActiveRide(response.data);

    const origin =
      parsed.origin?.lat !== undefined
        ? { lat: parsed.origin.lat, lon: parsed.origin.lon ?? parsed.origin.lng ?? 0 }
        : null;

    const destination =
      parsed.destination?.lat !== undefined
        ? { lat: parsed.destination.lat, lng: parsed.destination.lng ?? parsed.destination.lon ?? 0 }
        : null;

    return {
      rideId: parsed.id || fallbackRideId,
      status: parsed.status ?? 'REQUESTED',
      estimatedFare: parsed.final_fare ?? parsed.estimated_fare ?? null,
      origin,
      destination,
      driver: parsed.driver
        ? {
            id: parsed.driver.id,
            name: parsed.driver.name,
            rating: parsed.driver.rating,
            vehicle: parsed.driver.vehicle
              ? {
                  brand: parsed.driver.vehicle.brand,
                  model: parsed.driver.vehicle.model,
                  plate: parsed.driver.vehicle.licensePlate ?? parsed.driver.vehicle.plate,
                  color: parsed.driver.vehicle.color,
                }
              : undefined,
          }
        : null,
    };
  }

  /**
   * Reverse-geocodes a coordinate pair to a human-readable address string.
   * Returns null on failure — callers should show a fallback.
   * Results are cached by the places service (24h in-memory + AsyncStorage).
   */
  async reverseGeocodeCoords(lat: number, lon: number): Promise<string | null> {
    try {
      const result = await reverseGeocode(lat, lon);
      return result?.name || result?.display_name || null;
    } catch {
      return null;
    }
  }

  /**
   * Calculates the route between two coordinate pairs and returns an array
   * of RoutePoints suitable for the TileMap `route` prop.
   * Returns an empty array on failure (map will render without route line).
   */
  async fetchRoutePoints(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number },
  ): Promise<RoutePoint[]> {
    try {
      const response = await routingService.calculateRouteAsPoints(origin, destination);
      return response.success && response.data ? response.data : [];
    } catch {
      return [];
    }
  }

  /** Submits a passenger rating for a completed ride. */
  async submitPassengerRating(
    rideId: string,
    rating: number,
    comment?: string,
  ): Promise<boolean> {
    const response = await apiService.passengerRideRate(
      rideId,
      rating,
      comment?.trim() || undefined,
    );
    return Boolean(response.success || response.status === 204);
  }
}

export const waitingForDriverFacade = new WaitingForDriverFacade();
