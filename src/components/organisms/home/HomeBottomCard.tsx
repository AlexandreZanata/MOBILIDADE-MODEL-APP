import React, { memo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { borders, shadows, spacing, typography } from '@/theme';
import { HomeDestination } from '@/models/home/types';
import { TripCategoryOption } from '@/models/tripPrice/types';
import { UiPaymentMethod } from '@/models/payment/types';
import { RideTypeChip } from '@/components/molecules/home/RideTypeChip';
import { PaymentRow } from '@/components/molecules/home/PaymentRow';
import { PaymentSheet } from '@/components/molecules/home/PaymentSheet';
import { usePaymentSheet } from '@/hooks/home/usePaymentSheet';
import { formatDuration, formatPrice } from '@/utils/formatters';
import { th } from '@/i18n/home';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HomeBottomCardProps {
  destination: HomeDestination | null;
  isMinimized: boolean;
  isLoadingCategories: boolean;
  rideCategories: TripCategoryOption[];
  selectedCategoryId: string | null;
  selectedCategoryDuration: number | null;
  onToggleMinimized: () => void;
  onSelectCategory: (id: string) => void;
  onRequestTrip: () => void;
  onLayoutHeight: (height: number) => void;
  /** Called whenever the user selects a different payment method */
  onPaymentMethodChange: (methodId: string) => void;
  /** Called whenever the user selects a different card brand (null = not required) */
  onCardBrandChange: (brandId: string | null) => void;
}

// ---------------------------------------------------------------------------
// HomeBottomCard
// ---------------------------------------------------------------------------

/**
 * Persistent bottom sheet for ride confirmation.
 * Orchestrates: destination row, ride-type chip carousel, price summary,
 * payment selector row, and the primary CTA.
 */
export const HomeBottomCard = memo(function HomeBottomCard({
  destination,
  isMinimized,
  isLoadingCategories,
  rideCategories,
  selectedCategoryId,
  selectedCategoryDuration,
  onToggleMinimized,
  onSelectCategory,
  onRequestTrip,
  onLayoutHeight,
  onPaymentMethodChange,
  onCardBrandChange,
}: HomeBottomCardProps) {
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);
  const { selectedMethod, selectedBrandId, selectMethod, selectBrand } =
    usePaymentSheet(onPaymentMethodChange, onCardBrandChange, isAuthenticated);

  const handleSelectMethod = useCallback((method: UiPaymentMethod) => {
    selectMethod(method.id);
    onPaymentMethodChange(method.id);
  }, [onPaymentMethodChange, selectMethod]);

  const handleSelectBrand = useCallback((brandId: string) => {
    selectBrand(brandId);
    onCardBrandChange(brandId);
  }, [onCardBrandChange, selectBrand]);

  const renderChip = useCallback(
    ({ item }: { item: TripCategoryOption }) => (
      <RideTypeChip
        item={item}
        isSelected={selectedCategoryId === item.id}
        onPress={onSelectCategory}
      />
    ),
    [onSelectCategory, selectedCategoryId],
  );

  const keyExtractor = useCallback((item: TripCategoryOption) => item.id, []);

  const sheetStyle = StyleSheet.flatten([
    styles.sheet,
    { backgroundColor: colors.card },
    isDark
      ? { borderTopWidth: 0.5, borderTopColor: colors.border }
      : shadows.large,
  ]);

  const ctaDisabled = !!destination && (isLoadingCategories || !selectedCategoryId);

  const selectedCategory = rideCategories.find((c) => c.id === selectedCategoryId);

  return (
    <View
      style={sheetStyle}
      onLayout={(e) => onLayoutHeight(e.nativeEvent.layout.height)}
    >
      {/* Drag handle */}
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionLabel, { color: colors.textHint }]}>
          {th('newRideTitle')}
        </Text>
        <TouchableOpacity
          onPress={onToggleMinimized}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
          {destination ? (
            <DestinationContent
              destination={destination}
              isLoadingCategories={isLoadingCategories}
              rideCategories={rideCategories}
              selectedCategoryId={selectedCategoryId}
              selectedCategoryDuration={selectedCategoryDuration}
              selectedCategory={selectedCategory ?? null}
              selectedMethod={selectedMethod}
              renderChip={renderChip}
              keyExtractor={keyExtractor}
              onOpenPaymentSheet={() => setPaymentSheetVisible(true)}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {th('selectDestination')}
            </Text>
          )}

          {/* Primary CTA */}
          <TouchableOpacity
            style={[
              styles.cta,
              { backgroundColor: colors.primary },
              ctaDisabled && styles.ctaDisabled,
            ]}
            onPress={onRequestTrip}
            disabled={ctaDisabled}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={th('requestTripButton')}
            accessibilityState={{ disabled: ctaDisabled }}
          >
            <Text style={[styles.ctaText, { color: colors.card }]}>
              {th('requestTripButton')}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <PaymentSheet
        visible={paymentSheetVisible}
        selectedId={selectedMethod?.id ?? null}
        selectedBrandId={selectedBrandId}
        onSelect={handleSelectMethod}
        onSelectBrand={handleSelectBrand}
        onClose={() => setPaymentSheetVisible(false)}
      />
    </View>
  );
});

// ---------------------------------------------------------------------------
// DestinationContent — extracted to keep HomeBottomCard under 200 lines
// ---------------------------------------------------------------------------

interface DestinationContentProps {
  destination: HomeDestination;
  isLoadingCategories: boolean;
  rideCategories: TripCategoryOption[];
  selectedCategoryId: string | null;
  selectedCategoryDuration: number | null;
  selectedCategory: TripCategoryOption | null;
  selectedMethod: UiPaymentMethod | null;
  renderChip: ({ item }: { item: TripCategoryOption }) => React.ReactElement;
  keyExtractor: (item: TripCategoryOption) => string;
  onOpenPaymentSheet: () => void;
}

const DestinationContent = memo(function DestinationContent({
  destination,
  isLoadingCategories,
  rideCategories,
  selectedCategoryId,
  selectedCategoryDuration,
  selectedCategory,
  selectedMethod,
  renderChip,
  keyExtractor,
  onOpenPaymentSheet,
}: DestinationContentProps) {
  const { colors } = useTheme();

  return (
    <>
      {/* Destination row */}
      <View style={styles.destRow}>
        <View style={[styles.destIconBox, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="location" size={16} color={colors.accent} />
        </View>
        <View style={styles.destInfo}>
          <Text style={[styles.destName, { color: colors.textPrimary }]} numberOfLines={1}>
            {destination.name}
          </Text>
          <Text style={[styles.destAddr, { color: colors.textSecondary }]} numberOfLines={1}>
            {destination.displayName}
          </Text>
        </View>
        {selectedCategoryDuration != null && (
          <View style={styles.etaBlock}>
            <Text style={[styles.etaVal, { color: colors.textPrimary }]}>
              {Math.round(selectedCategoryDuration / 60)}
            </Text>
            <Text style={[styles.etaUnit, { color: colors.textSecondary }]}>
              {th('etaUnit')}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Ride-type chips */}
      <View style={styles.chipsContainer}>
        {isLoadingCategories ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {th('loadingCategories')}
            </Text>
          </View>
        ) : rideCategories.length > 0 ? (
          <FlatList
            data={rideCategories}
            renderItem={renderChip}
            keyExtractor={keyExtractor}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsList}
          />
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {th('noCategoriesAvailable')}
          </Text>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Price row */}
      {selectedCategory != null && (
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
            {selectedCategory.name}
            {selectedCategoryDuration != null
              ? ` · ${formatDuration(selectedCategoryDuration)}`
              : ''}
          </Text>
          <Text style={[styles.priceValue, { color: colors.textPrimary }]}>
            {formatPrice(selectedCategory.finalFare)}
          </Text>
        </View>
      )}

      {/* Payment row */}
      {selectedMethod != null && (
        <PaymentRow
          method={selectedMethod}
          onPress={onOpenPaymentSheet}
        />
      )}
    </>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: borders.radiusXL,
    borderTopRightRadius: borders.radiusXL,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.label,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  destIconBox: {
    width: 32,
    height: 32,
    borderRadius: borders.radiusSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destInfo: { flex: 1 },
  destName: {
    ...typography.body,
    fontWeight: '600',
  },
  destAddr: {
    ...typography.caption,
    marginTop: 2,
  },
  etaBlock: { alignItems: 'flex-end' },
  etaVal: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
  },
  etaUnit: {
    ...typography.micro,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  chipsContainer: {
    marginBottom: spacing.md,
  },
  chipsList: {
    paddingBottom: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
  },
  emptyText: {
    ...typography.body,
    paddingVertical: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priceLabel: {
    ...typography.caption,
  },
  priceValue: {
    ...typography.subtitle,
    fontWeight: '600',
  },
  cta: {
    height: 52,
    borderRadius: borders.radiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    ...typography.button,
  },
});
