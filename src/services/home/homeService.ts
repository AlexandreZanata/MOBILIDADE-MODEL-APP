import { apiService } from '@/services/api';
import {
  getPlaceDetails,
  PlacesSearchResult,
  resetSessionToken,
  reverseGeocode,
  searchPlaces,
} from '@/services/placesService';
import { HomeSearchLocationContext } from '@/models/home/types';

class HomeService {
  async searchDestinations(
    query: string,
    location?: HomeSearchLocationContext
  ): Promise<PlacesSearchResult[]> {
    return searchPlaces(query, location, 30000, true);
  }

  async resolveDestinationDetails(placeId: string): Promise<{
    lat: number;
    lng: number;
    name?: string;
    formattedAddress?: string;
  } | null> {
    return getPlaceDetails(placeId);
  }

  clearPlacesSession(): void {
    resetSessionToken();
  }

  async reverseGeocodeLocation(lat: number, lon: number) {
    return reverseGeocode(lat, lon);
  }

  async getPassengerActiveRide() {
    return apiService.getPassengerActiveRide();
  }
}

export const homeService = new HomeService();
