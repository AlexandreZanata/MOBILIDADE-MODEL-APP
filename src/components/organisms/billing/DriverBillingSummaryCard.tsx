import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import { useTheme } from '@/context/ThemeContext';
import { tb } from '@/i18n/billing';
import { DriverBillingStatus } from '@/models/billing/types';
import { spacing, typography } from '@/theme';

interface DriverBillingSummaryCardProps {
  billingStatus: DriverBillingStatus;
  totalPending: number;
  isGeneratingPix: boolean;
  formatCurrency(value: number): string;
  formatDateShort(value: string): string;
  onGenerateDebtPix(): void;
}

export function DriverBillingSummaryCard({
  billingStatus,
  totalPending,
  isGeneratingPix,
  formatCurrency,
  formatDateShort,
  onGenerateDebtPix,
}: DriverBillingSummaryCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors.status.error, colors.primary, colors.textPrimary, colors.textSecondary);

  return (
    <Card style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusTitle}>{tb('totalPending')}</Text>
        <Text style={styles.statusAmount}>{formatCurrency(totalPending)}</Text>
      </View>

      <View style={styles.statusDetails}>
        <View style={styles.statusDetailRow}>
          <Text style={styles.statusDetailLabel}>{tb('pendingRides')}</Text>
          <Text style={styles.statusDetailValue}>{billingStatus.totalPendingRides || 0}</Text>
        </View>
        {billingStatus.currentCycle && (
          <View style={styles.statusDetailRow}>
            <Text style={styles.statusDetailLabel}>{tb('currentCycle')}</Text>
            <Text style={styles.statusDetailValue}>
              {formatDateShort(billingStatus.currentCycle.periodStart)} -{' '}
              {formatDateShort(billingStatus.currentCycle.periodEnd)}
            </Text>
          </View>
        )}
      </View>

      {billingStatus.isBlocked && (
        <View style={styles.blockedWarning}>
          <Ionicons name="alert-circle" size={20} color={colors.status.error} />
          <Text style={styles.blockedWarningText}>{tb('blockedWarning')}</Text>
        </View>
      )}

      {totalPending > 0 && (
        <Button
          title={tb('payAll', { amount: formatCurrency(totalPending) })}
          onPress={onGenerateDebtPix}
          variant="primary"
          fullWidth
          style={styles.payAllButton}
          disabled={isGeneratingPix}
        />
      )}
    </Card>
  );
}

const createStyles = (errorColor: string, primaryColor: string, textPrimary: string, textSecondary: string) =>
  StyleSheet.create({
    statusCard: {
      marginBottom: spacing.lg,
    },
    statusHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    statusTitle: {
      ...typography.body,
      fontWeight: '600',
      color: textPrimary,
    },
    statusAmount: {
      ...typography.h2,
      color: primaryColor,
      fontWeight: '700',
    },
    statusDetails: {
      gap: spacing.sm,
    },
    statusDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusDetailLabel: {
      ...typography.body,
      fontSize: typography.caption.fontSize,
      color: textSecondary,
    },
    statusDetailValue: {
      ...typography.body,
      fontSize: typography.caption.fontSize,
      fontWeight: '600',
      color: textPrimary,
    },
    blockedWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: `${errorColor}20`,
      borderRadius: spacing.sm + spacing.xs,
      marginTop: spacing.md,
    },
    blockedWarningText: {
      ...typography.body,
      fontSize: typography.caption.fontSize + 2,
      color: errorColor,
      flex: 1,
      fontWeight: '500',
    },
    payAllButton: {
      marginTop: spacing.md,
    },
  });
