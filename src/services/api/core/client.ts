import { httpClient } from '@/services/http/httpClient';
import { getOrCreateProfilePhotoUrl } from '@/services/profilePhotoCache';
import { API_BASE_URL, type ApiResponse, type AuthResponse } from '../types/common';

type TokenUpdateCallback = (accessToken: string, refreshToken: string) => void;

export class ApiCoreClient {
  request = httpClient.request.bind(httpClient);
  ensureValidToken = httpClient.ensureValidToken.bind(httpClient);
  getAccessToken = httpClient.getAccessToken.bind(httpClient);

  setTokens(accessToken: string, refreshToken: string): void {
    httpClient.setTokens(accessToken, refreshToken);
  }

  clearTokens(): void {
    httpClient.clearTokens();
  }

  setTokenUpdateCallback(callback: TokenUpdateCallback | null): void {
    httpClient.setTokenUpdateCallback(callback);
  }

  async refreshAccessToken(): Promise<ApiResponse<AuthResponse>> {
    const response = await httpClient.refresh();
    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error ?? 'Erro ao atualizar token',
        message: response.message,
      };
    }
    return {
      success: true,
      data: {
        id: '',
        email: '',
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        roles: [],
        createdAt: '',
      },
    };
  }

  getProfilePhotoUrl(userId: string): string {
    return getOrCreateProfilePhotoUrl(userId, () => `${API_BASE_URL}/profile-photos/${userId}`);
  }
}

export const apiCoreClient = new ApiCoreClient();
