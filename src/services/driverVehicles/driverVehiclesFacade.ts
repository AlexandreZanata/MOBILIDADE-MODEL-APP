import {
  parseDriverServiceCategories,
  parseDriverVehicleBrands,
  parseDriverVehicleModels,
  parseDriverVehicleMutation,
  parseDriverVehiclesPage,
} from '@/models/driverVehicles/schemas';
import {
  DriverServiceCategory,
  DriverVehicleBrand,
  DriverVehicleModel,
  DriverVehiclesPage,
} from '@/models/driverVehicles/types';
import { DriverVehicleCreateInput, driverVehiclesService } from '@/services/driverVehicles/driverVehiclesService';

type ServiceErrorCode = 'REQUEST_FAILED' | 'VALIDATION_FAILED';

export interface DriverVehiclesError {
  message: string;
  status?: number;
  code: ServiceErrorCode;
}

export interface DriverVehiclesResult<TData> {
  success: boolean;
  data?: TData;
  error?: DriverVehiclesError;
}

function toError(message: string, status: number | undefined, code: ServiceErrorCode): DriverVehiclesError {
  return { message, status, code };
}

function requestFailed<TData>(message: string, status?: number): DriverVehiclesResult<TData> {
  return { success: false, error: toError(message, status, 'REQUEST_FAILED') };
}

function invalidPayload<TData>(message: string, status?: number): DriverVehiclesResult<TData> {
  return { success: false, error: toError(message, status, 'VALIDATION_FAILED') };
}

class DriverVehiclesFacade {
  async getVehicles(): Promise<DriverVehiclesResult<DriverVehiclesPage>> {
    const response = await driverVehiclesService.getVehicles();
    if (!response.success || !response.data) {
      return requestFailed(response.message ?? response.error ?? 'Falha ao carregar veiculos.', response.status);
    }

    try {
      return { success: true, data: parseDriverVehiclesPage(response.data) };
    } catch {
      return invalidPayload('Payload de veiculos invalido.', response.status);
    }
  }

  async getServiceCategories(): Promise<DriverVehiclesResult<DriverServiceCategory[]>> {
    const response = await driverVehiclesService.getServiceCategories();
    if (!response.success || !response.data) {
      return requestFailed(response.message ?? response.error ?? 'Falha ao carregar categorias.', response.status);
    }

    try {
      return { success: true, data: parseDriverServiceCategories(response.data) };
    } catch {
      return invalidPayload('Payload de categorias invalido.', response.status);
    }
  }

  async searchBrands(query: string): Promise<DriverVehiclesResult<DriverVehicleBrand[]>> {
    const response = await driverVehiclesService.searchBrands(query);
    if (!response.success || !response.data) {
      return requestFailed(response.message ?? response.error ?? 'Falha ao buscar marcas.', response.status);
    }

    try {
      return { success: true, data: parseDriverVehicleBrands(response.data).items };
    } catch {
      return invalidPayload('Payload de marcas invalido.', response.status);
    }
  }

  async searchModels(query: string, brandId?: string): Promise<DriverVehiclesResult<DriverVehicleModel[]>> {
    const response = brandId
      ? await driverVehiclesService.searchModelsByBrand(brandId, query)
      : await driverVehiclesService.searchModels(query);
    if (!response.success || !response.data) {
      return requestFailed(response.message ?? response.error ?? 'Falha ao buscar modelos.', response.status);
    }

    try {
      return { success: true, data: parseDriverVehicleModels(response.data).items };
    } catch {
      return invalidPayload('Payload de modelos invalido.', response.status);
    }
  }

  async createVehicle(payload: DriverVehicleCreateInput): Promise<DriverVehiclesResult<{ message?: string }>> {
    const response = await driverVehiclesService.createVehicle(payload);
    if (!response.success) {
      return requestFailed(response.message ?? response.error ?? 'Falha ao cadastrar veiculo.', response.status);
    }

    try {
      return { success: true, data: parseDriverVehicleMutation(response.data) };
    } catch {
      return invalidPayload('Payload de criacao invalido.', response.status);
    }
  }

  async uploadVehicleDocument(vehicleId: string, fileUri: string): Promise<DriverVehiclesResult<{ message?: string }>> {
    const response = await driverVehiclesService.uploadVehicleDocument(vehicleId, fileUri);
    if (!response.success) {
      return requestFailed(response.message ?? response.error ?? 'Falha ao enviar documento.', response.status);
    }

    try {
      return { success: true, data: parseDriverVehicleMutation(response.data) };
    } catch {
      return invalidPayload('Payload de upload invalido.', response.status);
    }
  }
}

export const driverVehiclesFacade = new DriverVehiclesFacade();
