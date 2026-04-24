import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import Button from '@/components/Button';
import { spacing, typography, shadows } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { apiService, API_BASE_URL } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RidesScreenProps {
  navigation: any;
}

interface Ride {
  id: string;
  passengerId?: string;
  driverId?: string;
  serviceCategoryId?: string;
  paymentMethodId?: string;
  cardBrandId?: string;
  status: string;
  estimatedPrice?: number;
  finalPrice?: number | null;
  distanceKm?: number;
  durationMinutes?: number;
  surge?: number;
  requestedAt?: string;
  createdAt?: string;
  passenger?: {
    id: string;
    name: string;
    rating?: number;
    photoUrl?: string;
  };
  driver?: {
    id: string;
    name: string;
    rating?: number;
    photoUrl?: string;
    vehicle?: {
      licensePlate: string;
      brand: string;
      model: string;
      color: string;
    };
  };
}

export const RidesScreen: React.FC<RidesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Detecta se o usuário é motorista
  const isDriver = user?.roles?.includes('driver') || user?.type === 'motorista' || user?.type === 'driver';

  // Normaliza URL da foto de perfil
  const getPhotoUrl = (photoUrl?: string, userId?: string): string | undefined => {
    if (!photoUrl) return undefined;
    if (photoUrl.startsWith('http')) return photoUrl;
    
    // Se tem userId, usa a rota pública
    if (userId) {
      return `${API_BASE_URL}/profile-photos/${userId}`;
    }
    
    // Tenta extrair userId do path
    const match = photoUrl.match(/profile-photos\/([a-f0-9-]+)/i);
    if (match && match[1]) {
      return `${API_BASE_URL}/profile-photos/${match[1]}`;
    }
    
    return undefined;
  };

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const loadRides = useCallback(async (cursor?: string | null, isRefresh = false) => {
    // Não faz requisições se não estiver autenticado
    if (!isAuthenticated) {
      setIsLoading(false);
      setIsRefreshing(false);
      setRides([]);
      return;
    }

    try {
      if (!isRefresh) {
        setIsLoading(true);
      }

      const params = {
        cursor: cursor || undefined,
        limit: 20,
        sort: '-requestedAt',
      };

      const response = isDriver
        ? await apiService.getDriverRides(params)
        : await apiService.getPassengerRides(params);

      if (response.success && response.data) {
        if (isRefresh) {
          setRides(response.data.items || []);
        } else {
          setRides(prev => [...prev, ...(response.data?.items || [])]);
        }

        // Paginação robusta: considera tanto hasMore quanto nextCursor
        const next = response.data.nextCursor || null;
        const hasMoreFlag = !!(response.data.hasMore || next);

        setNextCursor(next);
        setHasMore(hasMoreFlag);
      } else {
        console.error('[RidesScreen] Erro ao carregar corridas:', response.error);
        if (!isRefresh) {
          setRides([]);
        }
      }
    } catch (error) {
      console.error('[RidesScreen] Erro ao carregar corridas:', error);
      if (!isRefresh) {
        setRides([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isDriver, isAuthenticated]);

  // Carrega corridas quando a tela é focada
  useFocusEffect(
    useCallback(() => {
      loadRides(null, true);
    }, [loadRides])
  );

  const handleRefresh = useCallback(() => {
    if (!isAuthenticated) {
      setIsRefreshing(false);
      return;
    }
    setIsRefreshing(true);
    loadRides(null, true);
  }, [loadRides, isAuthenticated]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && nextCursor && !isLoading) {
      loadRides(nextCursor, false);
    }
  }, [hasMore, nextCursor, isLoading, loadRides]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays === 1) {
        return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays < 7) {
        return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    } catch (error) {
      return dateString;
    }
  };

  const formatPrice = (price?: number): string => {
    if (!price) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'CONCLUIDA':
      case 'COMPLETED':
      case 'CORRIDA_FINALIZADA':
        return colors.status.success;
      case 'CANCELADA_MOTORISTA':
      case 'CANCELADA_PASSAGEIRO':
      case 'CANCELLED':
      case 'CANCELED_BY_DRIVER':
      case 'CANCELED_BY_PASSENGER':
      case 'NO_SHOW':
      case 'EXPIRED':
      case 'EXPIRADA':
        return colors.status.error;
      case 'SOLICITADA':
      case 'REQUESTED':
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ARRIVING':
      case 'DRIVER_ARRIVED':
      case 'IN_PROGRESS':
      case 'WAITING_AT_DESTINATION':
        return colors.status.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'CONCLUIDA':
      case 'COMPLETED':
      case 'CORRIDA_FINALIZADA':
        return 'Concluída';
      case 'CANCELADA_MOTORISTA':
        return 'Cancelada pelo motorista';
      case 'CANCELADA_PASSAGEIRO':
        return 'Cancelada pelo passageiro';
      case 'CANCELLED':
      case 'CANCELED_BY_DRIVER':
        return 'Cancelada';
      case 'CANCELED_BY_PASSENGER':
        return 'Cancelada pelo passageiro';
      case 'NO_SHOW':
        return 'Não compareceu';
      case 'EXPIRED':
      case 'EXPIRADA':
        return 'Expirada';
      case 'SOLICITADA':
      case 'REQUESTED':
        return 'Solicitada';
      case 'DRIVER_ASSIGNED':
        return 'Motorista atribuído';
      case 'DRIVER_ARRIVING':
        return 'Motorista chegando';
      case 'DRIVER_ARRIVED':
        return 'Motorista chegou';
      case 'IN_PROGRESS':
        return 'Em andamento';
      case 'WAITING_AT_DESTINATION':
        return 'Aguardando no destino';
      default:
        return status;
    }
  };

  const handleRidePress = (ride: Ride) => {
    navigation.navigate('RideDetails', { ride });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: Math.max(insets.top, spacing.lg) + spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: colors.background,
    },
    headerTitle: {
      ...typography.h1,
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      ...typography.body,
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      minHeight: 400,
    },
    emptyIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: hexToRgba(colors.primary, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      ...typography.h2,
      fontSize: 20,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center',
      fontWeight: '700',
    },
    emptyText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      fontSize: 15,
      lineHeight: 22,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    rideCard: {
      marginBottom: spacing.xs,
      borderRadius: 14,
      backgroundColor: colors.card,
      overflow: 'hidden',
      ...shadows.small,
    },
    rideCardContent: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    rideHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.xs,
    },
    avatarContainer: {
      marginRight: spacing.sm,
    },
    rideMainInfo: {
      flex: 1,
    },
    rideNameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xs,
    },
    rideName: {
      ...typography.h2,
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
      marginRight: spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 8,
      flexShrink: 0,
    },
    statusText: {
      ...typography.caption,
      fontWeight: '700',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    rideDate: {
      ...typography.caption,
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: spacing.xs,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: spacing.xs,
      opacity: 0.4,
    },
    rideDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rideMetaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    rideMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    rideMetaIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: hexToRgba(colors.primary, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
    },
    rideMetaText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    ridePriceContainer: {
      alignItems: 'flex-end',
    },
    ridePriceLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    ridePrice: {
      ...typography.h2,
      color: colors.primary,
      fontSize: 16,
      fontWeight: '800',
    },
    loadMoreContainer: {
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    loadMoreButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 10,
      backgroundColor: hexToRgba(colors.primary, 0.08),
    },
    loadMoreText: {
      ...typography.body,
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
    },
    loginButton: {
      marginTop: spacing.lg,
      minHeight: 56,
      height: 56,
      borderRadius: 16,
    },
  });

  if (isLoading && rides.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Corridas</Text>
        <Text style={styles.headerSubtitle}>
          {!isAuthenticated 
            ? 'Faça login para ver seu histórico de corridas'
            : isDriver 
              ? 'Histórico de corridas realizadas' 
              : 'Suas viagens recentes'}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {!isAuthenticated ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="car-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Faça login para continuar</Text>
            <Text style={styles.emptyText}>
              Você precisa estar logado para ver seu histórico de corridas
            </Text>
            <Button
              title="Fazer Login"
              onPress={() => navigation.navigate('Login')}
              variant="primary"
              fullWidth
              style={styles.loginButton}
            />
          </View>
        ) : rides.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="car-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma corrida ainda</Text>
            <Text style={styles.emptyText}>
              Suas corridas aparecerão aqui assim que você realizar sua primeira viagem
            </Text>
          </View>
        ) : (
          <>
            {rides.map((ride) => (
              <TouchableOpacity
                key={ride.id}
                onPress={() => handleRidePress(ride)}
                activeOpacity={0.7}
              >
                <View style={styles.rideCard}>
                  <View style={styles.rideCardContent}>
                    {/* Header com Avatar e Info Principal */}
                    <View style={styles.rideHeader}>
                      <View style={styles.avatarContainer}>
                        {isDriver ? (
                          <Avatar
                            uri={ride.passenger ? getPhotoUrl(ride.passenger.photoUrl, ride.passenger.id) : undefined}
                            name={ride.passenger?.name || 'Passageiro'}
                            size={44}
                          />
                        ) : (
                          <Avatar
                            uri={ride.driver ? getPhotoUrl(ride.driver.photoUrl, ride.driver.id) : undefined}
                            name={ride.driver?.name || 'Motorista'}
                            size={44}
                          />
                        )}
                      </View>
                      <View style={styles.rideMainInfo}>
                        <View style={styles.rideNameRow}>
                          <Text style={styles.rideName} numberOfLines={1}>
                            {isDriver
                              ? ride.passenger?.name || 'Passageiro'
                              : ride.driver?.name || 'Motorista'}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: getStatusColor(ride.status) + '18' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                { color: getStatusColor(ride.status) },
                              ]}
                            >
                              {getStatusText(ride.status)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.rideDate}>
                          {formatDate(ride.requestedAt || ride.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Detalhes: Distância, Duração e Preço */}
                    <View style={styles.rideDetails}>
                      <View style={styles.rideMetaContainer}>
                        {ride.distanceKm && (
                          <View style={styles.rideMetaItem}>
                            <View style={styles.rideMetaIcon}>
                              <Ionicons name="navigate-outline" size={14} color={colors.primary} />
                            </View>
                            <Text style={styles.rideMetaText}>
                              {ride.distanceKm.toFixed(1)} km
                            </Text>
                          </View>
                        )}
                        {ride.durationMinutes && (
                          <View style={styles.rideMetaItem}>
                            <View style={styles.rideMetaIcon}>
                              <Ionicons name="time-outline" size={14} color={colors.primary} />
                            </View>
                            <Text style={styles.rideMetaText}>
                              {Math.round(ride.durationMinutes)} min
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.ridePriceContainer}>
                        <Text style={styles.ridePriceLabel}>Valor</Text>
                        <Text style={styles.ridePrice}>
                          {formatPrice(ride.finalPrice || ride.estimatedPrice)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {hasMore && (
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.loadMoreText}>Carregar mais</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

