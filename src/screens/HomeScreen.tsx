import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '@/components/Button';
import { Card } from '@/components/Card';
import { TileMap, TileMapRef } from '@/components/TileMap';
import { shadows, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useTrip } from '@/context/TripContext';
import { apiService } from '@/services/api';
import { searchPlaces, reverseGeocode as placesReverseGeocode, getPlaceDetails, PlacesSearchResult, resetSessionToken } from '@/services/placesService';

interface HomeScreenProps {
  navigation: any;
}

const { height } = Dimensions.get('window');

interface SearchResult {
  place_id: string | number;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

// Cache para armazenar resultados de busca
const searchCache = new Map<string, SearchResult[]>();

// Coordenadas de Sorriso, MT e bounding box para filtrar resultados
const SORRISO_LAT = -12.5458;
const SORRISO_LON = -55.7061;
// Bounding box de Sorriso (min_lon, min_lat, max_lon, max_lat)
// Margem de ~0.15 graus (~15-20km) ao redor do centro da cidade
const SORRISO_BBOX = '-55.8561,-12.6958,-55.5561,-12.3958';

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { activeTrip, isLoading: isTripLoading } = useTrip();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<SearchResult | null>(null);
  const [cityName, setCityName] = useState<string>(''); // Nome da cidade para passar na busca
  const [stateName, setStateName] = useState<string>(''); // Estado para passar na busca
  const [showHelperText, setShowHelperText] = useState(false); // Controle da mensagem de ajuda
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  const isSelectingRef = useRef(false);
  const mapRef = useRef<TileMapRef>(null);
  const [hasUserMovedMap, setHasUserMovedMap] = useState(false);
  const [cardHeight, setCardHeight] = useState(220); // altura padrão
  const [searchBarHeight, setSearchBarHeight] = useState(0); // altura da barra de pesquisa
  const [isLocating, setIsLocating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mapZoom, setMapZoom] = useState(14); // Zoom padrão mais afastado
  const hasRequestedLocationRef = useRef(false);
  const isRequestingLocationRef = useRef(false);
  const lastLocationRequestRef = useRef<number>(0); // Timestamp da última requisição de localização
  const lastLocationUpdateRef = useRef<number>(0); // Timestamp da última localização válida conhecida
  const [isCheckingActiveRide, setIsCheckingActiveRide] = useState(true);

  // Detecta se o usuário é motorista
  const isDriver = user?.roles?.includes('driver') || user?.type === 'motorista' || user?.type === 'driver';

  /**
   * Normaliza status de corrida vindos da API para o formato interno usado no app
   * - Remove espaços extras
   * - Converte para maiúsculas
   * - Converte espaços em underscore
   * - Aplica mapeamentos para versões legadas como "MOTORISTA A CAMINHO" → "MOTORISTA_A_CAMINHO"
   */
  const normalizeRideStatus = (rawStatus?: string | null): string => {
    if (!rawStatus) return 'REQUESTED';

    let normalized = rawStatus.trim().toUpperCase();

    const explicitMap: Record<string, string> = {
      'AGUARDANDO MOTORISTA': 'AGUARDANDO_MOTORISTA',
      'MOTORISTA ENCONTRADO': 'DRIVER_ASSIGNED', // Mapeia para DRIVER_ASSIGNED (alinhado com TripContext)
      'MOTORISTA_ENCONTRADO': 'DRIVER_ASSIGNED', // Também mapeia versão com underscore
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
      'AGUARDANDO_AVALIACAO': 'AGUARDANDO_AVALIACAO',
      'AGUARDANDO AVALIACAO': 'AGUARDANDO_AVALIACAO',
      'CONCLUIDA': 'CONCLUIDA',
      // Frases completas de cancelamento/expiração (todas as variações possíveis)
      'CANCELADO PELO MOTORISTA': 'CANCELED_BY_DRIVER',
      'CANCELADA PELO MOTORISTA': 'CANCELED_BY_DRIVER',
      'CANCELADO_PELO_MOTORISTA': 'CANCELED_BY_DRIVER',
      'CANCELADA_PELO_MOTORISTA': 'CANCELED_BY_DRIVER',
      'CANCELADA_MOTORISTA': 'CANCELED_BY_DRIVER',
      'CANCELADO PELO PASSAGEIRO': 'CANCELED_BY_PASSENGER',
      'CANCELADA PELO PASSAGEIRO': 'CANCELED_BY_PASSENGER',
      'CANCELADO_PELO_PASSAGEIRO': 'CANCELED_BY_PASSENGER',
      'CANCELADA_PELO_PASSAGEIRO': 'CANCELED_BY_PASSENGER',
      'CANCELADA_PASSAGEIRO': 'CANCELED_BY_PASSENGER',
      'CORRIDA EXPIRADA': 'EXPIRED',
      'CORRIDA_EXPIRADA': 'EXPIRED',
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

    // Fallback genérico
    normalized = normalized.replace(/\s+/g, '_');
    return normalized;
  };

  // Chaves para cache
  const CACHE_KEYS = {
    USER_LOCATION: '@vamu:user_location',
    LOCATION_TIMESTAMP: '@vamu:location_timestamp',
  };

  // Cache válido por 5 minutos
  const CACHE_VALIDITY_MS = 5 * 60 * 1000;

  // Throttling de 30 segundos para evitar sobrecarregar a VPS
  const LOCATION_REQUEST_THROTTLE_MS = 30 * 1000; // 30 segundos
  // Considera localização antiga após 2 minutos
  const LOCATION_STALE_MS = 2 * 60 * 1000;
  // Idade máxima aceitável para usar a última localização conhecida do dispositivo
  const LAST_KNOWN_MAX_AGE_MS = 3 * 60 * 1000;

  const handleMapMove = () => {
    setHasUserMovedMap(true);
  };

  const handleRecenterLocation = async () => {
    // Previne múltiplos cliques simultâneos
    if (isRequestingLocationRef.current) {
      return;
    }

    // Usuário mexeu no mapa - recentra na última localização conhecida sem alterar zoom
    if (userLocation) {
      // Reset imediato sem buscar nova localização e sem alterar zoom
      setMapCenter(userLocation);
      if (mapRef.current) {
        mapRef.current.centerOnLocation(userLocation.lat, userLocation.lon);
      }
      setHasUserMovedMap(false);
    } else {
      // Se não tem localização ainda, pede permissão
      isRequestingLocationRef.current = true;
      await requestLocationPermission();
      isRequestingLocationRef.current = false;
    }
  };

  // Valores de zoom predefinidos
  const ZOOM_LEVELS = [12, 14, 16, 18, 20];

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

  // Função para calcular distância entre dois pontos (fórmula de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
  };


  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const normalizedQuery = query.trim().toLowerCase();

    // Verifica o cache primeiro
    if (searchCache.has(normalizedQuery)) {
      const cachedResults = searchCache.get(normalizedQuery)!;
      setSearchResults(cachedResults);
      setShowResults(true);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      // IMPORTANTE: Tenta obter localização do usuário se não estiver disponível
      // Isso garante que a busca SEMPRE priorize locais próximos
      if (!userLocation) {
        console.log('[HomeScreen] 📍 Localização não disponível, tentando obter...');
        await requestLocationPermission();
      }

      // Usa Places API para busca
      // SEMPRE passa localização do usuário para priorizar locais próximos
      // Conforme documentação: radius 30km + strictBounds true = restringe à cidade
      let location = undefined;

      if (userLocation) {
        location = {
          lat: userLocation.lat,
          lng: userLocation.lon,
        };

        // Adiciona cidade e estado se disponíveis (melhora precisão da busca)
        if (cityName) {
          (location as any).city = cityName;
        }
        if (stateName) {
          (location as any).state = stateName;
        }
      }

      const radius = 30000; // 30km (conforme documentação - limita à cidade)
      const strictBounds = true; // Restringe resultados ao raio

      if (!location) {
        console.warn('[HomeScreen] ⚠️ Busca sem localização - resultados podem não ser precisos');
      } else {
        console.log('[HomeScreen] 📍 Buscando com localização do usuário:', {
          lat: location.lat.toFixed(4),
          lng: location.lng.toFixed(4),
          city: (location as any).city || 'N/A',
          state: (location as any).state || 'N/A',
          radius: `${radius / 1000}km`,
          strictBounds,
        });
      }

      const results = await searchPlaces(query.trim(), location, radius, strictBounds);

      // Converte PlacesSearchResult para SearchResult (compatibilidade)
      const filteredResults: SearchResult[] = results.map((item) => ({
        place_id: item.place_id,
        name: item.name,
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
        type: item.type,
      }));

      // Armazena no cache
      searchCache.set(normalizedQuery, filteredResults);

      // Limita o cache a 50 entradas para não consumir muita memória
      if (searchCache.size > 50) {
        const firstKey = searchCache.keys().next().value;
        if (firstKey) {
          searchCache.delete(firstKey);
        }
      }

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce para pesquisa automática
  useEffect(() => {
    // Se estamos selecionando um resultado, não dispara a busca
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    // Limpa o timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Se o input estiver vazio, limpa os resultados
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    // Define um novo timer para buscar após 500ms de inatividade
    debounceTimerRef.current = setTimeout(() => {
      searchLocation(searchQuery);
    }, 500);

    // Cleanup do timer quando o componente desmontar ou o query mudar
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setIsSearching(false);
  };

  const handleSelectLocation = async (result: SearchResult) => {
    // Fecha o teclado automaticamente ao selecionar um endereço
    Keyboard.dismiss();

    // Marca que estamos selecionando para não disparar busca automática
    isSelectingRef.current = true;
    setSearchQuery(result.name);
    setShowResults(false);

    // Se não temos coordenadas, busca os detalhes do lugar
    let finalResult = result;
    if ((!result.lat || result.lat === '') && result.place_id) {
      try {
        const details = await getPlaceDetails(result.place_id.toString());
        if (details) {
          finalResult = {
            ...result,
            lat: details.lat.toString(),
            lon: details.lng.toString(),
            name: details.name || result.name,
            display_name: details.formattedAddress || result.display_name,
          };
          // Reseta o session token após selecionar um lugar
          resetSessionToken();
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes do lugar:', error);
      }
    } else {
      // Reseta o session token após selecionar um lugar
      resetSessionToken();
    }

    setSelectedDestination(finalResult);
    // Abre o container automaticamente se estiver minimizado
    setIsMinimized(false);
    // Não centraliza mais o mapa - apenas mostra a seta de direção
    // A seta será renderizada automaticamente pelo TileMap quando destinationLocation for passado
  };

  // Converter localização para endereço usando reverse geocoding da API
  const reverseGeocode = async (lat: number, lon: number): Promise<SearchResult | null> => {
    try {
      const result = await placesReverseGeocode(lat, lon);

      if (result) {
        return {
          place_id: result.place_id,
          name: result.name,
          display_name: result.display_name,
          lat: result.lat,
          lon: result.lon,
          type: result.type,
        };
      }
    } catch (error) {
      console.error('Erro no reverse geocoding:', error);
    }
    return null;
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

    setUserLocation(normalizedLocation);
    setMapCenter(normalizedLocation);

    if (options.centerMap !== false && mapRef.current) {
      mapRef.current.centerOnLocation(normalizedLocation.lat, normalizedLocation.lon);
    }
  };

  // Carregar localização do cache
  const loadCachedLocation = async (): Promise<{ lat: number; lon: number } | null> => {
    try {
      const cachedLocation = await AsyncStorage.getItem(CACHE_KEYS.USER_LOCATION);
      const cachedTimestamp = await AsyncStorage.getItem(CACHE_KEYS.LOCATION_TIMESTAMP);

      if (cachedLocation && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();

        // Verifica se o cache ainda é válido (menos de 5 minutos)
        if (now - timestamp < CACHE_VALIDITY_MS) {
          lastLocationUpdateRef.current = timestamp;
          return JSON.parse(cachedLocation);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar localização do cache:', error);
    }
    return null;
  };

  // Salvar localização no cache
  const saveLocationToCache = async (location: { lat: number; lon: number }) => {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.USER_LOCATION, JSON.stringify(location));
      await AsyncStorage.setItem(CACHE_KEYS.LOCATION_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error('Erro ao salvar localização no cache:', error);
    }
  };

  // Tenta obter localização mais recente sem bloquear a UI (última conhecida ou cache)
  const warmStartLocation = async (): Promise<{ lat: number; lon: number } | null> => {
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

        applyLocationUpdate(lastKnownLocation);
        // Atualiza cache de forma oportunista para futuras aberturas
        saveLocationToCache({ lat: lastKnownLocation.lat, lon: lastKnownLocation.lon }).catch(() => { });
        return { lat: lastKnownLocation.lat, lon: lastKnownLocation.lon };
      }
    } catch (error) {
      console.warn('[HomeScreen] Não foi possível obter última localização conhecida:', error);
    }

    const cachedLocation = await loadCachedLocation();
    if (cachedLocation) {
      applyLocationUpdate({ ...cachedLocation, timestamp: lastLocationUpdateRef.current });
      return cachedLocation;
    }

    return null;
  };

  // Solicitar permissão e capturar localização (otimizado com cache, timeout de 2s e throttling de 30s)
  const requestLocationPermission = async (forceRefresh: boolean = false) => {
    try {
      const now = Date.now();
      const locationWasStale = isLocationStale();

      // Mostra algo rápido (última conhecida/cache) enquanto buscamos algo mais atual
      if ((!userLocation || locationWasStale) && !forceRefresh) {
        await warmStartLocation();
      }

      // Se já temos uma localização recente, evita nova chamada
      if (!forceRefresh && userLocation && !isLocationStale()) {
        return;
      }

      // Throttling: só permite nova requisição se passaram 30 segundos desde a última
      if (!forceRefresh && lastLocationRequestRef.current > 0 && now - lastLocationRequestRef.current < LOCATION_REQUEST_THROTTLE_MS) {
        // Usa cache se disponível (dentro do período de throttling)
        const cachedLocation = await loadCachedLocation();
        if (cachedLocation) {
          applyLocationUpdate({ ...cachedLocation, timestamp: lastLocationUpdateRef.current });
          // Não preenche mais o input automaticamente - apenas mostra no mapa
        }
        return;
      }

      setIsLocating(true);
      // Atualiza timestamp apenas quando realmente vai fazer requisição
      lastLocationRequestRef.current = now;

      // Tenta carregar do cache primeiro (se não for refresh forçado)
      if (!forceRefresh) {
        const cachedLocation = await loadCachedLocation();
        if (cachedLocation) {
          applyLocationUpdate({ ...cachedLocation, timestamp: lastLocationUpdateRef.current });
          setIsLocating(false);

          // Não preenche mais o input automaticamente - apenas mostra no mapa

          // Atualiza em background sem bloquear (respeitando throttling)
          const timeSinceLastRequest = Date.now() - lastLocationRequestRef.current;
          if (timeSinceLastRequest >= LOCATION_REQUEST_THROTTLE_MS) {
            requestLocationPermission(true).catch(() => {
              // Ignora erros no refresh em background
            });
          }
          return;
        }
      }

      // Timeout de 2 segundos para garantir resposta rápida
      const locationPromise = (async () => {
        // Verifica permissão primeiro (mais rápido)
        const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
        if (currentStatus !== 'granted') {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setIsLocating(false);
            Alert.alert('Permissão negada', 'Precisamos da sua localização para melhorar a experiência.');
            return null;
          }
        }

        // Usa precisão balanceada para obter resposta rápida sem depender apenas do GPS
        return await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      })();

      // Timeout de 2 segundos total
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 2000);
      });

      const location = await Promise.race([locationPromise, timeoutPromise]);

      if (!location) {
        // Timeout ou erro - usa cache se disponível ou localização padrão
        const cachedLocation = await loadCachedLocation();
        if (cachedLocation) {
          applyLocationUpdate({ ...cachedLocation, timestamp: lastLocationUpdateRef.current });
          // Não preenche mais o input automaticamente - apenas mostra no mapa
        } else {
          // Se não tem cache e timeout, tenta novamente após um delay
          // Não usa localização fixa - sempre busca a localização real
          setTimeout(() => {
            requestLocationPermission(true).catch(() => {
              // Se falhar novamente, apenas loga o erro
              console.warn('[HomeScreen] Não foi possível obter localização');
            });
          }, 3000);
        }
        setIsLocating(false);
        return;
      }

      const { latitude, longitude } = location.coords;
      const newLocation = { lat: latitude, lon: longitude };

      // Salva no cache
      await saveLocationToCache(newLocation);

      // Atualiza localização e centraliza o mapa imediatamente
      applyLocationUpdate({ ...newLocation, timestamp: location.timestamp });

      // Fecha o overlay imediatamente após obter a localização
      setIsLocating(false);

      // Busca cidade e estado em background (para usar na busca de lugares)
      // Isso melhora a precisão da busca ao enviar location.city e location.state
      placesReverseGeocode(latitude, longitude).then((result) => {
        if (result && result.display_name) {
          // Tenta extrair cidade e estado do endereço
          const parts = result.display_name.split(',').map(p => p.trim());
          if (parts.length >= 2) {
            // Formato típico: "Rua X, Bairro, Cidade, Estado, País"
            const city = parts[parts.length - 3] || ''; // Cidade geralmente é a 3ª de trás pra frente
            const state = parts[parts.length - 2] || ''; // Estado geralmente é a 2ª de trás pra frente

            if (city) setCityName(city);
            if (state) setStateName(state);

            console.log('[HomeScreen] 🏙️ Cidade/Estado detectados:', { city, state });
          }
        }
      }).catch((error) => {
        console.warn('[HomeScreen] ⚠️ Não foi possível obter cidade/estado:', error);
      });

      // Não preenche mais o input automaticamente - apenas mostra no mapa
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      setIsLocating(false);

      // Tenta usar cache em caso de erro
      const cachedLocation = await loadCachedLocation();
      if (cachedLocation) {
        applyLocationUpdate({ ...cachedLocation, timestamp: lastLocationUpdateRef.current });
        // Não preenche mais o input automaticamente - apenas mostra no mapa
      }
    }
  };

  // Carregar localização do cache ao montar o componente
  useEffect(() => {
    const loadInitialLocation = async () => {
      if (!userLocation) {
        await warmStartLocation();
      }
    };
    loadInitialLocation();
  }, []);

  // Verifica corrida ativa ao montar - se houver, navega direto para a tela de corrida (apenas para passageiros)
  useEffect(() => {
    // Só verifica se não for motorista
    if (isDriver) {
      setIsCheckingActiveRide(false);
      return;
    }

    let isMounted = true;

    const checkActiveRide = async () => {
      try {
        console.log('[HomeScreen] Verificando se há corrida ativa do passageiro...');
        const response = await apiService.getPassengerActiveRide();

        if (!isMounted) return;

        if (response.success && response.data) {
          const rideData = response.data;
          console.log('[HomeScreen] Corrida ativa encontrada:', rideData.id);

          // Normaliza status recebido da API para nossa convenção interna
          const normalizedStatus = normalizeRideStatus(rideData.status);

          // Verifica se a corrida não foi cancelada ou tem status inválido
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
            'AGUARDANDO_AVALIACAO',
            // MOTORISTA_ENCONTRADO é um status antigo/inválido (deve ser DRIVER_ASSIGNED)
            'MOTORISTA_ENCONTRADO',
          ];

          // Status válidos que devem redirecionar (aguardando + em rota)
          const validStatuses = [
            // Aguardando motorista / aceitação
            'REQUESTED',
            'AGUARDANDO_MOTORISTA',
            'DRIVER_ASSIGNED', // Status normalizado de MOTORISTA_ENCONTRADO
            'MOTORISTA_ACEITOU',
            'DRIVER_ON_THE_WAY',
            'MOTORISTA_A_CAMINHO',
            'DRIVER_NEARBY',
            'MOTORISTA_PROXIMO',
            'DRIVER_ARRIVING',
            // Em rota / em andamento
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

          // Verificação adicional: se o status indica que deveria haver motorista mas não há,
          // pode ser que a corrida foi cancelada mas o status não foi atualizado
          const statusesRequiringDriver = [
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

          const shouldHaveDriver = statusesRequiringDriver.includes(normalizedStatus);
          const hasDriver = !!(rideData.driver || rideData.driverId);

          // Se o status é inválido ou não está na lista de válidos, limpa storage e não navega
          if (invalidStatuses.includes(normalizedStatus) || !validStatuses.includes(normalizedStatus)) {
            console.log('[HomeScreen] Corrida com status inválido/cancelado, limpando storage e ignorando:', rideData.status, '=>', normalizedStatus);

            // Limpa o AsyncStorage
            try {
              await AsyncStorage.removeItem('@vamu:active_trip_id');
              await AsyncStorage.removeItem('@vamu:active_trip_data');
              console.log('[HomeScreen] Storage limpo devido a status inválido');
            } catch (error) {
              console.error('[HomeScreen] Erro ao limpar storage:', error);
            }

            setIsCheckingActiveRide(false);
            return;
          }

          // Verificação adicional: se o status requer motorista mas não há motorista,
          // trata como cancelada (pode ser cache/status desatualizado)
          if (shouldHaveDriver && !hasDriver) {
            console.log('[HomeScreen] ⚠️ Status requer motorista mas não há motorista, tratando como cancelada:', normalizedStatus);

            // Limpa o AsyncStorage
            try {
              await AsyncStorage.removeItem('@vamu:active_trip_id');
              await AsyncStorage.removeItem('@vamu:active_trip_data');
              console.log('[HomeScreen] Storage limpo devido a falta de motorista');
            } catch (error) {
              console.error('[HomeScreen] Erro ao limpar storage:', error);
            }

            setIsCheckingActiveRide(false);
            return;
          }

          // Converte para o formato esperado pela tela
          // A API pode retornar pickup/origin e destination
          const apiOrigin = rideData.pickup || rideData.origin;
          const apiDestination = rideData.destination;

          const origin = apiOrigin
            ? {
              lat: apiOrigin.lat ?? apiOrigin.latitude ?? 0,
              lng: apiOrigin.lng ?? apiOrigin.longitude ?? apiOrigin.lon ?? 0,
            }
            : { lat: 0, lng: 0 };

          const destination = apiDestination
            ? {
              lat: apiDestination.lat ?? apiDestination.latitude ?? 0,
              lng: apiDestination.lng ?? apiDestination.longitude ?? apiDestination.lon ?? 0,
            }
            : { lat: 0, lng: 0 };

          // Permite navegação mesmo com origem/destino inválidos
          // A localização será obtida via GPS e o WebSocket será conectado
          if (destination.lat === 0 && destination.lng === 0) {
            console.log('[HomeScreen] Destino inválido da API, mas continuando com reconexão...');
          }

          // Determina para qual tela navegar baseado no status
          // Só navega e salva se o status for válido
          const waitingStatuses = [
            'REQUESTED',
            'AGUARDANDO_MOTORISTA',
            'DRIVER_ASSIGNED', // Status normalizado (MOTORISTA_ENCONTRADO → DRIVER_ASSIGNED)
            'MOTORISTA_ACEITOU',
            'DRIVER_ON_THE_WAY',
            'MOTORISTA_A_CAMINHO',
            'DRIVER_NEARBY',
            'MOTORISTA_PROXIMO',
            'DRIVER_ARRIVING',
          ];
          const inProgressStatuses = [
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

          // Verifica se o status é válido antes de processar
          if (!waitingStatuses.includes(normalizedStatus) && !inProgressStatuses.includes(normalizedStatus)) {
            // Status não reconhecido ou inválido - não navega e limpa storage
            console.log('[HomeScreen] Status inválido/não reconhecido, limpando storage e não navegando:', rideData.status, '=>', normalizedStatus);
            try {
              await AsyncStorage.removeItem('@vamu:active_trip_id');
              await AsyncStorage.removeItem('@vamu:active_trip_data');
            } catch (error) {
              console.error('[HomeScreen] Erro ao limpar storage:', error);
            }
            setIsCheckingActiveRide(false);
            return;
          }

          const tripData = {
            id: rideData.id,
            trip_id: rideData.id,
            origin: origin,
            destination: destination,
            estimated_fare: rideData.estimatedPrice || rideData.estimated_fare || 0,
            final_fare: rideData.finalPrice || rideData.final_fare,
            distance_km: rideData.distanceKm || rideData.distance_km,
            duration_seconds: rideData.durationMinutes ? rideData.durationMinutes * 60 : (rideData.duration_seconds || 0),
            driver: rideData.driver ? {
              id: rideData.driver.id || rideData.driverId,
              name: rideData.driver.name,
              rating: rideData.driver.rating,
              vehicle: rideData.driver.vehicle,
            } : undefined,
            status: normalizedStatus,
          };

          // Salva no AsyncStorage apenas se o status for válido
          try {
            await AsyncStorage.setItem('@vamu:active_trip_id', rideData.id);
            await AsyncStorage.setItem('@vamu:active_trip_data', JSON.stringify({
              id: rideData.id,
              status: normalizedStatus,
              origin: tripData.origin,
              destination: tripData.destination,
              estimated_fare: rideData.estimatedPrice,
              final_fare: rideData.finalPrice,
              distance_km: rideData.distanceKm,
              duration_seconds: tripData.duration_seconds,
              driver: tripData.driver,
            }));
          } catch (error) {
            console.error('[HomeScreen] Erro ao salvar corrida ativa no storage:', error);
          }

          if (waitingStatuses.includes(normalizedStatus)) {
            // Navega para WaitingForDriver
            console.log('[HomeScreen] Navegando para WaitingForDriver...');
            navigation.replace('WaitingForDriver', {
              tripId: rideData.id,
              tripData: tripData,
            });
          } else if (inProgressStatuses.includes(rideData.status)) {
            // Navega para WaitingForDriver (corrida em andamento)
            console.log('[HomeScreen] Navegando para WaitingForDriver (in progress)...');
            navigation.replace('WaitingForDriver', {
              tripId: rideData.id,
              tripData: tripData,
              userLocation: origin,
              destination: destination,
            });
          }
        } else {
          // Não há corrida ativa, continua normalmente
          console.log('[HomeScreen] Nenhuma corrida ativa encontrada');
          setIsCheckingActiveRide(false);
        }
      } catch (error) {
        console.error('[HomeScreen] Erro ao verificar corrida ativa:', error);
        if (isMounted) {
          setIsCheckingActiveRide(false);
        }
      }
    };

    checkActiveRide();

    return () => {
      isMounted = false;
    };
  }, [navigation, isDriver]);

  // Buscar localização do usuário quando a tela entrar em foco (após onboarding)
  useFocusEffect(
    React.useCallback(() => {
      // Busca localização ao focar, inclusive quando a última leitura estiver "velha"
      if (!isCheckingActiveRide) {
        const shouldForceRefresh = isLocationStale();
        const shouldRequest = !hasRequestedLocationRef.current || !userLocation || shouldForceRefresh;

        if (shouldRequest) {
          hasRequestedLocationRef.current = true;
          // Pequeno delay para garantir que a tela já está renderizada
          const timer = setTimeout(() => {
            requestLocationPermission(shouldForceRefresh);
          }, shouldForceRefresh ? 150 : 300);

          return () => {
            clearTimeout(timer);
          };
        }
      }
      // Se não precisa buscar, não precisa limpar nada
      return undefined;
    }, [userLocation, isCheckingActiveRide])
  );

  // Função para decodificar polyline do OSRM (não mais usada, mantida para compatibilidade)
  const decodePolyline = (encoded: string): Array<{ lat: number; lon: number }> => {
    const coordinates: Array<{ lat: number; lon: number }> = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      coordinates.push({
        lat: lat * 1e-5,
        lon: lng * 1e-5,
      });
    }

    return coordinates;
  };

  // Handler para solicitar corrida
  const handleRequestTrip = async () => {
    if (!selectedDestination) {
      // Alert.alert('Atenção', 'Por favor, selecione um destino primeiro.');

      // Mostra a mensagem de ajuda
      setShowHelperText(true);

      // Foca no input de busca para uma experiência mais fluida
      // Força o blur antes do focus para garantir que o teclado abra mesmo se já estiver focado (bug fix)
      if (searchInputRef.current) {
        if (searchInputRef.current.isFocused()) {
          searchInputRef.current.blur();
        }
        // Pequeno timeout para garantir que o blur seja processado antes do focus
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
      return;
    }

    if (!userLocation) {
      Alert.alert('Atenção', 'Por favor, aguarde a localização ser detectada.');
      return;
    }

    const destination = {
      lat: parseFloat(selectedDestination.lat),
      lng: parseFloat(selectedDestination.lon),
    };

    const origin = {
      lat: userLocation.lat,
      lng: userLocation.lon,
    };

    // Valida se a distância é maior que zero antes de navegar
    // A função calculateDistance retorna a distância em metros
    const distanceInMeters = calculateDistance(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );
    if (distanceInMeters < 10) { // Menos de 10 metros
      Alert.alert('Atenção', 'Selecione um destino primeiro...');
      return;
    }

    // Navega para a tela de preço/estimativa
    navigation.navigate('TripPrice', {
      origin,
      destination,
    });
  };

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Mostra loading enquanto verifica corrida ativa
  if (isCheckingActiveRide && !isDriver) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: colors.background,
      paddingTop: Math.max(insets.top, spacing.md),
      alignItems: 'center',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      width: '100%',
      maxWidth: 600, // Limita a largura máxima para centralizar em telas grandes
      alignSelf: 'center',
    },
    searchInput: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      paddingVertical: spacing.xs,
    },
    searchButton: {
      padding: spacing.xs,
    },
    clearButton: {
      padding: spacing.xs,
    },
    helperText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontSize: 11,
      marginTop: 4,
      marginLeft: 4,
      fontStyle: 'italic',
      alignSelf: 'flex-start',
    },
    resultsContainer: {
      position: 'absolute',
      top: Math.max(insets.top, spacing.md) + 60,
      left: spacing.md,
      right: spacing.md,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: height * 0.4,
      zIndex: 1000,
      ...shadows.medium,
    },
    resultItem: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultItemLast: {
      borderBottomWidth: 0,
    },
    resultName: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    resultAddress: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    loadingContainer: {
      padding: spacing.md,
      alignItems: 'center',
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultsTitle: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    closeButton: {
      padding: spacing.xs,
    },
    mapContainer: {
      flex: 1,
    },
    orderCard: {
      position: 'absolute',
      bottom: 8,
      left: spacing.md,
      right: spacing.md,
      maxHeight: height * 0.35,
    },
    orderHeader: {
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    orderHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs + 2,
    },
    minimizeButton: {
      padding: spacing.xs,
    },
    orderTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    orderInfo: {
      marginBottom: spacing.md,
      gap: spacing.md,
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
      flex: 1,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    timeIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: hexToRgba(colors.textSecondary, 0.06),
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timeLabel: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
    },
    timeValue: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    orderButton: {
      marginTop: spacing.xs,
    },
    fab: {
      position: 'absolute',
      right: spacing.md,
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
    driverFab: {
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
    notificationFab: {
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
  });

  return (
    <View style={styles.container}>
      <View
        style={styles.searchContainer}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setSearchBarHeight(height);
        }}
      >
        <View style={styles.searchBar}>
          <Ionicons name="location-outline" size={20} color={colors.primary} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Para onde enviar?"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length > 0) {
                setShowHelperText(false);
              }
            }}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearSearch}
            >
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.searchButton}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="search" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        {showHelperText && (
          <Text style={styles.helperText}>
            *Digite para escolher o destino....
          </Text>
        )}
        {showResults && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Resultados</Text>
              <TouchableOpacity
                onPress={() => setShowResults(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => String(item.place_id)}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[
                      styles.resultItem,
                      index === searchResults.length - 1 && styles.resultItemLast,
                    ]}
                    onPress={() => handleSelectLocation(item)}
                  >
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultAddress} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                )}
                keyboardShouldPersistTaps="handled"
              />
            ) : searchQuery.trim() ? (
              <View style={styles.resultItem}>
                <Text style={styles.resultAddress}>
                  Nenhum local encontrado em Sorriso, MT
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
      <View style={styles.mapContainer}>
        <TileMap
          ref={mapRef}
          showRoute={false}
          centerLat={mapCenter?.lat || SORRISO_LAT}
          centerLon={mapCenter?.lon || SORRISO_LON}
          zoom={mapZoom}
          userLocation={userLocation || undefined}
          destinationLocation={selectedDestination ? {
            lat: parseFloat(selectedDestination.lat),
            lon: parseFloat(selectedDestination.lon),
          } : undefined}
          onMapMove={handleMapMove}
          bottomContainerHeight={cardHeight + 8}
          topSpaceHeight={searchBarHeight}
          isLocating={isLocating}
        />
      </View>
      <Card
        style={styles.orderCard}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setCardHeight(height);
        }}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 }}>
              <Ionicons name="car-outline" size={20} color={colors.primary} />
              <Text style={styles.orderTitle}>Nova Corrida</Text>
            </View>
            <TouchableOpacity
              style={styles.minimizeButton}
              onPress={() => setIsMinimized(!isMinimized)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMinimized ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {!isMinimized && (
          <View style={styles.orderInfo}>
            <View style={styles.destinationContainer}>
              <View style={styles.destinationIconContainer}>
                <Ionicons name="location" size={18} color={colors.primary} />
              </View>
              <View style={styles.destinationContent}>
                <Text style={styles.destinationLabel}>Destino</Text>
                <Text style={styles.destinationText} numberOfLines={2}>
                  {selectedDestination ? selectedDestination.display_name : 'Selecione um destino'}
                </Text>
              </View>
            </View>

            {selectedDestination && (
              <View style={styles.timeContainer}>
                <View style={styles.timeIconContainer}>
                  <Ionicons name="time" size={16} color={colors.textSecondary} />
                </View>
                <View style={styles.timeContent}>
                  <Text style={styles.timeLabel}>Tempo estimado</Text>
                  <Text style={styles.timeValue}>30 min</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <Button
          title="Solicitar Corrida"
          onPress={handleRequestTrip}
          variant="secondary"
          fullWidth
          style={styles.orderButton}
        />
      </Card>
      <TouchableOpacity
        style={[
          styles.locationFab,
          {
            bottom: 8 + cardHeight + 12,
          },
        ]}
        onPress={handleRecenterLocation}
        activeOpacity={0.8}
        disabled={isLocating}
      >
        <Ionicons name="location-outline" size={24} color="#34C759" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.zoomFab,
          {
            bottom: 8 + cardHeight + 12 + 64, // 56 (altura do botão) + 8 (espaçamento)
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
            bottom: 8 + cardHeight + 12 + 128, // 56 (altura do botão) * 2 + 8 (espaçamento) * 2
          },
        ]}
        onPress={handleZoomOut}
        activeOpacity={0.8}
      >
        <Ionicons name="remove" size={24} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.notificationFab,
          {
            top: searchBarHeight + 12,
          },
        ]}
        onPress={() => navigation.navigate('Notifications')}
        activeOpacity={0.8}
      >
        <Ionicons name="notifications-outline" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};


