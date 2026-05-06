import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { StarRatingBadge } from '@/components/atoms/StarRating';
import { useTheme } from '@/context/ThemeContext';
import { borders, spacing, typography } from '@/theme';
import { tp } from '@/i18n/profile';

interface ProfileHeaderCardProps {
  userName: string;
  accountType: string;
  profilePhotoUrl?: string;
  isUploadingPhoto: boolean;
  currentRating?: string;
  totalRatings?: number;
  onEditPhoto(): void;
}

export function ProfileHeaderCard({
  userName,
  accountType,
  profilePhotoUrl,
  isUploadingPhoto,
  currentRating,
  totalRatings = 0,
  onEditPhoto,
}: ProfileHeaderCardProps) {
  const { colors } = useTheme();
  const initials = userName
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const styles = StyleSheet.create({
    card: { marginHorizontal: spacing.md },
    center: { alignItems: 'center', gap: spacing.sm },
    avatar: {
      width: spacing.xxl + spacing.xxl,
      height: spacing.xxl + spacing.xxl,
      borderRadius: borders.radiusFull,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    initials: { ...typography.h1, color: colors.primary },
    name: { ...typography.h2, color: colors.textPrimary },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borders.radiusFull,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    badgeText: { ...typography.caption, color: colors.textPrimary },
    editButton: {
      flexDirection: 'row',
      gap: spacing.xs,
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: borders.radiusMedium,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    editText: { ...typography.button, color: colors.card },
    ratingText: { ...typography.caption, color: colors.textSecondary },
  });

  return (
    <Card style={styles.card}>
      <View style={styles.center}>
        <View style={styles.avatar}>
          {profilePhotoUrl ? (
            <Image source={{ uri: profilePhotoUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.initials}>{initials}</Text>
          )}
        </View>
        <Text style={styles.name}>{userName}</Text>
        <View style={styles.badge}>
          <Ionicons name="person" size={spacing.md} color={colors.secondary} />
          <Text style={styles.badgeText}>{accountType}</Text>
        </View>
        {typeof currentRating === 'string' && (
          <>
            <StarRatingBadge rating={Number(currentRating) || 0} maxRating={10} starCount={5} starSize={spacing.md} />
            <Text style={styles.ratingText}>
              {totalRatings > 0
                ? tp('ratingCount', {
                    count: String(totalRatings),
                    label: totalRatings === 1 ? tp('ratingSingle') : tp('ratingPlural'),
                  })
                : tp('ratingEmpty')}
            </Text>
          </>
        )}
        <TouchableOpacity onPress={onEditPhoto} style={styles.editButton} activeOpacity={0.8} disabled={isUploadingPhoto}>
          {isUploadingPhoto ? (
            <ActivityIndicator size="small" color={colors.card} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={spacing.md} color={colors.card} />
              <Text style={styles.editText}>{tp('uploadPhotoTitle')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );
}
