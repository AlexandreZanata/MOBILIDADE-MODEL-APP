/**
 * Serviço completo de Trips para gerenciamento de corridas
 * Implementa todas as rotas documentadas no api.json
 * Seguindo as especificações do frontendguide.txt
 */

import { apiService, ApiResponse } from './api';

// Tipos
export interface TripCategory {
  id: string;
  name: string;
  description?: string;
  price_multiplier: number | string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TripEstimate {
  distance_km: number;
  duration_seconds: number;
  final_fare: number;
  minimum_fare: number;
  category_multiplier?: number;
  surge_multiplier?: number;
}

export interface Trip {
  id: string;
  status: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  estimated_fare: number;
  final_fare?: number;
  distance_km?: number;
  duration_seconds?: number;
  category?: TripCategory;
  driver_id?: string;
  passenger_id?: string;
  driver_snapshot?: {
    name: string;
    rating?: number;
    vehicle?: {
      brand: string;
      model: string;
      plate: string;
      color: string;
    };
    location?: {
      lat: number;
      lng: number;
    };
  };
  passenger_snapshot?: {
    id: string;
    name: string;
    rating?: number;
    phone?: string;
  };
  payment_method_id?: string;
  payment_brand_id?: string;
  created_at?: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  assignment_expires_at?: string;
}

export interface CreateTripRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  trip_category_id: string;
  payment_method_id: string;
  payment_brand_id?: string;
}

export interface CategoryEstimate {
  category: TripCategory;
  estimate: TripEstimate;
}

export interface CategoriesWithEstimateResponse {
  estimateId: string;
  categories: CategoryEstimate[];
}

class TripsService {
  /**
   * Lista categorias de trip com estimativa de preço (NOVA API)
   * POST /v1/passengers/fare-estimate
   * Retorna as categorias mapeadas e o estimateId
   */
  async getCategoriesWithEstimate(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    surgeMultiplier?: number
  ): Promise<ApiResponse<CategoriesWithEstimateResponse>> {
    try {
      const response = await apiService.fareEstimate(origin, destination);

      if (response.success && response.data) {
        // A nova API retorna: { estimateId, categories: [...] }
        const estimateId = response.data.estimateId;
        const categories = response.data.categories || [];

        // Mapeia o formato da nova API para o formato esperado
        const mappedCategories: CategoryEstimate[] = categories.map((cat: any) => ({
          category: {
            id: cat.categoryId,
            name: cat.categoryName,
            slug: cat.categorySlug,
            price_multiplier: 1.0, // Não vem na resposta, mas pode ser calculado
            active: true,
          },
          estimate: {
            distance_km: cat.distanceKm,
            duration_seconds: cat.durationMinutes ? cat.durationMinutes * 60 : 0,
            final_fare: cat.estimatedPrice,
            minimum_fare: cat.estimatedPrice * 0.7, // Estimativa
            surge_multiplier: cat.surge,
          },
        }));

        return {
          success: true,
          data: {
            estimateId: estimateId || '',
            categories: mappedCategories,
          },
        };
      }

      return {
        success: false,
        error: response.error || 'Erro ao buscar categorias com estimativa',
        message: response.message || 'Erro ao buscar categorias com estimativa',
      };
    } catch (error) {
      console.error('[TripsService] Erro ao buscar categorias com estimativa:', error);
      return {
        success: false,
        error: 'Erro de conexão',
        message: 'Não foi possível conectar ao servidor',
      };
    }
  }

  /**
   * Calcula preço estimado de uma corrida
   * POST /trips/estimate
   * Conforme frontendguide.txt seção 2.1
   */
  async estimateTrip(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    tripCategoryId: string,
    surgeMultiplier?: number
  ): Promise<ApiResponse<TripEstimate>> {
    return apiService.request<TripEstimate>('/trips/estimate', {
      method: 'POST',
      body: JSON.stringify({
        origin,
        destination,
        trip_category_id: tripCategoryId,
        surge_multiplier: surgeMultiplier,
      }),
    });
  }

  /**
   * Solicita uma nova corrida (NOVA API)
   * POST /v1/passengers/rides
   */
  async createTrip(request: CreateTripRequest & { estimateId?: string }): Promise<ApiResponse<Trip>> {
    // Se não tem estimateId, precisa fazer a estimativa primeiro
    if (!request.estimateId) {
      // Faz estimativa para obter o estimateId
      const estimateResponse = await apiService.fareEstimate(
        request.origin,
        request.destination
      );

      if (!estimateResponse.success || !estimateResponse.data?.estimateId) {
        return {
          success: false,
          error: 'Erro ao obter estimativa',
          message: 'Não foi possível obter a estimativa de preço',
        };
      }

      request.estimateId = estimateResponse.data.estimateId;
    }

    // Garante que estimateId existe antes de criar a corrida
    if (!request.estimateId) {
      return {
        success: false,
        error: 'estimateId é obrigatório',
        message: 'Não foi possível obter o ID da estimativa',
      };
    }

    // Cria a corrida usando a nova API
    const response = await apiService.createRide(
      request.estimateId,
      request.trip_category_id,
      request.payment_method_id,
      request.payment_brand_id
    );

    if (response.success && response.data) {
      // Mapeia a resposta da nova API para o formato Trip esperado
      const rideData = response.data;
      const mappedTrip: Trip = {
        id: rideData.id,
        status: rideData.status || 'PENDING',
        origin: request.origin,
        destination: request.destination,
        estimated_fare: rideData.estimatedPrice ?? 0,
        final_fare: rideData.finalPrice,
        distance_km: rideData.distanceKm,
        duration_seconds: rideData.durationMinutes ? rideData.durationMinutes * 60 : undefined,
        driver_id: rideData.driverId,
        passenger_id: rideData.passengerId,
        payment_method_id: rideData.paymentMethodId,
        payment_brand_id: rideData.cardBrandId,
        created_at: rideData.createdAt || rideData.requestedAt,
      };

      return {
        success: true,
        data: mappedTrip,
      };
    }

    return {
      success: response.success,
      error: response.error,
      message: response.message,
      status: response.status,
    };
  }


  /**
   * Cancela uma corrida
   * @deprecated Esta rota está retornando erro 500. Verifique a documentação da API para a rota correta.
   * Conforme frontendguide.txt seção 2.8 (rota pode ter mudado ou não existir mais)
   */
  async cancelTrip(tripId: string, reason?: string): Promise<ApiResponse<void>> {
    console.warn('[TripsService] cancelTrip() - Esta rota pode não existir ou estar com problemas. Verifique a documentação da API.');
    // Mantém a implementação mas avisa que pode não funcionar
    return apiService.request<void>(`/trips/${tripId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({
        reason: reason || null,
      }),
    });
  }

  /**
   * Avalia motorista após corrida
   * POST /trips/{id}/rating
   * Conforme frontendguide.txt seção 2.9
   */
  async rateTrip(tripId: string, rating: number, comment?: string): Promise<ApiResponse<void>> {
    return apiService.request<void>(`/trips/${tripId}/rating`, {
      method: 'POST',
      body: JSON.stringify({
        rating,
        comment: comment || null,
      }),
    });
  }

  /**
   * Atualiza status da corrida (motorista)
   * @deprecated Esta rota não existe mais. Use os endpoints específicos do motorista:
   * - driverRideOnTheWay()
   * - driverRideNearby()
   * - driverRideArrived()
   * - driverRideBoarded()
   * - driverRideInRoute()
   * - driverRideNearDestination()
   * - driverRideComplete()
   * Conforme documentação WebSocket_cliente.txt seção "Endpoints REST para Motoristas Gerenciarem Corridas"
   */
  async updateTripStatus(
    tripId: string,
    status: string,
    reason?: string
  ): Promise<ApiResponse<Trip>> {
    console.warn('[TripsService] updateTripStatus() está deprecado. Use os endpoints específicos do motorista.');
    return {
      success: false,
      error: 'Rota removida',
      message: 'A rota /trips/{id}/status foi removida. Use os endpoints específicos do motorista conforme documentação WebSocket_cliente.txt.',
    };
  }


  /**
   * Aceita corrida atribuída
   * @deprecated Esta rota não existe mais. Use WebSocket para aceitar corridas via respondToRideOffer()
   * A aceitação de corridas agora é feita via WebSocket conforme documentação WebSocket_cliente.txt
   */
  async acceptTrip(tripId: string): Promise<ApiResponse<Trip>> {
    console.warn('[TripsService] acceptTrip() está deprecado. Use WebSocket para aceitar corridas.');
    return {
      success: false,
      error: 'Rota removida',
      message: 'A rota /drivers/me/trips/{id}/accept foi removida. Use WebSocket para aceitar corridas.',
    };
  }

  /**
   * Obtém uma corrida por ID
   * NOTA: Esta rota não existe na API atual, método mantido para compatibilidade
   * A trip será atualizada via WebSocket ou outras rotas disponíveis
   */
  async getTrip(tripId: string): Promise<ApiResponse<Trip>> {
    // Rota GET /v1/trips/{id} não existe na API, retorna erro
    return {
      success: false,
      error: 'Rota não disponível',
      message: 'A rota GET /v1/trips/{id} não está disponível na API. Use WebSocket ou outras rotas disponíveis.',
    };
  }

  /**
   * Lista categorias de trip (público ou admin)
   * GET /admin/trip-categories ou GET /trips/categories
   */
  async getTripCategories(activeOnly: boolean = true): Promise<ApiResponse<TripCategory[]>> {
    // Tenta endpoint público primeiro
    let response = await apiService.request<any>('/trips/categories', {
      method: 'GET',
    });

    // Se não existir, tenta endpoint admin
    if (!response.success) {
      const queryParam = activeOnly ? '?active_only=true' : '';
      response = await apiService.request<any>(`/admin/trip-categories${queryParam}`, {
        method: 'GET',
      });
    }

    if (response.success && response.data) {
      // Formata resposta para array de categorias
      let categories: TripCategory[] = [];

      if (Array.isArray(response.data)) {
        categories = response.data;
      } else if (response.data.categories && Array.isArray(response.data.categories)) {
        categories = response.data.categories;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        categories = response.data.data;
      }

      return {
        success: true,
        data: categories,
      };
    }

    return {
      success: false,
      error: response.error || 'Erro ao buscar categorias',
      message: response.message || 'Erro ao buscar categorias',
    };
  }
}

// Exporta instância singleton
export const tripsService = new TripsService();
