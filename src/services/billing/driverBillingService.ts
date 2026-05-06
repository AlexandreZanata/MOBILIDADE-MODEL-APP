import { apiService } from '@/services/api';
import {
  parseBillingCyclesPage,
  parseBillingStatus,
  parsePixQrCode,
} from '@/models/billing/schemas';
import { BillingCyclesPage, DriverBillingStatus, PixQrCode } from '@/models/billing/types';

export interface ServiceError {
  message: string;
  status?: number;
  code: 'REQUEST_FAILED' | 'VALIDATION_FAILED';
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

function toError(
  message: string,
  status: number | undefined,
  code: ServiceError['code']
): ServiceError {
  return { message, status, code };
}

/**
 * Facade for Driver Billing use cases.
 * Isolates network contracts from hooks/components.
 */
class DriverBillingService {
  async getBillingStatus(): Promise<ServiceResult<DriverBillingStatus>> {
    let response: Awaited<ReturnType<typeof apiService.getDriverBillingStatus>>;
    try {
      response = await apiService.getDriverBillingStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('[driverBillingService] getBillingStatus network error:', msg);
      return { success: false, error: toError(msg, undefined, 'REQUEST_FAILED') };
    }

    console.log('[driverBillingService] getBillingStatus response:', {
      success: response.success,
      status: response.status,
      hasData: response.data !== undefined && response.data !== null,
      dataKeys: response.data && typeof response.data === 'object'
        ? Object.keys(response.data as object).slice(0, 8)
        : null,
    });

    if (!response.success || response.data === undefined || response.data === null) {
      const msg = response.message ?? (response.error as string | undefined) ?? 'Request failed';
      console.error('[driverBillingService] getBillingStatus failed:', msg, 'status:', response.status);
      return {
        success: false,
        error: toError(msg, response.status, 'REQUEST_FAILED'),
      };
    }

    try {
      const parsed = parseBillingStatus(response.data);
      return { success: true, data: parsed };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Validation error';
      console.error('[driverBillingService] getBillingStatus validation failed:', msg);
      return {
        success: false,
        error: toError('Invalid billing status payload', response.status, 'VALIDATION_FAILED'),
      };
    }
  }

  async getBillingCycles(
    params: { cursor?: string; limit: number }
  ): Promise<ServiceResult<BillingCyclesPage>> {
    let response: Awaited<ReturnType<typeof apiService.getDriverBillingCycles>>;
    try {
      response = await apiService.getDriverBillingCycles(params);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      return { success: false, error: toError(msg, undefined, 'REQUEST_FAILED') };
    }

    console.log('[driverBillingService] getBillingCycles response:', {
      success: response.success,
      status: response.status,
      isArray: Array.isArray(response.data),
      length: Array.isArray(response.data) ? response.data.length : null,
    });

    if (!response.success || response.data === undefined || response.data === null) {
      const msg = response.message ?? (response.error as string | undefined) ?? 'Request failed';
      return { success: false, error: toError(msg, response.status, 'REQUEST_FAILED') };
    }

    try {
      return { success: true, data: parseBillingCyclesPage(response.data) };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Validation error';
      console.error('[driverBillingService] getBillingCycles validation failed:', msg);
      return {
        success: false,
        error: toError('Invalid billing cycles payload', response.status, 'VALIDATION_FAILED'),
      };
    }
  }

  async generateCyclePix(
    cycleId: string,
    idempotencyKey: string
  ): Promise<ServiceResult<PixQrCode>> {
    let response: Awaited<ReturnType<typeof apiService.generateCyclePix>>;
    try {
      response = await apiService.generateCyclePix(cycleId, idempotencyKey);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      return { success: false, error: toError(msg, undefined, 'REQUEST_FAILED') };
    }

    if (!response.success || response.data === undefined || response.data === null) {
      const msg = response.message ?? (response.error as string | undefined) ?? 'Request failed';
      return { success: false, error: toError(msg, response.status, 'REQUEST_FAILED') };
    }

    try {
      return { success: true, data: parsePixQrCode(response.data) };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Validation error';
      console.error('[driverBillingService] generateCyclePix validation failed:', msg);
      return {
        success: false,
        error: toError('Invalid pix payload', response.status, 'VALIDATION_FAILED'),
      };
    }
  }

  async generateDebtPix(idempotencyKey: string): Promise<ServiceResult<PixQrCode>> {
    let response: Awaited<ReturnType<typeof apiService.generateDebtPix>>;
    try {
      response = await apiService.generateDebtPix(idempotencyKey);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      return { success: false, error: toError(msg, undefined, 'REQUEST_FAILED') };
    }

    if (!response.success || response.data === undefined || response.data === null) {
      const msg = response.message ?? (response.error as string | undefined) ?? 'Request failed';
      return { success: false, error: toError(msg, response.status, 'REQUEST_FAILED') };
    }

    try {
      return { success: true, data: parsePixQrCode(response.data) };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Validation error';
      console.error('[driverBillingService] generateDebtPix validation failed:', msg);
      return {
        success: false,
        error: toError('Invalid pix payload', response.status, 'VALIDATION_FAILED'),
      };
    }
  }
}

export const driverBillingService = new DriverBillingService();
