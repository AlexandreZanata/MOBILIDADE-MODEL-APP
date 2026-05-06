import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { borders, spacing, typography } from '@/theme';
import { TripCategoryOption } from '@/models/tripPrice/types';
import { formatPrice } from '@/utils/formatters';

export interface RideTypeChipProps {
  item: TripCategoryOption;
  isSelected: boolean;
  onPress: (id: string) => void;
}

/**
 * Single ride-type chip for the horizontal carousel.
 * Shows category name and formatted price; active state uses accent color.
 */
export const RideTypeChip = memo(function RideTypeChip({
  item,
  isSelected,
  onPress,
}: RideTypeChipProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          borderColor: isSelected ? colors.accent : colors.border,
          backgroundColor: isSelected ? colors.accentSoft : colors.backgroundSecondary,
        },
      ]}
      onPress={() => onPress(item.id)}
      activeOpacity={0.75}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${item.name}, ${formatPrice(item.finalFare)}`}
    >
      <Text
        style={[styles.name, { color: isSelected ? colors.accent : colors.textPrimary }]}
        numberOfLines={1}
      >
        {item.name}
      </Text>
      <Text style={[styles.price, { color: colors.textSecondary }]}>
        {formatPrice(item.finalFare)}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  chip: {
    minWidth: 80,
    paddingVertical: spacing.sm,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderRadius: borders.radiusMedium,
    alignItems: 'center',
    marginRight: spacing.sm,
    gap: 4,
  },
  name: {
    ...typography.caption,
    fontWeight: '500',
  },
  price: {
    ...typography.micro,
  },
});
