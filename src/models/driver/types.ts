export interface DriverLocationParam {
  lat: number;
  lon: number;
}

export interface DriverRouteParams {
  userLocation?: DriverLocationParam;
}

export interface DriverInfoItem {
  icon: 'car' | 'document-text' | 'color-fill' | 'location' | 'time' | 'cash';
  label: string;
  value: string;
}

export interface DriverViewData {
  driverName: string;
  ratingText: string;
  vehicleTitle: string;
  deliveryTitle: string;
  vehicleItems: DriverInfoItem[];
  deliveryItems: DriverInfoItem[];
  rejectButtonText: string;
  acceptButtonText: string;
}
