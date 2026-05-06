import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface ProfileInfoRowProps {
  label: string;
  value: string;
  showDivider?: boolean;
  verified?: boolean;
}

export function ProfileInfoRow({ label, value, showDivider = true, verified = false }: ProfileInfoRowProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: showDivider ? 1 : 0,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    label: {
      ...typography.body,
      color: colors.textSecondary,
    },
    value: {
      ...typography.body,
      color: colors.textPrimary,
      flexShrink: 1,
      textAlign: 'right',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {verified && <Ionicons name="checkmark-circle" size={spacing.md} color={colors.status.success} />}
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
