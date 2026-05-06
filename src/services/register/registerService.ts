import { apiService } from '@/services/api';
import { RegisterDriverPayload, RegisterPassengerPayload } from '@/models/register/types';

export interface RegisterServiceResponse<TData> {
  success: boolean;
  data?: TData;
  message?: string;
  error?: string;
  status?: number;
}

class RegisterService {
  registerPassenger(payload: RegisterPassengerPayload): Promise<RegisterServiceResponse<unknown>> {
    return apiService.registerPassenger(payload);
  }

  registerDriver(payload: RegisterDriverPayload): Promise<RegisterServiceResponse<unknown>> {
    return apiService.registerDriver(payload);
  }
}

export const registerService = new RegisterService();
