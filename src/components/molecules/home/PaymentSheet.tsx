import React, { memo } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { borders, shadows, spacing, typography } from '@/theme';
import { UiPaymentMethod } from '@/models/payment/types';
import { usePaymentSheet } from '@/hooks/home/usePaymentSheet';
import { th } from '@/i18n/home';
import { tpm } from '@/i18n/paymentMethod';

// ---------------------------------------------------------------------------
// Skeleton row — shown while methods are loading
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    gap: spacing.md,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: borders.radiusSmall,
  },
  textBlock: { flex: 1 },
  line: {
    height: 10,
    borderRadius: 5,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
});

// ---------------------------------------------------------------------------
// PaymentSheet
// ---------------------------------------------------------------------------

export interface PaymentSheetProps {
  visible: boolean;
  selectedId: string | null;
  onSelect: (method: UiPaymentMethod) => void;
  onClose: () => void;
}

/**
 * Full-screen modal overlay for payment method selection.
 * Data is loaded eagerly (before the modal opens) via usePaymentSheet.
 * Shows a skeleton while loading — no spinner, no layout shift.
 */
export const PaymentSheet = memo(function PaymentSheet({
  visible,
  selectedId,
  onSelect,
  onClose,
}: PaymentSheetProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { methods, isLoading, hasError } = usePaymentSheet();

  const sheetBg = isDark
    ? {
        backgroundColor: colors.backgroundSecondary,
        borderTopWidth: 0.5,
        borderTopColor: colors.border,
      }
    : { backgroundColor: colors.card, ...shadows.large };

  // Show 4 skeleton rows while loading (matches typical method count)
  const SKELETON_COUNT = 4;

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

        {/* Skeleton while loading */}
        {isLoading && Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}

        {/* Error state */}
        {!isLoading && hasError && (
          <View style={styles.errorState}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.textSecondary} />
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {tpm('loadMethodsFailed')}
            </Text>
          </View>
        )}

        {/* Payment options */}
        {!isLoading && !hasError && methods.map((method, index) => {
          const isSelected = method.id === selectedId;
          const isLast = index === methods.length - 1;
          return (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.optionRow,
                { borderBottomColor: colors.border },
                isLast && { borderBottomWidth: 0 },
              ]}
              onPress={() => {
                onSelect(method);
                onClose();
              }}
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
