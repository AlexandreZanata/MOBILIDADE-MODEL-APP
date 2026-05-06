import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import { useTheme } from '@/context/ThemeContext';
import { tb, tBillingStatus } from '@/i18n/billing';
import { BillingCycle } from '@/models/billing/types';
import { spacing, typography } from '@/theme';

interface BillingCycleCardProps {
  cycle: BillingCycle;
  isGeneratingPix: boolean;
  formatCurrency(value: number): string;
  formatDate(value: string): string;
  formatDateShort(value: string): string;
  onGeneratePix(cycle: BillingCycle): void;
}

export function BillingCycleCard({
  cycle,
  isGeneratingPix,
  formatCurrency,
  formatDate,
  formatDateShort,
  onGeneratePix,
}: BillingCycleCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors.primary);
  const statusColor = getStatusColor(cycle.status, colors);
  const isPayable = ['AWAITING_PAYMENT', 'OVERDUE', 'GRACE_PERIOD', 'PARTIALLY_PAID'].includes(cycle.status);

  return (
    <Card style={styles.cycleCard}>
      <View style={styles.cycleHeader}>
        <View style={styles.cycleHeaderLeft}>
          <Text style={styles.cyclePeriod}>
            {formatDateShort(cycle.periodStart)} - {formatDateShort(cycle.periodEnd)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{tBillingStatus(cycle.status)}</Text>
          </View>
        </View>
        <Text style={styles.cycleAmount}>{formatCurrency(cycle.totalAmount)}</Text>
      </View>

      <View style={styles.cycleDetails}>
        <DetailRow label={tb('cycleRides')} value={String(cycle.rideCount)} />
        <DetailRow label={tb('cyclePricePerRide')} value={formatCurrency(cycle.pricePerRide)} />
        {cycle.paidAmount > 0 && (
          <DetailRow
            label={tb('cyclePaid')}
            value={formatCurrency(cycle.paidAmount)}
            valueColor={colors.status.success}
          />
        )}
        {cycle.remainingAmount > 0 && (
          <DetailRow
            label={tb('cycleRemaining')}
            value={formatCurrency(cycle.remainingAmount)}
            valueColor={colors.status.error}
          />
        )}
        {cycle.pixExpiresAt && <DetailRow label={tb('cyclePixDue')} value={formatDate(cycle.pixExpiresAt)} />}
      </View>

      {isPayable && (
        <Button
          title={tb('generatePix')}
          onPress={() => onGeneratePix(cycle)}
          variant="primary"
          fullWidth
          style={styles.generatePixButton}
          disabled={isGeneratingPix}
        />
      )}
    </Card>
  );
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors.primary);
  return (
    <View style={styles.cycleDetailRow}>
      <Text style={styles.cycleDetailLabel}>{label}</Text>
      <Text style={[styles.cycleDetailValue, { color: valueColor ?? colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

function getStatusColor(status: BillingCycle['status'], colors: ReturnType<typeof useTheme>['colors']): string {
  if (status === 'PAID') return colors.status.success;
  if (status === 'OVERDUE' || status === 'BLOCKED') return colors.status.error;
  if (status === 'AWAITING_PAYMENT' || status === 'PARTIALLY_PAID' || status === 'GRACE_PERIOD') {
    return colors.status.warning;
  }
  if (status === 'PROCESSING') return colors.primary;
  return colors.status.pending;
}

const createStyles = (primaryColor: string) =>
  StyleSheet.create({
    cycleCard: {
      marginBottom: spacing.md,
    },
    cycleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    cycleHeaderLeft: {
      flex: 1,
    },
    cyclePeriod: {
      ...typography.body,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: spacing.md,
      gap: spacing.xs,
    },
    statusDot: {
      width: spacing.sm,
      height: spacing.sm,
      borderRadius: spacing.xs,
    },
    statusText: {
      ...typography.caption,
      fontWeight: '600',
    },
    cycleAmount: {
      ...typography.h2,
      color: primaryColor,
    },
    cycleDetails: {
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    cycleDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cycleDetailLabel: {
      ...typography.body,
      fontSize: typography.caption.fontSize,
    },
    cycleDetailValue: {
      ...typography.body,
      fontSize: typography.caption.fontSize,
      fontWeight: '600',
    },
    generatePixButton: {
      marginTop: spacing.sm,
    },
  });
