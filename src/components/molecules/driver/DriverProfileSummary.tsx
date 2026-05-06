import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/atoms/Avatar';
import { StarRating } from '@/components/atoms/StarRating';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface DriverProfileSummaryProps {
  driverName: string;
  ratingText: string;
  topInset: number;
}

export function DriverProfileSummary({ driverName, ratingText, topInset }: DriverProfileSummaryProps) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        profileSection: {
          alignItems: 'center',
          paddingBottom: spacing.md,
          paddingTop: Math.max(topInset, spacing.xl) + spacing.lg,
          backgroundColor: colors.background,
        },
        driverName: {
          ...typography.h1,
          color: colors.textPrimary,
          marginTop: spacing.md,
          marginBottom: spacing.sm,
        },
        rating: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        ratingText: {
          ...typography.caption,
          color: colors.textSecondary,
          marginLeft: spacing.xs,
        },
      }),
    [colors, topInset]
  );

  return (
    <View style={styles.profileSection}>
      <Avatar size={100} name={driverName} />
      <Text style={styles.driverName}>{driverName}</Text>
      <View style={styles.rating}>
        <StarRating rating={10} maxRating={10} starCount={5} starSize={20} showRatingText={false} />
        <Text style={styles.ratingText}>{ratingText}</Text>
      </View>
    </View>
  );
}
