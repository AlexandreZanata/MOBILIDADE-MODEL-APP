import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { rideDetailsFacade } from '@/services/rideDetails/rideDetailsFacade';
import { RideDetailsRide } from '@/models/rideDetails/types';
import { trd } from '@/i18n/rideDetails';

interface NavigationLike {
  goBack: () => void;
}

interface RouteLike {
  params?: unknown;
}

interface UseRideDetailsInput {
  navigation: NavigationLike;
  route?: RouteLike;
}

export function useRideDetails(input: UseRideDetailsInput) {
  const { user } = useAuth();
  const isDriver =
    user?.roles?.includes('driver') ||
    user?.type === 'motorista' ||
    user?.type === 'driver';

  const initialRide = useMemo<RideDetailsRide | null>(() => {
    try {
      const params = rideDetailsFacade.parseRouteParams(input.route?.params);
      if (!params.ride) return null;
      return rideDetailsFacade.parseRide(params.ride);
    } catch {
      return null;
    }
  }, [input.route?.params]);

  const [ride, setRide] = useState<RideDetailsRide | null>(initialRide);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    setRide(initialRide);
  }, [initialRide]);

  useEffect(() => {
    let mounted = true;

    async function refreshRideDetails() {
      if (!initialRide?.id) return;
      setIsLoadingDetails(true);
      const detailedRide = await rideDetailsFacade.loadRideDetails(initialRide.id, isDriver);
      if (mounted && detailedRide) {
        setRide(detailedRide);
      }
      if (mounted) {
        setIsLoadingDetails(false);
      }
    }

    void refreshRideDetails();

    return () => {
      mounted = false;
    };
  }, [initialRide?.id, isDriver]);

  const formatDate = useCallback((dateString?: string): string => {
    if (!dateString) return trd('noInfo');
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }, []);

  const formatPrice = useCallback((price?: number | null): string => {
    if (!price) return trd('defaultCurrency');
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }, []);

  const formatDistance = useCallback((distanceKm?: number): string | null => {
    if (distanceKm === undefined) return null;
    if (distanceKm < 1) return `${(distanceKm * 1000).toFixed(0)} m`;
    return `${distanceKm.toFixed(2)} km`;
  }, []);

  const formatDuration = useCallback((durationMinutes?: number): string | null => {
    if (durationMinutes === undefined) return null;
    const rounded = Math.round(durationMinutes);
    if (rounded === 1) return `1 ${trd('minutesSingle')}`;
    return `${rounded} ${trd('minutesPlural')}`;
  }, []);

  const statusLabel = useMemo(() => {
    if (!ride?.status) return '';
    const status = ride.status.toUpperCase();
    if (['CONCLUIDA', 'COMPLETED', 'CORRIDA_FINALIZADA'].includes(status)) return trd('finishedStatus');
    if (['CANCELADA_MOTORISTA', 'CANCELED_BY_DRIVER'].includes(status)) return trd('canceledByDriverStatus');
    if (['CANCELADA_PASSAGEIRO', 'CANCELED_BY_PASSENGER'].includes(status)) return trd('canceledByPassengerStatus');
    if (['CANCELLED'].includes(status)) return trd('canceledStatus');
    if (['EXPIRADA', 'EXPIRED'].includes(status)) return trd('expiredStatus');
    return ride.status;
  }, [ride?.status]);

  const statusTone = useMemo<'success' | 'error' | 'warning'>(() => {
    if (!ride?.status) return 'warning';
    const status = ride.status.toUpperCase();
    if (['CONCLUIDA', 'COMPLETED', 'CORRIDA_FINALIZADA'].includes(status)) return 'success';
    if (
      ['CANCELADA_MOTORISTA', 'CANCELADA_PASSAGEIRO', 'CANCELLED', 'CANCELED_BY_DRIVER', 'CANCELED_BY_PASSENGER', 'EXPIRADA', 'EXPIRED'].includes(
        status
      )
    ) {
      return 'error';
    }
    return 'warning';
  }, [ride?.status]);

  const peer = useMemo(() => {
    if (!ride) return null;
    return isDriver ? ride.passenger : ride.driver;
  }, [isDriver, ride]);

  const peerPhoto = useMemo(
    () => rideDetailsFacade.normalizePhotoUrl(peer?.photoUrl, peer?.id),
    [peer?.id, peer?.photoUrl]
  );

  return {
    ride,
    isDriver,
    isLoadingDetails,
    statusLabel,
    statusTone,
    peer,
    peerPhoto,
    formatDate,
    formatPrice,
    formatDistance,
    formatDuration,
    onBack: input.navigation.goBack,
  };
}
