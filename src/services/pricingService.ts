/**
 * Serviço de Pricing para cálculo de preços de corridas
 * Usa a rota /api/admin/trip-pricing para obter configurações
 */

import { apiService, ApiResponse } from './api';

// Tipos
export interface TripPricingSettings {
  id: string;
  minimum_fare: string; // Preço mínimo da corrida
  price_per_km: string; // Preço por quilômetro
  base_fee: string; // Taxa base
  surge_multiplier: string; // Multiplicador de demanda
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface TripPricingResponse {
  settings: TripPricingSettings;
}

class PricingService {
  private cachedSettings: TripPricingSettings | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtém as configurações de pricing da API
   * GET /api/admin/trip-pricing
   */
  async getPricingSettings(useCache: boolean = true): Promise<ApiResponse<TripPricingSettings>> {
    // Verifica cache se solicitado
    if (useCache && this.cachedSettings && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
      return {
        success: true,
        data: this.cachedSettings,
      };
    }

    try {
      const response = await apiService.request<TripPricingResponse>('/admin/trip-pricing', {
        method: 'GET',
      });

      if (response.success && response.data?.settings) {
        this.cachedSettings = response.data.settings;
        this.cacheTimestamp = Date.now();
        return {
          success: true,
          data: response.data.settings,
        };
      }

      return {
        success: false,
        error: response.error || 'Erro ao buscar configurações de pricing',
        message: response.message || 'Erro ao buscar configurações de pricing',
      };
    } catch (error) {
      console.error('[PricingService] Erro ao buscar configurações:', error);
      return {
        success: false,
        error: 'Erro de conexão',
        message: 'Não foi possível conectar ao servidor',
      };
    }
  }

  /**
   * Calcula o preço estimado de uma corrida baseado nas configurações
   * Usa a fórmula: (base_fee + (distance_km * price_per_km)) * surge_multiplier * category_multiplier
   * Sempre respeita o minimum_fare
   */
  async calculateEstimatedPrice(
    distanceKm: number,
    durationSeconds: number,
    categoryMultiplier: number = 1.0,
    surgeMultiplier?: number
  ): Promise<ApiResponse<number>> {
    // Busca configurações de pricing
    const settingsResponse = await this.getPricingSettings();

    if (!settingsResponse.success || !settingsResponse.data) {
      return {
        success: false,
        error: settingsResponse.error || 'Não foi possível obter configurações de pricing',
        message: settingsResponse.message,
      };
    }

    const settings = settingsResponse.data;

    try {
      // Converte strings para números
      const baseFee = parseFloat(settings.base_fee || '0');
      const pricePerKm = parseFloat(settings.price_per_km || '0');
      const minimumFare = parseFloat(settings.minimum_fare || '10');
      const defaultSurgeMultiplier = parseFloat(settings.surge_multiplier || '1.0');
      
      // Usa surge multiplier fornecido ou o padrão
      const effectiveSurgeMultiplier = surgeMultiplier || defaultSurgeMultiplier;

      // Calcula preço base
      // Fórmula: (base_fee + (distance_km * price_per_km)) * surge_multiplier * category_multiplier
      const basePrice = baseFee + (distanceKm * pricePerKm);
      const priceWithSurge = basePrice * effectiveSurgeMultiplier;
      const finalPrice = priceWithSurge * categoryMultiplier;

      // Garante que o preço final não seja menor que o mínimo
      const estimatedPrice = Math.max(finalPrice, minimumFare);

      // Arredonda para 2 casas decimais
      const roundedPrice = Math.round(estimatedPrice * 100) / 100;

      return {
        success: true,
        data: roundedPrice,
      };
    } catch (error) {
      console.error('[PricingService] Erro ao calcular preço:', error);
      return {
        success: false,
        error: 'Erro ao calcular preço estimado',
        message: 'Erro ao processar os dados de pricing',
      };
    }
  }

  /**
   * Limpa o cache de configurações
   */
  clearCache(): void {
    this.cachedSettings = null;
    this.cacheTimestamp = 0;
  }
}

// Exporta instância singleton
export const pricingService = new PricingService();
