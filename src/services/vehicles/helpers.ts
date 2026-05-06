import { VehicleSearchParams } from './types';

export function buildVehicleSearchQuery(params?: VehicleSearchParams): string {
  if (!params) {
    return '';
  }

  const queryParams = new URLSearchParams();

  if (params.cursor) {
    queryParams.append('cursor', params.cursor);
  }

  if (typeof params.limit === 'number') {
    queryParams.append('limit', String(params.limit));
  }

  if (params.sort) {
    queryParams.append('sort', params.sort);
  }

  if (params.q) {
    queryParams.append('q', params.q);
  }

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}
