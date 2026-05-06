import { ForwardedRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';
import { DEFAULT_ZOOM, TILE_SIZE } from '@/components/molecules/tileMap/constants';
import { deg2num, getPixelOffset } from '@/components/molecules/tileMap/helpers';
import { TileMapProps, TileMapRef } from '@/components/molecules/tileMap/types';

/** Discrete zoom levels available via pinch gesture. */
const PINCH_ZOOM_LEVELS = [10, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;
/** Minimum pinch scale delta before a zoom step is triggered. */
const PINCH_SCALE_THRESHOLD = 0.25;

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
}: UseTileMapControllerParams) {
  const mapZoom = zoom || DEFAULT_ZOOM;
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [currentCenterLat, setCurrentCenterLat] = useState(centerLat);
  const [currentCenterLon, setCurrentCenterLon] = useState(centerLon);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const userMovedMap = useRef(false);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastPan = useRef({ x: 0, y: 0 });

  // ─── Pinch-to-zoom state ────────────────────────────────────────────────────
  /** Distance between the two touch points at the start of a pinch gesture. */
  const initialPinchDistance = useRef<number | null>(null);
  /** Zoom level at the moment the pinch started. */
  const pinchStartZoom = useRef<number>(mapZoom);
  /** Stable ref so panResponder closure always sees the latest zoom. */
  const mapZoomRef = useRef<number>(mapZoom);
  useEffect(() => {
    mapZoomRef.current = mapZoom;
  }, [mapZoom]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (!userMovedMap.current) {
      setCurrentCenterLat(centerLat);
      setCurrentCenterLon(centerLon);
    }
  }, [centerLat, centerLon]);

  useImperativeHandle(ref, () => ({
    centerOnLocation: (lat: number, lon: number) => {
      if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.error('TileMap: Invalid coordinates received:', { lat, lon });
        return;
      }

      setCurrentCenterLat(lat);
      setCurrentCenterLon(lon);
      pan.setValue({ x: 0, y: 0 });
      lastPan.current = { x: 0, y: 0 };
      setPanX(0);
      setPanY(0);
      userMovedMap.current = false;
    },
  }));

  /**
   * Returns the Euclidean distance between two touch points.
   */
  function getTouchDistance(touches: { pageX: number; pageY: number }[]): number {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Snaps a raw zoom value to the nearest discrete level in PINCH_ZOOM_LEVELS.
   */
  function snapToZoomLevel(raw: number): number {
    return PINCH_ZOOM_LEVELS.reduce((prev, curr) =>
      Math.abs(curr - raw) < Math.abs(prev - raw) ? curr : prev
    );
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          // Begin pinch — record initial distance and current zoom
          initialPinchDistance.current = getTouchDistance(
            Array.from(evt.nativeEvent.touches) as { pageX: number; pageY: number }[]
          );
          pinchStartZoom.current = mapZoomRef.current;
        } else {
          pan.setOffset(lastPan.current);
          pan.setValue({ x: 0, y: 0 });
        }
      },

      onPanResponderMove: (evt, gesture) => {
        const touches = Array.from(evt.nativeEvent.touches) as { pageX: number; pageY: number }[];

        if (touches.length === 2 && initialPinchDistance.current !== null) {
          // ── Pinch gesture ──────────────────────────────────────────────────
          const currentDistance = getTouchDistance(touches);
          const scale = currentDistance / initialPinchDistance.current;
          const rawZoom = pinchStartZoom.current + Math.log2(scale);
          const clamped = Math.max(
            PINCH_ZOOM_LEVELS[0],
            Math.min(PINCH_ZOOM_LEVELS[PINCH_ZOOM_LEVELS.length - 1], rawZoom)
          );
          const snapped = snapToZoomLevel(clamped);

          // Only fire when the snapped level actually changes
          if (Math.abs(snapped - mapZoomRef.current) >= PINCH_SCALE_THRESHOLD) {
            onZoom?.(snapped);
          }
        } else {
          // ── Pan gesture ────────────────────────────────────────────────────
          userMovedMap.current = true;
          onMapMove?.();
          pan.setValue({ x: gesture.dx, y: gesture.dy });
        }
      },

      onPanResponderRelease: (evt, gesture) => {
        if (evt.nativeEvent.touches.length === 0) {
          initialPinchDistance.current = null;
        }

        pan.flattenOffset();
        const finalPan = {
          x: lastPan.current.x + gesture.dx,
          y: lastPan.current.y + gesture.dy,
        };
        lastPan.current = finalPan;
        setPanX(finalPan.x);
        setPanY(finalPan.y);
      },
    })
  ).current;

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
  }, [currentCenterLat, currentCenterLon, mapZoom, screenDimensions.width, screenDimensions.height, panX, panY]);

  const mapWidth = viewport.tilesPerRow * TILE_SIZE;
  const mapHeight = viewport.tilesPerCol * TILE_SIZE;

  const mapOffsets = useMemo(() => {
    const baseOffsetX = (mapWidth - screenDimensions.width) / 2;
    const baseOffsetY = (mapHeight - screenDimensions.height) / 2;
    const locationToCenter = userLocation || driverLocation;
    if (!locationToCenter) return { offsetX: baseOffsetX, offsetY: baseOffsetY };

    const locationPixel = getPixelOffset(
      locationToCenter.lat,
      locationToCenter.lon,
      viewport.startX,
      viewport.startY,
      mapZoom
    );

    return {
      offsetX: locationPixel.x - screenDimensions.width / 2,
      offsetY: locationPixel.y - screenDimensions.height * verticalCenterRatio,
    };
  }, [
    driverLocation,
    mapHeight,
    mapWidth,
    mapZoom,
    screenDimensions.height,
    screenDimensions.width,
    userLocation,
    verticalCenterRatio,
    viewport.startX,
    viewport.startY,
  ]);

  return {
    mapZoom,
    pan,
    panResponder,
    screenDimensions,
    viewport,
    mapWidth,
    mapHeight,
    mapOffsets,
  };
}

export function getTileMapDefaults(props: TileMapProps): Required<
  Pick<TileMapProps, 'showRoute' | 'route' | 'drivers' | 'bottomContainerHeight' | 'topSpaceHeight' | 'isLocating' | 'isDriver' | 'verticalCenterRatio'>
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
