/**
 * Componente que monitora a trip ativa e navega automaticamente
 * para a tela de corrida quando o usuário tem uma corrida em andamento
 */

import React, {useEffect, useRef} from 'react';
import {useNavigation} from '@react-navigation/native';
import {AppState, AppStateStatus} from 'react-native';
import {useTrip} from '@/context/TripContext';
import {useAuth} from '@/context/AuthContext';
import {TripStatus} from '@/services/websocketService';

interface TripNavigationHandlerProps {
  children: React.ReactNode;
}

// Status que devem mostrar WaitingForDriver (passageiro aguardando motorista)
const WAITING_FOR_DRIVER_STATUSES: TripStatus[] = [
  'REQUESTED',
  'DRIVER_ASSIGNED',
  'MOTORISTA_ACEITOU',
  'AGUARDANDO_MOTORISTA',
  'MOTORISTA_ENCONTRADO',
  'DRIVER_ON_THE_WAY',
  'MOTORISTA_A_CAMINHO',
  'DRIVER_NEARBY',
  'MOTORISTA_PROXIMO',
];

// Status que devem mostrar WaitingForDriver (passageiro em corrida também)
const TRIP_IN_PROGRESS_STATUSES: TripStatus[] = [
  'DRIVER_ARRIVING',
  'DRIVER_ARRIVED',
  'MOTORISTA_CHEGOU',
  'PASSENGER_BOARDED',
  'PASSAGEIRO_EMBARCADO',
  'IN_PROGRESS',
  'IN_ROUTE',
  'EM_ROTA',
  'NEAR_DESTINATION',
  'PROXIMO_DESTINO',
  'WAITING_AT_DESTINATION',
];

// Status que indicam corrida finalizada ou cancelada
const COMPLETED_OR_CANCELLED_STATUSES: TripStatus[] = [
  'COMPLETED',
  'CANCELLED',
  'CANCELED_BY_DRIVER',
  'CANCELED_BY_PASSENGER',
  'NO_SHOW',
  'EXPIRED',
];

export const TripNavigationHandler: React.FC<TripNavigationHandlerProps> = ({ children }) => {
  const navigation = useNavigation<any>();
  const { activeTrip, isLoading } = useTrip();
  const { user } = useAuth();
  const hasNavigatedRef = useRef(false);
  const lastTripIdRef = useRef<string | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const navigationReadyRef = useRef(false);

  // Detecta se o usuário é motorista através dos roles retornados na autenticação
  const isDriver = user?.roles?.includes('driver') || user?.type === 'motorista' || user?.type === 'driver';

  // Aguarda navegação estar pronta
  useEffect(() => {
      return navigation.addListener('state', () => {
        navigationReadyRef.current = true;
    });
  }, [navigation]);

  // Função para navegar para a tela de trip
  const navigateToTripScreen = React.useCallback(() => {
    if (!activeTrip || isLoading || !navigationReadyRef.current) {
      return;
    }

    // Se é a mesma trip e já navegou, não navega novamente
    if (hasNavigatedRef.current && lastTripIdRef.current === activeTrip.id) {
      return;
    }

    const tripStatus = activeTrip.status;

    // Se a corrida foi finalizada ou cancelada, não navega
    if (COMPLETED_OR_CANCELLED_STATUSES.includes(tripStatus)) {
      hasNavigatedRef.current = false;
      lastTripIdRef.current = null;
      return;
    }

    try {
      // Verifica rota atual
      const state = navigation.getState();
      const currentRoute = state?.routes[state?.index || 0];
      const currentRouteName = currentRoute?.name;

      // Se já está na tela de trip, não navega novamente
      if (
        currentRouteName === 'WaitingForDriver' ||
        currentRouteName === 'DriverTripInProgress'
      ) {
        // Verifica se é a mesma trip
        const params = (currentRoute as any)?.params;
        if (params?.tripId === activeTrip.id) {
          hasNavigatedRef.current = true;
          lastTripIdRef.current = activeTrip.id;
          return;
        }
      }

      // Navega para a tela apropriada
      if (isDriver) {
        // Motorista: sempre vai para DriverTripInProgress se tiver trip ativa
        navigation.navigate('DriverTripInProgress', {
          tripId: activeTrip.id,
        });
        hasNavigatedRef.current = true;
        lastTripIdRef.current = activeTrip.id;
      } else {
        // Passageiro: decide entre WaitingForDriver (aguardando ou em andamento)
        if (WAITING_FOR_DRIVER_STATUSES.includes(tripStatus) || TRIP_IN_PROGRESS_STATUSES.includes(tripStatus)) {
          navigation.navigate('WaitingForDriver', {
            tripId: activeTrip.id,
          });
          hasNavigatedRef.current = true;
          lastTripIdRef.current = activeTrip.id;
        }
      }
    } catch (error) {
      console.error('[TripNavigationHandler] Erro ao navegar:', error);
      hasNavigatedRef.current = false;
    }
  }, [activeTrip, isLoading, isDriver, navigation]);

  // Monitora mudanças na trip ativa
  useEffect(() => {
    if (!activeTrip) {
      hasNavigatedRef.current = false;
      lastTripIdRef.current = null;
      return;
    }

    // Aguarda um pouco para garantir que a navegação está pronta
    const timer = setTimeout(() => {
      navigateToTripScreen();
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [activeTrip?.id, activeTrip?.status, navigateToTripScreen]);

  // Monitora quando o app volta do background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Quando o app volta para foreground
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // Aguarda um pouco e então tenta navegar se houver trip ativa
        setTimeout(() => {
          if (activeTrip) {
            hasNavigatedRef.current = false; // Reseta para forçar navegação
            navigateToTripScreen();
          }
        }, 1500);
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [activeTrip, navigateToTripScreen]);

  // Reseta o flag quando a trip muda (nova trip)
  useEffect(() => {
    if (activeTrip && lastTripIdRef.current !== activeTrip.id) {
      hasNavigatedRef.current = false;
    }
  }, [activeTrip?.id]);

  return <>{children}</>;
};

