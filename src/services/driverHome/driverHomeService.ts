import { apiService } from '@/services/api';
import {
  DriverOperationalStatusData,
  DriverValidationStatusData,
} from '@/models/driverHome/types';

export const driverHomeService = {
  getDriverOperationalStatus: () => apiService.getDriverOperationalStatus() as Promise<{
    success: boolean;
    data?: DriverOperationalStatusData;
    message?: string;
    error?: string;
    status?: number;
  }>,
  getDriverValidationStatus: () => apiService.getDriverValidationStatus() as Promise<{
    success: boolean;
    data?: DriverValidationStatusData;
    message?: string;
    error?: string;
    status?: number;
  }>,
  updateDriverOperationalStatus: (status: DriverOperationalStatusData['operationalStatus']) =>
    apiService.updateDriverOperationalStatus(status),
  getDriverActiveRide: () => apiService.getDriverActiveRide(),
  getNearbyDrivers: (lat: number, lon: number) => apiService.getNearbyDrivers(lat, lon),
  getActivePassengers: (lat: number, lon: number) => apiService.getActivePassengers(lat, lon),
  getAvailableTrips: (lat: number, lon: number) => apiService.getAvailableTrips(lat, lon),
};
