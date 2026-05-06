import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TileMap, TileMapRef } from '@/components/molecules/TileMap';
import { useTheme } from '@/context/ThemeContext';
import { shadows, spacing } from '@/theme';
import { DriverTripCoordinate } from '@/models/driverTripInProgress/types';

interface Props {
  mapRef: React.RefObject<TileMapRef | null>;
  mapCenter: DriverTripCoordinate;
  mapZoom: number;
  routePoints: Array<{ lat: number; lon: number }>;
  driverLocation: DriverTripCoordinate | null;
  passengerLocation: DriverTripCoordinate | null;
  destinationLocation: DriverTripCoordinate | null;
  topSpaceHeight: number;
  bottomContainerHeight: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
}

export const DriverTripInProgressMap = memo((props: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create({
    mapContainer: { flex: 1 },
    fab: {
      position: 'absolute',
      right: spacing.md,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.medium,
      shadowColor: colors.shadow,
    },
  });

  const baseBottom = props.bottomContainerHeight + Math.max(insets.bottom, spacing.md);
  return (
    <>
      <View style={styles.mapContainer}>
        <TileMap
          ref={props.mapRef}
          showRoute={props.routePoints.length > 0}
          centerLat={props.mapCenter.lat}
          centerLon={props.mapCenter.lon}
          zoom={props.mapZoom}
          route={props.routePoints}
          driverLocation={props.driverLocation ?? undefined}
          passengerLocation={props.passengerLocation ?? undefined}
          destinationLocation={props.destinationLocation ?? undefined}
          bottomContainerHeight={props.bottomContainerHeight}
          topSpaceHeight={props.topSpaceHeight}
          isLocating={false}
        />
      </View>
      <TouchableOpacity style={[styles.fab, { bottom: baseBottom + 64 }]} onPress={props.onZoomIn}>
        <Ionicons name="add" size={22} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.fab, { bottom: baseBottom + 128 }]} onPress={props.onZoomOut}>
        <Ionicons name="remove" size={22} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.fab, { bottom: baseBottom }]} onPress={props.onRecenter}>
        <Ionicons name="location-outline" size={22} color="#34C759" />
      </TouchableOpacity>
    </>
  );
});
