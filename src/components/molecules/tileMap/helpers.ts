import { TILE_SIZE } from '@/components/molecules/tileMap/constants';
import { RoutePoint } from '@/components/molecules/tileMap/types';

const tileCache = new Map<string, string>();

export function getGoogleMapsTileUrl(x: number, y: number, z: number): string {
  const server = (x + y) % 4;
  return `https://mt${server}.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;
}

export function getCachedTileUrl(x: number, y: number, z: number): string {
  const tileKey = `${z}/${x}/${y}`;
  const cachedTile = tileCache.get(tileKey);
  if (cachedTile) return cachedTile;

  const tileUrl = getGoogleMapsTileUrl(x, y, z);
  tileCache.set(tileKey, tileUrl);
  return tileUrl;
}

export function deg2num(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  return {
    x: Math.floor(((lon + 180) / 360) * n),
    y: Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n),
  };
}

export function getPixelOffset(
  lat: number,
  lon: number,
  tileX: number,
  tileY: number,
  zoom: number
): { x: number; y: number } {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = ((lon + 180) / 360) * n * TILE_SIZE - tileX * TILE_SIZE;
  const latPixel = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
  const y = latPixel * n * TILE_SIZE - tileY * TILE_SIZE;
  return { x, y };
}

export function createRoutePath(
  route: RoutePoint[],
  startX: number,
  startY: number,
  zoom: number
): string {
  const safePoints = route.filter(
    (point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lon)
  );
  if (safePoints.length < 2) return '';

  const points = safePoints.map((point) => getPixelOffset(point.lat, point.lon, startX, startY, zoom));
  const [firstPoint, ...otherPoints] = points;

  return otherPoints.reduce(
    (path, point) => `${path} L ${point.x} ${point.y}`,
    `M ${firstPoint.x} ${firstPoint.y}`
  );
}

function bezierPoint(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * p0.x + 2 * mt * t * p1.x + t2 * p2.x,
    y: mt2 * p0.y + 2 * mt * t * p1.y + t2 * p2.y,
  };
}

export interface DirectionArrow {
  points: Array<{ x: number; y: number }>;
  arrowHead: string;
  angle: number;
}

export function createDirectionArrow(
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number },
  startX: number,
  startY: number,
  zoom: number
): DirectionArrow | null {
  const originPixel = getPixelOffset(origin.lat, origin.lon, startX, startY, zoom);
  const destPixel = getPixelOffset(destination.lat, destination.lon, startX, startY, zoom);
  const dx = destPixel.x - originPixel.x;
  const dy = destPixel.y - originPixel.y;
  const angle = Math.atan2(dy, dx);

  const iconRadius = 16;
  const startOffset = iconRadius + 2;
  const endOffset = iconRadius + 2;
  const start = {
    x: originPixel.x + Math.cos(angle) * startOffset,
    y: originPixel.y + Math.sin(angle) * startOffset,
  };
  const end = {
    x: destPixel.x - Math.cos(angle) * endOffset,
    y: destPixel.y - Math.sin(angle) * endOffset,
  };

  const adjustedDistance = Math.hypot(end.x - start.x, end.y - start.y);
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const curveOffset = adjustedDistance * 0.15;
  const perpAngle = angle + Math.PI / 2;
  const control = {
    x: mid.x + Math.cos(perpAngle) * curveOffset,
    y: mid.y + Math.sin(perpAngle) * curveOffset,
  };

  const pointSpacing = 8;
  const numPoints = Math.max(3, Math.floor(adjustedDistance / pointSpacing));
  const points: Array<{ x: number; y: number }> = [];

  if (numPoints > 1) {
    for (let i = 0; i < numPoints - 1; i += 1) {
      const t = i / (numPoints - 1);
      points.push(bezierPoint(t, start, control, end));
    }
  }
  points.push(end);

  const lastPoint = points[points.length - 1];
  const secondLastPoint = points.length > 1 ? points[points.length - 2] : start;
  const finalAngle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x);
  const arrowTip = {
    x: lastPoint.x + Math.cos(finalAngle) * pointSpacing,
    y: lastPoint.y + Math.sin(finalAngle) * pointSpacing,
  };
  const arrowSize = 14;
  const arrowLeft = {
    x: arrowTip.x - arrowSize * Math.cos(finalAngle - Math.PI / 7),
    y: arrowTip.y - arrowSize * Math.sin(finalAngle - Math.PI / 7),
  };
  const arrowRight = {
    x: arrowTip.x - arrowSize * Math.cos(finalAngle + Math.PI / 7),
    y: arrowTip.y - arrowSize * Math.sin(finalAngle + Math.PI / 7),
  };

  return {
    points,
    arrowHead: `M ${arrowTip.x} ${arrowTip.y} L ${arrowLeft.x} ${arrowLeft.y} L ${arrowRight.x} ${arrowRight.y} Z`,
    angle: angle * (180 / Math.PI),
  };
}
