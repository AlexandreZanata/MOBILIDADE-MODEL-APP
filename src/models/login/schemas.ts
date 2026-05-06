import { z } from 'zod';
import { LoginFormData } from '@/models/login/types';

const loginEmailSchema = z
  .string()
  .trim()
  .min(1, 'requiredEmail')
  .email('invalidEmail');

const loginPasswordSchema = z
  .string()
  .min(1, 'requiredPassword')
  .min(8, 'minPasswordLength');

export const loginCredentialsSchema = z.object({
  email: loginEmailSchema,
  password: loginPasswordSchema,
});

export function parseLoginCredentials(payload: unknown): LoginFormData {
  return loginCredentialsSchema.parse(payload);
}
