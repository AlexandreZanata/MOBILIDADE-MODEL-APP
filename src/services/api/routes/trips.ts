import { apiCoreClient } from '../core/client';
import type { ApiResponse, CardBrandResponse, PaymentMethodResponse } from '../types/common';

export interface FareEstimateCategoryDto {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  estimatedPrice: number;
  distanceKm: number;
  durationMinutes: number;
  surge?: number;
}

export interface FareEstimateResponseDto {
  estimateId: string;
  categories: FareEstimateCategoryDto[];
}

export interface CreatedRideResponseDto {
  id: string;
  status?: string;
  estimatedPrice?: number;
  finalPrice?: number;
  distanceKm?: number;
  durationMinutes?: number;
  driverId?: string;
  passengerId?: string;
  paymentMethodId?: string;
  cardBrandId?: string;
  createdAt?: string;
  requestedAt?: string;
  [key: string]: unknown;
}

export const tripRoutes = {
  fareEstimate(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<ApiResponse<FareEstimateResponseDto>> {
    return apiCoreClient.request('/passengers/fare-estimate', {
      method: 'POST',
      body: JSON.stringify({
        originLat: origin.lat,
        originLng: origin.lng,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
      }),
    });
  },

  createRide(
    estimateId: string,
    serviceCategoryId: string,
    paymentMethodId: string,
    cardBrandId?: string
  ): Promise<ApiResponse<CreatedRideResponseDto>> {
    const body: Record<string, string> = { estimateId, serviceCategoryId, paymentMethodId };
    if (cardBrandId && cardBrandId.trim().length > 0) body.cardBrandId = cardBrandId;
    return apiCoreClient.request('/passengers/rides', { method: 'POST', body: JSON.stringify(body) });
  },

  updateTripStatus(_tripId: string, _status: string, _reason?: string): Promise<ApiResponse<unknown>> {
    return Promise.resolve({
      success: false,
      error: 'Rota removida',
      message: 'A rota /trips/{id}/status foi removida. Use os endpoints específicos para motorista.',
    });
  },

  getPassengerActiveRide(): Promise<ApiResponse<unknown>> {
    return apiCoreClient.request('/passengers/active-ride', { method: 'GET' });
  },

  getDriverActiveRide(): Promise<ApiResponse<unknown>> {
    return apiCoreClient.request('/drivers/active-ride', { method: 'GET' });
  },

  getDriverRideDetails(rideId: string): Promise<ApiResponse<unknown>> {
    return apiCoreClient.request(`/drivers/rides/${rideId}`, { method: 'GET' });
  },

  getDriverRides(params?: { cursor?: string; limit?: number; sort?: string; q?: string; status?: string | string[] }) {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) {
      if (Array.isArray(params.status)) params.status.forEach((s) => queryParams.append('status[in]', s));
      else queryParams.append('status[eq]', params.status);
    }
    return apiCoreClient.request(`/drivers/rides${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, { method: 'GET' });
  },

  getPassengerRides(params?: { cursor?: string; limit?: number; sort?: string; q?: string; status?: string | string[] }) {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) {
      if (Array.isArray(params.status)) params.status.forEach((s) => queryParams.append('status[in]', s));
      else queryParams.append('status[eq]', params.status);
    }
    return apiCoreClient.request(`/passengers/rides${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, { method: 'GET' });
  },

  getPaymentMethods(): Promise<ApiResponse<PaymentMethodResponse[]>> {
    return apiCoreClient.request('/payment-methods', { method: 'GET' });
  },

  getCardBrands(): Promise<ApiResponse<CardBrandResponse[]>> {
    return apiCoreClient.request('/card-brands', { method: 'GET' });
  },
};
