import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROFILE_PHOTO_PERSIST_DELAY_MS, PROFILE_PHOTO_STORAGE_KEY } from './constants';
import {
  getIsLoaded,
  getMemoryCache,
  getPersistTimeout,
  setIsLoaded,
  setPersistTimeout,
} from './state';

function parseCache(raw: string): Record<string, string> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return null;
  }
}

export async function loadProfilePhotoCache(): Promise<void> {
  if (getIsLoaded()) {
    return;
  }

  try {
    const raw = await AsyncStorage.getItem(PROFILE_PHOTO_STORAGE_KEY);
    if (raw) {
      const parsed = parseCache(raw);
      if (parsed) {
        const memoryCache = getMemoryCache();
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof key === 'string' && typeof value === 'string') {
            memoryCache.set(key, value);
          }
        }
      }
    }
  } catch (error) {
    console.warn('[ProfilePhotoCache] Erro ao carregar cache de fotos:', error);
  } finally {
    setIsLoaded(true);
  }
}

export function scheduleProfilePhotoPersist(): void {
  const existingTimeout = getPersistTimeout();
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeout = setTimeout(async () => {
    try {
      const serialized = JSON.stringify(Object.fromEntries(getMemoryCache()));
      await AsyncStorage.setItem(PROFILE_PHOTO_STORAGE_KEY, serialized);
    } catch (error) {
      console.warn('[ProfilePhotoCache] Erro ao persistir cache de fotos:', error);
    }
  }, PROFILE_PHOTO_PERSIST_DELAY_MS);

  setPersistTimeout(timeout);
}
