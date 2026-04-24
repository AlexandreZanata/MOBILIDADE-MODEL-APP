import React from 'react';
import { View, StyleSheet, ViewStyle, LayoutChangeEvent } from 'react-native';
import { spacing, borders, shadows } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  selected?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
}

export const Card: React.FC<CardProps> = ({ children, style, selected = false, onLayout }) => {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: borders.radiusMedium,
      padding: spacing.md,
      ...shadows.medium,
      shadowColor: colors.shadow,
    },
    selected: {
      borderWidth: 2,
      borderColor: colors.accent,
      ...shadows.large,
      shadowColor: colors.shadow,
    },
  });

  return (
    <View
      style={[
        styles.card,
        selected && styles.selected,
        style,
      ]}
      onLayout={onLayout}
    >
      {children}
    </View>
  );
};

