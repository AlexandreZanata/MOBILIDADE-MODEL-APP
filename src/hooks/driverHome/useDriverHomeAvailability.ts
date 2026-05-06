import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { DriverHomeLocation, DriverOperationalStatusData, DriverValidationStatusData } from '@/models/driverHome/types';
import { driverHomeService } from '@/services/driverHome/driverHomeService';
import { DRIVER_HOME_CACHE_KEYS, DRIVER_HOME_TIMERS } from '@/hooks/driverHome/constants';
import {
  getEligibilityMessage,
  getErrorMessage,
  getValidationWarningMessage,
  hasPendingDocuments,
  isDriverEligible,
} from '@/hooks/driverHome/helpers';
import { tdh } from '@/i18n/driverHome';
import { startDriverBackgroundLocation, stopDriverBackgroundLocation } from '@/services/backgroundLocationService';
import { driverWebSocket, DriverServerMessage } from '@/services/websocket';

interface UseDriverHomeAvailabilityParams {
  currentLocation: DriverHomeLocation | null;
  connectWebSocket?: () => Promise<boolean>;
  isWebSocketConnected: boolean;
}

/**
 * Manages driver availability and operational status.
 *
 * Flow when toggling ON:
 *  1. Validate eligibility (documents, workflow status)
 *  2. PATCH /v1/drivers/operational-status → AVAILABLE
 *  3. Connect WebSocket if not already connected
 *  4. Send `status_update` { status: 'AVAILABLE' } via WebSocket
 *  5. Send initial location update
 *  6. Start background location service
 *
 * Flow when toggling OFF:
 *  1. PATCH /v1/drivers/operational-status → OFFLINE
 *  2. Send `status_update` { status: 'OFFLINE' } via WebSocket
 *  3. Stop background location service
 *
 * The server confirms status changes via `status_updated` events, which are
 * listened to here to keep UI state in sync with the backend.
 */
export function useDriverHomeAvailability({
  currentLocation,
  connectWebSocket,
  isWebSocketConnected,
}: UseDriverHomeAvailabilityParams) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAvailabilityRateLimited, setIsAvailabilityRateLimited] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<DriverValidationStatusData | null>(null);
  const [operationalStatus, setOperationalStatus] = useState<DriverOperationalStatusData | null>(null);

  const availabilityPrefRef = useRef<boolean | null>(null);
  const lastAvailabilityToggleRef = useRef(0);
  const availabilityRequestsRef = useRef<number[]>([]);
  const pendingAvailabilityRequestRef = useRef<{ value: boolean; timestamp: number } | null>(null);
  const availabilityRateLimitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Rate limiting ──────────────────────────────────────────────────────────

  const canMakeAvailabilityRequest = useCallback((): boolean => {
    const now = Date.now();
    const windowStart = now - DRIVER_HOME_TIMERS.AVAILABILITY_WINDOW_MS;
    availabilityRequestsRef.current = availabilityRequestsRef.current.filter((ts) => ts > windowStart);
    return availabilityRequestsRef.current.length < 60;
  }, []);

  const recordAvailabilityRequest = useCallback(() => {
    availabilityRequestsRef.current.push(Date.now());
  }, []);

  // ─── Data loading ───────────────────────────────────────────────────────────

  const loadValidationStatus = useCallback(async () => {
    const response = await driverHomeService.getDriverValidationStatus();
    if (response.success && response.data) setValidationStatus(response.data);
  }, []);

  const loadOperationalStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const response = await driverHomeService.getDriverOperationalStatus();
      if (!response.success || !response.data) return;
      setOperationalStatus(response.data);

      const canBeAvailable = response.data.operationalStatus === 'AVAILABLE' && response.data.canReceiveRides;
      const wantsAvailable = availabilityPrefRef.current === true;

      if (validationStatus?.workflowStatus === 'ACTIVE') {
        setIsAvailable(wantsAvailable || canBeAvailable);
        return;
      }
      if (hasPendingDocuments(validationStatus) || !response.data.canReceiveRides) {
        setIsAvailable(false);
        return;
      }
      setIsAvailable(wantsAvailable || canBeAvailable);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [validationStatus]);

  // ─── WebSocket status sync ──────────────────────────────────────────────────

  /**
   * Sends the operational status via WebSocket after the REST PATCH succeeds.
   * The backend requires both the REST call and the socket event to fully
   * activate/deactivate the driver in the dispatch system.
   */
  const syncStatusViaSocket = useCallback(
    (status: DriverOperationalStatusData['operationalStatus']) => {
      if (driverWebSocket.isConnected) {
        driverWebSocket.updateOperationalStatus(status);
      }
    },
    []
  );

  // ─── Core availability execution ────────────────────────────────────────────

  const executeAvailabilityRequest = useCallback(
    async (value: boolean): Promise<boolean> => {
      recordAvailabilityRequest();
      const nextStatus: DriverOperationalStatusData['operationalStatus'] = value ? 'AVAILABLE' : 'OFFLINE';
      const response = await driverHomeService.updateDriverOperationalStatus(nextStatus);

      if (!response.success) {
        const fallback = value ? tdh('enableAvailabilityError') : tdh('disableAvailabilityError');
        setApiError(response.message || fallback);
        setIsAvailable(!value);
        return false;
      }

      if (response.data) {
        setOperationalStatus(response.data);
        const availableNow = response.data.operationalStatus === 'AVAILABLE' && response.data.canReceiveRides;
        setIsAvailable(availableNow);

        if (value && availableNow) {
          // Ensure WebSocket is connected before sending status update
          if (!isWebSocketConnected && connectWebSocket) {
            await connectWebSocket();
          }
          // Notify the dispatch system via WebSocket
          syncStatusViaSocket('AVAILABLE');

          if (currentLocation && driverWebSocket.isConnected) {
            driverWebSocket.sendLocationUpdate({ lat: currentLocation.lat, lng: currentLocation.lon });
          }
          await startDriverBackgroundLocation();
        } else if (!value) {
          syncStatusViaSocket('OFFLINE');
          await stopDriverBackgroundLocation();
        }
      }
      return true;
    },
    [connectWebSocket, currentLocation, isWebSocketConnected, recordAvailabilityRequest, syncStatusViaSocket]
  );

  // ─── Rate-limit deferred execution ─────────────────────────────────────────

  const processPendingAvailabilityRequest = useCallback(async () => {
    const pending = pendingAvailabilityRequestRef.current;
    if (!pending) return;
    pendingAvailabilityRequestRef.current = null;
    setIsAvailabilityRateLimited(false);
    if (!canMakeAvailabilityRequest()) return;
    await executeAvailabilityRequest(pending.value);
  }, [canMakeAvailabilityRequest, executeAvailabilityRequest]);

  const scheduleAvailabilityRequest = useCallback(
    (value: boolean) => {
      if (availabilityRateLimitTimeoutRef.current) clearTimeout(availabilityRateLimitTimeoutRef.current);
      pendingAvailabilityRequestRef.current = { value, timestamp: Date.now() };
      setIsAvailabilityRateLimited(true);
      availabilityRateLimitTimeoutRef.current = setTimeout(() => {
        void processPendingAvailabilityRequest();
      }, DRIVER_HOME_TIMERS.AVAILABILITY_DELAY_MS);
    },
    [processPendingAvailabilityRequest]
  );

  // ─── Public toggle handler ──────────────────────────────────────────────────

  const handleToggleAvailability = useCallback(
    async (value: boolean) => {
      if (Date.now() - lastAvailabilityToggleRef.current < 1000 || isConnecting) return;
      lastAvailabilityToggleRef.current = Date.now();

      if (value && !isDriverEligible(operationalStatus, validationStatus)) {
        Alert.alert(tdh('unavailableActivationTitle'), getEligibilityMessage(validationStatus), [{ text: 'OK' }]);
        setIsAvailable(false);
        return;
      }

      if (value && validationStatus?.workflowStatus !== 'ACTIVE' && hasPendingDocuments(validationStatus)) {
        Alert.alert(
          tdh('pendingDocsTitle'),
          getValidationWarningMessage(validationStatus) || tdh('pendingDocsDefault'),
          [{ text: 'OK' }]
        );
        setIsAvailable(false);
        return;
      }

      setIsConnecting(true);
      setApiError(null);
      setIsAvailable(value);
      availabilityPrefRef.current = value;
      await AsyncStorage.setItem(DRIVER_HOME_CACHE_KEYS.DRIVER_AVAILABILITY_PREF, value ? 'true' : 'false');

      try {
        if (!canMakeAvailabilityRequest()) {
          scheduleAvailabilityRequest(value);
          setApiError(tdh('tooManyRequestsDeferred'));
          setIsConnecting(false);
          return;
        }
        await executeAvailabilityRequest(value);
      } catch (error) {
        const msg = getErrorMessage(error, tdh('updateAvailabilityError'));
        if (msg.includes('429') || msg.toLowerCase().includes('muitas requisicoes')) {
          scheduleAvailabilityRequest(value);
          setApiError(tdh('tooManyRequestsDeferred'));
        } else {
          setApiError(msg);
          setIsAvailable(!value);
        }
      } finally {
        setIsConnecting(false);
      }
    },
    [
      canMakeAvailabilityRequest,
      executeAvailabilityRequest,
      isConnecting,
      operationalStatus,
      scheduleAvailabilityRequest,
      validationStatus,
    ]
  );

  // ─── Server-side status_updated sync ───────────────────────────────────────

  /**
   * Listens for `status_updated` events from the server to keep the UI in sync
   * with the backend's confirmed operational state.
   */
  useEffect(() => {
    const handleSocketMessage = (message: DriverServerMessage) => {
      if (message.type !== 'status_updated') return;
      // Re-fetch the authoritative status from the REST API to ensure consistency
      void loadOperationalStatus();
    };

    driverWebSocket.setOnMessage(handleSocketMessage);
    return () => {
      driverWebSocket.removeOnMessage(handleSocketMessage);
    };
  }, [loadOperationalStatus]);

  // ─── Persisted preference restore ──────────────────────────────────────────

  useEffect(() => {
    void (async () => {
      const saved = await AsyncStorage.getItem(DRIVER_HOME_CACHE_KEYS.DRIVER_AVAILABILITY_PREF);
      if (saved !== null) {
        const parsed = saved === 'true';
        availabilityPrefRef.current = parsed;
        if (parsed) setIsAvailable(true);
      }
    })();
  }, []);

  // ─── Initial data load ──────────────────────────────────────────────────────

  useEffect(() => {
    void (async () => {
      await loadValidationStatus();
      await loadOperationalStatus();
    })();
  }, [loadOperationalStatus, loadValidationStatus]);

  // ─── Cleanup ────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (availabilityRateLimitTimeoutRef.current) {
        clearTimeout(availabilityRateLimitTimeoutRef.current);
      }
    };
  }, []);

  return {
    isAvailable,
    isLoadingStatus,
    isConnecting,
    isAvailabilityRateLimited,
    apiError,
    validationStatus,
    operationalStatus,
    setApiError,
    loadValidationStatus,
    loadOperationalStatus,
    handleToggleAvailability,
    hasPendingDocuments: () => hasPendingDocuments(validationStatus),
    getValidationWarningMessage: () => getValidationWarningMessage(validationStatus),
    getEligibilityMessage: () => getEligibilityMessage(validationStatus),
    isDriverEligible: () => isDriverEligible(operationalStatus, validationStatus),
  };
}
