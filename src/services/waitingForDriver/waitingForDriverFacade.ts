import { apiService } from '@/services/api';
import { parseWaitingActiveRide } from '@/models/waitingForDriver/schemas';
import { WaitingTripSnapshot } from '@/models/waitingForDriver/types';

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
]);

const FINAL_STATUSES = new Set(['COMPLETED', 'CORRIDA_FINALIZADA', 'CONCLUIDA']);

class WaitingForDriverFacade {
  isDriverAccepted(status?: string): boolean {
    return Boolean(status && ACCEPTED_STATUSES.has(status.toUpperCase()));
  }

  isFinalStatus(status?: string): boolean {
    return Boolean(status && FINAL_STATUSES.has(status.toUpperCase()));
  }

  async fetchActiveRideSnapshot(fallbackRideId: string): Promise<WaitingTripSnapshot | null> {
    const response = await apiService.getPassengerActiveRide();
    if (!response.success || !response.data) return null;
    const parsed = parseWaitingActiveRide(response.data);

    const origin = parsed.origin?.lat !== undefined
      ? { lat: parsed.origin.lat, lon: parsed.origin.lon ?? parsed.origin.lng ?? 0 }
      : null;
    const destination = parsed.destination?.lat !== undefined
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

  async submitPassengerRating(rideId: string, rating: number, comment?: string): Promise<boolean> {
    const response = await apiService.passengerRideRate(rideId, rating, comment?.trim() || undefined);
    return Boolean(response.success || response.status === 204);
  }
}

export const waitingForDriverFacade = new WaitingForDriverFacade();
