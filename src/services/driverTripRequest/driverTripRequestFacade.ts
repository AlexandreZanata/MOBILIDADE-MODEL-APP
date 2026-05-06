import { parseDriverTripRequestData } from '@/models/driverTripRequest/schemas';
import { DriverTripRequestData, DriverTripRequestPassenger } from '@/models/driverTripRequest/types';
import { driverTripRequestService } from '@/services/driverTripRequest/driverTripRequestService';

class DriverTripRequestFacade {
  parseTripRequest(payload: unknown): DriverTripRequestData {
    return parseDriverTripRequestData(payload);
  }

  resolvePassenger(tripData: DriverTripRequestData): DriverTripRequestPassenger | null {
    const passenger = tripData.passenger;
    if (!passenger) return null;
    const directPhoto = passenger.photoUri;

    if (directPhoto) {
      const isAbsoluteUrl = /^https?:\/\//i.test(directPhoto);
      const isS3Path = directPhoto.includes('profile-photos');
      if (isAbsoluteUrl || isS3Path) {
        return passenger;
      }
    }

    if (!passenger.id) {
      return passenger;
    }

    return {
      ...passenger,
      photoUri: driverTripRequestService.getProfilePhotoUrl(passenger.id),
    };
  }

  async resolveAddress(lat: number, lng: number): Promise<string> {
    return driverTripRequestService.reverseGeocode(lat, lng);
  }
}

export const driverTripRequestFacade = new DriverTripRequestFacade();
