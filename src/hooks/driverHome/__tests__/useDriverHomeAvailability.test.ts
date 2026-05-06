/**
 * @file useDriverHomeAvailability.test.ts
 * @description Unit tests for the driver availability hook.
 * Covers: eligibility guards, REST PATCH flow, WebSocket status_update dispatch,
 * status_updated server event sync, rate limiting, and error handling.
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetDriverOperationalStatus = jest.fn();
const mockUpdateDriverOperationalStatus = jest.fn();
const mockGetDriverValidationStatus = jest.fn();

jest.mock('@/services/driverHome/driverHomeService', () => ({
  driverHomeService: {
    getDriverOperationalStatus: mockGetDriverOperationalStatus,
    getDriverValidationStatus: mockGetDriverValidationStatus,
    updateDriverOperationalStatus: mockUpdateDriverOperationalStatus,
  },
}));

const mockUpdateOperationalStatus = jest.fn();
const mockSendLocationUpdate = jest.fn();
let mockIsConnected = false;
let capturedMessageCallback: ((msg: unknown) => void) | null = null;

jest.mock('@/services/websocket', () => ({
  driverWebSocket: {
    get isConnected() {
      return mockIsConnected;
    },
    updateOperationalStatus: mockUpdateOperationalStatus,
    sendLocationUpdate: mockSendLocationUpdate,
    setOnMessage: jest.fn((cb: (msg: unknown) => void) => {
      capturedMessageCallback = cb;
    }),
    removeOnMessage: jest.fn(),
  },
}));

jest.mock('@/hooks/driverHome/waitUntilDriverSocketOpen', () => ({
  waitUntilDriverSocketOpen: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/services/backgroundLocationService', () => ({
  startDriverBackgroundLocation: jest.fn().mockResolvedValue(undefined),
  stopDriverBackgroundLocation: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));

// ── Subject ───────────────────────────────────────────────────────────────────

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDriverHomeAvailability } from '../useDriverHomeAvailability';
import { startDriverBackgroundLocation, stopDriverBackgroundLocation } from '@/services/backgroundLocationService';
import { Alert } from 'react-native';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const eligibleOperationalStatus = {
  operationalStatus: 'OFFLINE' as const,
  isOnline: false,
  canReceiveRides: true,
};

const availableOperationalStatus = {
  operationalStatus: 'AVAILABLE' as const,
  isOnline: true,
  canReceiveRides: true,
};

const activeValidationStatus = {
  workflowStatus: 'ACTIVE',
  cnh: { status: 'APPROVED' },
  vehicles: [{ status: 'APPROVED' }],
};

const currentLocation = { lat: -12.5, lon: -55.7 };

const defaultParams = {
  currentLocation,
  connectWebSocket: jest.fn().mockResolvedValue(true),
  isWebSocketConnected: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Sets up mocks for a fully eligible driver (ACTIVE workflow, OFFLINE status).
 * loadOperationalStatus is called twice on mount: once from the initial useEffect,
 * and once after loadValidationStatus resolves and updates validationStatus state
 * (which is a dependency of loadOperationalStatus).
 */
function setupEligibleDriver() {
  mockGetDriverValidationStatus.mockResolvedValue({
    success: true,
    data: activeValidationStatus,
  });
  mockGetDriverOperationalStatus.mockResolvedValue({
    success: true,
    data: eligibleOperationalStatus,
  });
}

/**
 * Waits for the hook's initial data load to fully settle.
 * operationalStatus being non-null means both loads completed.
 */
async function waitForInitialLoad(result: { current: ReturnType<typeof useDriverHomeAvailability> }) {
  await waitFor(() => {
    expect(result.current.operationalStatus).not.toBeNull();
    expect(result.current.isLoadingStatus).toBe(false);
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useDriverHomeAvailability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConnected = false;
    capturedMessageCallback = null;
  });

  // ── Initial load ────────────────────────────────────────────────────────

  describe('initial load', () => {
    it('loads validation and operational status on mount', async () => {
      setupEligibleDriver();

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));

      await waitFor(() => {
        expect(mockGetDriverValidationStatus.mock.calls.length).toBeGreaterThanOrEqual(1);
        // Called at least once (may be called twice due to validationStatus dep change)
        expect(mockGetDriverOperationalStatus.mock.calls.length).toBeGreaterThanOrEqual(1);
      });

      await waitForInitialLoad(result);
      expect(result.current.isLoadingStatus).toBe(false);
    });

    it('sets isAvailable true when backend reports AVAILABLE + canReceiveRides', async () => {
      mockGetDriverValidationStatus.mockResolvedValue({
        success: true,
        data: activeValidationStatus,
      });
      mockGetDriverOperationalStatus.mockResolvedValue({
        success: true,
        data: availableOperationalStatus,
      });

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(true);
      });
    });

    it('sets isAvailable false when canReceiveRides is false', async () => {
      mockGetDriverValidationStatus.mockResolvedValue({
        success: true,
        data: activeValidationStatus,
      });
      mockGetDriverOperationalStatus.mockResolvedValue({
        success: true,
        data: { operationalStatus: 'OFFLINE', isOnline: false, canReceiveRides: false },
      });

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));

      await waitFor(() => {
        expect(result.current.isAvailable).toBe(false);
        expect(result.current.isLoadingStatus).toBe(false);
      });
    });
  });

  // ── Toggle ON ───────────────────────────────────────────────────────────

  describe('handleToggleAvailability — going AVAILABLE', () => {
    it('calls PATCH with AVAILABLE and sends WebSocket status_update', async () => {
      setupEligibleDriver();
      mockUpdateDriverOperationalStatus.mockResolvedValue({
        success: true,
        data: availableOperationalStatus,
      });
      mockIsConnected = true;

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      await act(async () => {
        await result.current.handleToggleAvailability(true);
      });

      expect(mockUpdateDriverOperationalStatus).toHaveBeenCalledWith('AVAILABLE');
      expect(mockUpdateOperationalStatus).toHaveBeenCalledWith('AVAILABLE');
    });

    it('sends initial location update via WebSocket when connected', async () => {
      setupEligibleDriver();
      mockUpdateDriverOperationalStatus.mockResolvedValue({
        success: true,
        data: availableOperationalStatus,
      });
      mockIsConnected = true;

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      await act(async () => {
        await result.current.handleToggleAvailability(true);
      });

      expect(mockSendLocationUpdate).toHaveBeenCalledWith({
        lat: currentLocation.lat,
        lng: currentLocation.lon,
      });
    });

    it('starts background location service when going AVAILABLE', async () => {
      setupEligibleDriver();
      mockUpdateDriverOperationalStatus.mockResolvedValue({
        success: true,
        data: availableOperationalStatus,
      });
      mockIsConnected = true;

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      await act(async () => {
        await result.current.handleToggleAvailability(true);
      });

      expect(startDriverBackgroundLocation).toHaveBeenCalledTimes(1);
    });

    it('connects WebSocket if not already connected before sending status', async () => {
      setupEligibleDriver();
      mockUpdateDriverOperationalStatus.mockResolvedValue({
        success: true,
        data: availableOperationalStatus,
      });
      mockIsConnected = false;
      const connectWebSocket = jest.fn().mockResolvedValue(true);

      const { result } = renderHook(() =>
        useDriverHomeAvailability({ ...defaultParams, connectWebSocket, isWebSocketConnected: false })
      );
      await waitForInitialLoad(result);

      await act(async () => {
        await result.current.handleToggleAvailability(true);
      });

      expect(connectWebSocket).toHaveBeenCalledTimes(1);
    });

    it('sets apiError and reverts isAvailable when PATCH fails', async () => {
      setupEligibleDriver();
      mockUpdateDriverOperationalStatus.mockResolvedValue({
        success: false,
        message: 'Servidor indisponível',
      });

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      await act(async () => {
        await result.current.handleToggleAvailability(true);
      });

      expect(result.current.isAvailable).toBe(false);
      expect(result.current.apiError).toBe('Servidor indisponível');
      expect(mockUpdateOperationalStatus).not.toHaveBeenCalled();
    });

    it('does not send WebSocket status_update when PATCH returns canReceiveRides false', async () => {
      setupEligibleDriver();
      mockUpdateDriverOperationalStatus.mockResolvedValue({
        success: true,
        data: { operationalStatus: 'AVAILABLE', isOnline: true, canReceiveRides: false },
      });
      mockIsConnected = true;

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      await act(async () => {
        await result.current.handleToggleAvailability(true);
      });

      // canReceiveRides is false → availableNow is false → no socket status sent
      expect(mockUpdateOperationalStatus).not.toHaveBeenCalled();
    });
  });

  // ── Toggle OFF ──────────────────────────────────────────────────────────

  describe('handleToggleAvailability — going OFFLINE', () => {
    it('calls PATCH with OFFLINE and sends WebSocket status_update', async () => {
      setupEligibleDriver();
      mockUpdateDriverOperationalStatus.mockResolvedValue({
        success: true,
        data: { operationalStatus: 'OFFLINE', isOnline: false, canReceiveRides: false },
      });
      mockIsConnected = true;

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      await act(async () => {
        await result.current.handleToggleAvailability(false);
      });

      expect(mockUpdateDriverOperationalStatus).toHaveBeenCalledWith('OFFLINE');
      expect(mockUpdateOperationalStatus).toHaveBeenCalledWith('OFFLINE');
    });

    it('stops background location service when going OFFLINE', async () => {
      setupEligibleDriver();
      mockUpdateDriverOperationalStatus.mockResolvedValue({
        success: true,
        data: { operationalStatus: 'OFFLINE', isOnline: false, canReceiveRides: false },
      });
      mockIsConnected = true;

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      await act(async () => {
        await result.current.handleToggleAvailability(false);
      });

      expect(stopDriverBackgroundLocation).toHaveBeenCalledTimes(1);
    });
  });

  // ── Eligibility guards ──────────────────────────────────────────────────

  describe('eligibility guards', () => {
    it('shows Alert and keeps isAvailable false when driver is not eligible', async () => {
      mockGetDriverValidationStatus.mockResolvedValue({
        success: true,
        data: { workflowStatus: 'AWAITING_CNH', cnh: { status: 'MISSING' }, vehicles: [] },
      });
      mockGetDriverOperationalStatus.mockResolvedValue({
        success: true,
        data: { operationalStatus: 'OFFLINE', isOnline: false, canReceiveRides: false },
      });

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      await act(async () => {
        await result.current.handleToggleAvailability(true);
      });

      expect(Alert.alert).toHaveBeenCalledTimes(1);
      expect(result.current.isAvailable).toBe(false);
      expect(mockUpdateDriverOperationalStatus).not.toHaveBeenCalled();
    });

    it('shows Alert for pending documents when workflow is not ACTIVE', async () => {
      mockGetDriverValidationStatus.mockResolvedValue({
        success: true,
        data: {
          workflowStatus: 'COMPLETE',
          cnh: { status: 'PENDING' },
          vehicles: [{ status: 'APPROVED' }],
        },
      });
      mockGetDriverOperationalStatus.mockResolvedValue({
        success: true,
        data: { operationalStatus: 'OFFLINE', isOnline: false, canReceiveRides: false },
      });

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      await act(async () => {
        await result.current.handleToggleAvailability(true);
      });

      expect(Alert.alert).toHaveBeenCalledTimes(1);
      expect(result.current.isAvailable).toBe(false);
    });

    it('debounces rapid toggles within 1 second', async () => {
      setupEligibleDriver();
      mockUpdateDriverOperationalStatus.mockResolvedValue({
        success: true,
        data: availableOperationalStatus,
      });
      mockIsConnected = true;

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      // First toggle — should go through
      await act(async () => {
        await result.current.handleToggleAvailability(true);
      });

      // Second toggle within 1s — should be debounced
      await act(async () => {
        await result.current.handleToggleAvailability(false);
      });

      expect(mockUpdateDriverOperationalStatus).toHaveBeenCalledTimes(1);
    });
  });

  // ── status_updated server event sync ───────────────────────────────────

  describe('status_updated WebSocket event', () => {
    it('re-fetches operational status when server confirms status_updated', async () => {
      setupEligibleDriver();

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      const callsBefore = mockGetDriverOperationalStatus.mock.calls.length;

      // Simulate server sending status_updated
      await act(async () => {
        capturedMessageCallback?.({ type: 'status_updated', message: 'Status updated' });
      });

      await waitFor(() => {
        expect(mockGetDriverOperationalStatus.mock.calls.length).toBeGreaterThan(callsBefore);
      });
    });

    it('ignores non-status_updated messages', async () => {
      setupEligibleDriver();

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      const callsBefore = mockGetDriverOperationalStatus.mock.calls.length;

      await act(async () => {
        capturedMessageCallback?.({ type: 'ride_offer', trip_id: 'trip-1' });
        capturedMessageCallback?.({ type: 'pong', message: 'pong' });
      });

      // No additional fetches triggered
      expect(mockGetDriverOperationalStatus.mock.calls.length).toBe(callsBefore);
    });

    it('registers and removes the message callback on mount/unmount', async () => {
      const { driverWebSocket } = require('@/services/websocket') as {
        driverWebSocket: { setOnMessage: jest.Mock; removeOnMessage: jest.Mock };
      };

      setupEligibleDriver();

      const { result, unmount } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      expect(driverWebSocket.setOnMessage).toHaveBeenCalled();

      unmount();

      expect(driverWebSocket.removeOnMessage).toHaveBeenCalled();
    });
  });

  // ── isDriverEligible helper ─────────────────────────────────────────────

  describe('isDriverEligible()', () => {
    it('returns true when workflowStatus is ACTIVE', async () => {
      setupEligibleDriver();

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));
      await waitForInitialLoad(result);

      expect(result.current.isDriverEligible()).toBe(true);
    });

    it('returns false when operationalStatus is null', async () => {
      mockGetDriverValidationStatus.mockResolvedValue({ success: false });
      mockGetDriverOperationalStatus.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useDriverHomeAvailability(defaultParams));

      await waitFor(() => {
        expect(result.current.isLoadingStatus).toBe(false);
      });

      expect(result.current.isDriverEligible()).toBe(false);
    });
  });
});
