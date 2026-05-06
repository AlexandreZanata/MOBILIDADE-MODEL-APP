import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { PaymentBrand, PaymentMethod as ApiPaymentMethod, PaymentMethodType } from '@/models/paymentMethod/types';
import { UiPaymentMethod } from '@/models/payment/types';
import { paymentMethodFacade } from '@/services/paymentMethod/paymentMethodFacade';
import { httpClient } from '@/services/http/httpClient';
import { tpm } from '@/i18n/paymentMethod';

// ---------------------------------------------------------------------------
// Icon / color mapping per payment type
// ---------------------------------------------------------------------------

interface MethodVisuals {
  iconName: UiPaymentMethod['iconName'];
  iconBg: string;
  iconColor: string;
}

const TYPE_VISUALS: Record<PaymentMethodType, MethodVisuals> = {
  credit_card: {
    iconName: 'card-outline',
    iconBg: '#1A1A1A',
    iconColor: '#FFFFFF',
  },
  debit_card: {
    iconName: 'card-outline',
    iconBg: '#E8F3FC',
    iconColor: '#0374C8',
  },
  pix: {
    iconName: 'flash-outline',
    iconBg: '#EAF3DE',
    iconColor: '#3B6D11',
  },
  cash: {
    iconName: 'cash-outline',
    iconBg: '#FAEEDA',
    iconColor: '#854F0B',
  },
  wallet: {
    iconName: 'wallet-outline',
    iconBg: '#EDE9FE',
    iconColor: '#534AB7',
  },
};

function toUiMethod(api: ApiPaymentMethod): UiPaymentMethod {
  const visuals = TYPE_VISUALS[api.type] ?? TYPE_VISUALS.credit_card;
  return {
    id: api.id,
    label: api.name,
    subtitle: api.description ?? '',
    type: api.type,
    requiresCardBrand: api.requiresCardBrand,
    ...visuals,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UsePaymentSheetResult {
  methods: UiPaymentMethod[];
  brands: PaymentBrand[];
  selectedMethod: UiPaymentMethod | null;
  selectedBrandId: string | null;
  isLoading: boolean;
  isLoadingBrands: boolean;
  hasError: boolean;
  selectMethod: (id: string) => void;
  selectBrand: (id: string) => void;
}

/**
 * Loads payment methods (and card brands when needed) from the API.
 * Calls `onInitialLoad` once when the first method is auto-selected.
 * Calls `onBrandChange` whenever the selected brand changes.
 */
export function usePaymentSheet(
  onInitialLoad?: (methodId: string) => void,
  onBrandChange?: (brandId: string | null) => void,
  enabled = true,
): UsePaymentSheetResult {
  const [methods, setMethods] = useState<UiPaymentMethod[]>([]);
  const [brands, setBrands] = useState<PaymentBrand[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [hasError, setHasError] = useState(false);

  const onInitialLoadRef = useRef(onInitialLoad);
  onInitialLoadRef.current = onInitialLoad;
  const onBrandChangeRef = useRef(onBrandChange);
  onBrandChangeRef.current = onBrandChange;

  /**
   * Loads payment methods from the API.
   *
   * Guards against two race conditions that produce a spurious error alert:
   * 1. **Logout race** – tokens are cleared before the component unmounts.
   *    We check `httpClient.getAccessToken()` before firing the request; if
   *    there is no token the user is logging out and we bail silently.
   * 2. **Unmount race** – the component unmounts while the request is in
   *    flight. The `cancelled` flag prevents state updates and the alert on
   *    an already-unmounted component.
   */
  const load = useCallback(async (cancelled: { current: boolean }) => {
    // No token → user is unauthenticated or logging out; skip silently.
    if (!httpClient.getAccessToken()) return;

    setIsLoading(true);
    setHasError(false);

    const result = await paymentMethodFacade.getPaymentMethods();

    // Component unmounted or logout happened while request was in flight.
    if (cancelled.current) return;

    setIsLoading(false);

    if (!result.success || !result.data) {
      // Only show the error if the user is still authenticated (has a token).
      // A missing token here means logout fired mid-request — suppress the alert.
      if (!httpClient.getAccessToken()) return;
      // Session ended or forbidden — do not show "payment methods" error during logout/navigation.
      if (result.status === 401 || result.status === 403) return;

      setHasError(true);
      Alert.alert(tpm('errorTitle'), tpm('loadMethodsFailed'));
      return;
    }

    const ui = result.data.map(toUiMethod);
    setMethods(ui);
    setSelectedId((prev) => {
      const next = prev ?? ui[0]?.id ?? null;
      if (!prev && next) {
        queueMicrotask(() => onInitialLoadRef.current?.(next));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      setMethods([]);
      setSelectedId(null);
      setBrands([]);
      setSelectedBrandId(null);
      setIsLoading(false);
      setIsLoadingBrands(false);
      setHasError(false);
      return;
    }
    const cancelled = { current: false };
    void load(cancelled);
    return () => { cancelled.current = true; };
  }, [load, enabled]);

  // Load card brands when a card method is selected
  const selectedMethod = methods.find((m) => m.id === selectedId) ?? null;

  useEffect(() => {
    if (!enabled) return;

    if (!selectedMethod?.requiresCardBrand) {
      setBrands([]);
      setSelectedBrandId(null);
      onBrandChangeRef.current?.(null);
      return;
    }

    let cancelled = false;
    setIsLoadingBrands(true);

    if (!httpClient.getAccessToken()) {
      setIsLoadingBrands(false);
      return;
    }

    paymentMethodFacade.getCardBrands().then((result) => {
      if (cancelled) return;
      setIsLoadingBrands(false);
      if (!httpClient.getAccessToken()) return;
      if (!result.success || !result.data) return;
      setBrands(result.data);
      setSelectedBrandId((prev) => {
        const next = prev ?? result.data![0]?.id ?? null;
        queueMicrotask(() => onBrandChangeRef.current?.(next));
        return next;
      });
    });

    return () => { cancelled = true; };
  }, [enabled, selectedMethod?.requiresCardBrand, selectedMethod?.id]);

  const selectBrand = useCallback((id: string) => {
    setSelectedBrandId(id);
    onBrandChangeRef.current?.(id);
  }, []);

  return {
    methods,
    brands,
    selectedMethod,
    selectedBrandId,
    isLoading,
    isLoadingBrands,
    hasError,
    selectMethod: setSelectedId,
    selectBrand,
  };
}
