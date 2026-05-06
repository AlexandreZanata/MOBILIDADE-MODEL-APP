import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { borders, spacing, typography } from '@/theme';
import { tp } from '@/i18n/profile';

export interface ProfileLogoutDialogProps {
  visible: boolean;
  onDismiss(): void;
  onConfirm(): void;
}

export function ProfileLogoutDialog({ visible, onDismiss, onConfirm }: ProfileLogoutDialogProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.scrim,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: borders.radiusXL,
      padding: spacing.xxl,
      gap: spacing.md,
    },
    iconWrap: { alignItems: 'center' },
    title: { ...typography.subtitle, color: colors.textPrimary, textAlign: 'center' },
    body: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
    row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    ghost: {
      flex: 1,
      borderWidth: borders.widthHairline,
      borderColor: colors.border,
      borderRadius: borders.radiusMedium,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    ghostText: { ...typography.button, color: colors.textPrimary },
    primary: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: borders.radiusMedium,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    primaryText: { ...typography.button, color: colors.card },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss} accessibilityRole="button">
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Ionicons name="log-out-outline" size={spacing.xxl + spacing.xs} color={colors.textSecondary} />
          </View>
          <Text style={styles.title}>{tp('logoutTitle')}</Text>
          <Text style={styles.body}>{tp('logoutDescription')}</Text>
          <View style={styles.row}>
            <Pressable style={styles.ghost} onPress={onDismiss} accessibilityRole="button">
              <Text style={styles.ghostText}>{tp('cancel')}</Text>
            </Pressable>
            <Pressable
              style={styles.primary}
              onPress={() => {
                onConfirm();
                onDismiss();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.primaryText}>{tp('logoutConfirm')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
