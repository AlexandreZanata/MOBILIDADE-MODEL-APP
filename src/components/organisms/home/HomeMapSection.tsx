import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TileMap } from '@/components/molecules/TileMap';
import { useTheme } from '@/context/ThemeContext';
import { borders, shadows, spacing } from '@/theme';
import { HomeDestination, HomeLocation } from '@/models/home/types';

interface Props {
  center: HomeLocation;
  zoom: number;
  cardHeight: number;
  searchBarHeight: number;
  isCheckingActiveRide: boolean;
  isDriver: boolean;
  isLocating: boolean;
  userLocation: HomeLocation | null;
  destination: HomeDestination | null;
  onMapMove: () => void;
  onRecenter: () => void;
  onZoom: (zoom: number) => void;
  onNotifications: () => void;
}

/**
 * Full-screen map section with floating map control buttons.
 * Controls: 2 stacked 36×36px buttons on the right side (locate + layers).
 */
export const HomeMapSection = memo(function HomeMapSection(props: Props) {
  const { colors, isDark } = useTheme();

  const controlStyle = StyleSheet.flatten([
    styles.mapControl,
    { backgroundColor: colors.card },
    isDark
      ? { borderWidth: 0.5, borderColor: colors.border }
      : shadows.small,
  ]);

  if (props.isCheckingActiveRide && !props.isDriver) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  /** Right-side control cluster — positioned below the search bar */
  const controlsTop = props.searchBarHeight + spacing.sm;
  /** Bottom of controls cluster — above the bottom sheet */
  const controlsBottom = props.cardHeight + spacing.lg;

  return (
    <View style={StyleSheet.absoluteFill}>
      <TileMap
        showRoute={false}
        centerLat={props.center.lat}
        centerLon={props.center.lon}
        zoom={props.zoom}
        userLocation={props.userLocation || undefined}
        destinationLocation={
          props.destination
            ? { lat: props.destination.lat, lon: props.destination.lon }
            : undefined
        }
        onMapMove={props.onMapMove}
        onZoom={props.onZoom}
        bottomContainerHeight={props.cardHeight + spacing.sm}
        topSpaceHeight={props.searchBarHeight}
        isLocating={props.isLocating}
      />

      {/* Map control cluster — right side, below search bar */}
      <View
        style={[
          styles.controlCluster,
          { top: controlsTop, right: spacing.lg },
        ]}
      >
        {/* Locate / recenter */}
        <TouchableOpacity
          style={controlStyle}
          onPress={props.onRecenter}
          disabled={props.isLocating}
          accessibilityRole="button"
          accessibilityLabel="Centralizar no mapa"
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          {props.isLocating ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons name="locate-outline" size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity
          style={controlStyle}
          onPress={props.onNotifications}
          accessibilityRole="button"
          accessibilityLabel="Notificações"
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Recenter FAB — bottom right, above bottom sheet */}
      <TouchableOpacity
        style={[
          styles.recenterFab,
          { backgroundColor: colors.card, bottom: controlsBottom },
          isDark
            ? { borderWidth: 0.5, borderColor: colors.border }
            : shadows.small,
        ]}
        onPress={props.onRecenter}
        disabled={props.isLocating}
        accessibilityRole="button"
        accessibilityLabel="Minha localização"
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Ionicons name="location" size={20} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  /** 36×36 map control button */
  mapControl: {
    width: 36,
    height: 36,
    borderRadius: borders.radiusSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Stacked cluster of map controls */
  controlCluster: {
    position: 'absolute',
    gap: spacing.sm,
  },
  /** Recenter FAB — bottom right */
  recenterFab: {
    position: 'absolute',
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: borders.radiusSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
