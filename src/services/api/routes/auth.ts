import { apiCoreClient } from '../core/client';
import type { ApiResponse, AuthResponse, LoginRequest } from '../types/common';

export const authRoutes = {
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiCoreClient.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response.success && response.data) {
      apiCoreClient.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    return response;
  },

  async logout(): Promise<ApiResponse<void>> {
    const response = await apiCoreClient.request<void>('/auth/logout', {
      method: 'POST',
    });
    apiCoreClient.clearTokens();
    return response;
  },

  registerPassenger(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    cpf: string;
    birthDate: string;
  }): Promise<ApiResponse<unknown>> {
    return apiCoreClient.request('/passengers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyPassengerEmail(email: string, code: string): Promise<ApiResponse<unknown>> {
    return apiCoreClient.request('/passengers/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  registerDriver(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    cpf: string;
    cnhNumber: string;
    cnhExpirationDate: string;
    cnhCategory: string;
  }): Promise<ApiResponse<unknown>> {
    return apiCoreClient.request('/drivers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyDriverEmail(email: string, code: string): Promise<ApiResponse<unknown>> {
    return apiCoreClient.request('/drivers/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },
};
