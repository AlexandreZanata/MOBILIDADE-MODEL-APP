import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { ttp } from '@/i18n/tripPrice';
import { tpm } from '@/i18n/paymentMethod';
import {
  TripCategoryOption,
  TripPriceLocation,
  TripPriceScreenNavigationProp,
  TripPriceScreenRoute,
} from '@/models/tripPrice/types';
import { tripPriceFacade } from '@/services/tripPrice/tripPriceFacade';
import { paymentMethodFacade } from '@/services/paymentMethod/paymentMethodFacade';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';

const CACHE_KEYS = {
  categories: '@vamu:trip_price_categories',
  timestamp: '@vamu:trip_price_categories_timestamp',
} as const;

const CACHE_VALIDITY_MS = 30 * 60 * 1000;
const ESTIMATE_EXPIRATION_MS = 60 * 1000;
const ESTIMATE_CHECK_INTERVAL_MS = 10 * 1000;

interface UseTripPriceParams {
  navigation: TripPriceScreenNavigationProp;
  route: TripPriceScreenRoute;
}

function calculateDistanceKm(point1: TripPriceLocation, point2: TripPriceLocation): number {
  const earthRadiusKm = 6371;
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((point1.lat * Math.PI) / 180) * Math.cos((point2.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function loadCachedCategories(): Promise<TripCategoryOption[] | null> {
  try {
    const cachedPayload = await AsyncStorage.getItem(CACHE_KEYS.categories);
    const cachedTimestamp = await AsyncStorage.getItem(CACHE_KEYS.timestamp);
    if (!cachedPayload || !cachedTimestamp) return null;

    const parsedTimestamp = Number.parseInt(cachedTimestamp, 10);
    if (Number.isNaN(parsedTimestamp)) return null;
    if (Date.now() - parsedTimestamp >= CACHE_VALIDITY_MS) return null;

    const parsed = JSON.parse(cachedPayload);
    return Array.isArray(parsed) ? (parsed as TripCategoryOption[]) : null;
  } catch {
    return null;
  }
}

async function saveCachedCategories(categories: TripCategoryOption[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.categories, JSON.stringify(categories));
    await AsyncStorage.setItem(CACHE_KEYS.timestamp, Date.now().toString());
  } catch {
    // cache is best-effort
  }
}

export function useTripPrice({ navigation, route }: UseTripPriceParams) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const ensureToken = useTokenRefresh();
  const [categories, setCategories] = useState<TripCategoryOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimateId, setEstimateId] = useState<string | null>(null);
  const [estimateTimestamp, setEstimateTimestamp] = useState<number | null>(null);

  const origin = route.params?.origin;
  const destination = route.params?.destination;

  const hasTooShortDistance = useMemo(() => {
    if (!origin || !destination) return false;
    return calculateDistanceKm(origin, destination) < 0.01;
  }, [destination, origin]);

  const loadCategoriesFromApi = useCallback(async () => {
    if (!origin || !destination || hasTooShortDistance) {
      setIsLoading(false);
      setCategories([]);
      return;
    }

    const result = await tripPriceFacade.getCategoriesWithEstimate(origin, destination);
    if (!result.success || !result.data) {
      if (categories.length === 0) {
        Alert.alert(ttp('errorTitle'), result.error?.message ?? ttp('loadCategoriesFailed'));
      }
      setIsLoading(false);
      return;
    }

    setEstimateId(result.data.estimateId);
    setEstimateTimestamp(Date.now());
    setCategories(result.data.categories);
    if (result.data.categories.length > 0) setSelectedCategoryId(result.data.categories[0].id);
    await saveCachedCategories(result.data.categories);
    setIsLoading(false);
  }, [categories.length, destination, hasTooShortDistance, origin]);

  const loadCategories = useCallback(async () => {
    if (!origin || !destination) {
      Alert.alert(ttp('errorTitle'), ttp('missingOriginDestination'));
      navigation.goBack();
      return;
    }

    if (hasTooShortDistance) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const cachedCategories = await loadCachedCategories();
    if (cachedCategories && cachedCategories.length > 0) {
      setCategories(cachedCategories);
      setSelectedCategoryId(cachedCategories[0].id);
      setIsLoading(false);
      await loadCategoriesFromApi();
      return;
    }

    await loadCategoriesFromApi();
  }, [destination, hasTooShortDistance, loadCategoriesFromApi, navigation, origin]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useFocusEffect(
    useCallback(() => {
      if (!origin || !destination || hasTooShortDistance) return;
      void loadCategoriesFromApi();
    }, [destination, hasTooShortDistance, loadCategoriesFromApi, origin])
  );

  useEffect(() => {
    if (!estimateTimestamp || !origin || !destination) return;
    const interval = setInterval(() => {
      const age = Date.now() - estimateTimestamp;
      if (age >= ESTIMATE_EXPIRATION_MS - 5000) {
        void loadCategoriesFromApi();
      }
    }, ESTIMATE_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [destination, estimateTimestamp, loadCategoriesFromApi, origin]);

  const onConfirm = useCallback(async () => {
    if (!selectedCategoryId || !origin || !destination) {
      Alert.alert(ttp('attentionTitle'), ttp('noCategorySelected'));
      return;
    }
    if (!estimateId) {
      Alert.alert(tpm('errorTitle'), tpm('estimateIdNotFound'));
      return;
    }

    // Load first available payment method from API
    const methodsResult = await paymentMethodFacade.getPaymentMethods();
    if (!methodsResult.success || !methodsResult.data?.length) {
      Alert.alert(tpm('errorTitle'), tpm('loadMethodsFailed'));
      return;
    }
    const paymentMethodId = methodsResult.data[0].id;

    await ensureToken();
    setIsSubmitting(true);
    try {
      const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
      const result = await paymentMethodFacade.createRide({
        estimateId,
        serviceCategoryId: selectedCategoryId,
        paymentMethodId,
      });

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
        estimatedFare: selectedCategory?.finalFare ?? result.data.estimatedPrice ?? result.data.estimated_fare ?? null,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [categories, destination, ensureToken, estimateId, navigation, origin, selectedCategoryId]);

  return {
    colors,
    insets,
    categories,
    selectedCategoryId,
    isLoading,
    isSubmitting,
    hasTooShortDistance,
    onSelectCategory: setSelectedCategoryId,
    onConfirm: () => { void onConfirm(); },
  };
}
