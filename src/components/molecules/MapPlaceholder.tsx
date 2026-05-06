import React, { useState } from 'react';
import { TileMap } from './TileMap';

interface MapPlaceholderProps {
  showRoute?: boolean;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ showRoute = false }) => {
  const [zoom, setZoom] = useState(14);
  return <TileMap showRoute={showRoute} zoom={zoom} onZoom={setZoom} />;
};

