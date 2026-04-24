import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/atoms/Card';
import { Avatar } from '@/components/atoms/Avatar';
import { StarRatingBadge } from '@/components/atoms/StarRating';
import { spacing, typography, shadows } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RideDetailsScreenProps {
  route?: {
    params?: {
      ride?: {
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
      };
    };
  };
  navigation: any;
}

export const RideDetailsScreen: React.FC<RideDetailsScreenProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const ride = route?.params?.ride;

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  if (!ride) {
    return (
      <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Text style={{ color: colors.textPrimary }}>Corrida não encontrada</Text>
      </View>
    );
  }

  // Detecta se o usuário é motorista
  const isDriver = user?.roles?.includes('driver') || user?.type === 'motorista' || user?.type === 'driver';

  // Normaliza URL da foto de perfil
  const getPhotoUrl = (photoUrl?: string, userId?: string): string | undefined => {
    if (!photoUrl) return undefined;
    if (photoUrl.startsWith('http')) return photoUrl;
    
    if (userId) {
      return `${API_BASE_URL}/profile-photos/${userId}`;
    }
    
    const match = photoUrl.match(/profile-photos\/([a-f0-9-]+)/i);
    if (match && match[1]) {
      return `${API_BASE_URL}/profile-photos/${match[1]}`;
    }
    
    return undefined;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Não informado';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(' às ', ' às ');
    } catch (error) {
      return dateString;
    }
  };

  const formatPrice = (price?: number | null): string => {
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
        return colors.status.error;
      case 'EXPIRADA':
      case 'EXPIRED':
        return colors.status.error;
      default:
        return colors.status.warning;
    }
  };

  const getStatusText = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'CONCLUIDA':
      case 'COMPLETED':
      case 'CORRIDA_FINALIZADA':
        return 'Corrida Finalizada';
      case 'CANCELADA_MOTORISTA':
      case 'CANCELED_BY_DRIVER':
        return 'Cancelada pelo Motorista';
      case 'CANCELADA_PASSAGEIRO':
      case 'CANCELED_BY_PASSENGER':
        return 'Cancelada pelo Passageiro';
      case 'CANCELLED':
        return 'Cancelada';
      case 'EXPIRADA':
      case 'EXPIRED':
        return 'Corrida Expirada';
      default:
        return status;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeAreaTop: {
      backgroundColor: colors.card,
      paddingTop: insets.top,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: hexToRgba(colors.textPrimary, 0.05),
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      ...typography.h2,
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginLeft: spacing.md,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg,
    },
    section: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.caption,
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
    },
    // Card de Status
    statusCard: {
      borderRadius: 12,
      overflow: 'hidden',
      ...shadows.small,
    },
    statusCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    statusLabel: {
      ...typography.body,
      fontSize: 15,
      color: colors.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: 999,
    },
    statusText: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 14,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    // Card de Usuário
    userCard: {
      borderRadius: 12,
      overflow: 'hidden',
      ...shadows.small,
    },
    userCardContent: {
      padding: spacing.md,
    },
    userHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    userName: {
      ...typography.h2,
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    vehicleInfo: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    vehicleTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    vehicleTitle: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      marginLeft: spacing.xs,
    },
    vehicleGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    vehicleItem: {
      width: '48%',
      backgroundColor: hexToRgba(colors.primary, 0.05),
      borderRadius: 8,
      padding: spacing.xs + 2,
    },
    vehicleLabel: {
      ...typography.caption,
      fontSize: 10,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: 1,
    },
    vehicleValue: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    // Card de Informações
    infoCard: {
      borderRadius: 12,
      overflow: 'hidden',
      ...shadows.small,
    },
    infoCardContent: {
      padding: spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    infoRowWithIcon: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: spacing.sm,
    },
    infoIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: hexToRgba(colors.primary, 0.1),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
      marginTop: 2,
    },
    infoTextContainer: {
      flex: 1,
    },
    infoLabel: {
      ...typography.caption,
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    infoValue: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      opacity: 0.4,
      marginVertical: spacing.xs,
    },
    // Card de Preço
    priceCard: {
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: hexToRgba(colors.primary, 0.12),
      borderWidth: 1,
      borderColor: hexToRgba(colors.primary, 0.2),
    },
    priceCardContent: {
      padding: spacing.md,
    },
    priceMainRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priceLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    priceLabelIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: hexToRgba(colors.primary, 0.2),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    priceLabel: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    priceValue: {
      ...typography.h1,
      fontSize: 20,
      fontWeight: '800',
      color: colors.primary,
    },
    priceEstimatedRow: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: hexToRgba(colors.primary, 0.15),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priceEstimatedLabel: {
      ...typography.body,
      fontSize: 14,
      color: colors.textSecondary,
    },
    priceEstimatedValue: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    // Safe area bottom
    safeAreaBottom: {
      backgroundColor: colors.background,
      paddingBottom: insets.bottom,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      {/* Safe Area Top */}
      <View style={styles.safeAreaTop}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes da Corrida</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Card style={styles.statusCard}>
            <View style={styles.statusCardContent}>
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(ride.status) },
                ]}
              >
                {getStatusText(ride.status)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Informações do Usuário */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isDriver ? 'Passageiro' : 'Motorista'}
          </Text>
          <Card style={styles.userCard}>
            <View style={styles.userCardContent}>
              {isDriver && ride.passenger ? (
                <>
                  <View style={styles.userHeader}>
                    <Avatar
                      uri={getPhotoUrl(ride.passenger.photoUrl, ride.passenger.id)}
                      name={ride.passenger.name}
                      size={50}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{ride.passenger.name}</Text>
                      {ride.passenger.rating !== undefined && (
                        <StarRatingBadge rating={ride.passenger.rating} />
                      )}
                    </View>
                  </View>
                </>
              ) : !isDriver && ride.driver ? (
                <>
                  <View style={styles.userHeader}>
                    <Avatar
                      uri={getPhotoUrl(ride.driver.photoUrl, ride.driver.id)}
                      name={ride.driver.name}
                      size={50}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{ride.driver.name}</Text>
                      {ride.driver.rating !== undefined && (
                        <StarRatingBadge rating={ride.driver.rating} />
                      )}
                    </View>
                  </View>
                  {ride.driver.vehicle && (
                    <View style={styles.vehicleInfo}>
                      <View style={styles.vehicleTitleRow}>
                        <Ionicons name="car" size={18} color={colors.primary} />
                        <Text style={styles.vehicleTitle}>Veículo</Text>
                      </View>
                      <View style={styles.vehicleGrid}>
                        <View style={styles.vehicleItem}>
                          <Text style={styles.vehicleLabel}>Placa</Text>
                          <Text style={styles.vehicleValue}>{ride.driver.vehicle.licensePlate}</Text>
                        </View>
                        <View style={styles.vehicleItem}>
                          <Text style={styles.vehicleLabel}>Cor</Text>
                          <Text style={styles.vehicleValue}>{ride.driver.vehicle.color}</Text>
                        </View>
                        <View style={styles.vehicleItem}>
                          <Text style={styles.vehicleLabel}>Marca</Text>
                          <Text style={styles.vehicleValue}>{ride.driver.vehicle.brand}</Text>
                        </View>
                        <View style={styles.vehicleItem}>
                          <Text style={styles.vehicleLabel}>Modelo</Text>
                          <Text style={styles.vehicleValue}>{ride.driver.vehicle.model}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.userHeader}>
                  <Avatar
                    name={isDriver ? 'Passageiro' : 'Motorista'}
                    size={50}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {isDriver ? 'Passageiro não informado' : 'Motorista não informado'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Card>
        </View>

        {/* Informações da Corrida */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Corrida</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoCardContent}>
              {ride.distanceKm !== undefined && (
                <>
                  <View style={styles.infoRowWithIcon}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="airplane" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Distância</Text>
                      <Text style={styles.infoValue}>
                        {ride.distanceKm < 1 
                          ? `${(ride.distanceKm * 1000).toFixed(0)} m` 
                          : `${ride.distanceKm.toFixed(2)} km`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                </>
              )}
              {ride.durationMinutes !== undefined && (
                <>
                  <View style={styles.infoRowWithIcon}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="time-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Duração</Text>
                      <Text style={styles.infoValue}>
                        {Math.round(ride.durationMinutes) === 0 
                          ? '0 minutos' 
                          : `${Math.round(ride.durationMinutes)} ${Math.round(ride.durationMinutes) === 1 ? 'minuto' : 'minutos'}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                </>
              )}
              {ride.surge && ride.surge > 1 && (
                <>
                  <View style={styles.infoRowWithIcon}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="flash" size={18} color={colors.status.warning} />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Multiplicador</Text>
                      <Text style={styles.infoValue}>{ride.surge.toFixed(1)}x</Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                </>
              )}
              <View style={styles.infoRowWithIcon}>
                <View style={styles.infoIcon}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Data da Solicitação</Text>
                  <Text style={styles.infoValue}>{formatDate(ride.requestedAt || ride.createdAt)}</Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* Preço */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valor</Text>
          <Card style={styles.priceCard}>
            <View style={styles.priceCardContent}>
              {ride.finalPrice ? (
                <>
                  <View style={styles.priceMainRow}>
                    <View style={styles.priceLabelContainer}>
                      <View style={styles.priceLabelIcon}>
                        <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                      </View>
                      <Text style={styles.priceLabel}>Preço Final</Text>
                    </View>
                    <Text style={styles.priceValue}>{formatPrice(ride.finalPrice)}</Text>
                  </View>
                  {ride.estimatedPrice && ride.estimatedPrice !== ride.finalPrice && (
                    <View style={styles.priceEstimatedRow}>
                      <Text style={styles.priceEstimatedLabel}>Preço Estimado</Text>
                      <Text style={styles.priceEstimatedValue}>{formatPrice(ride.estimatedPrice)}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.priceMainRow}>
                  <View style={styles.priceLabelContainer}>
                    <View style={styles.priceLabelIcon}>
                      <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.priceLabel}>Preço Estimado</Text>
                  </View>
                  <Text style={styles.priceValue}>{formatPrice(ride.estimatedPrice)}</Text>
                </View>
              )}
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Safe Area Bottom */}
      <View style={styles.safeAreaBottom} />
    </View>
  );
};

