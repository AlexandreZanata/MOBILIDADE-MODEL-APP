import { apiService } from '@/services/api';

export async function fetchRideStatus(rideId: string): Promise<string | undefined> {
  try {
    const passengerResponse = await apiService.request<{ status?: string }>(`/passengers/rides/${rideId}`, {
      method: 'GET',
    });
    if (passengerResponse.success && passengerResponse.data?.status) {
      return passengerResponse.data.status;
    }

    const driverResponse = await apiService.request<{ status?: string }>(`/drivers/rides/${rideId}`, {
      method: 'GET',
    });
    if (driverResponse.success && driverResponse.data?.status) {
      return driverResponse.data.status;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
