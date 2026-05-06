/**
 * @file User.ts
 * @description Domain model for the authenticated user profile.
 * Source of truth — no duplication across layers.
 */

import { UserRole } from './Auth';

/** Full user profile as stored in the app state. */
export interface User {
  id?: string;
  /** Backend user ID (comes as `userId` from the profile endpoint). */
  userId: string;
  email: string;
  name: string;
  phone?: string;
  birthDate?: string;
  photoUrl?: string;
  cpf?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  roles: UserRole[];
  /** Raw profile type string from the backend (e.g. 'motorista', 'driver'). */
  type?: string;
  type_label?: string;
  status?: string;
  cnhNumber?: string;
  cnhCategory?: string;
  cnhExpirationDate?: string;
}

/**
 * Maps raw API role strings to canonical {@link UserRole} values (case-insensitive).
 */
export function normalizeRolesFromApi(raw: unknown): UserRole[] {
  if (!Array.isArray(raw)) return [];
  const out: UserRole[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const x = item.trim().toLowerCase();
    let role: UserRole | null = null;
    if (x === 'driver' || x === 'motorista') role = 'driver';
    else if (x === 'passenger' || x === 'passageiro') role = 'passenger';
    else if (x === 'admin' || x === 'administrator') role = 'admin';
    if (role && !out.includes(role)) out.push(role);
  }
  return out;
}

type UserRoleLike = Pick<User, 'roles' | 'type'>;

/**
 * Returns true if the user has the driver role.
 * @param user - The user profile to check.
 */
export function isDriver(user: UserRoleLike | null | undefined): boolean {
  if (!user) return false;
  for (const r of user.roles ?? []) {
    if (typeof r === 'string' && r.trim().toLowerCase() === 'driver') return true;
  }
  const t = String(user.type ?? '').trim().toLowerCase();
  return t === 'motorista' || t === 'driver';
}

/**
 * Returns true if the user has the passenger role.
 * @param user - The user profile to check.
 */
export function isPassenger(user: UserRoleLike | null | undefined): boolean {
  if (!user) return false;
  for (const r of user.roles ?? []) {
    if (typeof r === 'string' && r.trim().toLowerCase() === 'passenger') return true;
  }
  const t = String(user.type ?? '').trim().toLowerCase();
  return t === 'passenger' || t === 'passageiro';
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
  const fromRaw = normalizeRolesFromApi(rest.roles);
  const merged =
    fromRaw.length > 0
      ? Array.from(new Set<UserRole>([...fromRaw, ...fallbackRoles]))
      : fallbackRoles;
  return {
    ...(rest as Omit<User, 'roles'>),
    roles: merged,
  };
}
