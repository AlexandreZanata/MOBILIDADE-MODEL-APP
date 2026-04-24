/**
 * @file User.ts
 * @description Domain model for the authenticated user profile.
 * Source of truth — no duplication across layers.
 */

import { UserRole } from './Auth';

/** Full user profile as stored in the app state. */
export interface User {
  /** Backend user ID (comes as `userId` from the profile endpoint). */
  userId: string;
  email: string;
  name: string;
  phone?: string;
  birthDate?: string;
  photoUrl?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  roles: UserRole[];
  /** Raw profile type string from the backend (e.g. 'motorista', 'driver'). */
  type?: string;
}

/**
 * Returns true if the user has the driver role.
 * @param user - The user profile to check.
 */
export function isDriver(user: User): boolean {
  return (
    user.roles.includes('driver') ||
    user.type === 'motorista' ||
    user.type === 'driver'
  );
}

/**
 * Returns true if the user has the passenger role.
 * @param user - The user profile to check.
 */
export function isPassenger(user: User): boolean {
  return user.roles.includes('passenger') || user.type === 'passenger';
}

/**
 * Strips server-only fields before persisting user data locally.
 * Removes: `id`, `createdAt`, `updatedAt`.
 * @param raw - Raw profile data from the API.
 * @param fallbackRoles - Roles to use if not present in raw data.
 */
export function sanitizeUserProfile(
  raw: Record<string, unknown>,
  fallbackRoles: UserRole[] = []
): User {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = raw;
  return {
    ...(rest as Omit<User, 'roles'>),
    roles: (rest.roles as UserRole[] | undefined) ?? fallbackRoles,
  };
}
