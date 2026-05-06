import { apiService } from '@/services/api';
import { parseProfileMutation, parseProfileRating } from '@/models/profile/schemas';
import { ProfileMutationResult, ProfileRating, ProfileUserType } from '@/models/profile/types';

export interface ProfileServiceError {
  code: 'REQUEST_FAILED' | 'VALIDATION_FAILED';
  message: string;
  status?: number;
}

export interface ProfileServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ProfileServiceError;
}

function requestFailed(message: string, status?: number): ProfileServiceError {
  return { code: 'REQUEST_FAILED', message, status };
}

function validationFailed(message: string): ProfileServiceError {
  return { code: 'VALIDATION_FAILED', message };
}

function responseErrorMessage(message?: string, fallback?: string): string {
  return message ?? fallback ?? 'Request failed';
}

export const profileService = {
  async getRating(isDriver: boolean): Promise<ProfileServiceResponse<ProfileRating>> {
    const response = isDriver ? await apiService.getDriverRating() : await apiService.getPassengerRating();
    if (!response.success) {
      return {
        success: false,
        error: requestFailed(responseErrorMessage(response.error, response.message), response.status),
      };
    }

    try {
      return { success: true, data: parseProfileRating(response.data) };
    } catch (error) {
      return {
        success: false,
        error: validationFailed(error instanceof Error ? error.message : 'Invalid rating payload'),
      };
    }
  },

  async uploadDocumentCnh(fileUri: string): Promise<ProfileServiceResponse<ProfileMutationResult>> {
    const response = await apiService.uploadDriverDocument('CNH', fileUri);
    if (!response.success) {
      return {
        success: false,
        error: requestFailed(responseErrorMessage(response.error, response.message), response.status),
      };
    }

    try {
      return { success: true, data: parseProfileMutation(response.data) };
    } catch (error) {
      return {
        success: false,
        error: validationFailed(error instanceof Error ? error.message : 'Invalid CNH response payload'),
      };
    }
  },

  async uploadProfilePhoto(fileUri: string, userType: ProfileUserType): Promise<ProfileServiceResponse<ProfileMutationResult>> {
    const response = await apiService.uploadProfilePhoto(fileUri, userType);
    if (!response.success) {
      return {
        success: false,
        error: requestFailed(responseErrorMessage(response.error, response.message), response.status),
      };
    }

    try {
      return { success: true, data: parseProfileMutation(response.data) };
    } catch (error) {
      return {
        success: false,
        error: validationFailed(error instanceof Error ? error.message : 'Invalid upload response payload'),
      };
    }
  },
};
