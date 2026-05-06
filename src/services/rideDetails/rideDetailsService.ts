import { apiService } from '@/services/api';

class RideDetailsService {
  getProfilePhotoUrl(userId: string): string {
    return apiService.getProfilePhotoUrl(userId);
  }

  async getDriverRideDetails(rideId: string): Promise<unknown | null> {
    const response = await apiService.getDriverRideDetails(rideId);
    if (!response.success || !response.data) {
      return null;
    }
    return response.data;
  }
}

export const rideDetailsService = new RideDetailsService();
