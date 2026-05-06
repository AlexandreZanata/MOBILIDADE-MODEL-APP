import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import { spacing, typography, shadows } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { GuestProfileAction } from '@/models/guestProfile/types';

interface GuestProfileActionCardProps {
  title: string;
  subtitle: string;
  actions: [GuestProfileAction, GuestProfileAction];
  onNavigate: (target: GuestProfileAction['target']) => void;
}

export function GuestProfileActionCard({
  title,
  subtitle,
  actions,
  onNavigate,
}: GuestProfileActionCardProps) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginBottom: spacing.md,
        },
        header: {
          marginBottom: spacing.md,
        },
        title: {
          ...typography.h2,
          color: colors.textPrimary,
          fontSize: 18,
          fontWeight: '700',
          marginBottom: spacing.xs,
        },
        subtitle: {
          ...typography.body,
          color: colors.textSecondary,
          fontSize: 14,
        },
        actions: {
          gap: spacing.md,
          marginTop: spacing.lg,
        },
        loginButton: {
          minHeight: 56,
          height: 56,
          borderRadius: 16,
          ...shadows.medium,
          shadowColor: colors.primary,
          shadowOpacity: 0.2,
          elevation: 6,
        },
        registerButton: {
          minHeight: 56,
          height: 56,
          borderRadius: 16,
        },
      }),
    [colors]
  );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.actions}>
        <Button
          title={actions[0].title}
          onPress={() => onNavigate(actions[0].target)}
          variant={actions[0].variant}
          fullWidth
          style={styles.loginButton}
        />
        <Button
          title={actions[1].title}
          onPress={() => onNavigate(actions[1].target)}
          variant={actions[1].variant}
          fullWidth
          style={styles.registerButton}
        />
      </View>
    </Card>
  );
}
