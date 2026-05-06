import { authFacade } from '@/services/facades/AuthFacade';
import { UserRole, resolveProfileType } from '@/models/Auth';
import { User, sanitizeUserProfile } from '@/models/User';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function fetchProfileByRoles(
  roles: UserRole[]
): Promise<Record<string, unknown> | null> {
  const preferredProfile = resolveProfileType(roles);

  if (preferredProfile === 'driver') {
    const driver = await authFacade.getDriverProfile();
    return driver.success && isRecord(driver.data) ? driver.data : null;
  }

  const passenger = await authFacade.getPassengerProfile();
  if (passenger.success && isRecord(passenger.data)) return passenger.data;

  const driverFallback = await authFacade.getDriverProfile();
  return driverFallback.success && isRecord(driverFallback.data) ? driverFallback.data : null;
}

export function buildSanitizedUser(
  profile: Record<string, unknown>,
  fallbackRoles: UserRole[]
): User {
  return sanitizeUserProfile(profile, fallbackRoles);
}
