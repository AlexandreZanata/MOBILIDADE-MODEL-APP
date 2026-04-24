import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  Text,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export interface RoutePoint {
  lat: number;
  lon: number;
}

export interface Driver {
  id: string;
  lat: number;
  lon: number;
  type: 'car' | 'motorcycle';
  bearing?: number; // direção em graus (0-360)
}

interface TileMapProps {
  showRoute?: boolean;
  centerLat?: number;
  centerLon?: number;
  zoom?: number;
  route?: RoutePoint[]; // Rota OSRM (array de coordenadas)
  drivers?: Driver[]; // Motoristas no mapa
  driverRoutes?: Map<string, RoutePoint[]>; // Rotas dos motoristas para exibir no mapa
  driverLocation?: { lat: number; lon: number }; // Localização do motorista (para tela de entrega)
  userLocation?: { lat: number; lon: number }; // Localização do usuário
  passengerLocation?: { lat: number; lon: number }; // Localização do passageiro (para motoristas)
  destinationLocation?: { lat: number; lon: number }; // Localização do destino (para mostrar seta de direção)
  onMapMove?: () => void; // Callback quando o usuário move o mapa
  bottomContainerHeight?: number; // Altura do container inferior para calcular posição central
  topSpaceHeight?: number; // Altura do espaço superior (barra de pesquisa) para calcular posição central
  isLocating?: boolean; // Indica se está buscando localização
  isDriver?: boolean; // Indica se o usuário atual é um motorista (para mostrar ícone de veículo)
  verticalCenterRatio?: number; // Porcentagem da tela para centralização vertical (0.3 = 30%, 0.5 = 50%)
}

export interface TileMapRef {
  centerOnLocation: (lat: number, lon: number) => void;
}

const TILE_SIZE = 256;

// Função para gerar URL do tile do Google Maps
// Usa múltiplos servidores (mt0-3) para balanceamento de carga
// lyrs=m = mapa padrão (roadmap)
// lyrs=s = satélite
// lyrs=y = híbrido (satélite com labels)
// lyrs=t = terreno
const getGoogleMapsTileUrl = (x: number, y: number, z: number): string => {
  const server = (x + y) % 4; // Balanceamento entre servidores mt0-3
  // Usa o formato padrão do Google Maps para tiles
  // O parâmetro 'lyrs=m' indica o tipo de mapa (roadmap)
  return `https://mt${server}.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;
};

// Cache de tiles em memória
const tileCache = new Map<string, string>();

// Coordenadas de Sorriso, MT
const SORRISO_LAT = -12.5458;
const SORRISO_LON = -55.7061;
const DEFAULT_ZOOM = 17; // Zoom mais afastado para visualizar área maior

// Função para converter latitude/longitude para tile coordinates
const deg2num = (lat: number, lon: number, zoom: number) => {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const xtile = Math.floor(((lon + 180) / 360) * n);
  const ytile = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x: xtile, y: ytile };
};

// Função para calcular pixels de uma coordenada em um tile
// Usa a projeção Mercator conforme padrão OSM/OSRM
const getPixelOffset = (lat: number, lon: number, tileX: number, tileY: number, zoom: number) => {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  
  // Converte lon para pixel X (Mercator)
  const x = ((lon + 180) / 360) * n * TILE_SIZE - tileX * TILE_SIZE;
  
  // Converte lat para pixel Y (Mercator - fórmula inversa)
  const latPixel = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
  const y = latPixel * n * TILE_SIZE - tileY * TILE_SIZE;
  
  return { x, y };
};

// Função para converter coordenadas OSRM em SVG Path suave e profissional
// Usa todas as coordenadas OSRM e conecta com linhas suaves (strokeLinejoin="round" faz a suavização)
const createRoutePath = (
  route: RoutePoint[],
  startX: number,
  startY: number,
  zoom: number
): string => {
  // Sanitiza coordenadas para evitar NaN no Path (ex.: dados incompletos em reconexões)
  const safePoints = route.filter(
    (point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lon)
  );

  if (safePoints.length < 2) return '';

  // Converte todas as coordenadas para pixels usando a mesma projeção dos tiles
  // Isso garante alinhamento perfeito com os tiles (EPSG:3857)
  const points = safePoints.map((point) => getPixelOffset(point.lat, point.lon, startX, startY, zoom));
  
  // Cria path SVG conectando todos os pontos
  // O strokeLinejoin="round" no componente Path cria curvas suaves nos cantos
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }

  return path;
};

// Função para calcular ponto em uma curva Bezier quadrática
// t é um valor entre 0 e 1
const bezierPoint = (t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * p0.x + 2 * mt * t * p1.x + t2 * p2.x,
    y: mt2 * p0.y + 2 * mt * t * p1.y + t2 * p2.y,
  };
};

// Função para criar seta de direção inteligente da localização do usuário até o destino
// Usa linha curva (bezier) composta por pontos (bolinhas)
const createDirectionArrow = (
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number },
  startX: number,
  startY: number,
  zoom: number
): { points: Array<{ x: number; y: number }>; arrowHead: string; angle: number } | null => {
  if (!origin || !destination) return null;

  const originPixel = getPixelOffset(origin.lat, origin.lon, startX, startY, zoom);
  const destPixel = getPixelOffset(destination.lat, destination.lon, startX, startY, zoom);

  // Calcula o ângulo da seta (em radianos)
  const dx = destPixel.x - originPixel.x;
  const dy = destPixel.y - originPixel.y;
  const angle = Math.atan2(dy, dx); // ângulo em radianos
  const totalDistance = Math.sqrt(dx * dx + dy * dy);

  // Raio dos ícones (16px para marcadores de 32x32)
  const iconRadius = 16;
  
  // Ponto de início da seta - quase encostado no ícone do usuário
  const startOffset = iconRadius + 2; // Quase encostado (2px de margem)
  const startX_offset = originPixel.x + Math.cos(angle) * startOffset;
  const startY_offset = originPixel.y + Math.sin(angle) * startOffset;
  
  // Ponto final da seta - quase encostado no ícone de destino
  // Considera o tamanho da bolinha (3px) + espaçamento (8px) + triângulo (14px) para não ultrapassar
  const endOffset = iconRadius + 2; // Quase encostado (2px de margem)
  const endX_offset = destPixel.x - Math.cos(angle) * endOffset;
  const endY_offset = destPixel.y - Math.sin(angle) * endOffset;
  
  // Distância ajustada para a linha curva
  const adjustedDistance = Math.sqrt(
    Math.pow(endX_offset - startX_offset, 2) + 
    Math.pow(endY_offset - startY_offset, 2)
  );
  
  // Cria uma linha curva usando Bezier quadrática para visual mais moderno
  // O ponto de controle fica no meio, mas deslocado perpendicularmente para criar curva suave
  const midX = (startX_offset + endX_offset) / 2;
  const midY = (startY_offset + endY_offset) / 2;
  
  // Deslocamento perpendicular para criar curva (15% da distância)
  const curveOffset = adjustedDistance * 0.15;
  const perpAngle = angle + Math.PI / 2; // Perpendicular ao ângulo principal
  const controlX = midX + Math.cos(perpAngle) * curveOffset;
  const controlY = midY + Math.sin(perpAngle) * curveOffset;
  
  // Calcula pontos ao longo da curva Bezier
  // Espaçamento entre pontos: 8px (bolinha de 3px + 5px de espaço em branco)
  const pointSpacing = 8;
  const numPoints = Math.max(3, Math.floor(adjustedDistance / pointSpacing));
  const points: Array<{ x: number; y: number }> = [];
  
  const p0 = { x: startX_offset, y: startY_offset };
  const p1 = { x: controlX, y: controlY };
  const p2 = { x: endX_offset, y: endY_offset };
  
  // Gera pontos ao longo da curva, garantindo que o último ponto seja exatamente no final
  if (numPoints > 1) {
    for (let i = 0; i < numPoints - 1; i++) {
      const t = i / (numPoints - 1);
      const point = bezierPoint(t, p0, p1, p2);
      points.push(point);
    }
  }
  // Garante que o último ponto seja exatamente no final
  points.push({ x: endX_offset, y: endY_offset });

  // Calcula a posição do triângulo no final da linha
  // O triângulo deve ficar após a última bolinha, com o mesmo espaçamento (pointSpacing)
  const lastPoint = points[points.length - 1];
  const secondLastPoint = points.length > 1 ? points[points.length - 2] : p0;
  
  // Calcula a direção da última parte da linha
  const finalDx = lastPoint.x - secondLastPoint.x;
  const finalDy = lastPoint.y - secondLastPoint.y;
  const finalDistance = Math.sqrt(finalDx * finalDx + finalDy * finalDy);
  const finalAngle = Math.atan2(finalDy, finalDx);
  
  // Posição do triângulo: última bolinha + espaçamento na direção da linha
  const triangleOffset = pointSpacing;
  const arrowTipX = lastPoint.x + Math.cos(finalAngle) * triangleOffset;
  const arrowTipY = lastPoint.y + Math.sin(finalAngle) * triangleOffset;
  
  // Cria a ponta da seta (triângulo) posicionada após a última bolinha
  const arrowSize = 14;
  
  // Pontos do triângulo da seta (ângulos de 25 graus em cada lado para visual mais fino)
  const arrowLeftX = arrowTipX - arrowSize * Math.cos(finalAngle - Math.PI / 7);
  const arrowLeftY = arrowTipY - arrowSize * Math.sin(finalAngle - Math.PI / 7);
  const arrowRightX = arrowTipX - arrowSize * Math.cos(finalAngle + Math.PI / 7);
  const arrowRightY = arrowTipY - arrowSize * Math.sin(finalAngle + Math.PI / 7);
  
  const arrowHead = `M ${arrowTipX} ${arrowTipY} L ${arrowLeftX} ${arrowLeftY} L ${arrowRightX} ${arrowRightY} Z`;

  return { points, arrowHead, angle: angle * (180 / Math.PI) };
};

export const TileMap = forwardRef<TileMapRef, TileMapProps>(({
  showRoute = false,
  centerLat = SORRISO_LAT,
  centerLon = SORRISO_LON,
  zoom = DEFAULT_ZOOM,
  route = [],
  drivers = [],
  driverRoutes,
  driverLocation,
  userLocation,
  passengerLocation,
  destinationLocation,
  onMapMove,
  bottomContainerHeight = 0,
  topSpaceHeight = 0,
  isLocating = false,
  isDriver = false, // Indica se o usuário é motorista
  verticalCenterRatio = 0.3, // Padrão 30% (tela do passageiro)
}, ref) => {
  // Usa o zoom fornecido ou o padrão (14 - mais afastado)
  const mapZoom = zoom || DEFAULT_ZOOM;
  const { colors } = useTheme();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [currentCenterLat, setCurrentCenterLat] = useState(centerLat);
  const [currentCenterLon, setCurrentCenterLon] = useState(centerLon);
  const userMovedMap = useRef(false);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastPan = useRef({ x: 0, y: 0 });
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Sincroniza o centro quando as props mudam
  useEffect(() => {
    if (!userMovedMap.current) {
      setCurrentCenterLat(centerLat);
      setCurrentCenterLon(centerLon);
    }
  }, [centerLat, centerLon]);

  useImperativeHandle(ref, () => ({
    centerOnLocation: (lat: number, lon: number) => {
      // Valida coordenadas
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.error('TileMap: Invalid coordinates received:', { lat, lon });
        return;
      }

      // Atualiza o centro imediatamente
      setCurrentCenterLat(lat);
      setCurrentCenterLon(lon);

      // Reset pan completamente
      pan.setValue({ x: 0, y: 0 });
      lastPan.current = { x: 0, y: 0 };
      setPanX(0);
      setPanY(0);
      userMovedMap.current = false;
    },
  }));

  // Pan responder para gestos de arrastar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: lastPan.current.x,
          y: lastPan.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        userMovedMap.current = true;
        if (onMapMove) {
          onMapMove();
        }
        // Movimento natural: arrasta na direção do dedo
        pan.setValue({
          x: gesture.dx,
          y: gesture.dy,
        });
        // Não atualiza estado durante movimento para evitar re-renderizações
      },
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        const finalX = lastPan.current.x + gesture.dx;
        const finalY = lastPan.current.y + gesture.dy;
        lastPan.current = {
          x: finalX,
          y: finalY,
        };
        // Atualiza estado apenas quando soltar para recalcular tiles visíveis
        setPanX(finalX);
        setPanY(finalY);
      },
    })
  ).current;

  // Calcula a viewport atual baseada no pan
  // Usa useMemo para recalcular apenas quando necessário
  const {startX, startY, tilesPerRow, tilesPerCol } = useMemo(() => {
    const tile = deg2num(currentCenterLat, currentCenterLon, mapZoom);
    const screenWidth = Math.max(screenDimensions.width, 400);
    const screenHeight = Math.max(screenDimensions.height, 800);
    
    // Calcula quantos tiles são visíveis na tela
    const visibleTilesX = Math.ceil(screenWidth / TILE_SIZE);
    const visibleTilesY = Math.ceil(screenHeight / TILE_SIZE);
    
    // Buffer otimizado (2 tiles em cada direção) - balanceamento entre performance e qualidade
    // Buffer menor = menos tiles = carregamento mais rápido
    const bufferTiles = 2;
    const tilesPerRow = visibleTilesX + (bufferTiles * 2);
    const tilesPerCol = visibleTilesY + (bufferTiles * 2);
    
    // Calcula o offset do pan em tiles
    const panOffsetX = Math.floor(panX / TILE_SIZE);
    const panOffsetY = Math.floor(panY / TILE_SIZE);
    
    // Calcula quais tiles são visíveis baseado no centro e no pan
    const startX = tile.x - Math.floor(visibleTilesX / 2) - bufferTiles - panOffsetX;
    const startY = tile.y - Math.floor(visibleTilesY / 2) - bufferTiles - panOffsetY;
    
    return { centerTile: tile, startX, startY, tilesPerRow, tilesPerCol };
  }, [currentCenterLat, currentCenterLon, mapZoom, screenDimensions.width, screenDimensions.height, panX, panY]);


  const mapWidth = tilesPerRow * TILE_SIZE;
  const mapHeight = tilesPerCol * TILE_SIZE;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    mapContainer: {
      width: mapWidth,
      height: mapHeight,
      position: 'relative',
    },
    tileRow: {
      flexDirection: 'row',
    },
    tile: {
      width: TILE_SIZE,
      height: TILE_SIZE,
    },
    marker: {
      position: 'absolute',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 4,
      transform: [{ translateX: -20 }, { translateY: -40 }],
    },
    driverMarker: {
      position: 'absolute',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.card || '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow || '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 20,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    userMarker: {
      position: 'absolute',
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#1E3A8A', // Azul escuro
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow || '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 30,
      borderWidth: 2.5,
      borderColor: '#FFFFFF',
      transform: [{ translateX: -16 }, { translateY: -32 }],
    },
    passengerMarker: {
      position: 'absolute',
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#1B5E20', // Verde escuro
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow || '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 25,
      borderWidth: 2.5,
      borderColor: '#FFFFFF',
      transform: [{ translateX: -16 }, { translateY: -32 }],
    },
    destinationMarker: {
      position: 'absolute',
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#EA4335',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow || '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 30,
      borderWidth: 2.5,
      borderColor: '#FFFFFF',
      transform: [{ translateX: -16 }, { translateY: -32 }],
    },
    locatingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(128, 128, 128, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    locatingText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '500',
      marginTop: 12,
    },
  });

  // Cache simples - apenas armazena as URLs, sem pré-carregamento pesado
  // O React Native Image já faz cache automático

  // Usa useMemo para recalcular tiles apenas quando necessário
  // Remove currentCenterLat e currentCenterLon das dependências para evitar recálculo desnecessário
  // Eles são usados apenas para calcular startX e startY, que já estão nas dependências
  const tileRows = useMemo(() => {
    const rows = [];
    for (let y = 0; y < tilesPerCol; y++) {
      const tileY = startY + y;
      const rowTiles = [];
      
      for (let x = 0; x < tilesPerRow; x++) {
        const tileX = startX + x;
        const tileKey = `${mapZoom}/${tileX}/${tileY}`;
        // Usa Google Maps tiles ao invés da VPS OSM
        const tileUrl = getGoogleMapsTileUrl(tileX, tileY, mapZoom);
        // Armazena no cache para referência futura
        if (!tileCache.has(tileKey)) {
          tileCache.set(tileKey, tileUrl);
        }
        
        rowTiles.push(
          <Image
            key={`${tileX}-${tileY}`}
            source={{ uri: tileUrl }}
            style={styles.tile}
            resizeMode="cover"
            onError={(error) => {
              // Log silencioso - tiles podem falhar ocasionalmente
              console.warn(`Erro ao carregar tile ${tileKey}`);
            }}
          />
        );
      }
      
      rows.push(
        <View key={`row-${tileY}`} style={styles.tileRow}>
          {rowTiles}
        </View>
      );
    }
    return rows;
  }, [startX, startY, tilesPerRow, tilesPerCol, mapZoom, panX, panY]);

  // Calcula offset para centralizar o mapa na tela
  // Considera o pan atual para manter a posição correta
  const baseOffsetX = (mapWidth - screenDimensions.width) / 2;
  const baseOffsetY = (mapHeight - screenDimensions.height) / 2;
  
  let offsetX = baseOffsetX;
  let offsetY = baseOffsetY;
  
  // Prioriza userLocation, mas se não existir, usa driverLocation (para motorista)
  const locationToCenter = userLocation || driverLocation;
  
  if (locationToCenter) {
    // Calcula a posição do ponto no mapa
    const locationPixel = getPixelOffset(locationToCenter.lat, locationToCenter.lon, startX, startY, mapZoom);
    // Centraliza o ponto na porcentagem da altura da tela (30% para passageiro, 50% para motorista)
    const targetY = screenDimensions.height * verticalCenterRatio;
    // Centraliza horizontalmente (50% da largura da tela)
    const targetX = screenDimensions.width / 2;
    // Ajusta os offsets para posicionar o ponto na posição desejada
    offsetX = locationPixel.x - targetX;
    offsetY = locationPixel.y - targetY;
  }
  
  // Ajusta offset considerando o pan (já está sendo aplicado no transform)
  // O pan.x e pan.y já são aplicados no Animated.add, então não precisamos subtrair aqui

  return (
    <View style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.mapContainer,
          {
            transform: [
              { translateX: Animated.add(-offsetX, pan.x) },
              { translateY: Animated.add(-offsetY, pan.y) },
            ],
          },
        ]}
      >
        {tileRows}
        
        {/* SVG Overlay para rotas profissionais - posicionado absolutamente sobre os tiles */}
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
            {/* Gradiente para rota principal (estilo profissional) - Azul escuro */}
            <LinearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#1E40AF" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#1E40AF" stopOpacity="0.9" />
            </LinearGradient>
            {/* Gradiente para rotas de veículos */}
            <LinearGradient id="driverRouteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#34C759" stopOpacity="0.7" />
              <Stop offset="100%" stopColor="#34C759" stopOpacity="0.7" />
            </LinearGradient>
          </Defs>

          {/* Rota OSRM principal - renderiza TODAS as coordenadas com path SVG profissional */}
          {showRoute && route.length > 1 && (() => {
            const routePath = createRoutePath(route, startX, startY, mapZoom);
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

          {/* Rotas dos veículos (drivers) - renderiza TODAS as coordenadas OSRM */}
          {driverRoutes && drivers.map((driver) => {
            const driverRoute = driverRoutes.get(driver.id);
            if (!driverRoute || driverRoute.length < 2) return null;

            const driverPath = createRoutePath(driverRoute, startX, startY, mapZoom);
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

          {/* Seta de direção inteligente da localização do usuário até o destino */}
          {userLocation && destinationLocation && (() => {
            const arrow = createDirectionArrow(userLocation, destinationLocation, startX, startY, mapZoom);
            if (!arrow) return null;

            return (
              <>
                {/* Corpo da seta composto por bolinhas (pontos) */}
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
                {/* Ponta da seta (triângulo preto) */}
                <Path
                  d={arrow.arrowHead}
                  fill="#000000"
                  opacity={0.95}
                />
              </>
            );
          })()}
        </Svg>
        
        {/* Motoristas */}
        {drivers && drivers.length > 0 && drivers.map((driver) => {
          const driverPixel = getPixelOffset(driver.lat, driver.lon, startX, startY, mapZoom);
          const iconName = driver.type === 'car' ? 'car' : 'bicycle';
          
          return (
            <View
              key={driver.id}
              style={[
                styles.driverMarker,
                {
                  top: driverPixel.y - 18,
                  left: driverPixel.x - 18,
                  transform: driver.bearing ? [{ rotate: `${driver.bearing}deg` }] : [],
                },
              ]}
            >
              <Ionicons
                name={iconName as any}
                size={20}
                color={colors.primary}
              />
            </View>
          );
        })}
        
        {/* Localização do motorista (para tela de entrega) */}
        {driverLocation && (() => {
          const driverPixel = getPixelOffset(driverLocation.lat, driverLocation.lon, startX, startY, mapZoom);
          return (
            <View
              style={[
                styles.driverMarker,
                {
                  top: driverPixel.y - 18,
                  left: driverPixel.x - 18,
                },
              ]}
              pointerEvents="none"
            >
              <Ionicons name="car" size={20} color={colors.primary} />
            </View>
          );
        })()}

        {/* Localização do usuário - fixa no mapa nas coordenadas reais */}
        {userLocation && (() => {
          const userPixel = getPixelOffset(userLocation.lat, userLocation.lon, startX, startY, mapZoom);
          // Se isDriver é true OU há passengerLocation, significa que estamos na tela do motorista
          // Nesse caso, userLocation é do motorista e deve usar ícone de veículo
          // Caso contrário, é tela do passageiro e deve usar ícone de localização
          const isDriverLocation = isDriver || !!passengerLocation;
          return (
            <View
              style={[
                styles.userMarker,
                {
                  top: userPixel.y,
                  left: userPixel.x,
                },
              ]}
              pointerEvents="none"
            >
              <Ionicons name={isDriverLocation ? "car" : "location"} size={18} color="#FFFFFF" />
            </View>
          );
        })()}

        {/* Localização do passageiro - para motoristas visualizarem */}
        {passengerLocation && (() => {
          const passengerPixel = getPixelOffset(passengerLocation.lat, passengerLocation.lon, startX, startY, mapZoom);
          return (
            <View
              style={[
                styles.passengerMarker,
                {
                  top: passengerPixel.y,
                  left: passengerPixel.x,
                },
              ]}
              pointerEvents="none"
            >
              <Ionicons name="person" size={18} color="#FFFFFF" />
            </View>
          );
        })()}

        {/* Localização do destino - marcador de destino */}
        {destinationLocation && (() => {
          const destPixel = getPixelOffset(destinationLocation.lat, destinationLocation.lon, startX, startY, mapZoom);
          return (
            <View
              style={[
                styles.destinationMarker,
                {
                  top: destPixel.y,
                  left: destPixel.x,
                },
              ]}
              pointerEvents="none"
            >
              <Ionicons name="flag" size={18} color="#FFFFFF" />
            </View>
          );
        })()}
      </Animated.View>
      {/* Overlay de busca de localização */}
      {isLocating && (
        <View style={styles.locatingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.locatingText}>Buscando sua localização</Text>
        </View>
      )}
    </View>
  );
});

TileMap.displayName = 'TileMap';

