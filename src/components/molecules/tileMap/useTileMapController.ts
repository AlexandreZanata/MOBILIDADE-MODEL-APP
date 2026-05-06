import { ForwardedRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';
import { DEFAULT_ZOOM, TILE_SIZE } from '@/components/molecules/tileMap/constants';
import { deg2num, getPixelOffset } from '@/components/molecules/tileMap/helpers';
import { TileMapProps, TileMapRef } from '@/components/molecules/tileMap/types';

interface UseTileMapControllerParams {
  centerLat: number;
  centerLon: number;
  zoom: number;
  userLocation?: { lat: number; lon: number };
  driverLocation?: { lat: number; lon: number };
  verticalCenterRatio: number;
  onMapMove?: () => void;
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
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
