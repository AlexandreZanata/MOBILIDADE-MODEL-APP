export type BackgroundActor = 'driver' | 'passenger';

export type LastLocationPoint = {
  lat: number;
  lng: number;
  timestamp: number;
};

export type LastLocationRegistry = Record<BackgroundActor, LastLocationPoint | null>;
