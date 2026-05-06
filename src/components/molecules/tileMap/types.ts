export interface RoutePoint {
  lat: number;
  lon: number;
}

export interface Driver {
  id: string;
  lat: number;
  lon: number;
  type: 'car' | 'motorcycle';
  bearing?: number;
}

export interface TileMapProps {
  showRoute?: boolean;
  centerLat?: number;
  centerLon?: number;
  zoom?: number;
  route?: RoutePoint[];
  drivers?: Driver[];
  driverRoutes?: Map<string, RoutePoint[]>;
  driverLocation?: { lat: number; lon: number };
  userLocation?: { lat: number; lon: number };
  passengerLocation?: { lat: number; lon: number };
  destinationLocation?: { lat: number; lon: number };
  onMapMove?: () => void;
  bottomContainerHeight?: number;
  topSpaceHeight?: number;
  isLocating?: boolean;
  isDriver?: boolean;
  verticalCenterRatio?: number;
}

export interface TileMapRef {
  centerOnLocation: (lat: number, lon: number) => void;
}
