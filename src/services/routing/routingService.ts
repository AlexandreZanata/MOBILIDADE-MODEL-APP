import { RoutePoint } from '@/components/molecules/TileMap';
import { apiService, ApiResponse } from '@/services/api';
import { ROUTING_MESSAGES } from './constants';
import { buildRouteRequest, validateDistance } from './helpers';
import { parseRateLimitResponse, parseRouteResponse } from './schemas';
import {
  AsyncRouteOptions,
  Coordinates,
  RateLimitResponse,
  RouteOptions,
  RouteResponse,
} from './types';

type AsyncRouteResponse = { correlationId: string; status: string; message: string };

class RoutingService {
  async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    options?: RouteOptions
  ): Promise<ApiResponse<RouteResponse>> {
    try {
      const validation = validateDistance(origin, destination);
      if (!validation.valid) {
        if (__DEV__) {
          console.log(
            `[RoutingService] Distância muito pequena (${validation.distance?.toFixed(2)}m), não calculando rota`
          );
        }
        return {
          success: false,
          error: validation.error || 'Distância muito pequena',
          message: validation.error || ROUTING_MESSAGES.DISTANCE_TOO_SHORT,
        };
      }

      const request = buildRouteRequest(
        origin,
        destination,
        options?.includeSteps ?? false,
        options?.includeGeometry ?? true
      );
      const response = await apiService.request<RouteResponse>('/routing/route', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (!response.success || !response.data) {
        return response;
      }

      return {
        ...response,
        data: parseRouteResponse(response.data),
      };
    } catch (error) {
      console.error('[RoutingService] Erro ao calcular rota:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: ROUTING_MESSAGES.ROUTE_ERROR,
      };
    }
  }

  async calculateRouteGet(
    origin: Coordinates,
    destination: Coordinates,
    options?: RouteOptions
  ): Promise<ApiResponse<RouteResponse>> {
    try {
      const validation = validateDistance(origin, destination);
      if (!validation.valid) {
        if (__DEV__) {
          console.log(
            `[RoutingService] Distância muito pequena (${validation.distance?.toFixed(2)}m), não calculando rota (GET)`
          );
        }
        return {
          success: false,
          error: validation.error || 'Distância muito pequena',
          message: validation.error || ROUTING_MESSAGES.DISTANCE_TOO_SHORT,
        };
      }

      const params = new URLSearchParams({
        originLat: origin.lat.toString(),
        originLng: origin.lon.toString(),
        destinationLat: destination.lat.toString(),
        destinationLng: destination.lon.toString(),
      });

      if (options?.includeSteps !== undefined) {
        params.append('includeSteps', options.includeSteps.toString());
      }
      if (options?.includeGeometry !== undefined) {
        params.append('includeGeometry', (options.includeGeometry ?? true).toString());
      }

      const response = await apiService.request<RouteResponse>(`/routing/route?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.success || !response.data) {
        return response;
      }

      return {
        ...response,
        data: parseRouteResponse(response.data),
      };
    } catch (error) {
      console.error('[RoutingService] Erro ao calcular rota (GET):', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: ROUTING_MESSAGES.ROUTE_ERROR,
      };
    }
  }

  async calculateRouteAsync(
    origin: Coordinates,
    destination: Coordinates,
    options?: AsyncRouteOptions
  ): Promise<ApiResponse<AsyncRouteResponse>> {
    try {
      const validation = validateDistance(origin, destination);
      if (!validation.valid) {
        if (__DEV__) {
          console.log(
            `[RoutingService] Distância muito pequena (${validation.distance?.toFixed(2)}m), não calculando rota (async)`
          );
        }
        return {
          success: false,
          error: validation.error || 'Distância muito pequena',
          message: validation.error || ROUTING_MESSAGES.DISTANCE_TOO_SHORT,
        };
      }

      const request = buildRouteRequest(
        origin,
        destination,
        options?.includeSteps ?? false,
        options?.includeGeometry ?? true
      );
      const headers: Record<string, string> = {};
      if (options?.correlationId) {
        headers['X-Correlation-Id'] = options.correlationId;
      }

      return await apiService.request<AsyncRouteResponse>('/routing/route/async', {
        method: 'POST',
        body: JSON.stringify(request),
        headers,
      });
    } catch (error) {
      console.error('[RoutingService] Erro ao calcular rota (async):', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: ROUTING_MESSAGES.ROUTE_ASYNC_ERROR,
      };
    }
  }

  async getRateLimit(): Promise<ApiResponse<RateLimitResponse>> {
    try {
      const response = await apiService.request<RateLimitResponse>('/routing/rate-limit', {
        method: 'GET',
      });

      if (!response.success || !response.data) {
        return response;
      }

      return {
        ...response,
        data: parseRateLimitResponse(response.data),
      };
    } catch (error) {
      console.error('[RoutingService] Erro ao consultar rate limit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: ROUTING_MESSAGES.RATE_LIMIT_ERROR,
      };
    }
  }

  convertRouteToRoutePoints(routeResponse: RouteResponse): RoutePoint[] {
    if (!routeResponse.geometry || routeResponse.geometry.type !== 'LineString') {
      return [];
    }
    return routeResponse.geometry.coordinates.map((coord) => ({
      lon: coord[0],
      lat: coord[1],
    }));
  }

  async calculateRouteAsPoints(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<ApiResponse<RoutePoint[]>> {
    const routeResponse = await this.calculateRoute(origin, destination, {
      includeGeometry: true,
      includeSteps: false,
    });

    if (!routeResponse.success || !routeResponse.data) {
      return {
        success: false,
        error: routeResponse.error,
        message: routeResponse.message,
      };
    }

    return {
      success: true,
      data: this.convertRouteToRoutePoints(routeResponse.data),
    };
  }
}

export const routingService = new RoutingService();
export default routingService;
