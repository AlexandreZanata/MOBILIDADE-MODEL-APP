export interface ProfileImageCacheEntry {
  localUri: string;
  timestamp: number;
  apiUrl: string;
}

export type ProfileImageCacheMap = Map<string, ProfileImageCacheEntry>;
