import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTheme } from '@/context/ThemeContext';
import { useTrip } from '@/context/TripContext';
import { useChat } from '@/context/ChatContext';
import { twfd } from '@/i18n/waitingForDriver';
import { waitingForDriverFacade } from '@/services/waitingForDriver/waitingForDriverFacade';

interface UseWaitingForDriverScreenParams {
  initialTripId?: string;
  initialEstimatedFare?: number;
  onNavigateMain(): void;
}

export function useWaitingForDriverScreen({
  initialTripId,
  initialEstimatedFare,
  onNavigateMain,
}: UseWaitingForDriverScreenParams) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { activeTrip, cancelTrip, refreshTrip } = useTrip();
  const { openChat, closeChat, isChatOpen, currentRideId, updateRideStatus } = useChat();
  const [tripStatus, setTripStatus] = useState<string>(activeTrip?.status ?? 'REQUESTED');
  const [driver, setDriver] = useState(activeTrip?.driver ?? null);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(initialEstimatedFare ?? activeTrip?.estimated_fare ?? null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const rideId = activeTrip?.id ?? initialTripId ?? null;
  const isSearching = !driver || !waitingForDriverFacade.isDriverAccepted(tripStatus);

  useEffect(() => {
    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: current.coords.latitude, lon: current.coords.longitude });
      } catch {
        setUserLocation(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!rideId) return;
    let active = true;
    const sync = async () => {
      await refreshTrip();
      const snapshot = await waitingForDriverFacade.fetchActiveRideSnapshot(rideId);
      if (!active || !snapshot) return;
      setTripStatus(snapshot.status);
      setEstimatedFare(snapshot.estimatedFare);
      setDriver(snapshot.driver);
      updateRideStatus(snapshot.status);
    };
    sync();
    const timer = setInterval(sync, 7000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [refreshTrip, rideId, updateRideStatus]);

  useEffect(() => {
    if (rideId && waitingForDriverFacade.isFinalStatus(tripStatus)) {
      setRatingModalVisible(true);
    }
  }, [rideId, tripStatus]);

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

  const onCancelRide = useCallback(() => {
    if (!rideId) {
      Alert.alert(twfd('errorTitle'), twfd('missingRide'));
      return;
    }
    Alert.alert(twfd('cancelConfirmTitle'), twfd('cancelConfirmMessage'), [
      { text: twfd('no'), style: 'cancel' },
      {
        text: twfd('yesCancel'),
        style: 'destructive',
        onPress: async () => {
          const response = await cancelTrip('Cancelado pelo passageiro');
          if (!response.success) {
            Alert.alert(twfd('errorTitle'), response.error ?? twfd('missingRide'));
            return;
          }
          onNavigateMain();
        },
      },
    ]);
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

  return {
    colors,
    insets,
    rideId,
    driver,
    tripStatus,
    estimatedFare,
    isSearching,
    userLocation,
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
  };
}
