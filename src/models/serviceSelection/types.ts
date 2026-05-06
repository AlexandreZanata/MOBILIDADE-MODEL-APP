import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

export interface ServiceSelectionLocation {
  lat: number;
  lon: number;
}

export interface ServiceSelectionRouteParams {
  userLocation?: ServiceSelectionLocation;
}

export type ServiceSelectionScreenNavigationProp = StackNavigationProp<Record<string, object | undefined>>;

export interface ServiceSelectionScreenRoute {
  params?: ServiceSelectionRouteParams;
}

export interface ServiceOption {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  price: string;
  time: string;
}
