import { authFacade } from '@/services/facades/AuthFacade';
import { UserRole } from '@/models/Auth';
import { User, sanitizeUserProfile } from '@/models/User';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export type ProfileFetchSource = 'driver' | 'passenger' | null;

export type ProfileFetchResult = {
  profile: Record<string, unknown> | null;
  source: ProfileFetchSource;
};

/**
 * Merges JWT/session roles with the profile endpoint that answered successfully.
 * Driver profile takes precedence when the API exposes a motorista profile even if
 * the login payload omitted or mis-cased the `driver` role.
 */
export function mergeRolesWithProfileSource(
  jwtRoles: UserRole[],
  source: ProfileFetchSource
): UserRole[] {
  if (source === 'driver') {
    return Array.from(new Set<UserRole>([...jwtRoles, 'driver']));
  }
  if (source === 'passenger') {
    return Array.from(new Set<UserRole>([...jwtRoles, 'passenger']));
  }
  return jwtRoles;
}

/**
 * Loads the best available profile: tries driver first (so motoristas are never
 * stuck on passenger-only data when tokens list only `passenger`), then passenger.
 */
export async function fetchProfileByRoles(_roles: UserRole[]): Promise<ProfileFetchResult> {
  const driverResp = await authFacade.getDriverProfile();
  if (driverResp.success && isRecord(driverResp.data)) {
    return { profile: driverResp.data, source: 'driver' };
  }

  const passengerResp = await authFacade.getPassengerProfile();
  if (passengerResp.success && isRecord(passengerResp.data)) {
    return { profile: passengerResp.data, source: 'passenger' };
  }

  return { profile: null, source: null };
}

export function buildSanitizedUser(
  profile: Record<string, unknown>,
  fallbackRoles: UserRole[]
): User {
  return sanitizeUserProfile(profile, fallbackRoles);
}
