import { RoutePoint } from '@/components/molecules/TileMap';

export interface RouteResponse {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  durationFormatted: string;
  cached?: boolean;
  calculatedAt?: string;
  steps?: RouteStep[];
  geometry?: RouteGeometry;
}

export interface RouteStep {
  distanceMeters: number;
  durationSeconds: number;
  instruction: string;
  name: string;
  maneuver: string;
}

export interface RouteGeometry {
  type: 'LineString';
  coordinates: number[][];
}

export interface RouteRequest {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  includeSteps?: boolean;
  includeGeometry?: boolean;
}

export interface RateLimitResponse {
  remaining: number;
  limit: number;
  resetAt: number;
  resetInSeconds: number;
}

export interface RouteOptions {
  includeSteps?: boolean;
  includeGeometry?: boolean;
}

export interface AsyncRouteOptions extends RouteOptions {
  correlationId?: string;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface DistanceValidationResult {
  valid: boolean;
  distance?: number;
  error?: string;
}

export interface RoutingServiceContract {
  calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    options?: RouteOptions
  ): Promise<import('@/services/api').ApiResponse<RouteResponse>>;
  calculateRouteGet(
    origin: Coordinates,
    destination: Coordinates,
    options?: RouteOptions
  ): Promise<import('@/services/api').ApiResponse<RouteResponse>>;
  calculateRouteAsync(
    origin: Coordinates,
    destination: Coordinates,
    options?: AsyncRouteOptions
  ): Promise<import('@/services/api').ApiResponse<{ correlationId: string; status: string; message: string }>>;
  getRateLimit(): Promise<import('@/services/api').ApiResponse<RateLimitResponse>>;
  convertRouteToRoutePoints(routeResponse: RouteResponse): RoutePoint[];
  calculateRouteAsPoints(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<import('@/services/api').ApiResponse<RoutePoint[]>>;
}
