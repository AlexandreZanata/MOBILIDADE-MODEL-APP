import { apiService } from '@/services/api';
import {
  parseDriverTripData,
  parseDriverTripLocation,
} from '@/models/driverTripInProgress/schemas';
import { DriverTripCoordinate, DriverTripData } from '@/models/driverTripInProgress/types';
import { reverseGeocode } from '@/services/placesService';
import { RoutePoint } from '@/components/molecules/TileMap';

export interface DriverTripServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

async function parseTripResponse(payload: unknown): Promise<DriverTripServiceResult<DriverTripData>> {
  try {
    return { success: true, data: parseDriverTripData(payload) };
  } catch {
    return { success: false, error: 'Invalid trip payload' };
  }
}

class DriverTripInProgressService {
  async getDriverActiveRide(): Promise<DriverTripServiceResult<DriverTripData>> {
    const response = await apiService.getDriverActiveRide();
    if (!response.success || !response.data) return { success: false, error: response.message, status: response.status };
    return parseTripResponse(response.data);
  }

  async getRideDetails(rideId: string): Promise<DriverTripServiceResult<DriverTripData>> {
    const response = await apiService.getDriverRideDetails(rideId);
    if (!response.success || !response.data) return { success: false, error: response.message, status: response.status };
    return parseTripResponse(response.data);
  }

  async resolveAddress(location: DriverTripCoordinate): Promise<string> {
    const result = await reverseGeocode(location.lat, location.lon);
    return result?.display_name || result?.name || '';
  }

  async calculateRoutePoints(
    origin: DriverTripCoordinate,
    destination: DriverTripCoordinate
  ): Promise<RoutePoint[]> {
    const parsedOrigin = parseDriverTripLocation(origin);
    const parsedDestination = parseDriverTripLocation(destination);
    if (!parsedOrigin.lat || !parsedOrigin.lon || !parsedDestination.lat || !parsedDestination.lon) return [];
    const { routingService } = await import('@/services/routingService');
    const response = await routingService.calculateRouteAsPoints(parsedOrigin, parsedDestination);
    return response.success && response.data ? response.data : [];
  }

  async markOnTheWay(rideId: string) {
    return apiService.driverRideOnTheWay(rideId);
  }

  async markNearby(rideId: string, coords: { lat: number; lng: number }) {
    return apiService.driverRideNearby(rideId, coords.lat, coords.lng);
  }

  async markArrived(rideId: string, coords: { lat: number; lng: number }) {
    return apiService.driverRideArrived(rideId, coords.lat, coords.lng);
  }

  async markBoarded(rideId: string) {
    return apiService.driverRideBoarded(rideId);
  }

  async markInRoute(rideId: string) {
    return apiService.driverRideInRoute(rideId);
  }

  async markNearDestination(rideId: string, coords: { lat: number; lng: number }) {
    return apiService.driverRideNearDestination(rideId, coords.lat, coords.lng);
  }

  async completeRide(rideId: string, finalPrice: number) {
    return apiService.driverRideComplete(rideId, finalPrice);
  }

  async cancelRide(rideId: string, reason: string) {
    return apiService.driverRideCancel(rideId, reason);
  }

  async submitRating(rideId: string, rating: number, comment?: string) {
    return apiService.driverRideRate(rideId, rating, comment);
  }

  async markDriverAvailable() {
    return apiService.updateDriverOperationalStatus('AVAILABLE');
  }
}

export const driverTripInProgressService = new DriverTripInProgressService();
