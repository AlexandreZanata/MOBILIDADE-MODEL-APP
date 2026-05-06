import React, { useMemo } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography, borders, shadows } from '@/theme';
import Button from '@/components/atoms/Button';
import { useTheme } from '@/context/ThemeContext';
import { DriverTripRequestData, DriverTripRequestPassenger } from '@/models/driverTripRequest/types';
import { DriverTripRequestHeader } from '@/components/molecules/driverTripRequest/DriverTripRequestHeader';
import { DriverTripRequestRouteCard } from '@/components/molecules/driverTripRequest/DriverTripRequestRouteCard';
import { tdtr } from '@/i18n/driverTripRequest';

interface DriverTripRequestModalContentProps {
  visible: boolean;
  tripData: DriverTripRequestData;
  passenger: DriverTripRequestPassenger | null;
  originAddress: string;
  destinationAddress: string;
  timeLeft: number | null;
  distanceLabel: string;
  durationLabel: string;
  onAccept: () => void;
  onReject: () => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function DriverTripRequestModalContent(props: DriverTripRequestModalContentProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const formatPrice = useMemo(
    () => (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
    []
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: { flex: 1, width: '100%', backgroundColor: colors.background },
        topSafeArea: { position: 'absolute', top: 0, left: 0, right: 0, height: Math.max(insets.top, 0), backgroundColor: colors.background, zIndex: 10 },
        modalContent: { position: 'absolute', top: Math.max(insets.top, 0), bottom: Math.max(insets.bottom, 0), left: 0, right: 0, backgroundColor: colors.background, ...shadows.large, shadowColor: colors.shadow },
        header: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
        title: { ...typography.h1, fontSize: 24, fontWeight: '800', color: colors.textPrimary },
        subtitle: { ...typography.body, fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
        timerContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: hexToRgba(colors.secondary, 0.15), alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.secondary, position: 'absolute', right: spacing.md, top: spacing.lg },
        timerText: { ...typography.h1, fontSize: 24, fontWeight: '800', color: colors.secondary },
        passengerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: hexToRgba(colors.primary, 0.06), borderRadius: borders.radiusMedium, padding: spacing.sm, marginTop: spacing.sm, borderWidth: 1, borderColor: hexToRgba(colors.primary, 0.15) },
        passengerAvatarWrapper: { width: 64, height: 64, borderRadius: 32, padding: 2, backgroundColor: colors.card, ...shadows.small },
        passengerDetails: { flex: 1, gap: spacing.xs },
        passengerNameLarge: { ...typography.h1, fontSize: 16, fontWeight: '800', color: colors.textPrimary },
        passengerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
        passengerIdPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borders.radiusMedium, backgroundColor: hexToRgba(colors.textSecondary, 0.08), borderWidth: 1, borderColor: colors.border },
        passengerIdText: { ...typography.caption, fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
        scrollContent: { paddingTop: spacing.lg, paddingHorizontal: spacing.md },
        tripCard: { marginBottom: spacing.lg },
        tripSection: { marginBottom: spacing.md },
        sectionTitle: { ...typography.caption, fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
        timelineContainer: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.xs },
        timelineColumn: { alignItems: 'center', width: 26 },
        timelineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.background, ...shadows.small },
        timelineLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: spacing.xs },
        timelineContent: { flex: 1, gap: spacing.md },
        timelineItem: { padding: spacing.sm, backgroundColor: hexToRgba(colors.primary, 0.03), borderRadius: borders.radiusMedium, borderWidth: 1, borderColor: colors.border },
        locationLabel: { ...typography.caption, fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
        locationText: { ...typography.body, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
        paymentBrandBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: hexToRgba(colors.secondary, 0.1), paddingHorizontal: spacing.xs, paddingVertical: 4, borderRadius: 8, marginTop: spacing.xs, alignSelf: 'flex-start' },
        paymentBrandText: { ...typography.caption, fontSize: 11, fontWeight: '600', color: colors.secondary },
        infoChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
        infoChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, backgroundColor: hexToRgba(colors.textSecondary, 0.08), borderRadius: borders.radiusMedium, borderWidth: 1, borderColor: colors.border },
        infoChipText: { ...typography.caption, fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
        priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm },
        priceLabel: { ...typography.body, fontSize: 16, fontWeight: '600', color: colors.textPrimary },
        priceValue: { ...typography.h1, fontSize: 28, fontWeight: '800', color: colors.secondary },
        buttonsContainer: { paddingHorizontal: spacing.md, paddingBottom: Math.max(insets.bottom, spacing.lg), paddingTop: spacing.md, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
        buttonsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
        rejectButton: { flex: 1 },
        acceptButton: { flex: 2 },
      }),
    [colors, insets.bottom, insets.top]
  );

  return (
    <Modal visible={props.visible} transparent animationType="none" onRequestClose={props.onReject} statusBarTranslucent={Platform.OS === 'android'}>
      <View style={styles.overlay}>
        {insets.top > 0 && <View style={styles.topSafeArea} />}
        <View style={styles.modalContent}>
          <DriverTripRequestHeader
            passenger={props.passenger}
            title={tdtr('title')}
            subtitle={tdtr('subtitle')}
            timerValue={props.timeLeft}
            fallbackPassengerName={tdtr('defaultPassengerName')}
            textSecondaryColor={colors.textSecondary}
            styles={styles}
          />
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.md }}>
            <DriverTripRequestRouteCard
              tripData={props.tripData}
              originAddress={props.originAddress}
              destinationAddress={props.destinationAddress}
              distanceLabel={props.distanceLabel}
              durationLabel={props.durationLabel}
              styles={styles}
              colors={{ primary: colors.primary, secondary: colors.secondary, textPrimary: colors.textPrimary }}
              formatPrice={formatPrice}
            />
          </ScrollView>
          <View style={styles.buttonsContainer}>
            <View style={styles.buttonsRow}>
              <Button title={tdtr('rejectButton')} onPress={props.onReject} variant="ghost" style={styles.rejectButton} />
              <Button title={tdtr('acceptButton')} onPress={props.onAccept} variant="primary" style={styles.acceptButton} disabled={props.timeLeft === 0} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
