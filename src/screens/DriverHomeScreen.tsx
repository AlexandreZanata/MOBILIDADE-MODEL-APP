import React, {useEffect, useRef, useState} from 'react';
import {Alert, Modal, StyleSheet, Switch, Text, TouchableOpacity, View, ActivityIndicator,} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TileMap, TileMapRef} from '@/components/molecules/TileMap';
import {Card} from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import {shadows, spacing, typography} from '@/theme';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@/context/ThemeContext';
import {useAuth} from '@/context/AuthContext';
import {apiService, PaymentMethodResponse, CardBrandResponse} from '@/services/api';
import {useTokenRefresh} from '@/hooks/useTokenRefresh';
import {websocketService, ServerMessage} from '@/services/websocketService';
import { sendLocalNotification } from '@/services/notificationService';
import {useTrip} from '@/context/TripContext';
import {DriverTripRequestScreen} from './DriverTripRequestScreen';
import {
  startDriverBackgroundLocation,
  stopDriverBackgroundLocation,
} from '@/services/backgroundLocationService';

interface DriverHomeScreenProps {
  navigation: any;
}

// Coordenadas de Sorriso, MT
const SORRISO_LAT = -12.5458;
const SORRISO_LON = -55.7061;
const CACHE_KEYS = {
  DRIVER_LOCATION: '@vamu:driver_location',
  DRIVER_LOCATION_TIMESTAMP: '@vamu:driver_location_timestamp',
  DRIVER_AVAILABILITY_PREF: '@vamu:driver_availability_pref',
};
const CACHE_VALIDITY_MS = 5 * 60 * 1000; // 5 minutos
const LOCATION_REQUEST_THROTTLE_MS = 30 * 1000; // 30 segundos
const LOCATION_STALE_MS = 2 * 60 * 1000; // considera localização velha após 2 minutos
const LAST_KNOWN_MAX_AGE_MS = 3 * 60 * 1000; // idade máxima para usar última conhecida

export const DriverHomeScreen: React.FC<DriverHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { connectWebSocket, isWebSocketConnected } = useTrip();
  const ensureToken = useTokenRefresh();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isUpdatingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: SORRISO_LAT, lon: SORRISO_LON });
  const [mapZoom, setMapZoom] = useState(16);
  
  // Valores de zoom predefinidos
  const ZOOM_LEVELS = [12, 14, 16, 18, 20];
  interface PendingTripData {
    trip_id: string;
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    estimated_fare: number;
    distance_km?: number;
    duration_seconds?: number;
    assignment_expires_at: string;
    category?: string;
    requested_at?: string;
    passenger?: {
      id?: string;
      name?: string;
      rating?: number;
      phone?: string;
      photoUrl?: string;
    };
    payment_method?: {
      id?: string;
      name?: string;
      slug?: string;
    };
    payment_brand?: {
      id?: string;
      name?: string;
      slug?: string;
    };
  }
  const [pendingTrip, setPendingTrip] = useState<PendingTripData | null>(null);
  const [showTripRequest, setShowTripRequest] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasUserMovedMap, setHasUserMovedMap] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [, setActivePassengers] = useState<any[]>([]);
  const [infoCardHeight, setInfoCardHeight] = useState(0);
  const [statusCardHeight, setStatusCardHeight] = useState(0);
  const [operationalStatus, setOperationalStatus] = useState<any>(null);
  const [validationStatus, setValidationStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [passengerLocation, setPassengerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isCheckingActiveRide, setIsCheckingActiveRide] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false); // Estado para indicar que está conectando/processando
  const mapRef = useRef<TileMapRef>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRequestingLocationRef = useRef(false);
  const lastLocationRequestRef = useRef<number>(0);
  const lastLocationUpdateRef = useRef<number>(0);
  const lastCacheSaveRef = useRef<number>(0);
  const availabilityPrefRef = useRef<boolean | null>(null);
  const rateLimitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nearbyUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAvailabilityToggleRef = useRef<number>(0);
  // Rate limiting para requisições de disponibilidade (máximo 60 por minuto)
  const availabilityRequestsRef = useRef<number[]>([]); // Timestamps das requisições
  const pendingAvailabilityRequestRef = useRef<{ value: boolean; timestamp: number } | null>(null);
  const availabilityRateLimitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAvailabilityRateLimited, setIsAvailabilityRateLimited] = useState(false);
  const offerExpireTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  
  // Rate limiting para requisições de localização não é mais necessário
  // A localização é gerenciada automaticamente pelo backend
  // const locationRequestsRef = useRef<number[]>([]); // Removido - não fazemos mais requisições GET /drivers/location
  const locationRateLimitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Verifica se há corrida ativa ao focar a tela (com throttling)
  useFocusEffect(
    React.useCallback(() => {
      // Recarrega status operacional e de validação quando a tela é focada
      const timer = setTimeout(async () => {
        await loadValidationStatus();
        await loadOperationalStatus();
      }, 2000);
      
      return () => {
        clearTimeout(timer);
      };
    }, [])
  );

  // Garante uma localização rápida ao focar, mesmo após fechar/abrir o app
  useFocusEffect(
    React.useCallback(() => {
      const timer = setTimeout(() => {
        if (!currentLocation || isLocationStale()) {
          requestLocationPermission(true, { centerMap: false }).catch(() => {});
        }
      }, 150);

      return () => clearTimeout(timer);
    }, [currentLocation])
  );


  // Função para normalizar status de corrida (converte espaços para underscore e padroniza)
  const normalizeRideStatus = (status: string): string => {
    if (!status) return status;
    
    // Converte para maiúsculas e substitui espaços por underscore
    let normalized = status.toUpperCase().trim();
    
    // Substitui espaços por underscore
    normalized = normalized.replace(/\s+/g, '_');
    
    // Mapeia variações comuns de status
    const statusMap: Record<string, string> = {
      'MOTORISTA_ACEITOU': 'MOTORISTA_ACEITOU',
      'MOTORISTA_A_CAMINHO': 'MOTORISTA_A_CAMINHO',
      'MOTORISTA_PROXIMO': 'MOTORISTA_PROXIMO',
      'MOTORISTA_CHEGOU': 'MOTORISTA_CHEGOU',
      'MOTORISTA_ENCONTRADO': 'MOTORISTA_ENCONTRADO',
      'AGUARDANDO_MOTORISTA': 'AGUARDANDO_MOTORISTA',
      'EM_ROTA': 'EM_ROTA',
      'PROXIMO_DESTINO': 'PROXIMO_DESTINO',
      'CORRIDA_FINALIZADA': 'CORRIDA_FINALIZADA',
      'AGUARDANDO_AVALIACAO': 'AGUARDANDO_AVALIACAO',
      'CONCLUIDA': 'CONCLUIDA',
    };
    
    return statusMap[normalized] || normalized;
  };

  // Verifica corrida ativa (para reconexão do motorista)
  const checkActiveRide = React.useCallback(async () => {
    try {
      setIsCheckingActiveRide(true);
      console.log('[DriverHome] Verificando se há corrida ativa...');
      const response = await apiService.getDriverActiveRide();

      if (!response.success || !response.data) {
        console.log('[DriverHome] Nenhuma corrida ativa encontrada');
        setIsCheckingActiveRide(false);
        return;
      }

      const rideData = response.data;
      console.log('[DriverHome] Corrida ativa encontrada:', rideData.id);

      // Normaliza o status recebido da API
      const normalizedStatus = normalizeRideStatus(rideData.status);
      console.log('[DriverHome] Status normalizado (driver):', {
        original: rideData.status,
        normalized: normalizedStatus,
      });

      // Lista de status inválidos (cancelados, finalizados ou estados pós-corrida)
      const invalidStatuses = [
        'CANCELADA_MOTORISTA',
        'CANCELADA_PASSAGEIRO',
        'CANCELADA_ADMIN',
        'CANCELLED',
        'CANCELED_BY_DRIVER',
        'CANCELED_BY_PASSENGER',
        'EXPIRED',
        'COMPLETED',
        'CONCLUIDA',
        'CORRIDA_FINALIZADA',
        'AGUARDANDO_AVALIACAO', // Apenas aguardando avaliação, não é corrida ativa
      ];

      // Qualquer status que NÃO esteja explicitamente cancelado/finalizado é tratado como ativo
      const isInvalid = invalidStatuses.includes(normalizedStatus);

      console.log('[DriverHome] Validação de status (driver):', {
        statusOriginal: rideData.status,
        statusNormalizado: normalizedStatus,
        isInvalid,
      });

      if (isInvalid) {
        console.log('[DriverHome] Corrida com status inválido/cancelado, limpando storage e ignorando:', normalizedStatus);

        // Limpa o AsyncStorage
        try {
          await AsyncStorage.removeItem('@vamu:active_trip_id');
          await AsyncStorage.removeItem('@vamu:active_trip_data');
          console.log('[DriverHome] Storage limpo devido a status inválido');
        } catch (error) {
          console.error('[DriverHome] Erro ao limpar storage:', error);
        }

        setIsCheckingActiveRide(false);
        return;
      }

      // Converte para o formato esperado pela tela
      // A API pode retornar pickup/destination ou origin/destination
      const origin = rideData.pickup || rideData.origin || { lat: 0, lng: 0 };
      const destination = rideData.destination || { lat: 0, lng: 0 };

      const tripData = {
        trip_id: rideData.id,
        origin: origin,
        destination: destination,
        estimated_fare: rideData.estimatedPrice || rideData.estimated_fare || 0,
        final_fare: rideData.finalPrice || rideData.final_fare,
        distance_km: rideData.distanceKm || rideData.distance_km,
        duration_seconds: rideData.durationMinutes ? rideData.durationMinutes * 60 : (rideData.duration_seconds || 0),
        passenger: rideData.passenger ? {
          id: rideData.passenger.id || rideData.passengerId,
          name: rideData.passenger.name,
          rating: rideData.passenger.rating,
        } : undefined,
        status: normalizedStatus, // Usa o status normalizado
      };

      // Salva no AsyncStorage com status normalizado
      try {
        await AsyncStorage.setItem('@vamu:active_trip_id', rideData.id);
        await AsyncStorage.setItem('@vamu:active_trip_data', JSON.stringify({
          id: rideData.id,
          status: normalizedStatus, // Salva com status normalizado
          origin: tripData.origin,
          destination: tripData.destination,
          estimated_fare: rideData.estimatedPrice,
          final_fare: rideData.finalPrice,
          distance_km: rideData.distanceKm,
          duration_seconds: tripData.duration_seconds,
          passenger: tripData.passenger,
        }));
        console.log('[DriverHome] Corrida ativa salva no storage com status normalizado:', normalizedStatus);
      } catch (error) {
        console.error('[DriverHome] Erro ao salvar corrida ativa no storage:', error);
      }

      // Navega para a tela de corrida ativa
      console.log('[DriverHome] Navegando para tela de corrida ativa...');
      navigation.replace('DriverTripInProgress', {
        tripId: rideData.id,
        tripData: tripData,
      });
    } catch (error) {
      console.error('[DriverHome] Erro ao verificar corrida ativa:', error);
      setIsCheckingActiveRide(false);
    }
  }, [navigation]);

  // Verifica corrida ativa ao montar
  useEffect(() => {
    checkActiveRide();
  }, [checkActiveRide]);

  // Verifica corrida ativa sempre que a tela ganha foco (reabrir app / trocar aba)
  useFocusEffect(
    React.useCallback(() => {
      checkActiveRide();
      return () => {};
    }, [checkActiveRide]),
  );

  // Carrega status operacional e de validação ao montar
  useEffect(() => {
    const loadStatuses = async () => {
      // Carrega primeiro o status de validação
      await loadValidationStatus();
      // Depois carrega o status operacional (que depende do status de validação)
      await loadOperationalStatus();
    };
    loadStatuses();
  }, []);

  // Carrega preferência de disponibilidade (permanece online se saiu ativo)
  useEffect(() => {
    const loadAvailabilityPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(CACHE_KEYS.DRIVER_AVAILABILITY_PREF);
        if (saved !== null) {
          const parsed = saved === 'true';
          availabilityPrefRef.current = parsed;
          if (parsed) {
            // Se o usuário queria ficar disponível, respeita após abertura, desde que apto
            setIsAvailable(true);
          }
        }
      } catch (error) {
        console.error('[DriverHome] Erro ao carregar preferência de disponibilidade:', error);
      }
    };
    loadAvailabilityPreference();
  }, []);

  // Verifica se o motorista está apto para receber corridas
  const isDriverEligible = (): boolean => {
    if (!operationalStatus) return false;
    
    // Se workflowStatus é ACTIVE, o motorista está apto independentemente de outros fatores
    if (validationStatus?.workflowStatus === 'ACTIVE') {
      return true;
    }
    
    return operationalStatus.canReceiveRides === true;
  };

  // Carrega status operacional
  const loadOperationalStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const response = await apiService.getDriverOperationalStatus();
      if (response.success && response.data) {
        setOperationalStatus(response.data);
        // Atualiza o estado de disponibilidade baseado no status operacional
        // Se workflowStatus é ACTIVE, permite disponibilidade mesmo com documentos pendentes de veículos
        const workflowStatus = validationStatus?.workflowStatus;
        const canBeAvailable = response.data.operationalStatus === 'AVAILABLE' && response.data.canReceiveRides;
        
        // Se workflowStatus é ACTIVE, permite disponibilidade (mesmo com alguns documentos pendentes)
        const wantsAvailable = availabilityPrefRef.current === true;
        if (workflowStatus === 'ACTIVE') {
          setIsAvailable(wantsAvailable ? true : canBeAvailable);
        } else if (hasPendingDocuments() || !response.data.canReceiveRides) {
          // Se há documentos pendentes ou não está apto, força indisponível
          setIsAvailable(false);
        } else {
          setIsAvailable(wantsAvailable ? true : canBeAvailable);
        }
      }
    } catch (error) {
      console.error('[DriverHome] Erro ao carregar status operacional:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Carrega status de validação
  const loadValidationStatus = async () => {
    try {
      const response = await apiService.getDriverValidationStatus();
      if (response.success && response.data) {
        setValidationStatus(response.data);
      }
    } catch (error) {
      console.error('[DriverHome] Erro ao carregar status de validação:', error);
    }
  };

  // Verifica se há documentos faltando ou pendentes
  const hasPendingDocuments = (): boolean => {
    if (!validationStatus) return false;
    
    // Se workflowStatus é ACTIVE, documentos pendentes de veículos não bloqueiam
    // (desde que haja pelo menos um veículo aprovado)
    const workflowStatus = validationStatus.workflowStatus;
    const vehicles = validationStatus.vehicles || [];
    const hasApprovedVehicle = vehicles.some((vehicle: any) => vehicle.status === 'APPROVED');
    
    // Verifica se CNH está pendente ou rejeitada (sempre bloqueia)
    const cnhStatus = validationStatus.cnh?.status;
    if (cnhStatus === 'PENDING' || cnhStatus === 'REJECTED') {
      return true;
    }
    
    // Se workflowStatus é ACTIVE e há pelo menos um veículo aprovado,
    // documentos pendentes de outros veículos não bloqueiam
    if (workflowStatus === 'ACTIVE' && hasApprovedVehicle) {
      return false;
    }
    
    // Verifica se há veículos pendentes ou rejeitados (e não há nenhum aprovado)
    return vehicles.some((vehicle: any) =>
      vehicle.status === 'PENDING' || vehicle.status === 'REJECTED'
    ) && !hasApprovedVehicle;
  };

  // Obtém mensagem de aviso baseada no status de validação
  const getValidationWarningMessage = (): string | null => {
    if (!validationStatus) return null;
    
    const workflowStatus = validationStatus.workflowStatus;
    const cnhStatus = validationStatus.cnh?.status;
    
    // Verifica se CNH está pendente ou rejeitada
    if (cnhStatus === 'PENDING') {
      return 'CNH em análise. Você só poderá fazer corridas após a aprovação.';
    }
    
    if (cnhStatus === 'REJECTED') {
      const reason = validationStatus.cnh?.rejectionReason || 'CNH rejeitada';
      return `CNH rejeitada: ${reason}. Envie uma nova CNH para continuar.`;
    }
    
    // Verifica se está aguardando CNH
    if (workflowStatus === 'AWAITING_CNH') {
      return 'Envie sua CNH para começar a receber corridas.';
    }
    
    // Verifica se está aguardando veículo
    if (workflowStatus === 'AWAITING_VEHICLE') {
      return 'Cadastre um veículo para começar a receber corridas.';
    }
    
    // Verifica se há veículos pendentes
    const vehicles = validationStatus.vehicles || [];
    const pendingVehicle = vehicles.find((vehicle: any) => vehicle.status === 'PENDING');
    if (pendingVehicle) {
      return 'Veículo em análise. Você só poderá fazer corridas após a aprovação.';
    }
    
    const rejectedVehicle = vehicles.find((vehicle: any) => vehicle.status === 'REJECTED');
    if (rejectedVehicle) {
      return 'Veículo rejeitado. Cadastre um novo veículo para continuar.';
    }
    
    return null;
  };

  // Obtém mensagem completa sobre o que falta para estar apto
  const getEligibilityMessage = (): string => {
    if (!validationStatus) {
      return 'Carregando informações...';
    }

    const workflowStatus = validationStatus.workflowStatus;
    const cnhStatus = validationStatus.cnh?.status;
    const vehicles = validationStatus.vehicles || [];

    // Verifica se está aguardando CNH
    if (workflowStatus === 'AWAITING_CNH' || !cnhStatus || cnhStatus === 'MISSING') {
      return 'Envie os documentos do carro, cadastre um veículo e envie a CNH para ativar a disponibilidade.';
    }

    // Verifica se CNH está pendente
    if (cnhStatus === 'PENDING') {
      return 'CNH em análise. Aguarde a aprovação para ativar a disponibilidade.';
    }

    // Verifica se CNH foi rejeitada
    if (cnhStatus === 'REJECTED') {
      return 'CNH rejeitada. Envie uma nova CNH para continuar.';
    }

    // Verifica se está aguardando veículo
    if (workflowStatus === 'AWAITING_VEHICLE' || vehicles.length === 0) {
      return 'Cadastre um veículo para ativar a disponibilidade.';
    }

    // Verifica se há veículos pendentes
    const pendingVehicle = vehicles.find((vehicle: any) => vehicle.status === 'PENDING');
    if (pendingVehicle) {
      return 'Veículo em análise. Aguarde a aprovação para ativar a disponibilidade.';
    }

    // Verifica se há veículos rejeitados
    const rejectedVehicle = vehicles.find((vehicle: any) => vehicle.status === 'REJECTED');
    if (rejectedVehicle) {
      return 'Veículo rejeitado. Cadastre um novo veículo para continuar.';
    }

    // Se chegou aqui e ainda não está apto, verifica documentos do carro
    if (workflowStatus !== 'COMPLETE' && workflowStatus !== 'ACTIVE') {
      return 'Complete o envio dos documentos do carro para ativar a disponibilidade.';
    }

    return 'Complete o cadastro para ativar a disponibilidade.';
  };

  // Solicita permissão de localização ao montar
  useEffect(() => {
    requestLocationPermission();
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
      }
    };
  }, []);

  // Verifica corrida ativa removida - rota /drivers/me/trips/active não existe mais
  // As corridas são recebidas via WebSocket quando atribuídas

  // Limpa timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (availabilityRateLimitTimeoutRef.current) {
        clearTimeout(availabilityRateLimitTimeoutRef.current);
        availabilityRateLimitTimeoutRef.current = null;
      }
      if (locationRateLimitTimeoutRef.current) {
        clearTimeout(locationRateLimitTimeoutRef.current);
        locationRateLimitTimeoutRef.current = null;
      }
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
        rateLimitTimeoutRef.current = null;
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      if (nearbyUpdateIntervalRef.current) {
        clearInterval(nearbyUpdateIntervalRef.current);
        nearbyUpdateIntervalRef.current = null;
      }
    };
  }, []);

  // Log para debug do estado do modal
  useEffect(() => {
    console.log('[DriverHome] Estado do modal atualizado:', {
      showTripRequest,
      hasPendingTrip: !!pendingTrip,
      tripId: pendingTrip?.trip_id,
    });
  }, [showTripRequest, pendingTrip]);

  // Controla expiração da oferta com base no assignment_expires_at recebido do WebSocket
  useEffect(() => {
    if (offerExpireTimeoutRef.current) {
      clearTimeout(offerExpireTimeoutRef.current);
      offerExpireTimeoutRef.current = null;
    }

    if (!pendingTrip) return;

    const expiresAtMs =
      (pendingTrip.assignment_expires_at && new Date(pendingTrip.assignment_expires_at).getTime()) ||
      Date.now() + 15000;

    const msRemaining = Math.max(0, expiresAtMs - Date.now());

    const expire = () => {
      console.log('[DriverHome] Oferta expirada, fechando modal e liberando próxima oferta', {
        tripId: pendingTrip.trip_id,
        assignment_expires_at: pendingTrip.assignment_expires_at,
      });
      setShowTripRequest(false);
      setPendingTrip(null);
      setPassengerLocation(null);

      // Informa o backend para seguir para o próximo motorista
      try {
        websocketService.respondToRideOffer(pendingTrip.trip_id, 'reject');
      } catch (err) {
        console.error('[DriverHome] Erro ao enviar reject por expiração:', err);
      }
    };

    offerExpireTimeoutRef.current = setTimeout(expire, msRemaining || 0);

    return () => {
      if (offerExpireTimeoutRef.current) {
        clearTimeout(offerExpireTimeoutRef.current);
        offerExpireTimeoutRef.current = null;
      }
    };
  }, [pendingTrip?.trip_id, pendingTrip?.assignment_expires_at]);

  // Registra o callback IMEDIATAMENTE quando o componente monta
  // Isso garante que o callback esteja registrado antes do TripContext
  useEffect(() => {
    console.log('[DriverHome] Componente montado - registrando callback do WebSocket IMEDIATAMENTE');
    
    const handleWebSocketMessage = (message: ServerMessage) => {
      console.log('[DriverHome] Mensagem WebSocket recebida:', message);

      // Trata oferta de corrida (novo formato do WebSocket)
      if (message.type === 'ride_offer') {
        console.log('[DriverHome] Oferta de corrida recebida via WebSocket:', message);
        
        // Proteção: ignora se já existe uma corrida pendente (mesma ou diferente)
        // Isso evita abrir múltiplos modais ou reiniciar o timer
        if (showTripRequest || pendingTrip) {
          const isSameTrip = pendingTrip?.trip_id === message.trip_id;
          console.log('[DriverHome] Já existe uma corrida pendente. Ignorando nova oferta:', {
            pendingTripId: pendingTrip?.trip_id,
            newTripId: message.trip_id,
            isSameTrip,
            showTripRequest
          });
          // Se for a mesma corrida, definitivamente ignora para não reiniciar o timer
          // Se for diferente, também ignora para não substituir a atual
          return;
        }
        
        // Notificação local para alertar o motorista (inclusive em outras telas/foreground)
        sendLocalNotification(
          'Nova corrida disponível',
          message.passenger?.name
            ? `Passageiro ${message.passenger.name} aguardando`
            : 'Há um passageiro aguardando corrida',
          { type: 'ride_offer', trip_id: message.trip_id }
        ).catch(() => {});
        
        // Busca informações de pagamento se necessário (para formatar melhor o nome)
        const loadPaymentInfo = async () => {
          try {
            // Se já temos payment_method e payment_brand do WebSocket, usa eles
            if (message.payment_method || message.payment_brand) {
              let paymentMethodName = message.payment_method || 'Não especificado';
              let paymentBrandName = message.payment_brand || null;
              
              // Tenta buscar do cache para ter nome formatado (ex: "Cartão de Crédito" ao invés de "credito")
              const cachedMethods = await AsyncStorage.getItem('@vamu:payment_methods');
              const cachedBrands = await AsyncStorage.getItem('@vamu:payment_brands');
              
              if (cachedMethods) {
                const paymentMethods: PaymentMethodResponse[] = JSON.parse(cachedMethods);
                const method = paymentMethods.find(m => 
                  m.slug === message.payment_method || 
                  m.name.toLowerCase() === message.payment_method?.toLowerCase()
                );
                if (method) {
                  paymentMethodName = method.name;
                }
              }
              
              if (cachedBrands && message.payment_brand) {
                const cardBrands: CardBrandResponse[] = JSON.parse(cachedBrands);
                const brand = cardBrands.find(b => 
                  b.slug === message.payment_brand || 
                  b.name.toLowerCase() === message.payment_brand?.toLowerCase()
                );
                if (brand) {
                  paymentBrandName = brand.name;
                }
              }
              
              return {
                payment_method: message.payment_method ? {
                  name: paymentMethodName,
                  slug: message.payment_method,
                } : undefined,
                payment_brand: message.payment_brand ? {
                  name: paymentBrandName || message.payment_brand,
                  slug: message.payment_brand,
                } : undefined,
              };
            }
            
            return {
              payment_method: undefined,
              payment_brand: undefined,
            };
          } catch (error) {
            console.error('[DriverHome] Erro ao buscar informações de pagamento:', error);
            return {
              payment_method: message.payment_method ? {
                name: message.payment_method,
                slug: message.payment_method,
              } : undefined,
              payment_brand: message.payment_brand ? {
                name: message.payment_brand,
                slug: message.payment_brand,
              } : undefined,
            };
          }
        };
        
        // Carrega informações de pagamento formatadas e depois atualiza o tripData
        loadPaymentInfo().then((paymentInfo) => {
          setPendingTrip((prev: PendingTripData | null) => {
            if (prev && prev.trip_id === message.trip_id) {
              return {
                ...prev,
                payment_method: paymentInfo.payment_method,
                payment_brand: paymentInfo.payment_brand,
              };
            }
            return prev;
          });
        });
        
        // Converte para o formato esperado pelo modal usando o novo formato do WebSocket
        const tripData: PendingTripData = {
          trip_id: message.trip_id,
          origin: message.origin,
          destination: message.destination,
          estimated_fare: message.estimated_fare,
          distance_km: message.distance_km,
          duration_seconds: message.duration_seconds,
          assignment_expires_at: message.assignment_expires_at,
          // Dados do passageiro vêm completos do WebSocket
          passenger: {
            id: message.passenger.id,
            name: message.passenger.name,
            rating: message.passenger.rating,
            ...(message.passenger.photoUrl && { photoUrl: message.passenger.photoUrl }),
          },
          // Pagamento será atualizado quando carregar informações formatadas
        };

        console.log('[DriverHome] Exibindo modal de corrida com dados:', tripData);
        console.log('[DriverHome] Definindo showTripRequest como true');
        console.log('[DriverHome] tripData criado:', JSON.stringify(tripData));
        
        // Usa função de atualização de estado para garantir que o estado seja atualizado
        setPendingTrip((prev: PendingTripData | null) => {
          console.log('[DriverHome] setPendingTrip chamado, prev:', prev);
          return tripData;
        });
        
        setShowTripRequest((prev: boolean) => {
          console.log('[DriverHome] setShowTripRequest chamado, prev:', prev);
          return true;
        });

        // Notificação local (foreground) para chamar atenção do motorista
        sendLocalNotification(
          'Nova corrida disponível',
          `${message.passenger?.name || 'Passageiro'} aguardando. Valor estimado: R$ ${Number(message.estimated_fare || 0).toFixed(2)}`,
          { tripId: message.trip_id }
        ).catch((err) => console.error('[DriverHome] Erro ao enviar notificação local de oferta:', err));
        
        // Define localização do passageiro como origin point
        setPassengerLocation({
          lat: message.origin.lat,
          lng: message.origin.lng,
        } as { lat: number; lng: number });
        
        console.log('[DriverHome] Modal deve estar visível agora. showTripRequest:', true);
        return; // Retorna para evitar que outros handlers processem
      }

      // Trata resposta de corrida aceita
      if (message.type === 'ride_accepted') {
        console.log('[DriverHome] Corrida aceita confirmada via WebSocket:', message);
        setPendingTrip((currentPendingTrip: PendingTripData | null) => {
          if (currentPendingTrip) {
            setShowTripRequest(false);
            const tripId = currentPendingTrip.trip_id;
            const tripData = currentPendingTrip;
            
            // Salva a trip no AsyncStorage para persistência
            const saveTripToStorage = async () => {
              try {
                await AsyncStorage.setItem('@vamu:active_trip_id', tripId);
                await AsyncStorage.setItem('@vamu:active_trip_data', JSON.stringify({
                  id: tripId,
                  status: 'DRIVER_ASSIGNED', // Status inicial quando aceita
                  origin: tripData.origin,
                  destination: tripData.destination,
                  estimated_fare: tripData.estimated_fare,
                  distance_km: tripData.distance_km,
                  duration_seconds: tripData.duration_seconds,
                  category: tripData.category ? {
                    id: tripData.category,
                    name: tripData.category,
                  } : undefined,
                  passenger: tripData.passenger,
                  created_at: new Date().toISOString(),
                  accepted_at: new Date().toISOString(),
                }));
                console.log('[DriverHome] Trip salva no AsyncStorage:', tripId);
              } catch (error) {
                console.error('[DriverHome] Erro ao salvar trip no AsyncStorage:', error);
              }
            };
            
            saveTripToStorage();
            
            setTimeout(() => {
              navigation.navigate('DriverTripInProgress', {
                tripId: tripId,
                tripData: tripData,
              });
            }, 100);
            return null;
          }
          return currentPendingTrip;
        });
        return;
      }

      // Trata resposta de corrida recusada
      if (message.type === 'ride_rejected') {
        console.log('[DriverHome] Corrida recusada confirmada via WebSocket:', message);
        setShowTripRequest(false);
        setPendingTrip(null);
        setPassengerLocation(null);
        return;
      }

      // Trata localização do passageiro
      if (message.type === 'passenger_location') {
        console.log('[DriverHome] Localização do passageiro recebida:', message);
        setPassengerLocation({
          lat: message.lat,
          lng: message.lng,
        });
        return;
      }

      // Trata corrida ativa após reconexão
      if (message.type === 'active_ride') {
        // TripContext tratará active_ride e vai navegar via TripNavigationHandler
        console.log('[DriverHome] Corrida ativa recebida após reconexão (delegando ao TripContext)');
        return;
      }
    };

    // Registra o callback uma vez (não precisa reconfigurar periodicamente)
    // O problema de callbacks duplicados era causado pelo setInterval que foi removido
    websocketService.setOnMessage(handleWebSocketMessage);
    
    // Cleanup
    return () => {
      console.log('[DriverHome] Componente desmontando - removendo callback');
      websocketService.removeOnMessage(handleWebSocketMessage);
    };
  }, [navigation]); // Executa apenas uma vez quando o componente monta

  // Atualiza localização quando disponibilidade muda
  useEffect(() => {
    if (isAvailable && currentLocation) {
      startLocationUpdates();
      startNearbyUpdates();
      
      // Se tem localização mas WebSocket não está conectado, tenta conectar
      if (!isWebSocketConnected && connectWebSocket) {
        console.log('[DriverHome] Tentando conectar WebSocket automaticamente...');
        connectWebSocket().catch((error) => {
          console.error('[DriverHome] Erro ao conectar WebSocket automaticamente:', error);
        });
      }
    } else {
      stopLocationUpdates();
      stopNearbyUpdates();
      // Limpa localização do passageiro quando fica indisponível
      setPassengerLocation(null);
      // Não desativa disponibilidade automaticamente aqui
      // A desativação é feita apenas manualmente via handleToggleAvailability
      // para respeitar o rate limiting
    }
    return () => {
      stopLocationUpdates();
      stopNearbyUpdates();
    };
  }, [isAvailable, currentLocation, isWebSocketConnected, connectWebSocket]);

  // Busca motoristas e passageiros próximos
  const startNearbyUpdates = () => {
    if (nearbyUpdateIntervalRef.current) {
      clearInterval(nearbyUpdateIntervalRef.current);
    }

    // Atualiza a cada 30 segundos para não sobrecarregar a API
    nearbyUpdateIntervalRef.current = setInterval(async () => {
      if (!currentLocation || !isAvailable) return;

      try {
        // Busca motoristas próximos
        const driversResponse = await apiService.getNearbyDrivers(
          currentLocation.lat,
          currentLocation.lon
        );
        if (driversResponse.success && driversResponse.data) {
          // Filtra apenas motoristas disponíveis e diferentes do motorista atual
          const availableDrivers = Array.isArray(driversResponse.data)
            ? driversResponse.data.filter(
                (driver: any) =>
                  driver.is_available &&
                  driver.driver_id !== user?.userId &&
                  driver.latitude &&
                  driver.longitude
              )
            : [];
          setNearbyDrivers(
            availableDrivers.map((driver: any) => ({
              id: driver.driver_id || driver.id,
              lat: driver.latitude,
              lon: driver.longitude,
              type: 'car' as const,
              bearing: driver.heading || undefined,
            }))
          );
        }

        // Busca passageiros com corridas ativas
        const passengersResponse = await apiService.getActivePassengers(
          currentLocation.lat,
          currentLocation.lon
        );
        if (passengersResponse.success && passengersResponse.data) {
          // Filtra passageiros com corridas ativas dentro do raio
          const activePassengersList = Array.isArray(passengersResponse.data)
            ? passengersResponse.data.filter(
                (passenger: any) =>
                  passenger.latitude &&
                  passenger.longitude &&
                  passenger.trip_status &&
                  ['REQUESTED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING'].includes(
                    passenger.trip_status
                  )
              )
            : [];
          setActivePassengers(
            activePassengersList.map((passenger: any) => ({
              id: passenger.passenger_id || passenger.id,
              lat: passenger.latitude,
              lon: passenger.longitude,
            }))
          );
        }

        // Busca corridas disponíveis (opcional, se o endpoint existir)
        const tripsResponse = await apiService.getAvailableTrips(
          currentLocation.lat,
          currentLocation.lon
        );
        if (tripsResponse.success && tripsResponse.data && Array.isArray(tripsResponse.data)) {
          // Atualiza passageiros ativos com dados das corridas disponíveis
          const availableTrips = tripsResponse.data.filter(
            (trip: any) =>
              trip.origin?.lat &&
              trip.origin?.lng &&
              trip.status === 'REQUESTED'
          );
          // Adiciona passageiros das corridas disponíveis ao mapa
          const tripPassengers = availableTrips.map((trip: any) => ({
            id: trip.passenger_id || trip.id,
            lat: trip.origin.lat,
            lon: trip.origin.lng,
          }));
          setActivePassengers((prev: any[]) => {
            const combined = [...prev, ...tripPassengers];
            // Remove duplicatas
              return combined.filter(
                (item, index, self) =>
                    index === self.findIndex((t) => t.id === item.id)
            );
          });
        }
      } catch (error) {
        console.error('[DriverHome] Erro ao buscar motoristas/passageiros próximos:', error);
      }
    }, 30000); // 30 segundos
  };

  const stopNearbyUpdates = () => {
    if (nearbyUpdateIntervalRef.current) {
      clearInterval(nearbyUpdateIntervalRef.current);
      nearbyUpdateIntervalRef.current = null;
    }
  };

  const isLocationStale = () => {
    if (!lastLocationUpdateRef.current) return true;
    return Date.now() - lastLocationUpdateRef.current > LOCATION_STALE_MS;
  };

  const applyLocationUpdate = (
    location: { lat: number; lon: number; timestamp?: number },
    options: { centerMap?: boolean } = {}
  ) => {
    const normalizedLocation = { lat: location.lat, lon: location.lon };
    lastLocationUpdateRef.current = location.timestamp || Date.now();

    setCurrentLocation(normalizedLocation);

    if (options.centerMap !== false) {
      setMapCenter(normalizedLocation);
      if (mapRef.current) {
        mapRef.current.centerOnLocation(normalizedLocation.lat, normalizedLocation.lon);
      }
    }
  };

  const loadCachedLocation = async (): Promise<{ lat: number; lon: number } | null> => {
    try {
      const cachedLocation = await AsyncStorage.getItem(CACHE_KEYS.DRIVER_LOCATION);
      const cachedTimestamp = await AsyncStorage.getItem(CACHE_KEYS.DRIVER_LOCATION_TIMESTAMP);

      if (cachedLocation && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();

        if (now - timestamp < CACHE_VALIDITY_MS) {
          lastLocationUpdateRef.current = timestamp;
          return JSON.parse(cachedLocation);
        }
      }
    } catch (error) {
      console.error('[DriverHome] Erro ao carregar localização do cache:', error);
    }
    return null;
  };

  const saveLocationToCache = async (location: { lat: number; lon: number }) => {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.DRIVER_LOCATION, JSON.stringify(location));
      await AsyncStorage.setItem(CACHE_KEYS.DRIVER_LOCATION_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error('[DriverHome] Erro ao salvar localização no cache:', error);
    }
  };

  const warmStartLocation = async (options: { centerMap?: boolean } = {}) => {
    try {
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_MAX_AGE_MS,
      });

      if (lastKnown) {
        const lastKnownLocation = {
          lat: lastKnown.coords.latitude,
          lon: lastKnown.coords.longitude,
          timestamp: lastKnown.timestamp,
        };

        applyLocationUpdate(lastKnownLocation, options);
        // Atualiza cache de forma oportunista
        saveLocationToCache({ lat: lastKnownLocation.lat, lon: lastKnownLocation.lon }).catch(() => {});
        return lastKnownLocation;
      }
    } catch (error) {
      console.warn('[DriverHome] Não foi possível obter última localização conhecida:', error);
    }

    const cached = await loadCachedLocation();
    if (cached) {
      applyLocationUpdate({ ...cached, timestamp: lastLocationUpdateRef.current }, options);
      return cached;
    }

    return null;
  };

  const requestLocationPermission = async (forceRefresh: boolean = false, options: { centerMap?: boolean } = {}) => {
    const { centerMap = true } = options;

    try {
      const now = Date.now();
      const locationWasStale = isLocationStale();

      // Exibe algo rápido enquanto busca algo mais atual
      if ((!currentLocation || locationWasStale) && !forceRefresh) {
        await warmStartLocation({ centerMap });
      }

      // Se já temos uma localização recente, evita nova chamada
      if (!forceRefresh && currentLocation && !isLocationStale()) {
        return;
      }

      // Throttling para evitar chamadas repetidas
      if (!forceRefresh && lastLocationRequestRef.current > 0 && now - lastLocationRequestRef.current < LOCATION_REQUEST_THROTTLE_MS) {
        const cachedLocation = await loadCachedLocation();
        if (cachedLocation) {
          applyLocationUpdate({ ...cachedLocation, timestamp: lastLocationUpdateRef.current }, { centerMap });
        }
        return;
      }

      lastLocationRequestRef.current = now;

      // Checa permissão
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      let finalStatus = currentStatus;
      if (currentStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos da sua localização para funcionar corretamente.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Busca localização com timeout curto para não travar
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));

      const location = await Promise.race([locationPromise, timeoutPromise]);

      if (!location) {
        const cachedLocation = await loadCachedLocation();
        if (cachedLocation) {
          applyLocationUpdate({ ...cachedLocation, timestamp: lastLocationUpdateRef.current }, { centerMap });
        }
        return;
      }

      const newLocation = {
        lat: location.coords.latitude,
        lon: location.coords.longitude,
        timestamp: location.timestamp,
      };

      applyLocationUpdate(newLocation, { centerMap });
      saveLocationToCache(newLocation).catch(() => {});
    } catch (error) {
      console.error('[DriverHome] Erro ao obter localização:', error);
    }
  };

  // Funções de rate limiting removidas - não fazemos mais requisições de localização à API
  // A localização é gerenciada automaticamente pelo backend

  const startLocationUpdates = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }

    // Limpa timeout de rate limit se existir
    if (locationRateLimitTimeoutRef.current) {
      clearTimeout(locationRateLimitTimeoutRef.current);
      locationRateLimitTimeoutRef.current = null;
    }

    // A localização do motorista é gerenciada automaticamente pelo backend
    // Não é mais necessário fazer requisições periódicas para /drivers/location
    // A rota /v1/drivers/location foi removida da API
    locationIntervalRef.current = setInterval(async () => {
      if (!isAvailable) return;

      // A localização é obtida localmente do dispositivo e usada apenas para exibição no mapa
      // O backend gerencia a localização do motorista automaticamente
      try {
        // Obtém localização atual do dispositivo (não faz requisição à API)
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const newLocation = {
          lat: location.coords.latitude,
          lon: location.coords.longitude,
          timestamp: location.timestamp,
        };

        // Atualiza localização localmente para exibição no mapa
        applyLocationUpdate(newLocation, { centerMap: !hasUserMovedMap });

        // Persiste cache com baixa frequência para evitar I/O excessivo
        const now = Date.now();
        if (now - lastCacheSaveRef.current > 15000) {
          lastCacheSaveRef.current = now;
          saveLocationToCache({ lat: newLocation.lat, lon: newLocation.lon }).catch(() => {});
        }
        // Se estava em rate limit, remove o estado
        if (isRateLimited) {
          setIsRateLimited(false);
        }
        
        // Envia localização via WebSocket se conectado (envio automático contínuo)
        if (isWebSocketConnected && websocketService.getIsConnected() && isAvailable) {
          try {
            // Obtém heading e speed se disponíveis
            const heading = location.coords.heading !== null && location.coords.heading !== undefined
              ? location.coords.heading
              : undefined;
            const speed = location.coords.speed !== null && location.coords.speed !== undefined
              ? location.coords.speed * 3.6 // Converte m/s para km/h
              : undefined;
            
            websocketService.sendLocationUpdate({
              type: 'location_update',
              lat: newLocation.lat,
              lng: newLocation.lon,
              heading,
              speed,
            });
          } catch (error) {
            console.error('[DriverHome] Erro ao enviar localização via WebSocket:', error);
          }
        }
      } catch (error: any) {
        console.error('[DriverHome] Erro ao obter localização do dispositivo:', error);
        // Não mostra erro para o usuário durante atualizações automáticas
      }
    }, 3000); // 3 segundos (conforme documentação: 2-5 segundos, recomendado 3)
  };

  const stopLocationUpdates = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    if (locationRateLimitTimeoutRef.current) {
      clearTimeout(locationRateLimitTimeoutRef.current);
      locationRateLimitTimeoutRef.current = null;
    }
    if (rateLimitTimeoutRef.current) {
      clearTimeout(rateLimitTimeoutRef.current);
      rateLimitTimeoutRef.current = null;
    }
  };

  // Verifica se pode fazer uma nova requisição de disponibilidade (máximo 60 por minuto)
  const canMakeAvailabilityRequest = (): boolean => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000; // 60 segundos
    
    // Remove requisições antigas (mais de 1 minuto)
    availabilityRequestsRef.current = availabilityRequestsRef.current.filter(
      timestamp => timestamp > oneMinuteAgo
    );
    
    // Verifica se já atingiu o limite de 60 requisições
    return availabilityRequestsRef.current.length < 60;
  };

  // Registra uma requisição de disponibilidade
  const recordAvailabilityRequest = () => {
    const now = Date.now();
    availabilityRequestsRef.current.push(now);
    
    // Remove requisições antigas
    const oneMinuteAgo = now - 60000;
    availabilityRequestsRef.current = availabilityRequestsRef.current.filter(
      timestamp => timestamp > oneMinuteAgo
    );
  };

  // Processa requisição pendente de disponibilidade
  const processPendingAvailabilityRequest = async () => {
    if (!pendingAvailabilityRequestRef.current) return;
    
    const { value } = pendingAvailabilityRequestRef.current;
    pendingAvailabilityRequestRef.current = null;
    setIsAvailabilityRateLimited(false);
    
    // Verifica novamente se pode fazer a requisição
    if (!canMakeAvailabilityRequest()) {
      // Se ainda não pode, agenda novamente
      scheduleAvailabilityRequest(value);
      return;
    }
    
    // Faz a requisição usando a nova rota
    try {
      recordAvailabilityRequest();
      const status = value ? 'AVAILABLE' : 'OFFLINE';
      let response = await apiService.updateDriverOperationalStatus(status);

      // Se está ativando disponibilidade, faz uma segunda requisição automaticamente
      // para garantir que funcione no primeiro clique (melhora UX)
      if (value && response.success) {
        await new Promise(resolve => setTimeout(resolve, 300));
        recordAvailabilityRequest();
        response = await apiService.updateDriverOperationalStatus(status);
      }

      if (!response.success) {
        setApiError(response.message || `Erro ao ${value ? 'ativar' : 'desativar'} disponibilidade`);
        setIsAvailable(!value); // Reverte o toggle
        return;
      }

      // Atualiza o status operacional local
      if (response.data) {
        setOperationalStatus(response.data);
        setIsAvailable(response.data.operationalStatus === 'AVAILABLE' && response.data.canReceiveRides);
      }
      
      // A localização é gerenciada automaticamente pelo backend
      // Não é mais necessário enviar localização manualmente
    } catch (error: any) {
      console.error('[DriverHome] Erro ao atualizar disponibilidade:', error);
      const errorMsg = error?.message || 'Não foi possível atualizar a disponibilidade. Tente novamente.';
      setApiError(errorMsg);
      setIsAvailable(!value); // Reverte o toggle
    }
  };

  // Agenda uma requisição de disponibilidade para ser enviada após 1 minuto
  const scheduleAvailabilityRequest = (value: boolean) => {
    // Limpa timeout anterior se existir
    if (availabilityRateLimitTimeoutRef.current) {
      clearTimeout(availabilityRateLimitTimeoutRef.current);
    }
    
    // Agenda para 1 minuto
    pendingAvailabilityRequestRef.current = { value, timestamp: Date.now() };
    setIsAvailabilityRateLimited(true);
    
    availabilityRateLimitTimeoutRef.current = setTimeout(() => {
      processPendingAvailabilityRequest();
    }, 60000); // 60 segundos
  };

  const handleToggleAvailability = async (value: boolean) => {
    // Throttling de 1 segundo para evitar múltiplos cliques
    const now = Date.now();
    if (now - lastAvailabilityToggleRef.current < 1000) {
      return;
    }
    
    // Se já está conectando, ignora o clique
    if (isConnecting) {
      return;
    }
    
    lastAvailabilityToggleRef.current = now;

    // Se está ativando disponibilidade, verifica se está apto primeiro
    if (value) {
      // Verifica se o motorista está apto para receber corridas
      if (!isDriverEligible()) {
        const message = getEligibilityMessage();
        Alert.alert(
          'Não é possível ativar disponibilidade',
          message || 'Complete o cadastro e envie os documentos necessários para ativar a disponibilidade.',
          [{ text: 'OK' }]
        );
        setIsAvailable(false);
        return;
      }

      // Verifica se há documentos pendentes (mas não bloqueia se workflowStatus é ACTIVE)
      // Se workflowStatus é ACTIVE, documentos pendentes de veículos não bloqueiam
      const workflowStatus = validationStatus?.workflowStatus;
      if (workflowStatus !== 'ACTIVE' && hasPendingDocuments()) {
        const warningMessage = getValidationWarningMessage();
        Alert.alert(
          'Documentos Pendentes',
          warningMessage || 'Você tem documentos pendentes de aprovação. Só poderá fazer corridas após a aprovação.',
          [{ text: 'OK' }]
        );
        setIsAvailable(false);
        return;
      }
    }

    // Indica que está conectando (para bloquear múltiplos cliques e mostrar feedback visual)
    setIsConnecting(true);
    
    // Se está ativando disponibilidade, aguarda localização antes de continuar
    if (value && !currentLocation) {
      setLocationError(null);
      console.log('[DriverHome] Aguardando localização antes de ativar disponibilidade...');
      
      // Tenta obter localização
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const newLocation = {
          lat: location.coords.latitude,
          lon: location.coords.longitude,
          timestamp: location.timestamp,
        };
        
        applyLocationUpdate(newLocation);
        saveLocationToCache(newLocation).catch(() => {});
        setLocationError(null);
        
        console.log('[DriverHome] Localização obtida:', newLocation);
      } catch (error) {
        console.error('[DriverHome] Erro ao obter localização:', error);
        Alert.alert(
          'Erro de Localização',
          'Não foi possível obter sua localização. Verifique as permissões de GPS e tente novamente.'
        );
        setIsConnecting(false);
        return;
      }
    }

    setLocationError(null);
    setApiError(null);
    
    // Atualiza o estado do botão imediatamente (permite mudança visual)
    setIsAvailable(value);
    availabilityPrefRef.current = value;
    try {
      await AsyncStorage.setItem(CACHE_KEYS.DRIVER_AVAILABILITY_PREF, value ? 'true' : 'false');
    } catch (error) {
      console.error('[DriverHome] Erro ao salvar preferência de disponibilidade:', error);
    }

    // Verifica se pode fazer a requisição agora
    if (!canMakeAvailabilityRequest()) {
      // Se não pode, agenda para depois de 1 minuto
      console.warn('[DriverHome] Limite de requisições atingido. Agendando requisição para 1 minuto...');
      scheduleAvailabilityRequest(value);
      setApiError('Muitas requisições. A requisição será enviada em 1 minuto.');
      setIsConnecting(false);
      return;
    }

    // Se há uma requisição pendente, cancela
    if (pendingAvailabilityRequestRef.current) {
      if (availabilityRateLimitTimeoutRef.current) {
        clearTimeout(availabilityRateLimitTimeoutRef.current);
        availabilityRateLimitTimeoutRef.current = null;
      }
      pendingAvailabilityRequestRef.current = null;
      setIsAvailabilityRateLimited(false);
    }

    // Faz a requisição imediatamente usando a nova rota
    try {
      recordAvailabilityRequest();
      
      const status = value ? 'AVAILABLE' : 'OFFLINE';
      let response = await apiService.updateDriverOperationalStatus(status);
      
      // Se está ativando disponibilidade, faz uma segunda requisição automaticamente
      // para garantir que funcione no primeiro clique (melhora UX)
      if (value && response.success) {
        // Pequena pausa entre as requisições
        await new Promise(resolve => setTimeout(resolve, 300));
        recordAvailabilityRequest();
        response = await apiService.updateDriverOperationalStatus(status);
      }
      
      if (!response.success) {
        setApiError(response.message || `Erro ao ${value ? 'ativar' : 'desativar'} disponibilidade`);
        setIsAvailable(!value); // Reverte o toggle
        return;
      }
      
      // Atualiza o status operacional local
      if (response.data) {
        setOperationalStatus(response.data);
        setIsAvailable(response.data.operationalStatus === 'AVAILABLE' && response.data.canReceiveRides);
        
        // Se o motorista está ficando disponível, garante que o WebSocket está conectado
        // MAS APENAS SE ESTIVER APTO E TIVER LOCALIZAÇÃO
        if (value && response.data.operationalStatus === 'AVAILABLE' && response.data.canReceiveRides) {
          // Verifica se tem localização antes de conectar WebSocket
          if (currentLocation) {
            if (!isWebSocketConnected && connectWebSocket) {
              console.log('[DriverHome] Motorista apto e localização encontrada. Conectando WebSocket para rastreamento...');
              try {
                await connectWebSocket();
                // Aguarda um pouco para garantir que a conexão foi estabelecida
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Envia localização inicial imediatamente após conectar
                if (websocketService.getIsConnected()) {
                  try {
                    websocketService.sendLocationUpdate({
                      type: 'location_update',
                      lat: currentLocation.lat,
                      lng: currentLocation.lon,
                      heading: undefined, // Pode ser obtido se disponível
                      speed: undefined, // Pode ser obtido se disponível
                    });
                    console.log('[DriverHome] Localização inicial enviada via WebSocket');
                  } catch (error) {
                    console.error('[DriverHome] Erro ao enviar localização via WebSocket:', error);
                  }
                }

                // Inicia background location tracking para motorista disponível
                // Isso permite receber notificações de novas corridas mesmo em segundo plano
                try {
                  await startDriverBackgroundLocation();
                  console.log('[DriverHome] Background location iniciado para motorista disponível');
                } catch (error) {
                  console.error('[DriverHome] Erro ao iniciar background location:', error);
                  // Não bloqueia o fluxo se background location falhar
                }
              } catch (error) {
                console.error('[DriverHome] Erro ao conectar WebSocket:', error);
                setApiError('Erro ao conectar ao servidor. Tente novamente.');
              }
            } else if (isWebSocketConnected && websocketService.getIsConnected()) {
              // Se já está conectado, apenas envia localização inicial
              try {
                websocketService.sendLocationUpdate({
                  type: 'location_update',
                  lat: currentLocation.lat,
                  lng: currentLocation.lon,
                });
                console.log('[DriverHome] Localização inicial enviada via WebSocket (já conectado)');
              } catch (error) {
                console.error('[DriverHome] Erro ao enviar localização via WebSocket:', error);
              }

              // Inicia background location se ainda não estiver ativo
              try {
                await startDriverBackgroundLocation();
                console.log('[DriverHome] Background location iniciado para motorista disponível (já conectado)');
              } catch (error) {
                console.error('[DriverHome] Erro ao iniciar background location:', error);
              }
            }
          } else {
            console.log('[DriverHome] Aguardando localização antes de conectar WebSocket...');
            setLocationError('Aguardando localização para conectar...');
            // Tenta obter localização novamente
            try {
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });
              
              const newLocation = {
                lat: location.coords.latitude,
                lon: location.coords.longitude,
                timestamp: location.timestamp,
              };
              
              applyLocationUpdate(newLocation);
              saveLocationToCache(newLocation).catch(() => {});
              setLocationError(null);
              
              // Agora que tem localização e está apto, conecta WebSocket
              if (!isWebSocketConnected && connectWebSocket && isDriverEligible()) {
                console.log('[DriverHome] Localização obtida. Conectando WebSocket...');
                await connectWebSocket();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (websocketService.getIsConnected()) {
                  websocketService.sendLocationUpdate({
                    type: 'location_update',
                    lat: newLocation.lat,
                    lng: newLocation.lon,
                  });
                }
              }
            } catch (error) {
              console.error('[DriverHome] Erro ao obter localização:', error);
              setLocationError('Erro ao obter localização. Verifique as permissões de GPS.');
            }
          }
        } else if (!value) {
          // Se está desativando disponibilidade, para background location
          // (mas mantém WebSocket conectado para receber notificações se necessário)
          console.log('[DriverHome] Motorista offline, parando background location');
          try {
            await stopDriverBackgroundLocation();
          } catch (error) {
            console.error('[DriverHome] Erro ao parar background location:', error);
          }
        }
      }
      
      // A localização é gerenciada automaticamente pelo backend via WebSocket
      // Enviaremos localização via WebSocket quando conectado
      
      // Finaliza o estado de conectando (sucesso)
      setIsConnecting(false);
    } catch (error: any) {
      console.error('[DriverHome] Erro ao atualizar disponibilidade:', error);
      
      // Se for erro 429, agenda para depois
      if (error?.message?.includes('429') || error?.message?.includes('Muitas requisições')) {
        scheduleAvailabilityRequest(value);
        setApiError('Muitas requisições. A requisição será enviada em 1 minuto.');
        setIsConnecting(false);
        return;
      }
      
      const errorMsg = error?.message || 'Não foi possível atualizar a disponibilidade. Tente novamente.';
      setApiError(errorMsg);
      setIsAvailable(!value); // Reverte o toggle
      setIsConnecting(false);
    }
  };

  const handleRecenterLocation = async () => {
    // Previne múltiplos cliques simultâneos
    if (isRequestingLocationRef.current) {
      return;
    }

    setLocationError(null);
    setApiError(null);

    if (!hasUserMovedMap) {
      // Primeira vez ou não mexeu no mapa - vai para localização atual
      isRequestingLocationRef.current = true;
      await requestLocationPermission();
      isRequestingLocationRef.current = false;
    } else {
      // Usuário mexeu no mapa - recentra na última localização conhecida
      if (currentLocation) {
        // Reset imediato sem buscar nova localização
        setMapCenter(currentLocation);
        if (mapRef.current) {
          mapRef.current.centerOnLocation(currentLocation.lat, currentLocation.lon);
        }
        setHasUserMovedMap(false);
      } else {
        // Se não tem localização ainda, pede permissão
        isRequestingLocationRef.current = true;
        await requestLocationPermission();
        isRequestingLocationRef.current = false;
      }
    }
  };

  const handleMapMove = () => {
    setHasUserMovedMap(true);
  };

  // Funções de zoom do mapa
  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(mapZoom);
    if (currentIndex === -1) {
      // Se o zoom atual não está na lista, encontra o próximo valor maior
      const nextZoom = ZOOM_LEVELS.find(level => level > mapZoom);
      if (nextZoom) {
        setMapZoom(nextZoom);
      } else {
        // Se não há próximo maior, vai para o máximo
        setMapZoom(ZOOM_LEVELS[ZOOM_LEVELS.length - 1]);
      }
    } else if (currentIndex < ZOOM_LEVELS.length - 1) {
      setMapZoom(ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(mapZoom);
    if (currentIndex === -1) {
      // Se o zoom atual não está na lista, encontra o próximo valor menor
      const prevZoom = ZOOM_LEVELS.slice().reverse().find(level => level < mapZoom);
      if (prevZoom) {
        setMapZoom(prevZoom);
      } else {
        // Se não há próximo menor, vai para o mínimo
        setMapZoom(ZOOM_LEVELS[0]);
      }
    } else if (currentIndex > 0) {
      setMapZoom(ZOOM_LEVELS[currentIndex - 1]);
    }
  };

  // Handler para aceitar corrida via WebSocket (conforme WebSocket_cliente.txt)
  const handleAcceptTrip = () => {
    if (!pendingTrip) return;

    // Verifica se WebSocket está conectado
    if (!websocketService.getIsConnected()) {
      Alert.alert(
        'Erro de Conexão',
        'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.'
      );
      return;
    }

    console.log('[DriverHome] Enviando aceite de corrida via WebSocket:', pendingTrip.trip_id);
    
    // Envia resposta via WebSocket conforme documentação WebSocket_cliente.txt
    // Formato: { "type": "ride_response", "rideId": "...", "action": "accept" }
    websocketService.respondToRideOffer(pendingTrip.trip_id, 'accept');
    
    // A confirmação será recebida via WebSocket (mensagem tipo "ride_accepted")
    // O estado será atualizado automaticamente pelo handler de mensagens WebSocket
    // Não precisa fazer nada mais aqui - o modal será fechado quando receber a confirmação
  };

  const handleRejectTrip = () => {
    console.log('[DriverHome] Recusando corrida:', pendingTrip?.trip_id);
    
    const tripIdToReject = pendingTrip?.trip_id;
    
    // Limpa o estado primeiro para evitar que novas mensagens sejam processadas
    setShowTripRequest(false);
    setPendingTrip(null);
    setPassengerLocation(null);
    
    // Rejeita via WebSocket se conectado
    if (tripIdToReject && websocketService.getIsConnected()) {
      console.log('[DriverHome] Enviando recusa via WebSocket para rideId:', tripIdToReject);
      websocketService.respondToRideOffer(tripIdToReject, 'reject');
    } else {
      console.warn('[DriverHome] WebSocket não conectado ou sem pendingTrip, não é possível enviar recusa via WebSocket');
    }
  };

  const handleOfferTimeout = () => {
    if (!pendingTrip) return;
    const tripId = pendingTrip.trip_id;
    console.log('[DriverHome] Oferta expirada (via modal), fechando e notificando backend', { tripId });
    setShowTripRequest(false);
    setPendingTrip(null);
    setPassengerLocation(null);
    try {
      websocketService.respondToRideOffer(tripId, 'reject');
    } catch (err) {
      console.error('[DriverHome] Erro ao enviar reject após timeout:', err);
    }
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    statusBarBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: insets.top,
      backgroundColor: colors.background,
      zIndex: 15,
    },
    mapContainer: {
      flex: 1,
    },
    statusCard: {
      position: 'absolute',
      top: insets.top + spacing.sm,
      left: spacing.md,
      right: spacing.md,
      zIndex: 10,
      borderRadius: 16,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    statusContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    statusIndicator: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: isAvailable ? '#34C759' : colors.textSecondary,
      marginRight: spacing.sm,
    },
    statusText: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    statusSubtext: {
      ...typography.caption,
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      fontFamily: 'Poppins-Regular',
    },
    locationFab: {
      position: 'absolute',
      right: spacing.md,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.medium,
      shadowColor: colors.shadow,
      borderWidth: 1,
      borderColor: colors.border,
    },
    zoomFab: {
      position: 'absolute',
      right: spacing.md,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.medium,
      shadowColor: colors.shadow,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoCard: {
      position: 'absolute',
      bottom: 8, // Mesma distância do container do passageiro
      left: spacing.md,
      right: spacing.md,
      zIndex: 10,
    },
    infoContent: {
      gap: spacing.md,
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    infoIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: hexToRgba(colors.primary, 0.15),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: hexToRgba(colors.primary, 0.2),
    },
    infoText: {
      flex: 1,
    },
    infoTitle: {
      ...typography.body,
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
      fontFamily: 'Poppins-Bold',
    },
    infoSubtitle: {
      ...typography.caption,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      fontFamily: 'Poppins-Regular',
    },
    infoButton: {
      marginTop: spacing.sm,
    },
    notificationContainer: {
      position: 'absolute',
      bottom: spacing.xl + insets.bottom + 70,
      right: spacing.md,
      left: spacing.md,
      zIndex: 10,
      maxWidth: 280,
      alignSelf: 'flex-end',
    },
    notificationCard: {
      padding: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.status.error,
    },
    notificationText: {
      ...typography.caption,
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    notificationCardWarning: {
      backgroundColor: colors.status.warning,
    },
    validationWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: hexToRgba(colors.status.warning, 0.1),
      borderRadius: 8,
      paddingVertical: spacing.sm,
    },
    validationWarningText: {
      ...typography.caption,
      fontSize: 12,
      color: colors.status.warning,
      flex: 1,
      fontFamily: 'Poppins-Medium',
    },
    billingFab: {
      position: 'absolute',
      right: spacing.md,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.medium,
      shadowColor: colors.shadow,
      borderWidth: 1,
      borderColor: colors.border,
    },
    checkingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingTop: insets.top + spacing.md,
      paddingBottom: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba(colors.background, 0.92),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    checkingOverlayText: {
      ...typography.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      {/* Faixa de background que cobre a barra de status */}
      <View style={styles.statusBarBackground} />
      
      <View style={styles.mapContainer}>
        <TileMap
          ref={mapRef}
          showRoute={false}
          centerLat={mapCenter.lat}
          centerLon={mapCenter.lon}
          zoom={mapZoom}
          userLocation={currentLocation || undefined}
          passengerLocation={passengerLocation ? { lat: passengerLocation.lat, lon: passengerLocation.lng } : undefined}
          drivers={nearbyDrivers}
          onMapMove={handleMapMove}
          isDriver={true}
          bottomContainerHeight={0}
          topSpaceHeight={0}
          isLocating={false}
          verticalCenterRatio={0.5}
        />
      </View>

      {/* Card de Status e Disponibilidade */}
      <Card 
        style={styles.statusCard}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setStatusCardHeight(height);
        }}
      >
        <View style={styles.statusContent}>
          <View style={styles.statusLeft}>
            <View style={styles.statusIndicator} />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusText}>
                {isAvailable ? 'Disponível para corridas' : 'Indisponível'}
              </Text>
              {/* Mostra "Conectando com o servidor..." quando está processando */}
              {isConnecting && (
                <Text style={styles.statusSubtext}>
                  Conectando com o servidor...
                </Text>
              )}
              {/* Mostra status normal quando não está conectando */}
              {!isConnecting && isAvailable && (
                <Text style={styles.statusSubtext}>
                  {isAvailabilityRateLimited
                    ? 'Aguardando 1 minuto para enviar requisição...'
                    : isRateLimited 
                      ? 'Aguardando antes de continuar...' 
                      : isUpdatingLocation 
                        ? 'Atualizando localização...' 
                        : 'Pronto para receber corridas'}
                </Text>
              )}
              {!isConnecting && !isAvailable && isAvailabilityRateLimited && (
                <Text style={styles.statusSubtext}>
                  Aguardando 1 minuto para enviar requisição...
                </Text>
              )}
            </View>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={handleToggleAvailability}
            trackColor={{ false: colors.border, true: hexToRgba(colors.primary, 0.3) }}
            thumbColor={isAvailable ? colors.primary : colors.textSecondary}
            disabled={isLoadingStatus || !isDriverEligible() || isConnecting}
          />
        </View>
        {/* Aviso de motorista não apto */}
        {!isDriverEligible() && (
          <View style={styles.validationWarning}>
            <Ionicons name="alert-circle" size={20} color={colors.status.warning} />
            <Text style={styles.validationWarningText}>
              {getEligibilityMessage()}
            </Text>
          </View>
        )}
        {/* Aviso de documentos pendentes (só mostra se estiver apto mas com documentos pendentes) */}
        {isDriverEligible() && hasPendingDocuments() && (
          <View style={styles.validationWarning}>
            <Ionicons name="warning-outline" size={16} color={colors.status.warning} />
            <Text style={styles.validationWarningText}>
              {getValidationWarningMessage() || 'Documentos pendentes de aprovação'}
            </Text>
          </View>
        )}
      </Card>

      {/* Card informativo melhorado - Indisponível */}
      {!isAvailable && (
        <Card 
          style={styles.infoCard}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setInfoCardHeight(height);
          }}
        >
          <View style={styles.infoContent}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIcon}>
                <Ionicons name="car-outline" size={32} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Você está indisponível</Text>
                <Text style={styles.infoSubtitle}>
                  Ative o modo disponível para começar a receber corridas e ganhar dinheiro. Sua localização será compartilhada quando você estiver online.
                </Text>
              </View>
            </View>
            <Button
              title={isConnecting ? "Conectando..." : "Ativar Disponibilidade"}
              onPress={() => handleToggleAvailability(true)}
              variant="primary"
              fullWidth
              style={styles.infoButton}
              disabled={isConnecting || isLoadingStatus || !isDriverEligible()}
            />
          </View>
        </Card>
      )}

      {/* Botão de Pagamentos (Billing) */}
      <TouchableOpacity
        style={[
          styles.billingFab,
          {
            top: insets.top + spacing.sm + statusCardHeight + spacing.sm,
          },
        ]}
        onPress={() => navigation.navigate('DriverBilling')}
        activeOpacity={0.8}
      >
        <Ionicons name="cash-outline" size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* Botões de zoom do mapa */}
      <TouchableOpacity
        style={[
          styles.zoomFab,
          {
            bottom: !isAvailable ? 8 + infoCardHeight + 12 + 64 : 8 + 12 + 64,
          },
        ]}
        onPress={handleZoomIn}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.zoomFab,
          {
            bottom: !isAvailable ? 8 + infoCardHeight + 12 + 128 : 8 + 12 + 128,
          },
        ]}
        onPress={handleZoomOut}
        activeOpacity={0.8}
      >
        <Ionicons name="remove" size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* Botão de recentralizar */}
      <TouchableOpacity
        style={[
          styles.locationFab,
          {
            bottom: !isAvailable ? 8 + infoCardHeight + 12 : 8 + 12,
          },
        ]}
        onPress={handleRecenterLocation}
        activeOpacity={0.8}
      >
        <Ionicons name="location-outline" size={24} color="#34C759" />
      </TouchableOpacity>

      {/* Notificações abaixo do botão de localização */}
      {(locationError || apiError) && (
        <View style={styles.notificationContainer}>
          <Card style={{
            ...styles.notificationCard,
            ...(locationError ? styles.notificationCardWarning : {}),
            ...(apiError ? { backgroundColor: colors.status.error } : {}),
          }}>
            <Text style={styles.notificationText}>
              {locationError || apiError}
            </Text>
          </Card>
        </View>
      )}

      {/* Modal de Solicitação de Corrida */}
      <DriverTripRequestScreen
        visible={showTripRequest}
        tripData={pendingTrip}
        onAccept={handleAcceptTrip}
        onReject={handleRejectTrip}
        onTimeout={handleOfferTimeout}
      />

      {isCheckingActiveRide && (
        <View style={styles.checkingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.checkingOverlayText}>Verificando corridas ativas...</Text>
        </View>
      )}

    </View>
  );
};

