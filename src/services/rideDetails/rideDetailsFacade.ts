import {
  parseRideDetailsRide,
  parseRideDetailsRouteParams,
} from '@/models/rideDetails/schemas';
import { RideDetailsRide, RideDetailsRouteParams } from '@/models/rideDetails/types';
import { rideDetailsService } from '@/services/rideDetails/rideDetailsService';

class RideDetailsFacade {
  parseRouteParams(payload: unknown): RideDetailsRouteParams {
    return parseRideDetailsRouteParams(payload);
  }

  parseRide(payload: unknown): RideDetailsRide {
    return parseRideDetailsRide(payload);
  }

  normalizePhotoUrl(photoUrl?: string, userId?: string): string | undefined {
    if (!photoUrl) return undefined;
    if (/^https?:\/\//i.test(photoUrl)) return photoUrl;

    if (userId) {
      return rideDetailsService.getProfilePhotoUrl(userId);
    }

    const match = photoUrl.match(/profile-photos\/([a-f0-9-]+)/i);
    if (match?.[1]) {
      return rideDetailsService.getProfilePhotoUrl(match[1]);
    }

    return undefined;
  }

  async loadRideDetails(rideId: string, isDriver: boolean): Promise<RideDetailsRide | null> {
    if (!isDriver) return null;

    const payload = await rideDetailsService.getDriverRideDetails(rideId);
    if (!payload) return null;

    try {
      return this.parseRide(payload);
    } catch {
      return null;
    }
  }
}

export const rideDetailsFacade = new RideDetailsFacade();
