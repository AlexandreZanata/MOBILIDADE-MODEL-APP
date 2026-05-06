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

export interface VehicleSearchParams {
  cursor?: string;
  limit?: number;
  sort?: string;
  q?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
}
