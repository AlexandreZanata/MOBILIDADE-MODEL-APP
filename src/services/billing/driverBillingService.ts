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

function toError(message: string, status: number | undefined, code: ServiceError['code']): ServiceError {
  return { message, status, code };
}

/**
 * Facade for Driver Billing use cases.
 * This isolates network contracts from hooks/components.
 */
class DriverBillingService {
  async getBillingStatus(): Promise<ServiceResult<DriverBillingStatus>> {
    const response = await apiService.getDriverBillingStatus();
    if (!response.success || !response.data) {
      return {
        success: false,
        error: toError(response.message ?? response.error ?? 'Request failed', response.status, 'REQUEST_FAILED'),
      };
    }

    try {
      return { success: true, data: parseBillingStatus(response.data) };
    } catch {
      return { success: false, error: toError('Invalid billing status payload', response.status, 'VALIDATION_FAILED') };
    }
  }

  async getBillingCycles(params: { cursor?: string; limit: number }): Promise<ServiceResult<BillingCyclesPage>> {
    const response = await apiService.getDriverBillingCycles(params);
    if (!response.success || !response.data) {
      return {
        success: false,
        error: toError(response.message ?? response.error ?? 'Request failed', response.status, 'REQUEST_FAILED'),
      };
    }

    try {
      return { success: true, data: parseBillingCyclesPage(response.data) };
    } catch {
      return { success: false, error: toError('Invalid billing cycles payload', response.status, 'VALIDATION_FAILED') };
    }
  }

  async generateCyclePix(cycleId: string, idempotencyKey: string): Promise<ServiceResult<PixQrCode>> {
    const response = await apiService.generateCyclePix(cycleId, idempotencyKey);
    if (!response.success || !response.data) {
      return {
        success: false,
        error: toError(response.message ?? response.error ?? 'Request failed', response.status, 'REQUEST_FAILED'),
      };
    }

    try {
      return { success: true, data: parsePixQrCode(response.data) };
    } catch {
      return { success: false, error: toError('Invalid pix payload', response.status, 'VALIDATION_FAILED') };
    }
  }

  async generateDebtPix(idempotencyKey: string): Promise<ServiceResult<PixQrCode>> {
    const response = await apiService.generateDebtPix(idempotencyKey);
    if (!response.success || !response.data) {
      return {
        success: false,
        error: toError(response.message ?? response.error ?? 'Request failed', response.status, 'REQUEST_FAILED'),
      };
    }

    try {
      return { success: true, data: parsePixQrCode(response.data) };
    } catch {
      return { success: false, error: toError('Invalid pix payload', response.status, 'VALIDATION_FAILED') };
    }
  }
}

export const driverBillingService = new DriverBillingService();
