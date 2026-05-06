import { getIsLoaded, getLoadPromise, getMemoryCache, setLoadPromise } from './state';
import { loadProfilePhotoCache, scheduleProfilePhotoPersist } from './storage';

export function getOrCreateProfilePhotoUrl(userId: string, builder: () => string): string {
  if (!userId) {
    return builder();
  }

  if (!getIsLoaded() && !getLoadPromise()) {
    setLoadPromise(loadProfilePhotoCache());
  }

  const memoryCache = getMemoryCache();
  const cached = memoryCache.get(userId);
  if (cached) {
    return cached;
  }

  const url = builder();
  memoryCache.set(userId, url);
  scheduleProfilePhotoPersist();

  return url;
}

export async function warmProfilePhotoCache(): Promise<void> {
  if (getIsLoaded()) {
    return;
  }

  const existingPromise = getLoadPromise();
  if (!existingPromise) {
    setLoadPromise(loadProfilePhotoCache());
  }

  const activePromise = getLoadPromise();
  if (activePromise) {
    await activePromise;
  }
}
