import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/hooks/useAuth';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { driverWebSocket } from '@/services/websocket';
import { useTrip } from '@/context/TripContext';
import { useDriverHomeAvailability } from '@/hooks/driverHome/useDriverHomeAvailability';
import { useDriverHomeLocation } from '@/hooks/driverHome/useDriverHomeLocation';
import { useDriverHomeSocket } from '@/hooks/driverHome/useDriverHomeSocket';
import { DRIVER_HOME_TIMERS } from '@/hooks/driverHome/constants';
import {
  getOperationalSnapshotSummary,
  isDriverEligible,
  shouldShowOperationalAvailabilityHint,
} from '@/hooks/driverHome/helpers';
import { tdh } from '@/i18n/driverHome';

interface UseDriverHomeParams {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
}

/** Hook orquestrador da Home do motorista. */
export function useDriverHome({ navigation }: UseDriverHomeParams) {
  const { user } = useAuth();
  const { connectWebSocket, isWebSocketConnected } = useTrip();
  const ensureToken = useTokenRefresh();
  void ensureToken;

  const [isUpdatingLocation] = useState(false);
  const [isAvailableForLocation, setIsAvailableForLocation] = useState(false);
  const [infoCardHeight, setInfoCardHeight] = useState(0);
  const [statusCardHeight, setStatusCardHeight] = useState(0);

  const location = useDriverHomeLocation({
    isAvailable: isAvailableForLocation,
    isWebSocketConnected,
    userId: user?.userId,
  });

  const availability = useDriverHomeAvailability({
    currentLocation: location.currentLocation,
    connectWebSocket,
    isWebSocketConnected,
  });

  const socket = useDriverHomeSocket({ navigation });

  useLayoutEffect(() => {
    setIsAvailableForLocation(availability.isAvailable);
  }, [availability.isAvailable]);

  /** Mantém WSS ligado enquanto disponível (ex.: retorno ao app ou falha de rede). */
  useEffect(() => {
    if (!availability.isAvailable) return;
    if (driverWebSocket.isConnected) return;
    void connectWebSocket();
  }, [availability.isAvailable, connectWebSocket, isWebSocketConnected]);

  useFocusEffect(
    useCallback(() => {
      void socket.checkActiveRide();
      return () => {};
    }, [socket.checkActiveRide])
  );

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(async () => {
        await availability.loadValidationStatus();
        await availability.loadOperationalStatus();
      }, DRIVER_HOME_TIMERS.ACTIVE_RIDE_CHECK_DELAY_MS);
      return () => clearTimeout(timer);
    }, [availability.loadOperationalStatus, availability.loadValidationStatus])
  );

  const handleAcceptTrip = useCallback(() => {
    if (!socket.pendingTrip) return;
    if (!driverWebSocket.isConnected) {
      Alert.alert(tdh('connectionErrorTitle'), tdh('connectionErrorDescription'), [{ text: 'OK' }]);
      return;
    }
    socket.handleAcceptTrip();
  }, [socket.handleAcceptTrip, socket.pendingTrip]);

  const driverEligible = useMemo(
    () => isDriverEligible(availability.operationalStatus, availability.validationStatus),
    [availability.operationalStatus, availability.validationStatus]
  );

  const operationalSnapshotText = useMemo(
    () => getOperationalSnapshotSummary(availability.operationalStatus),
    [availability.operationalStatus]
  );

  const showOperationalAvailabilityHint = useMemo(
    () => shouldShowOperationalAvailabilityHint(availability.operationalStatus, driverEligible),
    [availability.operationalStatus, driverEligible]
  );

  const serverBlocksReceiveRides = useMemo(
    () => Boolean(availability.operationalStatus && !availability.operationalStatus.canReceiveRides),
    [availability.operationalStatus]
  );

  const handleToggleAvailability = useCallback(
    async (value: boolean) => {
      if (value && !location.currentLocation) {
        await location.requestLocationPermission(true, true);
        if (!location.currentLocation) {
          Alert.alert(tdh('locationErrorTitle'), tdh('locationErrorDescription'), [{ text: 'OK' }]);
          return;
        }
      }
      await availability.handleToggleAvailability(value);
    },
    [availability.handleToggleAvailability, location.currentLocation, location.requestLocationPermission]
  );

  return {
    isAvailable: availability.isAvailable,
    isUpdatingLocation,
    currentLocation: location.currentLocation,
    mapCenter: location.mapCenter,
    mapZoom: location.mapZoom,
    pendingTrip: socket.pendingTrip,
    showTripRequest: socket.showTripRequest,
    locationError: location.locationError,
    apiError: availability.apiError || location.apiError,
    hasUserMovedMap: location.hasUserMovedMap,
    nearbyDrivers: location.nearbyDrivers,
    activePassengers: location.activePassengers,
    infoCardHeight,
    statusCardHeight,
    operationalStatus: availability.operationalStatus,
    validationStatus: availability.validationStatus,
    isLoadingStatus: availability.isLoadingStatus,
    passengerLocation: socket.passengerLocation,
    isCheckingActiveRide: socket.isCheckingActiveRide,
    isConnecting: availability.isConnecting,
    isAvailabilityRateLimited: availability.isAvailabilityRateLimited,
    isRateLimited: location.isRateLimited,
    driverEligible,
    operationalSnapshotText,
    showOperationalAvailabilityHint,
    serverBlocksReceiveRides,
    hasPendingDocuments: availability.hasPendingDocuments,
    getValidationWarningMessage: availability.getValidationWarningMessage,
    getEligibilityMessage: availability.getEligibilityMessage,
    setInfoCardHeight,
    setStatusCardHeight,
    setMapCenter: location.setMapCenter,
    setMapZoom: location.setMapZoom,
    handleMapMove: location.handleMapMove,
    handleRecenterLocation: location.handleRecenterLocation,
    handleZoomIn: location.handleZoomIn,
    handleZoomOut: location.handleZoomOut,
    handleToggleAvailability,
    handleAcceptTrip,
    handleRejectTrip: socket.handleRejectTrip,
    handleOfferTimeout: socket.handleOfferTimeout,
  };
}
