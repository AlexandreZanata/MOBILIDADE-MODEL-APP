/**
 * @file BaseWebSocket.ts
 * @description Abstract base class for all WebSocket connections.
 * Encapsulates: connection lifecycle, heartbeat, exponential-backoff reconnection,
 * multi-subscriber callback registry, and typed message dispatch.
 *
 * Concrete subclasses only need to provide:
 *  - `buildUrl()` — the WSS endpoint URL
 *  - `onServerMessage()` — domain-specific message handling
 */

import { httpClient } from '@/services/http/httpClient';

/** Callback invoked when a typed server message arrives. */
export type MessageCallback<TMessage> = (message: TMessage) => void;

/** Callback invoked when the connection state changes. */
export type ConnectionStateCallback = (connected: boolean) => void;

/** Callback invoked on WebSocket errors. */
export type ErrorCallback = (error: Error | Event) => void;

/** Configuration options for a BaseWebSocket instance. */
export interface WebSocketConfig {
  /** Heartbeat interval in milliseconds. */
  heartbeatIntervalMs: number;
  /** Maximum number of automatic reconnection attempts. */
  maxReconnectAttempts: number;
  /** Initial reconnection delay in milliseconds (doubles on each attempt). */
  initialReconnectDelayMs: number;
  /** Maximum reconnection delay cap in milliseconds. */
  maxReconnectDelayMs: number;
}

const DEFAULT_CONFIG: WebSocketConfig = {
  heartbeatIntervalMs: 10_000,
  maxReconnectAttempts: 5,
  initialReconnectDelayMs: 1_000,
  maxReconnectDelayMs: 30_000,
};

/**
 * Abstract base class for all WebSocket clients.
 * Subclasses must implement `buildUrl()` and `onServerMessage()`.
 *
 * @template TServerMessage - Discriminated union of all server → client message types.
 * @template TClientMessage - Discriminated union of all client → server message types.
 */
export abstract class BaseWebSocket<TServerMessage, TClientMessage> {
  private ws: WebSocket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private _isConnected = false;
  private reconnectAttempts = 0;
  private reconnectDelay: number;

  // Multi-subscriber callback registry
  private messageCallbacks: MessageCallback<TServerMessage>[] = [];
  private connectionStateCallback: ConnectionStateCallback | null = null;
  private errorCallback: ErrorCallback | null = null;

  protected readonly config: WebSocketConfig;

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.reconnectDelay = this.config.initialReconnectDelayMs;
  }

  // ─── Abstract interface ───────────────────────────────────────────────────

  /**
   * Returns the fully-qualified WSS URL for this connection.
   * Called on every connect/reconnect so the token is always fresh.
   */
  protected abstract buildUrl(): string | null;

  /**
   * Domain-specific handler called for every parsed server message.
   * Subclasses use this to log or react to specific message types.
   */
  protected abstract onServerMessage(message: TServerMessage): void;

  // ─── Connection lifecycle ─────────────────────────────────────────────────

  /**
   * Opens the WebSocket connection.
   * Returns `true` if the connection was initiated successfully.
   */
  async connect(): Promise<boolean> {
    if (this._isConnected && this.ws?.readyState === WebSocket.OPEN) {
      return true;
    }

    if (this.ws) this.close();

    const url = this.buildUrl();
    if (!url) {
      console.error(`[${this.tag}] No access token available — cannot connect.`);
      return false;
    }

    try {
      this.ws = new WebSocket(url);
      this.attachListeners();
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[${this.tag}] Connection error:`, error.message);
      this.errorCallback?.(error);
      return false;
    }
  }

  /**
   * Closes the connection intentionally (code 1000).
   * Cancels any pending reconnection timers.
   */
  disconnect(): void {
    this.close();
    this.reconnectAttempts = 0;
    this.reconnectDelay = this.config.initialReconnectDelayMs;
  }

  /**
   * Disconnects and reconnects with a fresh token.
   * Call this after a JWT rotation.
   */
  async reconnect(): Promise<boolean> {
    this.disconnect();
    await new Promise<void>((r) => setTimeout(r, 500));
    return this.connect();
  }

  /** Returns `true` if the socket is open and authenticated. */
  get isConnected(): boolean {
    return this._isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // ─── Sending ─────────────────────────────────────────────────────────────

  /**
   * Serializes and sends a typed client message.
   * Returns `true` on success, `false` if the socket is not open.
   */
  protected send(message: TClientMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn(`[${this.tag}] Socket not open — message dropped:`, (message as Record<string, unknown>).type);
      return false;
    }
    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[${this.tag}] Send error:`, error.message);
      this.errorCallback?.(error);
      return false;
    }
  }

  // ─── Heartbeat ────────────────────────────────────────────────────────────

  /** Builds the heartbeat message. Override if the format differs. */
  protected buildHeartbeat(): TClientMessage {
    return { type: 'heartbeat' } as unknown as TClientMessage;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send(this.buildHeartbeat());
    }, this.config.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ─── Reconnection ─────────────────────────────────────────────────────────

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.config.maxReconnectDelayMs
    );

    console.log(
      `[${this.tag}] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  // ─── Callbacks ────────────────────────────────────────────────────────────

  /**
   * Registers a message callback. Multiple callbacks are supported.
   * Pass `null` to clear all registered callbacks.
   */
  setOnMessage(callback: MessageCallback<TServerMessage> | null): void {
    if (callback === null) {
      this.messageCallbacks = [];
      return;
    }
    if (!this.messageCallbacks.includes(callback)) {
      this.messageCallbacks.push(callback);
    }
  }

  /**
   * Removes a specific message callback from the registry.
   */
  removeOnMessage(callback: MessageCallback<TServerMessage>): void {
    this.messageCallbacks = this.messageCallbacks.filter((cb) => cb !== callback);
  }

  /** Registers the connection-state change callback. */
  setOnConnectionStateChange(callback: ConnectionStateCallback | null): void {
    this.connectionStateCallback = callback;
  }

  /** Registers the error callback. */
  setOnError(callback: ErrorCallback | null): void {
    this.errorCallback = callback;
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  /** A short tag used in log messages. Defaults to the class name. */
  protected get tag(): string {
    return this.constructor.name;
  }

  private attachListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log(`[${this.tag}] Connected.`);
      this._isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = this.config.initialReconnectDelayMs;
      this.connectionStateCallback?.(true);
      this.startHeartbeat();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string) as TServerMessage;
        this.onServerMessage(message);
        this.dispatchToCallbacks(message);
      } catch (err) {
        console.error(`[${this.tag}] Failed to parse message:`, err);
      }
    };

    this.ws.onerror = (event: Event) => {
      console.error(`[${this.tag}] Socket error.`);
      this.errorCallback?.(event);
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log(`[${this.tag}] Closed — code: ${event.code}, reason: ${event.reason}`);
      this._isConnected = false;
      this.connectionStateCallback?.(false);
      this.stopHeartbeat();

      // Only auto-reconnect on non-intentional closes
      if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };
  }

  private dispatchToCallbacks(message: TServerMessage): void {
    for (const cb of this.messageCallbacks) {
      try {
        cb(message);
      } catch (err) {
        console.error(`[${this.tag}] Callback error:`, err);
      }
    }
  }

  private close(): void {
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
    }

    this._isConnected = false;
    this.connectionStateCallback?.(false);
  }

  /**
   * Builds the base WSS URL using the shared httpClient token.
   * @param path - The WebSocket path (e.g. `/ws/drivers`).
   */
  protected buildBaseUrl(path: string): string | null {
    const token = httpClient.getAccessToken();
    if (!token) return null;
    return `wss://vamu.joaoflavio.com${path}?token=${encodeURIComponent(token)}`;
  }
}
