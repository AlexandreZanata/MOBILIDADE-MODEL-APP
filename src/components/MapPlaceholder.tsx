import React from 'react';
import { TileMap } from './TileMap';

interface MapPlaceholderProps {
  showRoute?: boolean;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ showRoute = false }) => {
  return <TileMap showRoute={showRoute} />;
};

