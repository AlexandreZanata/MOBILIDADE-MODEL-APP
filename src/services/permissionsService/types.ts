import { PhotoQuality } from 'react-native-image-picker';

export interface PermissionStatus {
  camera: boolean;
  mediaLibrary: boolean;
}

export type AndroidPermissionType = 'camera' | 'mediaLibrary';

export type UiPermissionType = 'câmera' | 'galeria';

export interface ImagePickerOptions {
  quality?: PhotoQuality;
}
