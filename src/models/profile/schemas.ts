import { z } from 'zod';
import { ProfileMutationResult, ProfileRating } from '@/models/profile/types';

export const profileRatingSchema = z.object({
  userId: z.string(),
  currentRating: z.string(),
  totalRatings: z.number(),
});

export const profileMutationSchema = z.object({
  message: z.string().optional(),
  photoUrl: z.string().optional(),
  url: z.string().optional(),
});

export function parseProfileRating(payload: unknown): ProfileRating {
  return profileRatingSchema.parse(payload);
}

export function parseProfileMutation(payload: unknown): ProfileMutationResult {
  const parsed = profileMutationSchema.parse(payload ?? {});
  return {
    message: parsed.message ?? '',
    photoUrl: parsed.photoUrl ?? parsed.url,
  };
}
