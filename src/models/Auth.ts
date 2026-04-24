/**
 * @file Auth.ts
 * @description Domain model for authentication entities.
 * Source of truth — no duplication across layers.
 */

/** Supported user roles in the system. */
export type UserRole = 'passenger' | 'driver' | 'admin';

/** Authenticated session tokens. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Minimal auth identity returned after login. */
export interface AuthIdentity extends AuthTokens {
  id: string;
  email: string;
  roles: UserRole[];
  emailVerified: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
}

/** Determines the preferred profile type from a role list. */
export function resolveProfileType(roles: UserRole[]): 'passenger' | 'driver' | undefined {
  if (roles.includes('driver')) return 'driver';
  if (roles.includes('passenger')) return 'passenger';
  return undefined;
}
