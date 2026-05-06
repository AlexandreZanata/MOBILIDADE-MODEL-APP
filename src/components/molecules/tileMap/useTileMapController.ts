import { ForwardedRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import {
  Gesture,
  ComposedGesture,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { DEFAULT_ZOOM, TILE_SIZE } from '@/components/molecules/tileMap/constants';
import { deg2num, getPixelOffset } from '@/components/molecules/tileMap/helpers';
import { TileMapProps, TileMapRef } from '@/components/molecules/tileMap/types';

/** Discrete zoom levels snapped to on pinch release. */
const ZOOM_LEVELS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number];
const ZOOM_MIN: ZoomLevel = ZOOM_LEVELS[0];
const ZOOM_MAX: ZoomLevel = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

/** Clamp a value between min and max. */
function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

/** Snap a raw zoom to the nearest discrete level. */
function snapZoom(raw: number): number {
  'worklet';
  let best: number = ZOOM_LEVELS[0];
  let bestDist = Math.abs(raw - best);
  for (let i = 1; i < ZOOM_LEVELS.length; i++) {
    const dist = Math.abs(raw - ZOOM_LEVELS[i]);
    if (dist < bestDist) {
      bestDist = dist;
      best = ZOOM_LEVELS[i];
    }
  }
  return best;
}

interface UseTileMapControllerParams {
  centerLat: number;
  centerLon: number;
  zoom: number;
  userLocation?: { lat: number; lon: number };
  driverLocation?: { lat: number; lon: number };
  verticalCenterRatio: number;
  onMapMove?: () => void;
  onZoom?: (zoom: number) => void;
  ref: ForwardedRef<TileMapRef>;
}

export interface TileMapController {
  /** Committed pan offset in pixels (JS thread). */
  panX: number;
  panY: number;
  mapZoom: number;
  /** Animated style applied to the map container — runs on UI thread. */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  /** Composed gesture (pan + pinch simultaneously). */
  gesture: ComposedGesture;
  viewport: {
    startX: number;
    startY: number;
    tilesPerRow: number;
    tilesPerCol: number;
  };
  mapWidth: number;
  mapHeight: number;
  screenDimensions: { width: number; height: number };
}

export function useTileMapController({
  centerLat,
  centerLon,
  zoom,
  userLocation,
  driverLocation,
  verticalCenterRatio,
  onMapMove,
  onZoom,
  ref,
}: UseTileMapControllerParams): TileMapController {
  const mapZoom = zoom || DEFAULT_ZOOM;

  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [currentCenterLat, setCurrentCenterLat] = useState(centerLat);
  const [currentCenterLon, setCurrentCenterLon] = useState(centerLon);

  // JS-thread committed pan (used for viewport tile calculation)
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Whether the user has manually moved the map (suppresses auto-center)
  const userMovedMap = useRef(false);

  // ─── Reanimated shared values (UI thread) ──────────────────────────────────
  /** Accumulated pan from previous gestures. */
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  /** Live pan delta during an active gesture. */
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  /** Base offset to center the map canvas on screen. */
  const baseOffsetX = useSharedValue(0);
  const baseOffsetY = useSharedValue(0);

  // ─── Screen dimension listener ─────────────────────────────────────────────
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => sub?.remove();
  }, []);

  // ─── Auto-center when props change (unless user moved the map) ─────────────
  useEffect(() => {
    if (!userMovedMap.current) {
      setCurrentCenterLat(centerLat);
      setCurrentCenterLon(centerLon);
    }
  }, [centerLat, centerLon]);

  // ─── Imperative handle ─────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    centerOnLocation: (lat: number, lon: number) => {
      if (
        Number.isNaN(lat) || Number.isNaN(lon) ||
        lat < -90 || lat > 90 ||
        lon < -180 || lon > 180
      ) {
        console.error('TileMap: invalid coordinates', { lat, lon });
        return;
      }
      setCurrentCenterLat(lat);
      setCurrentCenterLon(lon);
      // Reset pan
      translateX.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      setPanX(0);
      setPanY(0);
      userMovedMap.current = false;
    },
  }));

  // ─── Viewport calculation (JS thread, drives tile selection) ───────────────
  const viewport = useMemo(() => {
    const tile = deg2num(currentCenterLat, currentCenterLon, mapZoom);
    const screenWidth = Math.max(screenDimensions.width, 400);
    const screenHeight = Math.max(screenDimensions.height, 800);
    const visibleTilesX = Math.ceil(screenWidth / TILE_SIZE);
    const visibleTilesY = Math.ceil(screenHeight / TILE_SIZE);
    const bufferTiles = 2;
    const tilesPerRow = visibleTilesX + bufferTiles * 2;
    const tilesPerCol = visibleTilesY + bufferTiles * 2;
    const panOffsetX = Math.floor(panX / TILE_SIZE);
    const panOffsetY = Math.floor(panY / TILE_SIZE);

    return {
      startX: tile.x - Math.floor(visibleTilesX / 2) - bufferTiles - panOffsetX,
      startY: tile.y - Math.floor(visibleTilesY / 2) - bufferTiles - panOffsetY,
      tilesPerRow,
      tilesPerCol,
    };
  }, [currentCenterLat, currentCenterLon, mapZoom, screenDimensions, panX, panY]);

  const mapWidth = viewport.tilesPerRow * TILE_SIZE;
  const mapHeight = viewport.tilesPerCol * TILE_SIZE;

  // ─── Base offset (centers the canvas; accounts for user/driver location) ───
  useEffect(() => {
    const locationToCenter = userLocation || driverLocation;
    if (!locationToCenter) {
      baseOffsetX.value = (mapWidth - screenDimensions.width) / 2;
      baseOffsetY.value = (mapHeight - screenDimensions.height) / 2;
      return;
    }
    const pixel = getPixelOffset(
      locationToCenter.lat,
      locationToCenter.lon,
      viewport.startX,
      viewport.startY,
      mapZoom
    );
    baseOffsetX.value = pixel.x - screenDimensions.width / 2;
    baseOffsetY.value = pixel.y - screenDimensions.height * verticalCenterRatio;
  }, [
    baseOffsetX, baseOffsetY,
    driverLocation, mapHeight, mapWidth, mapZoom,
    screenDimensions, userLocation, verticalCenterRatio,
    viewport.startX, viewport.startY,
  ]);

  // ─── Pinch zoom state (UI thread refs) ─────────────────────────────────────
  /** Zoom at the moment the pinch started. */
  const pinchStartZoom = useSharedValue(mapZoom);
  /** Stable ref so the gesture closure always reads the latest JS zoom. */
  const mapZoomRef = useRef(mapZoom);
  useEffect(() => {
    mapZoomRef.current = mapZoom;
  }, [mapZoom]);

  // ─── Gestures ──────────────────────────────────────────────────────────────

  const panGesture = Gesture.Pan()
    .minDistance(1)
    .onStart(() => {
      savedTranslateX.value = savedTranslateX.value + translateX.value;
      savedTranslateY.value = savedTranslateY.value + translateY.value;
      translateX.value = 0;
      translateY.value = 0;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      runOnJS(onMapMove ?? (() => undefined))();
      runOnJS(() => { userMovedMap.current = true; })();
    })
    .onEnd((e) => {
      const nextX = savedTranslateX.value + e.translationX;
      const nextY = savedTranslateY.value + e.translationY;
      savedTranslateX.value = nextX;
      savedTranslateY.value = nextY;
      translateX.value = 0;
      translateY.value = 0;
      runOnJS(setPanX)(-nextX);
      runOnJS(setPanY)(-nextY);
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      pinchStartZoom.value = mapZoomRef.current;
    })
    .onUpdate((e) => {
      const rawZoom = pinchStartZoom.value + Math.log2(e.scale);
      const clamped = clamp(rawZoom, ZOOM_MIN, ZOOM_MAX);
      const snapped = snapZoom(clamped);
      if (snapped !== mapZoomRef.current && onZoom) {
        runOnJS(onZoom)(snapped);
      }
    });

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // ─── Animated style (UI thread — zero JS bridge overhead) ──────────────────
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -baseOffsetX.value + savedTranslateX.value + translateX.value },
      { translateY: -baseOffsetY.value + savedTranslateY.value + translateY.value },
    ],
  }));

  return {
    panX,
    panY,
    mapZoom,
    animatedStyle,
    gesture,
    viewport,
    mapWidth,
    mapHeight,
    screenDimensions,
  };
}

export function getTileMapDefaults(
  props: TileMapProps
): Required<
  Pick<
    TileMapProps,
    | 'showRoute'
    | 'route'
    | 'drivers'
    | 'bottomContainerHeight'
    | 'topSpaceHeight'
    | 'isLocating'
    | 'isDriver'
    | 'verticalCenterRatio'
  >
> {
  return {
    showRoute: props.showRoute ?? false,
    route: props.route ?? [],
    drivers: props.drivers ?? [],
    bottomContainerHeight: props.bottomContainerHeight ?? 0,
    topSpaceHeight: props.topSpaceHeight ?? 0,
    isLocating: props.isLocating ?? false,
    isDriver: props.isDriver ?? false,
    verticalCenterRatio: props.verticalCenterRatio ?? 0.3,
  };
}
