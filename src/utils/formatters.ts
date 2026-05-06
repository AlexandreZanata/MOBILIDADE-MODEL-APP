import { th } from '@/i18n/home';

/**
 * Formats a numeric value as BRL currency.
 * @example formatPrice(13.84) → "R$ 13,84"
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formats a duration in seconds to a human-readable string.
 * @example formatDuration(300) → "5 min"
 * @example formatDuration(3900) → "1h 5min"
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} ${th('etaUnit')}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
