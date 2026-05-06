import { parseFareEstimateResponse } from '@/models/tripPrice/schemas';
import { TripCategoryOption, TripPriceLocation } from '@/models/tripPrice/types';
import { tripPriceService } from '@/services/tripPrice/tripPriceService';
import { ttp } from '@/i18n/tripPrice';

type TripPriceErrorCode = 'REQUEST_FAILED' | 'VALIDATION_FAILED';

export interface TripPriceError {
  message: string;
  status?: number;
  code: TripPriceErrorCode;
}

export interface TripPriceEstimateResult {
  success: boolean;
  data?: {
    estimateId: string;
    categories: TripCategoryOption[];
  };
  error?: TripPriceError;
}

function requestFailed(message: string, status?: number): TripPriceEstimateResult {
  return { success: false, error: { message, status, code: 'REQUEST_FAILED' } };
}

function invalidPayload(status?: number): TripPriceEstimateResult {
  return {
    success: false,
    error: { message: ttp('invalidCategories'), status, code: 'VALIDATION_FAILED' },
  };
}

class TripPriceFacade {
  async getCategoriesWithEstimate(origin: TripPriceLocation, destination: TripPriceLocation): Promise<TripPriceEstimateResult> {
    const response = await tripPriceService.fareEstimate(origin, destination);
    if (!response.success || !response.data) {
      return requestFailed(response.message ?? response.error ?? ttp('loadCategoriesFailed'), response.status);
    }

    try {
      const parsed = parseFareEstimateResponse(response.data);
      const categories: TripCategoryOption[] = parsed.categories.map((item) => ({
        id: item.categoryId,
        name: item.categoryName,
        description: item.categorySlug,
        finalFare: item.estimatedPrice,
        distanceKm: item.distanceKm,
        durationSeconds: item.durationMinutes * 60,
        priceMultiplier: item.surge,
        active: true,
      }));

      return {
        success: true,
        data: { estimateId: parsed.estimateId, categories },
      };
    } catch {
      return invalidPayload(response.status);
    }
  }
}

export const tripPriceFacade = new TripPriceFacade();
