/**
 * Serviço de roteamento usando a nova API
 * Substitui chamadas diretas ao OSRM pela API protegida
 */

import { apiService, ApiResponse } from './api';
import { RoutePoint } from '@/components/TileMap';

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

class RoutingService {
  // Distância mínima em metros para calcular rota (API requer mínimo de 50m)
  private readonly MIN_DISTANCE_METERS = 50;

  /**
   * Calcula a distância em metros entre dois pontos usando a fórmula de Haversine
   */
  private calculateDistance(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number }
  ): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
    const dLon = ((destination.lon - origin.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origin.lat * Math.PI) / 180) *
        Math.cos((destination.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Valida se a distância entre origem e destino é suficiente para calcular rota
   */
  private validateDistance(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number }
  ): { valid: boolean; distance?: number; error?: string } {
    const distance = this.calculateDistance(origin, destination);

    if (distance < this.MIN_DISTANCE_METERS) {
      return {
        valid: false,
        distance,
        error: `Origem e destino muito próximos (${Math.round(distance)}m, mínimo ${this.MIN_DISTANCE_METERS}m)`,
      };
    }

    return { valid: true, distance };
  }

  /**
   * Calcula rota entre dois pontos (POST)
   * POST /v1/routing/route
   */
  async calculateRoute(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number },
    options?: {
      includeSteps?: boolean;
      includeGeometry?: boolean;
    }
  ): Promise<ApiResponse<RouteResponse>> {
    try {
      // Valida distância antes de fazer a requisição
      const validation = this.validateDistance(origin, destination);
      if (!validation.valid) {
        if (__DEV__) {
          console.log(
            `[RoutingService] Distância muito pequena (${validation.distance?.toFixed(2)}m), não calculando rota`
          );
        }
        return {
          success: false,
          error: validation.error || 'Distância muito pequena',
          message: validation.error || 'Origem e destino muito próximos para calcular rota.',
        };
      }

      const request: RouteRequest = {
        originLat: origin.lat,
        originLng: origin.lon,
        destinationLat: destination.lat,
        destinationLng: destination.lon,
        includeSteps: options?.includeSteps ?? false,
        includeGeometry: options?.includeGeometry ?? true, // Sempre inclui geometria para desenhar no mapa
      };

      const response = await apiService.request<RouteResponse>('/routing/route', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      return response;
    } catch (error) {
      console.error('[RoutingService] Erro ao calcular rota:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Não foi possível calcular a rota.',
      };
    }
  }

  /**
   * Calcula rota entre dois pontos (GET)
   * GET /v1/routing/route?originLat=...&originLng=...&destinationLat=...&destinationLng=...
   */
  async calculateRouteGet(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number },
    options?: {
      includeSteps?: boolean;
      includeGeometry?: boolean;
    }
  ): Promise<ApiResponse<RouteResponse>> {
    try {
      // Valida distância antes de fazer a requisição
      const validation = this.validateDistance(origin, destination);
      if (!validation.valid) {
        if (__DEV__) {
          console.log(
            `[RoutingService] Distância muito pequena (${validation.distance?.toFixed(2)}m), não calculando rota (GET)`
          );
        }
        return {
          success: false,
          error: validation.error || 'Distância muito pequena',
          message: validation.error || 'Origem e destino muito próximos para calcular rota.',
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

      const response = await apiService.request<RouteResponse>(
        `/routing/route?${params.toString()}`,
        {
          method: 'GET',
        }
      );

      return response;
    } catch (error) {
      console.error('[RoutingService] Erro ao calcular rota (GET):', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Não foi possível calcular a rota.',
      };
    }
  }

  /**
   * Calcula rota de forma assíncrona
   * POST /v1/routing/route/async
   */
  async calculateRouteAsync(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number },
    options?: {
      includeSteps?: boolean;
      includeGeometry?: boolean;
      correlationId?: string;
    }
  ): Promise<ApiResponse<{ correlationId: string; status: string; message: string }>> {
    try {
      // Valida distância antes de fazer a requisição
      const validation = this.validateDistance(origin, destination);
      if (!validation.valid) {
        if (__DEV__) {
          console.log(
            `[RoutingService] Distância muito pequena (${validation.distance?.toFixed(2)}m), não calculando rota (async)`
          );
        }
        return {
          success: false,
          error: validation.error || 'Distância muito pequena',
          message: validation.error || 'Origem e destino muito próximos para calcular rota.',
        };
      }

      const request: RouteRequest = {
        originLat: origin.lat,
        originLng: origin.lon,
        destinationLat: destination.lat,
        destinationLng: destination.lon,
        includeSteps: options?.includeSteps ?? false,
        includeGeometry: options?.includeGeometry ?? true,
      };

      const headers: Record<string, string> = {};
      if (options?.correlationId) {
        headers['X-Correlation-Id'] = options.correlationId;
      }

      const response = await apiService.request<{
        correlationId: string;
        status: string;
        message: string;
      }>('/routing/route/async', {
        method: 'POST',
        body: JSON.stringify(request),
        headers,
      });

      return response;
    } catch (error) {
      console.error('[RoutingService] Erro ao calcular rota (async):', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Não foi possível enfileirar o cálculo de rota.',
      };
    }
  }

  /**
   * Consulta rate limit
   * GET /v1/routing/rate-limit
   */
  async getRateLimit(): Promise<ApiResponse<RateLimitResponse>> {
    try {
      const response = await apiService.request<RateLimitResponse>('/routing/rate-limit', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('[RoutingService] Erro ao consultar rate limit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Não foi possível consultar o rate limit.',
      };
    }
  }

  /**
   * Converte resposta da API para RoutePoint[] (formato usado pelo TileMap)
   */
  convertRouteToRoutePoints(routeResponse: RouteResponse): RoutePoint[] {
    if (!routeResponse.geometry || routeResponse.geometry.type !== 'LineString') {
      return [];
    }

    const coordinates = routeResponse.geometry.coordinates;
    return coordinates.map((coord: number[]) => ({
      lon: coord[0],
      lat: coord[1],
    }));
  }

  /**
   * Calcula rota e retorna diretamente como RoutePoint[]
   * Método de conveniência que combina calculateRoute + convertRouteToRoutePoints
   */
  async calculateRouteAsPoints(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number }
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

    const points = this.convertRouteToRoutePoints(routeResponse.data);

    return {
      success: true,
      data: points,
    };
  }
}

export const routingService = new RoutingService();
export default routingService;

