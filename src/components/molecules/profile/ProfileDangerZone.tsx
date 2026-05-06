import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { borders, shadows, spacing, typography } from '@/theme';
import { tp } from '@/i18n/profile';

export interface ProfileDangerZoneProps {
  onLogoutPress(): void;
  onDeleteAccountPress(): void;
  showDeleteAccount: boolean;
}

export function ProfileDangerZone({ onLogoutPress, onDeleteAccountPress, showDeleteAccount }: ProfileDangerZoneProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    wrap: {
      marginTop: spacing.xxl,
      marginHorizontal: spacing.md,
      marginBottom: spacing.lg,
      gap: spacing.md,
    },
    logout: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      minHeight: spacing.xxl * 2,
      backgroundColor: colors.card,
      borderWidth: borders.widthHairline,
      borderColor: colors.status.error,
      borderRadius: borders.radiusLarge,
      ...shadows.small,
      shadowColor: colors.shadow,
    },
    logoutText: { ...typography.button, color: colors.status.error },
    delete: { alignItems: 'center', paddingVertical: spacing.sm },
    deleteText: { ...typography.caption, fontSize: typography.body.fontSize, color: colors.textHint },
  });

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.logout} onPress={onLogoutPress} accessibilityRole="button">
        <Ionicons name="log-out-outline" size={spacing.lg + spacing.xs} color={colors.status.error} />
        <Text style={styles.logoutText}>{tp('logoutButton')}</Text>
      </Pressable>
      {showDeleteAccount ? (
        <Pressable style={styles.delete} onPress={onDeleteAccountPress} accessibilityRole="button">
          <Text style={styles.deleteText}>{tp('deleteAccount')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
