import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { borders, shadows, spacing, typography } from '@/theme';

const AVATAR_SIZE = spacing.xxl * 3;
const CAMERA_BADGE_SIZE = spacing.xxl;

interface ProfileHeaderCardProps {
  userName: string;
  email: string;
  accountType: string;
  profilePhotoUrl?: string;
  isUploadingPhoto: boolean;
  isDriverAccount: boolean;
  onEditPhoto(): void;
}

export function ProfileHeaderCard({
  userName,
  email,
  accountType,
  profilePhotoUrl,
  isUploadingPhoto,
  isDriverAccount,
  onEditPhoto,
}: ProfileHeaderCardProps) {
  const { colors, isDark } = useTheme();
  const initials = userName
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const styles = StyleSheet.create({
    hero: {
      backgroundColor: colors.profileHeroBg,
      borderBottomLeftRadius: borders.radiusXL,
      borderBottomRightRadius: borders.radiusXL,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxl + spacing.sm,
      paddingHorizontal: spacing.lg,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      ...(isDark
        ? {
            borderWidth: borders.widthHairline,
            borderColor: colors.border,
          }
        : {
            ...shadows.large,
            shadowColor: colors.shadow,
          }),
    },
    inner: { alignItems: 'center', gap: spacing.sm },
    avatarWrap: { position: 'relative' },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: borders.radiusFull,
      backgroundColor: colors.profileHeroMuted,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: borders.profileAvatarBorderWidth,
      borderColor: colors.accent,
    },
    avatarImage: { width: '100%', height: '100%' },
    initials: { ...typography.h1, color: colors.profileHeroText },
    camBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: CAMERA_BADGE_SIZE,
      height: CAMERA_BADGE_SIZE,
      borderRadius: CAMERA_BADGE_SIZE / 2,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: borders.widthHairline,
      borderColor: colors.profileHeroBg,
    },
    name: {
      ...typography.title,
      fontSize: 20,
      fontWeight: '600',
      color: colors.profileHeroText,
      textAlign: 'center',
      letterSpacing: -0.2,
    },
    email: {
      ...typography.body,
      color: colors.profileHeroMuted,
      textAlign: 'center',
      maxWidth: '100%',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: borders.widthHairline,
      borderColor: 'rgba(255,255,255,0.24)',
      borderRadius: borders.radiusFull,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.sm,
    },
    badgeText: { ...typography.caption, fontWeight: '600', color: colors.profileHeroText },
  });

  return (
    <View style={styles.hero}>
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
              <ActivityIndicator size="small" color={colors.onAccent} />
            ) : (
              <Ionicons name="camera" size={spacing.md} color={colors.onAccent} />
            )}
          </View>
        </Pressable>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.badge}>
          <Ionicons
            name={isDriverAccount ? 'shield-checkmark' : 'person-outline'}
            size={spacing.md}
            color={colors.profileHeroMuted}
          />
          <Text style={styles.badgeText}>{accountType}</Text>
        </View>
      </View>
    </View>
  );
}
