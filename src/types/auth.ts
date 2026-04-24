/**
 * @file auth.ts
 * @description Request/response contracts for the Auth domain.
 * These are API-layer types — not domain models.
 */

/** POST /auth/login — request body. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /auth/login — response data. */
export interface LoginResponse {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  roles: string[];
  createdAt: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
}

/** POST /auth/refresh — response data. */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/** Generic API envelope used by all endpoints. */
export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  /** HTTP status code, included on errors. */
  status?: number;
}
