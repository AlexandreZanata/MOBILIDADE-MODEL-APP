import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, shadows } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface DriverHomeHeaderProps {
  statusCardHeight: number;
  onPressBilling: () => void;
}

export const DriverHomeHeader = memo(({ statusCardHeight, onPressBilling }: DriverHomeHeaderProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    statusBarBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: insets.top,
      backgroundColor: colors.background,
      zIndex: 15,
    },
    billingFab: {
      position: 'absolute',
      right: spacing.md,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.medium,
      shadowColor: colors.shadow,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 11,
      top: insets.top + spacing.sm + statusCardHeight + spacing.sm,
    },
  });

  return (
    <>
      <View style={styles.statusBarBackground} />
      <TouchableOpacity style={styles.billingFab} onPress={onPressBilling} activeOpacity={0.8}>
        <Ionicons name="cash-outline" size={24} color={colors.primary} />
      </TouchableOpacity>
    </>
  );
});
