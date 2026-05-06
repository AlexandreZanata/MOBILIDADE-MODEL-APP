import React, { memo } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import { borders, shadows, spacing, typography } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { tdh } from '@/i18n/driverHome';

interface DriverHomeStatusCardProps {
  isAvailable: boolean;
  isConnecting: boolean;
  isLoadingStatus: boolean;
  isDriverEligible: boolean;
  isAvailabilityRateLimited: boolean;
  isRateLimited: boolean;
  isUpdatingLocation: boolean;
  hasPendingDocuments: boolean;
  eligibilityMessage: string;
  validationWarningMessage: string | null;
  /** Linha formatada com dados de GET operational-status (API). */
  operationalSnapshotText: string | null;
  showOperationalAvailabilityHint: boolean;
  /** API retornou `canReceiveRides: false`. */
  serverBlocksReceiveRides: boolean;
  onToggleAvailability: (value: boolean) => void;
  onActivate: () => void;
  onStatusCardLayout: (height: number) => void;
  onInfoCardLayout: (height: number) => void;
}

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const DriverHomeStatusCard = memo((props: DriverHomeStatusCardProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    statusCard: {
      position: 'absolute',
      top: insets.top + spacing.sm,
      left: spacing.md,
      right: spacing.md,
      zIndex: 10,
      borderRadius: borders.radiusLarge,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      ...shadows.small,
    },
    statusContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    statusIndicator: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: props.isAvailable ? '#34C759' : colors.textSecondary,
      marginRight: spacing.sm,
    },
    statusText: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    statusSubtext: {
      ...typography.caption,
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      fontFamily: 'Poppins-Regular',
    },
    validationWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: hexToRgba(colors.status.warning, 0.1),
      borderRadius: borders.radiusSmall,
      paddingVertical: spacing.sm,
    },
    operationalHintBox: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
      borderTopWidth: borders.widthHairline,
      borderTopColor: colors.border,
      gap: spacing.xs,
    },
    operationalExplain: {
      ...typography.caption,
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      fontFamily: 'Poppins-Regular',
    },
    operationalSnapshot: {
      ...typography.caption,
      fontSize: 11,
      color: colors.textHint,
      lineHeight: 16,
      fontFamily: 'Poppins-Regular',
    },
    validationWarningText: {
      ...typography.caption,
      fontSize: 12,
      color: colors.status.warning,
      flex: 1,
      fontFamily: 'Poppins-Medium',
    },
    infoCard: {
      position: 'absolute',
      bottom: 8,
      left: spacing.md,
      right: spacing.md,
      zIndex: 10,
    },
    infoContent: { gap: spacing.md },
    infoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    infoIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: hexToRgba(colors.primary, 0.15),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: hexToRgba(colors.primary, 0.2),
    },
    infoText: { flex: 1 },
    infoTitle: {
      ...typography.body,
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
      fontFamily: 'Poppins-Bold',
    },
    infoSubtitle: {
      ...typography.caption,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      fontFamily: 'Poppins-Regular',
    },
    infoButton: { marginTop: spacing.sm },
  });

  return (
    <>
      <Card
        style={styles.statusCard}
        onLayout={(event) => props.onStatusCardLayout(event.nativeEvent.layout.height)}
      >
        <View style={styles.statusContent}>
          <View style={styles.statusLeft}>
            <View style={styles.statusIndicator} />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusText}>
                {props.isAvailable ? tdh('statusAvailable') : tdh('statusUnavailable')}
              </Text>
              {props.isConnecting && (
                <Text style={styles.statusSubtext}>{tdh('statusConnecting')}</Text>
              )}
              {!props.isConnecting && props.isAvailable && (
                <Text style={styles.statusSubtext}>
                  {props.isAvailabilityRateLimited
                    ? tdh('statusRateLimitedAvailability')
                    : props.isRateLimited
                      ? tdh('statusRateLimited')
                      : props.isUpdatingLocation
                        ? tdh('statusUpdatingLocation')
                        : tdh('statusReady')}
                </Text>
              )}
              {!props.isConnecting && !props.isAvailable && props.isAvailabilityRateLimited && (
                <Text style={styles.statusSubtext}>{tdh('statusRateLimitedAvailability')}</Text>
              )}
            </View>
          </View>
          <Switch
            value={props.isAvailable}
            onValueChange={props.onToggleAvailability}
            trackColor={{ false: colors.border, true: hexToRgba(colors.primary, 0.3) }}
            thumbColor={props.isAvailable ? colors.primary : colors.textSecondary}
            disabled={props.isLoadingStatus || !props.isDriverEligible || props.isConnecting}
          />
        </View>

        {!props.isDriverEligible && (
          <View style={styles.validationWarning}>
            <Ionicons name="alert-circle" size={20} color={colors.status.warning} />
            <Text style={styles.validationWarningText}>{props.eligibilityMessage}</Text>
          </View>
        )}
        {props.isDriverEligible && props.hasPendingDocuments && (
          <View style={styles.validationWarning}>
            <Ionicons name="warning-outline" size={16} color={colors.status.warning} />
            <Text style={styles.validationWarningText}>
              {props.validationWarningMessage || tdh('statusPendingDocsDefault')}
            </Text>
          </View>
        )}
        {props.showOperationalAvailabilityHint && props.operationalSnapshotText ? (
          <View style={styles.operationalHintBox}>
            {props.serverBlocksReceiveRides ? (
              <Text style={styles.operationalExplain}>{tdh('cannotReceiveRidesExplain')}</Text>
            ) : null}
            <Text style={styles.operationalSnapshot}>{props.operationalSnapshotText}</Text>
          </View>
        ) : null}
      </Card>

      {!props.isAvailable && (
        <Card
          style={styles.infoCard}
          onLayout={(event) => props.onInfoCardLayout(event.nativeEvent.layout.height)}
        >
          <View style={styles.infoContent}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIcon}>
                <Ionicons name="car-outline" size={32} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>{tdh('infoCardTitle')}</Text>
                <Text style={styles.infoSubtitle}>{tdh('infoCardSubtitle')}</Text>
              </View>
            </View>
            <Button
              title={props.isConnecting ? tdh('infoCardButtonConnecting') : tdh('infoCardButtonActivate')}
              onPress={props.onActivate}
              variant="primary"
              fullWidth
              style={styles.infoButton}
              disabled={props.isConnecting || props.isLoadingStatus || !props.isDriverEligible}
            />
          </View>
        </Card>
      )}
    </>
  );
});
