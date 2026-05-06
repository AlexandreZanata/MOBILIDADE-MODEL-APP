export const AUTH_KEYS = {
  ACCESS_TOKEN: '@app:access_token',
  REFRESH_TOKEN: '@app:refresh_token',
  USER_DATA: '@app:user_data',
  USER_DATA_TS: '@app:user_data_ts',
  PENDING_EMAIL: '@app:pending_email_verification',
} as const;

export const USER_CACHE_TTL_MS = 5 * 60 * 1000;
