/**
 * @file WaitingTripSummaryRow.tsx
 * @description Origin → destination summary row shown inside the bottom sheet.
 * Displays truncated address labels with a dashed vertical connector and fare.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { twfd } from '@/i18n/waitingForDriver';
import { borders, spacing, typography } from '@/theme';

interface WaitingTripSummaryRowProps {
  originAddress?: string;
  destinationAddress?: string;
  estimatedFare: number | null;
  /** Optional ride category name, e.g. "Confort" */
  categoryName?: string;
  /** Estimated arrival in minutes */
  etaMinutes?: number;
}

export function WaitingTripSummaryRow({
  originAddress,
  destinationAddress,
  estimatedFare,
  categoryName,
  etaMinutes,
}: WaitingTripSummaryRowProps): React.ReactElement {
  const { colors } = useTheme();

  const fareText = estimatedFare != null ? `R$ ${estimatedFare.toFixed(2)}` : '-';

  return (
    <View style={styles.wrapper}>
      {/* ── Origin / destination ─────────────────────────────────────────── */}
      <View style={styles.routeColumn}>
        <View style={styles.routeRow}>
          <Ionicons name="radio-button-on" size={14} color={colors.accent} style={styles.icon} />
          <Text style={[styles.addressText, { color: colors.textPrimary }]} numberOfLines={1}>
            {originAddress ?? '—'}
          </Text>
        </View>

        {/* Dashed vertical connector */}
        <View style={styles.dashedLineWrapper}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={[styles.dash, { backgroundColor: colors.border }]} />
          ))}
        </View>

        <View style={styles.routeRow}>
          <Ionicons name="location" size={14} color={colors.status.error} style={styles.icon} />
          <Text style={[styles.addressText, { color: colors.textPrimary }]} numberOfLines={1}>
            {destinationAddress ?? '—'}
          </Text>
        </View>
      </View>

      {/* ── Fare ─────────────────────────────────────────────────────────── */}
      <Text style={[styles.fare, { color: colors.textPrimary }]}>{fareText}</Text>

      {/* ── Ride type row ─────────────────────────────────────────────────── */}
      {(categoryName != null || etaMinutes != null) && (
        <View style={[styles.rideTypeRow, { borderTopColor: colors.border }]}>
          <Ionicons name="car-outline" size={16} color={colors.textSecondary} />
          {categoryName != null && (
            <Text style={[styles.rideTypeText, { color: colors.textSecondary }]}>{categoryName}</Text>
          )}
          {categoryName != null && etaMinutes != null && (
            <View style={[styles.dot, { backgroundColor: colors.textHint }]} />
          )}
          {etaMinutes != null && (
            <Text style={[styles.rideTypeText, { color: colors.textSecondary }]}>
              ~{etaMinutes} {twfd('etaUnit')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  routeColumn: {
    flexDirection: 'column',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    width: 16,
  },
  addressText: {
    ...typography.body,
    flex: 1,
  },
  dashedLineWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 7,
    gap: 3,
    height: 24,
    justifyContent: 'center',
  },
  dash: {
    width: 1.5,
    height: 4,
    borderRadius: 1,
  },
  fare: {
    ...typography.subtitle,
    textAlign: 'right',
    marginTop: -spacing.xl * 2,
  },
  rideTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rideTypeText: {
    ...typography.caption,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: borders.radiusFull,
  },
});
