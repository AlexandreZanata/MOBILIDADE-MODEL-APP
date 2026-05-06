/**
 * TileMap
 *
 * Tile-based map component. Gesture handling:
 *   - Pan  → React Native PanResponder (single finger)
 *   - Zoom → react-native-gesture-handler PinchGestureHandler (two fingers)
 *
 * Zero dependency on react-native-reanimated — works in Expo Go.
 */
import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Text,
  View,
} from 'react-native';
import {
  PinchGestureHandler,
  type GestureEvent,
  type HandlerStateChangeEvent,
  type PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { DEFAULT_ZOOM, SORRISO_LAT, SORRISO_LON } from '@/components/molecules/tileMap/constants';
import {
  createDirectionArrow,
  createRoutePath,
  getCachedTileUrl,
  getPixelOffset,
} from '@/components/molecules/tileMap/helpers';
import { createTileMapStyles } from '@/components/molecules/tileMap/styles';
import { TileMapProps, TileMapRef } from '@/components/molecules/tileMap/types';
import {
  getTileMapDefaults,
  useTileMapController,
} from '@/components/molecules/tileMap/useTileMapController';

export type { Driver, RoutePoint, TileMapRef } from '@/components/molecules/tileMap/types';

export const TileMap = forwardRef<TileMapRef, TileMapProps>((props, ref) => {
  const defaults = getTileMapDefaults(props);
  const centerLat = props.centerLat ?? SORRISO_LAT;
  const centerLon = props.centerLon ?? SORRISO_LON;
  const zoom = props.zoom ?? DEFAULT_ZOOM;
  const { colors } = useTheme();

  const {
    mapZoom,
    pan,
    panResponder,
    mapOffsets,
    viewport,
    mapWidth,
    mapHeight,
    onPinchHandlerStateChange,
    onPinchGestureEvent,
  } = useTileMapController({
    centerLat,
    centerLon,
    zoom,
    userLocation: props.userLocation,
    driverLocation: props.driverLocation,
    verticalCenterRatio: defaults.verticalCenterRatio,
    onMapMove: props.onMapMove,
    onZoom: props.onZoom,
    ref,
  });

  const styles = createTileMapStyles({ colors, mapWidth, mapHeight });

  // ─── Skeleton fade-in (no Reanimated — plain Animated.Value) ─────────────
  const skeletonOpacity = useRef(new Animated.Value(1)).current;
  const [skeletonDone, setSkeletonDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(skeletonOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setSkeletonDone(true));
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Tile rows ────────────────────────────────────────────────────────────
  const tileRows = useMemo(() => {
    return Array.from({ length: viewport.tilesPerCol }, (_, rowIndex) => {
      const tileY = viewport.startY + rowIndex;
      const rowTiles = Array.from({ length: viewport.tilesPerRow }, (_, colIndex) => {
        const tileX = viewport.startX + colIndex;
        const tileKey = `${tileX}-${tileY}`;
        return (
          <Image
            key={tileKey}
            source={{ uri: getCachedTileUrl(tileX, tileY, mapZoom) }}
            style={styles.tile}
            resizeMode="cover"
            onError={() =>
              console.warn(`Tile load error: ${mapZoom}/${tileX}/${tileY}`)
            }
          />
        );
      });
      return (
        <View key={`row-${tileY}`} style={styles.tileRow}>
          {rowTiles}
        </View>
      );
    });
  }, [
    mapZoom,
    styles.tile,
    styles.tileRow,
    viewport.startX,
    viewport.startY,
    viewport.tilesPerCol,
    viewport.tilesPerRow,
  ]);

  const driverIconNameByType: Record<
    'car' | 'motorcycle',
    React.ComponentProps<typeof Ionicons>['name']
  > = { car: 'car', motorcycle: 'bicycle' };

  return (
    // PinchGestureHandler wraps everything — handles two-finger zoom
    <PinchGestureHandler
      onGestureEvent={onPinchGestureEvent as (e: GestureEvent<PinchGestureHandlerEventPayload>) => void}
      onHandlerStateChange={onPinchHandlerStateChange as (e: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>) => void}
    >
      <View style={styles.container}>
        {/* Animated.View with PanResponder handles single-finger pan */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.mapContainer,
            {
              transform: [
                { translateX: Animated.add(-mapOffsets.offsetX, pan.x) },
                { translateY: Animated.add(-mapOffsets.offsetY, pan.y) },
              ],
            },
          ]}
        >
          {tileRows}

          {/* ── SVG overlay ──────────────────────────────────────────────── */}
          <Svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: mapWidth,
              height: mapHeight,
            }}
            width={mapWidth}
            height={mapHeight}
            pointerEvents="none"
          >
            <Defs>
              <LinearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#1E40AF" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#1E40AF" stopOpacity="0.9" />
              </LinearGradient>
              <LinearGradient id="driverRouteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#34C759" stopOpacity="0.7" />
                <Stop offset="100%" stopColor="#34C759" stopOpacity="0.7" />
              </LinearGradient>
            </Defs>

            {defaults.showRoute &&
              defaults.route.length > 1 &&
              (() => {
                const routePath = createRoutePath(
                  defaults.route,
                  viewport.startX,
                  viewport.startY,
                  mapZoom
                );
                if (!routePath) return null;
                return (
                  <Path
                    d={routePath}
                    stroke="#1E40AF"
                    strokeWidth={7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity={0.9}
                  />
                );
              })()}

            {props.driverRoutes &&
              defaults.drivers.map((driver) => {
                const driverRoute = props.driverRoutes?.get(driver.id);
                if (!driverRoute || driverRoute.length < 2) return null;
                const driverPath = createRoutePath(
                  driverRoute,
                  viewport.startX,
                  viewport.startY,
                  mapZoom
                );
                if (!driverPath) return null;
                return (
                  <Path
                    key={`driver-route-${driver.id}`}
                    d={driverPath}
                    stroke="#34C759"
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity={0.7}
                  />
                );
              })}

            {props.userLocation &&
              props.destinationLocation &&
              (() => {
                const arrow = createDirectionArrow(
                  props.userLocation,
                  props.destinationLocation,
                  viewport.startX,
                  viewport.startY,
                  mapZoom
                );
                if (!arrow) return null;
                return (
                  <>
                    {arrow.points.map((point, index) => (
                      <Circle
                        key={`arrow-point-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={3}
                        fill="#000000"
                        opacity={0.95}
                      />
                    ))}
                    <Path d={arrow.arrowHead} fill="#000000" opacity={0.95} />
                  </>
                );
              })()}
          </Svg>

          {/* ── Driver markers ───────────────────────────────────────────── */}
          {defaults.drivers.map((driver) => {
            const pixel = getPixelOffset(
              driver.lat,
              driver.lon,
              viewport.startX,
              viewport.startY,
              mapZoom
            );
            return (
              <View
                key={driver.id}
                style={[
                  styles.driverMarker,
                  {
                    top: pixel.y - 18,
                    left: pixel.x - 18,
                    transform: driver.bearing ? [{ rotate: `${driver.bearing}deg` }] : [],
                  },
                ]}
              >
                <Ionicons
                  name={driverIconNameByType[driver.type]}
                  size={20}
                  color={colors.primary}
                />
              </View>
            );
          })}

          {props.driverLocation &&
            (() => {
              const pixel = getPixelOffset(
                props.driverLocation.lat,
                props.driverLocation.lon,
                viewport.startX,
                viewport.startY,
                mapZoom
              );
              return (
                <View
                  style={[styles.driverMarker, { top: pixel.y - 18, left: pixel.x - 18 }]}
                  pointerEvents="none"
                >
                  <Ionicons name="car" size={20} color={colors.primary} />
                </View>
              );
            })()}

          {props.userLocation &&
            (() => {
              const pixel = getPixelOffset(
                props.userLocation.lat,
                props.userLocation.lon,
                viewport.startX,
                viewport.startY,
                mapZoom
              );
              const userIcon: React.ComponentProps<typeof Ionicons>['name'] =
                defaults.isDriver || !!props.passengerLocation ? 'car' : 'location';
              return (
                <View
                  style={[styles.userMarker, { top: pixel.y, left: pixel.x }]}
                  pointerEvents="none"
                >
                  <Ionicons name={userIcon} size={18} color="#FFFFFF" />
                </View>
              );
            })()}

          {props.passengerLocation &&
            (() => {
              const pixel = getPixelOffset(
                props.passengerLocation.lat,
                props.passengerLocation.lon,
                viewport.startX,
                viewport.startY,
                mapZoom
              );
              return (
                <View
                  style={[styles.passengerMarker, { top: pixel.y, left: pixel.x }]}
                  pointerEvents="none"
                >
                  <Ionicons name="person" size={18} color="#FFFFFF" />
                </View>
              );
            })()}

          {props.destinationLocation &&
            (() => {
              const pixel = getPixelOffset(
                props.destinationLocation.lat,
                props.destinationLocation.lon,
                viewport.startX,
                viewport.startY,
                mapZoom
              );
              return (
                <View
                  style={[styles.destinationMarker, { top: pixel.y, left: pixel.x }]}
                  pointerEvents="none"
                >
                  <Ionicons name="flag" size={18} color="#FFFFFF" />
                </View>
              );
            })()}
        </Animated.View>

        {/* ── Locating overlay ─────────────────────────────────────────────── */}
        {defaults.isLocating && (
          <View style={styles.locatingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.locatingText}>Buscando sua localização</Text>
          </View>
        )}

        {/* ── Skeleton fade-in ─────────────────────────────────────────────── */}
        {!skeletonDone && (
          <Animated.View
            pointerEvents="none"
            style={[styles.skeletonOverlay, { opacity: skeletonOpacity }]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </Animated.View>
        )}
      </View>
    </PinchGestureHandler>
  );
});

TileMap.displayName = 'TileMap';
