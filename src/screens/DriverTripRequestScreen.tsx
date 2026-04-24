import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import Button from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { spacing, typography, borders, shadows } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { reverseGeocode as placesReverseGeocode, getCachedAddress } from '@/services/placesService';
import { StarRatingBadge } from '@/components/StarRating';

interface TripData {
  trip_id: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  estimated_fare: number;
  assignment_expires_at: string;
  category?: string;
  requested_at?: string;
  passenger?: {
    id?: string;
    name?: string;
    rating?: number;
    phone?: string;
    photoUrl?: string;
  };
  distance_km?: number;
  duration_seconds?: number;
  payment_method?: {
    id?: string;
    name?: string;
    slug?: string;
  };
  payment_brand?: {
    id?: string;
    name?: string;
    slug?: string;
  };
}

interface DriverTripRequestScreenProps {
  visible?: boolean;
  tripData?: TripData | null;
  onAccept?: () => void;
  onReject?: () => void;
  onTimeout?: () => void;
  // Props de navegação (quando usado como tela)
  navigation?: any;
  route?: {
    params?: {
      visible?: boolean;
      tripData?: TripData | null;
      onAccept?: () => void;
      onReject?: () => void;
      onTimeout?: () => void;
    };
  };
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export const DriverTripRequestScreen: React.FC<DriverTripRequestScreenProps> = ({
  visible: visibleProp,
  tripData: tripDataProp,
  onAccept: onAcceptProp,
  onReject: onRejectProp,
  onTimeout: onTimeoutProp,
  navigation,
  route,
}) => {
  // Suporta tanto uso como componente modal quanto como tela de navegação
  // Se receber tripData e nenhum flag de visibilidade, abrimos por padrão
  const visible = visibleProp ?? route?.params?.visible ?? !!(tripDataProp ?? route?.params?.tripData);
  const tripData = tripDataProp ?? route?.params?.tripData ?? null;
  const onAccept = onAcceptProp ?? route?.params?.onAccept ?? (() => navigation?.goBack());
  const onReject = onRejectProp ?? route?.params?.onReject ?? (() => navigation?.goBack());
  // Não disparamos timeout localmente; o backend controla a expiração
  const onTimeout = onTimeoutProp ?? (() => {});
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [originAddress, setOriginAddress] = useState<string>('');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  
  // Refs para evitar múltiplos timers e rastrear a corrida atual
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTripIdRef = useRef<string | null>(null);
  const isTimerRunningRef = useRef<boolean>(false);
  
  const [cardHeight, setCardHeight] = useState(220);

  // Resolve dados do passageiro e aplica a mesma lógica das telas em andamento
  const resolvedPassenger = useMemo(() => {
    if (!tripData?.passenger) return null;
    const passenger: any = tripData.passenger;
    const passengerId =
      passenger.id ||
      passenger.passengerId ||
      passenger.passenger_id ||
      (tripData as any)?.passenger_id;
    const directPhoto =
      passenger.photoUrl ||
      passenger.photo_url ||
      passenger.profile_photo ||
      passenger.avatar ||
      passenger.avatar_url;

    const photoUri = (() => {
      if (directPhoto) {
        const isAbsolute = typeof directPhoto === 'string' && /^https?:\/\//i.test(directPhoto);
        const isS3Path = typeof directPhoto === 'string' && directPhoto.includes('profile-photos');
        if (isAbsolute || isS3Path) return directPhoto;
        if (passengerId) return apiService.getProfilePhotoUrl(passengerId);
      }
      if (passengerId) return apiService.getProfilePhotoUrl(passengerId);
      return undefined;
    })();

    return {
      id: passengerId,
      name: passenger.name || passenger.full_name || 'Passageiro',
      rating: passenger.rating,
      phone: passenger.phone,
      photoUri,
      raw: passenger,
    };
  }, [tripData]);

  // Função para fazer reverse geocoding usando Places API (com cache)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // 1. Verifica cache primeiro (evita requisições duplicadas)
      const cachedAddress = getCachedAddress(lat, lng);
      if (cachedAddress) {
        console.log('[DriverTripRequest] Usando endereço do cache:', cachedAddress.split(',')[0]);
        const parts = cachedAddress.split(',').slice(0, 3).join(', ');
        return parts || cachedAddress;
      }

      // 2. Se não tem cache, faz a requisição (que também salva no cache)
      const result = await placesReverseGeocode(lat, lng);

      if (result && result.display_name) {
        // Pega apenas as primeiras partes do endereço (mais relevantes)
        const parts = result.display_name.split(',').slice(0, 3).join(', ');
        return parts || result.display_name;
      }
    } catch (error) {
      console.error('[DriverTripRequest] Erro no reverse geocoding:', error);
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };


  useEffect(() => {
    if (visible && tripData) {
      const tripId = tripData.trip_id;
      
      // Se é a mesma corrida que já está sendo exibida, não reinicia o timer
      if (currentTripIdRef.current === tripId && isTimerRunningRef.current) {
        console.log('[DriverTripRequest] Modal já está aberto para esta corrida, ignorando reinicialização');
        return;
      }
      
      // Limpa timer anterior se existir
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        isTimerRunningRef.current = false;
      }
      
      // Marca que esta é a corrida atual e inicia o timer
      currentTripIdRef.current = tripId;
      
      // Anima o modal subindo
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Busca endereços em background
      reverseGeocode(tripData.origin.lat, tripData.origin.lng).then(setOriginAddress);
      reverseGeocode(tripData.destination.lat, tripData.destination.lng).then(setDestinationAddress);

      // Contagem regressiva baseada no assignment_expires_at do backend
      const expiresAtMs =
        (tripData.assignment_expires_at && new Date(tripData.assignment_expires_at).getTime()) ||
        Date.now() + 15000;

      const computeLeft = () => Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));

      if (!isTimerRunningRef.current) {
        isTimerRunningRef.current = true;
        setTimeLeft(computeLeft());
        timerRef.current = setInterval(() => {
          const left = computeLeft();
          setTimeLeft(left);

          if (left <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            isTimerRunningRef.current = false;
            currentTripIdRef.current = null;
            console.log('[DriverTripRequest] Tempo da oferta expirou (assignment_expires_at)');
            onTimeout?.();
          }
        }, 1000);
      }

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        isTimerRunningRef.current = false;
      };
    } else {
      // Limpa tudo quando o modal fecha
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      isTimerRunningRef.current = false;
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible, tripData]);

  // Limpa referências e endereços quando o modal fecha completamente
  useEffect(() => {
    if (!visible) {
      // Limpa após um pequeno delay para garantir que animações terminem
      const timeout = setTimeout(() => {
        currentTripIdRef.current = null;
        setOriginAddress('');
        setDestinationAddress('');
        setTimeLeft(null);
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDistance = (km?: number): string => {
    if (!km) return '';
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1).replace('.', ',')} km`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      width: '100%',
      backgroundColor: colors.background,
    },
    topSafeArea: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: Math.max(insets.top, 0),
      backgroundColor: colors.background,
      zIndex: 10,
    },
    modalContent: {
      position: 'absolute',
      top: Math.max(insets.top, 0),
      bottom: Math.max(insets.bottom, 0),
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      ...shadows.large,
      shadowColor: colors.shadow,
    },
    scrollContent: {
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    buttonsContainer: {
      paddingHorizontal: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
      paddingTop: spacing.md,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    timerContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: hexToRgba(colors.secondary, 0.15),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.secondary,
    },
    timerText: {
      ...typography.h1,
      fontSize: 24,
      fontWeight: '800',
      color: colors.secondary,
    },
    title: {
      ...typography.h1,
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.body,
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    tripCard: {
      marginBottom: spacing.lg,
    },
    tripSection: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.caption,
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    timelineContainer: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingVertical: spacing.xs,
    },
    timelineColumn: {
      alignItems: 'center',
      width: 26,
    },
    timelineDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: colors.background,
      ...shadows.small,
    },
    timelineLine: {
      flex: 1,
      width: 2,
      backgroundColor: colors.border,
      marginVertical: spacing.xs,
    },
    timelineContent: {
      flex: 1,
      gap: spacing.md,
    },
    timelineItem: {
      padding: spacing.sm,
      backgroundColor: hexToRgba(colors.primary, 0.03),
      borderRadius: borders.radiusMedium,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: hexToRgba(colors.primary, 0.1),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    locationContent: {
      flex: 1,
    },
    locationLabel: {
      ...typography.caption,
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    locationText: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.sm,
    },
    priceLabel: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    priceValue: {
      ...typography.h1,
      fontSize: 28,
      fontWeight: '800',
      color: colors.secondary,
    },
    buttonsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.md,
    },
    rejectButton: {
      flex: 1,
    },
    acceptButton: {
      flex: 2,
    },
    passengerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    passengerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: hexToRgba(colors.primary, 0.06),
      borderRadius: borders.radiusMedium,
      padding: spacing.sm,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: hexToRgba(colors.primary, 0.15),
    },
    passengerAvatarWrapper: {
      width: 64,
      height: 64,
      borderRadius: 32,
      padding: 2,
      backgroundColor: colors.card,
      ...shadows.small,
    },
    passengerDetails: {
      flex: 1,
      gap: spacing.xs,
    },
    passengerName: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    passengerNameLarge: {
      ...typography.h1,
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: hexToRgba(colors.secondary, 0.1),
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: 8,
    },
    ratingText: {
      ...typography.caption,
      fontSize: 12,
      fontWeight: '600',
      color: colors.secondary,
      fontFamily: 'Poppins-SemiBold',
    },
    passengerMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    passengerIdPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borders.radiusMedium,
      backgroundColor: hexToRgba(colors.textSecondary, 0.08),
      borderWidth: 1,
      borderColor: colors.border,
    },
    passengerIdText: {
      ...typography.caption,
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    infoChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    infoChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      backgroundColor: hexToRgba(colors.textSecondary, 0.08),
      borderRadius: borders.radiusMedium,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoChipText: {
      ...typography.caption,
      fontSize: 12,
      color: colors.textPrimary,
      fontWeight: '600',
      fontFamily: 'Poppins-SemiBold',
    },
    paymentBrandBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: hexToRgba(colors.secondary, 0.1),
      paddingHorizontal: spacing.xs,
      paddingVertical: 4,
      borderRadius: 8,
      marginTop: spacing.xs,
      alignSelf: 'flex-start',
    },
    paymentBrandText: {
      ...typography.caption,
      fontSize: 11,
      fontWeight: '600',
      color: colors.secondary,
      fontFamily: 'Poppins-SemiBold',
    },
  });

  // Log para debug
  useEffect(() => {
    console.log('[DriverTripRequest] Props atualizadas:', {
      visible,
      hasTripData: !!tripData,
      tripId: tripData?.trip_id,
    });
  }, [visible, tripData]);

  // Log para visibilidade computada e temas
  useEffect(() => {
    console.log('[DriverTripRequest] Visibilidade computada:', {
      visibleProp,
      routeVisible: route?.params?.visible,
      hasTripData: !!tripData,
      computedVisible: visible,
    });
  }, [visibleProp, route?.params?.visible, tripData, visible]);

  // Log dedicado para depurar a foto do passageiro
  useEffect(() => {
    if (!tripData) return;
    console.log('[DriverTripRequest] Passageiro resolvido para avatar:', {
      tripId: tripData.trip_id,
      passengerId: resolvedPassenger?.id,
      passengerName: resolvedPassenger?.name,
      passengerPhotoUri: resolvedPassenger?.photoUri,
      rawPassenger: tripData.passenger,
      photoIsAbsolute: resolvedPassenger?.photoUri ? /^https?:\/\//i.test(resolvedPassenger.photoUri) : false,
    });
  }, [tripData, resolvedPassenger]);

  // Fecha modal quando o tempo expira
  useEffect(() => {
    if (timeLeft === 0) {
      console.log('[DriverTripRequest] timeLeft chegou a zero, disparando onTimeout');
      onTimeout?.();
    }
  }, [timeLeft, onTimeout]);

  if (!tripData) {
    console.log('[DriverTripRequest] tripData é null/undefined, não renderizando modal');
    return null;
  }

  console.log('[DriverTripRequest] Renderizando modal com visible:', visible);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onReject}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={styles.overlay}>
        {/* Área de background para notificações nativas */}
        {insets.top > 0 && <View style={styles.topSafeArea} />}
        
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Nova Corrida</Text>
              <Text style={styles.subtitle}>Responda à oferta para continuar</Text>

              {/* Destaque do passageiro */}
              {resolvedPassenger && (resolvedPassenger.rating !== undefined || resolvedPassenger.name || resolvedPassenger.id) && (
                <View style={styles.passengerCard}>
                  <View style={styles.passengerAvatarWrapper}>
                    <Avatar
                      key={resolvedPassenger.photoUri || resolvedPassenger.id}
                      uri={resolvedPassenger.photoUri}
                      name={resolvedPassenger.name || 'P'}
                      size={60}
                      showBorder
                      onImageError={() =>
                        console.log('[DriverTripRequest] Falha ao carregar avatar do passageiro', {
                          tripId: tripData.trip_id,
                          passenger: resolvedPassenger,
                        })
                      }
                    />
                  </View>
                  <View style={styles.passengerDetails}>
                    <Text style={styles.passengerNameLarge}>{resolvedPassenger.name || 'Passageiro'}</Text>
                    <View style={styles.passengerMetaRow}>
                      {resolvedPassenger.rating !== undefined && resolvedPassenger.rating > 0 && (
                        <StarRatingBadge
                          rating={resolvedPassenger.rating}
                          maxRating={10}
                          starCount={5}
                          starSize={13}
                        />
                      )}
                      {resolvedPassenger.id && (
                        <View style={styles.passengerIdPill}>
                          <Ionicons name="person" size={12} color={colors.textSecondary} />
                          <Text style={styles.passengerIdText}>{resolvedPassenger.id.slice(0, 6)}...</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.md }}
          >
            <Card 
              style={styles.tripCard}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                setCardHeight(height);
              }}
            >
            <View style={styles.tripSection}>
              <Text style={styles.sectionTitle}>Percurso</Text>
              <View style={styles.timelineContainer}>
                <View style={styles.timelineColumn}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                  <View style={styles.timelineLine} />
                  <View style={[styles.timelineDot, { backgroundColor: colors.secondary }]} />
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineItem}>
                    <Text style={styles.locationLabel}>Origem</Text>
                    <Text style={styles.locationText} numberOfLines={2} ellipsizeMode="tail">
                      {originAddress || `${tripData.origin.lat.toFixed(4)}, ${tripData.origin.lng.toFixed(4)}`}
                    </Text>
                  </View>
                  <View style={styles.timelineItem}>
                    <Text style={styles.locationLabel}>Destino</Text>
                    <Text style={styles.locationText} numberOfLines={2} ellipsizeMode="tail">
                      {destinationAddress || `${tripData.destination.lat.toFixed(4)}, ${tripData.destination.lng.toFixed(4)}`}
                    </Text>
                    {tripData.payment_brand && tripData.payment_brand.name && (
                      <View style={styles.paymentBrandBadge}>
                        <Ionicons name="card" size={14} color={colors.secondary} />
                        <Text style={styles.paymentBrandText}>{tripData.payment_brand.name}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {(tripData.distance_km || tripData.duration_seconds || tripData.category || (tripData.payment_method && tripData.payment_method.name && tripData.payment_method.name !== 'Carregando...')) && (
              <View style={[styles.tripSection, { marginTop: spacing.sm }]}>
                <Text style={styles.sectionTitle}>Detalhes</Text>
                <View style={styles.infoChipsRow}>
                  {tripData.distance_km && (
                    <View style={styles.infoChip}>
                      <Ionicons name="navigate" size={16} color={colors.textPrimary} />
                      <Text style={styles.infoChipText}>
                        {formatDistance(tripData.distance_km)}
                        {tripData.duration_seconds ? ` • ${formatDuration(tripData.duration_seconds)}` : ''}
                      </Text>
                    </View>
                  )}

                  {tripData.category && (
                    <View style={styles.infoChip}>
                      <Ionicons name="car" size={16} color={colors.textPrimary} />
                      <Text style={styles.infoChipText}>{tripData.category}</Text>
                    </View>
                  )}

                  {tripData.payment_method && tripData.payment_method.name && tripData.payment_method.name !== 'Carregando...' && (
                    <View style={styles.infoChip}>
                      <Ionicons name="card-outline" size={16} color={colors.textPrimary} />
                      <Text style={styles.infoChipText}>
                        {tripData.payment_method.name}
                        {tripData.payment_brand?.name ? ` • ${tripData.payment_brand.name}` : ''}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Valor estimado</Text>
              <Text style={styles.priceValue}>{formatPrice(tripData.estimated_fare)}</Text>
            </View>
          </Card>
          </ScrollView>

          <View style={styles.buttonsContainer}>
            <View style={styles.buttonsRow}>
              <Button
                title="Recusar"
                onPress={onReject}
                variant="ghost"
                style={styles.rejectButton}
              />
              <Button
                title="Aceitar Corrida"
                onPress={onAccept}
                variant="primary"
                style={styles.acceptButton}
                disabled={timeLeft === 0}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};



