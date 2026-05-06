import { useCallback, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Ride, RidesPage } from '@/models/rides/types';
import { ridesFacade } from '@/services/rides/ridesFacade';
import { API_BASE_URL } from '@/services/api';
import { trd } from '@/i18n/rides';

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateString;
  }
}

function formatPrice(price?: number | null): string {
  if (!price) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}

function normalizePhotoUrl(photoUrl?: string, userId?: string): string | undefined {
  if (!photoUrl) return undefined;
  if (photoUrl.startsWith('http')) return photoUrl;
  if (userId) return `${API_BASE_URL}/profile-photos/${userId}`;
  const match = photoUrl.match(/profile-photos\/([a-f0-9-]+)/i);
  return match?.[1] ? `${API_BASE_URL}/profile-photos/${match[1]}` : undefined;
}

export function useRidesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const isDriver = user?.roles?.includes('driver') || user?.type === 'motorista' || user?.type === 'driver';

  const loadRides = useCallback(
    async (cursor?: string | null, refresh = false) => {
      if (!isAuthenticated) {
        setRides([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
      if (!refresh) setIsLoading(true);

      const result = await ridesFacade.getRides(!!isDriver, { cursor: cursor ?? undefined, limit: 20, sort: '-requestedAt' });
      if (!result.success || !result.data) {
        if (!refresh) setRides([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const page: RidesPage = result.data;
      setRides((prev) => (refresh ? page.items : [...prev, ...page.items]));
      setHasMore(!!(page.hasMore || page.nextCursor));
      setNextCursor(page.nextCursor);
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [isAuthenticated, isDriver]
  );

  useFocusEffect(
    useCallback(() => {
      loadRides(null, true);
    }, [loadRides])
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadRides(null, true);
  }, [loadRides]);

  const onLoadMore = useCallback(() => {
    if (hasMore && nextCursor && !isLoading) {
      loadRides(nextCursor, false);
    }
  }, [hasMore, isLoading, loadRides, nextCursor]);

  const subtitle = useMemo(() => {
    if (!isAuthenticated) return trd('guestSubtitle');
    return isDriver ? trd('driverSubtitle') : trd('passengerSubtitle');
  }, [isAuthenticated, isDriver]);

  const vmRides = useMemo(
    () =>
      rides.map((ride) => ({
        raw: ride,
        id: ride.id,
        displayName: isDriver ? ride.passenger?.name || trd('passengerFallback') : ride.driver?.name || trd('driverFallback'),
        dateText: formatDate(ride.requestedAt || ride.createdAt),
        priceText: formatPrice(ride.finalPrice ?? ride.estimatedPrice),
        distanceText: ride.distanceKm ? `${ride.distanceKm.toFixed(1)} km` : '',
        durationText: ride.durationMinutes ? `${Math.round(ride.durationMinutes)} min` : '',
        photoUrl: isDriver ? normalizePhotoUrl(ride.passenger?.photoUrl, ride.passenger?.id) : normalizePhotoUrl(ride.driver?.photoUrl, ride.driver?.id),
      })),
    [isDriver, rides]
  );

  return {
    insets,
    colors,
    title: trd('title'),
    subtitle,
    rides: vmRides,
    hasMore,
    isLoading,
    isRefreshing,
    isAuthenticated,
    onRefresh,
    onLoadMore,
  };
}
