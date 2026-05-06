import { PermissionsAndroid } from 'react-native';

export const PERMISSIONS_SERVICE_LOG = '[PermissionsService]';

export const IMAGE_PICKER_DEFAULT_QUALITY = 0.8;
export const ANDROID_API_LEVEL_READ_MEDIA_IMAGES = 33;

export const MEDIA_LIBRARY_PERMISSION_DIALOG = {
  modern: {
    title: 'Permissão de Acesso às Imagens',
    message: 'O aplicativo precisa acessar suas imagens para selecionar fotos.',
    buttonNeutral: 'Perguntar depois',
    buttonNegative: 'Cancelar',
    buttonPositive: 'Permitir',
  },
  legacy: {
    title: 'Permissão de Acesso ao Armazenamento',
    message: 'O aplicativo precisa acessar seu armazenamento para selecionar fotos.',
    buttonNeutral: 'Perguntar depois',
    buttonNegative: 'Cancelar',
    buttonPositive: 'Permitir',
  },
} as const;

export const CAMERA_PERMISSION_DIALOG = {
  title: 'Permissão de Acesso à Câmera',
  message: 'O aplicativo precisa acessar sua câmera para tirar fotos.',
  buttonNeutral: 'Perguntar depois',
  buttonNegative: 'Cancelar',
  buttonPositive: 'Permitir',
} as const;

export const ANDROID_PERMISSIONS = {
  camera: PermissionsAndroid.PERMISSIONS.CAMERA,
  mediaLibraryModern: PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
  mediaLibraryLegacy: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
} as const;
