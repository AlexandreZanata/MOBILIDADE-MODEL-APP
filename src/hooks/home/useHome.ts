import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useTrip } from '@/context/TripContext';
import { HomeDestination, HomeLocation } from '@/models/home/types';
import { homeFacade } from '@/services/home/homeFacade';
import { th } from '@/i18n/home';

interface UseHomeParams {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
}

const SORRISO_LOCATION: HomeLocation = { lat: -12.5458, lon: -55.7061 };
const CACHE_KEYS = { USER_LOCATION: '@vamu:user_location', LOCATION_TIMESTAMP: '@vamu:location_timestamp' };

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3;
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dp = ((b.lat - a.lat) * Math.PI) / 180;
  const dl = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

export function useHome({ navigation }: UseHomeParams) {
  const { user } = useAuth();
  const { activeTrip, isLoading: isTripLoading } = useTrip();
  const isDriver = user?.roles?.includes('driver') || user?.type === 'motorista' || user?.type === 'driver';
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRequestedRef = useRef(false);
  /** Suppresses the debounced search when the query was set programmatically by a selection. */
  const suppressNextSearchRef = useRef(false);
  const inputRef = useRef<{ focus: () => void; blur: () => void; isFocused: () => boolean } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HomeDestination[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showHelperText, setShowHelperText] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<HomeDestination | null>(null);
  const [userLocation, setUserLocation] = useState<HomeLocation | null>(null);
  const [mapCenter, setMapCenter] = useState<HomeLocation | null>(null);
  const [mapZoom, setMapZoom] = useState(14);
  const [isLocating, setIsLocating] = useState(false);
  const [isCheckingActiveRide, setIsCheckingActiveRide] = useState(true);
  const [cityName, setCityName] = useState<string>();
  const [stateName, setStateName] = useState<string>();
  const [cardHeight, setCardHeight] = useState(220);
  const [searchBarHeight, setSearchBarHeight] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUserMovedMap, setHasUserMovedMap] = useState(false);

  const saveLocationToCache = useCallback(async (location: HomeLocation) => {
    await AsyncStorage.multiSet([
      [CACHE_KEYS.USER_LOCATION, JSON.stringify(location)],
      [CACHE_KEYS.LOCATION_TIMESTAMP, String(Date.now())],
    ]);
  }, []);

  const loadCachedLocation = useCallback(async (): Promise<HomeLocation | null> => {
    const entries = await AsyncStorage.multiGet([CACHE_KEYS.USER_LOCATION, CACHE_KEYS.LOCATION_TIMESTAMP]);
    const locationRaw = entries[0]?.[1];
    const timestampRaw = entries[1]?.[1];
    if (!locationRaw || !timestampRaw) return null;
    if (Date.now() - Number(timestampRaw) > 5 * 60 * 1000) return null;
    return JSON.parse(locationRaw) as HomeLocation;
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      setIsLocating(true);
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      const granted = currentStatus === 'granted'
        ? true
        : (await Location.requestForegroundPermissionsAsync()).status === 'granted';
      if (!granted) {
        Alert.alert(th('permissionDeniedTitle'), th('permissionDeniedDescription'));
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { lat: current.coords.latitude, lon: current.coords.longitude };
      setUserLocation(next);
      setMapCenter(next);
      setHasUserMovedMap(false);
      await saveLocationToCache(next);
      const locationContext = await homeFacade.resolveCityState(next.lat, next.lon);
      setCityName(locationContext.city);
      setStateName(locationContext.state);
    } finally {
      setIsLocating(false);
    }
  }, [saveLocationToCache]);

  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    setShowResults(true);
    try {
      const location = userLocation
        ? { lat: userLocation.lat, lng: userLocation.lon, city: cityName, state: stateName }
        : undefined;
      const results = await homeFacade.search(query, location);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  }, [cityName, stateName, userLocation]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Query was set by a selection — skip the search and reset the flag
    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false;
      return;
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(() => void searchLocation(searchQuery), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchLocation, searchQuery]);

  useEffect(() => {
    if (isDriver) {
      setIsCheckingActiveRide(false);
      return;
    }
    let mounted = true;
    const run = async () => {
      const tripData = await homeFacade.getValidActiveRide();
      if (!mounted) return;
      if (tripData) {
        navigation.replace('WaitingForDriver', {
          tripId: tripData.id,
          tripData,
          ...(homeFacade.isWaitingStatus(tripData.status)
            ? {}
            : { userLocation: tripData.origin, destination: tripData.destination }),
        });
        return;
      }
      setIsCheckingActiveRide(false);
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [isDriver, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!isCheckingActiveRide && (!mapRequestedRef.current || !userLocation)) {
        mapRequestedRef.current = true;
        const timer = setTimeout(() => void requestLocationPermission(), 300);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [isCheckingActiveRide, requestLocationPermission, userLocation])
  );

  const onSelectLocation = useCallback(async (result: HomeDestination) => {
    Keyboard.dismiss();

    // Set the flag BEFORE setSearchQuery so the debounce effect sees it
    suppressNextSearchRef.current = true;
    setSearchQuery(result.name);
    setShowResults(false);
    setSearchResults([]);

    const hydrated = await homeFacade.hydrateDestination(result);

    // Guard: if coordinates are still invalid after hydration, the place details
    // call failed. Show an error instead of silently setting a broken destination.
    const hasValidCoords =
      Number.isFinite(hydrated.lat) &&
      Number.isFinite(hydrated.lon) &&
      !(hydrated.lat === 0 && hydrated.lon === 0);

    if (!hasValidCoords) {
      Alert.alert(th('resolveLocationTitle'), th('resolveLocationDescription'));
      suppressNextSearchRef.current = true; // also suppress the clear below
      setSearchQuery('');
      return;
    }

    setSelectedDestination(hydrated);
    setIsMinimized(false);
  }, []);

  const requestTrip = useCallback(() => {
    if (!selectedDestination) {
      setShowHelperText(true);
      const current = inputRef.current;
      if (current?.isFocused()) current.blur();
      setTimeout(() => current?.focus(), 100);
      return;
    }
    if (!userLocation) {
      Alert.alert(th('waitLocationTitle'), th('waitLocationDescription'));
      return;
    }
    const origin = { lat: userLocation.lat, lng: userLocation.lon };
    const destination = { lat: selectedDestination.lat, lng: selectedDestination.lon };
    if (distanceMeters(origin, destination) < 10) {
      Alert.alert(th('chooseDestinationTitle'), th('chooseDestinationDescription'));
      return;
    }
    navigation.navigate('TripPrice', { origin, destination });
  }, [navigation, selectedDestination, userLocation]);

  const vm = useMemo(() => ({
    isDriver,
    activeTrip,
    isTripLoading,
    isCheckingActiveRide,
    searchQuery,
    searchResults,
    showResults,
    isSearching,
    showHelperText,
    selectedDestination,
    userLocation,
    mapCenter: mapCenter || SORRISO_LOCATION,
    mapZoom,
    isLocating,
    isMinimized,
    cardHeight,
    searchBarHeight,
    hasUserMovedMap,
    setSearchQuery: (text: string) => {
      setSearchQuery(text);
      if (text) setShowHelperText(false);
    },
    clearSearch: () => {
      setSearchQuery('');
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
    },
    setShowResults,
    onSelectLocation,
    requestTrip,
    onRecenter: requestLocationPermission,
    onMapMove: () => setHasUserMovedMap(true),
    setMapZoom,
    setCardHeight,
    setSearchBarHeight,
    toggleMinimized: () => setIsMinimized((state) => !state),
    setSearchInputRef: (ref: { focus: () => void; blur: () => void; isFocused: () => boolean } | null) => {
      inputRef.current = ref;
    },
    goToNotifications: () => navigation.navigate('Notifications'),
  }), [
    activeTrip, hasUserMovedMap, isCheckingActiveRide, isDriver, isLocating, isMinimized, isSearching,
    isTripLoading, mapCenter, mapZoom, navigation, onSelectLocation, requestLocationPermission, requestTrip,
    searchBarHeight, searchQuery, searchResults, selectedDestination, showHelperText, showResults, userLocation, cardHeight,
  ]);

  return vm;
}
