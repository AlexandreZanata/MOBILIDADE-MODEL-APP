import { z } from 'zod';
import { PendingVerifyEmailPayload } from '@/models/verifyEmail/types';

const userTypeSchema = z.union([z.literal('passenger'), z.literal('driver')]);

export const pendingVerifyEmailPayloadSchema = z.object({
  email: z.string().email(),
  userType: userTypeSchema,
});

export function parsePendingVerifyEmailPayload(payload: unknown): PendingVerifyEmailPayload {
  return pendingVerifyEmailPayloadSchema.parse(payload);
}
