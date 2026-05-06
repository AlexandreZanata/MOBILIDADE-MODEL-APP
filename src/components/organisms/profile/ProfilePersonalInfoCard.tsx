import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { ProfileInfoRow } from '@/components/molecules/profile/ProfileInfoRow';
import { useTheme } from '@/context/ThemeContext';
import { borders, spacing, typography } from '@/theme';
import { tp } from '@/i18n/profile';

interface InfoItem {
  id: string;
  label: string;
  value: string;
  verified?: boolean;
}

interface ProfilePersonalInfoCardProps {
  items: InfoItem[];
  isLoading: boolean;
  showCnhUpload: boolean;
  isUploadingCNH: boolean;
  onUploadCnh(): void;
}

export function ProfilePersonalInfoCard({
  items,
  isLoading,
  showCnhUpload,
  isUploadingCNH,
  onUploadCnh,
}: ProfilePersonalInfoCardProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    wrapper: { marginHorizontal: spacing.md, marginTop: spacing.md },
    title: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
    loadingRow: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
    loadingText: { ...typography.caption, color: colors.textSecondary },
    cnhButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: borders.radiusMedium,
      paddingVertical: spacing.sm,
      marginTop: spacing.md,
    },
    cnhButtonText: { ...typography.button, color: colors.card },
  });

  return (
    <Card style={styles.wrapper}>
      <Text style={styles.title}>{tp('personalInfoTitle')}</Text>
      <Text style={styles.subtitle}>{tp('personalInfoSubtitle')}</Text>
      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>{tp('loadingData')}</Text>
        </View>
      ) : (
        <>
          {items.map((item, index) => (
            <ProfileInfoRow
              key={item.id}
              label={item.label}
              value={item.value}
              verified={item.verified}
              showDivider={index < items.length - 1}
            />
          ))}
          {showCnhUpload && (
            <TouchableOpacity style={styles.cnhButton} activeOpacity={0.8} onPress={onUploadCnh} disabled={isUploadingCNH}>
              {isUploadingCNH ? (
                <ActivityIndicator size="small" color={colors.card} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={spacing.md} color={colors.card} />
                  <Text style={styles.cnhButtonText}>{tp('uploadCnh')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </Card>
  );
}
