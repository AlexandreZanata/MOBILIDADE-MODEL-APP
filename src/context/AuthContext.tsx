/**
 * @file AuthContext.tsx
 * @description Authentication context — manages session state, token persistence,
 * and profile hydration. All API calls go through AuthFacade.
 */

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { authFacade } from '@/services/facades/AuthFacade';
import { httpClient } from '@/services/http/httpClient';
import { User, sanitizeUserProfile } from '@/models/User';
import { UserRole, resolveProfileType } from '@/models/Auth';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  ACCESS_TOKEN: '@app:access_token',
  REFRESH_TOKEN: '@app:refresh_token',
  USER_DATA: '@app:user_data',
  USER_DATA_TS: '@app:user_data_ts',
  PENDING_EMAIL: '@app:pending_email_verification',
} as const;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Context shape ────────────────────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  error?: string;
  requiresEmailVerification?: boolean;
  email?: string;
  userType?: 'passenger' | 'driver';
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login(email: string, password: string): Promise<LoginResult>;
  logout(): Promise<void>;
  refreshAuth(): Promise<void>;
  refreshUserData(force?: boolean): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Persists tokens in AsyncStorage and injects them into the HTTP client. */
  const persistTokens = useCallback(async (access: string, refresh: string) => {
    await Promise.all([
      AsyncStorage.setItem(KEYS.ACCESS_TOKEN, access),
      AsyncStorage.setItem(KEYS.REFRESH_TOKEN, refresh),
    ]);
    httpClient.setTokens(access, refresh);
  }, []);

  /** Clears all auth data from storage and the HTTP client. */
  const clearAuth = useCallback(async () => {
    await Promise.all(Object.values(KEYS).map((k) => AsyncStorage.removeItem(k)));
    httpClient.clearTokens();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  /** Fetches the user profile from the correct endpoint based on roles. */
  const fetchProfile = useCallback(
    async (roles: UserRole[]): Promise<Record<string, unknown> | null> => {
      const type = resolveProfileType(roles);
      if (type === 'driver') {
        const res = await authFacade.getDriverProfile();
        return res.success ? (res.data ?? null) : null;
      }
      const res = await authFacade.getPassengerProfile();
      if (res.success) return res.data ?? null;
      // Fallback to driver profile if passenger fails
      const driverRes = await authFacade.getDriverProfile();
      return driverRes.success ? (driverRes.data ?? null) : null;
    },
    []
  );

  /** Saves user data to AsyncStorage with a freshness timestamp. */
  const persistUser = useCallback(async (userData: User) => {
    await Promise.all([
      AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(userData)),
      AsyncStorage.setItem(KEYS.USER_DATA_TS, String(Date.now())),
    ]);
  }, []);

  /** Returns true if the cached user data is still within the TTL. */
  const isCacheValid = useCallback(async (): Promise<boolean> => {
    const ts = await AsyncStorage.getItem(KEYS.USER_DATA_TS);
    if (!ts) return false;
    return Date.now() - parseInt(ts, 10) < CACHE_TTL_MS;
  }, []);

  // ── Session hydration ──────────────────────────────────────────────────────

  const hydrate = useCallback(async () => {
    try {
      setIsLoading(true);
      const [access, refresh, rawUser] = await Promise.all([
        AsyncStorage.getItem(KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(KEYS.USER_DATA),
      ]);

      if (!access || !refresh) {
        if (rawUser) {
          try { setUser(JSON.parse(rawUser)); } catch { /* ignore */ }
        }
        return;
      }

      httpClient.setTokens(access, refresh);

      // Optimistically restore from cache
      let cached: User | null = null;
      if (rawUser) {
        try { cached = JSON.parse(rawUser); setUser(cached); setIsAuthenticated(true); } catch { /* ignore */ }
      }

      // Skip network call if cache is fresh
      if (cached && (await isCacheValid())) return;

      // Validate token by fetching profile
      const roles: UserRole[] = cached?.roles ?? [];
      const raw = await fetchProfile(roles);

      if (raw) {
        const updated = sanitizeUserProfile(raw as Record<string, unknown>, roles);
        setUser(updated);
        setIsAuthenticated(true);
        await persistUser(updated);
      } else {
        // Token invalid — attempt refresh
        await refreshAuth();
      }
    } catch {
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth, fetchProfile, isCacheValid, persistUser]);

  // ── Token refresh ──────────────────────────────────────────────────────────

  const refreshAuth = useCallback(async () => {
    const result = await authFacade.refresh();
    if (!result.success || !result.data) {
      await clearAuth();
      return;
    }
    await persistTokens(result.data.accessToken, result.data.refreshToken);
    setIsAuthenticated(true);

    if (await isCacheValid()) return;

    const roles: UserRole[] = user?.roles ?? [];
    const raw = await fetchProfile(roles);
    if (raw) {
      const updated = sanitizeUserProfile(raw as Record<string, unknown>, roles);
      setUser(updated);
      await persistUser(updated);
    }
  }, [clearAuth, fetchProfile, isCacheValid, persistTokens, persistUser, user?.roles]);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        setIsLoading(true);
        const res = await authFacade.login({ email, password });

        if (!res.success || !res.data) {
          return { success: false, error: res.error ?? res.message ?? 'Invalid credentials.' };
        }

        const identity = res.data;

        // Email not verified — redirect to verification screen
        if (!identity.emailVerified) {
          await clearAuth();
          const userType = resolveProfileType(identity.roles as UserRole[]) ?? 'passenger';
          await AsyncStorage.setItem(
            KEYS.PENDING_EMAIL,
            JSON.stringify({ email: identity.email, userType })
          );
          return {
            success: false,
            requiresEmailVerification: true,
            email: identity.email,
            userType,
            error: 'Please verify your email before continuing.',
          };
        }

        await persistTokens(identity.accessToken, identity.refreshToken);

        const roles = identity.roles as UserRole[];
        const raw = await fetchProfile(roles);

        const userData: User = raw
          ? sanitizeUserProfile(raw as Record<string, unknown>, roles)
          : {
              userId: identity.id,
              email: identity.email,
              name: identity.email.split('@')[0],
              roles,
              emailVerified: identity.emailVerified,
            };

        setUser(userData);
        setIsAuthenticated(true);
        await persistUser(userData);
        await AsyncStorage.removeItem(KEYS.PENDING_EMAIL);

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unable to connect to the server.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuth, fetchProfile, persistTokens, persistUser]
  );

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authFacade.logout().catch(() => { /* server logout is best-effort */ });
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  // ── Refresh user data ──────────────────────────────────────────────────────

  const refreshUserData = useCallback(
    async (force = false) => {
      if (!force && (await isCacheValid())) return;
      const roles: UserRole[] = user?.roles ?? [];
      const raw = await fetchProfile(roles);
      if (!raw) return;
      const updated = sanitizeUserProfile(raw as Record<string, unknown>, roles);
      setUser(updated);
      await persistUser(updated);
    },
    [fetchProfile, isCacheValid, persistUser, user?.roles]
  );

  // ── Token rotation callback ────────────────────────────────────────────────

  useEffect(() => {
    httpClient.setTokenUpdateCallback(async (access, refresh) => {
      await Promise.all([
        AsyncStorage.setItem(KEYS.ACCESS_TOKEN, access),
        AsyncStorage.setItem(KEYS.REFRESH_TOKEN, refresh),
      ]);
    });
    return () => { httpClient.setTokenUpdateCallback(null); };
  }, []);

  // ── Initial hydration ──────────────────────────────────────────────────────

  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, login, logout, refreshAuth, refreshUserData }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Backward-compatible hook export used across legacy screens/contexts.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}
