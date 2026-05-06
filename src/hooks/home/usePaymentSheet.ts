import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { PaymentMethod as ApiPaymentMethod, PaymentMethodType } from '@/models/paymentMethod/types';
import { UiPaymentMethod } from '@/models/payment/types';
import { paymentMethodFacade } from '@/services/paymentMethod/paymentMethodFacade';
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
  selectedMethod: UiPaymentMethod | null;
  isLoading: boolean;
  hasError: boolean;
  selectMethod: (id: string) => void;
}

/**
 * Loads payment methods from the API and maps them to UI display models.
 * Keeps the selected method in sync so PaymentRow always shows the right icon.
 * Calls `onInitialLoad` once when the first method is auto-selected.
 */
export function usePaymentSheet(
  onInitialLoad?: (methodId: string) => void,
): UsePaymentSheetResult {
  const [methods, setMethods] = useState<UiPaymentMethod[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // Stable ref so the callback doesn't re-trigger the effect
  const onInitialLoadRef = useRef(onInitialLoad);
  onInitialLoadRef.current = onInitialLoad;

  const load = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    const result = await paymentMethodFacade.getPaymentMethods();
    setIsLoading(false);

    if (!result.success || !result.data) {
      setHasError(true);
      Alert.alert(tpm('errorTitle'), tpm('loadMethodsFailed'));
      return;
    }

    const ui = result.data.map(toUiMethod);
    setMethods(ui);
    setSelectedId((prev) => {
      const next = prev ?? ui[0]?.id ?? null;
      // Notify parent about the auto-selected method so it can pass the id
      // to useHome without requiring the user to open the payment sheet first.
      if (!prev && next) {
        onInitialLoadRef.current?.(next);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedMethod = methods.find((m) => m.id === selectedId) ?? null;

  return {
    methods,
    selectedMethod,
    isLoading,
    hasError,
    selectMethod: setSelectedId,
  };
}
