import { apiService, ApiResponse } from '@/services/api';
import { PRICING_CACHE_DURATION_MS, PRICING_MESSAGES } from './constants';
import { calculateEstimatedPriceValue } from './helpers';
import { parseTripPricingResponse, parseTripPricingSettings } from './schemas';
import { TripPricingSettings } from './types';

class PricingService {
  private cachedSettings: TripPricingSettings | null = null;
  private cacheTimestamp = 0;

  async getPricingSettings(useCache = true): Promise<ApiResponse<TripPricingSettings>> {
    if (
      useCache &&
      this.cachedSettings &&
      Date.now() - this.cacheTimestamp < PRICING_CACHE_DURATION_MS
    ) {
      return {
        success: true,
        data: this.cachedSettings,
      };
    }

    try {
      const response = await apiService.request('/admin/trip-pricing', { method: 'GET' });
      if (response.success && response.data) {
        const parsed = parseTripPricingResponse(response.data);
        this.cachedSettings = parsed.settings;
        this.cacheTimestamp = Date.now();
        return {
          success: true,
          data: parseTripPricingSettings(parsed.settings),
        };
      }

      return {
        success: false,
        error: response.error || PRICING_MESSAGES.FETCH_SETTINGS_ERROR,
        message: response.message || PRICING_MESSAGES.FETCH_SETTINGS_ERROR,
      };
    } catch (error) {
      console.error('[PricingService] Erro ao buscar configurações:', error);
      return {
        success: false,
        error: PRICING_MESSAGES.CONNECTION_ERROR,
        message: PRICING_MESSAGES.CONNECTION_ERROR_MESSAGE,
      };
    }
  }

  async calculateEstimatedPrice(
    distanceKm: number,
    durationSeconds: number,
    categoryMultiplier = 1.0,
    surgeMultiplier?: number
  ): Promise<ApiResponse<number>> {
    const settingsResponse = await this.getPricingSettings();
    if (!settingsResponse.success || !settingsResponse.data) {
      return {
        success: false,
        error: settingsResponse.error || 'Não foi possível obter configurações de pricing',
        message: settingsResponse.message,
      };
    }

    try {
      const price = calculateEstimatedPriceValue(settingsResponse.data, {
        distanceKm,
        durationSeconds,
        categoryMultiplier,
        surgeMultiplier,
      });
      return { success: true, data: price };
    } catch (error) {
      console.error('[PricingService] Erro ao calcular preço:', error);
      return {
        success: false,
        error: PRICING_MESSAGES.CALCULATE_PRICE_ERROR,
        message: PRICING_MESSAGES.CALCULATE_PRICE_MESSAGE,
      };
    }
  }

  clearCache(): void {
    this.cachedSettings = null;
    this.cacheTimestamp = 0;
  }
}

export const pricingService = new PricingService();
