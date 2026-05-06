import { apiCoreClient } from '../core/client';
import type { ApiResponse } from '../types/common';
import type {
  BillingCycleResponse,
  DriverBillingCyclesResponse,
  DriverBillingStatusResponse,
  DriverBlockedResponse,
  PixQrCodeResponse,
} from '../types/billing';

export const billingRoutes = {
  getDriverBillingStatus(): Promise<ApiResponse<DriverBillingStatusResponse>> {
    return apiCoreClient.request('/api/v1/driver/billing/status', { method: 'GET' });
  },
  getDriverBillingCycles(params?: { status?: string; cursor?: string; limit?: number }): Promise<ApiResponse<DriverBillingCyclesResponse>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', String(params.limit));
    return apiCoreClient.request(`/api/v1/driver/billing/cycles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, { method: 'GET' });
  },
  getDriverBillingCycle(cycleId: string): Promise<ApiResponse<BillingCycleResponse>> {
    return apiCoreClient.request(`/api/v1/driver/billing/cycles/${cycleId}`, { method: 'GET' });
  },
  generateCyclePix(cycleId: string, idempotencyKey?: string): Promise<ApiResponse<PixQrCodeResponse>> {
    const key = idempotencyKey ?? `cycle-${cycleId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return apiCoreClient.request(`/api/v1/driver/billing/cycles/${cycleId}/pix`, { method: 'POST', headers: { 'X-Idempotency-Key': key } });
  },
  generateDebtPix(idempotencyKey?: string): Promise<ApiResponse<PixQrCodeResponse>> {
    const key = idempotencyKey ?? `debt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return apiCoreClient.request('/api/v1/driver/billing/debt/pix', { method: 'POST', headers: { 'X-Idempotency-Key': key } });
  },
  checkDriverBlocked(): Promise<ApiResponse<DriverBlockedResponse>> {
    return apiCoreClient.request('/api/v1/driver/billing/blocked', { method: 'GET' });
  },
};
