import { parseRidesPage } from '@/models/rides/schemas';
import { RideQueryParams, RidesPage } from '@/models/rides/types';
import { ridesService } from '@/services/rides/ridesService';

type RidesFacadeCode = 'REQUEST_FAILED' | 'VALIDATION_FAILED';

export interface RidesFacadeError {
  message: string;
  status?: number;
  code: RidesFacadeCode;
}

export interface RidesFacadeResult<TData> {
  success: boolean;
  data?: TData;
  error?: RidesFacadeError;
}

function toRequestError<TData>(message: string, status?: number): RidesFacadeResult<TData> {
  return { success: false, error: { message, status, code: 'REQUEST_FAILED' } };
}

function toValidationError<TData>(message: string, status?: number): RidesFacadeResult<TData> {
  return { success: false, error: { message, status, code: 'VALIDATION_FAILED' } };
}

class RidesFacade {
  async getRides(isDriver: boolean, params: RideQueryParams): Promise<RidesFacadeResult<RidesPage>> {
    const response = isDriver
      ? await ridesService.getDriverRides(params)
      : await ridesService.getPassengerRides(params);
    if (!response.success || !response.data) {
      return toRequestError(response.message ?? response.error ?? 'Falha ao carregar corridas.', response.status);
    }

    try {
      return { success: true, data: parseRidesPage(response.data) };
    } catch {
      return toValidationError('Payload de corridas invalido.', response.status);
    }
  }
}

export const ridesFacade = new RidesFacade();
