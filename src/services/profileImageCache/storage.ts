import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PROFILE_IMAGE_CACHE_DIR,
  PROFILE_IMAGE_CACHE_VALIDITY_MS,
  PROFILE_IMAGE_STORAGE_KEY,
} from './constants';
import { getProfileImageMemoryCache, setProfileImageIsLoaded } from './state';
import { ProfileImageCacheEntry } from './types';

function isValidCacheEntry(value: unknown): value is ProfileImageCacheEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidateLocalUri = Reflect.get(value, 'localUri');
  const candidateTimestamp = Reflect.get(value, 'timestamp');
  const candidateApiUrl = Reflect.get(value, 'apiUrl');

  return (
    typeof candidateLocalUri === 'string' &&
    typeof candidateTimestamp === 'number' &&
    typeof candidateApiUrl === 'string'
  );
}

function parseCachePayload(raw: string): Record<string, ProfileImageCacheEntry> {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    return {};
  }

  const validEntries: Record<string, ProfileImageCacheEntry> = {};
  for (const [userId, value] of Object.entries(parsed)) {
    if (isValidCacheEntry(value)) {
      validEntries[userId] = value;
    }
  }

  return validEntries;
}

export async function ensureProfileImageCacheDir(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(PROFILE_IMAGE_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PROFILE_IMAGE_CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
    console.warn('[ProfileImageCache] Erro ao criar diretório de cache:', error);
  }
}

export async function saveProfileImageCache(): Promise<void> {
  try {
    const serialized = JSON.stringify(Object.fromEntries(getProfileImageMemoryCache()));
    await AsyncStorage.setItem(PROFILE_IMAGE_STORAGE_KEY, serialized);
  } catch (error) {
    console.warn('[ProfileImageCache] Erro ao salvar cache:', error);
  }
}

export async function loadProfileImageCache(): Promise<void> {
  const memoryCache = getProfileImageMemoryCache();
  try {
    await ensureProfileImageCacheDir();

    const raw = await AsyncStorage.getItem(PROFILE_IMAGE_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = parseCachePayload(raw);
    const now = Date.now();

    for (const [userId, cacheData] of Object.entries(parsed)) {
      if (now - cacheData.timestamp >= PROFILE_IMAGE_CACHE_VALIDITY_MS) {
        continue;
      }

      const fileInfo = await FileSystem.getInfoAsync(cacheData.localUri);
      if (fileInfo.exists) {
        memoryCache.set(userId, cacheData);
      }
    }

    if (Object.keys(parsed).length !== memoryCache.size) {
      await saveProfileImageCache();
    }
  } catch (error) {
    console.warn('[ProfileImageCache] Erro ao carregar cache:', error);
  } finally {
    setProfileImageIsLoaded(true);
  }
}
