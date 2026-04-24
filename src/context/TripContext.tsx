/**
 * Contexto de Trip para gerenciamento de estado global de corridas
 * Integra com WebSocket para atualizações em tempo real
 * Seguindo as especificações do frontendguide.txt
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';
import { tripsService } from '@/services/tripsService';
import {
  driverWebSocket,
  type DriverServerMessage,
  type DriverActiveRideMessage,
  type TripStatus,
  type TripAssignedPayload,
  type TripStatusChangedPayload,
  type DriverLocationUpdatePayload,
} from '@/services/websocket';
import {
  startDriverBackgroundLocation,
  stopDriverBackgroundLocation,
  startPassengerBackgroundLocation,
  stopPassengerBackgroundLocation,
} from '@/services/backgroundLocationService';
import {
  getNotificationToken,
  registerNotificationToken,
  setupNotificationListeners,
  setupNotificationResponseListener,
  sendLocalNotification,
} from '@/services/notificationService';

// Status que indicam corrida finalizada ou cancelada
const COMPLETED_OR_CANCELLED_STATUSES: TripStatus[] = [
  'COMPLETED',
  'CANCELLED',
  'CANCELED_BY_DRIVER',
  'CANCELED_BY_PASSENGER',
  'NO_SHOW',
  'EXPIRED',
];
import { useAuth } from './AuthContext';

/**
 * Normaliza status vindos da API / WebSocket para o formato interno (TripStatus)
 * - Remove espaços extras
 * - Converte para maiúsculas
 * - Converte espaços em underscore
 * - Aplica mapeamentos específicos entre versões antigas/legadas e as atuais
 */
const normalizeTripStatus = (rawStatus?: string | null): TripStatus => {
  if (!rawStatus) return 'REQUESTED';

  // Normalização básica
  let normalized = rawStatus.trim().toUpperCase();

  // Mapeia strings conhecidas sem underscore para a convenção interna
  const explicitMap: Record<string, TripStatus> = {
    'AGUARDANDO MOTORISTA': 'AGUARDANDO_MOTORISTA',
    'MOTORISTA ENCONTRADO': 'DRIVER_ASSIGNED',
    'MOTORISTA ACEITOU': 'MOTORISTA_ACEITOU',
    'MOTORISTA A CAMINHO': 'MOTORISTA_A_CAMINHO',
    'MOTORISTA PROXIMO': 'MOTORISTA_PROXIMO',
    'MOTORISTA PRÓXIMO': 'MOTORISTA_PROXIMO',
    'MOTORISTA CHEGOU': 'MOTORISTA_CHEGOU',
    'PASSAGEIRO EMBARCADO': 'PASSAGEIRO_EMBARCADO',
    'EM ROTA': 'EM_ROTA',
    'PRÓXIMO DESTINO': 'PROXIMO_DESTINO',
    'PROXIMO DESTINO': 'PROXIMO_DESTINO',
    'CORRIDA FINALIZADA': 'COMPLETED',
    'CANCELADA PASSAGEIRO': 'CANCELADA_PASSAGEIRO' as any,
    'CANCELADA MOTORISTA': 'CANCELADA_MOTORISTA' as any,
    'CANCELADA ADMIN': 'CANCELADA_ADMIN' as any,
    // Frases completas de cancelamento/expiração
    'CANCELADO PELO MOTORISTA': 'CANCELED_BY_DRIVER',
    'CANCELADA PELO MOTORISTA': 'CANCELED_BY_DRIVER',
    'CANCELADO PELO PASSAGEIRO': 'CANCELED_BY_PASSENGER',
    'CANCELADA PELO PASSAGEIRO': 'CANCELED_BY_PASSENGER',
    'CORRIDA EXPIRADA': 'EXPIRED',
    // Inglês sem underscore
    'DRIVER ON THE WAY': 'DRIVER_ON_THE_WAY',
    'DRIVER NEARBY': 'DRIVER_NEARBY',
    'DRIVER ARRIVED': 'DRIVER_ARRIVED',
    'PASSENGER BOARDED': 'PASSENGER_BOARDED',
    'IN ROUTE': 'IN_ROUTE',
    'NEAR DESTINATION': 'NEAR_DESTINATION',
    'WAITING AT DESTINATION': 'WAITING_AT_DESTINATION',
  };

  if (explicitMap[normalized]) {
    return explicitMap[normalized];
  }

  // Fallback genérico: substitui espaços por underscore
  normalized = normalized.replace(/\s+/g, '_') as TripStatus;

  return normalized as TripStatus;
};

// Tipos
export interface TripOrigin {
  lat: number;
  lng: number;
  address?: string;
}

export interface TripDestination {
  lat: number;
  lng: number;
  address?: string;
}

export interface TripDriver {
  id: string;
  name: string;
  rating?: number;
  phone?: string;
  vehicle?: {
    brand?: string;
    model?: string;
    plate?: string;
    color?: string;
  };
  location?: {
    lat: number;
    lng: number;
  };
}

export interface TripPassenger {
  id: string;
  name: string;
  rating?: number;
  phone?: string;
}

export interface ActiveTrip {
  id: string;
  status: TripStatus;
  origin: TripOrigin;
  destination: TripDestination;
  estimated_fare: number;
  final_fare?: number;
  distance_km?: number;
  duration_seconds?: number;
  category?: {
    id: string;
    name: string;
  };
  driver?: TripDriver;
  passenger?: TripPassenger;
  payment_method_id?: string;
  payment_brand_id?: string;
  created_at?: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  assignment_expires_at?: string;
}

export interface PendingTripRequest {
  trip_id: string;
  origin: TripOrigin;
  destination: TripDestination;
  estimated_fare: number;
  assignment_expires_at: string;
  category?: string;
  requested_at?: string;
  passenger?: TripPassenger;
  distance_km?: number;
  duration_seconds?: number;
}

interface TripContextData {
  // Estado
  activeTrip: ActiveTrip | null;
  isLoading: boolean;
  isWebSocketConnected: boolean;
  pendingTripRequest: PendingTripRequest | null; // Para motoristas
  driverLocation: { lat: number; lng: number } | null; // Localização do motorista (para passageiros)
  
  // Ações do Passageiro
  createTrip: (
    origin: TripOrigin,
    destination: TripDestination,
    tripCategoryId: string,
    paymentMethodId: string,
    paymentBrandId?: string,
    estimatedFare?: number
  ) => Promise<{ success: boolean; tripId?: string; error?: string }>;
  cancelTrip: (reason?: string) => Promise<{ success: boolean; error?: string }>;
  rateTrip: (rating: number, comment?: string) => Promise<{ success: boolean; error?: string }>;
  
  // Ações do Motorista
  acceptTrip: (tripId: string) => Promise<{ success: boolean; error?: string }>;
  rejectTrip: (tripId: string) => Promise<void>;
  cancelDriverRide: (rideId: string) => Promise<{ success: boolean; error?: string }>;
  updateTripStatus: (status: TripStatus, reason?: string) => Promise<{ success: boolean; error?: string }>;
  
  // Utilitários
  refreshTrip: () => Promise<void>;
  loadTripFromStorage: () => Promise<void>;
  clearTrip: () => void;
  connectWebSocket: () => Promise<boolean>;
  disconnectWebSocket: () => void;
}

const TripContext = createContext<TripContextData>({} as TripContextData);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [pendingTripRequest, setPendingTripRequest] = useState<PendingTripRequest | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const appState = useRef(AppState.currentState);

  // Determina o tipo de usuário
  // Identifica tipo de usuário através dos roles retornados na autenticação
  const isDriver = user?.roles?.includes('driver') || user?.type === 'motorista' || user?.type === 'driver';
  const userType: 'driver' | 'passenger' = isDriver ? 'driver' : 'passenger';

  // Debug: log quando activeTrip muda e salva no AsyncStorage
  useEffect(() => {
    console.log('[TripContext] activeTrip atualizado no estado:', {
      id: activeTrip?.id,
      status: activeTrip?.status,
      hasTrip: !!activeTrip,
      userType,
    });

    // Salva no AsyncStorage quando há uma trip ativa (tanto para motorista quanto passageiro)
    const saveActiveTripToStorage = async () => {
      if (activeTrip?.id) {
        try {
          // Salva o tripId e os dados básicos da trip
          await AsyncStorage.setItem('@vamu:active_trip_id', activeTrip.id);
          await AsyncStorage.setItem('@vamu:active_trip_data', JSON.stringify({
            id: activeTrip.id,
            status: activeTrip.status,
            origin: activeTrip.origin,
            destination: activeTrip.destination,
            estimated_fare: activeTrip.estimated_fare,
            final_fare: activeTrip.final_fare,
            distance_km: activeTrip.distance_km,
            duration_seconds: activeTrip.duration_seconds,
            category: activeTrip.category,
            passenger: activeTrip.passenger,
            driver: activeTrip.driver,
            payment_method_id: activeTrip.payment_method_id,
            payment_brand_id: activeTrip.payment_brand_id,
            created_at: activeTrip.created_at,
            accepted_at: activeTrip.accepted_at,
            started_at: activeTrip.started_at,
            completed_at: activeTrip.completed_at,
            cancelled_at: activeTrip.cancelled_at,
          }));
          console.log('[TripContext] Trip salva no AsyncStorage:', activeTrip.id);
        } catch (error) {
          console.error('[TripContext] Erro ao salvar trip no AsyncStorage:', error);
        }
      } else {
        // Se não tem trip ativa, não faz nada (mantém o storage para evitar perda de dados)
        // A limpeza será feita explicitamente quando finalizar/cancelar
      }
    };

    saveActiveTripToStorage();
  }, [activeTrip?.id, activeTrip?.status, userType]);

  // Handler para TripAssigned (motorista)
    useCallback((data: TripAssignedPayload) => {
        console.log('[TripContext] TripAssigned recebido:', data);

        // Verifica se o tempo de expiração ainda é válido
        if (data.assignment_expires_at) {
            const expiresAt = new Date(data.assignment_expires_at).getTime();
            const now = Date.now();

            if (now >= expiresAt) {
                console.warn('[TripContext] Corrida já expirada, ignorando...');
                return;
            }
        }

        setPendingTripRequest({
            trip_id: data.trip_id,
            origin: data.origin,
            destination: data.destination,
            estimated_fare: data.estimated_fare,
            assignment_expires_at: data.assignment_expires_at,
            category: data.category?.name,
            requested_at: data.requested_at,
            passenger: data.passenger,
            distance_km: data.distance_km,
            duration_seconds: data.duration_seconds,
        });
    }, []);
// Handler para TripStatusChanged
    useCallback((data: TripStatusChangedPayload) => {
        console.log('[TripContext] TripStatusChanged recebido:', data);

        setActiveTrip(prevTrip => {
            if (!prevTrip || prevTrip.id !== data.trip_id) {
                // Se não tem trip ativa ou é outra trip, ignora por enquanto
                // Poderia buscar a trip da API aqui
                return prevTrip;
            }

            // ✅ VALIDAÇÃO CRÍTICA: Só atualiza dados do motorista se o status indicar ACEITAÇÃO
            // Lista de status que indicam que o motorista JÁ ACEITOU a corrida
            const acceptedStatuses = [
                'MOTORISTA_ACEITOU',
                'DRIVER_ASSIGNED', // Apenas se realmente significa aceitação
                'DRIVER_ARRIVING',
                'MOTORISTA_A_CAMINHO',
                'DRIVER_NEARBY',
                'MOTORISTA_PROXIMO',
                'DRIVER_ARRIVED',
                'MOTORISTA_CHEGOU',
                'PASSAGEIRO_EMBARCADO',
                'IN_PROGRESS',
                'EM_ROTA',
                'PROXIMO_DESTINO',
                'WAITING_AT_DESTINATION',
            ];
            
            // Status que indicam que a corrida ainda está aguardando aceitação
            const pendingStatuses = [
                'REQUESTED',
                'AGUARDANDO_MOTORISTA',
                'SEARCHING_FOR_DRIVER',
            ];

            // Só atualiza dados do motorista se o status indicar aceitação
            let driverData: TripDriver | undefined = prevTrip.driver;
            if (data.driver_snapshot) {
                if (acceptedStatuses.includes(data.status)) {
                    console.log('[TripContext] ✅ Status válido para atualizar dados do motorista:', data.status);
                    driverData = {
                        id: data.driver_id || prevTrip.driver?.id || '',
                        name: data.driver_snapshot.name,
                        rating: data.driver_snapshot.rating,
                        vehicle: data.driver_snapshot.vehicle,
                        location: data.driver_snapshot.location,
                    };
                } else if (pendingStatuses.includes(data.status)) {
                    console.log('[TripContext] ⚠️ Status indica que motorista ainda não aceitou:', data.status);
                    console.log('[TripContext] ⚠️ NÃO atualizando dados do motorista até aceitação');
                    // Limpa dados do motorista se ainda não aceitou
                    driverData = undefined;
                } else {
                    // Status desconhecido - por segurança, não atualiza dados do motorista
                    console.warn('[TripContext] ⚠️ Status desconhecido, não atualizando dados do motorista:', data.status);
                    driverData = prevTrip.driver; // Mantém o que já tinha
                }
            }

            const updatedTrip: ActiveTrip = {
                ...prevTrip,
                status: data.status,
                driver: driverData,
            };

            // Atualiza timestamps
            if (data.timestamps) {
                if (data.timestamps.accepted_at) updatedTrip.accepted_at = data.timestamps.accepted_at;
                if (data.timestamps.started_at) updatedTrip.started_at = data.timestamps.started_at;
                if (data.timestamps.completed_at) updatedTrip.completed_at = data.timestamps.completed_at;
                if (data.timestamps.cancelled_at) updatedTrip.cancelled_at = data.timestamps.cancelled_at;
            }

            return updatedTrip;
        });

        // Se o status é CANCELLED ou COMPLETED, pode limpar a trip pendente
        if (data.status === 'CANCELLED' || data.status === 'CANCELED_BY_DRIVER' || data.status === 'CANCELED_BY_PASSENGER') {
            setPendingTripRequest(null);
        }
    }, []);
// Handler para DriverLocationUpdate (passageiro)
    useCallback((data: DriverLocationUpdatePayload) => {
        console.log('[TripContext] DriverLocationUpdate recebido:', data);
        setDriverLocation({
            lat: data.latitude,
            lng: data.longitude,
        });
    }, []);

  // Mapeia resposta do backend para ActiveTrip (driver)
  const mapDriverRideToActiveTrip = useCallback((ride: any): ActiveTrip => {
    const origin = ride.origin || ride.pickup || ride.passengerLocation || ride.passenger_location;
    const destination = ride.destination || ride.dropoff;
    const rideStatus = normalizeTripStatus(ride.status || 'REQUESTED');
    return {
      id: ride.id || ride.rideId,
      status: rideStatus,
      origin: origin
        ? { lat: origin.lat ?? origin.latitude ?? 0, lng: origin.lng ?? origin.longitude ?? 0 }
        : { lat: 0, lng: 0 },
      destination: destination
        ? { lat: destination.lat ?? destination.latitude ?? 0, lng: destination.lng ?? destination.longitude ?? 0 }
        : { lat: 0, lng: 0 },
      estimated_fare: ride.estimated_fare ?? ride.estimatedPrice ?? 0,
      final_fare: ride.final_fare ?? ride.finalPrice ?? undefined,
      distance_km: ride.distance_km ?? ride.distanceKm,
      duration_seconds: ride.duration_seconds ?? (ride.durationMinutes ? ride.durationMinutes * 60 : undefined),
      category: ride.category
        ? { id: ride.category.id ?? '', name: ride.category.name ?? '' }
        : undefined,
      passenger: ride.passenger
        ? {
            id: ride.passenger.id,
            name: ride.passenger.name,
            rating: ride.passenger.rating,
          }
        : undefined,
      driver: ride.driver
        ? {
            id: ride.driver.id,
            name: ride.driver.name,
            rating: ride.driver.rating,
            vehicle: ride.driver.vehicle
              ? {
                  brand: ride.driver.vehicle.brand,
                  model: ride.driver.vehicle.model,
                  plate: ride.driver.vehicle.licensePlate || ride.driver.vehicle.plate,
                  color: ride.driver.vehicle.color,
                }
              : undefined,
          }
        : undefined,
      created_at: ride.createdAt || ride.requestedAt || ride.requested_at,
      accepted_at: ride.acceptedAt || ride.accepted_at,
      started_at: ride.startedAt || ride.started_at,
      completed_at: ride.completedAt || ride.completed_at,
      cancelled_at: ride.cancelledAt || ride.cancelled_at,
      payment_method_id: ride.paymentMethodId,
      payment_brand_id: ride.cardBrandId || ride.card_brand_id,
    };
  }, []);

  // Mapeia resposta do backend para ActiveTrip (passenger)
  const mapPassengerRideToActiveTrip = useCallback((ride: any): ActiveTrip => {
    // A API pode retornar pickup/origin e destination em diferentes formatos
    // Tenta várias variações de campos
    const origin = ride.pickup || ride.origin || ride.passengerLocation || ride.passenger_location;
    const destination = ride.destination || ride.dropoff;
    
    // Função auxiliar para extrair coordenadas
    const extractCoords = (loc: any): { lat: number; lng: number } => {
      if (!loc) return { lat: 0, lng: 0 };
      
      const lat = loc.lat ?? loc.latitude ?? 0;
      const lng = loc.lng ?? loc.longitude ?? loc.lon ?? 0;
      
      return { lat, lng };
    };
    
    const originCoords = extractCoords(origin);
    const destinationCoords = extractCoords(destination);
    
    const rideStatus = normalizeTripStatus(ride.status || 'REQUESTED');
    
    console.log('[TripContext] Mapeando corrida do passageiro:', {
      rideId: ride.id || ride.rideId,
      status: rideStatus,
      hasOrigin: !!origin,
      originCoords,
      hasDestination: !!destination,
      destinationCoords,
      hasDriver: !!ride.driver,
      rideKeys: Object.keys(ride),
    });
    
    // ✅ VALIDAÇÃO CRÍTICA: Só inclui dados do motorista se o status indicar ACEITAÇÃO
    // Lista de status que indicam que o motorista JÁ ACEITOU a corrida
    const acceptedStatuses: TripStatus[] = [
      'MOTORISTA_ACEITOU',
      'DRIVER_ASSIGNED', // Apenas se realmente significa aceitação
      'DRIVER_ARRIVING',
      'MOTORISTA_A_CAMINHO',
      'DRIVER_NEARBY',
      'MOTORISTA_PROXIMO',
      'DRIVER_ARRIVED',
      'MOTORISTA_CHEGOU',
      'PASSAGEIRO_EMBARCADO',
      'IN_PROGRESS',
      'EM_ROTA',
      'PROXIMO_DESTINO',
      'WAITING_AT_DESTINATION',
    ];
    
    // Determina se deve incluir dados do motorista
    let driverData: TripDriver | undefined = undefined;
    if (ride.driver) {
      if (acceptedStatuses.includes(rideStatus)) {
        console.log('[TripContext] ✅ Status válido para incluir dados do motorista:', rideStatus);
        driverData = {
          id: ride.driver.id,
          name: ride.driver.name,
          rating: ride.driver.rating,
          vehicle: ride.driver.vehicle
            ? {
                brand: ride.driver.vehicle.brand,
                model: ride.driver.vehicle.model,
                plate: ride.driver.vehicle.licensePlate || ride.driver.vehicle.plate,
                color: ride.driver.vehicle.color,
              }
            : undefined,
          location: ride.driverLocation
            ? {
                lat: ride.driverLocation.lat ?? ride.driverLocation.latitude ?? 0,
                lng: ride.driverLocation.lng ?? ride.driverLocation.longitude ?? 0,
              }
            : undefined,
        };
      } else {
        console.log('[TripContext] ⚠️ Status não indica aceitação, NÃO incluindo dados do motorista:', rideStatus);
        console.log('[TripContext] ⚠️ Dados do motorista serão incluídos apenas após aceitação');
        driverData = undefined; // Não inclui dados do motorista até aceitação
      }
    }
    
    return {
      id: ride.id || ride.rideId,
      status: rideStatus,
      origin: originCoords,
      destination: destinationCoords,
      estimated_fare: ride.estimated_fare ?? ride.estimatedPrice ?? 0,
      final_fare: ride.final_fare ?? ride.finalPrice ?? undefined,
      distance_km: ride.distance_km ?? ride.distanceKm,
      duration_seconds: ride.duration_seconds ?? (ride.durationMinutes ? ride.durationMinutes * 60 : undefined),
      category: ride.category || ride.serviceCategoryId
        ? { 
            id: ride.category?.id || ride.serviceCategoryId || '', 
            name: ride.category?.name || '' 
          }
        : undefined,
      passenger: ride.passenger
        ? {
            id: ride.passenger.id,
            name: ride.passenger.name,
            rating: ride.passenger.rating,
          }
        : undefined,
      driver: driverData,
      created_at: ride.createdAt || ride.requestedAt || ride.requested_at,
      accepted_at: ride.acceptedAt || ride.accepted_at,
      started_at: ride.startedAt || ride.started_at,
      completed_at: ride.completedAt || ride.completed_at,
      cancelled_at: ride.cancelledAt || ride.cancelled_at,
      payment_method_id: ride.paymentMethodId,
      payment_brand_id: ride.cardBrandId || ride.card_brand_id,
    };
  }, []);

  // Consulta corrida ativa do motorista (reconexão)
  const fetchDriverActiveRide = useCallback(async (): Promise<ActiveTrip | null> => {
    try {
      const response = await apiService.getDriverActiveRide();
      if (response.success && response.data) {
        const mapped = mapDriverRideToActiveTrip(response.data);
        setActiveTrip(mapped);
        await AsyncStorage.setItem('@vamu:active_trip_id', mapped.id);
        await AsyncStorage.setItem('@vamu:active_trip_data', JSON.stringify(mapped));
        return mapped;
      }
    } catch (error) {
      console.error('[TripContext] Erro ao buscar corrida ativa do motorista:', error);
    }
    return null;
  }, [mapDriverRideToActiveTrip]);

  // Consulta corrida ativa do passageiro (reconexão)
  const fetchPassengerActiveRide = useCallback(async (): Promise<ActiveTrip | null> => {
    try {
      console.log('[TripContext] 🔍 Buscando corrida ativa do passageiro na API...');
      const response = await apiService.getPassengerActiveRide();
      
      console.log('[TripContext] 🔍 Resposta da API getPassengerActiveRide:', {
        success: response.success,
        hasData: !!response.data,
        status: response.data?.status,
        rideId: response.data?.id,
      });
      
      if (response.success && response.data) {
        const mapped = mapPassengerRideToActiveTrip(response.data);
        
        console.log('[TripContext] 🔍 Corrida mapeada:', {
          id: mapped.id,
          status: mapped.status,
        });
        
        // Lista de status inválidos (cancelados, finalizados ou antigos)
        const invalidStatuses: TripStatus[] = [
          ...COMPLETED_OR_CANCELLED_STATUSES,
          'CANCELADA_MOTORISTA',
          'CANCELADA_PASSAGEIRO',
          'CANCELADA_ADMIN',
          'MOTORISTA_ENCONTRADO', // Status antigo/inválido
        ];
        
        // Lista de status válidos (incluindo versões em português e inglês)
        const validStatuses: TripStatus[] = [
          'REQUESTED',
          'DRIVER_ASSIGNED',
          'MOTORISTA_ACEITOU',
          'DRIVER_ON_THE_WAY',
          'MOTORISTA_A_CAMINHO',
          'DRIVER_NEARBY',
          'MOTORISTA_PROXIMO',
          'DRIVER_ARRIVING',
          'DRIVER_ARRIVED',
          'MOTORISTA_CHEGOU',
          'PASSENGER_BOARDED',
          'PASSAGEIRO_EMBARCADO',
          'IN_ROUTE',
          'EM_ROTA',
          'NEAR_DESTINATION',
          'PROXIMO_DESTINO',
          'IN_PROGRESS',
          'WAITING_AT_DESTINATION',
        ];
        
        // Normaliza status antes de validar
        const normalizedStatus = normalizeTripStatus(mapped.status);
        
        // Verifica se o status é válido
        const isInvalid = invalidStatuses.includes(normalizedStatus);
        const isValid = validStatuses.includes(normalizedStatus);
        
        console.log('[TripContext] 🔍 Validação de status:', {
          status: mapped.status,
          normalizedStatus,
          isInvalid,
          isValid,
        });
        
        if (isInvalid || !isValid) {
          console.log('[TripContext] ⚠️ Corrida ativa com status inválido, limpando storage:', mapped.status);
          // Limpa o storage se o status for inválido
          await AsyncStorage.removeItem('@vamu:active_trip_id');
          await AsyncStorage.removeItem('@vamu:active_trip_data');
          setActiveTrip(null);
          return null;
        }
        
        console.log('[TripContext] ✅ Corrida ativa válida encontrada, salvando no estado:', mapped.id);
        setActiveTrip(mapped);
        await AsyncStorage.setItem('@vamu:active_trip_id', mapped.id);
        await AsyncStorage.setItem('@vamu:active_trip_data', JSON.stringify(mapped));
        return mapped;
      } else {
        console.log('[TripContext] ℹ️ Nenhuma corrida ativa encontrada na API');
      }
    } catch (error) {
      console.error('[TripContext] ❌ Erro ao buscar corrida ativa do passageiro:', error);
    }
    return null;
  }, [mapPassengerRideToActiveTrip]);

  // Handler para mensagens do WebSocket (novo serviço de rastreamento)
  const handleWebSocketMessage = useCallback((message: ServerMessage) => {
    console.log('[TripContext] Mensagem WebSocket recebida:', message);
    
    // Trata mensagem active_ride (corrida ativa após reconexão)
    if (message.type === 'active_ride') {
      const activeRideMessage = message as DriverActiveRideMessage;
      console.log('[TripContext] Corrida ativa recebida após reconexão:', activeRideMessage);
      
      // Verifica se a corrida não foi cancelada
      const cancelledStatuses = [
        'CANCELADA_MOTORISTA',
        'CANCELADA_PASSAGEIRO',
        'CANCELADA_ADMIN',
        'CANCELLED',
        'CANCELED_BY_DRIVER',
        'CANCELED_BY_PASSENGER',
        'EXPIRED',
      ];
      
      if (cancelledStatuses.includes(activeRideMessage.status)) {
        console.log('[TripContext] Corrida cancelada, ignorando active_ride:', activeRideMessage.status);
        // Limpa o storage se a corrida foi cancelada
        AsyncStorage.removeItem('@vamu:active_trip_id').catch(console.error);
        AsyncStorage.removeItem('@vamu:active_trip_data').catch(console.error);
        setActiveTrip(null);
        return;
      }
      
      // Busca detalhes completos da corrida ativa para preencher destino, etc.
      // Isso garante que temos todos os dados (origem, destino, etc.)
      if (userType === 'driver') {
        fetchDriverActiveRide();
      } else if (userType === 'passenger') {
        // Para passageiros, busca da API para garantir que temos origem e destino
        fetchPassengerActiveRide();
      }
      return;
    }
    
    // Não trata ride_offer aqui - deixa o DriverHomeScreen tratar
    // Apenas trata mensagens de rastreamento e status
    if (message.type === 'ride_offer' || message.type === 'ride_accepted' || message.type === 'ride_rejected') {
      // Deixa o DriverHomeScreen tratar essas mensagens
      return;
    }
    
    // O novo WebSocket é apenas para rastreamento, não para eventos de corridas
    // Eventos de corridas são tratados no DriverHomeScreen
  }, [userType, fetchDriverActiveRide, fetchPassengerActiveRide]);

  // Handler para mudança de estado de conexão
  const handleConnectionStateChange = useCallback((connected: boolean) => {
    console.log('[TripContext] Estado de conexão mudou:', connected);
    setIsWebSocketConnected(connected);
  }, []);

  // Handler para erros do WebSocket
  const handleWebSocketError = useCallback((error: Error | Event) => {
    console.error('[TripContext] Erro no WebSocket:', error);
    setIsWebSocketConnected(false);
  }, []);

  // Conecta ao WebSocket
  const connectWebSocket = useCallback(async (): Promise<boolean> => {
    if (!user?.userId || !isAuthenticated) {
      console.warn('[TripContext] Usuário não autenticado, não é possível conectar ao WebSocket');
      return false;
    }

    // O novo WebSocket é apenas para motoristas (rastreamento)
    if (userType !== 'driver') {
      console.log('[TripContext] WebSocket de rastreamento é apenas para motoristas');
      return false;
    }

    // Configura callbacks
    driverWebSocket.setOnMessage(handleWebSocketMessage);
    driverWebSocket.setOnConnectionStateChange(handleConnectionStateChange);
    driverWebSocket.setOnError(handleWebSocketError);

    // Conecta (não precisa mais passar userId e userType)
    const success = await driverWebSocket.connect();
    setIsWebSocketConnected(success);
    return success;
  }, [user?.userId, isAuthenticated, userType, handleWebSocketMessage, handleConnectionStateChange, handleWebSocketError]);

  // Desconecta do WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (userType === 'driver') {
      driverWebSocket.disconnect();
    }
    setIsWebSocketConnected(false);
  }, [userType]);

  // Não conecta WebSocket automaticamente - será conectado quando motorista ativar disponibilidade
  // Isso evita conectar sem localização e causar erros
  // O WebSocket será conectado manualmente no DriverHomeScreen quando necessário

  // Gerencia reconexão quando app volta do background
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[TripContext] App voltou para foreground, reconectando WebSocket...');

        // Reconecta WebSocket (apenas para motoristas)
        // A reconexão automática já está implementada no websocketService
        // Mas garantimos que está conectado quando o app volta ao foreground
        if (isAuthenticated && user?.userId && userType === 'driver') {
          // Se não está conectado, tenta conectar
          // Se já está conectado, o servidor enviará active_ride automaticamente se houver corrida ativa
          if (!isWebSocketConnected) {
            await connectWebSocket();
          }
          // Se já está conectado, o servidor enviará active_ride após a mensagem connected
          // O tratamento está no handleWebSocketMessage
        }

        // Motorista: corridas são recebidas via WebSocket quando atribuídas
        // Passageiro: busca corrida ativa via API como fallback se WebSocket não funcionar
        if (isAuthenticated && user?.userId) {
          if (userType === 'driver') {
            // Motorista: não busca corrida ativa via API
            // As corridas são recebidas via WebSocket quando atribuídas ou via active_ride após reconexão
            console.log('[TripContext] Motorista - corridas são recebidas via WebSocket (active_ride após reconexão)');
          } else if (userType === 'passenger') {
            // Passageiro: busca corrida ativa via API como fallback
            // Se não houver trip ativa no estado, tenta buscar da API
            if (!activeTrip?.id) {
              console.log('[TripContext] Passageiro - buscando corrida ativa via API (fallback)');
              await fetchPassengerActiveRide();
            }
          }
        }
        
        // Sincroniza estado da trip se já existir
        if (activeTrip?.id) {
          await refreshTrip();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated, user?.userId, isWebSocketConnected, activeTrip?.id, connectWebSocket, userType, handleWebSocketMessage]);

  // Gerencia background location tracking baseado no estado da trip
  useEffect(() => {
    if (!isAuthenticated || !user?.userId) return;

    const manageBackgroundLocation = async () => {
      if (userType === 'driver') {
        // Motorista: inicia background location se:
        // 1. Está em uma corrida ativa, OU
        // 2. Está disponível (isAvailable será verificado no DriverHomeScreen)
        // Por enquanto, apenas gerencia quando há corrida ativa
        if (activeTrip?.id && !COMPLETED_OR_CANCELLED_STATUSES.includes(activeTrip.status)) {
          // Inicia background location para motorista em corrida
          if (isWebSocketConnected) {
            console.log('[TripContext] Iniciando background location para motorista em corrida');
            await startDriverBackgroundLocation();
          }
        } else {
          // Para background location se não há corrida ativa
          console.log('[TripContext] Parando background location do motorista (sem corrida ativa)');
          await stopDriverBackgroundLocation();
        }
      } else if (userType === 'passenger') {
        // Passageiro: inicia background location apenas quando está em corrida ativa
        if (activeTrip?.id && !COMPLETED_OR_CANCELLED_STATUSES.includes(activeTrip.status)) {
          console.log('[TripContext] Iniciando background location para passageiro em corrida');
          await startPassengerBackgroundLocation();
        } else {
          // Para background location se não há corrida ativa
          console.log('[TripContext] Parando background location do passageiro (sem corrida ativa)');
          await stopPassengerBackgroundLocation();
        }
      }
    };

    manageBackgroundLocation();
  }, [isAuthenticated, user?.userId, userType, activeTrip?.id, activeTrip?.status, isWebSocketConnected]);

  // Configura notificações push para drivers e passageiros
  useEffect(() => {
    if (!isAuthenticated || !user?.userId || (userType !== 'driver' && userType !== 'passenger')) return;

    const setupNotifications = async () => {
      try {
        // Obtém token de notificação
        const token = await getNotificationToken();
        if (token) {
          // Registra token no backend (stub se backend ainda não expõe rota)
          await registerNotificationToken(user.userId, userType, token);
          console.log('[TripContext] Token de notificação registrado:', { userType });
        }

        // Configura listeners de notificação
        const receivedSubscription = setupNotificationListeners((notification) => {
          console.log('[TripContext] Notificação recebida:', notification);
        });

        const responseSubscription = setupNotificationResponseListener((response) => {
          console.log('[TripContext] Usuário tocou na notificação:', response);
        });

        return () => {
          receivedSubscription.remove();
          responseSubscription.remove();
        };
      } catch (error) {
        console.error('[TripContext] Erro ao configurar notificações:', error);
      }
    };

    const cleanup = setupNotifications();
    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.());
    };
  }, [isAuthenticated, user?.userId, userType]);

  // Notificações locais para mudanças relevantes de status (passageiro)
  const lastStatusRef = useRef<TripStatus | null>(null);
  useEffect(() => {
    if (!activeTrip?.id) {
      lastStatusRef.current = null;
      return;
    }

    const prevStatus = lastStatusRef.current;
    const currentStatus = activeTrip.status;
    lastStatusRef.current = currentStatus;

    if (prevStatus === currentStatus) return;
    if (userType !== 'passenger') return;

    const statusMessages: Partial<Record<TripStatus, { title: string; body: string }>> = {
      DRIVER_ASSIGNED: {
        title: 'Motorista encontrado',
        body: 'Um motorista aceitou sua corrida.',
      },
      MOTORISTA_ACEITOU: {
        title: 'Motorista encontrado',
        body: 'Um motorista aceitou sua corrida.',
      },
      DRIVER_ON_THE_WAY: {
        title: 'Motorista a caminho',
        body: 'Seu motorista já está a caminho.',
      },
      MOTORISTA_A_CAMINHO: {
        title: 'Motorista a caminho',
        body: 'Seu motorista já está a caminho.',
      },
      DRIVER_NEARBY: {
        title: 'Motorista próximo',
        body: 'O motorista está chegando.',
      },
      MOTORISTA_PROXIMO: {
        title: 'Motorista próximo',
        body: 'O motorista está chegando.',
      },
      DRIVER_ARRIVING: {
        title: 'Motorista chegando',
        body: 'O motorista está chegando no ponto de encontro.',
      },
      DRIVER_ARRIVED: {
        title: 'Motorista chegou',
        body: 'O motorista está no ponto de encontro.',
      },
      MOTORISTA_CHEGOU: {
        title: 'Motorista chegou',
        body: 'O motorista está no ponto de encontro.',
      },
    };

    const notification = statusMessages[currentStatus];
    if (notification) {
      const driverName = activeTrip.driver?.name;
      const plate =
        (activeTrip.driver?.vehicle as any)?.plate ||
        (activeTrip.driver?.vehicle as any)?.licensePlate ||
        (activeTrip.driver?.vehicle as any)?.license_plate;

      const bodyWithDriver =
        driverName || plate
          ? `${driverName ? driverName : 'Motorista'}${plate ? ` - Placa ${plate}` : ''}`
          : notification.body;

      sendLocalNotification(notification.title, bodyWithDriver, {
        tripId: activeTrip.id,
        status: currentStatus,
        driverName,
        plate,
      }).catch(() => {});
    }
  }, [activeTrip?.id, activeTrip?.status, userType]);

  // Busca trip ativa ao iniciar
  useEffect(() => {
    const fetchActiveTrip = async () => {
      if (!isAuthenticated || !user?.userId) return;

      try {
        setIsLoading(true);
        
        if (userType === 'driver') {
          // Motorista: tenta restaurar do storage; se não houver ou estiver inválida, busca no backend
          console.log('[TripContext] Motorista - tentando carregar trip do storage no fetchActiveTrip');
          let restored = false;
          try {
            const savedTripId = await AsyncStorage.getItem('@vamu:active_trip_id');
            const savedTripData = await AsyncStorage.getItem('@vamu:active_trip_data');

            if (savedTripId && savedTripData) {
              console.log('[TripContext] Trip encontrada no AsyncStorage para motorista:', savedTripId);
              try {
                const tripData = JSON.parse(savedTripData);
                
                if (!COMPLETED_OR_CANCELLED_STATUSES.includes(tripData.status)) {
                  setActiveTrip(tripData);
                  restored = true;
                  console.log('[TripContext] Trip restaurada para motorista:', tripData.id);
                } else {
                  await AsyncStorage.removeItem('@vamu:active_trip_id');
                  await AsyncStorage.removeItem('@vamu:active_trip_data');
                  setActiveTrip(null);
                }
              } catch (parseError) {
                console.error('[TripContext] Erro ao parsear trip data:', parseError);
                await AsyncStorage.removeItem('@vamu:active_trip_id');
                await AsyncStorage.removeItem('@vamu:active_trip_data');
                setActiveTrip(null);
              }
            }
          } catch (storageError) {
            console.error('[TripContext] Erro ao carregar trip do storage (motorista):', storageError);
            setActiveTrip(null);
          }

          // Se não restaurou nada do storage, tenta backend (corrida ativa)
          if (!restored) {
            console.log('[TripContext] Buscando corrida ativa do motorista no backend (reconexão)');
            await fetchDriverActiveRide();
          }
        } else if (userType === 'passenger') {
          // Passageiro: tenta restaurar do storage; se não houver ou estiver inválida, busca no backend
          console.log('[TripContext] Passageiro - tentando carregar trip do storage no fetchActiveTrip');
          let restored = false;
          try {
            const savedTripId = await AsyncStorage.getItem('@vamu:active_trip_id');
            const savedTripData = await AsyncStorage.getItem('@vamu:active_trip_data');

            if (savedTripId && savedTripData) {
              console.log('[TripContext] Trip encontrada no AsyncStorage para passageiro:', savedTripId);
              try {
                const tripData = JSON.parse(savedTripData);
                
                // Lista de status inválidos (cancelados, finalizados ou antigos)
                const invalidStatuses = [
                  ...COMPLETED_OR_CANCELLED_STATUSES,
                  'CANCELADA_MOTORISTA',
                  'CANCELADA_PASSAGEIRO',
                  'CANCELADA_ADMIN',
                  'MOTORISTA_ENCONTRADO', // Status antigo/inválido
                ];
                
                // Lista de status válidos (incluindo versões em português e inglês)
                const validStatuses = [
                  'REQUESTED',
                  'DRIVER_ASSIGNED',
                  'MOTORISTA_ACEITOU',
                  'DRIVER_ON_THE_WAY',
                  'MOTORISTA_A_CAMINHO',
                  'DRIVER_NEARBY',
                  'MOTORISTA_PROXIMO',
                  'DRIVER_ARRIVING',
                  'DRIVER_ARRIVED',
                  'MOTORISTA_CHEGOU',
                  'PASSENGER_BOARDED',
                  'PASSAGEIRO_EMBARCADO',
                  'IN_ROUTE',
                  'EM_ROTA',
                  'NEAR_DESTINATION',
                  'PROXIMO_DESTINO',
                  'IN_PROGRESS',
                  'WAITING_AT_DESTINATION',
                ];
                
                // Verifica se o status é válido
                const isInvalid = invalidStatuses.includes(tripData.status);
                const isValid = validStatuses.includes(tripData.status);
                
                if (!isInvalid && isValid) {
                  setActiveTrip(tripData);
                  restored = true;
                  console.log('[TripContext] Trip restaurada para passageiro:', tripData.id);
                } else {
                  console.log('[TripContext] Trip com status inválido no storage, limpando:', tripData.status);
                  await AsyncStorage.removeItem('@vamu:active_trip_id');
                  await AsyncStorage.removeItem('@vamu:active_trip_data');
                  setActiveTrip(null);
                }
              } catch (parseError) {
                console.error('[TripContext] Erro ao parsear trip data:', parseError);
                await AsyncStorage.removeItem('@vamu:active_trip_id');
                await AsyncStorage.removeItem('@vamu:active_trip_data');
                setActiveTrip(null);
              }
            }
          } catch (storageError) {
            console.error('[TripContext] Erro ao carregar trip do storage (passageiro):', storageError);
            setActiveTrip(null);
          }

          // Se não restaurou nada do storage, tenta backend (corrida ativa)
          if (!restored) {
            console.log('[TripContext] Buscando corrida ativa do passageiro no backend (reconexão)');
            await fetchPassengerActiveRide();
          }
        }
      } catch (error) {
        console.error('[TripContext] Erro ao buscar trip ativa:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveTrip();
  }, [isAuthenticated, user?.userId, userType]);

  // Cria nova corrida (passageiro)
  const createTrip = useCallback(async (
    origin: TripOrigin,
    destination: TripDestination,
    tripCategoryId: string,
    paymentMethodId: string,
    paymentBrandId?: string,
    estimatedFare?: number,
    estimateId?: string
  ): Promise<{ success: boolean; tripId?: string; error?: string }> => {
    setIsLoading(true);
    try {
      // Usa tripsService que usa a nova rota POST /v1/passengers/rides
      const response = await tripsService.createTrip({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        trip_category_id: tripCategoryId,
        payment_method_id: paymentMethodId,
        payment_brand_id: paymentBrandId,
        estimateId, // Passa o estimateId se disponível
      });

      console.log('[TripContext] Resposta do createTrip:', {
        success: response.success,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
      });

      if (response.success && response.data) {
        // A API retorna os dados da trip diretamente
        const tripData = response.data;
        const tripId = tripData.id;

        console.log('[TripContext] Dados da trip recebida:', {
          id: tripId,
          status: tripData.status,
          hasOrigin: !!tripData.origin,
          hasDestination: !!tripData.destination,
          estimated_fare: tripData.estimated_fare,
        });

        // Mapeia os dados da API para o formato esperado
        // API retorna origin e destination como objetos {lat, lng}
        const tripOrigin = tripData.origin || origin;
        const tripDestination = tripData.destination || destination;

        console.log('[TripContext] Origin mapeado:', tripOrigin);
        console.log('[TripContext] Destination mapeado:', tripDestination);

        const newActiveTrip: ActiveTrip = {
          id: tripId,
          status: (tripData.status || 'REQUESTED') as TripStatus,
          origin: tripOrigin,
          destination: tripDestination,
          estimated_fare: tripData.estimated_fare || estimatedFare || 0,
          final_fare: tripData.final_fare,
          distance_km: tripData.distance_km,
          duration_seconds: tripData.duration_seconds,
          category: tripData.category,
          payment_method_id: paymentMethodId,
          payment_brand_id: paymentBrandId,
          created_at: tripData.created_at || new Date().toISOString(),
        };

        console.log('[TripContext] Salvando trip no estado:', {
          id: newActiveTrip.id,
          status: newActiveTrip.status,
          origin: newActiveTrip.origin,
          destination: newActiveTrip.destination,
        });

        setActiveTrip(newActiveTrip);
        
        console.log('[TripContext] Trip criada e salva no estado:', {
          tripId,
          status: newActiveTrip.status,
          hasOrigin: !!newActiveTrip.origin,
          hasDestination: !!newActiveTrip.destination,
        });
        
        // Salva tripId no AsyncStorage para passageiros recuperarem ao reabrir o app
        try {
          await AsyncStorage.setItem('@vamu:active_trip_id', tripId);
          console.log('[TripContext] TripId salvo no AsyncStorage:', tripId);
        } catch (error) {
          console.error('[TripContext] Erro ao salvar tripId:', error);
        }

        // Aguarda um pouco para garantir que o estado foi atualizado
        await new Promise(resolve => setTimeout(resolve, 100));

        return { success: true, tripId };
      }

      return { 
        success: false, 
        error: response.error || response.message || 'Erro ao criar corrida' 
      };
    } catch (error: any) {
      console.error('[TripContext] Erro ao criar corrida:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao criar corrida' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cancela corrida (passageiro)
  const cancelTrip = useCallback(async (reason?: string): Promise<{ success: boolean; error?: string }> => {
    if (!activeTrip?.id) {
      return { success: false, error: 'Nenhuma corrida ativa' };
    }

    setIsLoading(true);
    try {
      // Usa tripsService que usa a rota correta POST /trips/{id}/cancel
      const response = await tripsService.cancelTrip(activeTrip.id, reason);
      
      if (response.success) {
        setActiveTrip(null);
        // Remove tripId e dados da trip do AsyncStorage
        try {
          await AsyncStorage.removeItem('@vamu:active_trip_id');
          await AsyncStorage.removeItem('@vamu:active_trip_data');
          console.log('[TripContext] Trip removida do AsyncStorage após cancelamento');
        } catch (error) {
          console.error('[TripContext] Erro ao remover trip do AsyncStorage:', error);
        }
        return { success: true };
      }

      return { 
        success: false, 
        error: response.error || response.message || 'Erro ao cancelar corrida' 
      };
    } catch (error: any) {
      console.error('[TripContext] Erro ao cancelar corrida:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao cancelar corrida' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [activeTrip?.id]);

  // Avalia corrida (passageiro)
  const rateTrip = useCallback(async (rating: number, comment?: string): Promise<{ success: boolean; error?: string }> => {
    if (!activeTrip?.id) {
      return { success: false, error: 'Nenhuma corrida para avaliar' };
    }

    setIsLoading(true);
    try {
      // Usa o método rateTrip do tripsService
      const response = await tripsService.rateTrip(activeTrip.id, rating, comment);
      
      if (response.success) {
        setActiveTrip(null);
        // Remove tripId e dados da trip do AsyncStorage
        try {
          await AsyncStorage.removeItem('@vamu:active_trip_id');
          await AsyncStorage.removeItem('@vamu:active_trip_data');
          console.log('[TripContext] Trip removida do AsyncStorage após cancelamento');
        } catch (error) {
          console.error('[TripContext] Erro ao remover trip do AsyncStorage:', error);
        }
        return { success: true };
      }

      return { 
        success: false, 
        error: response.error || response.message || 'Erro ao avaliar corrida' 
      };
    } catch (error: any) {
      console.error('[TripContext] Erro ao avaliar corrida:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao avaliar corrida' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [activeTrip?.id]);

  // Aceita corrida (motorista)
  const acceptTrip = useCallback(async (tripId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // Usa o tripsService que usa a API real
      const response = await tripsService.acceptTrip(tripId);
      
      if (response.success && response.data) {
        // Atualiza trip ativa com dados da corrida aceita
        const tripData = response.data;
        
        setActiveTrip({
          id: tripData.id || tripId,
          status: (tripData.status || 'DRIVER_ARRIVING') as TripStatus,
          origin: tripData.origin || pendingTripRequest?.origin || { lat: 0, lng: 0 },
          destination: tripData.destination || pendingTripRequest?.destination || { lat: 0, lng: 0 },
          estimated_fare: tripData.estimated_fare || pendingTripRequest?.estimated_fare || 0,
          final_fare: tripData.final_fare,
          distance_km: tripData.distance_km || pendingTripRequest?.distance_km,
          duration_seconds: tripData.duration_seconds || pendingTripRequest?.duration_seconds,
          category: tripData.category,
          passenger: tripData.passenger_snapshot,
          accepted_at: tripData.accepted_at || new Date().toISOString(),
        });

        // Limpa a solicitação pendente
        setPendingTripRequest(null);

        return { success: true };
      }

      return { 
        success: false, 
        error: response.error || response.message || 'Erro ao aceitar corrida' 
      };
    } catch (error: any) {
      console.error('[TripContext] Erro ao aceitar corrida:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao aceitar corrida' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [pendingTripRequest]);

  // Rejeita corrida (motorista)
  const rejectTrip = useCallback(async (tripId: string): Promise<void> => {
    // Apenas remove a solicitação pendente
    // O backend irá reatribuir a corrida para outro motorista
    setPendingTripRequest(null);
    console.log('[TripContext] Corrida rejeitada:', tripId);
  }, []);

  // Cancela corrida (motorista)
  const cancelDriverRide = useCallback(async (rideId: string): Promise<{ success: boolean; error?: string }> => {
    if (!rideId) {
      return { success: false, error: 'ID da corrida não fornecido' };
    }

    setIsLoading(true);
    try {
      const response = await apiService.driverRideCancel(rideId, 'Cancelado pelo motorista');
      
      if (response.success || response.status === 204) {
        // Limpa a trip ativa
        setActiveTrip(null);
        setPendingTripRequest(null);
        
        // Remove tripId e dados da trip do AsyncStorage
        try {
          await AsyncStorage.removeItem('@vamu:active_trip_id');
          await AsyncStorage.removeItem('@vamu:active_trip_data');
          console.log('[TripContext] Trip removida do AsyncStorage após cancelamento pelo motorista');
        } catch (error) {
          console.error('[TripContext] Erro ao remover trip do AsyncStorage:', error);
        }
        
        return { success: true };
      }

      return { 
        success: false, 
        error: response.error || response.message || 'Erro ao cancelar corrida' 
      };
    } catch (error: any) {
      console.error('[TripContext] Erro ao cancelar corrida:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao cancelar corrida' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Atualiza status da corrida (motorista)
  const updateTripStatus = useCallback(async (status: TripStatus, reason?: string): Promise<{ success: boolean; error?: string }> => {
    if (!activeTrip?.id) {
      return { success: false, error: 'Nenhuma corrida ativa' };
    }

    setIsLoading(true);
    try {
      const response = await apiService.updateTripStatus(activeTrip.id, status, reason);
      
      if (response.success) {
        setActiveTrip(prev => {
          if (!prev) return null;
          
          const updatedTrip = { ...prev, status };
          
          // Atualiza timestamps conforme o status
          if (status === 'IN_PROGRESS') {
            updatedTrip.started_at = new Date().toISOString();
          } else if (status === 'COMPLETED') {
            updatedTrip.completed_at = new Date().toISOString();
          } else if (status === 'CANCELED_BY_DRIVER' || status === 'CANCELLED') {
            updatedTrip.cancelled_at = new Date().toISOString();
          }
          
          return updatedTrip;
        });

        // Se completou ou cancelou, limpa a trip após um delay
        if (COMPLETED_OR_CANCELLED_STATUSES.includes(status)) {
          setTimeout(async () => {
            setActiveTrip(null);
            // Remove tripId e dados da trip do AsyncStorage
            try {
              await AsyncStorage.removeItem('@vamu:active_trip_id');
              await AsyncStorage.removeItem('@vamu:active_trip_data');
              console.log('[TripContext] Trip removida do AsyncStorage após finalização/cancelamento');
            } catch (error) {
              console.error('[TripContext] Erro ao remover trip do AsyncStorage:', error);
            }
          }, 3000);
        }

        return { success: true };
      }

      return { 
        success: false, 
        error: response.error || response.message || 'Erro ao atualizar status' 
      };
    } catch (error: any) {
      console.error('[TripContext] Erro ao atualizar status:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao atualizar status' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [activeTrip?.id]);

  // Atualiza dados da trip
  const refreshTrip = useCallback(async (): Promise<void> => {
    if (!activeTrip?.id) return;

    // Rota GET /v1/trips/{id} não existe na API, removida
    // A trip será atualizada via WebSocket ou outras rotas disponíveis
    try {
      // Removido: chamada a getTrip que não existe na API
    } catch (error) {
      console.error('[TripContext] Erro ao atualizar trip:', error);
    }
  }, [activeTrip?.id]);

  // Carrega trip do AsyncStorage e busca da API
  const loadTripFromStorage = useCallback(async (): Promise<void> => {
    if (userType !== 'passenger') {
      console.log('[TripContext] loadTripFromStorage ignorado - não é passageiro');
      return; // Só para passageiros
    }
    
    try {
      console.log('[TripContext] Verificando AsyncStorage para trip ativa...');
      const savedTripId = await AsyncStorage.getItem('@vamu:active_trip_id');
      
      if (!savedTripId) {
        console.log('[TripContext] Nenhum tripId salvo no AsyncStorage');
        return;
      }

      console.log('[TripContext] TripId encontrado no AsyncStorage:', savedTripId);
      setIsLoading(true);
      
      // Rota GET /v1/trips/{id} não existe na API, removida
      // A trip será atualizada via WebSocket ou outras rotas disponíveis
      // Por enquanto, apenas limpa o storage
      await AsyncStorage.removeItem('@vamu:active_trip_id');
      setActiveTrip(null);
      setIsLoading(false);
    } catch (error) {
      console.error('[TripContext] Erro ao carregar trip do storage:', error);
      setActiveTrip(null);
    } finally {
      setIsLoading(false);
    }
  }, [userType]);

  // Limpa trip ativa
  const clearTrip = useCallback(() => {
    setActiveTrip(null);
    setPendingTripRequest(null);
    setDriverLocation(null);
  }, []);

  return (
    <TripContext.Provider
      value={{
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
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = (): TripContextData => {
  const context = useContext(TripContext);
  
  if (!context) {
    throw new Error('useTrip deve ser usado dentro de um TripProvider');
  }
  
  return context;
};

