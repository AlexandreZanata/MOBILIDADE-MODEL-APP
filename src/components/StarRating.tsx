import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography } from '@/theme';

interface StarRatingProps {
  /** Rating value from 0-10 (backend scale) - will be converted to 0-5 stars */
  rating: number;
  /** Maximum rating value from backend (default: 10) */
  maxRating?: number;
  /** Number of stars to display (default: 5) */
  starCount?: number;
  /** Size of each star in pixels (default: 16) */
  starSize?: number;
  /** Whether to show the numeric rating text (default: true) */
  showRatingText?: boolean;
  /** Whether to show half stars (default: true) */
  showHalfStars?: boolean;
  /** Custom color for filled stars */
  activeColor?: string;
  /** Custom color for empty stars */
  inactiveColor?: string;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom text style for rating number */
  textStyle?: TextStyle;
  /** Compact mode - smaller stars and spacing */
  compact?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 10,
  starCount = 5,
  starSize = 16,
  showRatingText = true,
  showHalfStars = true,
  activeColor,
  inactiveColor,
  style,
  textStyle,
  compact = false,
}) => {
  const { colors } = useTheme();

  // Convert rating from backend scale (0-10) to star scale (0-5)
  const normalizedRating = (rating / maxRating) * starCount;
  
  // Clamp between 0 and starCount
  const clampedRating = Math.max(0, Math.min(starCount, normalizedRating));

  const filledColor = activeColor || colors.secondary;
  const emptyColor = inactiveColor || colors.textSecondary;

  const renderStar = (index: number): React.ReactElement => {
    const starValue = index + 1;
    
    if (clampedRating >= starValue) {
      // Full star
      return (
        <Ionicons
          key={index}
          name="star"
          size={compact ? starSize * 0.85 : starSize}
          color={filledColor}
        />
      );
    } else if (showHalfStars && clampedRating >= starValue - 0.5) {
      // Half star
      return (
        <Ionicons
          key={index}
          name="star-half"
          size={compact ? starSize * 0.85 : starSize}
          color={filledColor}
        />
      );
    } else {
      // Empty star
      return (
        <Ionicons
          key={index}
          name="star-outline"
          size={compact ? starSize * 0.85 : starSize}
          color={emptyColor}
        />
      );
    }
  };

  // Format rating text (show as x.x out of 5)
  const formatRatingText = (): string => {
    const displayRating = clampedRating.toFixed(1);
    return displayRating;
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: compact ? spacing.xs / 2 : spacing.xs,
    },
    starsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: compact ? 1 : 2,
    },
    ratingText: {
      ...typography.caption,
      fontSize: compact ? 11 : 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginLeft: compact ? spacing.xs / 2 : spacing.xs,
      fontFamily: 'Poppins-SemiBold',
    },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {Array.from({ length: starCount }, (_, index) => renderStar(index))}
      </View>
      {showRatingText && (
        <Text style={[styles.ratingText, textStyle]}>{formatRatingText()}</Text>
      )}
    </View>
  );
};

// Badge variant for inline use
interface StarRatingBadgeProps extends Omit<StarRatingProps, 'showRatingText'> {
  /** Background color for the badge */
  backgroundColor?: string;
}

export const StarRatingBadge: React.FC<StarRatingBadgeProps> = ({
  rating,
  maxRating = 10,
  starCount = 5,
  starSize = 14,
  activeColor,
  backgroundColor,
  style,
  textStyle,
  compact = true,
  ...props
}) => {
  const { colors } = useTheme();

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const filledColor = activeColor || colors.secondary;
  const bgColor = backgroundColor || hexToRgba(colors.secondary, 0.12);

  // Convert rating from backend scale (0-10) to star scale (0-5)
  const normalizedRating = (rating / maxRating) * starCount;
  const clampedRating = Math.max(0, Math.min(starCount, normalizedRating));

  const styles = StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: bgColor,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
    },
    starsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
    },
    ratingText: {
      ...typography.caption,
      fontSize: 12,
      fontWeight: '600',
      color: filledColor,
      fontFamily: 'Poppins-SemiBold',
    },
  });

  const renderStar = (index: number): React.ReactElement => {
    const starValue = index + 1;
    
    if (clampedRating >= starValue) {
      return (
        <Ionicons
          key={index}
          name="star"
          size={starSize}
          color={filledColor}
        />
      );
    } else if (clampedRating >= starValue - 0.5) {
      return (
        <Ionicons
          key={index}
          name="star-half"
          size={starSize}
          color={filledColor}
        />
      );
    } else {
      return (
        <Ionicons
          key={index}
          name="star-outline"
          size={starSize}
          color={colors.textSecondary}
        />
      );
    }
  };

  return (
    <View style={[styles.badge, style]}>
      <View style={styles.starsContainer}>
        {Array.from({ length: starCount }, (_, index) => renderStar(index))}
      </View>
      <Text style={[styles.ratingText, textStyle]}>
        {clampedRating.toFixed(1)}
      </Text>
    </View>
  );
};

export default StarRating;

