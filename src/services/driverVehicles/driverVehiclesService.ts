import { apiService } from '@/services/api';
import { vehiclesService } from '@/services/vehiclesService';

export interface DriverVehicleCreateInput {
  licensePlate: string;
  brandId: string;
  modelId: string;
  year: number;
  color: string;
  serviceCategoryId: string;
}

export class DriverVehiclesService {
  getVehicles() {
    return apiService.getDriverVehicles();
  }

  getServiceCategories() {
    return apiService.getDriverServiceCategories();
  }

  createVehicle(payload: DriverVehicleCreateInput) {
    return apiService.createDriverVehicle(payload);
  }

  uploadVehicleDocument(vehicleId: string, fileUri: string) {
    return apiService.uploadDriverDocument('VEHICLE_DOC', fileUri, vehicleId);
  }

  searchBrands(query: string) {
    return vehiclesService.getBrands({ q: query, limit: 20, sort: 'name' });
  }

  searchModels(query: string) {
    return vehiclesService.getModels({ q: query, limit: 20, sort: 'name' });
  }

  searchModelsByBrand(brandId: string, query: string) {
    return vehiclesService.getModelsByBrand(brandId, { q: query, limit: 20, sort: 'name' });
  }
}

export const driverVehiclesService = new DriverVehiclesService();
