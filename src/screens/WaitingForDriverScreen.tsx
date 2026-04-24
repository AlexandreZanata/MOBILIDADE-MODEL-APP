import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import Button from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Avatar } from '@/components/atoms/Avatar';
import { TileMap, TileMapRef, RoutePoint } from '@/components/molecules/TileMap';
import { spacing, shadows, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { passengerWebSocketService } from '@/services/passengerWebSocketService';
import { useTrip } from '@/context/TripContext';
import { ChatWindow } from '@/components/organisms/ChatWindow';
import { useChat } from '@/context/ChatContext';
import { StarRating } from '@/components/atoms/StarRating';
import {
  startPassengerBackgroundLocation,
  stopPassengerBackgroundLocation,
} from '@/services/backgroundLocationService';
import { reverseGeocode } from '@/services/placesService';

const { height } = Dimensions.get('window');

interface WaitingForDriverScreenProps {
  navigation: any;
  route?: {
    params?: {
      userLocation?: { lat: number; lon: number };
      destination?: { lat: number; lng: number };
      tripData?: any;
      tripId?: string;
      estimatedFare?: number; // Preço estimado da corrida
    };
  };
}

interface Driver {
  id: string;
  name: string;
  rating?: number;
  phone?: string;
  photoUrl?: string;
  vehicle?: {
    model?: string;
    plate?: string;
    licensePlate?: string;
    color?: string;
    brand?: string; // Adicionado brand para compatibilidade
  };
  location?: {
    lat: number;
    lon: number;
  };
}

// Verifica se os dados do veículo estão completos
const isVehicleDataComplete = (vehicle?: Driver['vehicle']): boolean => {
  if (!vehicle) return false;
  // Verifica se todos os campos principais estão preenchidos
  return !!(vehicle.model && vehicle.plate && vehicle.color);
};

export const WaitingForDriverScreen: React.FC<WaitingForDriverScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { activeTrip, refreshTrip, cancelTrip } = useTrip();
  const { openChat, closeChat, isChatOpen, currentRideId, chatState, updateRideStatus } = useChat();
  const [tripId] = useState<string | null>(route?.params?.tripId || route?.params?.tripData?.id || null);
  const [validatedRideId, setValidatedRideId] = useState<string | null>(null); // ID validado pela API
  const rideId = validatedRideId || activeTrip?.id || tripId || null; // Usa o validado como prioridade
  const ratingAccentColor = colors.secondary ?? colors.primary;
  
  const [estimatedFare, setEstimatedFare] = useState<number | null>(
    route?.params?.estimatedFare || 
    route?.params?.tripData?.estimated_fare || 
    route?.params?.tripData?.final_fare || 
    activeTrip?.estimated_fare ||
    null
  );
  
  // Normaliza userLocation - pode vir como {lat, lon} ou {lat, lng}
  const normalizeLocation = (loc: any): { lat: number; lon: number } | null => {
    if (!loc) return null;
    if (typeof loc.lat === 'number' && typeof loc.lon === 'number') {
      return { lat: loc.lat, lon: loc.lon };
    }
    if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      return { lat: loc.lat, lon: loc.lng };
    }
    return null;
  };
  
  // Tenta obter origem do activeTrip primeiro, depois dos params
  const getInitialUserLocation = (): { lat: number; lon: number } | null => {
    // Primeiro tenta do activeTrip (mais confiável)
    if (activeTrip?.origin && activeTrip.origin.lat !== 0 && activeTrip.origin.lng !== 0) {
      return normalizeLocation(activeTrip.origin);
    }
    // Depois tenta dos params
    return normalizeLocation(route?.params?.userLocation || route?.params?.tripData?.origin);
  };
  
  const initialUserLocation = getInitialUserLocation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(initialUserLocation);
  
  // Normaliza destination - pode vir como {lat, lng} ou {lat, lon} ou de tripData
  const normalizeDestination = (dest: any): { lat: number; lng: number } | null => {
    if (!dest) return null;
    
    // Se já tem lng, usa direto
    if (dest.lng !== undefined && dest.lat !== undefined && dest.lat !== 0 && dest.lng !== 0) {
      return { lat: dest.lat, lng: dest.lng };
    }
    // Se tem lon, converte para lng
    if (dest.lon !== undefined && dest.lat !== undefined && dest.lat !== 0 && dest.lon !== 0) {
      return { lat: dest.lat, lng: dest.lon };
    }
    return null;
  };
  
  // Tenta obter destino do activeTrip primeiro, depois dos params
  const getInitialDestination = (): { lat: number; lng: number } | null => {
    // Primeiro tenta do activeTrip (mais confiável)
    if (activeTrip?.destination && activeTrip.destination.lat !== 0 && activeTrip.destination.lng !== 0) {
      return normalizeDestination(activeTrip.destination);
    }
    // Depois tenta dos params
    return normalizeDestination(route?.params?.destination || route?.params?.tripData?.destination);
  };
  
  const initialDestination = getInitialDestination();
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(initialDestination);

  // Log para debug
  useEffect(() => {
    console.log('[WaitingForDriver] Parâmetros recebidos:', {
      tripId,
      userLocation,
      destination,
      routeParams: route?.params,
      tripData: route?.params?.tripData,
    });
  }, []);

  const handleChatToggle = () => {
    if (!rideId) {
      Alert.alert('Chat indisponível', 'Nenhuma corrida ativa foi encontrada.');
      return;
    }

    if (isChatOpen && currentRideId === rideId) {
      closeChat();
      return;
    }

    // Abre o chat com informações do motorista e status da corrida
    openChat(
      rideId,
      assignedDriver?.name || 'Motorista',
      assignedDriver?.photoUrl,
      tripStatus || activeTrip?.status, // Passa o status da corrida
      assignedDriver?.id
    );
  };

  const handleCancelRide = () => {
    if (!rideId) {
      Alert.alert('Erro', 'Nenhuma corrida ativa foi encontrada.');
      return;
    }

    Alert.alert(
      'Cancelar Corrida',
      'Tem certeza que deseja cancelar esta corrida?',
      [
        {
          text: 'Não',
          style: 'cancel',
        },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[WaitingForDriver] Cancelando corrida:', rideId);
              
              // Para atualizações de localização
              stopPassengerLocationUpdates();
              
              // Cancela a corrida usando o TripContext
              const response = await cancelTrip('Cancelado pelo passageiro');
              
              if (response.success) {
                console.log('[WaitingForDriver] Corrida cancelada com sucesso');
                
                // Limpa dados da corrida
                setAssignedDriver(null);
                setTripStatus('CANCELLED');
                updateRideStatus('CANCELLED');
                setIsSearching(false);
                
                // Desconecta WebSocket
                passengerWebSocketService.disconnect();
                
                // Navega para a tela inicial (Main)
                navigation.navigate('Main');
              } else {
                Alert.alert(
                  'Erro',
                  response.error || 'Não foi possível cancelar a corrida. Tente novamente.'
                );
              }
            } catch (error: any) {
              console.error('[WaitingForDriver] Erro ao cancelar corrida:', error);
              Alert.alert(
                'Erro',
                error.message || 'Não foi possível cancelar a corrida. Tente novamente.'
              );
            }
          },
        },
      ]
    );
  };
  // Função para verificar se o status indica que o motorista JÁ ACEITOU a corrida
  // IMPORTANTE: Só retorna true para status que indicam que o motorista ACEITOU a corrida
  // Status como AGUARDANDO_MOTORISTA e MOTORISTA_ENCONTRADO NÃO indicam aceitação
  const hasDriverAccepted = (status?: string): boolean => {
    if (!status) return false;
    
    // Status que indicam que o motorista JÁ ACEITOU a corrida
    // MOTORISTA_ACEITOU é o primeiro status que confirma aceitação
    const acceptedStatuses = [
      'MOTORISTA_ACEITOU', // ✅ Status oficial de aceitação
      'MOTORISTA_A_CAMINHO',
      'MOTORISTA_PROXIMO',
      'MOTORISTA_CHEGOU',
      'PASSAGEIRO_EMBARCADO',
      'EM_ROTA',
      'PROXIMO_DESTINO',
      'CORRIDA_FINALIZADA',
      'AGUARDANDO_AVALIACAO',
      'CONCLUIDA',
      // Status em inglês (compatibilidade)
      'DRIVER_ARRIVING',
      'DRIVER_NEARBY',
      'DRIVER_ARRIVED',
      'IN_PROGRESS',
      'WAITING_AT_DESTINATION',
    ];
    
    // Status que NÃO indicam aceitação (ainda aguardando)
    const pendingStatuses = [
      'AGUARDANDO_MOTORISTA',
      'MOTORISTA_ENCONTRADO',
      'REQUESTED',
      'SEARCHING_FOR_DRIVER',
    ];
    
    // Se está na lista de pendentes, definitivamente não aceitou
    if (pendingStatuses.includes(status)) {
      return false;
    }
    
    // Verifica se está na lista de aceitos
    return acceptedStatuses.includes(status);
  };

  // Inicializa isSearching: só não está buscando se tem motorista E o status indica aceitação
  const [isSearching, setIsSearching] = useState(
    !(activeTrip?.driver && hasDriverAccepted(activeTrip?.status))
  );
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);
  const [tripStatus, setTripStatus] = useState<string>('REQUESTED');
  const [cardHeight, setCardHeight] = useState(180);
  const [isMinimized, setIsMinimized] = useState(false);
  const mapRef = useRef<TileMapRef>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hasUserMovedMap, setHasUserMovedMap] = useState(false);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const locationUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentPassengerLocation, setCurrentPassengerLocation] = useState<{ lat: number; lon: number } | null>(userLocation);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lon: number } | null>(null);
  // Só mostra loading se realmente não temos localização válida
  const [isGettingLocation, setIsGettingLocation] = useState(
    !userLocation || userLocation.lat === 0 || userLocation.lon === 0
  );
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined); // Usa zoom padrão do TileMap
  const [originAddress, setOriginAddress] = useState<string>(''); // Nome da origem
  const [destinationAddress, setDestinationAddress] = useState<string>(''); // Nome do destino
  const [topBarHeight, setTopBarHeight] = useState(0); // Altura da barra superior
  
  // Estados para o modal de motorista aceito
  const [showDriverAcceptedModal, setShowDriverAcceptedModal] = useState(false);
  const [hasShownDriverModal, setHasShownDriverModal] = useState(false);
  const [arrivalModalVisible, setArrivalModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [hasUserClickedStar, setHasUserClickedStar] = useState(false);
  const ratingModalShownRef = useRef(false);
  
  // Valores de zoom predefinidos (incluindo o padrão 17 do TileMap)
  const DEFAULT_TILEMAP_ZOOM = 17;
  const ZOOM_LEVELS = [12, 14, 16, 17, 18, 20];
  
  const handleZoomIn = () => {
    // Se ainda não foi definido, usa o zoom padrão do TileMap (17)
    const currentZoom = mapZoom ?? DEFAULT_TILEMAP_ZOOM;
    const currentIndex = ZOOM_LEVELS.indexOf(currentZoom);
    
    if (currentIndex === -1) {
      // Se o zoom atual não está na lista, encontra o próximo valor maior
      const nextZoom = ZOOM_LEVELS.find(level => level > currentZoom);
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
    // Se ainda não foi definido, usa o zoom padrão do TileMap (17)
    const currentZoom = mapZoom ?? DEFAULT_TILEMAP_ZOOM;
    const currentIndex = ZOOM_LEVELS.indexOf(currentZoom);
    
    if (currentIndex === -1) {
      // Se o zoom atual não está na lista, encontra o próximo valor menor
      const prevZoom = ZOOM_LEVELS.slice().reverse().find(level => level < currentZoom);
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

  // Funções para o modal de motorista aceito
  const handleCloseDriverModal = () => {
    setShowDriverAcceptedModal(false);
  };

  const handleShowDriverInfo = () => {
    if (assignedDriver) {
      setShowDriverAcceptedModal(true);
    }
  };

  const normalizeRatingValue = (value?: number | null) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!parsed || Number.isNaN(parsed)) return 5;
    return Math.min(5, Math.max(1, Math.round(parsed)));
  };

  const getRatingLabel = (value: number) => {
    const normalized = normalizeRatingValue(value);
    if (normalized >= 5) return 'Excelente';
    if (normalized >= 4) return 'Muito bom';
    if (normalized >= 3) return 'Bom';
    if (normalized >= 2) return 'Regular';
    return 'Ruim';
  };

  const handleSkipPassengerRating = () => {
    setRatingModalVisible(false);
    setRatingComment('');
    setRatingValue(5);
    setHasUserClickedStar(false);
    navigation.navigate('Main');
  };

  const handleSubmitPassengerRating = async () => {
    if (!rideId) {
      Alert.alert('Erro', 'ID da corrida não encontrado.');
      return;
    }

    const finalStatuses = ['COMPLETED', 'CORRIDA_FINALIZADA', 'CONCLUIDA'];
    const currentStatusUpper = (tripStatus || activeTrip?.status || '').toUpperCase();
    if (!finalStatuses.includes(currentStatusUpper)) {
      Alert.alert('Avaliação não disponível', 'A avaliação só pode ser enviada após a corrida ser finalizada.');
      return;
    }

    // Se o usuário não clicou em nenhuma estrela, usar 5 (valor default)
    // Se clicou, usar o valor clicado (1-5)
    const finalRating = hasUserClickedStar ? normalizeRatingValue(ratingValue) : 5;
    const sanitizedComment = ratingComment?.trim?.() ?? '';

    setIsSubmittingRating(true);
    try {
      const response = await apiService.passengerRideRate(
        rideId,
        finalRating,
        sanitizedComment || undefined
      );

      if (response.success || response.status === 204) {
        setRatingModalVisible(false);
        setRatingComment('');
        setRatingValue(5);
        setHasUserClickedStar(false);
        navigation.navigate('Main');
      } else {
        const errorMessage = response?.message || response?.error || 'Não foi possível enviar a avaliação.';
        Alert.alert('Erro', errorMessage);
      }
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Não foi possível enviar a avaliação.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  useEffect(() => {
    const statusUpper = (tripStatus || activeTrip?.status || '').toUpperCase();
    const finalStatuses = ['COMPLETED', 'CORRIDA_FINALIZADA', 'CONCLUIDA'];

    if (rideId && finalStatuses.includes(statusUpper) && !ratingModalShownRef.current) {
      ratingModalShownRef.current = true;
      setRatingValue(5);
      setRatingComment('');
      setHasUserClickedStar(false);
      setRatingModalVisible(true);
    }
  }, [tripStatus, activeTrip?.status, rideId]);

  const toggleCardCollapse = () => {
    setIsMinimized((prev) => !prev);
  };
  
  // Atualiza origem e destino quando activeTrip mudar
  useEffect(() => {
    if (activeTrip) {
      // Atualiza origem se válida
      if (activeTrip.origin && activeTrip.origin.lat !== 0 && activeTrip.origin.lng !== 0) {
        const normalizedOrigin = normalizeLocation(activeTrip.origin);
        if (normalizedOrigin) {
          setUserLocation(normalizedOrigin);
          setCurrentPassengerLocation(normalizedOrigin);
        }
      }
      
      // Atualiza destino se válido
      if (activeTrip.destination && activeTrip.destination.lat !== 0 && activeTrip.destination.lng !== 0) {
        const normalizedDest = normalizeDestination(activeTrip.destination);
        if (normalizedDest) {
          setDestination(normalizedDest);
        }
      }

      // Lista de status VÁLIDOS que indicam que o motorista JÁ ACEITOU a corrida
      // IMPORTANTE: MOTORISTA_ACEITOU é o primeiro status que confirma aceitação
      // Status anteriores (AGUARDANDO_MOTORISTA, MOTORISTA_ENCONTRADO) NÃO indicam aceitação
      const validStatusesWithDriver = [
        'MOTORISTA_ACEITOU', // ✅ Status oficial de aceitação
        'MOTORISTA_A_CAMINHO',
        'MOTORISTA_PROXIMO',
        'MOTORISTA_CHEGOU',
        'PASSAGEIRO_EMBARCADO',
        'EM_ROTA',
        'PROXIMO_DESTINO',
        'CORRIDA_FINALIZADA',
        'AGUARDANDO_AVALIACAO',
        'CONCLUIDA',
        // Status em inglês (compatibilidade)
        'DRIVER_ARRIVING',
        'DRIVER_NEARBY',
        'DRIVER_ARRIVED',
        'IN_PROGRESS',
        'WAITING_AT_DESTINATION',
      ];

      // Lista de status INVÁLIDOS que indicam corrida cancelada, finalizada ou ainda aguardando aceitação
      const invalidStatuses = [
        'CANCELLED',
        'CANCELED_BY_DRIVER',
        'CANCELED_BY_PASSENGER',
        'CANCELADA_MOTORISTA',
        'CANCELADA_PASSAGEIRO',
        'CANCELADA_ADMIN',
        'CANCELADA_NO_SHOW',
        'EXPIRED',
        'EXPIRADA',
        'COMPLETED',
        'NO_SHOW',
        'REQUESTED', // Ainda não tem motorista
        'AGUARDANDO_MOTORISTA', // Ainda não tem motorista - NÃO indica aceitação
        'MOTORISTA_ENCONTRADO', // Motorista encontrado mas ainda não aceitou - NÃO indica aceitação
        'SEARCHING_FOR_DRIVER', // Ainda buscando motorista
      ];

      const currentStatus = activeTrip.status || tripStatus;

      // ✅ VALIDAÇÃO CRÍTICA: Só restaura dados do motorista se o status for VÁLIDO E indicar ACEITAÇÃO
      if (activeTrip.driver) {
        // Verifica se o status é inválido (cancelado, finalizado, ou ainda aguardando)
        if (invalidStatuses.includes(currentStatus)) {
          console.warn('[WaitingForDriver] ⚠️ Corrida com status inválido, NÃO restaurando dados do motorista:', currentStatus);
          setIsSearching(true); // Volta para estado de busca
          setAssignedDriver(null); // Limpa dados do motorista
          setHasShownDriverModal(false);
          setShowDriverAcceptedModal(false); // Fecha o modal se estiver aberto
          return;
        }

        // Verifica se o status é válido E indica que o motorista ACEITOU
        if (validStatusesWithDriver.includes(currentStatus)) {
          console.log('[WaitingForDriver] ✅ Restaurando dados do motorista - Status válido e aceitação confirmada:', currentStatus);
          
          // Constrói URL da foto do motorista
          const photoUrl = activeTrip.driver.id 
            ? `https://vamu.joaoflavio.com/v1/profile-photos/${activeTrip.driver.id}`
            : undefined;
          
          // Constrói dados do veículo
          const vehicleData = activeTrip.driver.vehicle ? {
            plate: (activeTrip.driver.vehicle as any).licensePlate || activeTrip.driver.vehicle.plate,
            brand: activeTrip.driver.vehicle.brand,
            model: activeTrip.driver.vehicle.model,
            color: activeTrip.driver.vehicle.color,
          } : undefined;

          const initialDriver: Driver = {
            id: activeTrip.driver.id,
            name: activeTrip.driver.name,
            rating: activeTrip.driver.rating,
            photoUrl: photoUrl,
            vehicle: vehicleData,
          };

          setAssignedDriver(initialDriver);
          setIsSearching(false);
          console.log('[WaitingForDriver] ✅ Dados do motorista restaurados, FAB de info disponível');

          // ⚡ FALLBACK: Se dados do veículo estão incompletos, busca da API
          if (!isVehicleDataComplete(vehicleData)) {
            console.log('[WaitingForDriver] ⚠️ Dados do veículo incompletos (activeTrip), buscando da API...');

            (async () => {
              try {
                const response = await apiService.getPassengerActiveRide();
                if (response.success && response.data?.driver?.vehicle) {
                  const apiVehicle = response.data.driver.vehicle;
                  console.log('[WaitingForDriver] ✅ Dados completos do veículo obtidos via API (activeTrip):', {
                    model: apiVehicle.model,
                    plate: apiVehicle.licensePlate,
                    color: apiVehicle.color,
                  });

                  setAssignedDriver((prevDriver) => {
                    if (!prevDriver) return prevDriver;
                    return {
                      ...prevDriver,
                      vehicle: {
                        plate: apiVehicle.licensePlate || apiVehicle.plate || prevDriver.vehicle?.plate,
                        brand: apiVehicle.brand || prevDriver.vehicle?.brand,
                        model: apiVehicle.model || prevDriver.vehicle?.model,
                        color: apiVehicle.color || prevDriver.vehicle?.color,
                      },
                    };
                  });
                }
              } catch (error) {
                console.error('[WaitingForDriver] ❌ Erro ao buscar dados do veículo via API:', error);
              }
            })();
          }
        } else {
          // Status desconhecido ou que não indica aceitação - trata como se motorista não aceitou
          console.warn('[WaitingForDriver] ⚠️ Status desconhecido ou não indica aceitação, tratando como inválido:', currentStatus);
          console.warn('[WaitingForDriver] ⚠️ NÃO restaurando dados do motorista até confirmação de aceitação');
          setIsSearching(true);
          setAssignedDriver(null); // Limpa dados do motorista
          setHasShownDriverModal(false);
        }
      }

      // Se não tem motorista, garante que está em estado de busca
      if (!activeTrip.driver) {
        console.log('[WaitingForDriver] Corrida sem motorista, mantendo estado de busca');
        setIsSearching(true);
        setAssignedDriver(null);
        setHasShownDriverModal(false);
      }
    } else {
      // Se não tem activeTrip, limpa tudo
      console.log('[WaitingForDriver] Sem activeTrip, limpando dados');
      setIsSearching(true);
      setAssignedDriver(null);
      setHasShownDriverModal(false);
    }
  }, [activeTrip?.id, activeTrip?.origin, activeTrip?.destination, activeTrip?.driver, activeTrip?.status]);

  useEffect(() => {
    const currentStatus = activeTrip?.status || tripStatus;
    
    // Garante que o modal só aparece quando:
    // 1. Tem motorista atribuído
    // 2. O status confirma que o motorista ACEITOU (MOTORISTA_ACEITOU ou posterior)
    // 3. Ainda não mostrou o modal
    if (!assignedDriver) {
      // Se não tem motorista, fecha o modal se estiver aberto
      if (showDriverAcceptedModal) {
        setShowDriverAcceptedModal(false);
        setHasShownDriverModal(false);
      }
      return;
    }
    
    // Verifica se o status realmente indica aceitação
    if (!hasDriverAccepted(currentStatus)) {
      // Se o status não indica aceitação, fecha o modal se estiver aberto
      if (showDriverAcceptedModal) {
        console.log('[WaitingForDriver] ⚠️ Status não indica aceitação, fechando modal:', currentStatus);
        setShowDriverAcceptedModal(false);
        setHasShownDriverModal(false);
      }
      return;
    }
    
    // Se já mostrou o modal, não mostra novamente
    if (hasShownDriverModal) return;

    // Só mostra o modal quando todas as condições são atendidas
    console.log('[WaitingForDriver] ✅ Mostrando modal de motorista aceito - Status:', currentStatus);
    setShowDriverAcceptedModal(true);
    setHasShownDriverModal(true);
  }, [assignedDriver, tripStatus, activeTrip?.status, hasShownDriverModal, showDriverAcceptedModal]);

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Gerar rota do motorista até o passageiro usando a nova API de roteamento
  // ✅ Aplica regra de 50m de distância mínima (mesma regra do motorista)
  const generateRouteFromDriverToPassenger = async (driverPos: { lat: number; lon: number }, passengerPos: { lat: number; lon: number }) => {
    try {
      // Calcula distância usando Haversine antes de fazer a requisição
      const R = 6371000; // Raio da Terra em metros
      const dLat = ((passengerPos.lat - driverPos.lat) * Math.PI) / 180;
      const dLon = ((passengerPos.lon - driverPos.lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((driverPos.lat * Math.PI) / 180) *
          Math.cos((passengerPos.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distância em metros
      
      // Só gera rota se distância for maior que 50m (mesma regra do motorista)
      if (distance <= 50) {
        if (__DEV__) {
          console.log('[WaitingForDriver] ⚠️ Distância muito pequena (', Math.round(distance), 'm), não calculando rota');
        }
        return [];
      }

      console.log('[WaitingForDriver] Gerando rota do motorista até o passageiro:', {
        driver: `${driverPos.lon},${driverPos.lat}`,
        passenger: `${passengerPos.lon},${passengerPos.lat}`,
        distance: Math.round(distance) + 'm',
      });

      const { routingService } = await import('@/services/routingService');
      const response = await routingService.calculateRouteAsPoints(driverPos, passengerPos);

      if (response.success && response.data) {
        setRoutePoints(response.data);
        console.log('[WaitingForDriver] ✅ Rota do motorista gerada com sucesso:', response.data.length, 'pontos');
        return response.data;
      } else {
        // Não loga como erro se for apenas distância muito pequena (comportamento esperado)
        if (response.error?.includes('muito próximo') || response.error?.includes('muito pequena')) {
          if (__DEV__) {
            console.log('[WaitingForDriver] Distância muito pequena, não calculando rota:', response.error);
          }
        } else {
          console.error('[WaitingForDriver] Erro ao calcular rota:', response.error);
        }
      }
    } catch (error) {
      console.error('[WaitingForDriver] Erro ao gerar rota do motorista:', error);
    }
    return [];
  };

  // Gerar rota do usuário até o destino usando a nova API de roteamento (usado antes do motorista aceitar)
  const generateRoute = async (origin: { lat: number; lon: number }, dest: { lat: number; lng: number }) => {
    try {
      console.log('[WaitingForDriver] Iniciando geração de rota:', {
        origin: `${origin.lon},${origin.lat}`,
        destination: `${dest.lng},${dest.lat}`,
      });

      const { routingService } = await import('@/services/routingService');
      const response = await routingService.calculateRouteAsPoints(origin, { lat: dest.lat, lon: dest.lng });

      if (response.success && response.data) {
        setRoutePoints(response.data);
        console.log('[WaitingForDriver] Rota gerada com sucesso:', response.data.length, 'pontos');
        console.log('[WaitingForDriver] Primeiro ponto:', response.data[0]);
        console.log('[WaitingForDriver] Último ponto:', response.data[response.data.length - 1]);
        return response.data;
      } else {
        // Não loga como erro se for apenas distância muito pequena (comportamento esperado)
        if (response.error?.includes('muito próximo') || response.error?.includes('muito pequena')) {
          if (__DEV__) {
            console.log('[WaitingForDriver] Distância muito pequena, não calculando rota:', response.error);
          }
        } else {
          console.error('[WaitingForDriver] Erro ao calcular rota:', response.error);
        }
      }
    } catch (error) {
      console.error('[WaitingForDriver] Erro ao gerar rota:', error);
    }
    return [];
  };

  // Polling para verificar status da corrida
  const checkTripStatus = async () => {
    if (!tripId) return;

    // Não tenta buscar trips temporárias ou de teste (criadas quando TripPricingService está indisponível)
    if (tripId.startsWith('temp_') || tripId.startsWith('test_')) {
      console.log('[WaitingForDriver] Trip temporária/de teste, aguardando atualização...');
      // Para trips temporárias, não faz polling mas mantém a tela funcionando
      return;
    }

    // Rota GET /v1/trips/{id} não existe na API, removida
    // O status da corrida será atualizado via WebSocket ou outras rotas disponíveis
    // Por enquanto, apenas aguarda atualizações via WebSocket
    try {
      // Removido: chamada a getTrip que não existe na API
      // O status será atualizado via WebSocket quando houver mudanças
    } catch (error: any) {
      // Ignora erros relacionados a trips temporárias
      if (error?.message?.includes('TripPricingService') || 
          error?.message?.includes('500') ||
          error?.response?.status === 500 ||
          error?.error?.includes('TripPricingService')) {
        console.warn('[WaitingForDriver] Erro ignorado (trip temporária):', error.message);
        return;
      }
      console.error('[WaitingForDriver] Erro ao verificar status da corrida:', error);
    }
  };

  // Carrega detalhes do motorista
// Inicia polling
  useEffect(() => {
    if (tripId) {
      // Verifica imediatamente
      checkTripStatus();
      
      // Depois verifica a cada 3 segundos
      pollingIntervalRef.current = setInterval(() => {
        checkTripStatus();
      }, 3000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [tripId]);

  // Busca localização atual do usuário quando a tela monta
  useEffect(() => {
    if (!tripId) {
      setIsGettingLocation(false);
      return;
    }
    
    // Se já temos uma localização válida, não precisa mostrar loading
    if (userLocation && userLocation.lat !== 0 && userLocation.lon !== 0) {
      console.log('[WaitingForDriver] Localização já disponível, não mostrando loading');
      setIsGettingLocation(false);
      return;
    }
    
    const getCurrentUserLocation = async () => {
      try {
        // Só mostra loading se realmente não temos localização
        setIsGettingLocation(true);
        console.log('[WaitingForDriver] Buscando localização atual do usuário...');
        
        // Solicita permissão de localização
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('[WaitingForDriver] Permissão de localização negada');
          setIsGettingLocation(false);
          return;
        }
        
        // Obtém localização atual com timeout para não travar a tela
        const location = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout ao obter localização')), 5000)
          )
        ]);
        
        if (location) {
          const currentLoc = {
            lat: location.coords.latitude,
            lon: location.coords.longitude,
          };
          
          console.log('[WaitingForDriver] Localização atual obtida:', currentLoc);
          
          // Sempre atualiza com a localização atual (sem centralizar automaticamente)
          setUserLocation(currentLoc);
          setCurrentPassengerLocation(currentLoc);
          setMapCenter(currentLoc);
          
          console.log('[WaitingForDriver] Localização atual definida:', currentLoc);
        }
        
        setIsGettingLocation(false);
      } catch (error) {
        console.error('[WaitingForDriver] Erro ao obter localização atual:', error);
        // Mesmo com erro, não bloqueia a tela - usa localização da API se disponível
        setIsGettingLocation(false);
      }
    };
    
    getCurrentUserLocation();
  }, [tripId]);

  // Busca dados completos da corrida quando a tela monta se não tiver origem/destino válidos
  useEffect(() => {
    if (!tripId) return;
    
    // Se não tem origem ou destino válidos, busca da API
    const needsData = (!userLocation || (userLocation.lat === 0 && userLocation.lon === 0)) ||
                      (!destination || (destination.lat === 0 && destination.lng === 0));
    
    if (needsData) {
      console.log('[WaitingForDriver] Origem ou destino inválidos, buscando dados da API...');
      const fetchInitialData = async () => {
        try {
          const response = await apiService.getPassengerActiveRide();
          if (response.success && response.data) {
            const ride = response.data;
            
            // Atualiza origem se válida
            const apiOrigin = ride.pickup || ride.origin;
            if (apiOrigin && (!userLocation || (userLocation.lat === 0 && userLocation.lon === 0))) {
              const normalizedOrigin = {
                lat: apiOrigin.lat ?? apiOrigin.latitude ?? 0,
                lon: apiOrigin.lng ?? apiOrigin.longitude ?? apiOrigin.lon ?? 0,
              };
              if (normalizedOrigin.lat !== 0 && normalizedOrigin.lon !== 0) {
                setUserLocation(normalizedOrigin);
                setCurrentPassengerLocation(normalizedOrigin);
                setMapCenter(normalizedOrigin);
                
                console.log('[WaitingForDriver] Origem atualizada da API:', normalizedOrigin);
              }
            }
            
            // Atualiza destino se válido
            const apiDestination = ride.destination;
            if (apiDestination && (!destination || (destination.lat === 0 && destination.lng === 0))) {
              const normalizedDest = {
                lat: apiDestination.lat ?? apiDestination.latitude ?? 0,
                lng: apiDestination.lng ?? apiDestination.longitude ?? apiDestination.lon ?? 0,
              };
              if (normalizedDest.lat !== 0 && normalizedDest.lng !== 0) {
                setDestination(normalizedDest);
                console.log('[WaitingForDriver] Destino atualizado da API:', normalizedDest);
              }
            }
          }
        } catch (error) {
          console.error('[WaitingForDriver] Erro ao buscar dados iniciais:', error);
        }
      };
      
      fetchInitialData();
    }
  }, [tripId]);

  // Conecta ao WebSocket do passageiro quando a tela é montada (mesmo com destino inválido)
  useEffect(() => {
    if (!tripId) {
      console.log('[WaitingForDriver] Sem tripId, não conectando WebSocket');
      return;
    }
    
    console.log('[WaitingForDriver] Iniciando conexão WebSocket (tripId:', tripId, ')');

    // Flag para controlar se já recebeu dados do websocket
    let hasReceivedWebSocketData = false;
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

    // Função para buscar dados completos do motorista/veículo da API (fallback)
    const fetchDriverVehicleFromApi = async (): Promise<Driver | null> => {
      try {
        console.log('[WaitingForDriver] 🔄 Buscando dados completos do motorista via API (fallback)...');
        const response = await apiService.getPassengerActiveRide();

        if (response.success && response.data?.driver) {
          const driver = response.data.driver;
          const vehicle = driver.vehicle;

          console.log('[WaitingForDriver] ✅ Dados do motorista obtidos via API:', {
            id: driver.id,
            name: driver.name,
            hasVehicle: !!vehicle,
            vehicleModel: vehicle?.model,
            vehiclePlate: vehicle?.licensePlate,
            vehicleColor: vehicle?.color,
          });

          // Constrói URL da foto do motorista
          const photoUrl = driver.id
            ? `https://vamu.joaoflavio.com/v1/profile-photos/${driver.id}`
            : undefined;

          return {
            id: driver.id,
            name: driver.name,
            rating: driver.rating,
            photoUrl: photoUrl,
            vehicle: vehicle ? {
              plate: vehicle.licensePlate || vehicle.plate || '',
              brand: vehicle.brand || '',
              model: vehicle.model || '',
              color: vehicle.color || '',
            } : undefined,
          };
        }

        return null;
      } catch (error) {
        console.error('[WaitingForDriver] ❌ Erro ao buscar dados do motorista via API:', error);
        return null;
      }
    };

    const fetchActiveRideDetails = async () => {
      try {
        const response = await apiService.getPassengerActiveRide();
        if (response.success && response.data) {
          const ride = response.data;
          
          // Atualiza ID validado
          if (ride.id) {
            setValidatedRideId(ride.id);
            console.log('[WaitingForDriver] ID da corrida validado pela API:', ride.id);
          }

          // Atualiza preço estimado se disponível na resposta
          if (ride.estimatedPrice !== undefined && ride.estimatedPrice !== null) {
            setEstimatedFare(ride.estimatedPrice);
            console.log('[WaitingForDriver] Preço estimado atualizado:', ride.estimatedPrice);
          } else if (ride.estimated_fare !== undefined && ride.estimated_fare !== null) {
            setEstimatedFare(ride.estimated_fare);
            console.log('[WaitingForDriver] Preço estimado atualizado:', ride.estimated_fare);
          } else if (ride.finalPrice !== undefined && ride.finalPrice !== null) {
            setEstimatedFare(ride.finalPrice);
            console.log('[WaitingForDriver] Preço final atualizado:', ride.finalPrice);
          } else if (ride.final_fare !== undefined && ride.final_fare !== null) {
            setEstimatedFare(ride.final_fare);
            console.log('[WaitingForDriver] Preço final atualizado:', ride.final_fare);
          }

          const currentStatus = ride.status || tripStatus;
          setTripStatus(currentStatus);
          updateRideStatus(currentStatus); // Atualiza status no ChatContext
          
          // ✅ VALIDAÇÃO CRÍTICA: Só atualiza dados do motorista se o status indicar que ele ACEITOU
          // Lista de status que indicam que o motorista JÁ ACEITOU a corrida
          // IMPORTANTE: MOTORISTA_ACEITOU é o primeiro status que confirma aceitação
          const acceptedStatuses = [
            'MOTORISTA_ACEITOU', // ✅ Status oficial de aceitação
            'MOTORISTA_A_CAMINHO',
            'MOTORISTA_PROXIMO',
            'MOTORISTA_CHEGOU',
            'PASSAGEIRO_EMBARCADO',
            'EM_ROTA',
            'PROXIMO_DESTINO',
            'CORRIDA_FINALIZADA',
            'AGUARDANDO_AVALIACAO',
            'CONCLUIDA',
            // Status em inglês (compatibilidade)
            'DRIVER_ARRIVING',
            'DRIVER_NEARBY',
            'DRIVER_ARRIVED',
            'IN_PROGRESS',
            'WAITING_AT_DESTINATION',
          ];
          
          // Status que indicam que a corrida ainda está aguardando aceitação
          const pendingStatuses = [
            'REQUESTED',
            'AGUARDANDO_MOTORISTA',
            'MOTORISTA_ENCONTRADO', // Motorista encontrado mas ainda não aceitou
            'SEARCHING_FOR_DRIVER',
          ];
          
          // Só atualiza dados do motorista se o status indicar aceitação
          if (ride.driver && acceptedStatuses.includes(currentStatus)) {
            console.log('[WaitingForDriver] ✅ Status válido para mostrar motorista:', currentStatus);

            // Constrói URL da foto do motorista
            const photoUrl = ride.driver.id
              ? `https://vamu.joaoflavio.com/v1/profile-photos/${ride.driver.id}`
              : undefined;

            // Dados do veículo da API - garante que todos os campos estejam preenchidos
            const vehicleData = {
              plate: ride.driver.vehicle?.licensePlate || ride.driver.vehicle?.plate || '',
              brand: ride.driver.vehicle?.brand || '',
              model: ride.driver.vehicle?.model || '',
              color: ride.driver.vehicle?.color || '',
            };

            console.log('[WaitingForDriver] Dados do veículo da API:', vehicleData);

            // Se dados do veículo estão incompletos, tenta buscar novamente
            if (!vehicleData.plate || !vehicleData.model || !vehicleData.color) {
              console.log('[WaitingForDriver] ⚠️ Dados do veículo incompletos, tentando buscar novamente...');
              const completeDriver = await fetchDriverVehicleFromApi();
              if (completeDriver && completeDriver.vehicle) {
                setAssignedDriver({
                  id: ride.driver.id,
                  name: ride.driver.name,
                  rating: ride.driver.rating,
                  photoUrl: photoUrl,
                  vehicle: completeDriver.vehicle,
                });
              } else {
                // Mesmo sem dados completos, mostra o que temos
                setAssignedDriver({
                  id: ride.driver.id,
                  name: ride.driver.name,
                  rating: ride.driver.rating,
                  photoUrl: photoUrl,
                  vehicle: vehicleData,
                });
              }
            } else {
              setAssignedDriver({
                id: ride.driver.id,
                name: ride.driver.name,
                rating: ride.driver.rating,
                photoUrl: photoUrl,
                vehicle: vehicleData,
              });
            }
            setIsSearching(false);
          } else if (pendingStatuses.includes(currentStatus) || !acceptedStatuses.includes(currentStatus)) {
            // Se o status indica que ainda está aguardando ou é um status desconhecido que não está na lista de aceitos
            console.log('[WaitingForDriver] ⚠️ Status indica que motorista ainda não aceitou:', currentStatus);
            console.log('[WaitingForDriver] ⚠️ NÃO atualizando dados do motorista até aceitação');
            setAssignedDriver(null);
            setIsSearching(true);
          }
          
          // ✅ GARANTE que localização do motorista sempre apareça no mapa
          if (ride.driverLocation) {
            const driverLoc = {
              lat: ride.driverLocation.lat ?? ride.driverLocation.latitude ?? 0,
              lon: ride.driverLocation.lng ?? ride.driverLocation.longitude ?? 0,
            };
            if (driverLoc.lat !== 0 && driverLoc.lon !== 0) {
              setDriverLocation(driverLoc);
              console.log('[WaitingForDriver] ✅ Localização do motorista atualizada:', driverLoc);
              
              // ✅ Gera rota entre motorista e passageiro se distância > 50m
              const passengerLoc = currentPassengerLocation || userLocation;
              if (passengerLoc && passengerLoc.lat !== 0 && passengerLoc.lon !== 0) {
                // Calcula distância usando Haversine
                const R = 6371000; // Raio da Terra em metros
                const dLat = ((driverLoc.lat - passengerLoc.lat) * Math.PI) / 180;
                const dLon = ((driverLoc.lon - passengerLoc.lon) * Math.PI) / 180;
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos((passengerLoc.lat * Math.PI) / 180) *
                    Math.cos((driverLoc.lat * Math.PI) / 180) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c; // Distância em metros
                
                // Só gera rota se distância for maior que 50m (mesma regra do motorista)
                if (distance > 50) {
                  console.log('[WaitingForDriver] ✅ Distância entre motorista e passageiro:', Math.round(distance), 'm - Gerando rota');
                  generateRouteFromDriverToPassenger(driverLoc, passengerLoc);
                } else {
                  console.log('[WaitingForDriver] ⚠️ Distância muito pequena (', Math.round(distance), 'm), não gerando rota');
                }
              }
            }
          } else if (ride.driver && acceptedStatuses.includes(currentStatus)) {
            // Se tem motorista mas não tem localização, tenta buscar novamente
            console.log('[WaitingForDriver] ⚠️ Motorista encontrado mas sem localização, tentando buscar novamente...');
          }
          
          // Se não temos origem/destino válidos, tenta usar os dados da API
          // A API pode retornar pickup/destination ou origin/destination
          const apiOrigin = ride.pickup || ride.origin;
          const apiDestination = ride.destination;
          
          if (apiOrigin && (!userLocation || (userLocation.lat === 0 && userLocation.lon === 0))) {
            const normalizedOrigin = {
              lat: apiOrigin.lat ?? apiOrigin.latitude ?? 0,
              lon: apiOrigin.lng ?? apiOrigin.longitude ?? apiOrigin.lon ?? 0,
            };
            if (normalizedOrigin.lat !== 0 && normalizedOrigin.lon !== 0) {
              setCurrentPassengerLocation(normalizedOrigin);
              setUserLocation(normalizedOrigin);
              setMapCenter(normalizedOrigin);
            }
          }
          
          if (apiDestination && (!destination || (destination.lat === 0 && destination.lng === 0))) {
            const normalizedDest = {
              lat: apiDestination.lat ?? apiDestination.latitude ?? 0,
              lng: apiDestination.lng ?? apiDestination.longitude ?? apiDestination.lon ?? 0,
            };
            if (normalizedDest.lat !== 0 && normalizedDest.lng !== 0) {
              setDestination(normalizedDest);
              console.log('[WaitingForDriver] Destino atualizado da API:', normalizedDest);
            }
          }
        }
      } catch (error) {
        console.error('[WaitingForDriver] Erro ao consultar corrida ativa do passageiro:', error);
      }
    };

    const connectPassengerWebSocket = async () => {
      try {
        console.log('[WaitingForDriver] Conectando ao WebSocket do passageiro...');
        
        // ✅ FALLBACK: Se após 5 segundos não receber dados do websocket, busca via API
        fallbackTimeout = setTimeout(async () => {
          if (!hasReceivedWebSocketData) {
            console.log('[WaitingForDriver] ⚠️ WebSocket não recebeu dados em 5s, usando fallback via API...');
            await fetchActiveRideDetails();
          }
        }, 5000);
        
        // Configura callbacks
        passengerWebSocketService.setOnMessage(async (message) => {
          console.log('[WaitingForDriver] Mensagem WebSocket recebida:', message);
          hasReceivedWebSocketData = true; // Marca que recebeu dados do websocket
          
          // Cancela o fallback se recebeu dados
          if (fallbackTimeout) {
            clearTimeout(fallbackTimeout);
            fallbackTimeout = null;
          }
          
          // Trata mensagem active_ride (corrida ativa após reconexão)
          // Nota: 'active_ride' pode não estar no tipo, mas pode ser recebido do servidor
          if ((message as any).type === 'active_ride') {
            console.log('[WaitingForDriver] Recebeu active_ride, buscando detalhes completos...');
            await fetchActiveRideDetails();
            
            // Se a mensagem contém localização do motorista, atualiza
            const activeRideData = message as any;
            
            // Atualiza preço estimado se disponível na mensagem
            if (activeRideData.estimatedPrice !== undefined && activeRideData.estimatedPrice !== null) {
              setEstimatedFare(activeRideData.estimatedPrice);
              console.log('[WaitingForDriver] Preço estimado atualizado (active_ride):', activeRideData.estimatedPrice);
            } else if (activeRideData.estimated_fare !== undefined && activeRideData.estimated_fare !== null) {
              setEstimatedFare(activeRideData.estimated_fare);
              console.log('[WaitingForDriver] Preço estimado atualizado (active_ride):', activeRideData.estimated_fare);
            }
            if (activeRideData.driverLocation) {
              const driverLoc = {
                lat: activeRideData.driverLocation.lat ?? activeRideData.driverLocation.latitude ?? 0,
                lon: activeRideData.driverLocation.lng ?? activeRideData.driverLocation.longitude ?? 0,
              };
              if (driverLoc.lat !== 0 && driverLoc.lon !== 0) {
                setDriverLocation(driverLoc);
                console.log('[WaitingForDriver] ✅ Localização do motorista atualizada (active_ride):', driverLoc);
                
                // ✅ Gera rota entre motorista e passageiro se distância > 50m
                const passengerLoc = currentPassengerLocation || userLocation;
                if (passengerLoc && passengerLoc.lat !== 0 && passengerLoc.lon !== 0) {
                  // Calcula distância usando Haversine
                  const R = 6371000; // Raio da Terra em metros
                  const dLat = ((driverLoc.lat - passengerLoc.lat) * Math.PI) / 180;
                  const dLon = ((driverLoc.lon - passengerLoc.lon) * Math.PI) / 180;
                  const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos((passengerLoc.lat * Math.PI) / 180) *
                      Math.cos((driverLoc.lat * Math.PI) / 180) *
                      Math.sin(dLon / 2) *
                      Math.sin(dLon / 2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  const distance = R * c; // Distância em metros
                  
                  // Só gera rota se distância for maior que 50m (mesma regra do motorista)
                  if (distance > 50) {
                    console.log('[WaitingForDriver] ✅ Distância entre motorista e passageiro:', Math.round(distance), 'm - Gerando rota');
                    generateRouteFromDriverToPassenger(driverLoc, passengerLoc);
                  } else {
                    console.log('[WaitingForDriver] ⚠️ Distância muito pequena (', Math.round(distance), 'm), não gerando rota');
                  }
                }
              }
            }
            
            // Atualiza status se fornecido
            if (activeRideData.status) {
              setTripStatus(activeRideData.status);
              updateRideStatus(activeRideData.status); // Atualiza status no ChatContext
            }
            
            // ✅ VALIDAÇÃO CRÍTICA: Só atualiza dados do motorista se o status indicar aceitação
            const currentStatus = activeRideData.status || tripStatus;
            const acceptedStatuses = [
              'MOTORISTA_ACEITOU',
              'DRIVER_ASSIGNED',
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
            
            if (activeRideData.driver && acceptedStatuses.includes(currentStatus)) {
              console.log('[WaitingForDriver] ✅ Status válido para mostrar motorista (active_ride):', currentStatus);

              // Constrói dados do veículo do WebSocket
              const vehicleFromWs = activeRideData.driver.vehicle ? {
                plate: activeRideData.driver.vehicle.licensePlate,
                brand: activeRideData.driver.vehicle.brand,
                model: activeRideData.driver.vehicle.model,
                color: activeRideData.driver.vehicle.color,
              } : undefined;

              // Constrói URL da foto do motorista
              const photoUrl = activeRideData.driver.id
                ? `https://vamu.joaoflavio.com/v1/profile-photos/${activeRideData.driver.id}`
                : undefined;

              const initialDriver: Driver = {
                id: activeRideData.driver.id,
                name: activeRideData.driver.name,
                rating: activeRideData.driver.rating,
                photoUrl: photoUrl,
                vehicle: vehicleFromWs,
              };

              setAssignedDriver(initialDriver);
              setIsSearching(false);

              // ⚡ FALLBACK: Se dados do veículo estão incompletos, busca da API
              if (!isVehicleDataComplete(vehicleFromWs)) {
                console.log('[WaitingForDriver] ⚠️ Dados do veículo incompletos (active_ride), buscando da API...');

                fetchDriverVehicleFromApi().then((completeDriver) => {
                  if (completeDriver) {
                    console.log('[WaitingForDriver] ✅ Dados do veículo obtidos via API (active_ride):', {
                      model: completeDriver.vehicle?.model,
                      plate: completeDriver.vehicle?.plate,
                      color: completeDriver.vehicle?.color,
                    });

                    setAssignedDriver((prevDriver) => ({
                      ...prevDriver,
                      ...completeDriver,
                      name: completeDriver.name || prevDriver?.name || 'Motorista',
                      rating: completeDriver.rating ?? prevDriver?.rating,
                      photoUrl: completeDriver.photoUrl || prevDriver?.photoUrl,
                      vehicle: completeDriver.vehicle || prevDriver?.vehicle || vehicleFromWs,
                    }));
                  } else {
                    // Mesmo sem dados completos da API, mantém o que temos do websocket
                    console.log('[WaitingForDriver] ⚠️ API não retornou dados completos, mantendo dados do websocket');
                  }
                });
              }
            } else {
              console.log('[WaitingForDriver] ⚠️ Status inválido ou motorista não aceitou ainda (active_ride):', currentStatus);
              setAssignedDriver(null);
              setIsSearching(true);
            }
            return;
          }
          
          // Trata notificações de status da corrida
          if (message.type === 'ride_driver_accepted') {
            // ✅ VALIDAÇÃO CRÍTICA: Esta mensagem só deve ser processada quando o motorista REALMENTE aceitou
            // Usa o status que vem da mensagem WebSocket (normalmente 'MOTORISTA_ACEITOU')
            const newStatus = message.data?.status || '';
            
            // Lista de status que confirmam que o motorista ACEITOU
            // IMPORTANTE: MOTORISTA_ACEITOU é o primeiro status que confirma aceitação
            // Status anteriores (AGUARDANDO_MOTORISTA, MOTORISTA_ENCONTRADO) NÃO indicam aceitação
            const acceptedStatuses = [
              'MOTORISTA_ACEITOU', // ✅ Status oficial de aceitação
              'MOTORISTA_A_CAMINHO',
              'MOTORISTA_PROXIMO',
              'MOTORISTA_CHEGOU',
              'PASSAGEIRO_EMBARCADO',
              'EM_ROTA',
              // Status em inglês (compatibilidade)
              'DRIVER_ARRIVING',
              'DRIVER_NEARBY',
              'DRIVER_ARRIVED',
            ];
            
            // Status que NÃO indicam aceitação (ainda aguardando)
            const pendingStatuses = [
              'AGUARDANDO_MOTORISTA',
              'MOTORISTA_ENCONTRADO',
              'REQUESTED',
              'SEARCHING_FOR_DRIVER',
            ];
            
            // Se está na lista de pendentes, definitivamente não aceitou
            if (pendingStatuses.includes(newStatus)) {
              console.warn('[WaitingForDriver] ⚠️ Mensagem ride_driver_accepted recebida mas status indica que ainda está aguardando:', newStatus);
              console.warn('[WaitingForDriver] ⚠️ Ignorando dados do motorista até confirmação de aceitação (MOTORISTA_ACEITOU)');
              return; // Não processa se o status não confirma aceitação
            }
            
            // Verifica se o status realmente indica aceitação
            if (!acceptedStatuses.includes(newStatus)) {
              console.warn('[WaitingForDriver] ⚠️ Mensagem ride_driver_accepted recebida mas status não confirma aceitação:', newStatus);
              console.warn('[WaitingForDriver] ⚠️ Ignorando dados do motorista até confirmação de aceitação (MOTORISTA_ACEITOU)');
              return; // Não processa se o status não confirma aceitação
            }
            
            setTripStatus(newStatus);
            setIsSearching(false);
            
            console.log('[WaitingForDriver] ✅ Motorista aceitou corrida - Status confirmado:', newStatus);
            console.log('[WaitingForDriver] Dados completos da mensagem:', JSON.stringify(message, null, 2));
            
            // Extrai dados do motorista diretamente da mensagem WebSocket
            // Agora temos certeza de que o motorista aceitou
            const messageData = message.data as any;
            if (messageData?.driver) {
              const driverData = messageData.driver;
              console.log('[WaitingForDriver] ✅ Dados do motorista encontrados (aceitação confirmada):', {
                id: driverData.id,
                name: driverData.name,
                rating: driverData.rating,
                hasVehicle: !!driverData.vehicle
              });
              
              // Constrói dados do veículo do WebSocket
              const vehicleFromWs = driverData.vehicle ? {
                plate: driverData.vehicle.licensePlate || driverData.vehicle.plate,
                brand: driverData.vehicle.brand,
                model: driverData.vehicle.model,
                color: driverData.vehicle.color,
              } : undefined;

              // Constrói URL da foto do motorista
              const photoUrl = driverData.id
                ? `https://vamu.joaoflavio.com/v1/profile-photos/${driverData.id}`
                : undefined;

              // Define os dados do motorista com o que temos do WebSocket
              const initialDriver: Driver = {
                id: driverData.id,
                name: driverData.name,
                rating: driverData.rating,
                photoUrl: photoUrl,
                vehicle: vehicleFromWs,
              };

              setAssignedDriver(initialDriver);
              console.log('[WaitingForDriver] ✅ Motorista atualizado na tela:', driverData.name);
              
              // Mostra o modal de motorista aceito
              setShowDriverAcceptedModal(true);
              setHasShownDriverModal(true);

              // ⚡ FALLBACK: Se dados do veículo estão incompletos, busca da API
              if (!isVehicleDataComplete(vehicleFromWs)) {
                console.log('[WaitingForDriver] ⚠️ Dados do veículo incompletos via WebSocket, buscando da API...');

                // Busca dados completos em background (não bloqueia o modal)
                fetchDriverVehicleFromApi().then((completeDriver) => {
                  if (completeDriver) {
                    console.log('[WaitingForDriver] ✅ Dados do veículo obtidos via API:', {
                      model: completeDriver.vehicle?.model,
                      plate: completeDriver.vehicle?.plate,
                      color: completeDriver.vehicle?.color,
                    });

                    // Atualiza o motorista com dados completos do veículo
                    setAssignedDriver((prevDriver) => ({
                      ...prevDriver,
                      ...completeDriver,
                      // Mantém dados que já temos do WebSocket se a API não retornar
                      name: completeDriver.name || prevDriver?.name || 'Motorista',
                      rating: completeDriver.rating ?? prevDriver?.rating,
                      photoUrl: completeDriver.photoUrl || prevDriver?.photoUrl,
                      vehicle: completeDriver.vehicle || prevDriver?.vehicle || vehicleFromWs,
                    }));
                  } else {
                    // Mesmo sem dados completos da API, mantém o que temos do websocket
                    console.log('[WaitingForDriver] ⚠️ API não retornou dados completos, mantendo dados do websocket');
                  }
                });
              }
            } else {
              console.warn('[WaitingForDriver] ⚠️ Dados do motorista não encontrados na mensagem WebSocket');
              // Mesmo sem dados na mensagem, busca da API (pode ter dados mais completos)
            }
            
            // Busca detalhes completos da corrida (localização do motorista, etc)
            await fetchActiveRideDetails();
            
            // ✅ GARANTE que localização do motorista sempre apareça após aceitar
            // Se não recebeu localização do motorista na mensagem, busca da API
            if (!driverLocation || (driverLocation.lat === 0 && driverLocation.lon === 0)) {
              console.log('[WaitingForDriver] ⚠️ Localização do motorista não recebida, buscando da API...');
              const rideDetails = await apiService.getPassengerActiveRide();
              if (rideDetails.success && rideDetails.data?.driverLocation) {
                const driverLoc = {
                  lat: rideDetails.data.driverLocation.lat ?? rideDetails.data.driverLocation.latitude ?? 0,
                  lon: rideDetails.data.driverLocation.lng ?? rideDetails.data.driverLocation.longitude ?? 0,
                };
                if (driverLoc.lat !== 0 && driverLoc.lon !== 0) {
                  setDriverLocation(driverLoc);
                  console.log('[WaitingForDriver] ✅ Localização do motorista obtida da API:', driverLoc);
                }
              }
            }
            
            // Atualiza o TripContext global (importante para o chat funcionar)
            await refreshTrip();
            console.log('[WaitingForDriver] ✅ TripContext atualizado - chat disponível');
            
            // Para de gerar rota do passageiro até o destino
            // A rota será do motorista até o passageiro
          } else if (message.type === 'ride_cancelled') {
            // Corrida cancelada pelo motorista
            console.log('[WaitingForDriver] Corrida cancelada:', message);
            
            const cancellationReason = message.data?.cancellationReason || 'O motorista cancelou a corrida';
            
            // Para atualizações de localização
            stopPassengerLocationUpdates();
            
            // Mostra alert com opção de buscar nova corrida
            Alert.alert(
              'Corrida Cancelada',
              cancellationReason,
              [
                {
                  text: 'Buscar Outra Corrida',
                  onPress: async () => {
                    console.log('[WaitingForDriver] Gerando nova estimativa após cancelamento...');
                    
                    // Limpa dados da corrida cancelada
                    setAssignedDriver(null);
                    setTripStatus('REQUESTED');
                    updateRideStatus('REQUESTED'); // Atualiza status no ChatContext
                    setIsSearching(true);
                    
                    // Verifica se temos origem e destino válidos
                    const origin = currentPassengerLocation || userLocation;
                    
                    if (!origin || !destination || origin.lat === 0 || destination.lat === 0) {
                      Alert.alert(
                        'Erro',
                        'Não foi possível obter origem e destino. Por favor, tente novamente.',
                        [{ text: 'OK', onPress: () => navigation.goBack() }]
                      );
                      return;
                    }
                    
                    try {
                      // Gera nova estimativa
                      const fareEstimateResponse = await apiService.fareEstimate(
                        { lat: origin.lat, lng: origin.lon },
                        { lat: destination.lat, lng: destination.lng }
                      );
                      
                      if (fareEstimateResponse.success && fareEstimateResponse.data) {
                        const newEstimate = fareEstimateResponse.data;
                        
                        // Volta para a tela de preço com a nova estimativa
                        navigation.navigate('TripPrice', {
                          origin: { lat: origin.lat, lng: origin.lon },
                          destination: { lat: destination.lat, lng: destination.lng },
                          originAddress: originAddress || 'Sua localização',
                          destinationAddress: destinationAddress || 'Destino',
                          estimateId: newEstimate.estimateId,
                          categories: newEstimate.categories,
                        });
                      } else {
                        throw new Error(fareEstimateResponse.error || 'Erro ao gerar estimativa');
                      }
                    } catch (error) {
                      console.error('[WaitingForDriver] Erro ao gerar nova estimativa:', error);
                      Alert.alert(
                        'Erro',
                        'Não foi possível gerar uma nova estimativa. Por favor, tente novamente.',
                        [{ text: 'OK', onPress: () => navigation.goBack() }]
                      );
                    }
                  }
                },
                {
                  text: 'Voltar',
                  style: 'cancel',
                  onPress: () => navigation.goBack()
                }
              ]
            );
          } else if (message.type === 'ride_driver_on_the_way') {
            setTripStatus('DRIVER_ARRIVING');
            updateRideStatus('DRIVER_ARRIVING'); // Atualiza status no ChatContext
          } else if (message.type === 'ride_driver_nearby') {
            setTripStatus('DRIVER_NEARBY');
            updateRideStatus('DRIVER_NEARBY'); // Atualiza status no ChatContext
          } else if (message.type === 'ride_driver_arrived') {
            setTripStatus('DRIVER_ARRIVED');
            updateRideStatus('DRIVER_ARRIVED'); // Atualiza status no ChatContext
            setArrivalModalVisible(true);
          } else if (message.type === 'ride_status_update') {
            const newStatus = message.data.status;
            setTripStatus(newStatus);
            updateRideStatus(newStatus); // Atualiza status no ChatContext
            if (newStatus === 'MOTORISTA_ACEITOU') {
              await fetchActiveRideDetails();
            }
            
            // ✅ GARANTE que localização do motorista sempre apareça no mapa
            const driverLocData = (message.data as any)?.driverLocation;
            if (driverLocData) {
              const driverLoc = {
                lat: driverLocData.lat ?? driverLocData.latitude ?? 0,
                lon: driverLocData.lng ?? driverLocData.longitude ?? 0,
              };
              if (driverLoc.lat !== 0 && driverLoc.lon !== 0) {
                setDriverLocation(driverLoc);
                console.log('[WaitingForDriver] ✅ Localização do motorista atualizada (ride_status_update):', driverLoc);
                
                // ✅ Gera rota entre motorista e passageiro se distância > 50m
                const passengerLoc = currentPassengerLocation || userLocation;
                if (passengerLoc && passengerLoc.lat !== 0 && passengerLoc.lon !== 0) {
                  // Calcula distância usando Haversine
                  const R = 6371000; // Raio da Terra em metros
                  const dLat = ((driverLoc.lat - passengerLoc.lat) * Math.PI) / 180;
                  const dLon = ((driverLoc.lon - passengerLoc.lon) * Math.PI) / 180;
                  const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos((passengerLoc.lat * Math.PI) / 180) *
                      Math.cos((driverLoc.lat * Math.PI) / 180) *
                      Math.sin(dLon / 2) *
                      Math.sin(dLon / 2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  const distance = R * c; // Distância em metros
                  
                  // Só gera rota se distância for maior que 50m (mesma regra do motorista)
                  if (distance > 50) {
                    console.log('[WaitingForDriver] ✅ Distância entre motorista e passageiro:', Math.round(distance), 'm - Gerando rota');
                    generateRouteFromDriverToPassenger(driverLoc, passengerLoc);
                  } else {
                    console.log('[WaitingForDriver] ⚠️ Distância muito pequena (', Math.round(distance), 'm), não gerando rota');
                  }
                }
              }
            }
          }
        });

        passengerWebSocketService.setOnConnectionStateChange((connected) => {
          console.log('[WaitingForDriver] Estado de conexão WebSocket:', connected);
        });

        passengerWebSocketService.setOnError((error) => {
          console.error('[WaitingForDriver] Erro no WebSocket:', error);
        });

        // Busca localização atual antes de conectar WebSocket
        // Isso garante que temos uma localização válida para exibir o mapa
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            
            const currentLoc = {
              lat: location.coords.latitude,
              lon: location.coords.longitude,
            };
            
            // Sempre atualiza com a localização atual (sem centralizar automaticamente)
            setUserLocation(currentLoc);
            setCurrentPassengerLocation(currentLoc);
            setMapCenter(currentLoc);
            
            console.log('[WaitingForDriver] Localização atual obtida:', currentLoc);
          }
        } catch (error) {
          console.error('[WaitingForDriver] Erro ao obter localização antes de conectar WebSocket:', error);
        }
        
        // Conecta ao WebSocket (mesmo com destino inválido)
        const connected = await passengerWebSocketService.connect();
        if (connected) {
          console.log('[WaitingForDriver] WebSocket conectado com sucesso');
          // Inicia envio de localização (já obtém localização atual a cada 3 segundos)
          startPassengerLocationUpdates();
          
          // ✅ GARANTE que localização do motorista sempre apareça após conectar
          // Busca detalhes da corrida ativa para obter localização do motorista
          if (assignedDriver || tripStatus) {
            console.log('[WaitingForDriver] ✅ Buscando localização do motorista após conectar WebSocket...');
            await fetchActiveRideDetails();
          }
        } else {
          console.error('[WaitingForDriver] Falha ao conectar WebSocket');
        }
      } catch (error) {
        console.error('[WaitingForDriver] Erro ao conectar WebSocket:', error);
      }
    };

    connectPassengerWebSocket();

    // Cleanup ao desmontar
    return () => {
      console.log('[WaitingForDriver] Desconectando WebSocket do passageiro...');
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
      }
      stopPassengerLocationUpdates();
      passengerWebSocketService.disconnect();
    };
  }, [tripId]);

  // Inicia envio contínuo de localização do passageiro
  const startPassengerLocationUpdates = () => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
    }

    // Função para enviar localização atual
    const sendLocationUpdate = async () => {
      if (!passengerWebSocketService.getIsConnected()) {
        return;
      }

      try {
        // Obtém localização atual
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const newLocation = {
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        };

        // Atualiza localização local (sem centralizar automaticamente)
        setCurrentPassengerLocation(newLocation);
        setUserLocation(newLocation);
        setMapCenter(newLocation);

        // Envia via WebSocket
        passengerWebSocketService.sendLocationUpdate({
          type: 'location_update',
          lat: newLocation.lat,
          lng: newLocation.lon,
          heading: location.coords.heading !== null && location.coords.heading !== undefined
            ? location.coords.heading
            : undefined,
          speed: location.coords.speed !== null && location.coords.speed !== undefined
            ? location.coords.speed * 3.6 // Converte m/s para km/h
            : undefined,
        });

        console.log('[WaitingForDriver] Localização enviada via WebSocket:', newLocation);
      } catch (error) {
        console.error('[WaitingForDriver] Erro ao obter/enviar localização:', error);
      }
    };
    
    // Envia localização imediatamente na primeira vez
    sendLocationUpdate();
    
    // Depois envia a cada 3 segundos (conforme documentação: 2-5 segundos)
    locationUpdateIntervalRef.current = setInterval(sendLocationUpdate, 3000);
  };

  // Para envio de localização
  const stopPassengerLocationUpdates = () => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }
    
    // Para background location também
    stopPassengerBackgroundLocation().catch((error) => {
      console.error('[WaitingForDriver] Erro ao parar background location:', error);
    });
  };

  // Limpa polling quando sai da tela
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        stopPassengerLocationUpdates();
      };
    }, [])
  );

  const handleMapMove = () => {
    setHasUserMovedMap(true);
  };

  const handleRecenterLocation = () => {
    // Usa a localização atual do passageiro (mais atualizada)
    const locationToCenter = currentPassengerLocation || userLocation;
    
    if (locationToCenter && locationToCenter.lat !== 0 && locationToCenter.lon !== 0) {
      setMapCenter(locationToCenter);
      if (mapRef.current) {
        mapRef.current.centerOnLocation(locationToCenter.lat, locationToCenter.lon);
      }
      setHasUserMovedMap(false);
      console.log('[WaitingForDriver] Mapa recentrado na localização do passageiro:', locationToCenter);
    } else {
      // Se não tem localização válida, tenta obter uma nova
      Location.requestForegroundPermissionsAsync().then(({ status }) => {
        if (status === 'granted') {
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }).then((location) => {
            const currentLoc = {
              lat: location.coords.latitude,
              lon: location.coords.longitude,
            };
            setUserLocation(currentLoc);
            setCurrentPassengerLocation(currentLoc);
            setMapCenter(currentLoc);
            if (mapRef.current) {
              mapRef.current.centerOnLocation(currentLoc.lat, currentLoc.lon);
            }
            setHasUserMovedMap(false);
            console.log('[WaitingForDriver] Nova localização obtida e mapa recentrado:', currentLoc);
          });
        }
      });
    }
  };

  // Busca nome do destino usando reverse geocoding
  useEffect(() => {
    const fetchDestinationAddress = async () => {
      if (destination && destination.lat !== 0 && destination.lng !== 0) {
        try {
          const result = await reverseGeocode(destination.lat, destination.lng);
          if (result) {
            setDestinationAddress(result.display_name || result.name || '');
          }
        } catch (error) {
          console.error('[WaitingForDriver] Erro ao buscar endereço do destino:', error);
        }
      }
    };

    fetchDestinationAddress();
  }, [destination]);

  // Inicializa mapCenter - sempre começa com coordenadas padrão e será atualizado quando userLocation estiver disponível
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({ lat: -12.5458, lon: -55.7061 });

  // Atualiza mapCenter sempre que userLocation mudar (sem centralizar automaticamente)
  useEffect(() => {
    if (userLocation && userLocation.lat !== 0 && userLocation.lon !== 0) {
      setMapCenter(userLocation);
    }
  }, [userLocation]);

  // Atualiza preço estimado quando activeTrip mudar
  useEffect(() => {
    if (activeTrip?.estimated_fare !== undefined && activeTrip.estimated_fare !== null) {
      setEstimatedFare(activeTrip.estimated_fare);
      console.log('[WaitingForDriver] Preço estimado atualizado (activeTrip):', activeTrip.estimated_fare);
    }
  }, [activeTrip?.estimated_fare]);

  // Atualiza informações do motorista quando activeTrip mudar
  useEffect(() => {
    if (activeTrip?.driver && activeTrip.id === tripId) {
      const driver: Driver = {
        id: activeTrip.driver.id,
        name: activeTrip.driver.name || 'Motorista',
        rating: activeTrip.driver.rating,
        phone: undefined, // Não disponível no activeTrip
        vehicle: activeTrip.driver.vehicle ? {
          model: activeTrip.driver.vehicle.model || '',
          plate: (activeTrip.driver.vehicle as any).licensePlate 
            || activeTrip.driver.vehicle.plate 
            || assignedDriver?.vehicle?.plate 
            || '',
          color: activeTrip.driver.vehicle.color,
        } : undefined,
        location: activeTrip.driver.location ? {
          lat: activeTrip.driver.location.lat,
          lon: activeTrip.driver.location.lng ?? (activeTrip.driver.location as any).lon ?? 0,
        } : undefined,
      };
      
      setAssignedDriver(driver);
      setIsSearching(false);
      
      // ✅ GARANTE que localização do motorista sempre apareça no mapa
      if (activeTrip.driver.location) {
        const driverLoc = {
          lat: activeTrip.driver.location.lat,
          lon: activeTrip.driver.location.lng ?? (activeTrip.driver.location as any).lon ?? 0,
        };
        if (driverLoc.lat !== 0 && driverLoc.lon !== 0) {
          setDriverLocation(driverLoc);
          console.log('[WaitingForDriver] ✅ Localização do motorista atualizada (activeTrip):', driverLoc);
          
          // ✅ Gera rota do motorista até o passageiro se distância > 50m
          if (currentPassengerLocation || userLocation) {
            const passengerLoc = currentPassengerLocation || userLocation;
            if (passengerLoc && passengerLoc.lat !== 0 && passengerLoc.lon !== 0) {
              generateRouteFromDriverToPassenger(driverLoc, passengerLoc).catch((error) => {
                console.error('[WaitingForDriver] Erro ao gerar rota do motorista:', error);
              });
            }
          }
        }
      }
      
      console.log('[WaitingForDriver] Informações do motorista atualizadas:', driver);
    }
  }, [activeTrip?.driver, activeTrip?.id, tripId, currentPassengerLocation, userLocation]);

  // ✅ Atualiza rota quando localização do motorista mudar (garante que sempre apareça)
  useEffect(() => {
    if (driverLocation && driverLocation.lat !== 0 && driverLocation.lon !== 0 && (currentPassengerLocation || userLocation) && assignedDriver) {
      const passengerLoc = currentPassengerLocation || userLocation;
      if (passengerLoc && passengerLoc.lat !== 0 && passengerLoc.lon !== 0) {
        generateRouteFromDriverToPassenger(driverLocation, passengerLoc).catch((error) => {
          console.error('[WaitingForDriver] Erro ao atualizar rota do motorista:', error);
        });
      }
    }
  }, [driverLocation, currentPassengerLocation, userLocation, assignedDriver]);

  // Gera rota quando userLocation e destination estiverem disponíveis (apenas se motorista não aceitou)
  useEffect(() => {
    // Se motorista já aceitou, não gera rota do passageiro até o destino
    // A rota será do motorista até o passageiro
    if (assignedDriver || !isSearching) {
      return;
    }

    if (userLocation && destination) {
      // Normaliza destination - já vem normalizado como {lat, lng}
      const destLat = destination.lat;
      const destLng = destination.lng;

      if (!destLat || !destLng) {
        console.warn('[WaitingForDriver] Destination inválido:', destination);
        return;
      }

      const dest = {
        lat: destLat,
        lng: destLng,
      };
      
      console.log('[WaitingForDriver] Gerando rota (passageiro até destino):', {
        origin: { lat: userLocation.lat, lon: userLocation.lon },
        destination: dest,
      });
      
      generateRoute(userLocation, dest).catch((error) => {
        console.error('[WaitingForDriver] Erro ao gerar rota:', error);
      });
    } else {
      console.log('[WaitingForDriver] Aguardando localização e destino:', {
        hasUserLocation: !!userLocation,
        hasDestination: !!destination,
        userLocation,
        destination,
      });
    }
  }, [userLocation, destination, assignedDriver, isSearching]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    mapContainer: {
      flex: 1,
      marginTop: 0,
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
    bottomSafeArea: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: Math.max(insets.bottom, 0),
      backgroundColor: colors.background,
      zIndex: 10,
    },
    infoCard: {
      position: 'absolute',
      bottom: 8 + Math.max(insets.bottom, 0),
      left: spacing.md,
      right: spacing.md,
      maxHeight: height * 0.35,
    },
    infoHeader: {
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    infoHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    infoHeaderTitleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    minimizeButton: {
      padding: spacing.xs,
    },
    inlineCancelButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.status.error,
      backgroundColor: hexToRgba(colors.status.error, 0.08),
    },
    inlineCancelText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.status.error,
      fontFamily: 'Poppins-SemiBold',
    },
    infoTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    infoContent: {
      maxHeight: 200,
    },
    infoContentContainer: {
      gap: spacing.md,
      paddingBottom: spacing.xs,
    },
    sectionLabel: {
      ...typography.caption,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      color: colors.textSecondary,
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    driverContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    driverInfo: {
      flex: 1,
      gap: 4,
    },
    driverName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    driverRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    driverRatingText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
    },
    vehicleInfo: {
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    vehicleText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
    },
    destinationContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    destinationIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: hexToRgba(colors.primary, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    destinationContent: {
      flex: 1,
      gap: 2,
    },
    destinationLabel: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      fontFamily: 'Poppins-SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    destinationText: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      color: colors.textPrimary,
      fontFamily: 'Poppins-Regular',
    },
    vehicleContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    vehicleIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: hexToRgba(colors.primary, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    vehicleContent: {
      flex: 1,
      gap: 4,
    },
    vehicleLabel: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      fontFamily: 'Poppins-SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    vehicleDetailText: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      color: colors.textPrimary,
      fontFamily: 'Poppins-Regular',
      marginBottom: 4,
    },
    vehicleDetailsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: 2,
    },
    vehicleDetailItem: {
      gap: 2,
    },
    vehicleDetailLabel: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    vehicleDetailValue: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    searchingContainer: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    searchingText: {
      fontSize: 15,
      color: colors.textPrimary,
      marginTop: spacing.sm,
      fontFamily: 'Poppins-SemiBold',
    },
    priceContainer: {
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      alignItems: 'center',
      gap: 4,
    },
    priceLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    priceValue: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: 'Poppins-Bold',
    },
    actions: {
      flexDirection: 'column',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    cancelButton: {
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 8,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.status.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.status.error,
      fontFamily: 'Poppins-SemiBold',
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
    infoFab: {
      position: 'absolute',
      right: spacing.md,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.large,
      shadowColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    ratingOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    ratingOverlayContent: {
      flex: 1,
      justifyContent: 'center',
    },
    ratingCardModal: {
      borderRadius: 16,
      padding: spacing.lg,
      borderWidth: 1,
      ...shadows.medium,
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
    ratingTitle: {
      fontSize: 18,
      fontWeight: '700',
      fontFamily: 'Poppins-Bold',
    },
    ratingSubtitle: {
      fontSize: 14,
      fontFamily: 'Poppins-Regular',
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
    ratingStarsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    ratingStarButton: {
      padding: spacing.xs,
    },
    ratingHint: {
      fontSize: 13,
      fontFamily: 'Poppins-Regular',
      textAlign: 'center',
    },
    ratingInput: {
      borderWidth: 1,
      borderRadius: 12,
      padding: spacing.md,
      minHeight: 90,
      textAlignVertical: 'top',
    },
    ratingActions: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    arrivalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    arrivalCard: {
      width: '100%',
      borderRadius: 16,
      padding: spacing.lg,
      borderWidth: 1,
      ...shadows.medium,
    },
    arrivalTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    arrivalSubtitle: {
      fontSize: 14,
      marginBottom: spacing.md,
    },
    // Estilos do Modal de Motorista Aceito (Refatorado)
    modalFullScreen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalFullScreenContent: {
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
    },
    
    // Top Section
    modalTopSection: {
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    successIconContainer: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: '#34C759',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      ...shadows.medium,
      shadowColor: '#34C759',
      shadowOpacity: 0.4,
    },
    modalTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'Poppins-Bold',
      marginBottom: 4,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    modalSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
      textAlign: 'center',
    },

    // Center Section (Driver Card)
    modalCenterSection: {
      flex: 1,
      justifyContent: 'center',
      marginVertical: spacing.lg,
    },
    driverProfileCard: {
      alignItems: 'center',
      width: '100%',
    },
    avatarWrapper: {
      marginBottom: spacing.md,
      position: 'relative',
      ...shadows.medium,
    },
    verifiedBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#34C759',
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.background,
    },
    driverInfoContainer: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    modalDriverName: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      fontFamily: 'Poppins-Bold',
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    ratingBadge: {
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Vehicle Grid
    modalVehicleGrid: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: spacing.lg,
      ...shadows.small,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalVehicleHeaderPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba(colors.primary, 0.1),
      alignSelf: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: spacing.lg,
      gap: 6,
    },
    modalVehicleHeaderTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: 'Poppins-Bold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    modalVehicleDetailsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalVehicleDetailBlock: {
      flex: 1,
      alignItems: 'center',
    },
    modalVehicleDetailLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Bold',
      textTransform: 'uppercase',
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    modalVehicleDetailValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      fontFamily: 'Poppins-Bold',
      textAlign: 'center',
    },
    modalVehicleDivider: {
      width: 1,
      height: 30,
      backgroundColor: colors.border,
      marginHorizontal: spacing.xs,
    },

    // Bottom Section
    modalBottomSection: {
      width: '100%',
      marginBottom: spacing.md, // Pequena margem extra além do paddingBottom do container
    },
    modalButton: {
      backgroundColor: colors.primary,
      paddingVertical: 18,
      borderRadius: 24,
      alignItems: 'center',
      width: '100%',
      ...shadows.large,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
    },
    modalButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      fontFamily: 'Poppins-Bold',
      letterSpacing: 0.5,
    },
  });


  // Mostra loading enquanto busca localização inicial
  if (isGettingLocation && (!userLocation || (userLocation.lat === 0 && userLocation.lon === 0))) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: spacing.md, color: colors.textSecondary, fontSize: 14 }}>
            Obtendo sua localização...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra superior com destino e valor */}
      <View
        style={styles.topBarContainer}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setTopBarHeight(height);
        }}
      >
        <View style={styles.topBar}>
          {/* Destino */}
          {destination && destination.lat !== 0 && destination.lng !== 0 && (
            <View style={styles.topBarDestinationRow}>
              <View style={styles.topBarDestinationIcon}>
                <Ionicons name="flag" size={16} color={colors.primary} />
              </View>
              <Text style={styles.topBarDestinationText} numberOfLines={1}>
                {destinationAddress || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`}
              </Text>
            </View>
          )}
          
          {/* Valor estimado */}
          {estimatedFare && (
            <View style={styles.topBarPriceRow}>
              <Text style={styles.topBarPriceLabel}>VALOR ESTIMADO</Text>
              <Text style={styles.topBarPriceValue}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(estimatedFare)}
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
          userLocation={currentPassengerLocation || userLocation || undefined}
          driverLocation={driverLocation || undefined}
          passengerLocation={undefined}
          destinationLocation={destination && destination.lat !== 0 && destination.lng !== 0 ? {
            lat: destination.lat,
            lon: destination.lng,
          } : undefined}
          onMapMove={handleMapMove}
          bottomContainerHeight={cardHeight + Math.max(insets.bottom, spacing.md) + spacing.sm}
          topSpaceHeight={topBarHeight || Math.max(insets.top, 0)}
          isLocating={isGettingLocation}
        />
        
        {/* Loading overlay enquanto busca localização */}
        {isGettingLocation && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: spacing.sm, color: colors.textSecondary, fontSize: 14 }}>
              Atualizando localização...
            </Text>
          </View>
        )}
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
            <View style={styles.infoHeaderTitleRow}>
              <Ionicons 
                name="car-outline" 
                size={18} 
                color={colors.primary} 
              />
              <Text style={styles.infoTitle}>
                {isSearching ? 'Buscando motorista' : 'Motorista encontrado'}
              </Text>
            </View>

            <View style={styles.infoHeaderActions}>
              {!isSearching && (
                <TouchableOpacity
                  style={styles.inlineCancelButton}
                  onPress={handleCancelRide}
                  activeOpacity={0.8}
                >
                  <Text style={styles.inlineCancelText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.minimizeButton}
                onPress={toggleCardCollapse}
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
        </View>

        {!isMinimized && (
          <>
            <ScrollView 
              style={styles.infoContent}
              contentContainerStyle={styles.infoContentContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {isSearching ? (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  {estimatedFare && (
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>Preço estimado</Text>
                      <Text style={styles.priceValue}>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(estimatedFare)}
                      </Text>
                    </View>
                  )}
                </View>
              ) : assignedDriver ? (
                  <View>
                    <Text style={styles.sectionLabel}>Motorista</Text>
                    {/* Informações do Motorista */}
                    <View style={styles.driverContainer}>
                      <Avatar
                        uri={assignedDriver.photoUrl || apiService.getProfilePhotoUrl(assignedDriver.id)}
                        name={assignedDriver.name}
                        size={48}
                      />
                      <View style={styles.driverInfo}>
                        <Text style={styles.driverName}>{assignedDriver.name}</Text>
                        {assignedDriver.rating && (
                          <StarRating
                            rating={assignedDriver.rating}
                            maxRating={10}
                            starCount={5}
                            starSize={14}
                            showRatingText={true}
                          />
                        )}
                      </View>
                    </View>

                    <Text style={styles.sectionLabel}>Veículo</Text>
                    {/* Informações do Veículo */}
                    {assignedDriver.vehicle && (
                      <View style={styles.vehicleContainer}>
                        <View style={styles.vehicleIconContainer}>
                          <Ionicons name="car" size={16} color={colors.primary} />
                        </View>
                        <View style={styles.vehicleContent}>
                          <Text style={styles.vehicleLabel}>VEÍCULO</Text>
                          {assignedDriver.vehicle.model && (
                            <Text style={styles.vehicleDetailText} numberOfLines={1}>
                              {assignedDriver.vehicle.model}
                            </Text>
                          )}
                          <View style={styles.vehicleDetailsRow}>
                            {assignedDriver.vehicle.plate && (
                              <View style={styles.vehicleDetailItem}>
                                <Text style={styles.vehicleDetailLabel}>Placa</Text>
                                <Text style={styles.vehicleDetailValue}>{assignedDriver.vehicle.plate}</Text>
                              </View>
                            )}
                            {assignedDriver.vehicle.color && (
                              <View style={styles.vehicleDetailItem}>
                                <Text style={styles.vehicleDetailLabel}>Cor</Text>
                                <Text style={styles.vehicleDetailValue}>{assignedDriver.vehicle.color}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    )}

                    <Text style={styles.sectionLabel}>Destino</Text>
                    {/* Informações do Destino */}
                    {destination && destination.lat !== 0 && destination.lng !== 0 && (
                      <View style={styles.destinationContainer}>
                        <View style={styles.destinationIconContainer}>
                          <Ionicons name="flag" size={16} color={colors.primary} />
                        </View>
                        <View style={styles.destinationContent}>
                          <Text style={styles.destinationLabel}>DESTINO</Text>
                          <Text style={styles.destinationText} numberOfLines={2}>
                            {destinationAddress || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                ) : null}
            </ScrollView>

            {/* Botão de Cancelar (apenas durante a busca) */}
            {isSearching && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelRide}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>Cancelar Corrida</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </Card>

      <TouchableOpacity
        style={[
          styles.chatFab,
          {
            bottom: cardHeight + Math.max(insets.bottom, spacing.md) + spacing.md + 8,
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

      <TouchableOpacity
        style={[
          styles.locationFab,
          {
            bottom: cardHeight + Math.max(insets.bottom, spacing.md) + spacing.md + 8,
          },
        ]}
        onPress={handleRecenterLocation}
        activeOpacity={0.8}
      >
        <Ionicons name="location-outline" size={24} color="#34C759" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.zoomFab,
          {
            bottom: cardHeight + Math.max(insets.bottom, spacing.md) + spacing.md + 8 + 64, // 56 (altura do botão) + 8 (espaçamento)
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
            bottom: cardHeight + Math.max(insets.bottom, spacing.md) + spacing.md + 8 + 128, // 56 (altura do botão) * 2 + 8 (espaçamento) * 2
          },
        ]}
        onPress={handleZoomOut}
        activeOpacity={0.8}
      >
        <Ionicons name="remove" size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* FAB de Informações do Motorista - Só aparece quando motorista ACEITOU */}
      {hasShownDriverModal && assignedDriver && hasDriverAccepted(activeTrip?.status || tripStatus) && (
        <TouchableOpacity
          style={[
            styles.infoFab,
            {
              top: topBarHeight + spacing.md,
            },
          ]}
          onPress={handleShowDriverInfo}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Modal de Avaliação do Motorista (Passageiro) */}
      <Modal
        visible={ratingModalVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={handleSkipPassengerRating}
      >
        <View
          style={[
            styles.ratingOverlay,
            { backgroundColor: 'rgba(0,0,0,0.45)' },
          ]}
        >
          <KeyboardAvoidingView
            style={styles.ratingOverlayContent}
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 24 : insets.bottom + 24}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.ratingOverlayContent}>
                <View style={[styles.ratingCardModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.ratingHeader}>
                    <View style={styles.ratingHeaderContent}>
                      <Text style={[styles.ratingTitle, { color: colors.textPrimary }]}>Avaliar motorista</Text>
                      <Text style={[styles.ratingSubtitle, { color: colors.textSecondary }]}>
                        Como foi a corrida?
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.ratingCard,
                      {
                        borderColor: hexToRgba(ratingAccentColor, 0.18),
                        backgroundColor: hexToRgba(ratingAccentColor, 0.06),
                      },
                    ]}
                  >
                    <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>Sua nota</Text>

                    <View style={styles.ratingStarsRow}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <TouchableOpacity
                          key={value}
                          style={styles.ratingStarButton}
                          onPress={() => {
                            setRatingValue(value);
                            setHasUserClickedStar(true);
                          }}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name={value <= ratingValue ? 'star' : 'star-outline'}
                            size={28}
                            color={ratingAccentColor}
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
                      styles.ratingInput,
                      {
                        borderColor: colors.border,
                        color: colors.textPrimary,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder="Comentário (opcional)"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    maxLength={300}
                    value={ratingComment}
                    onChangeText={setRatingComment}
                  />

                  <View style={styles.ratingActions}>
                    <Button
                      title="Enviar avaliação"
                      onPress={handleSubmitPassengerRating}
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

      {/* Modal de Motorista Chegou */}
      <Modal
        visible={arrivalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setArrivalModalVisible(false)}
      >
        <View style={styles.arrivalBackdrop}>
          <View style={[styles.arrivalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.arrivalTitle, { color: colors.textPrimary }]}>Seu motorista chegou</Text>
            <Text style={[styles.arrivalSubtitle, { color: colors.textSecondary }]}>
              Ele já está no ponto de embarque. Envie uma mensagem se precisar.
            </Text>
            <Button
              title="Ok"
              onPress={() => setArrivalModalVisible(false)}
              fullWidth
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Motorista Aceito - Só aparece quando motorista ACEITOU a corrida */}
      <Modal
        visible={showDriverAcceptedModal && assignedDriver !== null && hasDriverAccepted(activeTrip?.status || tripStatus)}
        transparent={false}
        animationType="fade"
        onRequestClose={handleCloseDriverModal}
      >
        <View style={[styles.modalFullScreen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.modalFullScreenContent}>
            {/* 1. Header: Sucesso e Título */}
            <View style={styles.modalTopSection}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark" size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.modalTitle}>Motorista a Caminho!</Text>
              <Text style={styles.modalSubtitle}>Seu motorista aceitou a corrida</Text>
            </View>

            {/* 2. Centro: Card do Motorista */}
            <View style={styles.modalCenterSection}>
              {assignedDriver && (
                <View style={styles.driverProfileCard}>
                  {/* Avatar com Borda e Sombra */}
                  <View style={styles.avatarWrapper}>
                    <Avatar
                      uri={assignedDriver.photoUrl}
                      size={110}
                      name={assignedDriver.name}
                    />
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                    </View>
                  </View>

                  {/* Nome e Rating */}
                  <View style={styles.driverInfoContainer}>
                    <Text style={styles.modalDriverName}>{assignedDriver.name}</Text>
                    
                    {assignedDriver.rating !== undefined && assignedDriver.rating !== null && (
                      <View style={styles.ratingBadge}>
                        <StarRating
                          rating={assignedDriver.rating}
                          starSize={20}
                          showRatingText={true}
                          textStyle={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginLeft: 6, lineHeight: 22 }}
                          style={{ alignItems: 'center', justifyContent: 'center' }}
                        />
                      </View>
                    )}
                  </View>

                  {/* Detalhes do Veículo em Grid */}
                  {assignedDriver.vehicle && (
                    <View style={styles.modalVehicleGrid}>
                      <View style={styles.modalVehicleHeaderPill}>
                        <Ionicons name="car-sport" size={20} color={colors.primary} />
                        <Text style={styles.modalVehicleHeaderTitle}>Veículo Confirmado</Text>
                      </View>
                      
                      <View style={styles.modalVehicleDetailsContainer}>
                        {/* Modelo */}
                        <View style={styles.modalVehicleDetailBlock}>
                          <Text style={styles.modalVehicleDetailLabel}>MODELO</Text>
                          <Text style={styles.modalVehicleDetailValue} numberOfLines={1}>
                            {assignedDriver.vehicle.model || '-'}
                          </Text>
                        </View>
                        
                        <View style={styles.modalVehicleDivider} />

                        {/* Placa */}
                        <View style={styles.modalVehicleDetailBlock}>
                          <Text style={styles.modalVehicleDetailLabel}>PLACA</Text>
                          <Text style={[styles.modalVehicleDetailValue, { color: colors.textPrimary }]}>
                            {assignedDriver.vehicle.plate || '-'}
                          </Text>
                        </View>

                        <View style={styles.modalVehicleDivider} />

                        {/* Cor */}
                        <View style={styles.modalVehicleDetailBlock}>
                          <Text style={styles.modalVehicleDetailLabel}>COR</Text>
                          <Text style={styles.modalVehicleDetailValue}>
                            {assignedDriver.vehicle.color || '-'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* 3. Fundo: Botão de Ação */}
            <View style={styles.modalBottomSection}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleCloseDriverModal}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Estou te Esperando! 👋</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {isChatOpen && rideId && currentRideId === rideId && (
        <ChatWindow
          rideId={rideId}
          otherUserName={assignedDriver?.name || 'Motorista'}
          otherUserPhoto={assignedDriver?.photoUrl}
        />
      )}
      
      {/* Faixa de background inferior (safe area) */}
      {insets.bottom > 0 && <View style={styles.bottomSafeArea} />}
    </View>
  );
};


