import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/atoms/Button';
import { spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { DriverViewData } from '@/models/driver/types';
import { DriverProfileSummary } from '@/components/molecules/driver/DriverProfileSummary';
import { DriverInfoCard } from '@/components/molecules/driver/DriverInfoCard';

interface DriverScreenContentProps {
  viewData: DriverViewData;
  onReject: () => void;
  onAccept: () => void;
}

export function DriverScreenContent({ viewData, onReject, onAccept }: DriverScreenContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          flex: 1,
        },
        contentContainer: {
          paddingBottom: spacing.xl,
        },
        footer: {
          flexDirection: 'row',
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: Math.max(insets.bottom, spacing.md),
          backgroundColor: colors.background,
          gap: spacing.md,
        },
        rejectButton: {
          flex: 1,
        },
        acceptButton: {
          flex: 1,
        },
      }),
    [colors, insets.bottom]
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <DriverProfileSummary driverName={viewData.driverName} ratingText={viewData.ratingText} topInset={insets.top} />
        <DriverInfoCard title={viewData.vehicleTitle} iconName="car-outline" items={viewData.vehicleItems} highlightedIcon={null} />
        <DriverInfoCard title={viewData.deliveryTitle} iconName="cube-outline" items={viewData.deliveryItems} highlightedIcon="location" />
      </ScrollView>

      <View style={styles.footer}>
        <Button title={viewData.rejectButtonText} onPress={onReject} variant="ghost" style={styles.rejectButton} />
        <Button title={viewData.acceptButtonText} onPress={onAccept} variant="secondary" style={styles.acceptButton} />
      </View>
    </View>
  );
}
