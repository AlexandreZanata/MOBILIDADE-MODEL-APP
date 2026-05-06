import { ApiResponse, apiService } from '@/services/api';
import { TripPriceLocation } from '@/models/tripPrice/types';

class TripPriceService {
  async fareEstimate(origin: TripPriceLocation, destination: TripPriceLocation): Promise<ApiResponse<unknown>> {
    return apiService.fareEstimate(origin, destination);
  }
}

export const tripPriceService = new TripPriceService();
