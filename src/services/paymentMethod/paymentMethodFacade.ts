import {
  parseCreatedRide,
  parseCreateRideErrorInfo,
  parsePaymentBrands,
  parsePaymentEstimate,
  parsePaymentMethods,
} from '@/models/paymentMethod/schemas';
import {
  CreateRideErrorInfo,
  CreatedRideData,
  PaymentBrand,
  PaymentEstimate,
  PaymentMethod,
  PaymentMethodLocation,
} from '@/models/paymentMethod/types';
import { CreateRidePayload, paymentMethodService } from '@/services/paymentMethod/paymentMethodService';

type ServiceErrorCode = 'REQUEST_FAILED' | 'VALIDATION_FAILED';

export interface PaymentMethodError {
  message: string;
  status?: number;
  code: ServiceErrorCode;
}

export interface PaymentMethodResult<TData> {
  success: boolean;
  data?: TData;
  error?: PaymentMethodError;
  status?: number;
  meta?: CreateRideErrorInfo;
}

function requestFailed<TData>(message: string, status?: number, meta?: CreateRideErrorInfo): PaymentMethodResult<TData> {
  return {
    success: false,
    status,
    error: { message, status, code: 'REQUEST_FAILED' },
    meta,
  };
}

function invalidPayload<TData>(message: string, status?: number): PaymentMethodResult<TData> {
  return {
    success: false,
    status,
    error: { message, status, code: 'VALIDATION_FAILED' },
  };
}

class PaymentMethodFacade {
  async getPaymentMethods(): Promise<PaymentMethodResult<PaymentMethod[]>> {
    const response = await paymentMethodService.getPaymentMethods();
    if (!response.success || !response.data) {
      return requestFailed(response.message ?? response.error ?? 'Falha ao carregar metodos de pagamento.', response.status);
    }

    try {
      return { success: true, data: parsePaymentMethods(response.data) };
    } catch {
      return invalidPayload('Payload de metodos de pagamento invalido.', response.status);
    }
  }

  async getCardBrands(): Promise<PaymentMethodResult<PaymentBrand[]>> {
    const response = await paymentMethodService.getCardBrands();
    if (!response.success || !response.data) {
      return requestFailed(response.message ?? response.error ?? 'Falha ao carregar bandeiras.', response.status);
    }

    try {
      return { success: true, data: parsePaymentBrands(response.data) };
    } catch {
      return invalidPayload('Payload de bandeiras invalido.', response.status);
    }
  }

  async fareEstimate(origin: PaymentMethodLocation, destination: PaymentMethodLocation): Promise<PaymentMethodResult<PaymentEstimate>> {
    const response = await paymentMethodService.fareEstimate(origin, destination);
    if (!response.success || !response.data) {
      return requestFailed(response.message ?? response.error ?? 'Falha ao obter estimativa.', response.status);
    }

    try {
      return { success: true, data: parsePaymentEstimate(response.data) };
    } catch {
      return invalidPayload('Payload da estimativa invalido.', response.status);
    }
  }

  async createRide(payload: CreateRidePayload): Promise<PaymentMethodResult<CreatedRideData>> {
    const response = await paymentMethodService.createRide(payload);
    if (!response.success) {
      const meta = parseCreateRideErrorInfo(response.data);
      return requestFailed(response.message ?? response.error ?? 'Falha ao criar corrida.', response.status, meta);
    }

    try {
      return {
        success: true,
        data: parseCreatedRide(response.data),
        status: response.status,
      };
    } catch {
      return invalidPayload('Payload de criacao de corrida invalido.', response.status);
    }
  }
}

export const paymentMethodFacade = new PaymentMethodFacade();
