import { StyleSheet } from 'react-native';

interface TileMapStyleParams {
  colors: {
    background: string;
    card: string;
    shadow: string;
    primary: string;
    border?: string;
    textSecondary?: string;
  };
  mapWidth: number;
  mapHeight: number;
}

export function createTileMapStyles({ colors, mapWidth, mapHeight }: TileMapStyleParams) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
    mapContainer: { width: mapWidth, height: mapHeight, position: 'relative' },
    tileRow: { flexDirection: 'row' },
    tile: { width: 256, height: 256 },
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
      backgroundColor: '#1E3A8A',
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
      backgroundColor: '#1B5E20',
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
}
