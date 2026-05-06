import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { borders, spacing, typography } from '@/theme';
import { UiPaymentMethod } from '@/models/payment/types';
import { th } from '@/i18n/home';

export interface PaymentRowProps {
  /** Full method descriptor — drives icon, color and label. */
  method: UiPaymentMethod;
  onPress: () => void;
}

/**
 * Tappable row that shows the active payment method icon and label.
 * Icon and background color update to reflect the selected method.
 */
export const PaymentRow = memo(function PaymentRow({
  method,
  onPress,
}: PaymentRowProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.row, { borderTopColor: colors.border }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${th('paymentLabel')}, ${th('changePayment')}`}
    >
      <View style={[styles.iconBox, { backgroundColor: method.iconBg }]}>
        <Ionicons name={method.iconName} size={16} color={method.iconColor} />
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {th('paymentLabel')}
        </Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          {method.label}
        </Text>
      </View>

      <Text style={[styles.change, { color: colors.accent }]}>
        {th('changePayment')}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: borders.radiusSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  label: {
    ...typography.micro,
  },
  value: {
    ...typography.caption,
    fontWeight: '500',
  },
  change: {
    ...typography.caption,
    fontWeight: '500',
  },
});
