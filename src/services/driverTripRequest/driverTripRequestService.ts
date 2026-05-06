import { apiService } from '@/services/api';
import { getCachedAddress, reverseGeocode } from '@/services/placesService';

class DriverTripRequestService {
  getProfilePhotoUrl(userId: string): string {
    return apiService.getProfilePhotoUrl(userId);
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const cachedAddress = getCachedAddress(lat, lng);
    if (cachedAddress) {
      return this.shortAddress(cachedAddress);
    }

    const result = await reverseGeocode(lat, lng);
    if (!result?.display_name) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    return this.shortAddress(result.display_name);
  }

  private shortAddress(address: string): string {
    const parts = address.split(',').slice(0, 3).join(', ');
    return parts || address;
  }
}

export const driverTripRequestService = new DriverTripRequestService();
