import { apiService } from '@/services/api';
import {
  DEFAULT_COUNTRY,
  DEFAULT_LANGUAGE,
  DEFAULT_RADIUS_METERS,
} from './constants';
import {
  cacheReverseGeocodeAddress,
  clearReverseGeocodeCache,
  getCachedAddress,
  getCoordinatesCacheKey,
  loadCacheFromStorage,
  scheduleSaveCacheToStorage,
} from './cache';
import {
  mapAutocompleteToSearchResult,
  mapGeocodingToSearchResult,
  mapReverseGeocoding,
} from './mappers';
import {
  parseAutocompleteResponse,
  parseGeocodingResponse,
  parsePlaceDetailsResponse,
  parseQuotaStats,
  parseRateLimitStats,
} from './schemas';
import { getCurrentSessionToken, getSessionToken, resetSessionToken } from './session';
import {
  LocationBias,
  PlaceDetailsResponse,
  PlacesReverseResult,
  PlacesSearchResult,
  QuotaStats,
  RateLimitStats,
} from './types';

loadCacheFromStorage();

export const autocompletePlaces = async (
  input: string,
  location?: LocationBias,
  radius = DEFAULT_RADIUS_METERS,
  strictBounds = true,
  country = DEFAULT_COUNTRY,
  language = DEFAULT_LANGUAGE
): Promise<PlacesSearchResult[]> => {
  try {
    if (!input || input.trim().length < 2) {
      return [];
    }

    const requestBody: {
      input: string;
      radius: number;
      strictBounds: boolean;
      country: string;
      language: string;
      sessionToken: string;
      location?: { lat: number; lng: number; city?: string; state?: string };
    } = {
      input: input.trim(),
      radius,
      strictBounds,
      country,
      language,
      sessionToken: getSessionToken(),
    };

    if (location) {
      requestBody.location = {
        lat: location.lat,
        lng: location.lng,
        city: location.city,
        state: location.state,
      };
    }

    const response = await apiService.request('/places/autocomplete', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    if (!response.success || !response.data) {
      console.error('[Places] Erro no autocomplete:', response.error);
      return [];
    }

    const parsed = parseAutocompleteResponse(response.data);
    return parsed.predictions.map(mapAutocompleteToSearchResult);
  } catch (error) {
    console.error('[Places] Erro ao buscar autocomplete:', error);
    return [];
  }
};

export const geocode = async (
  address: string,
  country = DEFAULT_COUNTRY,
  language = DEFAULT_LANGUAGE
): Promise<PlacesSearchResult[]> => {
  try {
    if (!address || address.trim().length === 0) {
      return [];
    }

    const response = await apiService.request('/places/geocode', {
      method: 'POST',
      body: JSON.stringify({ address: address.trim(), country, language }),
    });
    if (!response.success || !response.data) {
      console.error('[Places] Erro no geocoding:', response.error);
      return [];
    }

    const parsed = parseGeocodingResponse(response.data);
    return parsed.results.map(mapGeocodingToSearchResult);
  } catch (error) {
    console.error('[Places] Erro ao fazer geocoding:', error);
    return [];
  }
};

export const reverseGeocode = async (
  lat: number,
  lon: number,
  language = DEFAULT_LANGUAGE
): Promise<PlacesReverseResult | null> => {
  try {
    const cacheKey = getCoordinatesCacheKey(lat, lon);
    const cachedAddress = getCachedAddress(lat, lon);
    if (cachedAddress) {
      return mapReverseGeocoding(cacheKey, cachedAddress, lat, lon, 'geocode');
    }

    const response = await apiService.request('/places/reverse-geocode', {
      method: 'POST',
      body: JSON.stringify({ lat, lng: lon, language }),
    });
    if (!response.success || !response.data) {
      console.error('[Places] Erro no reverse geocoding:', response.error);
      return null;
    }

    const parsed = parseGeocodingResponse(response.data);
    if (parsed.results.length === 0) {
      return null;
    }

    const result = parsed.results[0];
    cacheReverseGeocodeAddress(lat, lon, result.formattedAddress);
    scheduleSaveCacheToStorage();

    return mapReverseGeocoding(
      result.placeId,
      result.formattedAddress,
      result.lat,
      result.lng,
      result.locationType
    );
  } catch (error) {
    console.error('[Places] Erro ao fazer reverse geocoding:', error);
    return null;
  }
};

export { getCachedAddress, clearReverseGeocodeCache, resetSessionToken };

export const getPlaceDetails = async (
  placeId: string,
  language = DEFAULT_LANGUAGE,
  sessionToken?: string
): Promise<PlaceDetailsResponse | null> => {
  try {
    if (!placeId) {
      return null;
    }

    const tokenFromSession = getCurrentSessionToken();
    const requestBody: { placeId: string; language: string; sessionToken?: string } = {
      placeId,
      language,
      sessionToken: sessionToken || tokenFromSession || undefined,
    };

    const response = await apiService.request('/places/details', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    if (!response.success || !response.data) {
      console.error('[Places] Erro ao buscar detalhes:', response.error);
      return null;
    }

    return parsePlaceDetailsResponse(response.data);
  } catch (error) {
    console.error('[Places] Erro ao buscar detalhes do lugar:', error);
    return null;
  }
};

export const searchPlaces = async (
  query: string,
  location?: LocationBias,
  radius = DEFAULT_RADIUS_METERS,
  strictBounds = true
): Promise<PlacesSearchResult[]> => {
  return autocompletePlaces(query, location, radius, strictBounds, DEFAULT_COUNTRY, DEFAULT_LANGUAGE);
};

export const getQuotaStats = async (): Promise<QuotaStats | null> => {
  try {
    const response = await apiService.request('/places/quota', { method: 'GET' });
    if (!response.success || !response.data) {
      console.error('[Places] Erro ao buscar quota:', response.error);
      return null;
    }
    return parseQuotaStats(response.data);
  } catch (error) {
    console.error('[Places] Erro ao buscar quota:', error);
    return null;
  }
};

export const getRateLimit = async (): Promise<RateLimitStats | null> => {
  try {
    const response = await apiService.request('/places/rate-limit', { method: 'GET' });
    if (!response.success || !response.data) {
      console.error('[Places] Erro ao buscar rate limit:', response.error);
      return null;
    }
    return parseRateLimitStats(response.data);
  } catch (error) {
    console.error('[Places] Erro ao buscar rate limit:', error);
    return null;
  }
};
