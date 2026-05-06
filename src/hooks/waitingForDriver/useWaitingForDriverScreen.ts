/**
 * @file useWaitingForDriverScreen.ts
 * @description Screen-level hook for WaitingForDriverScreen.
 *
 * Address resolution strategy (in priority order):
 *  1. navDestinationName — passed from useHome at ride creation (instant, no API)
 *  2. activeTrip.origin/destination.address — if the API returns it (rare)
 *  3. reverseGeocode(lat, lon) — async, cached 24h by places service
 *
 * Coordinate resolution strategy (in priority order):
 *  1. navOrigin / navDestination — passed from useHome at ride creation (instant)
 *  2. activeTrip.origin / destination — from TripContext (may be {lat:0,lng:0})
 *  3. snapshot from polling — updated every 7s
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
import type { RoutePoint } from '@/components/molecules/TileMap';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LatLon {
  lat: number;
  lon: number;
}

interface UseWaitingForDriverScreenParams {
  initialTripId?: string;
  initialEstimatedFare?: number;
  /**
   * Origin coordinates passed from the home screen at ride creation.
   * Available immediately — no API call needed.
   */
  navOrigin?: LatLon;
  /**
   * Destination coordinates passed from the home screen at ride creation.
   * Available immediately — no API call needed.
   */
  navDestination?: LatLon;
  /**
   * Destination display name passed from the home screen.
   * Used as the initial destinationAddress while reverse geocoding runs.
   */
  navDestinationName?: string;
  onNavigateMain(): void;
}

interface DriverSummary {
  id: string;
  name: string;
  rating?: number;
  photoUrl?: string;
  vehicle?: { brand?: string; model?: string; plate?: string; color?: string };
}

/** Returns true when coordinates are valid (not null-island). */
function isValidCoords(coords: LatLon | null | undefined): coords is LatLon {
  return (
    coords != null &&
    Number.isFinite(coords.lat) &&
    Number.isFinite(coords.lon) &&
    !(coords.lat === 0 && coords.lon === 0)
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWaitingForDriverScreen({
  initialTripId,
  initialEstimatedFare,
  navOrigin,
  navDestination,
  navDestinationName,
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

  // ── Coordinate state ────────────────────────────────────────────────────
  // Device GPS — for the user pin on the map
  const [userLocation, setUserLocation] = useState<LatLon | null>(null);

  // Trip origin — initialised from navOrigin (instant) or activeTrip
  const activeTripOrigin = activeTrip?.origin
    ? { lat: activeTrip.origin.lat, lon: activeTrip.origin.lng }
    : null;
  const [tripOrigin, setTripOrigin] = useState<LatLon | null>(
    navOrigin ?? (isValidCoords(activeTripOrigin) ? activeTripOrigin : null),
  );

  // Trip destination — initialised from navDestination (instant) or activeTrip
  const activeTripDest = activeTrip?.destination
    ? { lat: activeTrip.destination.lat, lon: activeTrip.destination.lng }
    : null;
  const [tripDestination, setTripDestination] = useState<LatLon | null>(
    navDestination ?? (isValidCoords(activeTripDest) ? activeTripDest : null),
  );

  // ── Address strings ─────────────────────────────────────────────────────
  // Destination: use navDestinationName immediately, then replace with geocoded
  const [originAddress, setOriginAddress] = useState<string | undefined>(
    activeTrip?.origin?.address,
  );
  const [destinationAddress, setDestinationAddress] = useState<string | undefined>(
    navDestinationName ?? activeTrip?.destination?.address,
  );
  const [categoryName, setCategoryName] = useState<string | undefined>(
    activeTrip?.category?.name,
  );

  // ── Route points for TileMap ────────────────────────────────────────────
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);

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

  // ── Device GPS ──────────────────────────────────────────────────────────
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
        // Location unavailable — map centers on tripOrigin
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Reverse geocoding ───────────────────────────────────────────────────
  const geocodedOriginRef = useRef(false);
  const geocodedDestRef = useRef(!!navDestinationName); // skip if we already have a name

  const geocodeAddresses = useCallback(
    async (origin: LatLon | null, destination: LatLon | null) => {
      if (origin && !geocodedOriginRef.current && isValidCoords(origin)) {
        geocodedOriginRef.current = true;
        const addr = await waitingForDriverFacade.reverseGeocodeCoords(origin.lat, origin.lon);
        if (addr) setOriginAddress(addr);
      }
      if (destination && !geocodedDestRef.current && isValidCoords(destination)) {
        geocodedDestRef.current = true;
        const addr = await waitingForDriverFacade.reverseGeocodeCoords(
          destination.lat,
          destination.lon,
        );
        if (addr) setDestinationAddress(addr);
      }
    },
    [],
  );

  // ── Route calculation ───────────────────────────────────────────────────
  const routeCalculatedRef = useRef(false);

  const calculateRoute = useCallback(
    async (origin: LatLon | null, destination: LatLon | null) => {
      if (!isValidCoords(origin) || !isValidCoords(destination)) return;
      if (routeCalculatedRef.current) return;
      routeCalculatedRef.current = true;
      const points = await waitingForDriverFacade.fetchRoutePoints(origin, destination);
      if (points.length > 0) setRoutePoints(points);
    },
    [],
  );

  // ── On-mount: geocode + route from nav params (instant coords) ──────────
  useEffect(() => {
    const origin = navOrigin ?? (isValidCoords(activeTripOrigin) ? activeTripOrigin : null);
    const dest = navDestination ?? (isValidCoords(activeTripDest) ? activeTripDest : null);

    if (activeTrip?.origin?.address) setOriginAddress(activeTrip.origin.address);
    if (activeTrip?.destination?.address && !navDestinationName) {
      setDestinationAddress(activeTrip.destination.address);
    }
    if (activeTrip?.category?.name) setCategoryName(activeTrip.category.name);

    void geocodeAddresses(origin, dest);
    void calculateRoute(origin, dest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally mount-only

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

      // Update coordinates only if the snapshot has valid ones
      if (snapshot.origin && isValidCoords(snapshot.origin)) {
        setTripOrigin((prev) => prev ?? snapshot.origin);
      }
      if (snapshot.destination) {
        const dest = { lat: snapshot.destination.lat, lon: snapshot.destination.lng };
        if (isValidCoords(dest)) {
          setTripDestination((prev) => prev ?? dest);
          // Trigger geocoding/routing if we didn't have coords before
          void geocodeAddresses(snapshot.origin, dest);
          void calculateRoute(snapshot.origin, dest);
        }
      }
    } finally {
      syncRef.current = false;
    }
  }, [calculateRoute, geocodeAddresses, refreshTrip, rideId, updateRideStatus]);

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
    tripOrigin,
    tripDestination,
    routePoints,
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
