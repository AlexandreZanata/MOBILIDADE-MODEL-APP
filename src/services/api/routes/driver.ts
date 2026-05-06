import { z } from 'zod';
import { apiCoreClient } from '../core/client';
import type { ApiResponse } from '../types/common';

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const DriverOperationalStatusSchema = z.enum(['AVAILABLE', 'BUSY', 'PAUSED', 'OFFLINE']);

const DriverOperationalStatusResponseSchema = z.object({
  operationalStatus: DriverOperationalStatusSchema,
  isOnline: z.boolean(),
  canReceiveRides: z.boolean(),
});

export type DriverOperationalStatusResponse = z.infer<typeof DriverOperationalStatusResponseSchema>;

/**
 * Validates and parses the operational status API response.
 * Returns null if validation fails, logging the error for observability.
 */
function parseOperationalStatusResponse(raw: unknown): DriverOperationalStatusResponse | null {
  const result = DriverOperationalStatusResponseSchema.safeParse(raw);
  if (!result.success) {
    console.error('[driverRoutes] Invalid operational status response:', result.error.flatten());
    return null;
  }
  return result.data;
}

export const driverRoutes = {
  async getDriverOperationalStatus(): Promise<ApiResponse<DriverOperationalStatusResponse>> {
    const response = await apiCoreClient.request<unknown>('/drivers/operational-status', { method: 'GET' });
    if (!response.success) return response as ApiResponse<DriverOperationalStatusResponse>;
    const parsed = parseOperationalStatusResponse(response.data);
    if (!parsed) return { success: false, message: 'Resposta inválida do servidor' };
    return { ...response, data: parsed };
  },
  async updateDriverOperationalStatus(
    status: 'AVAILABLE' | 'BUSY' | 'PAUSED' | 'OFFLINE'
  ): Promise<ApiResponse<DriverOperationalStatusResponse>> {
    const response = await apiCoreClient.request<unknown>('/drivers/operational-status', {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (!response.success) return response as ApiResponse<DriverOperationalStatusResponse>;
    const parsed = parseOperationalStatusResponse(response.data);
    if (!parsed) return { success: false, message: 'Resposta inválida do servidor' };
    return { ...response, data: parsed };
  },
  getDriverValidationStatus(): Promise<ApiResponse<unknown>> {
    return apiCoreClient.request('/drivers/validation-status', { method: 'GET' });
  },
  getDriverServiceCategories(): Promise<ApiResponse<unknown>> {
    return apiCoreClient.request('/drivers/service-categories', { method: 'GET' });
  },
  getNearbyDrivers(latitude: number, longitude: number, radius: number = 5): Promise<ApiResponse<unknown>> {
    const query = `?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
    return apiCoreClient.request(`/drivers/nearby${query}`, { method: 'GET' }).catch(() => ({ success: true, data: [] }));
  },
  getActivePassengers(latitude: number, longitude: number, radius?: number): Promise<ApiResponse<unknown>> {
    const query = radius ? `?latitude=${latitude}&longitude=${longitude}&radius=${radius}` : '';
    return apiCoreClient.request(`/passengers/active${query}`, { method: 'GET' }).catch(() => ({ success: true, data: [] }));
  },
  getAvailableTrips(latitude: number, longitude: number, radiusKm: number = 5): Promise<ApiResponse<unknown>> {
    return apiCoreClient
      .request(`/drivers/available-trips?latitude=${latitude}&longitude=${longitude}&radius=${radiusKm}`, { method: 'GET' })
      .catch(() => ({ success: true, data: [] }));
  },
  getDriverVehicles(params?: {
    cursor?: string;
    limit?: number;
    sort?: string;
    q?: string;
    status?: string;
    year?: number;
    serviceCategoryId?: string;
  }): Promise<ApiResponse<unknown>> {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) queryParams.append('status[eq]', params.status);
    if (params?.year) queryParams.append('year[gte]', String(params.year));
    if (params?.serviceCategoryId) queryParams.append('serviceCategoryId[eq]', params.serviceCategoryId);
    return apiCoreClient.request(`/drivers/vehicles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, { method: 'GET' });
  },
  createDriverVehicle(vehicleData: {
    licensePlate: string;
    brandId: string;
    modelId: string;
    year: number;
    color: string;
    serviceCategoryId: string;
  }): Promise<ApiResponse<unknown>> {
    return apiCoreClient.request('/drivers/vehicles', { method: 'POST', body: JSON.stringify(vehicleData) });
  },
  driverRideOnTheWay(rideId: string) {
    return apiCoreClient.request<void>(`/drivers/rides/${rideId}/on-the-way`, { method: 'PATCH' });
  },
  driverRideNearby(rideId: string, lat: number, lng: number) {
    return apiCoreClient.request<void>(`/drivers/rides/${rideId}/nearby`, { method: 'PATCH', body: JSON.stringify({ lat, lng }) });
  },
  driverRideArrived(rideId: string, lat: number, lng: number) {
    return apiCoreClient.request<void>(`/drivers/rides/${rideId}/arrived`, { method: 'PATCH', body: JSON.stringify({ lat, lng }) });
  },
  driverRideBoarded(rideId: string) {
    return apiCoreClient.request<void>(`/drivers/rides/${rideId}/boarded`, { method: 'PATCH' });
  },
  driverRideInRoute(rideId: string) {
    return apiCoreClient.request<void>(`/drivers/rides/${rideId}/in-route`, { method: 'PATCH' });
  },
  driverRideNearDestination(rideId: string, lat: number, lng: number) {
    return apiCoreClient.request<void>(`/drivers/rides/${rideId}/near-destination`, { method: 'PATCH', body: JSON.stringify({ lat, lng }) });
  },
  driverRideComplete(rideId: string, finalPrice: number) {
    return apiCoreClient.request<void>(`/drivers/rides/${rideId}/complete`, { method: 'PATCH', body: JSON.stringify({ finalPrice }) });
  },
  driverRideCancel(rideId: string, reason?: string) {
    return apiCoreClient.request<void>(`/drivers/rides/${rideId}/cancel`, { method: 'POST', body: JSON.stringify({ reason: reason ?? 'Cancelado pelo motorista' }) });
  },
  driverRideRate(rideId: string, rating: number, comment?: string) {
    return apiCoreClient.request<void>(`/drivers/rides/${rideId}/ratings`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  },
  passengerRideRate(rideId: string, rating: number, comment?: string) {
    return apiCoreClient.request<void>(`/passengers/rides/${rideId}/ratings`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  },
};
