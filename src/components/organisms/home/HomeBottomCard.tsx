import React, { memo, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme';
import { HomeDestination } from '@/models/home/types';
import { TripCategoryOption } from '@/models/tripPrice/types';
import { th } from '@/i18n/home';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  destination: HomeDestination | null;
  isMinimized: boolean;
  isLoadingCategories: boolean;
  rideCategories: TripCategoryOption[];
  selectedCategoryId: string | null;
  onToggleMinimized: () => void;
  onSelectCategory: (id: string) => void;
  onRequestTrip: () => void;
  onLayoutHeight: (height: number) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} ${th('etaUnit')}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ---------------------------------------------------------------------------
// RideTypeCard — single carousel item
// ---------------------------------------------------------------------------

interface RideTypeCardProps {
  item: TripCategoryOption;
  isSelected: boolean;
  onPress: (id: string) => void;
}

const RideTypeCard = memo(({ item, isSelected, onPress }: RideTypeCardProps) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    card: {
      borderWidth: isSelected ? 1.5 : 0.5,
      borderColor: isSelected ? colors.primary : colors.border,
      borderRadius: 14,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm + 2,
      alignItems: 'center',
      minWidth: 88,
      backgroundColor: isSelected ? hexToRgba(colors.primary, 0.06) : colors.card,
      marginRight: spacing.sm,
    },
    icon: {
      marginBottom: spacing.xs,
    },
    name: {
      fontSize: 11,
      fontWeight: '600',
      color: isSelected ? colors.primary : colors.textSecondary,
      fontFamily: 'Poppins-SemiBold',
      textAlign: 'center',
    },
    price: {
      fontSize: 11,
      color: isSelected ? colors.primary : colors.textSecondary,
      fontFamily: 'Poppins-Regular',
      marginTop: 1,
    },
    eta: {
      fontSize: 10,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
      marginTop: 1,
    },
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item.id)}
      activeOpacity={0.75}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${item.name}, ${formatPrice(item.finalFare)}`}
    >
      <Ionicons
        style={styles.icon}
        name="car-outline"
        size={20}
        color={isSelected ? colors.primary : colors.textSecondary}
      />
      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.price}>{formatPrice(item.finalFare)}</Text>
      <Text style={styles.eta}>{formatDuration(item.durationSeconds)}</Text>
    </TouchableOpacity>
  );
});

// ---------------------------------------------------------------------------
// HomeBottomCard
// ---------------------------------------------------------------------------

export const HomeBottomCard = memo(function HomeBottomCard({
  destination,
  isMinimized,
  isLoadingCategories,
  rideCategories,
  selectedCategoryId,
  onToggleMinimized,
  onSelectCategory,
  onRequestTrip,
  onLayoutHeight,
}: Props) {
  const { colors } = useTheme();

  const renderItem = useCallback(
    ({ item }: { item: TripCategoryOption }) => (
      <RideTypeCard
        item={item}
        isSelected={selectedCategoryId === item.id}
        onPress={onSelectCategory}
      />
    ),
    [onSelectCategory, selectedCategoryId],
  );

  const keyExtractor = useCallback((item: TripCategoryOption) => item.id, []);

  const styles = StyleSheet.create({
    card: {
      position: 'absolute',
      bottom: 8,
      left: spacing.md,
      right: spacing.md,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing.sm,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
      fontFamily: 'Poppins-SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
    },
    destRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    destIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: hexToRgba(colors.primary, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
    },
    destInfo: { flex: 1 },
    destName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    destAddr: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
      marginTop: 1,
    },
    etaBlock: { alignItems: 'flex-end' },
    etaVal: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    etaUnit: {
      fontSize: 10,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginBottom: spacing.sm,
    },
    carouselContainer: {
      marginBottom: spacing.sm,
      minHeight: 90,
      justifyContent: 'center',
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    loadingText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
    },
    emptyText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
      paddingVertical: spacing.sm,
    },
    ctaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    couponBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
  });

  const showCarousel = !!destination;

  return (
    <Card
      style={styles.card}
      onLayout={(e) => onLayoutHeight(e.nativeEvent.layout.height)}
    >
      {/* Drag handle */}
      <View style={styles.handle} />

      {/* Header row: label + collapse toggle */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>{th('rideTypesSectionLabel')}</Text>
        <TouchableOpacity
          onPress={onToggleMinimized}
          accessibilityRole="button"
          accessibilityLabel={isMinimized ? 'Expandir' : 'Minimizar'}
        >
          <Ionicons
            name={isMinimized ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {!isMinimized && (
        <>
          {/* Destination row */}
          {destination ? (
            <>
              <View style={styles.destRow}>
                <View style={styles.destIcon}>
                  <Ionicons name="location" size={18} color={colors.primary} />
                </View>
                <View style={styles.destInfo}>
                  <Text style={styles.destName} numberOfLines={1}>
                    {destination.name}
                  </Text>
                  <Text style={styles.destAddr} numberOfLines={1}>
                    {destination.displayName}
                  </Text>
                </View>
                <View style={styles.etaBlock}>
                  <Text style={styles.etaVal}>30</Text>
                  <Text style={styles.etaUnit}>{th('etaUnit')}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Ride-type carousel */}
              <View style={styles.carouselContainer}>
                {isLoadingCategories ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>{th('loadingCategories')}</Text>
                  </View>
                ) : rideCategories.length > 0 ? (
                  <FlatList
                    data={rideCategories}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 2 }}
                  />
                ) : (
                  <Text style={styles.emptyText}>{th('noCategoriesAvailable')}</Text>
                )}
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>{th('selectDestination')}</Text>
          )}

          {/* CTA row */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.couponBtn}
              accessibilityRole="button"
              accessibilityLabel={th('couponButton')}
            >
              <Ionicons name="pricetag-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <Button
              title={th('requestTripButton')}
              onPress={onRequestTrip}
              variant="primary"
              fullWidth
              disabled={showCarousel && (isLoadingCategories || !selectedCategoryId)}
              style={{ flex: 1 }}
            />
          </View>
        </>
      )}
    </Card>
  );
});
