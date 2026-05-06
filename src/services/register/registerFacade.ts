import { parseRegisterApiSuccess } from '@/models/register/schemas';
import {
  RegisterApiSuccess,
  RegisterDriverPayload,
  RegisterPassengerPayload,
} from '@/models/register/types';
import { registerService } from '@/services/register/registerService';

type RegisterFacadeCode = 'REQUEST_FAILED' | 'VALIDATION_FAILED';

export interface RegisterFacadeError {
  message: string;
  status?: number;
  code: RegisterFacadeCode;
}

export interface RegisterFacadeResult<TData> {
  success: boolean;
  data?: TData;
  error?: RegisterFacadeError;
}

function toRequestError<TData>(message: string, status?: number): RegisterFacadeResult<TData> {
  return { success: false, error: { message, status, code: 'REQUEST_FAILED' } };
}

function toValidationError<TData>(message: string, status?: number): RegisterFacadeResult<TData> {
  return { success: false, error: { message, status, code: 'VALIDATION_FAILED' } };
}

function parsePayload(payload: unknown, status?: number): RegisterFacadeResult<RegisterApiSuccess> {
  try {
    return { success: true, data: parseRegisterApiSuccess(payload) };
  } catch {
    return toValidationError('Payload de cadastro invalido.', status);
  }
}

class RegisterFacade {
  async registerPassenger(payload: RegisterPassengerPayload): Promise<RegisterFacadeResult<RegisterApiSuccess>> {
    const response = await registerService.registerPassenger(payload);
    if (!response.success) {
      return toRequestError(response.message ?? response.error ?? 'Falha ao cadastrar passageiro.', response.status);
    }
    return parsePayload(response.data ?? {}, response.status);
  }

  async registerDriver(payload: RegisterDriverPayload): Promise<RegisterFacadeResult<RegisterApiSuccess>> {
    const response = await registerService.registerDriver(payload);
    if (!response.success) {
      return toRequestError(response.message ?? response.error ?? 'Falha ao cadastrar motorista.', response.status);
    }
    return parsePayload(response.data ?? {}, response.status);
  }
}

export const registerFacade = new RegisterFacade();
