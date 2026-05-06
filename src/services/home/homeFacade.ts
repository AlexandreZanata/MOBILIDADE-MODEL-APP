import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlacesSearchResult } from '@/services/placesService';
import { parseHomeApiRide, parseHomeDestination } from '@/models/home/schemas';
import { HomeApiRide, HomeDestination, HomeNavigationTripData, HomeSearchLocationContext } from '@/models/home/types';
import { homeService } from '@/services/home/homeService';

const INVALID_ACTIVE_RIDE_STATUSES = new Set([
  'CANCELADA_MOTORISTA',
  'CANCELADA_PASSAGEIRO',
  'CANCELADA_ADMIN',
  'CANCELLED',
  'CANCELED_BY_DRIVER',
  'CANCELED_BY_PASSENGER',
  'EXPIRED',
  'COMPLETED',
  'CONCLUIDA',
  'CORRIDA_FINALIZADA',
  'AGUARDANDO_AVALIACAO',
  'MOTORISTA_ENCONTRADO',
]);

const WAITING_STATUSES = new Set([
  'REQUESTED',
  'AGUARDANDO_MOTORISTA',
  'DRIVER_ASSIGNED',
  'MOTORISTA_ACEITOU',
  'DRIVER_ON_THE_WAY',
  'MOTORISTA_A_CAMINHO',
  'DRIVER_NEARBY',
  'MOTORISTA_PROXIMO',
  'DRIVER_ARRIVING',
]);

const IN_PROGRESS_STATUSES = new Set([
  'DRIVER_ARRIVED',
  'MOTORISTA_CHEGOU',
  'PASSENGER_BOARDED',
  'PASSAGEIRO_EMBARCADO',
  'IN_ROUTE',
  'EM_ROTA',
  'NEAR_DESTINATION',
  'PROXIMO_DESTINO',
  'IN_PROGRESS',
  'WAITING_AT_DESTINATION',
]);

class HomeFacade {
  private searchCache = new Map<string, HomeDestination[]>();

  normalizeRideStatus(rawStatus?: string | null): string {
    if (!rawStatus) return 'REQUESTED';
    const normalized = rawStatus.trim().toUpperCase();
    const map: Record<string, string> = { 'MOTORISTA ENCONTRADO': 'DRIVER_ASSIGNED', MOTORISTA_ENCONTRADO: 'DRIVER_ASSIGNED' };
    return (map[normalized] || normalized).replace(/\s+/g, '_');
  }

  async search(query: string, location?: HomeSearchLocationContext): Promise<HomeDestination[]> {
    const key = query.trim().toLowerCase();
    if (!key) return [];
    const cached = this.searchCache.get(key);
    if (cached) return cached;
    const results = await homeService.searchDestinations(query.trim(), location);
    const mapped = results.map((item: PlacesSearchResult) => parseHomeDestination(item));
    this.searchCache.set(key, mapped);
    if (this.searchCache.size > 50) {
      const firstKey = this.searchCache.keys().next().value;
      if (firstKey) this.searchCache.delete(firstKey);
    }
    return mapped;
  }

  async hydrateDestination(destination: HomeDestination): Promise<HomeDestination> {
    // Coordinates are valid only when both are finite numbers outside the null
    // island (0,0). Autocomplete results arrive with lat/lon = NaN because the
    // Places Autocomplete API does not return coordinates — only place details do.
    const hasValidCoords =
      Number.isFinite(destination.lat) &&
      Number.isFinite(destination.lon) &&
      !(destination.lat === 0 && destination.lon === 0);

    if (hasValidCoords) return destination;

    const details = await homeService.resolveDestinationDetails(destination.placeId);
    if (!details) return destination;

    homeService.clearPlacesSession();
    return {
      ...destination,
      lat: details.lat,
      lon: details.lng,
      name: details.name || destination.name,
      displayName: details.formattedAddress || destination.displayName,
    };
  }

  async resolveCityState(lat: number, lon: number): Promise<{ city?: string; state?: string }> {
    const result = await homeService.reverseGeocodeLocation(lat, lon);
    if (!result?.display_name) return {};
    const parts = result.display_name.split(',').map((p) => p.trim());
    return { city: parts[parts.length - 3], state: parts[parts.length - 2] };
  }

  async getValidActiveRide(): Promise<HomeNavigationTripData | null> {
    const response = await homeService.getPassengerActiveRide();
    if (!response.success || !response.data) return null;
    const ride = parseHomeApiRide(response.data);
    const normalizedStatus = this.normalizeRideStatus(ride.status);
    const valid = WAITING_STATUSES.has(normalizedStatus) || IN_PROGRESS_STATUSES.has(normalizedStatus);
    if (!valid || INVALID_ACTIVE_RIDE_STATUSES.has(normalizedStatus)) {
      await this.clearPersistedActiveRide();
      return null;
    }
    const tripData = this.buildTripData(ride, normalizedStatus);
    await AsyncStorage.setItem('@vamu:active_trip_id', tripData.id);
    await AsyncStorage.setItem('@vamu:active_trip_data', JSON.stringify(tripData));
    return tripData;
  }

  async clearPersistedActiveRide(): Promise<void> {
    await AsyncStorage.multiRemove(['@vamu:active_trip_id', '@vamu:active_trip_data']);
  }

  isWaitingStatus(status: string): boolean {
    return WAITING_STATUSES.has(status);
  }

  private buildTripData(ride: HomeApiRide, normalizedStatus: string): HomeNavigationTripData {
    const origin = ride.pickup || ride.origin || { lat: 0, lng: 0 };
    const destination = ride.destination || { lat: 0, lng: 0 };
    return {
      id: ride.id,
      trip_id: ride.id,
      origin,
      destination,
      estimated_fare: ride.estimatedPrice || ride.estimated_fare || 0,
      final_fare: ride.finalPrice || ride.final_fare,
      distance_km: ride.distanceKm || ride.distance_km,
      duration_seconds: ride.durationMinutes ? ride.durationMinutes * 60 : (ride.duration_seconds || 0),
      driver: ride.driver ? { id: ride.driver.id || ride.driverId, name: ride.driver.name, rating: ride.driver.rating, vehicle: ride.driver.vehicle } : undefined,
      status: normalizedStatus,
    };
  }
}

export const homeFacade = new HomeFacade();
