/**
 * @file WaitingSearchingSheet.tsx
 * @description Bottom sheet content rendered while the app is searching for a driver.
 *
 * Layout (spec):
 *   handle → top row (spinner + title/subtitle | elapsed timer) →
 *   divider → trip summary → divider → ride type → action row
 */
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { twfd } from '@/i18n/waitingForDriver';
import { borders, spacing, typography } from '@/theme';
import { WaitingElapsedTimer } from './WaitingElapsedTimer';
import { WaitingTripSummaryRow } from './WaitingTripSummaryRow';

interface WaitingSearchingSheetProps {
  estimatedFare: number | null;
  originAddress?: string;
  destinationAddress?: string;
  categoryName?: string;
  etaMinutes?: number;
  onChatPress(): void;
  onCancelPress(): void;
}

export function WaitingSearchingSheet({
  estimatedFare,
  originAddress,
  destinationAddress,
  categoryName,
  etaMinutes,
  onChatPress,
  onCancelPress,
}: WaitingSearchingSheetProps): React.ReactElement {
  const { colors } = useTheme();

  return (
    <View style={[styles.sheet, { backgroundColor: colors.card }]}>
      {/* ── Handle ──────────────────────────────────────────────────────── */}
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      {/* ── Top row: spinner + title | timer ────────────────────────────── */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <ActivityIndicator size="small" color={colors.accent} style={styles.spinner} />
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {twfd('searchingTitle')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {twfd('searchingSubtitle')}
            </Text>
          </View>
        </View>
        <WaitingElapsedTimer running />
      </View>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* ── Trip summary ─────────────────────────────────────────────────── */}
      <WaitingTripSummaryRow
        originAddress={originAddress}
        destinationAddress={destinationAddress}
        estimatedFare={estimatedFare}
        categoryName={categoryName}
        etaMinutes={etaMinutes}
      />

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* ── Action row ───────────────────────────────────────────────────── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.accent }]}
          onPress={onChatPress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={twfd('chatButton')}
        >
          <Text style={[styles.actionBtnText, { color: colors.accent }]}>
            {twfd('chatButton')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.status.error }]}
          onPress={onCancelPress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={twfd('cancelButton')}
        >
          <Text style={[styles.actionBtnText, { color: colors.status.error }]}>
            {twfd('cancelButton')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: borders.radiusXL,
    borderTopRightRadius: borders.radiusXL,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: borders.radiusFull,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
  },
  spinner: {
    marginTop: 2,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 22,
  },
  subtitle: {
    ...typography.caption,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: borders.radiusMedium,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    ...typography.button,
    fontSize: 13,
  },
});
