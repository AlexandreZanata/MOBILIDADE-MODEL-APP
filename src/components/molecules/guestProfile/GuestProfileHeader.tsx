import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, shadows } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface GuestProfileHeaderProps {
  title: string;
  subtitle: string;
}

export function GuestProfileHeader({ title, subtitle }: GuestProfileHeaderProps) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        avatarContainer: {
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md,
          borderWidth: 3,
          borderColor: colors.border,
          ...shadows.small,
        },
        info: {
          alignItems: 'center',
          gap: spacing.xs,
        },
        title: {
          ...typography.h2,
          color: colors.textPrimary,
          fontSize: 24,
          fontWeight: '700',
          marginBottom: spacing.xs,
        },
        subtitle: {
          ...typography.body,
          color: colors.textSecondary,
          fontSize: 15,
          textAlign: 'center',
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Ionicons name="person-outline" size={48} color={colors.textSecondary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}
