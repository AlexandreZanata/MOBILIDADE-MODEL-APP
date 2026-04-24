import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borders, shadows } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export const FAB: React.FC<FABProps> = ({
  onPress,
  icon = 'locate',
  style,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.medium,
      shadowColor: colors.shadow,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.fab, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={24} color={colors.primary} />
    </TouchableOpacity>
  );
};

