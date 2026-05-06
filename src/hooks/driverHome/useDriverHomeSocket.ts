import { useCallback, useEffect, useRef, useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DriverServerMessage, driverWebSocket } from '@/services/websocket';
import { sendLocalNotification } from '@/services/notificationService';
import { PendingTripData } from '@/models/driverHome/types';
import { DRIVER_HOME_CACHE_KEYS, DRIVER_HOME_TIMERS } from '@/hooks/driverHome/constants';
import { getDriverActiveRide, mapRideOfferToPendingTrip, normalizeRideForNavigation, resolveTripPaymentLabels } from '@/services/driverHome/driverHomeFacade';
import { isTerminalRideStatus } from '@/hooks/driverHome/helpers';
import { tdh } from '@/i18n/driverHome';

interface UseDriverHomeSocketParams {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
}

/**
 * Controla fluxo de corridas e eventos de websocket da Home do motorista.
 */
export function useDriverHomeSocket({ navigation }: UseDriverHomeSocketParams) {
  const [pendingTrip, setPendingTrip] = useState<PendingTripData | null>(null);
  const [showTripRequest, setShowTripRequest] = useState(false);
  const [passengerLocation, setPassengerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isCheckingActiveRide, setIsCheckingActiveRide] = useState(true);
  const offerExpireTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkActiveRide = useCallback(async () => {
    setIsCheckingActiveRide(true);
    try {
      const response = await getDriverActiveRide();
      if (!response.success || !response.data) return;
      const rideData = response.data;
      if (isTerminalRideStatus(rideData.status)) {
        await AsyncStorage.multiRemove([DRIVER_HOME_CACHE_KEYS.ACTIVE_TRIP_ID, DRIVER_HOME_CACHE_KEYS.ACTIVE_TRIP_DATA]);
        return;
      }

      const normalized = normalizeRideForNavigation(rideData);
      await AsyncStorage.setItem(DRIVER_HOME_CACHE_KEYS.ACTIVE_TRIP_ID, normalized.id);
      await AsyncStorage.setItem(DRIVER_HOME_CACHE_KEYS.ACTIVE_TRIP_DATA, JSON.stringify(normalized));
      navigation.replace('DriverTripInProgress', { tripId: normalized.id, tripData: normalized });
    } finally {
      setIsCheckingActiveRide(false);
    }
  }, [navigation]);

  const handleAcceptTrip = useCallback(() => {
    if (!pendingTrip || !driverWebSocket.isConnected) return;
    driverWebSocket.respondToRideOffer(pendingTrip.trip_id, 'accept');
  }, [pendingTrip]);

  const handleRejectTrip = useCallback(() => {
    const tripId = pendingTrip?.trip_id;
    setShowTripRequest(false);
    setPendingTrip(null);
    setPassengerLocation(null);
    if (tripId && driverWebSocket.isConnected) {
      driverWebSocket.respondToRideOffer(tripId, 'reject');
    }
  }, [pendingTrip?.trip_id]);

  const handleOfferTimeout = useCallback(() => {
    if (!pendingTrip) return;
    driverWebSocket.respondToRideOffer(pendingTrip.trip_id, 'reject');
    setShowTripRequest(false);
    setPendingTrip(null);
    setPassengerLocation(null);
  }, [pendingTrip]);

  useEffect(() => {
    const handleMessage = (message: DriverServerMessage) => {
      if (message.type === 'ride_offer') {
        if (showTripRequest || pendingTrip) return;
        const tripData = mapRideOfferToPendingTrip(message);
        setPendingTrip(tripData);
        setShowTripRequest(true);
        setPassengerLocation({ lat: message.origin.lat, lng: message.origin.lng });

        sendLocalNotification(
          tdh('newRideTitle'),
          message.passenger?.name ? tdh('newRideWithPassengerBody', { name: message.passenger.name }) : tdh('newRideBody'),
          { type: 'ride_offer', trip_id: message.trip_id }
        ).catch(() => {});

        void (async () => {
          const resolved = await resolveTripPaymentLabels(message);
          setPendingTrip((prev) =>
            prev && prev.trip_id === message.trip_id
              ? {
                  ...prev,
                  payment_method: message.payment_method ? { name: resolved.paymentMethodName, slug: message.payment_method } : undefined,
                  payment_brand: message.payment_brand
                    ? { name: resolved.paymentBrandName || message.payment_brand, slug: message.payment_brand }
                    : undefined,
                }
              : prev
          );
        })();
        return;
      }

      if (message.type === 'ride_accepted') {
        setPendingTrip((current) => {
          if (!current) return current;
          setShowTripRequest(false);
          const tripId = current.trip_id;
          const tripData = current;
          void AsyncStorage.setItem(DRIVER_HOME_CACHE_KEYS.ACTIVE_TRIP_ID, tripId);
          void AsyncStorage.setItem(
            DRIVER_HOME_CACHE_KEYS.ACTIVE_TRIP_DATA,
            JSON.stringify({
              id: tripId,
              status: 'DRIVER_ASSIGNED',
              origin: tripData.origin,
              destination: tripData.destination,
              estimated_fare: tripData.estimated_fare,
              distance_km: tripData.distance_km,
              duration_seconds: tripData.duration_seconds,
              category: tripData.category ? { id: tripData.category, name: tripData.category } : undefined,
              passenger: tripData.passenger,
              created_at: new Date().toISOString(),
              accepted_at: new Date().toISOString(),
            })
          );
          setTimeout(() => navigation.navigate('DriverTripInProgress', { tripId, tripData }), 100);
          return null;
        });
        return;
      }

      if (message.type === 'ride_rejected') {
        setShowTripRequest(false);
        setPendingTrip(null);
        setPassengerLocation(null);
        return;
      }

      if (message.type === 'passenger_location') {
        setPassengerLocation({ lat: message.lat, lng: message.lng });
      }
    };

    driverWebSocket.setOnMessage(handleMessage);
    return () => driverWebSocket.removeOnMessage(handleMessage);
  }, [navigation, pendingTrip, showTripRequest]);

  useEffect(() => {
    if (offerExpireTimeoutRef.current) {
      clearTimeout(offerExpireTimeoutRef.current);
      offerExpireTimeoutRef.current = null;
    }

    if (!pendingTrip) return;

    const expiresAtMs =
      (pendingTrip.assignment_expires_at && new Date(pendingTrip.assignment_expires_at).getTime()) ||
      Date.now() + DRIVER_HOME_TIMERS.OFFER_DEFAULT_EXPIRE_MS;

    offerExpireTimeoutRef.current = setTimeout(() => {
      handleOfferTimeout();
    }, Math.max(0, expiresAtMs - Date.now()));

    return () => {
      if (offerExpireTimeoutRef.current) clearTimeout(offerExpireTimeoutRef.current);
    };
  }, [handleOfferTimeout, pendingTrip]);

  return {
    pendingTrip,
    showTripRequest,
    passengerLocation,
    isCheckingActiveRide,
    checkActiveRide,
    handleAcceptTrip,
    handleRejectTrip,
    handleOfferTimeout,
    setPassengerLocation,
    setPendingTrip,
    setShowTripRequest,
  };
}
