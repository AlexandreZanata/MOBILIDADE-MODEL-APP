import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, shadows } from '@/theme';
import { DriverTripData } from '@/models/driverTripInProgress/types';
import { tdt } from '@/i18n/driverTripInProgress';

interface Props {
  tripData: DriverTripData;
  destinationAddress: string;
  onHeightChange: (height: number) => void;
}

export const DriverTripInProgressTopBar = memo(({ tripData, destinationAddress, onHeightChange }: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 30,
      backgroundColor: colors.background,
      paddingTop: Math.max(insets.top, spacing.md),
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      ...shadows.medium,
      shadowColor: colors.shadow,
    },
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: spacing.md, marginBottom: spacing.xs },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    destinationText: { ...typography.body, color: colors.textPrimary, flex: 1, marginLeft: spacing.sm },
    priceLabel: { ...typography.caption, color: colors.textSecondary },
    priceValue: { ...typography.body, color: colors.primary, fontWeight: '700' },
  });

  const estimatedFare = tripData.estimatedFare ?? 0;
  return (
    <View style={styles.container} onLayout={(event) => onHeightChange(event.nativeEvent.layout.height)}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="flag" size={16} color={colors.primary} />
          <Text numberOfLines={1} style={styles.destinationText}>{destinationAddress}</Text>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.priceLabel}>{tdt('estimatedFareLabel')}</Text>
          <Text style={styles.priceValue}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedFare)}</Text>
        </View>
      </View>
    </View>
  );
});
