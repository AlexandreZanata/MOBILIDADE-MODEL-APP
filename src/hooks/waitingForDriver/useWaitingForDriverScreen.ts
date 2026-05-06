/**
 * @file useWaitingForDriverScreen.ts
 * @description Screen-level hook for WaitingForDriverScreen.
 *
 * Responsibilities:
 *  - Polls the active ride snapshot every 7 s (fallback for missed WS events)
 *  - Subscribes to PassengerWebSocket for real-time status updates
 *  - Manages elapsed timer, chat, cancel dialog, and rating modal state
 *  - Exposes only serialisable, typed values to the UI layer
 *
 * Data flow: Hook → Facade → API / WebSocket (no direct Axios/Socket in hook)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTheme } from '@/context/ThemeContext';
import { useTrip } from '@/context/TripContext';
import { useChat } from '@/context/ChatContext';
import { twfd } from '@/i18n/waitingForDriver';
import { waitingForDriverFacade } from '@/services/waitingForDriver/waitingForDriverFacade';
import { passengerWebSocket } from '@/services/websocket/PassengerWebSocket';
import type { PassengerServerMessage } from '@/services/websocket/types/passenger.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseWaitingForDriverScreenParams {
  initialTripId?: string;
  initialEstimatedFare?: number;
  onNavigateMain(): void;
}

interface DriverSummary {
  id: string;
  name: string;
  rating?: number;
  photoUrl?: string;
  vehicle?: { brand?: string; model?: string; plate?: string; color?: string };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWaitingForDriverScreen({
  initialTripId,
  initialEstimatedFare,
  onNavigateMain,
}: UseWaitingForDriverScreenParams) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { activeTrip, cancelTrip, refreshTrip } = useTrip();
  const { openChat, closeChat, isChatOpen, currentRideId, updateRideStatus } = useChat();

  // ── Domain state ────────────────────────────────────────────────────────
  const [tripStatus, setTripStatus] = useState<string>(activeTrip?.status ?? 'REQUESTED');
  const [driver, setDriver] = useState<DriverSummary | null>(activeTrip?.driver ?? null);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(
    initialEstimatedFare ?? activeTrip?.estimated_fare ?? null,
  );
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [originAddress, setOriginAddress] = useState<string | undefined>(
    activeTrip?.origin?.address,
  );
  const [destinationAddress, setDestinationAddress] = useState<string | undefined>(
    activeTrip?.destination?.address,
  );
  const [categoryName, setCategoryName] = useState<string | undefined>(
    activeTrip?.category?.name,
  );

  // ── Rating state ────────────────────────────────────────────────────────
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────
  const rideId = activeTrip?.id ?? initialTripId ?? null;
  const isSearching = useMemo(
    () => !driver || !waitingForDriverFacade.isDriverAccepted(tripStatus),
    [driver, tripStatus],
  );

  // ── Location ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        }
      } catch {
        // Location unavailable — map will render without user pin
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Polling sync ────────────────────────────────────────────────────────
  const syncRef = useRef(false);

  const syncSnapshot = useCallback(async () => {
    if (!rideId || syncRef.current) return;
    syncRef.current = true;
    try {
      await refreshTrip();
      const snapshot = await waitingForDriverFacade.fetchActiveRideSnapshot(rideId);
      if (!snapshot) return;
      setTripStatus(snapshot.status);
      setEstimatedFare(snapshot.estimatedFare);
      setDriver(snapshot.driver);
      updateRideStatus(snapshot.status);
    } finally {
      syncRef.current = false;
    }
  }, [refreshTrip, rideId, updateRideStatus]);

  useEffect(() => {
    if (!rideId) return;
    void syncSnapshot();
    const timer = setInterval(() => void syncSnapshot(), 7_000);
    return () => clearInterval(timer);
  }, [rideId, syncSnapshot]);

  // ── WebSocket subscription ───────────────────────────────────────────────
  useEffect(() => {
    const handleMessage = (message: PassengerServerMessage) => {
      switch (message.type) {
        case 'ride_driver_accepted':
        case 'ride_driver_on_the_way':
        case 'ride_driver_nearby':
        case 'ride_driver_arrived':
        case 'ride_status_update':
          void syncSnapshot();
          break;
        case 'ride_cancelled':
          setTripStatus('CANCELLED');
          updateRideStatus('CANCELLED');
          onNavigateMain();
          break;
        default:
          break;
      }
    };

    passengerWebSocket.setOnMessage(handleMessage);
    return () => {
      passengerWebSocket.setOnMessage(() => undefined);
    };
  }, [onNavigateMain, syncSnapshot, updateRideStatus]);

  // ── Sync activeTrip fields when context updates ──────────────────────────
  useEffect(() => {
    if (activeTrip?.origin?.address) setOriginAddress(activeTrip.origin.address);
    if (activeTrip?.destination?.address) setDestinationAddress(activeTrip.destination.address);
    if (activeTrip?.category?.name) setCategoryName(activeTrip.category.name);
  }, [activeTrip]);

  // ── Rating trigger ───────────────────────────────────────────────────────
  useEffect(() => {
    if (rideId && waitingForDriverFacade.isFinalStatus(tripStatus)) {
      setRatingModalVisible(true);
    }
  }, [rideId, tripStatus]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const onToggleChat = useCallback(() => {
    if (!rideId) {
      Alert.alert(twfd('errorTitle'), twfd('missingRide'));
      return;
    }
    if (isChatOpen && currentRideId === rideId) {
      closeChat();
      return;
    }
    openChat(rideId, driver?.name ?? 'Motorista', undefined, tripStatus, driver?.id);
  }, [closeChat, currentRideId, driver?.id, driver?.name, isChatOpen, openChat, rideId, tripStatus]);

  const onCancelRide = useCallback(async () => {
    if (!rideId) {
      Alert.alert(twfd('errorTitle'), twfd('missingRide'));
      return;
    }
    const response = await cancelTrip('Cancelado pelo passageiro');
    if (!response.success) {
      Alert.alert(twfd('errorTitle'), response.error ?? twfd('missingRide'));
      return;
    }
    onNavigateMain();
  }, [cancelTrip, onNavigateMain, rideId]);

  const onSubmitRating = useCallback(async () => {
    if (!rideId) return;
    if (!waitingForDriverFacade.isFinalStatus(tripStatus)) {
      Alert.alert(twfd('errorTitle'), twfd('ratingUnavailable'));
      return;
    }
    setIsSubmittingRating(true);
    const ok = await waitingForDriverFacade.submitPassengerRating(rideId, ratingValue, ratingComment);
    setIsSubmittingRating(false);
    if (!ok) {
      Alert.alert(twfd('errorTitle'), twfd('ratingFailed'));
      return;
    }
    setRatingModalVisible(false);
    onNavigateMain();
  }, [onNavigateMain, ratingComment, ratingValue, rideId, tripStatus]);

  // ── Return ───────────────────────────────────────────────────────────────
  return {
    colors,
    insets,
    rideId,
    driver,
    tripStatus,
    estimatedFare,
    isSearching,
    userLocation,
    originAddress,
    destinationAddress,
    categoryName,
    ratingModalVisible,
    ratingValue,
    ratingComment,
    isSubmittingRating,
    chatOpenForRide: isChatOpen && currentRideId === rideId,
    setRatingValue,
    setRatingComment,
    setRatingModalVisible,
    onToggleChat,
    onCancelRide,
    onSubmitRating,
    onSkipRating: onNavigateMain,
  } as const;
}
