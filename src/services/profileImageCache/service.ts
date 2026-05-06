import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PROFILE_IMAGE_CACHE_DIR,
  PROFILE_IMAGE_CACHE_VALIDITY_MS,
  PROFILE_IMAGE_STORAGE_KEY,
} from './constants';
import { downloadAndCacheProfileImage } from './download';
import {
  getProfileImageIsLoaded,
  getProfileImageLoadPromise,
  getProfileImageMemoryCache,
  setProfileImageLoadPromise,
} from './state';
import {
  ensureProfileImageCacheDir,
  loadProfileImageCache,
  saveProfileImageCache,
} from './storage';

async function ensureProfileImageCacheLoaded(): Promise<void> {
  if (!getProfileImageIsLoaded() && !getProfileImageLoadPromise()) {
    setProfileImageLoadPromise(loadProfileImageCache());
  }

  const promise = getProfileImageLoadPromise();
  if (promise) {
    await promise;
  }
}

export async function getProfileImageUrl(userId: string, apiUrl: string): Promise<string> {
  if (!userId) {
    return apiUrl;
  }

  await ensureProfileImageCacheLoaded();

  const memoryCache = getProfileImageMemoryCache();
  const cached = memoryCache.get(userId);
  const now = Date.now();

  if (cached && now - cached.timestamp < PROFILE_IMAGE_CACHE_VALIDITY_MS) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(cached.localUri);
      if (fileInfo.exists) {
        if (cached.apiUrl !== apiUrl) {
          downloadAndCacheProfileImage(userId, apiUrl).catch(() => {});
        }

        if (__DEV__) {
          console.log('[ProfileImageCache] Usando cache local:', userId);
        }

        return cached.localUri;
      }

      memoryCache.delete(userId);
      saveProfileImageCache().catch(() => {});
    } catch {
      memoryCache.delete(userId);
      saveProfileImageCache().catch(() => {});
    }
  }

  downloadAndCacheProfileImage(userId, apiUrl).catch(() => {});

  if (__DEV__) {
    console.log('[ProfileImageCache] Baixando em background, usando URL da API:', userId);
  }

  return apiUrl;
}

export async function clearProfileImageCache(userId: string): Promise<void> {
  try {
    const memoryCache = getProfileImageMemoryCache();
    const cached = memoryCache.get(userId);
    if (!cached) {
      return;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(cached.localUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(cached.localUri, { idempotent: true });
      }
    } catch (error) {
      console.warn('[ProfileImageCache] Erro ao deletar arquivo:', error);
    }

    memoryCache.delete(userId);
    await saveProfileImageCache();
  } catch (error) {
    console.warn('[ProfileImageCache] Erro ao limpar cache:', error);
  }
}

export async function clearAllProfileImageCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(PROFILE_IMAGE_CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(PROFILE_IMAGE_CACHE_DIR, { idempotent: true });
    }

    getProfileImageMemoryCache().clear();
    await AsyncStorage.removeItem(PROFILE_IMAGE_STORAGE_KEY);
    await ensureProfileImageCacheDir();
  } catch (error) {
    console.warn('[ProfileImageCache] Erro ao limpar todo o cache:', error);
  }
}

export async function warmProfileImageCache(): Promise<void> {
  if (getProfileImageIsLoaded()) {
    return;
  }

  if (!getProfileImageLoadPromise()) {
    setProfileImageLoadPromise(loadProfileImageCache());
  }

  const promise = getProfileImageLoadPromise();
  if (promise) {
    await promise;
  }
}
