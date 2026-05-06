import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/atoms/Card';
import { StarRating } from '@/components/atoms/StarRating';
import { useTheme } from '@/context/ThemeContext';
import { borders, spacing, typography } from '@/theme';
import { tp } from '@/i18n/profile';

export interface ProfileRatingStarsCardProps {
  /** Backend scale (typically 0–10). */
  ratingTenScale: number;
  /** Shown next to stars (e.g. 4.4 on a 0–5 display). */
  displayValue: string;
  totalRatings: number;
}

export function ProfileRatingStarsCard({ ratingTenScale, displayValue, totalRatings }: ProfileRatingStarsCardProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    wrap: { marginHorizontal: spacing.md, marginTop: spacing.lg },
    card: {
      borderWidth: borders.widthHairline,
      borderColor: colors.border,
      borderRadius: borders.radiusLarge,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    left: { flex: 1, gap: spacing.sm },
    cardTitle: { ...typography.caption, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.3 },
    right: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
    value: { ...typography.subtitle, color: colors.textPrimary, fontWeight: '600' },
    count: { ...typography.caption, color: colors.textSecondary },
  });

  return (
    <View style={styles.wrap}>
      <Card style={styles.card}>
        <View style={styles.left}>
          <Text style={styles.cardTitle}>{tp('ratingCardTitle')}</Text>
          <StarRating
            rating={ratingTenScale}
            maxRating={10}
            starCount={5}
            starSize={spacing.lg + spacing.xs}
            showRatingText={false}
            compact
          />
        </View>
        <View style={styles.right}>
          <Text style={styles.value}>{displayValue}</Text>
          <Text style={styles.count}>{tp('ratingReviewsParen', { count: String(totalRatings) })}</Text>
        </View>
      </Card>
    </View>
  );
}
