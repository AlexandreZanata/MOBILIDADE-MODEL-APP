import { TripPricingSettings } from './types';

export interface PriceCalculationParams {
  distanceKm: number;
  durationSeconds: number;
  categoryMultiplier: number;
  surgeMultiplier?: number;
}

export function calculateEstimatedPriceValue(
  settings: TripPricingSettings,
  params: PriceCalculationParams
): number {
  const baseFee = parseFloat(settings.base_fee || '0');
  const pricePerKm = parseFloat(settings.price_per_km || '0');
  const minimumFare = parseFloat(settings.minimum_fare || '10');
  const defaultSurgeMultiplier = parseFloat(settings.surge_multiplier || '1.0');
  const effectiveSurgeMultiplier = params.surgeMultiplier || defaultSurgeMultiplier;

  const basePrice = baseFee + params.distanceKm * pricePerKm;
  const priceWithSurge = basePrice * effectiveSurgeMultiplier;
  const finalPrice = priceWithSurge * params.categoryMultiplier;
  const estimatedPrice = Math.max(finalPrice, minimumFare);

  return Math.round(estimatedPrice * 100) / 100;
}
