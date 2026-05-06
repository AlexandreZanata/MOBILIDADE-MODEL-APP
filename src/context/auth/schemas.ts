import { z } from 'zod';

import type { UserRole } from '@/models/Auth';
import { normalizeRolesFromApi } from '@/models/User';

const userRoleSchema = z.enum(['passenger', 'driver', 'admin']);

function preprocessRoles(val: unknown): UserRole[] {
  const normalized = normalizeRolesFromApi(val);
  return normalized.length > 0 ? normalized : ['passenger'];
}

export const userSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  email: z.string(),
  name: z.string(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  photoUrl: z.string().optional(),
  cpf: z.string().optional(),
  emailVerified: z.boolean().optional(),
  emailVerifiedAt: z.string().optional(),
  roles: z.preprocess(preprocessRoles, z.array(userRoleSchema)),
  type: z.string().optional(),
  type_label: z.string().optional(),
  status: z.string().optional(),
  cnhNumber: z.string().optional(),
  cnhCategory: z.string().optional(),
  cnhExpirationDate: z.string().optional(),
});

export const loginIdentitySchema = z.object({
  id: z.string(),
  email: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  roles: z.preprocess(preprocessRoles, z.array(userRoleSchema).min(1)),
  emailVerified: z.boolean(),
});

export const refreshTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const pendingEmailSchema = z.object({
  email: z.string(),
  userType: z.enum(['passenger', 'driver']),
});
