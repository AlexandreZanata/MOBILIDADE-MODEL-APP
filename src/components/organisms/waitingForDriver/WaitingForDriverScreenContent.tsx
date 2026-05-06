/**
 * @file WaitingForDriverScreenContent.tsx
 * @description Full-screen organism for the "Waiting for Driver" state.
 *
 * Layout (spec):
 *   [Full-screen Map — animated pulse ring while searching]
 *   [Persistent Bottom Sheet — non-dismissable, cross-fades between states]
 *   [Cancel Dialog — in-app modal, NOT Alert]
 *   [Rating Modal — post-trip]
 *   [Chat Window — overlaid when open]
 *
 * Architecture: pure presentational — all logic lives in useWaitingForDriverScreen.
 */
import React, { useCallback, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { TileMap } from '@/components/molecules/TileMap';
import { ChatWindow } from '@/components/organisms/ChatWindow';
import { WaitingCancelDialog } from '@/components/molecules/waitingForDriver/WaitingCancelDialog';
import { WaitingDriverFoundSheet } from '@/components/molecules/waitingForDriver/WaitingDriverFoundSheet';
import { WaitingRatingModal } from '@/components/molecules/waitingForDriver/WaitingRatingModal';
import { WaitingSearchingSheet } from '@/components/molecules/waitingForDriver/WaitingSearchingSheet';
import { shadows } from '@/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriverSummary {
  id: string;
  name: string;
  rating?: number;
  photoUrl?: string;
  vehicle?: { brand?: string; model?: string; plate?: string; color?: string };
}

interface ThemeColors {
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  border: string;
}

export interface WaitingForDriverScreenContentProps {
  colors: ThemeColors;
  insetsTop: number;
  insetsBottom: number;
  rideId: string | null;
  userLocation: { lat: number; lon: number } | null;
  driver: DriverSummary | null;
  tripStatus: string;
  estimatedFare: number | null;
  isSearching: boolean;
  chatOpenForRide: boolean;
  ratingModalVisible: boolean;
  ratingValue: number;
  ratingComment: string;
  isSubmittingRating: boolean;
  /** Optional trip metadata for the summary row */
  originAddress?: string;
  destinationAddress?: string;
  categoryName?: string;
  etaMinutes?: number;
  onToggleChat(): void;
  onCancelRide(): void;
  onSetRatingValue(value: number): void;
  onSetRatingComment(value: string): void;
  onSetRatingModalVisible(value: boolean): void;
  onSubmitRating(): void;
  onSkipRating(): void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WaitingForDriverScreenContent(
  props: WaitingForDriverScreenContentProps,
): React.ReactElement {
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);

  const handleCancelPress = useCallback(() => setCancelDialogVisible(true), []);
  const handleCancelDismiss = useCallback(() => setCancelDialogVisible(false), []);
  const handleCancelConfirm = useCallback(() => {
    setCancelDialogVisible(false);
    props.onCancelRide();
  }, [props]);

  const driverLocation = props.driver
    ? { lat: props.userLocation?.lat ?? 0, lon: props.userLocation?.lon ?? 0 }
    : undefined;

  return (
    <View style={[styles.container, { backgroundColor: props.colors.background }]}>
      {/* ── Full-screen map ──────────────────────────────────────────────── */}
      <TileMap
        userLocation={props.userLocation ?? undefined}
        driverLocation={driverLocation}
        showRoute={!props.isSearching}
      />

      {/* ── Bottom sheet ─────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.sheetWrapper,
          { paddingBottom: props.insetsBottom },
          shadows.large,
        ]}
      >
        {props.isSearching ? (
          <WaitingSearchingSheet
            estimatedFare={props.estimatedFare}
            originAddress={props.originAddress}
            destinationAddress={props.destinationAddress}
            categoryName={props.categoryName}
            etaMinutes={props.etaMinutes}
            onChatPress={props.onToggleChat}
            onCancelPress={handleCancelPress}
          />
        ) : props.driver != null ? (
          <WaitingDriverFoundSheet
            driver={props.driver}
            etaMinutes={props.etaMinutes}
            onChatPress={props.onToggleChat}
            onFollowMapPress={props.onToggleChat}
          />
        ) : null}
      </Animated.View>

      {/* ── Cancel confirmation dialog ───────────────────────────────────── */}
      <WaitingCancelDialog
        visible={cancelDialogVisible}
        onConfirm={handleCancelConfirm}
        onDismiss={handleCancelDismiss}
      />

      {/* ── Rating modal ─────────────────────────────────────────────────── */}
      <WaitingRatingModal
        visible={props.ratingModalVisible}
        ratingValue={props.ratingValue}
        ratingComment={props.ratingComment}
        isSubmitting={props.isSubmittingRating}
        insetsBottom={props.insetsBottom}
        onSetRatingValue={props.onSetRatingValue}
        onSetRatingComment={props.onSetRatingComment}
        onSubmit={props.onSubmitRating}
        onSkip={props.onSkipRating}
      />

      {/* ── Chat window ──────────────────────────────────────────────────── */}
      {props.chatOpenForRide && props.rideId != null && (
        <ChatWindow
          rideId={props.rideId}
          otherUserName={props.driver?.name ?? 'Motorista'}
          otherUserPhoto={props.driver?.photoUrl}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
