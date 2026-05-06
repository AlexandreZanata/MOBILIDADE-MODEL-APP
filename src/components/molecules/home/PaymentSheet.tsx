import React, { memo } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { borders, shadows, spacing, typography } from '@/theme';
import { UiPaymentMethod } from '@/models/payment/types';
import { PaymentBrand } from '@/models/paymentMethod/types';
import { usePaymentSheet } from '@/hooks/home/usePaymentSheet';
import { th } from '@/i18n/home';
import { tpm } from '@/i18n/paymentMethod';

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------

function SkeletonRow() {
  const { colors } = useTheme();
  const anim = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  return (
    <Animated.View style={[skeletonStyles.row, { opacity: anim }]}>
      <View style={[skeletonStyles.icon, { backgroundColor: colors.border }]} />
      <View style={skeletonStyles.textBlock}>
        <View style={[skeletonStyles.line, { backgroundColor: colors.border, width: '55%' }]} />
        <View style={[skeletonStyles.line, { backgroundColor: colors.border, width: '35%', marginTop: 6 }]} />
      </View>
      <View style={[skeletonStyles.radio, { borderColor: colors.border }]} />
    </Animated.View>
  );
}

const skeletonStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: 56, gap: spacing.md },
  icon: { width: 32, height: 32, borderRadius: borders.radiusSmall },
  textBlock: { flex: 1 },
  line: { height: 10, borderRadius: 5 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5 },
});

// ---------------------------------------------------------------------------
// BrandChip — single card brand selector
// ---------------------------------------------------------------------------

interface BrandChipProps {
  brand: PaymentBrand;
  isSelected: boolean;
  onPress: (id: string) => void;
}

const BrandChip = memo(function BrandChip({ brand, isSelected, onPress }: BrandChipProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        brandStyles.chip,
        {
          borderColor: isSelected ? colors.accent : colors.border,
          backgroundColor: isSelected ? colors.accentSoft : colors.backgroundSecondary,
        },
      ]}
      onPress={() => onPress(brand.id)}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={brand.name}
    >
      <Text
        style={[
          brandStyles.label,
          { color: isSelected ? colors.accent : colors.textPrimary },
        ]}
      >
        {brand.name}
      </Text>
    </TouchableOpacity>
  );
});

const brandStyles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: borders.radiusMedium,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontWeight: '500',
  },
});

// ---------------------------------------------------------------------------
// PaymentSheet
// ---------------------------------------------------------------------------

export interface PaymentSheetProps {
  visible: boolean;
  selectedId: string | null;
  selectedBrandId: string | null;
  onSelect: (method: UiPaymentMethod) => void;
  onSelectBrand: (brandId: string) => void;
  onClose: () => void;
}

/**
 * Full-screen modal for payment method + card brand selection.
 * Data loads eagerly via usePaymentSheet — skeleton shown while loading.
 * When a card method is selected, brand chips appear inline below the list.
 */
export const PaymentSheet = memo(function PaymentSheet({
  visible,
  selectedId,
  selectedBrandId,
  onSelect,
  onSelectBrand,
  onClose,
}: PaymentSheetProps) {
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const { methods, brands, isLoading, isLoadingBrands, hasError } =
    usePaymentSheet(undefined, undefined, isAuthenticated);

  // Derive the currently-selected method from the prop (controlled by parent),
  // not from the hook's internal state — they can diverge when the user taps
  // a method and the modal closes before the hook state updates.
  const currentMethod = methods.find((m) => m.id === selectedId) ?? null;
  const showBrands = !isLoading && currentMethod?.requiresCardBrand === true;

  const sheetBg = isDark
    ? { backgroundColor: colors.backgroundSecondary, borderTopWidth: 0.5, borderTopColor: colors.border }
    : { backgroundColor: colors.card, ...shadows.large };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Fechar">
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View
        style={[
          styles.sheet,
          sheetBg,
          { paddingBottom: Math.max(insets.bottom, spacing.xxl) },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.backgroundSecondary }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {th('paymentSheetTitle')}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Skeleton while loading */}
          {isLoading && [0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}

          {/* Error */}
          {!isLoading && hasError && (
            <View style={styles.errorState}>
              <Ionicons name="alert-circle-outline" size={24} color={colors.textSecondary} />
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                {tpm('loadMethodsFailed')}
              </Text>
            </View>
          )}

          {/* Payment method options */}
          {!isLoading && !hasError && methods.map((method, index) => {
            const isSelected = method.id === selectedId;
            const isLast = index === methods.length - 1 && !showBrands;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.optionRow,
                  { borderBottomColor: colors.border },
                  isLast && { borderBottomWidth: 0 },
                ]}
                onPress={() => onSelect(method)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={method.label}
              >
                <View style={[styles.iconBox, { backgroundColor: method.iconBg }]}>
                  <Ionicons name={method.iconName} size={16} color={method.iconColor} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                    {method.label}
                  </Text>
                  {method.subtitle.length > 0 && (
                    <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                      {method.subtitle}
                    </Text>
                  )}
                </View>
                <View style={[styles.radio, { borderColor: colors.accent }]}>
                  {isSelected && (
                    <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Card brand section — shown when a card method is selected */}
          {showBrands && (
            <View style={styles.brandsSection}>
              <Text style={[styles.brandsLabel, { color: colors.textHint }]}>
                Bandeira do cartão
              </Text>
              {isLoadingBrands ? (
                <View style={styles.brandsSkeletonRow}>
                  {[0, 1, 2].map((i) => (
                    <Animated.View
                      key={i}
                      style={[
                        brandStyles.chip,
                        { backgroundColor: colors.border, borderColor: colors.border, width: 72 },
                      ]}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.brandsWrap}>
                  {brands.map((brand) => (
                    <BrandChip
                      key={brand.id}
                      brand={brand}
                      isSelected={brand.id === selectedBrandId}
                      onPress={onSelectBrand}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Add card */}
          {!isLoading && (
            <TouchableOpacity
              style={[styles.addCard, { borderColor: colors.accent }]}
              accessibilityRole="button"
              accessibilityLabel={th('addCard')}
            >
              <Text style={[styles.addCardText, { color: colors.accent }]}>
                {th('addCard')}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Confirm CTA */}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary }]}
          onPress={onClose}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={th('confirmPayment')}
        >
          <Text style={[styles.ctaText, { color: colors.card }]}>
            {th('confirmPayment')}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: borders.radiusXL,
    borderTopRightRadius: borders.radiusXL,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: '80%',
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.subtitle,
  },
  errorState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
  },
  errorText: {
    ...typography.caption,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: borders.radiusSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionLabel: {
    ...typography.caption,
    fontWeight: '500',
  },
  optionSub: {
    ...typography.micro,
    marginTop: 1,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brandsSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  brandsLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  brandsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  brandsSkeletonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addCard: {
    height: 44,
    borderRadius: borders.radiusMedium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  addCardText: {
    ...typography.caption,
    fontWeight: '500',
  },
  cta: {
    height: 52,
    borderRadius: borders.radiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  ctaText: {
    ...typography.button,
  },
});
