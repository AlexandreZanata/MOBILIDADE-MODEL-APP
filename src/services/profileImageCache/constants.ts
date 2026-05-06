import * as FileSystem from 'expo-file-system';

export const PROFILE_IMAGE_STORAGE_KEY = '@vamu:profile_image_cache_v1';
export const PROFILE_IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory}profile-photos/`;
export const PROFILE_IMAGE_CACHE_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;
