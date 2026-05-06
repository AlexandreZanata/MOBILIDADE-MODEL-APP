import { z } from 'zod';

const userRoleSchema = z.enum(['passenger', 'driver', 'admin']);

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
  roles: z.array(userRoleSchema),
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
  roles: z.array(userRoleSchema),
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
