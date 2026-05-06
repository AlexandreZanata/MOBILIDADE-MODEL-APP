/**
 * useTileMapController
 *
 * Gesture handling uses ONLY:
 *   - React Native's built-in `Animated` + `PanResponder` (pan)
 *   - `react-native-gesture-handler` PinchGestureHandler (pinch-to-zoom)
 *
 * No `react-native-reanimated` — fully compatible with Expo Go.
 */
import {
  ForwardedRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';
import { State } from 'react-native-gesture-handler';
import type {
  GestureEvent,
  HandlerStateChangeEvent,
  PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { DEFAULT_ZOOM, TILE_SIZE } from '@/components/molecules/tileMap/constants';
import { deg2num, getPixelOffset } from '@/components/molecules/tileMap/helpers';
import { TileMapProps, TileMapRef } from '@/components/molecules/tileMap/types';

// ─── Zoom levels ──────────────────────────────────────────────────────────────
const ZOOM_LEVELS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;
const ZOOM_MIN = ZOOM_LEVELS[0];
const ZOOM_MAX = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

function snapZoom(raw: number): number {
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

// ─── Types ────────────────────────────────────────────────────────────────────
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
  mapZoom: number;
  pan: Animated.ValueXY;
  panResponder: ReturnType<typeof PanResponder.create>;
  mapOffsets: { offsetX: number; offsetY: number };
  viewport: {
    startX: number;
    startY: number;
    tilesPerRow: number;
    tilesPerCol: number;
  };
  mapWidth: number;
  mapHeight: number;
  screenDimensions: { width: number; height: number };
  /** Called by PinchGestureHandler's onHandlerStateChange */
  onPinchHandlerStateChange: (e: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>) => void;
  /** Called by PinchGestureHandler's onGestureEvent */
  onPinchGestureEvent: (e: GestureEvent<PinchGestureHandlerEventPayload>) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
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
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const userMovedMap = useRef(false);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastPan = useRef({ x: 0, y: 0 });

  // Pinch state — stored in refs so PanResponder closure always sees latest
  const pinchStartZoomRef = useRef(mapZoom);
  const mapZoomRef = useRef(mapZoom);
  useEffect(() => {
    mapZoomRef.current = mapZoom;
  }, [mapZoom]);

  // ─── Screen dimensions ───────────────────────────────────────────────────
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => sub?.remove();
  }, []);

  // ─── Auto-center ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userMovedMap.current) {
      setCurrentCenterLat(centerLat);
      setCurrentCenterLon(centerLon);
    }
  }, [centerLat, centerLon]);

  // ─── Imperative handle ───────────────────────────────────────────────────
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
      Animated.timing(pan, {
        toValue: { x: 0, y: 0 },
        duration: 300,
        useNativeDriver: false,
      }).start();
      lastPan.current = { x: 0, y: 0 };
      setPanX(0);
      setPanY(0);
      userMovedMap.current = false;
    },
  }));

  // ─── PanResponder (pan only — pinch handled by PinchGestureHandler) ──────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 1,
      onMoveShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 1,
      onPanResponderGrant: () => {
        pan.setOffset(lastPan.current);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        userMovedMap.current = true;
        onMapMove?.();
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        const next = {
          x: lastPan.current.x + gesture.dx,
          y: lastPan.current.y + gesture.dy,
        };
        lastPan.current = next;
        setPanX(next.x);
        setPanY(next.y);
      },
    })
  ).current;

  // ─── Pinch handlers (called from PinchGestureHandler in TileMap) ─────────
  const onPinchHandlerStateChange = useCallback(
    (e: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>) => {
      if (e.nativeEvent.state === State.BEGAN) {
        pinchStartZoomRef.current = mapZoomRef.current;
      }
    },
    []
  );

  const onPinchGestureEvent = useCallback(
    (e: GestureEvent<PinchGestureHandlerEventPayload>) => {
      const scale = e.nativeEvent.scale;
      if (!scale || scale <= 0) return;
      const rawZoom = pinchStartZoomRef.current + Math.log2(scale);
      const clamped = Math.min(Math.max(rawZoom, ZOOM_MIN), ZOOM_MAX);
      const snapped = snapZoom(clamped);
      if (snapped !== mapZoomRef.current) {
        onZoom?.(snapped);
      }
    },
    [onZoom]
  );

  // ─── Viewport ────────────────────────────────────────────────────────────
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

  // ─── Map offsets (centers canvas on user/driver location) ────────────────
  const mapOffsets = useMemo(() => {
    const baseOffsetX = (mapWidth - screenDimensions.width) / 2;
    const baseOffsetY = (mapHeight - screenDimensions.height) / 2;
    const locationToCenter = userLocation || driverLocation;
    if (!locationToCenter) return { offsetX: baseOffsetX, offsetY: baseOffsetY };
    const pixel = getPixelOffset(
      locationToCenter.lat,
      locationToCenter.lon,
      viewport.startX,
      viewport.startY,
      mapZoom
    );
    return {
      offsetX: pixel.x - screenDimensions.width / 2,
      offsetY: pixel.y - screenDimensions.height * verticalCenterRatio,
    };
  }, [
    driverLocation, mapHeight, mapWidth, mapZoom,
    screenDimensions, userLocation, verticalCenterRatio,
    viewport.startX, viewport.startY,
  ]);

  return {
    mapZoom,
    pan,
    panResponder,
    mapOffsets,
    viewport,
    mapWidth,
    mapHeight,
    screenDimensions,
    onPinchHandlerStateChange,
    onPinchGestureEvent,
  };
}

// ─── Defaults helper ──────────────────────────────────────────────────────────
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
