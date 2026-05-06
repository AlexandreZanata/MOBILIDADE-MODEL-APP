import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { useTheme } from '@/context/ThemeContext';
import { borders, spacing, typography } from '@/theme';

const AVATAR_SIZE = spacing.xxl * 3;
const CAMERA_BADGE_SIZE = spacing.xxl;

interface ProfileHeaderCardProps {
  userName: string;
  accountType: string;
  profilePhotoUrl?: string;
  isUploadingPhoto: boolean;
  isDriverAccount: boolean;
  ratingLine?: string;
  onEditPhoto(): void;
}

export function ProfileHeaderCard({
  userName,
  accountType,
  profilePhotoUrl,
  isUploadingPhoto,
  isDriverAccount,
  ratingLine,
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
    inner: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xxl },
    avatarWrap: { position: 'relative' },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: borders.radiusFull,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: borders.profileAvatarBorderWidth,
      borderColor: colors.accent,
    },
    avatarImage: { width: '100%', height: '100%' },
    initials: { ...typography.h1, color: colors.primary },
    camBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: CAMERA_BADGE_SIZE,
      height: CAMERA_BADGE_SIZE,
      borderRadius: CAMERA_BADGE_SIZE / 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: borders.widthHairline,
      borderColor: colors.card,
    },
    name: { ...typography.title, color: colors.textPrimary, textAlign: 'center' },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.accentSoft,
      borderRadius: borders.radiusFull,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    badgeText: { ...typography.caption, fontWeight: '500', color: colors.accent },
    ratingText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  });

  return (
    <Card style={styles.card}>
      <View style={styles.inner}>
        <Pressable
          onPress={onEditPhoto}
          disabled={isUploadingPhoto}
          accessibilityRole="button"
          style={styles.avatarWrap}
        >
          <View style={styles.avatar}>
            {profilePhotoUrl ? (
              <Image source={{ uri: profilePhotoUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Text style={styles.initials}>{initials}</Text>
            )}
          </View>
          <View style={styles.camBadge}>
            {isUploadingPhoto ? (
              <ActivityIndicator size="small" color={colors.card} />
            ) : (
              <Ionicons name="camera" size={spacing.md} color={colors.card} />
            )}
          </View>
        </Pressable>
        <Text style={styles.name}>{userName}</Text>
        <View style={styles.badge}>
          <Ionicons
            name={isDriverAccount ? 'shield-checkmark' : 'person'}
            size={spacing.md}
            color={colors.accent}
          />
          <Text style={styles.badgeText}>{accountType}</Text>
        </View>
        {ratingLine ? <Text style={styles.ratingText}>{ratingLine}</Text> : null}
      </View>
    </Card>
  );
}
