/**
 * @file WaitingForDriverScreenContent.tsx
 * @description Full-screen organism for the "Waiting for Driver" state.
 *
 * Map behavior:
 *  - Centers on userLocation (GPS) when available, falls back to tripOrigin
 *  - Shows user pin (blue) and destination pin (red) when coordinates available
 *  - Draws route line when routePoints are loaded (after driver found)
 *  - Pulsing ring animation while searching
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
import type { RoutePoint } from '@/components/molecules/TileMap';

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
  mapZoom: number;
  onMapZoom(zoom: number): void;
  rideId: string | null;
  /** Device GPS location — used for the user pin. */
  userLocation: { lat: number; lon: number } | null;
  /** Trip origin coordinates — used as map center fallback when GPS unavailable. */
  tripOrigin: { lat: number; lon: number } | null;
  /** Trip destination coordinates — used for the destination pin. */
  tripDestination: { lat: number; lon: number } | null;
  /** Calculated route points from routingService — drawn as a line on the map. */
  routePoints: RoutePoint[];
  driver: DriverSummary | null;
  tripStatus: string;
  estimatedFare: number | null;
  isSearching: boolean;
  chatOpenForRide: boolean;
  ratingModalVisible: boolean;
  ratingValue: number;
  ratingComment: string;
  isSubmittingRating: boolean;
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

  // ── Map props ──────────────────────────────────────────────────────────
  // Center: prefer device GPS, fall back to trip origin
  const mapCenter = props.userLocation ?? props.tripOrigin;

  // Driver location: use driver's location if available, otherwise don't show pin
  const driverLocation = props.driver
    ? { lat: props.userLocation?.lat ?? props.tripOrigin?.lat ?? 0, lon: props.userLocation?.lon ?? props.tripOrigin?.lon ?? 0 }
    : undefined;

  // Destination pin: show when we have destination coordinates
  const destinationLocation = props.tripDestination
    ? { lat: props.tripDestination.lat, lon: props.tripDestination.lon }
    : undefined;

  // Show route line only when we have points (driver found + route calculated)
  const hasRoute = props.routePoints.length > 1;

  return (
    <View style={[styles.container, { backgroundColor: props.colors.background }]}>
      {/* ── Full-screen map ──────────────────────────────────────────────── */}
      <TileMap
        // Center on GPS location or trip origin — never undefined
        centerLat={mapCenter?.lat}
        centerLon={mapCenter?.lon}
        zoom={props.mapZoom}
        onZoom={props.onMapZoom}
        // User pin (blue dot)
        userLocation={props.userLocation ?? undefined}
        // Destination pin (red flag)
        destinationLocation={destinationLocation}
        // Driver pin — only when driver is assigned
        driverLocation={driverLocation}
        // Route line — only when calculated
        showRoute={hasRoute}
        route={hasRoute ? props.routePoints : undefined}
        // Keep map centered on user/origin (not driver-centric)
        isDriver={false}
        // Vertical ratio: push center slightly up so bottom sheet doesn't cover it
        verticalCenterRatio={0.35}
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
