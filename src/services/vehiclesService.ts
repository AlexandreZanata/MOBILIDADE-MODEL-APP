/**
 * Serviço de Veículos para Motoristas
 * Implementa endpoints de gerenciamento de veículos
 */

import { apiService, ApiResponse } from './api';

// Tipos
export interface VehicleBrand {
  id: string;
  name: string;
  slug?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleModel {
  id: string;
  brandId: string;
  name: string;
  slug?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: string;
  driver_id: string;
  brand_id: string;
  model_id: string;
  year: number;
  plate: string;
  color: string;
  document_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  brand?: VehicleBrand;
  model?: VehicleModel;
}

export interface CreateVehicleData {
  brand_id: string;
  model_id: string;
  year: number;
  plate: string;
  color: string;
}

// Parâmetros de paginação e busca
export interface VehicleSearchParams {
  cursor?: string;
  limit?: number;
  sort?: string;
  q?: string;
}

// Resposta paginada
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
}

class VehiclesService {
  /**
   * Lista marcas de veículos
   * GET /v1/drivers/vehicle-brands
   * @param params - Parâmetros de busca e paginação
   */
  async getBrands(params?: VehicleSearchParams): Promise<ApiResponse<PaginatedResponse<VehicleBrand>>> {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.q) queryParams.append('q', params.q);

    const queryString = queryParams.toString();
    const url = `/drivers/vehicle-brands${queryString ? `?${queryString}` : ''}`;

    return apiService.request<PaginatedResponse<VehicleBrand>>(url, {
      method: 'GET',
    });
  }

  /**
   * Lista modelos de veículos (busca geral)
   * GET /v1/drivers/vehicle-models
   * @param params - Parâmetros de busca e paginação
   */
  async getModels(params?: VehicleSearchParams): Promise<ApiResponse<PaginatedResponse<VehicleModel>>> {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.q) queryParams.append('q', params.q);

    const queryString = queryParams.toString();
    const url = `/drivers/vehicle-models${queryString ? `?${queryString}` : ''}`;

    return apiService.request<PaginatedResponse<VehicleModel>>(url, {
      method: 'GET',
    });
  }

  /**
   * Lista modelos de veículos por marca
   * GET /v1/drivers/vehicle-models/brand/{brandId}
   * @param brandId - ID da marca
   * @param params - Parâmetros de busca e paginação
   */
  async getModelsByBrand(brandId: string, params?: VehicleSearchParams): Promise<ApiResponse<PaginatedResponse<VehicleModel>>> {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.q) queryParams.append('q', params.q);

    const queryString = queryParams.toString();
    const url = `/drivers/vehicle-models/brand/${brandId}${queryString ? `?${queryString}` : ''}`;

    return apiService.request<PaginatedResponse<VehicleModel>>(url, {
      method: 'GET',
    });
  }

  /**
   * Lista veículos do motorista autenticado
   * GET /v1/drivers/vehicles (endpoint pode não existir na nova API, usar apiService quando disponível)
   */
  async getMyVehicles(): Promise<ApiResponse<Vehicle[]>> {
    // Nota: Este endpoint pode não existir na nova API
    // Se não existir, retorna array vazio ou implementa alternativa
    return apiService.request<Vehicle[]>('/drivers/vehicles', {
      method: 'GET',
    }).catch(() => {
      return {
        success: true,
        data: [],
      };
    });
  }

  /**
   * Cadastra novo veículo
   * POST /v1/drivers/vehicles (endpoint pode não existir na nova API, usar apiService quando disponível)
   */
  async createVehicle(vehicleData: CreateVehicleData): Promise<ApiResponse<Vehicle>> {
    return apiService.request<Vehicle>('/drivers/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  }

  /**
   * Upload de documento do veículo (CRLV)
   * POST /v1/drivers/documents?documentType=VEHICLE_DOC&vehicleId={vehicleId}
   * @param vehicleId - ID do veículo
   * @param documentUri - URI do arquivo (ex: file:///path/to/file.pdf ou content://...)
   */
  async uploadVehicleDocument(vehicleId: string, documentUri: string): Promise<ApiResponse<any>> {
    return apiService.uploadDriverDocument('VEHICLE_DOC', documentUri, vehicleId);
  }
}

// Exporta instância singleton
export const vehiclesService = new VehiclesService();

