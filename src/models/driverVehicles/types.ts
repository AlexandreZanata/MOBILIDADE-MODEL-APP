export type DriverVehicleStatus =
  | 'PENDING_DOCS'
  | 'AWAITING_VEHICLE'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | string;

export interface DriverVehicle {
  id: string;
  driverProfileId: string;
  serviceCategoryId: string | null;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  status: DriverVehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DriverServiceCategory {
  id: string;
  name: string;
  slug: string;
  baseFare: string;
  perKmRate: string;
  minFare: string;
}

export interface DriverVehicleBrand {
  id: string;
  name: string;
}

export interface DriverVehicleModel {
  id: string;
  name: string;
}

export interface DriverVehiclesPage {
  items: DriverVehicle[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

export interface DriverVehicleSearchPage<TItem> {
  items: TItem[];
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
}

export interface DriverVehicleMutation {
  message?: string;
}
