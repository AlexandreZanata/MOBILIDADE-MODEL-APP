import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';
import { tripsService } from '@/services/tripsService';
import { driverWebSocket, type DriverServerMessage, type TripStatus } from '@/services/websocket';
import {
  startDriverBackgroundLocation,
  startPassengerBackgroundLocation,
  stopDriverBackgroundLocation,
  stopPassengerBackgroundLocation,
} from '@/services/backgroundLocationService';
import { sendLocalNotification } from '@/services/notificationService';
import { COMPLETED_OR_CANCELLED_STATUSES, STORAGE_ACTIVE_TRIP_DATA, STORAGE_ACTIVE_TRIP_ID } from './constants';
import { mapRideToActiveTrip } from './mappers';
import type { ActiveTrip, PendingTripRequest, TripContextData, TripDestination, TripOrigin } from './types';

const statusNotifications: Partial<Record<TripStatus, { title: string; body: string }>> = {
  DRIVER_ASSIGNED: { title: 'Motorista encontrado', body: 'Um motorista aceitou sua corrida.' },
  MOTORISTA_ACEITOU: { title: 'Motorista encontrado', body: 'Um motorista aceitou sua corrida.' },
  DRIVER_ON_THE_WAY: { title: 'Motorista a caminho', body: 'Seu motorista ja esta a caminho.' },
  MOTORISTA_A_CAMINHO: { title: 'Motorista a caminho', body: 'Seu motorista ja esta a caminho.' },
  DRIVER_NEARBY: { title: 'Motorista proximo', body: 'O motorista esta chegando.' },
  MOTORISTA_PROXIMO: { title: 'Motorista proximo', body: 'O motorista esta chegando.' },
  DRIVER_ARRIVED: { title: 'Motorista chegou', body: 'O motorista esta no ponto de encontro.' },
  MOTORISTA_CHEGOU: { title: 'Motorista chegou', body: 'O motorista esta no ponto de encontro.' },
};

type SessionUser = { roles?: string[]; type?: string; userId?: string };

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

export function useTripProvider(isAuthenticated: boolean, user?: SessionUser | null): TripContextData {
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [pendingTripRequest, setPendingTripRequest] = useState<PendingTripRequest | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const lastStatusRef = useRef<TripStatus | null>(null);

  const userType = useMemo<'driver' | 'passenger'>(() => {
    const isDriver = user?.roles?.includes('driver') || user?.type === 'motorista' || user?.type === 'driver';
    return isDriver ? 'driver' : 'passenger';
  }, [user?.roles, user?.type]);

  const persistTrip = useCallback(async (trip: ActiveTrip | null) => {
    if (!trip?.id) return;
    await AsyncStorage.setItem(STORAGE_ACTIVE_TRIP_ID, trip.id);
    await AsyncStorage.setItem(STORAGE_ACTIVE_TRIP_DATA, JSON.stringify(trip));
  }, []);

  const clearPersistedTrip = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_ACTIVE_TRIP_ID);
    await AsyncStorage.removeItem(STORAGE_ACTIVE_TRIP_DATA);
  }, []);

  const fetchActiveRide = useCallback(async (): Promise<ActiveTrip | null> => {
    const response = userType === 'driver' ? await apiService.getDriverActiveRide() : await apiService.getPassengerActiveRide();
    if (!response.success || !response.data) return null;
    const data = toRecord(response.data);
    if (!data) return null;
    const mapped = mapRideToActiveTrip(data);
    if (COMPLETED_OR_CANCELLED_STATUSES.includes(mapped.status)) return null;
    setActiveTrip(mapped);
    await persistTrip(mapped);
    return mapped;
  }, [persistTrip, userType]);

  const refreshTrip = useCallback(async () => undefined, []);

  useEffect(() => {
    void persistTrip(activeTrip);
  }, [activeTrip, persistTrip]);

  const connectWebSocket = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !user?.userId || userType !== 'driver') return false;
    driverWebSocket.setOnMessage((message: DriverServerMessage) => {
      if (message.type === 'active_ride') void fetchActiveRide();
    });
    driverWebSocket.setOnConnectionStateChange(setIsWebSocketConnected);
    driverWebSocket.setOnError(() => setIsWebSocketConnected(false));
    const connected = await driverWebSocket.connect();
    setIsWebSocketConnected(connected);
    return connected;
  }, [fetchActiveRide, isAuthenticated, user?.userId, userType]);

  const disconnectWebSocket = useCallback(() => {
    if (userType === 'driver') driverWebSocket.disconnect();
    setIsWebSocketConnected(false);
  }, [userType]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        if (userType === 'driver' && !isWebSocketConnected) void connectWebSocket();
        if (!activeTrip?.id) void fetchActiveRide();
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [activeTrip?.id, connectWebSocket, fetchActiveRide, isWebSocketConnected, userType]);

  useEffect(() => {
    if (!isAuthenticated || !user?.userId) return;
    const manage = async () => {
      if (!activeTrip?.id || COMPLETED_OR_CANCELLED_STATUSES.includes(activeTrip.status)) {
        await stopDriverBackgroundLocation();
        await stopPassengerBackgroundLocation();
        return;
      }
      if (userType === 'driver' && isWebSocketConnected) await startDriverBackgroundLocation();
      if (userType === 'passenger') await startPassengerBackgroundLocation();
    };
    void manage();
  }, [activeTrip?.id, activeTrip?.status, isAuthenticated, isWebSocketConnected, user?.userId, userType]);

  useEffect(() => {
    if (!activeTrip?.id || userType !== 'passenger') return;
    if (lastStatusRef.current === activeTrip.status) return;
    lastStatusRef.current = activeTrip.status;
    const data = statusNotifications[activeTrip.status];
    if (data) void sendLocalNotification(data.title, data.body, { tripId: activeTrip.id, status: activeTrip.status });
  }, [activeTrip?.id, activeTrip?.status, userType]);

  const createTrip = useCallback(
    async (origin: TripOrigin, destination: TripDestination, tripCategoryId: string, paymentMethodId: string, paymentBrandId?: string, estimatedFare?: number) => {
      setIsLoading(true);
      try {
        const response = await tripsService.createTrip({
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          trip_category_id: tripCategoryId,
          payment_method_id: paymentMethodId,
          payment_brand_id: paymentBrandId,
        });
        if (!response.success || !response.data) return { success: false, error: response.error || response.message || 'Erro ao criar corrida' };
        const data = toRecord(response.data);
        if (!data) return { success: false, error: 'Erro ao criar corrida' };
        const mapped = mapRideToActiveTrip(data);
        mapped.estimated_fare = mapped.estimated_fare || estimatedFare || 0;
        setActiveTrip(mapped);
        await persistTrip(mapped);
        return { success: true, tripId: mapped.id };
      } finally {
        setIsLoading(false);
      }
    },
    [persistTrip]
  );

  const cancelTrip = useCallback(async (reason?: string) => {
    if (!activeTrip?.id) return { success: false, error: 'Nenhuma corrida ativa' };
    setIsLoading(true);
    try {
      const response = await tripsService.cancelTrip(activeTrip.id, reason);
      if (!response.success) return { success: false, error: response.error || response.message || 'Erro ao cancelar corrida' };
      setActiveTrip(null);
      await clearPersistedTrip();
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  }, [activeTrip?.id, clearPersistedTrip]);

  const rateTrip = useCallback(async (rating: number, comment?: string) => {
    if (!activeTrip?.id) return { success: false, error: 'Nenhuma corrida para avaliar' };
    const response = await tripsService.rateTrip(activeTrip.id, rating, comment);
    if (!response.success) return { success: false, error: response.error || response.message || 'Erro ao avaliar corrida' };
    setActiveTrip(null);
    await clearPersistedTrip();
    return { success: true };
  }, [activeTrip?.id, clearPersistedTrip]);

  const acceptTrip = useCallback(async (tripId: string) => {
    const response = await tripsService.acceptTrip(tripId);
    if (!response.success || !response.data) return { success: false, error: response.error || response.message || 'Erro ao aceitar corrida' };
    const data = toRecord(response.data);
    if (!data) return { success: false, error: 'Erro ao aceitar corrida' };
    const mapped = mapRideToActiveTrip(data);
    setActiveTrip(mapped);
    setPendingTripRequest(null);
    await persistTrip(mapped);
    return { success: true };
  }, [persistTrip]);

  const rejectTrip = useCallback(async () => setPendingTripRequest(null), []);

  const cancelDriverRide = useCallback(async (rideId: string) => {
    const response = await apiService.driverRideCancel(rideId, 'Cancelado pelo motorista');
    if (!response.success && response.status !== 204) return { success: false, error: response.error || response.message || 'Erro ao cancelar corrida' };
    setActiveTrip(null);
    setPendingTripRequest(null);
    await clearPersistedTrip();
    return { success: true };
  }, [clearPersistedTrip]);

  const updateTripStatus = useCallback(async (status: TripStatus, reason?: string) => {
    if (!activeTrip?.id) return { success: false, error: 'Nenhuma corrida ativa' };
    const response = await apiService.updateTripStatus(activeTrip.id, status, reason);
    if (!response.success) return { success: false, error: response.error || response.message || 'Erro ao atualizar status' };
    setActiveTrip((prev) => (prev ? { ...prev, status } : prev));
    if (COMPLETED_OR_CANCELLED_STATUSES.includes(status)) {
      setTimeout(() => void clearPersistedTrip().then(() => setActiveTrip(null)), 3000);
    }
    return { success: true };
  }, [activeTrip?.id, clearPersistedTrip]);

  const loadTripFromStorage = useCallback(async () => {
    const data = await AsyncStorage.getItem(STORAGE_ACTIVE_TRIP_DATA);
    if (!data) return;
    const parsed = JSON.parse(data) as ActiveTrip;
    if (COMPLETED_OR_CANCELLED_STATUSES.includes(parsed.status)) return void clearPersistedTrip();
    setActiveTrip(parsed);
  }, [clearPersistedTrip]);

  const clearTrip = useCallback(() => {
    setActiveTrip(null);
    setPendingTripRequest(null);
    setDriverLocation(null);
  }, []);

  return {
    activeTrip,
    isLoading,
    isWebSocketConnected,
    pendingTripRequest,
    driverLocation,
    createTrip,
    cancelTrip,
    rateTrip,
    acceptTrip,
    rejectTrip,
    cancelDriverRide,
    updateTripStatus,
    refreshTrip,
    loadTripFromStorage,
    clearTrip,
    connectWebSocket,
    disconnectWebSocket,
  };
}
