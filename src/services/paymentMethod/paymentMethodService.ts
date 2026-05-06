import { ApiResponse, apiService } from '@/services/api';
import { CreatedRideData, PaymentMethodLocation } from '@/models/paymentMethod/types';

export interface CreateRidePayload {
  estimateId: string;
  serviceCategoryId: string;
  paymentMethodId: string;
  cardBrandId?: string;
}

class PaymentMethodService {
  getPaymentMethods() {
    return apiService.getPaymentMethods();
  }

  getCardBrands() {
    return apiService.getCardBrands();
  }

  fareEstimate(origin: PaymentMethodLocation, destination: PaymentMethodLocation): Promise<ApiResponse<unknown>> {
    return apiService.fareEstimate(origin, destination);
  }

  createRide(payload: CreateRidePayload): Promise<ApiResponse<CreatedRideData>> {
    return apiService.createRide(
      payload.estimateId,
      payload.serviceCategoryId,
      payload.paymentMethodId,
      payload.cardBrandId
    );
  }
}

export const paymentMethodService = new PaymentMethodService();
