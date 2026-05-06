import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useTrip } from '@/context/TripContext';
import { HomeDestination, HomeLocation } from '@/models/home/types';
import { TripCategoryOption } from '@/models/tripPrice/types';
import { homeFacade } from '@/services/home/homeFacade';
import { tripPriceFacade } from '@/services/tripPrice/tripPriceFacade';
import { paymentMethodFacade } from '@/services/paymentMethod/paymentMethodFacade';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { th } from '@/i18n/home';
import { tpm } from '@/i18n/paymentMethod';

interface UseHomeParams {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
  /** ID of the payment method selected in the inline sheet */
  selectedPaymentMethodId: string | null;
  /** ID of the card brand selected (required when method is credit/debit) */
  selectedCardBrandId: string | null;
}

const SORRISO_LOCATION: HomeLocation = { lat: -12.5458, lon: -55.7061 };
const CACHE_KEYS = { USER_LOCATION: '@vamu:user_location', LOCATION_TIMESTAMP: '@vamu:location_timestamp' };

/**
 * Estimate validity window from the API (60s).
 * We renew 10s before expiry to avoid race conditions.
 */
const ESTIMATE_RENEW_THRESHOLD_MS = 50_000; // renew when age > 50s
const ESTIMATE_CHECK_INTERVAL_MS = 10_000;  // check every 10s

/**
 * Detects whether an API error message indicates the estimate has expired
 * or was not found — the two cases where a silent renewal + retry is safe.
 */
function isEstimateExpiredError(message?: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('estimativa') ||
    lower.includes('estimate') ||
    lower.includes('expir') ||
    lower.includes('not found') ||
    lower.includes('não encontrada')
  );
}

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3;
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dp = ((b.lat - a.lat) * Math.PI) / 180;
  const dl = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

export function useHome({ navigation, selectedPaymentMethodId, selectedCardBrandId }: UseHomeParams) {
  const { user } = useAuth();
  const { activeTrip, isLoading: isTripLoading } = useTrip();
  const ensureToken = useTokenRefresh();
  const isDriver = user?.roles?.includes('driver') || user?.type === 'motorista' || user?.type === 'driver';
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRequestedRef = useRef(false);
  /**
   * Tracks the query value that was set programmatically after a location selection.
   * While `searchQuery === lockedQueryRef.current` the debounce effect will not fire
   * a new API request — the text is locked to the selected destination name.
   * Cleared to `null` when the user edits the field or presses the clear button.
   */
  const lockedQueryRef = useRef<string | null>(null);
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

  // Inline ride-type carousel state
  const [rideCategories, setRideCategories] = useState<TripCategoryOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [estimateId, setEstimateId] = useState<string | null>(null);
  const [estimateTimestamp, setEstimateTimestamp] = useState<number | null>(null);

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

    // The query matches the locked value set by a programmatic selection.
    // The user has not changed the text, so no API request should be fired.
    if (lockedQueryRef.current !== null && searchQuery === lockedQueryRef.current) {
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

  const loadCategoriesForDestination = useCallback(
    async (dest: HomeDestination, origin: HomeLocation) => {
      setIsLoadingCategories(true);
      setRideCategories([]);
      setSelectedCategoryId(null);
      const result = await tripPriceFacade.getCategoriesWithEstimate(
        { lat: origin.lat, lng: origin.lon },
        { lat: dest.lat, lng: dest.lon },
      );
      setIsLoadingCategories(false);
      if (!result.success || !result.data) return;
      setEstimateId(result.data.estimateId);
      setEstimateTimestamp(Date.now());
      setRideCategories(result.data.categories);
      if (result.data.categories.length > 0) {
        setSelectedCategoryId(result.data.categories[0].id);
      }
    },
    [],
  );

  /**
   * Silently renews the fare estimate using the current destination and
   * user location. Returns the new estimateId on success, null on failure.
   * Does NOT reset categories — only refreshes the estimateId + timestamp.
   */
  const renewEstimate = useCallback(async (): Promise<string | null> => {
    if (!selectedDestination || !userLocation) return null;
    const result = await tripPriceFacade.getCategoriesWithEstimate(
      { lat: userLocation.lat, lng: userLocation.lon },
      { lat: selectedDestination.lat, lng: selectedDestination.lon },
    );
    if (!result.success || !result.data) return null;
    setEstimateId(result.data.estimateId);
    setEstimateTimestamp(Date.now());
    return result.data.estimateId;
  }, [selectedDestination, userLocation]);

  /**
   * Returns a fresh estimateId — renews if the current one is older than
   * ESTIMATE_RENEW_THRESHOLD_MS or missing.
   */
  const ensureFreshEstimate = useCallback(async (): Promise<string | null> => {
    if (!estimateId) return renewEstimate();
    if (!estimateTimestamp) return renewEstimate();
    if (Date.now() - estimateTimestamp >= ESTIMATE_RENEW_THRESHOLD_MS) {
      return renewEstimate();
    }
    return estimateId;
  }, [estimateId, estimateTimestamp, renewEstimate]);

  /**
   * Background renewal: while a destination is selected, keep the estimate
   * alive by renewing it before it expires on the server.
   */
  useEffect(() => {
    if (!selectedDestination || !userLocation || !estimateTimestamp) return;
    const interval = setInterval(() => {
      const age = Date.now() - estimateTimestamp;
      if (age >= ESTIMATE_RENEW_THRESHOLD_MS) {
        void renewEstimate();
      }
    }, ESTIMATE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [estimateTimestamp, renewEstimate, selectedDestination, userLocation]);

  const onSelectLocation = useCallback(async (result: HomeDestination) => {
    Keyboard.dismiss();

    // Lock the query to this value so the debounce effect never fires a search
    // for text that was set programmatically. The lock persists until the user
    // edits the field or clears it.
    lockedQueryRef.current = result.name;
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
      // Lock an empty string so the clear below does not trigger a search either
      lockedQueryRef.current = '';
      setSearchQuery('');
      return;
    }

    setSelectedDestination(hydrated);
    setIsMinimized(false);

    // Load ride categories inline (no navigation to TripPriceScreen)
    const currentLocation = userLocation;
    if (currentLocation) {
      void loadCategoriesForDestination(hydrated, currentLocation);
    }
  }, [loadCategoriesForDestination, userLocation]);

  const requestTrip = useCallback(async () => {
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
    if (!selectedCategoryId) {
      Alert.alert(th('chooseDestinationTitle'), th('selectCategoryFirst'));
      return;
    }
    if (!selectedPaymentMethodId) {
      Alert.alert(th('chooseDestinationTitle'), tpm('selectMethod'));
      return;
    }

    await ensureToken();

    // Always get a fresh estimate — renews silently if close to expiry
    const freshEstimateId = await ensureFreshEstimate();
    if (!freshEstimateId) {
      Alert.alert(tpm('errorTitle'), tpm('estimateIdNotFound'));
      return;
    }

    const selectedCategory = rideCategories.find((c) => c.id === selectedCategoryId);

    let result = await paymentMethodFacade.createRide({
      estimateId: freshEstimateId,
      serviceCategoryId: selectedCategoryId,
      paymentMethodId: selectedPaymentMethodId,
      cardBrandId: selectedCardBrandId ?? undefined,
    });

    // If the server still rejects the estimate (race condition), renew once and retry
    if (!result.success && isEstimateExpiredError(result.error?.message)) {
      const retryEstimateId = await renewEstimate();
      if (retryEstimateId) {
        result = await paymentMethodFacade.createRide({
          estimateId: retryEstimateId,
          serviceCategoryId: selectedCategoryId,
          paymentMethodId: selectedPaymentMethodId,
          cardBrandId: selectedCardBrandId ?? undefined,
        });
      }
    }

    if (!result.success || !result.data) {
      Alert.alert(tpm('errorTitle'), result.error?.message ?? tpm('createRideFailed'));
      return;
    }

    const tripId = result.data.id ?? result.data.trip_id;
    if (!tripId) {
      Alert.alert(tpm('errorTitle'), tpm('createRideMissingId'));
      return;
    }

    navigation.navigate('WaitingForDriver', {
      tripId,
      tripData: result.data,
      userLocation: origin,
      destination,
      destinationName: selectedDestination?.name,
      estimatedFare: selectedCategory?.finalFare ?? result.data.estimatedPrice ?? result.data.estimated_fare ?? null,
    });
  }, [
    ensureFreshEstimate,
    ensureToken,
    navigation,
    renewEstimate,
    rideCategories,
    selectedCardBrandId,
    selectedCategoryId,
    selectedDestination,
    selectedPaymentMethodId,
    userLocation,
  ]);

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
    // Ride-type carousel
    rideCategories,
    selectedCategoryId,
    isLoadingCategories,
    selectedCategoryDuration: rideCategories.find((c) => c.id === selectedCategoryId)?.durationSeconds ?? null,
    setSearchQuery: (text: string) => {
      // The user is typing — unlock the query so searches can fire again
      // and clear the selected destination since it no longer matches the input.
      lockedQueryRef.current = null;
      setSelectedDestination(null);
      setRideCategories([]);
      setSelectedCategoryId(null);
      setSearchQuery(text);
      if (text) setShowHelperText(false);
    },
    clearSearch: () => {
      // Explicit clear via the "X" button — unlock and reset everything.
      lockedQueryRef.current = null;
      setSearchQuery('');
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      setSelectedDestination(null);
      setRideCategories([]);
      setSelectedCategoryId(null);
    },
    setShowResults,
    onSelectLocation,
    requestTrip: () => { void requestTrip(); },
    onSelectCategory: setSelectedCategoryId,
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
    activeTrip, hasUserMovedMap, isCheckingActiveRide, isDriver, isLoadingCategories, isLocating,
    isMinimized, isSearching, isTripLoading, mapCenter, mapZoom, navigation, onSelectLocation,
    requestLocationPermission, requestTrip, rideCategories, searchBarHeight, searchQuery,
    searchResults, selectedCategoryId, selectedDestination, showHelperText, showResults,
    userLocation, cardHeight,
  ]);

  return vm;
}
