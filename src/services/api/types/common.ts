export const API_BASE_URL = 'https://vamu.joaoflavio.com/v1';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  roles: string[];
  createdAt: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

export interface PaymentMethodResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CardBrandResponse {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
