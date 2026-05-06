import { useCallback, useMemo, useState } from 'react';
import { Alert, Clipboard } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { useAuth } from '@/hooks/useAuth';
import { isDriver } from '@/models/User';
import { BillingCycle, DriverBillingStatus, PixQrCode } from '@/models/billing/types';
import { driverBillingService, ServiceError } from '@/services/billing/driverBillingService';
import { tb } from '@/i18n/billing';

const PAGE_LIMIT = 20;

function buildIdempotencyKey(seed: string): string {
  return `${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveErrorMessage(error: ServiceError | undefined, fallback: string): string {
  if (!error) return fallback;
  return error.code === 'REQUEST_FAILED' ? error.message : fallback;
}

export function useDriverBilling() {
  const ensureToken = useTokenRefresh();
  const { user } = useAuth();
  const canAccessBilling = Boolean(user && isDriver(user));

  const [billingStatus, setBillingStatus] = useState<DriverBillingStatus | null>(null);
  const [cycles, setCycles] = useState<BillingCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCycles, setIsLoadingCycles] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | null>(null);
  const [pixData, setPixData] = useState<PixQrCode | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  const calculatedTotalPending = useMemo(
    () =>
      cycles.reduce((sum, cycle) => {
        if (cycle.remainingAmount > 0 && cycle.status !== 'PAID' && cycle.status !== 'CANCELLED') {
          return sum + cycle.remainingAmount;
        }
        return sum;
      }, 0),
    [cycles]
  );

  const totalPending = useMemo(() => {
    if (billingStatus?.totalPending && billingStatus.totalPending > 0) {
      return billingStatus.totalPending;
    }
    return calculatedTotalPending;
  }, [billingStatus?.totalPending, calculatedTotalPending]);

  const loadBillingStatus = useCallback(async () => {
    if (!canAccessBilling) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      await ensureToken();
      const response = await driverBillingService.getBillingStatus();
      if (response.success && response.data) {
        setBillingStatus(response.data);
      } else {
        Alert.alert(tb('errorTitle'), resolveErrorMessage(response.error, tb('statusLoadError')));
      }
    } catch {
      Alert.alert(tb('errorTitle'), tb('statusLoadError'));
    } finally {
      setIsLoading(false);
    }
  }, [canAccessBilling, ensureToken]);

  const loadCycles = useCallback(
    async (append = false) => {
      if (!canAccessBilling) {
        return;
      }

      try {
        if (!append) {
          setIsLoadingCycles(true);
        }
        await ensureToken();
        const response = await driverBillingService.getBillingCycles({
          cursor: append ? nextCursor : undefined,
          limit: PAGE_LIMIT,
        });

        if (response.success && response.data) {
          const items = response.data.items;
          setCycles((previous) => (append ? [...previous, ...items] : items));
          setHasMore(response.data.hasMore);
          setNextCursor(response.data.nextCursor);
          return;
        }

        if (!append) {
          setCycles([]);
          Alert.alert(tb('errorTitle'), resolveErrorMessage(response.error, tb('cyclesLoadError')));
        }
      } catch {
        if (!append) {
          setCycles([]);
          Alert.alert(tb('errorTitle'), tb('cyclesLoadError'));
        }
      } finally {
        setIsLoadingCycles(false);
      }
    },
    [canAccessBilling, ensureToken, nextCursor]
  );

  const handleGeneratePix = useCallback(
    async (cycle: BillingCycle) => {
      if (cycle.remainingAmount <= 0) {
        Alert.alert(tb('warningTitle'), tb('cycleNoPendingAmount'));
        return;
      }

      try {
        setIsGeneratingPix(true);
        await ensureToken();
        const response = await driverBillingService.generateCyclePix(cycle.id, buildIdempotencyKey(cycle.id));
        if (response.success && response.data) {
          setPixData(response.data);
          setSelectedCycle(cycle);
          setShowPixModal(true);
          return;
        }

        if (response.error?.status === 500) {
          Alert.alert(tb('serverErrorTitle'), tb('serverErrorMessage'));
          return;
        }

        Alert.alert(tb('errorTitle'), resolveErrorMessage(response.error, tb('pixGenerateError')));
      } catch {
        Alert.alert(tb('errorTitle'), tb('pixGenerateError'));
      } finally {
        setIsGeneratingPix(false);
      }
    },
    [ensureToken]
  );

  const handleGenerateDebtPix = useCallback(async () => {
    if (totalPending <= 0) {
      Alert.alert(tb('warningTitle'), tb('noPendingDebt'));
      return;
    }

    try {
      setIsGeneratingPix(true);
      await ensureToken();
      const response = await driverBillingService.generateDebtPix(buildIdempotencyKey('debt'));
      if (response.success && response.data) {
        setPixData(response.data);
        setSelectedCycle(null);
        setShowPixModal(true);
        return;
      }

      if (response.error?.status === 500) {
        Alert.alert(tb('serverErrorTitle'), tb('serverErrorMessage'));
        return;
      }

      Alert.alert(tb('errorTitle'), resolveErrorMessage(response.error, tb('pixGenerateError')));
    } catch {
      Alert.alert(tb('errorTitle'), tb('pixGenerateError'));
    } finally {
      setIsGeneratingPix(false);
    }
  }, [ensureToken, totalPending]);

  const handleCopyPixCode = useCallback(() => {
    if (!pixData) return;
    Clipboard.setString(pixData.copyPaste || pixData.qrCode);
    Alert.alert(tb('successTitle'), tb('pixCopied'));
  }, [pixData]);

  const closePixModal = useCallback(() => setShowPixModal(false), []);

  useFocusEffect(
    useCallback(() => {
      loadBillingStatus();
      loadCycles(false);
    }, [loadBillingStatus, loadCycles])
  );

  return {
    canAccessBilling,
    billingStatus,
    cycles,
    isLoading,
    isLoadingCycles,
    selectedCycle,
    pixData,
    showPixModal,
    isGeneratingPix,
    hasMore,
    totalPending,
    loadCycles,
    handleGeneratePix,
    handleGenerateDebtPix,
    handleCopyPixCode,
    closePixModal,
  };
}
