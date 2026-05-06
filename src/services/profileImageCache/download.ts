import * as FileSystem from 'expo-file-system';
import { PROFILE_IMAGE_CACHE_DIR } from './constants';
import { getProfileImageMemoryCache } from './state';
import { ensureProfileImageCacheDir, saveProfileImageCache } from './storage';

export async function downloadAndCacheProfileImage(
  userId: string,
  apiUrl: string
): Promise<string | null> {
  try {
    await ensureProfileImageCacheDir();
    const localUri = `${PROFILE_IMAGE_CACHE_DIR}${userId}.jpg`;
    const downloadResult = await FileSystem.downloadAsync(apiUrl, localUri);

    if (downloadResult.status !== 200 || !downloadResult.uri) {
      return null;
    }

    getProfileImageMemoryCache().set(userId, {
      localUri: downloadResult.uri,
      timestamp: Date.now(),
      apiUrl,
    });

    saveProfileImageCache().catch(() => {});

    if (__DEV__) {
      console.log('[ProfileImageCache] Imagem baixada e cacheada:', userId);
    }

    return downloadResult.uri;
  } catch (error) {
    console.warn('[ProfileImageCache] Erro ao baixar imagem:', error);
    return null;
  }
}
