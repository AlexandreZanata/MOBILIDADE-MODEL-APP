import { apiService } from '@/services/api';
import { RideQueryParams } from '@/models/rides/types';

export interface RidesServiceResponse<TData> {
  success: boolean;
  data?: TData;
  message?: string;
  error?: string;
  status?: number;
}

class RidesService {
  getDriverRides(params: RideQueryParams): Promise<RidesServiceResponse<unknown>> {
    return apiService.getDriverRides(params);
  }

  getPassengerRides(params: RideQueryParams): Promise<RidesServiceResponse<unknown>> {
    return apiService.getPassengerRides(params);
  }
}

export const ridesService = new RidesService();
