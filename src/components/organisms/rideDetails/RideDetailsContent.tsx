import React, { useMemo } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, shadows } from '@/theme';
import { RideDetailsRide, RideDetailsPerson } from '@/models/rideDetails/types';
import { trd } from '@/i18n/rideDetails';
import { RideDetailsHeader } from '@/components/molecules/rideDetails/RideDetailsHeader';
import { RideStatusCard } from '@/components/molecules/rideDetails/RideStatusCard';
import { RidePersonCard } from '@/components/molecules/rideDetails/RidePersonCard';
import { RideInfoCard } from '@/components/molecules/rideDetails/RideInfoCard';
import { RidePriceCard } from '@/components/molecules/rideDetails/RidePriceCard';

interface RideDetailsContentProps {
  ride: RideDetailsRide | null;
  isDriver: boolean;
  statusLabel: string;
  statusTone: 'success' | 'error' | 'warning';
  peer: RideDetailsPerson | null;
  peerPhoto?: string;
  formatDate: (value?: string) => string;
  formatPrice: (value?: number | null) => string;
  formatDistance: (value?: number) => string | null;
  formatDuration: (value?: number) => string | null;
  onBack: () => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function RideDetailsContent(props: RideDetailsContentProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        safeAreaTop: { backgroundColor: colors.card, paddingTop: insets.top },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        backButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: hexToRgba(colors.textPrimary, 0.05),
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: {
          ...typography.h2,
          fontSize: 18,
          fontWeight: '700',
          color: colors.textPrimary,
          marginLeft: spacing.md,
          flex: 1,
        },
        emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        emptyStateText: { color: colors.textPrimary },
        content: { flex: 1 },
        contentContainer: { padding: spacing.md, paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg },
        section: { marginBottom: spacing.md },
        sectionTitle: {
          ...typography.caption,
          fontSize: 11,
          fontWeight: '700',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: spacing.sm,
          marginLeft: spacing.xs,
        },
        statusCard: { borderRadius: 12, overflow: 'hidden', ...shadows.small },
        statusCardContent: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
        statusText: { ...typography.body, fontWeight: '700', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
        userCard: { borderRadius: 12, overflow: 'hidden', ...shadows.small },
        userCardContent: { padding: spacing.md },
        userHeader: { flexDirection: 'row', alignItems: 'center' },
        userInfo: { flex: 1, marginLeft: spacing.md },
        userName: { ...typography.h2, fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
        vehicleInfo: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
        vehicleTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
        vehicleTitle: { ...typography.body, fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginLeft: spacing.xs },
        vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
        vehicleItem: { width: '48%', backgroundColor: hexToRgba(colors.primary, 0.05), borderRadius: 8, padding: spacing.xs + 2 },
        vehicleLabel: { ...typography.caption, fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 1 },
        vehicleValue: { ...typography.body, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
        infoCard: { borderRadius: 12, overflow: 'hidden', ...shadows.small },
        infoCardContent: { padding: spacing.md },
        infoRowWithIcon: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm },
        infoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: hexToRgba(colors.primary, 0.1), alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, marginTop: 2 },
        infoTextContainer: { flex: 1 },
        infoLabel: { ...typography.caption, fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
        infoValue: { ...typography.body, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
        divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, opacity: 0.4, marginVertical: spacing.xs },
        priceCard: { borderRadius: 12, overflow: 'hidden', backgroundColor: hexToRgba(colors.primary, 0.12), borderWidth: 1, borderColor: hexToRgba(colors.primary, 0.2) },
        priceCardContent: { padding: spacing.md },
        priceMainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        priceLabelContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
        priceLabelIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: hexToRgba(colors.primary, 0.2), alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
        priceLabel: { ...typography.body, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
        priceValue: { ...typography.h1, fontSize: 20, fontWeight: '800', color: colors.primary },
        priceEstimatedRow: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: hexToRgba(colors.primary, 0.15), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        priceEstimatedLabel: { ...typography.body, fontSize: 14, color: colors.textSecondary },
        priceEstimatedValue: { ...typography.body, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
      }),
    [colors, insets.bottom, insets.top]
  );

  if (!props.ride) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{trd('notFound')}</Text>
        </View>
      </View>
    );
  }

  const statusColor = colors.status[props.statusTone];

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />
      <View style={styles.safeAreaTop}>
        <RideDetailsHeader
          onBack={props.onBack}
          textColor={colors.textPrimary}
          styles={{ header: styles.header, backButton: styles.backButton, headerTitle: styles.headerTitle }}
        />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <RideStatusCard
          title={trd('statusSection')}
          statusLabel={props.statusLabel}
          statusColor={statusColor}
          styles={{
            section: styles.section,
            sectionTitle: styles.sectionTitle,
            statusCard: styles.statusCard,
            statusCardContent: styles.statusCardContent,
            statusText: styles.statusText,
          }}
        />
        <RidePersonCard
          isDriver={props.isDriver}
          person={props.peer}
          personPhoto={props.peerPhoto}
          primaryColor={colors.primary}
          styles={{
            section: styles.section,
            sectionTitle: styles.sectionTitle,
            userCard: styles.userCard,
            userCardContent: styles.userCardContent,
            userHeader: styles.userHeader,
            userInfo: styles.userInfo,
            userName: styles.userName,
            vehicleInfo: styles.vehicleInfo,
            vehicleTitleRow: styles.vehicleTitleRow,
            vehicleTitle: styles.vehicleTitle,
            vehicleGrid: styles.vehicleGrid,
            vehicleItem: styles.vehicleItem,
            vehicleLabel: styles.vehicleLabel,
            vehicleValue: styles.vehicleValue,
          }}
        />
        <RideInfoCard
          ride={props.ride}
          primaryColor={colors.primary}
          warningColor={colors.status.warning}
          formatDistance={props.formatDistance}
          formatDuration={props.formatDuration}
          formatDate={props.formatDate}
          styles={{
            section: styles.section,
            sectionTitle: styles.sectionTitle,
            infoCard: styles.infoCard,
            infoCardContent: styles.infoCardContent,
            infoRowWithIcon: styles.infoRowWithIcon,
            infoIcon: styles.infoIcon,
            infoTextContainer: styles.infoTextContainer,
            infoLabel: styles.infoLabel,
            infoValue: styles.infoValue,
            divider: styles.divider,
          }}
        />
        <RidePriceCard
          ride={props.ride}
          primaryColor={colors.primary}
          formatPrice={props.formatPrice}
          styles={{
            section: styles.section,
            sectionTitle: styles.sectionTitle,
            priceCard: styles.priceCard,
            priceCardContent: styles.priceCardContent,
            priceMainRow: styles.priceMainRow,
            priceLabelContainer: styles.priceLabelContainer,
            priceLabelIcon: styles.priceLabelIcon,
            priceLabel: styles.priceLabel,
            priceValue: styles.priceValue,
            priceEstimatedRow: styles.priceEstimatedRow,
            priceEstimatedLabel: styles.priceEstimatedLabel,
            priceEstimatedValue: styles.priceEstimatedValue,
          }}
        />
      </ScrollView>
    </View>
  );
}
