import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_EXPIRATION_MS, REVERSE_GEOCODE_CACHE_KEY } from './constants';
import { GeocodeCache } from './types';

const reverseGeocodeMemoryCache = new Map<string, GeocodeCache>();
let saveCacheTimeout: ReturnType<typeof setTimeout> | null = null;

export function getCoordinatesCacheKey(lat: number, lng: number): string {
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  return `${roundedLat},${roundedLng}`;
}

export async function loadCacheFromStorage(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(REVERSE_GEOCODE_CACHE_KEY);
    if (!cached) return;

    const parsed = JSON.parse(cached) as Record<string, GeocodeCache>;
    const now = Date.now();
    Object.entries(parsed).forEach(([key, value]) => {
      if (now - value.timestamp < CACHE_EXPIRATION_MS) {
        reverseGeocodeMemoryCache.set(key, value);
      }
    });
  } catch (error) {
    console.error('[Places] Erro ao carregar cache do storage:', error);
  }
}

export function scheduleSaveCacheToStorage(): void {
  if (saveCacheTimeout) {
    clearTimeout(saveCacheTimeout);
  }

  saveCacheTimeout = setTimeout(async () => {
    try {
      const cacheObject: Record<string, GeocodeCache> = {};
      reverseGeocodeMemoryCache.forEach((value, key) => {
        cacheObject[key] = value;
      });
      await AsyncStorage.setItem(REVERSE_GEOCODE_CACHE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('[Places] Erro ao salvar cache no storage:', error);
    }
  }, 2000);
}

export function getCachedAddress(lat: number, lon: number): string | null {
  const cacheKey = getCoordinatesCacheKey(lat, lon);
  const cachedResult = reverseGeocodeMemoryCache.get(cacheKey);
  if (!cachedResult) {
    return null;
  }

  const now = Date.now();
  if (now - cachedResult.timestamp < CACHE_EXPIRATION_MS) {
    return cachedResult.address;
  }

  reverseGeocodeMemoryCache.delete(cacheKey);
  return null;
}

export function cacheReverseGeocodeAddress(lat: number, lon: number, address: string): void {
  reverseGeocodeMemoryCache.set(getCoordinatesCacheKey(lat, lon), {
    address,
    timestamp: Date.now(),
  });
}

export async function clearReverseGeocodeCache(): Promise<void> {
  reverseGeocodeMemoryCache.clear();
  await AsyncStorage.removeItem(REVERSE_GEOCODE_CACHE_KEY);
}
