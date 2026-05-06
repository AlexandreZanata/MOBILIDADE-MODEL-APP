/**
 * @file httpClient.ts
 * @description Base HTTP client with JWT injection, token refresh, and rate limiting.
 * This is the only place in the app that calls `fetch` directly.
 * All facades use this client — never call fetch outside this file.
 */

import { ApiEnvelope } from '@/types/auth';

export const API_BASE_URL = 'https://vamu.joaoflavio.com/v1';

/** Callback invoked after a successful token rotation. */
type TokenUpdateCallback = (accessToken: string, refreshToken: string) => void;

/** Internal refresh response shape from POST /auth/refresh. */
interface RawRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

class HttpClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  // Refresh deduplication
  private isRefreshing = false;
  private refreshPromise: Promise<ApiEnvelope<RawRefreshResponse>> | null = null;

  // Inactivity-based proactive refresh
  private lastActivityTime = Date.now();
  private inactivityTimer: ReturnType<typeof setInterval> | null = null;
  private readonly INACTIVITY_THRESHOLD_MS = 2.5 * 60 * 1000;

  // Rate limiting: max 60 req/min
  private requestTimestamps: number[] = [];
  private readonly MAX_REQUESTS_PER_MINUTE = 60;
  private readonly RATE_LIMIT_WINDOW_MS = 60_000;

  private tokenUpdateCallback: TokenUpdateCallback | null = null;

  // ─── Token management ────────────────────────────────────────────────────

  /** Stores tokens and starts the inactivity monitor. */
  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.touchActivity();
    this.startInactivityMonitor();
  }

  /** Clears tokens and stops the inactivity monitor. */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.stopInactivityMonitor();
  }

  /** Returns the current access token (read-only). */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /** Registers a callback to persist rotated tokens. */
  setTokenUpdateCallback(cb: TokenUpdateCallback | null): void {
    this.tokenUpdateCallback = cb;
  }

  /** Updates the last-activity timestamp. */
  touchActivity(): void {
    this.lastActivityTime = Date.now();
  }

  // ─── Inactivity monitor ──────────────────────────────────────────────────

  private startInactivityMonitor(): void {
    this.stopInactivityMonitor();
    this.inactivityTimer = setInterval(() => this.proactiveRefresh(), 30_000);
  }

  private stopInactivityMonitor(): void {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  private async proactiveRefresh(): Promise<void> {
    if (!this.accessToken || !this.refreshToken) return;
    const idle = Date.now() - this.lastActivityTime;
    if (idle >= this.INACTIVITY_THRESHOLD_MS) {
      await this.refresh();
      this.touchActivity();
    }
  }

  /**
   * Ensures the token is valid before a user-triggered action.
   * Refreshes proactively if the user has been idle for ≥ 2 minutes.
   */
  async ensureValidToken(): Promise<boolean> {
    if (!this.accessToken || !this.refreshToken) return false;
    const idle = Date.now() - this.lastActivityTime;
    if (idle >= 2 * 60_000) {
      const result = await this.refresh();
      if (result.success) this.touchActivity();
    }
    return true;
  }

  // ─── Rate limiting ───────────────────────────────────────────────────────

  private checkRateLimit(): { allowed: boolean; waitMs?: number } {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => now - t < this.RATE_LIMIT_WINDOW_MS
    );
    if (this.requestTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE) {
      const waitMs = this.RATE_LIMIT_WINDOW_MS - (now - this.requestTimestamps[0]);
      return { allowed: false, waitMs };
    }
    this.requestTimestamps.push(now);
    return { allowed: true };
  }

  // ─── Core request ────────────────────────────────────────────────────────

  /**
   * Performs an authenticated HTTP request.
   * Handles 401 → refresh → retry, 429 → exponential backoff, and timeouts.
   *
   * @param endpoint - Path relative to API_BASE_URL (e.g. `/auth/login`).
   * @param options  - Standard `RequestInit` options.
   * @param retry    - Internal retry counter (do not pass manually).
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = 0
  ): Promise<ApiEnvelope<T>> {
    // Rate-limit guard (skip for auth and retries)
    const isAuthEndpoint =
      endpoint.includes('/auth/refresh') || endpoint.includes('/auth/login');
    if (!isAuthEndpoint && retry === 0) {
      const rl = this.checkRateLimit();
      if (!rl.allowed) {
        const waitSec = rl.waitMs ? Math.ceil(rl.waitMs / 1000) : 5;
        return {
          success: false,
          error: 'rate_limit_exceeded',
          message: `Too many requests. Please wait ${waitSec}s before retrying.`,
          status: 429,
        };
      }
    }

    // Touch activity for authenticated non-auth requests
    if (this.accessToken && !isAuthEndpoint) this.touchActivity();

    const baseUrl = endpoint.startsWith('/api/')
      ? API_BASE_URL.replace('/v1', '')
      : API_BASE_URL;
    const url = `${baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (options.body) headers['Content-Type'] = 'application/json';
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await this.parseResponse(response);

      // 401 → refresh → retry once
      if (
        response.status === 401 &&
        !isAuthEndpoint &&
        !endpoint.includes('/passengers/register') &&
        !endpoint.includes('/drivers/register') &&
        retry === 0
      ) {
        const refreshResult = await this.refresh();
        if (refreshResult.success) {
          return this.request<T>(endpoint, options, retry + 1);
        }
        return {
          success: false,
          error: 'session_expired',
          message: 'Session expired. Please log in again.',
          status: 401,
        };
      }

      // 429 → exponential backoff (max 3 retries)
      if (response.status === 429 && retry < 3) {
        const delay = 1000 * Math.pow(2, retry);
        await new Promise((r) => setTimeout(r, delay));
        return this.request<T>(endpoint, options, retry + 1);
      }

      if (!response.ok) {
        const errObj = data.error as Record<string, unknown> | string | undefined;
        const msg =
          (typeof errObj === 'object' ? String(errObj?.message ?? '') : errObj) ||
          String(data.message ?? '') ||
          `HTTP ${response.status}`;
        return { success: false, error: msg, message: msg, status: response.status };
      }

      // Unwrap API envelope { success, data, message }
      if (data.success !== undefined) {
        console.log('[HttpClient] envelope detected, success:', data.success, 'has data:', data.data !== undefined);
        if (data.success && data.data !== undefined) {
          return {
            success: true,
            data: data.data as T,
            message: typeof data.message === 'string' ? data.message : undefined,
          };
        }
        // success=true but no data field — return the whole object as data
        if (data.success) {
          return {
            success: true,
            data: data as unknown as T,
            message: typeof data.message === 'string' ? data.message : undefined,
          };
        }
        const failMsg = String(data.message ?? data.error ?? 'Request failed');
        return { success: false, error: failMsg, message: failMsg };
      }

      return { success: true, data: data as unknown as T };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, error: 'timeout', message: 'Request timed out. Please try again.' };
      }
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('Network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
        return { success: false, error: 'network_error', message: 'Unable to connect. Check your internet connection.' };
      }
      return { success: false, error: msg, message: 'An unexpected error occurred.' };
    }
  }

  // ─── Token refresh ───────────────────────────────────────────────────────

  /**
   * Refreshes the access token using the stored refresh token.
   * Deduplicates concurrent refresh calls.
   */
  async refresh(): Promise<ApiEnvelope<RawRefreshResponse>> {
    if (!this.refreshToken) {
      return { success: false, error: 'no_refresh_token', message: 'No refresh token available.' };
    }
    if (this.isRefreshing && this.refreshPromise) return this.refreshPromise;

    this.isRefreshing = true;
    this.refreshPromise = (async (): Promise<ApiEnvelope<RawRefreshResponse>> => {
      try {
        const url = `${API_BASE_URL}/auth/refresh`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Refresh-Token': this.refreshToken!,
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        const data = await this.parseResponse(response);
        const accessToken = typeof data.accessToken === 'string' ? data.accessToken : undefined;
        const refreshToken = typeof data.refreshToken === 'string' ? data.refreshToken : undefined;

        if (!response.ok || !accessToken || !refreshToken) {
          return { success: false, error: 'refresh_failed', message: 'Failed to refresh token.' };
        }

        this.setTokens(accessToken, refreshToken);
        this.tokenUpdateCallback?.(accessToken, refreshToken);

        return { success: true, data: { accessToken, refreshToken } };
      } catch (err) {
        return { success: false, error: 'refresh_error', message: 'Token refresh error.' };
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async parseResponse(response: Response): Promise<Record<string, unknown>> {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const text = await response.text();
      try {
        return text ? (JSON.parse(text) as Record<string, unknown>) : { message: '' };
      } catch {
        return { message: '' };
      }
    }
    const text = await response.text();
    return { message: text || 'Unknown error' };
  }
}

/** Singleton HTTP client — the only network boundary in the app. */
export const httpClient = new HttpClient();
