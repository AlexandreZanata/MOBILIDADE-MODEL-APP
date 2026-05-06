import AsyncStorage from '@react-native-async-storage/async-storage';

import { User } from '@/models/User';
import { AUTH_KEYS } from '@/context/auth/constants';
import { pendingEmailSchema, userSchema } from '@/context/auth/schemas';

interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

interface HydratedAuthStorage {
  tokens: StoredTokens;
  user: User | null;
}

export async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken),
    AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

export async function removeAllAuthStorage(): Promise<void> {
  await Promise.all(Object.values(AUTH_KEYS).map((key) => AsyncStorage.removeItem(key)));
}

export async function loadHydratedAuthStorage(): Promise<HydratedAuthStorage> {
  const [accessToken, refreshToken, rawUser] = await Promise.all([
    AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN),
    AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN),
    AsyncStorage.getItem(AUTH_KEYS.USER_DATA),
  ]);

  return {
    tokens: { accessToken, refreshToken },
    user: parseStoredUser(rawUser),
  };
}

export async function storeUser(user: User): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(user)),
    AsyncStorage.setItem(AUTH_KEYS.USER_DATA_TS, String(Date.now())),
  ]);
}

export async function removePendingEmailVerification(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEYS.PENDING_EMAIL);
}

export async function storePendingEmailVerification(data: {
  email: string;
  userType: 'passenger' | 'driver';
}): Promise<void> {
  const parsed = pendingEmailSchema.parse(data);
  await AsyncStorage.setItem(AUTH_KEYS.PENDING_EMAIL, JSON.stringify(parsed));
}

export async function isUserCacheValid(ttlMs: number): Promise<boolean> {
  const ts = await AsyncStorage.getItem(AUTH_KEYS.USER_DATA_TS);
  if (!ts) return false;

  const parsedTs = Number.parseInt(ts, 10);
  if (Number.isNaN(parsedTs)) return false;

  return Date.now() - parsedTs < ttlMs;
}

function parseStoredUser(rawUser: string | null): User | null {
  if (!rawUser) return null;
  try {
    const parsedJson: unknown = JSON.parse(rawUser);
    const parsed = userSchema.safeParse(parsedJson);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
