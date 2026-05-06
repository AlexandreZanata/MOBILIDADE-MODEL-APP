import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { tpm } from '@/i18n/paymentMethod';
import { PaymentBrand, PaymentMethod, PaymentMethodRouteParams, PaymentMethodScreenNavigationProp } from '@/models/paymentMethod/types';
import { paymentMethodFacade, PaymentMethodResult } from '@/services/paymentMethod/paymentMethodFacade';

const CACHE_VALIDITY_MS = 60 * 60 * 1000;
const ESTIMATE_RENEWAL_THRESHOLD_MS = 55 * 1000;
const ESTIMATE_CHECK_INTERVAL_MS = 10 * 1000;

const CACHE_KEYS = {
  methods: '@vamu:payment_methods',
  methodsTimestamp: '@vamu:payment_methods_timestamp',
  brands: '@vamu:payment_brands',
  brandsTimestamp: '@vamu:payment_brands_timestamp',
} as const;

interface UsePaymentMethodParams {
  navigation: PaymentMethodScreenNavigationProp;
  routeParams?: PaymentMethodRouteParams;
}

async function loadCache<T>(dataKey: string, timestampKey: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(dataKey);
    const cachedTimestamp = await AsyncStorage.getItem(timestampKey);
    if (!cached || !cachedTimestamp) return null;

    const timestamp = Number.parseInt(cachedTimestamp, 10);
    if (Number.isNaN(timestamp)) return null;
    if (Date.now() - timestamp >= CACHE_VALIDITY_MS) return null;

    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
}

async function saveCache(dataKey: string, timestampKey: string, payload: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(dataKey, JSON.stringify(payload));
    await AsyncStorage.setItem(timestampKey, Date.now().toString());
  } catch {
    // Cache best-effort
  }
}

function isEstimateExpiredError(result: PaymentMethodResult<unknown>): boolean {
  const message = result.error?.message?.toLowerCase() ?? '';
  const errorCode = result.meta?.errorCode?.toLowerCase() ?? '';
  const errorMessage = result.meta?.errorMessage?.toLowerCase() ?? '';
  const composedMessage = `${message} ${errorMessage}`;

  const mentionsEstimate = composedMessage.includes('estimativa') || composedMessage.includes('estimate');
  const mentionsExpired = composedMessage.includes('expir') || composedMessage.includes('not found') || composedMessage.includes('invalid');
  const invalidEstimateCode = errorCode.includes('invalid') && mentionsEstimate;
  const invalidRequestStatus = result.status === 400 && (mentionsEstimate || errorCode === 'invalid_request');

  return (mentionsEstimate && mentionsExpired) || invalidEstimateCode || invalidRequestStatus;
}

export function usePaymentMethod({ navigation, routeParams }: UsePaymentMethodParams) {
  const ensureToken = useTokenRefresh();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [brands, setBrands] = useState<PaymentBrand[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEstimateId, setCurrentEstimateId] = useState<string | null>(routeParams?.estimateId ?? null);
  const [currentEstimateTimestamp, setCurrentEstimateTimestamp] = useState<number | null>(routeParams?.estimateTimestamp ?? null);

  const selectedMethodData = useMemo(
    () => methods.find((method) => method.id === selectedMethod) ?? null,
    [methods, selectedMethod]
  );

  const loadMethodsFromApi = useCallback(async () => {
    const response = await paymentMethodFacade.getPaymentMethods();
    if (!response.success || !response.data) {
      if (methods.length === 0) Alert.alert(tpm('errorTitle'), tpm('loadMethodsFailed'));
      return;
    }
    setMethods(response.data);
    if (!selectedMethod && response.data.length > 0) {
      setSelectedMethod(response.data[0].id);
    }
    await saveCache(CACHE_KEYS.methods, CACHE_KEYS.methodsTimestamp, response.data);
  }, [methods.length, selectedMethod]);

  const loadMethods = useCallback(async () => {
    setIsLoadingMethods(true);
    try {
      const cached = await loadCache<PaymentMethod[]>(CACHE_KEYS.methods, CACHE_KEYS.methodsTimestamp);
      if (cached && cached.length > 0) {
        setMethods(cached);
        setSelectedMethod(cached[0].id);
        setIsLoadingMethods(false);
        await loadMethodsFromApi();
        return;
      }
      await loadMethodsFromApi();
    } finally {
      setIsLoadingMethods(false);
    }
  }, [loadMethodsFromApi]);

  const loadBrandsFromApi = useCallback(
    async (methodId: string) => {
      setIsLoadingBrands(true);
      try {
        const response = await paymentMethodFacade.getCardBrands();
        if (!response.success || !response.data) return;

        const nextBrands = response.data;
        setBrands(nextBrands);
        if (nextBrands.length > 0) {
          setSelectedBrand((current) => current ?? nextBrands[0].id);
        }
        await saveCache(`${CACHE_KEYS.brands}_${methodId}`, `${CACHE_KEYS.brandsTimestamp}_${methodId}`, nextBrands);
      } finally {
        setIsLoadingBrands(false);
      }
    },
    []
  );

  const loadBrands = useCallback(
    async (methodId: string) => {
      const cached = await loadCache<PaymentBrand[]>(
        `${CACHE_KEYS.brands}_${methodId}`,
        `${CACHE_KEYS.brandsTimestamp}_${methodId}`
      );
      if (cached && cached.length > 0) {
        setBrands(cached);
        setSelectedBrand(cached[0].id);
        await loadBrandsFromApi(methodId);
        return;
      }
      await loadBrandsFromApi(methodId);
    },
    [loadBrandsFromApi]
  );

  const renewEstimate = useCallback(async (): Promise<string | null> => {
    if (!routeParams?.origin || !routeParams?.destination) return null;
    const estimate = await paymentMethodFacade.fareEstimate(routeParams.origin, routeParams.destination);
    if (!estimate.success || !estimate.data) return null;

    setCurrentEstimateId(estimate.data.estimateId);
    setCurrentEstimateTimestamp(Date.now());
    return estimate.data.estimateId;
  }, [routeParams?.destination, routeParams?.origin]);

  const ensureFreshEstimate = useCallback(async (): Promise<string | null> => {
    if (!currentEstimateId) return null;
    if (!currentEstimateTimestamp) return renewEstimate();
    const estimateAge = Date.now() - currentEstimateTimestamp;
    if (estimateAge > ESTIMATE_RENEWAL_THRESHOLD_MS) {
      return renewEstimate();
    }
    return currentEstimateId;
  }, [currentEstimateId, currentEstimateTimestamp, renewEstimate]);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods]);

  useEffect(() => {
    if (!selectedMethodData) return;
    if (!selectedMethodData.requiresCardBrand) {
      setBrands([]);
      setSelectedBrand(null);
      return;
    }
    void loadBrands(selectedMethodData.id);
  }, [loadBrands, selectedMethodData]);

  useEffect(() => {
    if (!routeParams?.origin || !routeParams?.destination || !currentEstimateId || !currentEstimateTimestamp) return;
    const interval = setInterval(() => {
      void (async () => {
        const age = Date.now() - currentEstimateTimestamp;
        if (age >= ESTIMATE_RENEWAL_THRESHOLD_MS) {
          await renewEstimate();
        }
      })();
    }, ESTIMATE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [currentEstimateId, currentEstimateTimestamp, renewEstimate, routeParams?.destination, routeParams?.origin]);

  const handleConfirm = useCallback(async () => {
    if (!selectedMethod) {
      Alert.alert(tpm('attentionTitle'), tpm('selectMethod'));
      return;
    }
    if (!routeParams?.origin || !routeParams?.destination || !routeParams?.tripCategoryId) {
      Alert.alert(tpm('errorTitle'), tpm('tripDataNotFound'));
      navigation.goBack();
      return;
    }

    const method = methods.find((item) => item.id === selectedMethod);
    if (method?.requiresCardBrand && !selectedBrand) {
      Alert.alert(tpm('attentionTitle'), tpm('selectBrand'));
      return;
    }

    await ensureToken();
    setIsSubmitting(true);
    try {
      let estimateId = await ensureFreshEstimate();
      if (!estimateId) {
        Alert.alert(tpm('errorTitle'), tpm('estimateIdNotFound'));
        navigation.goBack();
        return;
      }

      let createRide = await paymentMethodFacade.createRide({
        estimateId,
        serviceCategoryId: routeParams.tripCategoryId,
        paymentMethodId: selectedMethod,
        cardBrandId: method?.requiresCardBrand ? selectedBrand ?? undefined : undefined,
      });

      if (!createRide.success && isEstimateExpiredError(createRide)) {
        const renewed = await renewEstimate();
        if (!renewed) {
          Alert.alert(tpm('errorTitle'), tpm('estimateRenewFailed'));
          return;
        }
        estimateId = renewed;
        createRide = await paymentMethodFacade.createRide({
          estimateId,
          serviceCategoryId: routeParams.tripCategoryId,
          paymentMethodId: selectedMethod,
          cardBrandId: method?.requiresCardBrand ? selectedBrand ?? undefined : undefined,
        });
      }

      if (!createRide.success || !createRide.data) {
        Alert.alert(tpm('errorTitle'), createRide.error?.message ?? tpm('createRideFailed'));
        return;
      }

      const tripId = createRide.data.id ?? createRide.data.trip_id;
      if (!tripId) {
        Alert.alert(tpm('errorTitle'), tpm('createRideMissingId'));
        return;
      }

      const estimatedFare =
        routeParams.estimatedFare ??
        createRide.data.estimatedPrice ??
        createRide.data.estimated_fare ??
        createRide.data.finalPrice ??
        createRide.data.final_fare ??
        null;

      navigation.navigate('WaitingForDriver', {
        userLocation: routeParams.origin,
        destination: routeParams.destination,
        tripData: createRide.data,
        tripId,
        estimatedFare,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    ensureFreshEstimate,
    ensureToken,
    methods,
    navigation,
    renewEstimate,
    routeParams,
    selectedBrand,
    selectedMethod,
  ]);

  return {
    methods,
    brands,
    selectedMethod,
    selectedBrand,
    isLoadingMethods,
    isLoadingBrands,
    isSubmitting,
    actions: {
      selectMethod: setSelectedMethod,
      selectBrand: setSelectedBrand,
      confirm: handleConfirm,
    },
  };
}
