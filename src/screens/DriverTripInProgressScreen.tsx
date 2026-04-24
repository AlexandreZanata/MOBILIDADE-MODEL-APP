import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import { Avatar } from '@/components/atoms/Avatar';
import { TileMap, TileMapRef, RoutePoint } from '@/components/molecules/TileMap';
import { spacing, typography, shadows } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { websocketService } from '@/services/websocketService';
import { reverseGeocode } from '@/services/placesService';
import { ChatWindow } from '@/components/organisms/ChatWindow';
import { useChat } from '@/context/ChatContext';
import {
  startDriverBackgroundLocation,
  stopDriverBackgroundLocation,
} from '@/services/backgroundLocationService';

interface DriverTripInProgressScreenProps {
  navigation: any;
  route: {
    params?: {
      tripId?: string;
      tripData?: any;
    };
  };
}

const SORRISO_LAT = -12.5458;
const SORRISO_LON = -55.7061;

export const DriverTripInProgressScreen: React.FC<DriverTripInProgressScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { openChat, closeChat, isChatOpen, currentRideId, chatState, updateRideStatus } = useChat();
  const [validatedRideId, setValidatedRideId] = useState<string | null>(null); // ID validado pela API
  const [tripData, setTripData] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: SORRISO_LAT, lon: SORRISO_LON });
  const [hasUserMovedMap, setHasUserMovedMap] = useState(false);
  const [cardHeight, setCardHeight] = useState(220);
  const [mapZoom, setMapZoom] = useState(16); // Zoom padrão
  const [isMinimized, setIsMinimized] = useState(false);
  const [topBarHeight, setTopBarHeight] = useState(0); // Altura da barra superior
  // Removido showChegueiOverlay - botão "Cheguei" não será mais usado
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [hasUserClickedStar, setHasUserClickedStar] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('Cancelado pelo motorista');
  const mapRef = useRef<TileMapRef>(null);
  
  // Valores de zoom predefinidos
  const ZOOM_LEVELS = [12, 14, 16, 18, 20];
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  
  // Localizações
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [passengerLocation, setPassengerLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{ lat: number; lon: number } | null>(null);
  
  // Endereços (nomes dos locais)
  const [originAddress, setOriginAddress] = useState<string>('');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  
  // Dados do passageiro
  const [passengerInfo, setPassengerInfo] = useState<{
    id?: string;
    name?: string;
    phone?: string;
    photoUrl?: string;
  } | null>(null);
  
  // Refs para intervalos
  const locationUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoCenteredRef = useRef(false); // Flag para centralizar apenas uma vez
  const tripId = route?.params?.tripId;
  const rideId = validatedRideId || tripId || tripData?.id || null; // Usa o validado como prioridade

  const normalizeRatingValue = (value?: number | null) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!parsed || Number.isNaN(parsed)) return 5;
    return Math.min(5, Math.max(1, Math.round(parsed)));
  };

  const getRatingLabel = (value: number) => {
    const normalized = normalizeRatingValue(value);
    if (normalized >= 5) return 'Excelente';
    if (normalized >= 4) return 'Muito bom';
    if (normalized >= 3) return 'Boa';
    if (normalized >= 2) return 'Regular';
    return 'Ruim';
  };

  useEffect(() => {
    if (ratingModalVisible) {
      setRatingValue((prev) => normalizeRatingValue(prev));
      setHasUserClickedStar(false); // Reset quando o modal abrir
    } else {
      setRatingComment('');
      setHasUserClickedStar(false);
    }
  }, [ratingModalVisible]);

  useEffect(() => {
    if (rideId) {
      setCancelReason('Cancelado pelo motorista');
    }
  }, [rideId]);

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Gerar rota do motorista até o passageiro usando a nova API de roteamento
  const generateRouteFromDriverToPassenger = async (
    driverPos: { lat: number; lon: number },
    passengerPos: { lat: number; lon: number }
  ) => {
    // Valida coordenadas antes de chamar a API
    if (!driverPos || !passengerPos || 
        !driverPos.lat || !driverPos.lon || 
        !passengerPos.lat || !passengerPos.lon ||
        driverPos.lat === 0 && driverPos.lon === 0 ||
        passengerPos.lat === 0 && passengerPos.lon === 0) {
      console.warn('[DriverTrip] Coordenadas inválidas para gerar rota:', { driverPos, passengerPos });
      return [];
    }

    try {
      const { routingService } = await import('@/services/routingService');
      const response = await routingService.calculateRouteAsPoints(driverPos, passengerPos);

      if (response.success && response.data) {
        setRoutePoints(response.data);
        return response.data;
      } else {
        // Não loga como erro se for apenas distância muito pequena (comportamento esperado)
        if (response.error?.includes('muito próximo') || response.error?.includes('muito pequena')) {
          if (__DEV__) {
            console.log('[DriverTrip] Distância muito pequena, não calculando rota:', response.error);
          }
        } else {
          console.error('[DriverTrip] Erro ao calcular rota:', response.error);
        }
      }
    } catch (error) {
      console.error('[DriverTrip] Erro ao gerar rota:', error);
    }
    return [];
  };

  // Carregar dados da corrida
  useEffect(() => {
    // Busca a corrida ativa do motorista na API para validar o ID
    const fetchActiveRide = async () => {
      try {
        console.log('[DriverTrip] Buscando corrida ativa do motorista...');
        const response = await apiService.getDriverActiveRide();
        if (response.success && response.data) {
          console.log('[DriverTrip] Corrida ativa encontrada:', response.data.id);
          setValidatedRideId(response.data.id);
          
          // Se não tiver tripData via params, usa o da API
          if (!tripData && !route?.params?.tripData) {
            setTripData(response.data);
            const initialStatus = response.data.status || 'DRIVER_ASSIGNED';
            setCurrentStatus(initialStatus);
            updateRideStatus(initialStatus);
            
            // Extrai dados do passageiro da resposta da API
            if (response.data.passenger) {
              setPassengerInfo({
                id: response.data.passenger.id || response.data.passenger.userId,
                name: response.data.passenger.name,
                phone: response.data.passenger.phone,
                photoUrl: response.data.passenger.photoUrl,
              });
            }
          }
        }
      } catch (error) {
        console.error('[DriverTrip] Erro ao buscar corrida ativa:', error);
      }
    };

    fetchActiveRide();

    if (tripId) {
      loadTripData();
    }
  }, [tripId]);

  const handleChatToggle = () => {
    if (!rideId) {
      Alert.alert('Chat indisponível', 'Nenhuma corrida ativa foi encontrada.');
      return;
    }

    if (isChatOpen && currentRideId === rideId) {
      closeChat();
      return;
    }

    // Abre o chat com informações do passageiro e status da corrida
    openChat(
      rideId,
      passengerInfo?.name || 'Passageiro',
      passengerInfo?.photoUrl,
      currentStatus || tripData?.status, // Passa o status da corrida
      passengerInfo?.id
    );
  };

  const loadTripData = async () => {
    if (!tripId) return;

    setIsLoading(true);
    try {
      if (route?.params?.tripData) {
        const data = route.params.tripData;
        setTripData(data);
        const initialStatus = data.status || 'DRIVER_ASSIGNED';
        setCurrentStatus(initialStatus);
        updateRideStatus(initialStatus); // Atualiza status no ChatContext
        
        // Extrai dados do passageiro
        if (data.passenger) {
          setPassengerInfo({
            id: data.passenger.id || data.passenger.userId,
            name: data.passenger.name,
            phone: data.passenger.phone,
            photoUrl: data.passenger.photoUrl,
          });
        } else if (data.passengerId) {
          // Se só tem o ID, usa para buscar a foto
          setPassengerInfo({
            id: data.passengerId,
            name: data.passengerName || 'Passageiro',
          });
        }
        
        // Configura localizações
        if (data.origin) {
          const origin = { lat: data.origin.lat, lon: data.origin.lng || data.origin.lon };
          setPassengerLocation(origin);
          
          // Busca nome do endereço
          const originAddr = await reverseGeocode(origin.lat, origin.lon);
          if (originAddr) {
            setOriginAddress(originAddr.display_name || originAddr.name || '');
          }
        }
        
        if (data.destination) {
          const dest = { lat: data.destination.lat, lon: data.destination.lng || data.destination.lon };
          setDestinationLocation(dest);
          
          // Busca nome do endereço
          const destAddr = await reverseGeocode(dest.lat, dest.lon);
          if (destAddr) {
            setDestinationAddress(destAddr.display_name || destAddr.name || '');
          }
        }
        
        // Centraliza na origem (passageiro) inicialmente, se disponível
        if (data.origin) {
          const origin = { lat: data.origin.lat, lon: data.origin.lng || data.origin.lon };
          setMapCenter(origin);
          if (mapRef.current) {
            mapRef.current.centerOnLocation(origin.lat, origin.lon);
          }
        } else if (data.destination) {
          const dest = { lat: data.destination.lat, lon: data.destination.lng || data.destination.lon };
          setMapCenter(dest);
          if (mapRef.current) {
            mapRef.current.centerOnLocation(dest.lat, dest.lon);
          }
        }
      }
    } catch (error) {
      console.error('[DriverTrip] Erro ao carregar corrida:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Obter localização do motorista
  const getDriverLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        lat: location.coords.latitude,
        lon: location.coords.longitude,
      };

      setDriverLocation(newLocation);
      
      // Envia localização via WebSocket apenas se estiver conectado
      if (websocketService.getIsConnected()) {
        websocketService.sendLocationUpdate({
          type: 'location_update',
          lat: newLocation.lat,
          lng: newLocation.lon,
          heading: location.coords.heading !== null && location.coords.heading !== undefined
            ? location.coords.heading
            : undefined,
          speed: location.coords.speed !== null && location.coords.speed !== undefined
            ? location.coords.speed * 3.6
            : undefined,
        });
      } else {
        console.warn('[DriverTrip] WebSocket não conectado, não é possível enviar localização');
      }

      // Gera rota se tiver localização do passageiro
      if (passengerLocation) {
        await generateRouteFromDriverToPassenger(newLocation, passengerLocation);
      }
    } catch (error) {
      console.error('[DriverTrip] Erro ao obter localização do motorista:', error);
    }
  };

  const getCurrentLatLng = async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Ative a localização para continuar.');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch (error) {
      console.error('[DriverTrip] Erro ao obter localização atual:', error);
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
      return null;
    }
  };

  // Inicia atualizações de localização do motorista
  const startDriverLocationUpdates = () => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
    }

    // Obtém localização imediatamente
    getDriverLocation();

    // Atualiza a cada 3 segundos
    locationUpdateIntervalRef.current = setInterval(() => {
      getDriverLocation();
    }, 3000);
  };

  // Para atualizações de localização
  const stopDriverLocationUpdates = () => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }
  };

  // Flag para evitar múltiplos intervalos
  const isLocationUpdateActiveRef = useRef(false);

  // Conecta ao WebSocket para receber localização do passageiro
  useEffect(() => {
    if (!tripId) return;

    // Evita criar múltiplos intervalos
    if (isLocationUpdateActiveRef.current) {
      return;
    }

    // Garante que o WebSocket está conectado
    const ensureWebSocketConnected = async () => {
      if (!websocketService.getIsConnected()) {
        console.log('[DriverTrip] WebSocket não conectado, tentando conectar...');
        const connected = await websocketService.connect();
        if (connected) {
          console.log('[DriverTrip] WebSocket conectado com sucesso');
        } else {
          console.error('[DriverTrip] Falha ao conectar WebSocket');
        }
      }
    };

    ensureWebSocketConnected();

    // Configura callback para receber localização do passageiro
    const handleWebSocketMessage = (message: any) => {
      if (message.type === 'passenger_location' && message.rideId === tripId) {
        const newPassengerLocation = {
          lat: message.lat,
          lon: message.lng || message.lon,
        };
        setPassengerLocation(newPassengerLocation);
        
        // Gera rota se tiver localização do motorista e coordenadas válidas
        if (driverLocation && newPassengerLocation.lat !== 0 && newPassengerLocation.lon !== 0) {
          generateRouteFromDriverToPassenger(driverLocation, newPassengerLocation);
        }
      }
    };

    // Usa setOnMessage que adiciona o callback à lista
    websocketService.setOnMessage(handleWebSocketMessage);

    // Inicia atualizações de localização do motorista apenas uma vez
    if (!isLocationUpdateActiveRef.current) {
      isLocationUpdateActiveRef.current = true;
      startDriverLocationUpdates();
      
      // Inicia background location tracking para continuar enviando localização em segundo plano
      startDriverBackgroundLocation().catch((error) => {
        console.error('[DriverTrip] Erro ao iniciar background location:', error);
        // Continua com atualizações normais mesmo se background location falhar
      });
    }

    return () => {
      websocketService.removeOnMessage(handleWebSocketMessage);
      stopDriverLocationUpdates();
      isLocationUpdateActiveRef.current = false;
      
      // Para background location quando sai da tela
      stopDriverBackgroundLocation().catch((error) => {
        console.error('[DriverTrip] Erro ao parar background location:', error);
      });
    };
  }, [tripId]);

  // Gera rota quando ambas as localizações estiverem disponíveis
  useEffect(() => {
    if (driverLocation && passengerLocation && 
        driverLocation.lat !== 0 && driverLocation.lon !== 0 &&
        passengerLocation.lat !== 0 && passengerLocation.lon !== 0) {
      generateRouteFromDriverToPassenger(driverLocation, passengerLocation);
    }
  }, [driverLocation, passengerLocation]);

  // Limpa intervalos quando sai da tela
  useFocusEffect(
    React.useCallback(() => {
      // Reset do flag de auto-centralização quando a tela recebe foco novamente
      // Isso garante que se o usuário sair e voltar, centraliza novamente
      hasAutoCenteredRef.current = false;
      
      return () => {
        stopDriverLocationUpdates();
      };
    }, [])
  );

  // Centraliza automaticamente quando obtém a primeira localização do motorista
  useEffect(() => {
    if (driverLocation && !hasAutoCenteredRef.current && mapRef.current) {
      hasAutoCenteredRef.current = true;
      setMapCenter(driverLocation);
      // Usa um pequeno delay para garantir que o mapa está renderizado
      const timer = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.centerOnLocation(driverLocation.lat, driverLocation.lon);
        }
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [driverLocation]);

  const handleMapMove = () => {
    setHasUserMovedMap(true);
  };

  const handleRecenterLocation = () => {
    if (driverLocation) {
      setMapCenter(driverLocation);
      if (mapRef.current) {
        mapRef.current.centerOnLocation(driverLocation.lat, driverLocation.lon);
      }
      setHasUserMovedMap(false);
    } else {
      // Se não tem localização ainda, tenta obter
      getDriverLocation();
    }
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

  const getDistanceMeters = (
    a?: { lat: number; lon?: number; lng?: number },
    b?: { lat: number; lon?: number; lng?: number }
  ): number | null => {
    if (!a || !b || !a.lat || !b.lat) return null;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const lat1 = a.lat;
    const lon1 = (a.lon ?? (a as any).lng) as number;
    const lat2 = b.lat;
    const lon2 = (b.lon ?? (b as any).lng) as number;
    if (!lon1 || !lon2) return null;
    const R = 6371000; // m
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const rlat1 = toRad(lat1);
    const rlat2 = toRad(lat2);
    const aHarv =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rlat1) * Math.cos(rlat2);
    const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1 - aHarv));
    return R * c;
  };

  const updateLocalStatus = (status: string) => {
    setCurrentStatus(status);
    updateRideStatus(status);
  };

  const callStatusEndpoint = async (action: string) => {
    let response: any;
    let nextStatus = action;

    switch (action) {
      case 'DRIVER_ON_THE_WAY': {
        response = await apiService.driverRideOnTheWay(tripId!);
        nextStatus = 'DRIVER_ON_THE_WAY';
        break;
      }

      case 'DRIVER_NEARBY': {
        const coords = await getCurrentLatLng();
        if (!coords) return null;
        response = await apiService.driverRideNearby(tripId!, coords.lat, coords.lng);
        nextStatus = 'DRIVER_NEARBY';
        break;
      }

      case 'DRIVER_ARRIVED': {
        const coords = await getCurrentLatLng();
        if (!coords) return null;
        response = await apiService.driverRideArrived(tripId!, coords.lat, coords.lng);
        nextStatus = 'DRIVER_ARRIVED';
        break;
      }

      case 'PASSENGER_BOARDED': {
        response = await apiService.driverRideBoarded(tripId!);
        nextStatus = 'PASSENGER_BOARDED';
        break;
      }

      case 'IN_PROGRESS':
      case 'IN_ROUTE': {
        response = await apiService.driverRideInRoute(tripId!);
        nextStatus = 'IN_ROUTE';
        break;
      }

      case 'WAITING_AT_DESTINATION':
      case 'NEAR_DESTINATION': {
        const coords = await getCurrentLatLng();
        if (!coords) return null;
        response = await apiService.driverRideNearDestination(tripId!, coords.lat, coords.lng);
        nextStatus = 'NEAR_DESTINATION';
        break;
      }

      case 'COMPLETED': {
        const finalPrice =
          tripData?.final_fare ??
          tripData?.finalPrice ??
          tripData?.estimated_fare ??
          tripData?.estimatedPrice ??
          0;
        response = await apiService.driverRideComplete(tripId!, finalPrice);
        nextStatus = 'COMPLETED';
        break;
      }

      default:
        Alert.alert('Erro', 'Status não reconhecido');
        return null;
    }

    return { response, nextStatus };
  };

  const ensureProximityStatuses = async (distanceMeters: number | null) => {
    const upper = (currentStatus || tripData?.status || '').toUpperCase();
    if (distanceMeters === null) return false;

    // Se já está perto do passageiro (<=500m) mas status ainda é ACEITOU, envia cadeia automática
    if (
      distanceMeters <= 500 &&
      ['DRIVER_ASSIGNED', 'MOTORISTA_ACEITOU', 'DRIVER_FOUND', 'ACCEPTED'].includes(upper)
    ) {
      const onTheWay = await callStatusEndpoint('DRIVER_ON_THE_WAY');
      if (onTheWay?.response?.success || onTheWay?.response?.status === 204) {
        updateLocalStatus(onTheWay.nextStatus);
      }

      const nearby = await callStatusEndpoint('DRIVER_NEARBY');
      if (nearby?.response?.success || nearby?.response?.status === 204) {
        updateLocalStatus(nearby.nextStatus);
      }
    }

    if (distanceMeters <= 100) {
      const arrived = await callStatusEndpoint('DRIVER_ARRIVED');
      if (arrived?.response?.success || arrived?.response?.status === 204) {
        updateLocalStatus(arrived.nextStatus);
        return true;
      }
    }

    return false;
  };

  const handleStatusUpdate = async (action: string) => {
    if (!tripId || isUpdating) return;

    setIsUpdating(true);
    try {
      // Calcula distância atual para decisões automáticas
      const driverCoords =
        driverLocation && driverLocation.lat && driverLocation.lon
          ? { lat: driverLocation.lat, lon: driverLocation.lon }
          : await getCurrentLatLng();
      const passengerCoords =
        passengerLocation && passengerLocation.lat
          ? { lat: passengerLocation.lat, lon: passengerLocation.lon }
          : null;
      const distanceMeters = getDistanceMeters(driverCoords as any, passengerCoords as any);

      // Se pediu "cheguei" mas status ainda está antes e já estamos perto, envia cadeia automática
      if (action === 'DRIVER_ARRIVED') {
        const autoArrived = await ensureProximityStatuses(distanceMeters);
        if (autoArrived) {
          setIsUpdating(false);
          return;
        }
      }

      const result = await callStatusEndpoint(action);
      if (!result) {
        setIsUpdating(false);
        return;
      }

      const { response, nextStatus } = result;

      if (response?.success || response?.status === 204) {
        updateLocalStatus(nextStatus);

        if (nextStatus === 'COMPLETED') {
          try {
            await AsyncStorage.removeItem('@vamu:active_trip_id');
            await AsyncStorage.removeItem('@vamu:active_trip_data');
            console.log('[DriverTrip] Trip removida do AsyncStorage após finalização');
          } catch (error) {
            console.error('[DriverTrip] Erro ao remover trip do AsyncStorage:', error);
          }

          setRatingModalVisible(true);
        }
      } else {
        Alert.alert('Erro', response?.message || 'Não foi possível atualizar o status');
      }
    } catch (error: any) {
      console.error('[DriverTrip] Erro ao atualizar status:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível atualizar o status. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Cancela a corrida usando a rota específica do motorista (requer motivo)
  const handleDriverCancelRide = async (reason: string = 'Cancelado pelo motorista') => {
    if (!tripId) {
      Alert.alert('Erro', 'ID da corrida não encontrado.');
      return;
    }
    setIsUpdating(true);
    try {
      const response = await apiService.driverRideCancel(tripId, reason || 'Cancelado pelo motorista');
      if (response.success || response.status === 204) {
        // Remove dados da corrida do AsyncStorage
        await AsyncStorage.removeItem('@vamu:active_trip_id');
        await AsyncStorage.removeItem('@vamu:active_trip_data');
        
        // Define o motorista como AVAILABLE automaticamente após cancelar
        try {
          console.log('[DriverTrip] Cancelando corrida - definindo motorista como AVAILABLE...');
          const availabilityResponse = await apiService.updateDriverOperationalStatus('AVAILABLE');
          if (availabilityResponse.success) {
            console.log('[DriverTrip] Motorista definido como AVAILABLE com sucesso');
          } else {
            console.warn('[DriverTrip] Não foi possível definir motorista como AVAILABLE:', availabilityResponse.message);
            // Não mostra erro para o usuário, apenas log
          }
        } catch (availabilityError) {
          console.error('[DriverTrip] Erro ao definir motorista como AVAILABLE:', availabilityError);
          // Não mostra erro para o usuário, apenas log
        }
        
        Alert.alert('Corrida cancelada', 'A corrida foi cancelada com sucesso. Você está disponível para receber novas corridas.', [
          { 
            text: 'OK', 
            onPress: () => {
              // Navega para a tela inicial do motorista dentro do Tab Navigator
              navigation.navigate('Main', { screen: 'DriverHome' });
            }
          },
        ]);
      } else {
        Alert.alert('Erro', response.message || response.error || 'Erro ao cancelar corrida');
      }
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Erro ao cancelar corrida');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!rideId) {
      Alert.alert('Erro', 'ID da corrida não encontrado.');
      return;
    }

    // Valida se a corrida está finalizada
    const currentStatusUpper = (currentStatus || tripData?.status || '').toUpperCase();
    const completedStatuses = ['COMPLETED', 'CORRIDA_FINALIZADA', 'CONCLUIDA'];
    
    if (!completedStatuses.includes(currentStatusUpper)) {
      Alert.alert(
        'Avaliação não disponível',
        'A avaliação só pode ser enviada após a corrida ser finalizada.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Se o usuário não clicou em nenhuma estrela, usar 5 (valor default)
    // Se clicou, usar o valor clicado (1-5)
    const finalRating = hasUserClickedStar ? normalizeRatingValue(ratingValue) : 5;
    const sanitizedComment = ratingComment?.trim?.() ?? '';

    console.log('[DriverTrip] 📝 Iniciando envio de avaliação do passageiro');
    console.log('[DriverTrip] 📝 Status atual da corrida:', currentStatusUpper);
    console.log('[DriverTrip] 📝 RideId:', rideId);
    console.log('[DriverTrip] 📝 Rating (escala 1-5):', finalRating);
    console.log('[DriverTrip] 📝 Usuário clicou em estrela:', hasUserClickedStar);
    console.log('[DriverTrip] 📝 Comment:', sanitizedComment || '(sem comentário)');

    setIsSubmittingRating(true);
    try {
      const response = await apiService.driverRideRate(
        rideId,
        finalRating,
        sanitizedComment || undefined
      );

      console.log('[DriverTrip] 📝 Resposta da API:', {
        success: response.success,
        status: response.status,
        message: response.message,
        error: response.error,
      });

      if (response.success || response.status === 204) {
        setRatingModalVisible(false);
        setRatingComment('');
        setRatingValue(5);
        setHasUserClickedStar(false);
        try {
          console.log('[DriverTrip] Pós-avaliação: definindo motorista como AVAILABLE para novas corridas');
          const availabilityResponse = await apiService.updateDriverOperationalStatus('AVAILABLE');
          if (!availabilityResponse.success) {
            console.warn('[DriverTrip] Não foi possível definir AVAILABLE após avaliação:', availabilityResponse.message);
          }
        } catch (err) {
          console.error('[DriverTrip] Erro ao definir AVAILABLE após avaliação:', err);
        }

        Alert.alert('Obrigado', 'Avaliação enviada com sucesso.', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main', { screen: 'DriverHome' }),
          },
        ]);
      } else {
        const errorMessage = response?.message || response?.error || 'Não foi possível enviar a avaliação.';
        console.error('[DriverTrip] ❌ Erro ao enviar avaliação:', errorMessage);
        Alert.alert('Erro', errorMessage);
      }
    } catch (error: any) {
      console.error('[DriverTrip] ❌ Exceção ao enviar avaliação:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      Alert.alert('Erro', error?.message || 'Não foi possível enviar a avaliação.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const getStatusButton = () => {
    const status = (currentStatus || tripData?.status || '').toUpperCase();

    if (['DRIVER_ASSIGNED', 'MOTORISTA_ACEITOU', 'DRIVER_FOUND', 'ACCEPTED'].includes(status)) {
      return { title: 'Estou a caminho', status: 'DRIVER_ON_THE_WAY', variant: 'primary' as const };
    }

    if (['DRIVER_ON_THE_WAY', 'DRIVER_ARRIVING', 'MOTORISTA_A_CAMINHO'].includes(status)) {
      return { title: 'Estou próximo (≤500m)', status: 'DRIVER_NEARBY', variant: 'primary' as const };
    }

    if (['DRIVER_NEARBY', 'MOTORISTA_PROXIMO'].includes(status)) {
      return { title: 'Cheguei', status: 'DRIVER_ARRIVED', variant: 'primary' as const };
    }

    if (['DRIVER_ARRIVED', 'MOTORISTA_CHEGOU'].includes(status)) {
      return { title: 'Passageiro embarcou', status: 'PASSENGER_BOARDED', variant: 'primary' as const };
    }

    if (['PASSENGER_BOARDED', 'IN_PROGRESS', 'PASSAGEIRO_EMBARCADO'].includes(status)) {
      return { title: 'Iniciar rota', status: 'IN_ROUTE', variant: 'primary' as const };
    }

    if (['IN_ROUTE', 'EM_ROTA'].includes(status)) {
      return { title: 'Próximo ao destino (≤500m)', status: 'NEAR_DESTINATION', variant: 'primary' as const };
    }

    if (['NEAR_DESTINATION', 'PROXIMO_DESTINO', 'WAITING_AT_DESTINATION'].includes(status)) {
      return { title: 'Finalizar Corrida', status: 'COMPLETED', variant: 'secondary' as const };
    }

    return null;
  };

  // Cancela permitido somente antes do embarque
  const statusUpper = (currentStatus || tripData?.status || '').toUpperCase();
  const cancelLockedStatuses = [
    'PASSENGER_BOARDED',
    'PASSAGEIRO_EMBARCADO',
    'IN_PROGRESS',
    'IN_ROUTE',
    'EM_ROTA',
    'NEAR_DESTINATION',
    'PROXIMO_DESTINO',
    'WAITING_AT_DESTINATION',
    'COMPLETED',
    'CORRIDA_FINALIZADA',
    'CONCLUIDA',
  ];
  const canCancelRide = !cancelLockedStatuses.includes(statusUpper || '');

  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    mapContainer: {
      flex: 1,
    },
    topSafeArea: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: Math.max(insets.top, 0),
      backgroundColor: colors.background,
      zIndex: 10,
    },
    topBarContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      backgroundColor: colors.background,
      paddingTop: Math.max(insets.top, spacing.md),
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      ...shadows.medium,
      shadowColor: colors.shadow,
    },
    topBar: {
      gap: spacing.sm,
    },
    topBarDestinationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    topBarDestinationIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: hexToRgba(colors.primary, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
    },
    topBarDestinationText: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      fontSize: 14,
      fontFamily: 'Poppins-Regular',
    },
    topBarPriceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    topBarPriceLabel: {
      ...typography.caption,
      fontSize: 11,
      fontWeight: '500',
      color: colors.textSecondary,
      fontFamily: 'Poppins-SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    topBarPriceValue: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: 'Poppins-Bold',
    },
    infoCard: {
      position: 'absolute',
      bottom: 8 + Math.max(insets.bottom, 0),
      left: spacing.md,
      right: spacing.md,
      maxHeight: '50%', // Limita o card a 50% da tela
    },
    infoHeader: {
      marginBottom: spacing.xs,
      paddingBottom: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs + 2,
    },
    minimizeButton: {
      padding: spacing.xs,
    },
    infoTitle: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    infoContent: {
      marginBottom: spacing.xs,
      maxHeight: 200, // Limita altura para forçar scroll quando necessário
      gap: spacing.xs, // Espaçamento vertical entre itens
    },
    passengerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingBottom: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: spacing.xs,
    },
    passengerContent: {
      flex: 1,
      gap: 2,
    },
    passengerName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    passengerPhone: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
    },
    destinationContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      // Não usar gap aqui pois pode não funcionar no ScrollView
    },
    destinationIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: hexToRgba(colors.secondary, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      marginRight: spacing.md, // Espaçamento explícito - mesmo da tela do passageiro
    },
    destinationContent: {
      flex: 1,
      gap: 2,
    },
    destinationLabel: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      fontFamily: 'Poppins-SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    destinationText: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      color: colors.textPrimary,
      fontFamily: 'Poppins-Regular',
      flex: 1,
    },
    originContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      // Não usar gap aqui pois pode não funcionar no ScrollView
    },
    originIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: hexToRgba(colors.primary, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      marginRight: spacing.md, // Espaçamento explícito - mesmo da tela do passageiro
    },
    originContent: {
      flex: 1,
      gap: 2,
    },
    originLabel: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      fontFamily: 'Poppins-SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    originText: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      color: colors.textPrimary,
      fontFamily: 'Poppins-Regular',
      flex: 1,
    },
    actions: {
      marginTop: spacing.xs,
      gap: spacing.xs,
      paddingBottom: spacing.xs,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      borderRadius: 16,
      padding: spacing.lg,
      borderWidth: 1,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      fontFamily: 'Poppins-Bold',
      marginBottom: spacing.xs,
    },
    modalSubtitle: {
      fontSize: 14,
      fontFamily: 'Poppins-Regular',
      marginBottom: spacing.md,
    },
    modalInput: {
      borderWidth: 1,
      borderRadius: 12,
      padding: spacing.md,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    modalActions: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    ratingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    ratingIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingHeaderContent: {
      flex: 1,
      gap: 2,
    },
    ratingCard: {
      borderWidth: 1,
      borderRadius: 14,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    ratingLabel: {
      fontSize: 12,
      fontFamily: 'Poppins-Medium',
      textAlign: 'center',
      marginBottom: spacing.xs,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    ratingRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    starTouchable: {
      padding: spacing.xs,
    },
    ratingHint: {
      fontSize: 13,
      fontFamily: 'Poppins-Regular',
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    ratingOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    ratingOverlayContent: {
      flex: 1,
      justifyContent: 'center',
    },
    chatFab: {
      position: 'absolute',
      left: spacing.md,
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
    chatBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    chatBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
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
    bottomSafeArea: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: Math.max(insets.bottom, 0),
      backgroundColor: colors.background,
      zIndex: 10,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>
            Carregando corrida...
          </Text>
        </View>
      </View>
    );
  }

  if (!tripData) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <Text style={{ marginTop: spacing.md, color: colors.textSecondary, textAlign: 'center' }}>
            Corrida não encontrada
          </Text>
          <Button
            title="Voltar"
            onPress={() => navigation.goBack()}
            variant="primary"
            style={{ marginTop: spacing.lg, minWidth: 200 }}
          />
        </View>
      </View>
    );
  }

  const statusButton = getStatusButton();

  return (
    <View style={styles.container}>
      {/* Faixa de background superior (safe area) */}
      {insets.top > 0 && <View style={styles.topSafeArea} />}
      
      {/* Barra superior com valor e destino */}
      <View
        style={styles.topBarContainer}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setTopBarHeight(height);
        }}
      >
        <View style={styles.topBar}>
          {/* Destino */}
          {destinationLocation && destinationLocation.lat !== 0 && destinationLocation.lon !== 0 && (
            <View style={styles.topBarDestinationRow}>
              <View style={styles.topBarDestinationIcon}>
                <Ionicons name="flag" size={16} color={colors.primary} />
              </View>
              <Text style={styles.topBarDestinationText} numberOfLines={1}>
                {destinationAddress || `${destinationLocation.lat.toFixed(4)}, ${destinationLocation.lon.toFixed(4)}`}
              </Text>
            </View>
          )}
          
          {/* Valor estimado */}
          {tripData.estimated_fare && (
            <View style={styles.topBarPriceRow}>
              <Text style={styles.topBarPriceLabel}>VALOR ESTIMADO</Text>
              <Text style={styles.topBarPriceValue}>
                {formatPrice(tripData.estimated_fare)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.mapContainer, { marginTop: topBarHeight || Math.max(insets.top, 0) }]}>
        <TileMap
          ref={mapRef}
          showRoute={routePoints.length > 0}
          centerLat={mapCenter.lat}
          centerLon={mapCenter.lon}
          zoom={mapZoom}
          route={routePoints}
          driverLocation={driverLocation || undefined}
          passengerLocation={passengerLocation || undefined}
          destinationLocation={destinationLocation || undefined}
          onMapMove={handleMapMove}
          bottomContainerHeight={cardHeight + 8 + 60 + Math.max(insets.bottom - 8, 0)}
          topSpaceHeight={topBarHeight || 0}
          isLocating={false}
        />
      </View>

      <Card
        style={styles.infoCard}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setCardHeight(height);
        }}
      >
        <View style={styles.infoHeader}>
          <View style={styles.infoHeaderContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 }}>
              <Ionicons name="car-outline" size={18} color={colors.primary} />
              <Text style={styles.infoTitle}>Corrida em Andamento</Text>
            </View>
            <TouchableOpacity
              style={styles.minimizeButton}
              onPress={() => setIsMinimized((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isMinimized ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {!isMinimized && (
        <ScrollView 
          style={styles.infoContent}
          contentContainerStyle={{ paddingBottom: spacing.xs }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {/* Informações do Passageiro */}
          {passengerInfo && (
            <View style={styles.passengerContainer}>
              <Avatar
                uri={passengerInfo.photoUrl || (passengerInfo.id ? apiService.getProfilePhotoUrl(passengerInfo.id) : undefined)}
                name={passengerInfo.name || 'Passageiro'}
                size={40}
              />
              <View style={styles.passengerContent}>
                <Text style={styles.passengerName}>{passengerInfo.name || 'Passageiro'}</Text>
                {passengerInfo.phone && (
                  <Text style={styles.passengerPhone}>{passengerInfo.phone}</Text>
                )}
              </View>
            </View>
          )}

          {passengerLocation && (
            <View style={styles.originContainer}>
              <View style={styles.originIconContainer}>
                <Ionicons name="location" size={18} color={colors.primary} />
              </View>
              <View style={styles.originContent}>
                <Text style={styles.originLabel}>ORIGEM</Text>
                <Text style={styles.originText} numberOfLines={2}>
                  {originAddress || `${(passengerLocation.lat ?? 0).toFixed(4)}, ${(passengerLocation.lon ?? (passengerLocation as any).lng ?? 0).toFixed(4)}`}
                </Text>
              </View>
            </View>
          )}


        </ScrollView>
        )}

        <View style={styles.actions}>
          {statusButton && (
            <Button
              title={statusButton.title}
              onPress={() => handleStatusUpdate(statusButton.status)}
              variant={statusButton.variant}
              fullWidth
              disabled={isUpdating}
            />
          )}

          {canCancelRide && (
            <Button
              title="Cancelar Corrida"
              onPress={() => setCancelModalVisible(true)}
              variant="ghost"
              fullWidth
              disabled={isUpdating}
            />
          )}
        </View>
      </Card>

      {/* Botão de Chat - ajustado para não ser tampado */}
      <TouchableOpacity
        style={[
          styles.chatFab,
          {
            bottom: cardHeight + Math.max(insets.bottom, spacing.md) + spacing.sm + 8, // Margem de 8px abaixo
          },
        ]}
        onPress={handleChatToggle}
        activeOpacity={0.8}
        disabled={!rideId}
      >
        <Ionicons
          name="chatbubbles-outline"
          size={22}
          color={rideId ? colors.primary : colors.textSecondary}
        />
        {chatState.unreadCount > 0 && (
          <View style={styles.chatBadge}>
            <Text style={styles.chatBadgeText}>
              {chatState.unreadCount > 99 ? '99+' : chatState.unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Botão de Localização - ajustado */}
      <TouchableOpacity
        style={[
          styles.locationFab,
          {
            bottom: cardHeight + Math.max(insets.bottom, spacing.md) + spacing.sm + 8, // Margem de 8px abaixo
          },
        ]}
        onPress={handleRecenterLocation}
        activeOpacity={0.8}
      >
        <Ionicons name="location-outline" size={24} color="#34C759" />
      </TouchableOpacity>

      {/* Botões de zoom do mapa - ajustados */}
      <TouchableOpacity
        style={[
          styles.zoomFab,
          {
            bottom: cardHeight + Math.max(insets.bottom, spacing.md) + spacing.sm + 8 + 64, // 56 (altura do botão) + 8 (espaçamento) + 8 (margem)
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
            bottom: cardHeight + Math.max(insets.bottom, spacing.md) + spacing.sm + 8 + 128, // 56 (altura do botão) * 2 + 16 (espaçamento) + 8 (margem)
          },
        ]}
        onPress={handleZoomOut}
        activeOpacity={0.8}
      >
        <Ionicons name="remove" size={24} color={colors.primary} />
      </TouchableOpacity>
      
      {isChatOpen && rideId && currentRideId === rideId && (
        <ChatWindow
          rideId={rideId}
          otherUserName={passengerInfo?.name || 'Passageiro'}
          otherUserPhoto={passengerInfo?.photoUrl}
        />
      )}

      <Modal
        visible={ratingModalVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.ratingOverlay}>
          <KeyboardAvoidingView
            style={styles.ratingOverlayContent}
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 24 : insets.bottom + 24}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.ratingOverlayContent}>
                <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.ratingHeaderContent}>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Avaliar passageiro</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      Como foi a experiência?
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.ratingCard,
                      {
                        borderColor: hexToRgba(colors.secondary, 0.18),
                        backgroundColor: hexToRgba(colors.secondary, 0.06),
                      },
                    ]}
                  >
                    <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>Sua nota</Text>

                    <View style={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <TouchableOpacity
                          key={value}
                          style={styles.starTouchable}
                          onPress={() => {
                            setRatingValue(value);
                            setHasUserClickedStar(true);
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={value <= ratingValue ? 'star' : 'star-outline'}
                            size={28}
                            color={colors.secondary}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.ratingHint, { color: colors.textSecondary }]}>
                      {getRatingLabel(ratingValue)}
                    </Text>
                  </View>

                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        borderColor: colors.border,
                        color: colors.textPrimary,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder="Comentário (opcional)"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    value={ratingComment}
                    onChangeText={setRatingComment}
                  />

                  <View style={styles.modalActions}>
                    <Button
                      title="Enviar avaliação"
                      onPress={handleSubmitRating}
                      fullWidth
                      disabled={isSubmittingRating}
                    />
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Cancelar corrida</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Informe o motivo do cancelamento
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { borderColor: colors.border, color: colors.textPrimary },
              ]}
              placeholder="Ex.: Mudança de planos"
              placeholderTextColor={colors.textSecondary}
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
            />

            <View style={styles.modalActions}>
              <Button
                title="Confirmar cancelamento"
                variant="secondary"
                fullWidth
                disabled={isUpdating}
                onPress={() => {
                  setCancelModalVisible(false);
                  const reasonText =
                    cancelReason && cancelReason.trim().length > 0
                      ? cancelReason.trim()
                      : 'Cancelado pelo motorista';
                  void handleDriverCancelRide(reasonText);
                }}
              />
              <Button
                title="Voltar"
                variant="ghost"
                fullWidth
                onPress={() => setCancelModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Faixa de background inferior (safe area) */}
      {insets.bottom > 0 && <View style={styles.bottomSafeArea} />}
    </View>
  );
};
