import { apiService, ApiResponse } from '../api';
import { VEHICLE_DOCUMENT_TYPE, VEHICLES_ENDPOINTS } from './constants';
import { buildVehicleSearchQuery } from './helpers';
import {
  CreateVehicleData,
  PaginatedResponse,
  Vehicle,
  VehicleBrand,
  VehicleModel,
  VehicleSearchParams,
} from './types';

export class VehiclesService {
  async getBrands(
    params?: VehicleSearchParams
  ): Promise<ApiResponse<PaginatedResponse<VehicleBrand>>> {
    return apiService.request<PaginatedResponse<VehicleBrand>>(
      `${VEHICLES_ENDPOINTS.BRANDS}${buildVehicleSearchQuery(params)}`,
      { method: 'GET' }
    );
  }

  async getModels(
    params?: VehicleSearchParams
  ): Promise<ApiResponse<PaginatedResponse<VehicleModel>>> {
    return apiService.request<PaginatedResponse<VehicleModel>>(
      `${VEHICLES_ENDPOINTS.MODELS}${buildVehicleSearchQuery(params)}`,
      { method: 'GET' }
    );
  }

  async getModelsByBrand(
    brandId: string,
    params?: VehicleSearchParams
  ): Promise<ApiResponse<PaginatedResponse<VehicleModel>>> {
    return apiService.request<PaginatedResponse<VehicleModel>>(
      `${VEHICLES_ENDPOINTS.MODELS_BY_BRAND}/${brandId}${buildVehicleSearchQuery(params)}`,
      { method: 'GET' }
    );
  }

  async getMyVehicles(): Promise<ApiResponse<Vehicle[]>> {
    return apiService
      .request<Vehicle[]>(VEHICLES_ENDPOINTS.VEHICLES, { method: 'GET' })
      .catch(() => ({
        success: true,
        data: [],
      }));
  }

  async createVehicle(vehicleData: CreateVehicleData): Promise<ApiResponse<Vehicle>> {
    return apiService.request<Vehicle>(VEHICLES_ENDPOINTS.VEHICLES, {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  }

  async uploadVehicleDocument(
    vehicleId: string,
    documentUri: string
  ): Promise<ApiResponse<unknown>> {
    return apiService.uploadDriverDocument(VEHICLE_DOCUMENT_TYPE, documentUri, vehicleId);
  }
}
