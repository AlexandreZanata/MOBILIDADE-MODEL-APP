import { z } from 'zod';
import { RegisterApiSuccess } from '@/models/register/types';

export const registerApiSuccessSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
  })
  .passthrough();

export function parseRegisterApiSuccess(payload: unknown): RegisterApiSuccess {
  return registerApiSuccessSchema.parse(payload);
}
