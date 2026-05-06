import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { GuestProfileViewData, GuestProfileNavigationTarget } from '@/models/guestProfile/types';
import { GuestProfileHeader } from '@/components/molecules/guestProfile/GuestProfileHeader';
import { GuestProfileActionCard } from '@/components/molecules/guestProfile/GuestProfileActionCard';

interface GuestProfileContentProps {
  viewData: GuestProfileViewData;
  onNavigate: (target: GuestProfileNavigationTarget) => void;
}

export function GuestProfileContent({ viewData, onNavigate }: GuestProfileContentProps) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          flex: 1,
        },
        contentContainer: {
          paddingTop: 0,
          paddingBottom: 0,
        },
        headerContainer: {
          paddingTop: spacing.xl,
          paddingBottom: spacing.xl,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.background,
        },
        infoContainer: {
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xl,
        },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          contentInsetAdjustmentBehavior="automatic"
          bounces
        >
          <View style={styles.headerContainer}>
            <GuestProfileHeader title={viewData.title} subtitle={viewData.subtitle} />
          </View>
          <View style={styles.infoContainer}>
            <GuestProfileActionCard
              title={viewData.infoTitle}
              subtitle={viewData.infoSubtitle}
              actions={viewData.actions}
              onNavigate={onNavigate}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
