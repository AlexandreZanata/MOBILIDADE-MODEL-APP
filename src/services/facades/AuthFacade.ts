/**
 * @file AuthFacade.ts
 * @description Facade for all authentication API calls.
 * The only layer allowed to call httpClient for auth operations.
 * Returns ApiEnvelope<T> — never throws.
 */

import { httpClient } from '@/services/http/httpClient';
import { ApiEnvelope, LoginRequest, LoginResponse, RefreshResponse } from '@/types/auth';

/** Profile normalization: maps server photo fields to a canonical `photoUrl`. */
function normalizePhotoUrl(raw: Record<string, unknown>, userId?: string): string | undefined {
  const BASE = 'https://vamu.joaoflavio.com/v1';
  const candidates = [
    'photoUrl', 'profilePhotoUrl', 'profile_photo_url',
    'photo', 'photo_url', 'avatar', 'avatarUrl', 'avatar_url',
  ];
  for (const key of candidates) {
    const val = raw[key];
    if (typeof val === 'string' && val.trim()) {
      if (val.startsWith('http')) return val;
      if (userId && (val.includes('/app/uploads/') || val.includes('uploads/profile-photos/'))) {
        return `${BASE}/profile-photos/${userId}`;
      }
    }
  }
  return undefined;
}

/** Normalizes a raw profile object, injecting a canonical `photoUrl`. */
function normalizeProfile<T extends Record<string, unknown>>(data: T | undefined): T | undefined {
  if (!data) return data;
  const userId = (data.userId ?? data.id ?? data.user_id) as string | undefined;
  const photoUrl = normalizePhotoUrl(data, userId);
  if (!photoUrl) return data;
  return { ...data, photoUrl, profilePhotoUrl: photoUrl, avatar: photoUrl };
}

// ─── IAuthFacade ─────────────────────────────────────────────────────────────

export interface IAuthFacade {
  login(credentials: LoginRequest): Promise<ApiEnvelope<LoginResponse>>;
  logout(): Promise<ApiEnvelope<void>>;
  refresh(): Promise<ApiEnvelope<RefreshResponse>>;
  getPassengerProfile(): Promise<ApiEnvelope<Record<string, unknown>>>;
  getDriverProfile(): Promise<ApiEnvelope<Record<string, unknown>>>;
  registerPassenger(data: RegisterPassengerInput): Promise<ApiEnvelope<unknown>>;
  registerDriver(data: RegisterDriverInput): Promise<ApiEnvelope<unknown>>;
  verifyPassengerEmail(email: string, code: string): Promise<ApiEnvelope<unknown>>;
  verifyDriverEmail(email: string, code: string): Promise<ApiEnvelope<unknown>>;
}

// ─── Input types ─────────────────────────────────────────────────────────────

export interface RegisterPassengerInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
}

export interface RegisterDriverInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
}

// ─── Implementation ──────────────────────────────────────────────────────────

class AuthFacadeImpl implements IAuthFacade {
  /**
   * Authenticates the user and stores tokens in the HTTP client.
   * @param credentials - Email and password.
   */
  async login(credentials: LoginRequest): Promise<ApiEnvelope<LoginResponse>> {
    const response = await httpClient.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      httpClient.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  /**
   * Logs out the current user and clears stored tokens.
   */
  async logout(): Promise<ApiEnvelope<void>> {
    const result = await httpClient.request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: httpClient.getAccessToken() }),
    });
    httpClient.clearTokens();
    return result;
  }

  /**
   * Refreshes the access token using the stored refresh token.
   */
  async refresh(): Promise<ApiEnvelope<RefreshResponse>> {
    return httpClient.refresh() as Promise<ApiEnvelope<RefreshResponse>>;
  }

  /**
   * Fetches the authenticated passenger's profile.
   */
  async getPassengerProfile(): Promise<ApiEnvelope<Record<string, unknown>>> {
    const res = await httpClient.request<Record<string, unknown>>('/passengers/profile');
    return { ...res, data: normalizeProfile(res.data) };
  }

  /**
   * Fetches the authenticated driver's profile.
   */
  async getDriverProfile(): Promise<ApiEnvelope<Record<string, unknown>>> {
    const res = await httpClient.request<Record<string, unknown>>('/drivers/profile');
    return { ...res, data: normalizeProfile(res.data) };
  }

  /**
   * Registers a new passenger account.
   * @param data - Registration fields.
   */
  async registerPassenger(data: RegisterPassengerInput): Promise<ApiEnvelope<unknown>> {
    return httpClient.request('/passengers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Registers a new driver account.
   * @param data - Registration fields.
   */
  async registerDriver(data: RegisterDriverInput): Promise<ApiEnvelope<unknown>> {
    return httpClient.request('/drivers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Verifies a passenger's email with the confirmation code.
   * @param email - The email address to verify.
   * @param code  - The verification code sent by email.
   */
  async verifyPassengerEmail(email: string, code: string): Promise<ApiEnvelope<unknown>> {
    return httpClient.request('/passengers/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  /**
   * Verifies a driver's email with the confirmation code.
   * @param email - The email address to verify.
   * @param code  - The verification code sent by email.
   */
  async verifyDriverEmail(email: string, code: string): Promise<ApiEnvelope<unknown>> {
    return httpClient.request('/drivers/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }
}

/** Singleton auth facade — import this everywhere auth API calls are needed. */
export const authFacade: IAuthFacade = new AuthFacadeImpl();
