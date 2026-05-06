import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChat } from '@/context/ChatContext';
import { driverWebSocket, DriverServerMessage } from '@/services/websocket';
import { startDriverBackgroundLocation, stopDriverBackgroundLocation } from '@/services/backgroundLocationService';
import { driverTripInProgressService } from '@/services/driverTripInProgress/driverTripInProgressService';
import { DriverTripCoordinate, DriverTripData, DriverTripStatusButton, DriverTripViewData } from '@/models/driverTripInProgress/types';
import { parsePassengerLocationMessage } from '@/models/driverTripInProgress/schemas';
import { tdt } from '@/i18n/driverTripInProgress';

const DEFAULT_CENTER: DriverTripCoordinate = { lat: -12.5458, lon: -55.7061 };
const ZOOM_LEVELS = [12, 14, 16, 18, 20];
const CANCEL_LOCKED = ['PASSENGER_BOARDED', 'IN_PROGRESS', 'IN_ROUTE', 'NEAR_DESTINATION', 'WAITING_AT_DESTINATION', 'COMPLETED'];

interface Params {
  tripIdParam?: string;
  tripDataParam?: unknown;
  onNavigateHome: () => void;
}

export function useDriverTripInProgress({ tripIdParam, tripDataParam, onNavigateHome }: Params) {
  const { openChat, closeChat, isChatOpen, currentRideId, chatState, updateRideStatus } = useChat();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [view, setView] = useState<DriverTripViewData>({
    rideId: tripIdParam ?? null, tripData: null, currentStatus: '', mapCenter: DEFAULT_CENTER, mapZoom: 16, routePoints: [],
    driverLocation: null, passengerLocation: null, destinationLocation: null, originAddress: '', destinationAddress: '',
    passengerInfo: null, isLoading: true, isUpdating: false, isMinimized: false, canCancelRide: false, statusButton: null,
    ratingModalVisible: false, cancelModalVisible: false, isSubmittingRating: false,
    ratingForm: { ratingValue: 5, ratingComment: '', hasUserClickedStar: false }, cancelForm: { reason: tdt('cancelRideDefaultReason') },
  });

  const rideId = view.rideId || view.tripData?.id || null;
  const setStatus = (status: string) => {
    setView((prev) => ({ ...prev, currentStatus: status }));
    updateRideStatus(status);
  };

  const syncTrip = useCallback(async (payload: unknown) => {
    const parsed = await (async () => {
      try { return (await import('@/models/driverTripInProgress/schemas')).parseDriverTripData(payload); } catch { return null; }
    })();
    if (!parsed) return;
    const passenger = parsed.passenger ?? (parsed.passengerId ? { id: parsed.passengerId, name: parsed.passengerName || tdt('passengerFallbackName') } : null);
    const [originAddress, destinationAddress] = await Promise.all([
      parsed.origin ? driverTripInProgressService.resolveAddress(parsed.origin) : Promise.resolve(''),
      parsed.destination ? driverTripInProgressService.resolveAddress(parsed.destination) : Promise.resolve(''),
    ]);
    setView((prev) => ({
      ...prev,
      rideId: parsed.id,
      tripData: parsed,
      currentStatus: parsed.status,
      mapCenter: parsed.origin ?? parsed.destination ?? prev.mapCenter,
      passengerInfo: passenger,
      passengerLocation: parsed.origin ?? null,
      destinationLocation: parsed.destination ?? null,
      originAddress,
      destinationAddress,
      isLoading: false,
    }));
    setStatus(parsed.status);
  }, [updateRideStatus]);

  const loadTrip = useCallback(async () => {
    setView((prev) => ({ ...prev, isLoading: true }));
    if (tripDataParam) await syncTrip(tripDataParam);
    const active = await driverTripInProgressService.getDriverActiveRide();
    if (active.success && active.data) await syncTrip(active.data);
    else if (tripIdParam) {
      const details = await driverTripInProgressService.getRideDetails(tripIdParam);
      if (details.success && details.data) await syncTrip(details.data);
      else setView((prev) => ({ ...prev, isLoading: false }));
    } else setView((prev) => ({ ...prev, isLoading: false }));
  }, [syncTrip, tripDataParam, tripIdParam]);

  const refreshDriverLocation = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const next = { lat: loc.coords.latitude, lon: loc.coords.longitude };
    setView((prev) => ({ ...prev, driverLocation: next, mapCenter: prev.driverLocation ? prev.mapCenter : next }));
    if (driverWebSocket.isConnected) driverWebSocket.sendLocationUpdate({ lat: next.lat, lng: next.lon });
    if (view.passengerLocation) {
      const route = await driverTripInProgressService.calculateRoutePoints(next, view.passengerLocation);
      setView((prev) => ({ ...prev, routePoints: route }));
    }
  }, [view.passengerLocation]);

  useEffect(() => { void loadTrip(); }, [loadTrip]);
  useEffect(() => {
    if (!rideId) return;
    void driverWebSocket.connect();
    const onMessage = (message: DriverServerMessage) => {
      if (message.type !== 'passenger_location') return;
      try {
        const parsed = parsePassengerLocationMessage(message);
        if (parsed.rideId !== rideId) return;
        setView((prev) => ({ ...prev, passengerLocation: parsed.location }));
      } catch {}
    };
    driverWebSocket.setOnMessage(onMessage);
    void startDriverBackgroundLocation();
    void refreshDriverLocation();
    intervalRef.current = setInterval(() => { void refreshDriverLocation(); }, 3000);
    return () => {
      driverWebSocket.removeOnMessage(onMessage);
      if (intervalRef.current) clearInterval(intervalRef.current);
      void stopDriverBackgroundLocation();
    };
  }, [rideId, refreshDriverLocation]);

  useFocusEffect(useCallback(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []));

  const statusButton = useMemo<DriverTripStatusButton | null>(() => {
    const status = (view.currentStatus || view.tripData?.status || '').toUpperCase();
    if (['DRIVER_ASSIGNED', 'MOTORISTA_ACEITOU', 'DRIVER_FOUND', 'ACCEPTED'].includes(status)) return { title: tdt('statusOnTheWay'), status: 'DRIVER_ON_THE_WAY', variant: 'primary' };
    if (['DRIVER_ON_THE_WAY', 'DRIVER_ARRIVING', 'MOTORISTA_A_CAMINHO'].includes(status)) return { title: tdt('statusNearby'), status: 'DRIVER_NEARBY', variant: 'primary' };
    if (['DRIVER_NEARBY', 'MOTORISTA_PROXIMO'].includes(status)) return { title: tdt('statusArrived'), status: 'DRIVER_ARRIVED', variant: 'primary' };
    if (['DRIVER_ARRIVED', 'MOTORISTA_CHEGOU'].includes(status)) return { title: tdt('statusBoarded'), status: 'PASSENGER_BOARDED', variant: 'primary' };
    if (['PASSENGER_BOARDED', 'IN_PROGRESS', 'PASSAGEIRO_EMBARCADO'].includes(status)) return { title: tdt('statusInRoute'), status: 'IN_ROUTE', variant: 'primary' };
    if (['IN_ROUTE', 'EM_ROTA'].includes(status)) return { title: tdt('statusNearDestination'), status: 'NEAR_DESTINATION', variant: 'primary' };
    if (['NEAR_DESTINATION', 'PROXIMO_DESTINO', 'WAITING_AT_DESTINATION'].includes(status)) return { title: tdt('statusComplete'), status: 'COMPLETED', variant: 'secondary' };
    return null;
  }, [view.currentStatus, view.tripData?.status]);

  const runStatusAction = useCallback(async (action: DriverTripStatusButton['status']) => {
    if (!rideId) return;
    setView((prev) => ({ ...prev, isUpdating: true }));
    const coords = view.driverLocation ? { lat: view.driverLocation.lat, lng: view.driverLocation.lon } : null;
    const response = action === 'DRIVER_ON_THE_WAY' ? await driverTripInProgressService.markOnTheWay(rideId)
      : action === 'DRIVER_NEARBY' && coords ? await driverTripInProgressService.markNearby(rideId, coords)
      : action === 'DRIVER_ARRIVED' && coords ? await driverTripInProgressService.markArrived(rideId, coords)
      : action === 'PASSENGER_BOARDED' ? await driverTripInProgressService.markBoarded(rideId)
      : action === 'IN_ROUTE' ? await driverTripInProgressService.markInRoute(rideId)
      : action === 'NEAR_DESTINATION' && coords ? await driverTripInProgressService.markNearDestination(rideId, coords)
      : await driverTripInProgressService.completeRide(rideId, view.tripData?.finalFare ?? view.tripData?.estimatedFare ?? 0);
    if (response.success || response.status === 204) {
      setStatus(action === 'IN_ROUTE' ? 'IN_ROUTE' : action);
      if (action === 'COMPLETED') setView((prev) => ({ ...prev, ratingModalVisible: true }));
    } else Alert.alert(tdt('genericErrorTitle'), response.message || tdt('genericErrorTitle'));
    setView((prev) => ({ ...prev, isUpdating: false }));
  }, [rideId, view.driverLocation, view.tripData?.estimatedFare, view.tripData?.finalFare]);

  return {
    view: { ...view, statusButton, canCancelRide: !CANCEL_LOCKED.includes((view.currentStatus || '').toUpperCase()) },
    chatUnreadCount: chatState.unreadCount,
    isChatOpenForRide: Boolean(rideId && isChatOpen && currentRideId === rideId),
    handleToggleChat: () => {
      if (!rideId) return Alert.alert(tdt('chatUnavailableTitle'), tdt('chatUnavailableDescription'));
      if (isChatOpen && currentRideId === rideId) return closeChat();
      openChat(rideId, view.passengerInfo?.name, view.passengerInfo?.photoUrl, view.currentStatus, view.passengerInfo?.id);
    },
    handleSetMapZoom: (value: number) => setView((prev) => ({ ...prev, mapZoom: value })),
    handleZoomIn: () => setView((prev) => ({ ...prev, mapZoom: ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, ZOOM_LEVELS.findIndex((v) => v >= prev.mapZoom) + 1)] ?? prev.mapZoom })),
    handleZoomOut: () => setView((prev) => ({ ...prev, mapZoom: ZOOM_LEVELS[Math.max(0, ZOOM_LEVELS.findIndex((v) => v >= prev.mapZoom) - 1)] ?? prev.mapZoom })),
    handleRecenter: () => setView((prev) => ({ ...prev, mapCenter: prev.driverLocation ?? prev.mapCenter })),
    handleToggleMinimized: () => setView((prev) => ({ ...prev, isMinimized: !prev.isMinimized })),
    handleStatusUpdate: runStatusAction,
    handleSetCancelModalVisible: (visible: boolean) => setView((prev) => ({ ...prev, cancelModalVisible: visible })),
    handleSetCancelReason: (reason: string) => setView((prev) => ({ ...prev, cancelForm: { reason } })),
    handleCancelRide: async () => {
      if (!rideId) return;
      const reason = view.cancelForm.reason.trim() || tdt('cancelRideDefaultReason');
      const response = await driverTripInProgressService.cancelRide(rideId, reason);
      if (response.success || response.status === 204) {
        await AsyncStorage.multiRemove(['@vamu:active_trip_id', '@vamu:active_trip_data']);
        await driverTripInProgressService.markDriverAvailable();
        Alert.alert(tdt('cancelRideSuccessTitle'), tdt('cancelRideSuccessDescription'), [{ text: 'OK', onPress: onNavigateHome }]);
      } else Alert.alert(tdt('genericErrorTitle'), response.message || tdt('genericErrorTitle'));
    },
    handleSetRatingValue: (ratingValue: number) => setView((prev) => ({ ...prev, ratingForm: { ...prev.ratingForm, ratingValue, hasUserClickedStar: true } })),
    handleSetRatingComment: (ratingComment: string) => setView((prev) => ({ ...prev, ratingForm: { ...prev.ratingForm, ratingComment } })),
    handleSetRatingModalVisible: (visible: boolean) => setView((prev) => ({ ...prev, ratingModalVisible: visible })),
    handleSubmitRating: async () => {
      if (!rideId) return;
      setView((prev) => ({ ...prev, isSubmittingRating: true }));
      const rating = view.ratingForm.hasUserClickedStar ? view.ratingForm.ratingValue : 5;
      const response = await driverTripInProgressService.submitRating(rideId, rating, view.ratingForm.ratingComment.trim() || undefined);
      if (response.success || response.status === 204) {
        await driverTripInProgressService.markDriverAvailable();
        Alert.alert(tdt('ratingSuccessTitle'), tdt('ratingSuccessDescription'), [{ text: 'OK', onPress: onNavigateHome }]);
      } else Alert.alert(tdt('genericErrorTitle'), response.message || tdt('genericErrorTitle'));
      setView((prev) => ({ ...prev, isSubmittingRating: false }));
    },
  };
}
