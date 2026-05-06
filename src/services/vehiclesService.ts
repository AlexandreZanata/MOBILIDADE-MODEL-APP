import { VehiclesService } from './vehicles/service';

export type {
  CreateVehicleData,
  PaginatedResponse,
  Vehicle,
  VehicleBrand,
  VehicleModel,
  VehicleSearchParams,
} from './vehicles/types';

export const vehiclesService = new VehiclesService();

