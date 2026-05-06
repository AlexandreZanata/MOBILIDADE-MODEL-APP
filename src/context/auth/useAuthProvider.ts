import { useCallback, useEffect, useRef, useState } from 'react';

import { authFacade } from '@/services/facades/AuthFacade';
import { httpClient } from '@/services/http/httpClient';
import { UserRole } from '@/models/Auth';
import { User } from '@/models/User';
import { USER_CACHE_TTL_MS } from '@/context/auth/constants';
import { loginIdentitySchema, refreshTokensSchema } from '@/context/auth/schemas';
import {
  buildSanitizedUser,
  fetchProfileByRoles,
  mergeRolesWithProfileSource,
} from '@/context/auth/profile';
import {
  isUserCacheValid,
  loadHydratedAuthStorage,
  removeAllAuthStorage,
  removePendingEmailVerification,
  storePendingEmailVerification,
  storeTokens,
  storeUser,
} from '@/context/auth/storage';
import { AuthContextValue, LoginResult } from '@/context/auth/types';

export function useAuthProviderValue(): AuthContextValue {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  /**
   * Stable ref for the current user's roles so that callbacks that need roles
   * do NOT re-create (and therefore do NOT re-trigger effects) every time the
   * user object changes.
   */
  const userRolesRef = useRef<UserRole[]>([]);
  useEffect(() => {
    userRolesRef.current = user?.roles ?? [];
  }, [user]);

  /** Guard that prevents hydrate() from running more than once concurrently. */
  const hydrateRunningRef = useRef(false);

  const clearAuth = useCallback(async () => {
    await removeAllAuthStorage();
    httpClient.clearTokens();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const persistTokens = useCallback(async (accessToken: string, refreshToken: string) => {
    await storeTokens(accessToken, refreshToken);
    httpClient.setTokens(accessToken, refreshToken);
  }, []);

  const refreshUserFromApi = useCallback(
    async (roles: UserRole[]): Promise<User | null> => {
      const { profile, source } = await fetchProfileByRoles(roles);
      if (!profile) return null;

      const resolvedRoles = mergeRolesWithProfileSource(roles, source);
      const nextUser = buildSanitizedUser(profile, resolvedRoles);
      setUser(nextUser);
      await storeUser(nextUser);
      return nextUser;
    },
    []
  );

  /**
   * refreshAuth no longer depends on `user?.roles` directly — it reads the
   * stable ref instead, which breaks the dependency cycle:
   *   hydrate → refreshAuth → user?.roles → hydrate (loop)
   */
  const refreshAuth = useCallback(async () => {
    const refreshResult = await authFacade.refresh();
    const parsedTokens = refreshTokensSchema.safeParse(refreshResult.data);

    if (!refreshResult.success || !parsedTokens.success) {
      await clearAuth();
      return;
    }

    await persistTokens(parsedTokens.data.accessToken, parsedTokens.data.refreshToken);
    setIsAuthenticated(true);

    if (await isUserCacheValid(USER_CACHE_TTL_MS)) return;
    await refreshUserFromApi(userRolesRef.current);
  }, [clearAuth, persistTokens, refreshUserFromApi]);

  /**
   * hydrate() now has a stable dependency set and is protected by a running
   * guard so it can never execute concurrently or re-trigger itself.
   */
  const hydrate = useCallback(async () => {
    if (hydrateRunningRef.current) return;
    hydrateRunningRef.current = true;

    try {
      setIsLoading(true);

      const hydratedStorage = await loadHydratedAuthStorage();
      const { accessToken, refreshToken } = hydratedStorage.tokens;

      if (!accessToken || !refreshToken) {
        if (hydratedStorage.user) setUser(hydratedStorage.user);
        return;
      }

      httpClient.setTokens(accessToken, refreshToken);

      if (hydratedStorage.user) {
        setUser(hydratedStorage.user);
        setIsAuthenticated(true);
      }

      if (hydratedStorage.user && (await isUserCacheValid(USER_CACHE_TTL_MS))) return;

      const roles = hydratedStorage.user?.roles ?? [];
      const refreshedUser = await refreshUserFromApi(roles);
      if (refreshedUser) {
        setIsAuthenticated(true);
        return;
      }

      await refreshAuth();
    } catch {
      await clearAuth();
    } finally {
      setIsLoading(false);
      hydrateRunningRef.current = false;
    }
    // Intentionally omitting refreshAuth from deps — it is stable because it
    // no longer closes over `user?.roles`. clearAuth and refreshUserFromApi
    // are both stable (no changing deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearAuth, refreshUserFromApi]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      try {
        setIsLoading(true);
        const loginResult = await authFacade.login({ email, password });
        const parsedIdentity = loginIdentitySchema.safeParse(loginResult.data);

        if (!loginResult.success || !parsedIdentity.success) {
          return {
            success: false,
            error: loginResult.error ?? loginResult.message ?? 'Invalid credentials.',
          };
        }

        const identity = parsedIdentity.data;
        if (!identity.emailVerified) {
          await clearAuth();
          const userType = identity.roles.includes('driver') ? 'driver' : 'passenger';
          await storePendingEmailVerification({ email: identity.email, userType });
          return {
            success: false,
            requiresEmailVerification: true,
            email: identity.email,
            userType,
            error: 'Please verify your email before continuing.',
          };
        }

        await persistTokens(identity.accessToken, identity.refreshToken);

        const { profile, source } = await fetchProfileByRoles(identity.roles);
        const resolvedRoles = mergeRolesWithProfileSource(identity.roles, source);
        const normalizedUser: User = profile
          ? buildSanitizedUser(profile, resolvedRoles)
          : {
              userId: identity.id,
              email: identity.email,
              name: identity.email.split('@')[0],
              roles: resolvedRoles,
              emailVerified: identity.emailVerified,
            };

        setUser(normalizedUser);
        setIsAuthenticated(true);
        await storeUser(normalizedUser);
        await removePendingEmailVerification();
        return { success: true };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unable to connect to the server.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuth, persistTokens]
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authFacade.logout().catch(() => undefined);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  const refreshUserData = useCallback(
    async (force = false) => {
      if (!force && (await isUserCacheValid(USER_CACHE_TTL_MS))) return;
      await refreshUserFromApi(user?.roles ?? []);
    },
    [refreshUserFromApi, user?.roles]
  );

  useEffect(() => {
    httpClient.setTokenUpdateCallback(async (access, refresh) => {
      await storeTokens(access, refresh);
    });

    return () => {
      httpClient.setTokenUpdateCallback(null);
    };
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return { isAuthenticated, isLoading, user, login, logout, refreshAuth, refreshUserData };
}
