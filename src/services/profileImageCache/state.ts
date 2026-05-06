import { ProfileImageCacheMap } from './types';

const memoryCache: ProfileImageCacheMap = new Map();
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export function getProfileImageMemoryCache(): ProfileImageCacheMap {
  return memoryCache;
}

export function getProfileImageIsLoaded(): boolean {
  return isLoaded;
}

export function setProfileImageIsLoaded(value: boolean): void {
  isLoaded = value;
}

export function getProfileImageLoadPromise(): Promise<void> | null {
  return loadPromise;
}

export function setProfileImageLoadPromise(promise: Promise<void> | null): void {
  loadPromise = promise;
}
