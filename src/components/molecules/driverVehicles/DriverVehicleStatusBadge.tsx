import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { tdv } from '@/i18n/driverVehicles';
import { spacing, typography } from '@/theme';

function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getStatusLabel(status: string): string {
  if (status === 'PENDING_DOCS') return tdv('statusPendingDocs');
  if (status === 'AWAITING_VEHICLE') return tdv('statusAwaitingVehicle');
  if (status === 'PENDING') return tdv('statusPending');
  if (status === 'APPROVED') return tdv('statusApproved');
  if (status === 'REJECTED') return tdv('statusRejected');
  return status;
}

export function DriverVehicleStatusBadge({ status }: { status: string }) {
  const { colors } = useTheme();
  const statusColor =
    status === 'APPROVED'
      ? colors.status.success
      : status === 'REJECTED'
        ? colors.status.error
        : colors.status.warning;
  const styles = StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 8,
      backgroundColor: hexToRgba(statusColor, 0.1),
    },
    text: {
      ...typography.caption,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      color: statusColor,
    },
  });

  if (status === 'PENDING_DOCS' || status === 'AWAITING_VEHICLE') {
    return (
      <View style={styles.root}>
        <Ionicons name="warning-outline" size={14} color={statusColor} />
        <Text style={styles.text}>{tdv('documentsBadge')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.text}>{getStatusLabel(status)}</Text>
    </View>
  );
}
