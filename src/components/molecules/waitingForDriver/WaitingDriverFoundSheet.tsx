/**
 * @file WaitingDriverFoundSheet.tsx
 * @description Bottom sheet content rendered after a driver has been matched.
 *
 * Layout (spec):
 *   handle → status chip → driver card (avatar | name + rating + vehicle | ETA) →
 *   divider → action row (phone icon | chat icon | follow map CTA)
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/atoms/Avatar';
import { useTheme } from '@/context/ThemeContext';
import { twfd } from '@/i18n/waitingForDriver';
import { borders, spacing, typography } from '@/theme';

interface DriverInfo {
  id: string;
  name: string;
  rating?: number;
  photoUrl?: string;
  vehicle?: { brand?: string; model?: string; plate?: string; color?: string };
}

interface WaitingDriverFoundSheetProps {
  driver: DriverInfo;
  etaMinutes?: number;
  onChatPress(): void;
  onPhonePress?(): void;
  onFollowMapPress(): void;
}

export function WaitingDriverFoundSheet({
  driver,
  etaMinutes,
  onChatPress,
  onPhonePress,
  onFollowMapPress,
}: WaitingDriverFoundSheetProps): React.ReactElement {
  const { colors } = useTheme();

  const vehicleLine = [driver.vehicle?.brand, driver.vehicle?.model, driver.vehicle?.color]
    .filter(Boolean)
    .join(' ');
  const plateLine = driver.vehicle?.plate ?? '';
  const vehicleDisplay = [vehicleLine, plateLine].filter(Boolean).join(' · ');

  const ratingDisplay =
    driver.rating != null ? `★ ${driver.rating.toFixed(2)}` : null;

  return (
    <View style={[styles.sheet, { backgroundColor: colors.card }]}>
      {/* ── Handle ──────────────────────────────────────────────────────── */}
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      {/* ── Status chip ──────────────────────────────────────────────────── */}
      <View style={styles.chipRow}>
        <View style={[styles.chip, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="checkmark-circle" size={14} color={colors.status.success} />
          <Text style={[styles.chipText, { color: colors.status.success }]}>
            {twfd('driverFoundChip')}
          </Text>
        </View>
      </View>

      {/* ── Driver card ──────────────────────────────────────────────────── */}
      <View style={styles.driverCard}>
        <Avatar
          uri={driver.photoUrl}
          name={driver.name}
          size={52}
          showBorder
          initialsBackgroundColor={colors.accentSoft}
          initialsTextColor={colors.accent}
        />

        <View style={styles.driverMeta}>
          <Text style={[styles.driverName, { color: colors.textPrimary }]} numberOfLines={1}>
            {driver.name}
          </Text>
          {ratingDisplay != null && (
            <Text style={[styles.driverRating, { color: colors.secondary }]}>
              {ratingDisplay}
            </Text>
          )}
          {vehicleDisplay.length > 0 && (
            <Text style={[styles.vehicleText, { color: colors.textSecondary }]} numberOfLines={1}>
              {vehicleDisplay}
            </Text>
          )}
        </View>

        {/* ETA badge */}
        {etaMinutes != null && (
          <View style={styles.etaBadge}>
            <Text style={[styles.etaValue, { color: colors.textPrimary }]}>{etaMinutes}</Text>
            <Text style={[styles.etaUnit, { color: colors.textHint }]}>{twfd('etaUnit')}</Text>
          </View>
        )}
      </View>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* ── Action row ───────────────────────────────────────────────────── */}
      <View style={styles.actionRow}>
        {/* Phone icon button */}
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.backgroundSecondary }]}
          onPress={onPhonePress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Ligar para motorista"
        >
          <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Chat icon button */}
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.backgroundSecondary }]}
          onPress={onChatPress}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={twfd('chatButton')}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Follow map CTA */}
        <TouchableOpacity
          style={[styles.followBtn, { backgroundColor: colors.primary }]}
          onPress={onFollowMapPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={twfd('followMapCta')}
        >
          <Text style={styles.followBtnText}>{twfd('followMapCta')}</Text>
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
  chipRow: {
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borders.radiusFull,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '500',
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  driverMeta: {
    flex: 1,
    gap: 2,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  driverRating: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '500',
  },
  vehicleText: {
    ...typography.caption,
    fontSize: 12,
  },
  etaBadge: {
    alignItems: 'center',
  },
  etaValue: {
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 26,
  },
  etaUnit: {
    ...typography.micro,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: borders.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtn: {
    flex: 1,
    height: 48,
    borderRadius: borders.radiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
