import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TileMap } from '@/components/molecules/TileMap';
import { Card } from '@/components/atoms/Card';
import { useTheme } from '@/context/ThemeContext';
import { shadows, spacing, typography } from '@/theme';
import { DriverHomeLocation, NearbyDriverMapItem } from '@/models/driverHome/types';

interface DriverHomeMapSectionProps {
  mapCenter: DriverHomeLocation;
  mapZoom: number;
  currentLocation: DriverHomeLocation | null;
  passengerLocation: { lat: number; lng: number } | null;
  nearbyDrivers: NearbyDriverMapItem[];
  isAvailable: boolean;
  infoCardHeight: number;
  locationError: string | null;
  apiError: string | null;
  isCheckingActiveRide: boolean;
  onMapMove: () => void;
  onZoom: (zoom: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
}

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const DriverHomeMapSection = memo((props: DriverHomeMapSectionProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    mapContainer: { flex: 1 },
    locationFab: {
      position: 'absolute',
      right: spacing.md,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.medium,
      shadowColor: colors.shadow,
      borderWidth: 1,
      borderColor: colors.border,
      bottom: !props.isAvailable ? 8 + props.infoCardHeight + 12 : 20,
      zIndex: 11,
    },
    zoomFab: {
      position: 'absolute',
      right: spacing.md,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.medium,
      shadowColor: colors.shadow,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 11,
    },
    notificationContainer: {
      position: 'absolute',
      bottom: spacing.xl + insets.bottom + 70,
      right: spacing.md,
      left: spacing.md,
      zIndex: 10,
      maxWidth: 280,
      alignSelf: 'flex-end',
    },
    notificationCard: {
      padding: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.status.error,
    },
    notificationText: {
      ...typography.caption,
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    checkingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingTop: insets.top + spacing.md,
      paddingBottom: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba(colors.background, 0.92),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.sm,
      zIndex: 30,
    },
    checkingOverlayText: {
      ...typography.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
  });

  return (
    <>
      <View style={styles.mapContainer}>
        <TileMap
          showRoute={false}
          centerLat={props.mapCenter.lat}
          centerLon={props.mapCenter.lon}
          zoom={props.mapZoom}
          userLocation={props.currentLocation || undefined}
          passengerLocation={props.passengerLocation ? { lat: props.passengerLocation.lat, lon: props.passengerLocation.lng } : undefined}
          drivers={props.nearbyDrivers}
          onMapMove={props.onMapMove}
          onZoom={props.onZoom}
          isDriver={true}
          bottomContainerHeight={0}
          topSpaceHeight={0}
          isLocating={false}
          verticalCenterRatio={0.5}
        />
      </View>

      <TouchableOpacity
        style={[styles.zoomFab, { bottom: !props.isAvailable ? 8 + props.infoCardHeight + 12 + 64 : 84 }]}
        onPress={props.onZoomIn}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.zoomFab, { bottom: !props.isAvailable ? 8 + props.infoCardHeight + 12 + 128 : 148 }]}
        onPress={props.onZoomOut}
        activeOpacity={0.8}
      >
        <Ionicons name="remove" size={24} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.locationFab} onPress={props.onRecenter} activeOpacity={0.8}>
        <Ionicons name="location-outline" size={24} color="#34C759" />
      </TouchableOpacity>

      {(props.locationError || props.apiError) && (
        <View style={styles.notificationContainer}>
          <Card
            style={{
              ...styles.notificationCard,
              ...(props.locationError ? { backgroundColor: colors.status.warning } : {}),
              ...(props.apiError ? { backgroundColor: colors.status.error } : {}),
            }}
          >
            <Text style={styles.notificationText}>{props.locationError || props.apiError}</Text>
          </Card>
        </View>
      )}

      {props.isCheckingActiveRide && (
        <View style={styles.checkingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.checkingOverlayText}>Verificando corridas ativas...</Text>
        </View>
      )}
    </>
  );
});
