import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TileMap } from '@/components/molecules/TileMap';
import { useTheme } from '@/context/ThemeContext';
import { shadows, spacing } from '@/theme';
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
  onZoomIn: () => void;
  onZoomOut: () => void;
  onNotifications: () => void;
}

export function HomeMapSection(props: Props) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    fab: {
      position: 'absolute', right: spacing.md, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.card,
      alignItems: 'center', justifyContent: 'center', ...shadows.medium, shadowColor: colors.shadow, borderWidth: 1, borderColor: colors.border,
    },
  });

  if (props.isCheckingActiveRide && !props.isDriver) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TileMap
        showRoute={false}
        centerLat={props.center.lat}
        centerLon={props.center.lon}
        zoom={props.zoom}
        userLocation={props.userLocation || undefined}
        destinationLocation={props.destination ? { lat: props.destination.lat, lon: props.destination.lon } : undefined}
        onMapMove={props.onMapMove}
        bottomContainerHeight={props.cardHeight + 8}
        topSpaceHeight={props.searchBarHeight}
        isLocating={props.isLocating}
      />
      <TouchableOpacity style={[styles.fab, { bottom: 8 + props.cardHeight + 12 }]} onPress={props.onRecenter} disabled={props.isLocating}>
        <Ionicons name="location-outline" size={24} color="#34C759" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.fab, { bottom: 8 + props.cardHeight + 76 }]} onPress={props.onZoomIn}>
        <Ionicons name="add" size={24} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.fab, { bottom: 8 + props.cardHeight + 140 }]} onPress={props.onZoomOut}>
        <Ionicons name="remove" size={24} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.fab, { top: props.searchBarHeight + 12 }]} onPress={props.onNotifications}>
        <Ionicons name="notifications-outline" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}
