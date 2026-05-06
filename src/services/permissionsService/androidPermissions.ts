import { PermissionsAndroid, Platform } from 'react-native';
import {
  ANDROID_API_LEVEL_READ_MEDIA_IMAGES,
  ANDROID_PERMISSIONS,
  CAMERA_PERMISSION_DIALOG,
  MEDIA_LIBRARY_PERMISSION_DIALOG,
  PERMISSIONS_SERVICE_LOG,
} from './constants';
import { AndroidPermissionType, PermissionStatus } from './types';

const isAndroid = Platform.OS === 'android';
const androidVersion = Number(Platform.Version) || 0;
type AndroidPermissionName =
  (typeof ANDROID_PERMISSIONS)[keyof typeof ANDROID_PERMISSIONS];

function getMediaLibraryPermissionName(): AndroidPermissionName {
  return androidVersion >= ANDROID_API_LEVEL_READ_MEDIA_IMAGES
    ? ANDROID_PERMISSIONS.mediaLibraryModern
    : ANDROID_PERMISSIONS.mediaLibraryLegacy;
}

async function requestAndroidPermission(permissionType: AndroidPermissionType): Promise<boolean> {
  if (!isAndroid) {
    return true;
  }

  try {
    if (permissionType === 'camera') {
      const granted = await PermissionsAndroid.request(
        ANDROID_PERMISSIONS.camera,
        CAMERA_PERMISSION_DIALOG
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    const granted = await PermissionsAndroid.request(
      getMediaLibraryPermissionName(),
      androidVersion >= ANDROID_API_LEVEL_READ_MEDIA_IMAGES
        ? MEDIA_LIBRARY_PERMISSION_DIALOG.modern
        : MEDIA_LIBRARY_PERMISSION_DIALOG.legacy
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error(`${PERMISSIONS_SERVICE_LOG} Erro ao solicitar permissão de ${permissionType}:`, error);
    return false;
  }
}

async function checkAndroidPermission(permissionType: AndroidPermissionType): Promise<boolean> {
  if (!isAndroid) {
    return true;
  }

  try {
    if (permissionType === 'camera') {
      return PermissionsAndroid.check(ANDROID_PERMISSIONS.camera);
    }

    return PermissionsAndroid.check(getMediaLibraryPermissionName());
  } catch (error) {
    console.warn(`${PERMISSIONS_SERVICE_LOG} Erro ao verificar permissão de ${permissionType}:`, error);
    return false;
  }
}

export async function requestCameraPermission(): Promise<boolean> {
  const hasPermission = await checkAndroidPermission('camera');
  if (hasPermission) {
    console.log(`${PERMISSIONS_SERVICE_LOG} Permissão de câmera já concedida`);
    return true;
  }

  const granted = await requestAndroidPermission('camera');
  if (!granted) {
    console.warn(`${PERMISSIONS_SERVICE_LOG} Permissão de câmera negada`);
  }
  return granted;
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  const hasPermission = await checkAndroidPermission('mediaLibrary');
  if (hasPermission) {
    console.log(`${PERMISSIONS_SERVICE_LOG} Permissão de galeria já concedida`);
    return true;
  }

  const granted = await requestAndroidPermission('mediaLibrary');
  if (!granted) {
    console.warn(`${PERMISSIONS_SERVICE_LOG} Permissão de galeria negada`);
  }
  return granted;
}

export async function checkImagePermissions(): Promise<PermissionStatus> {
  return {
    camera: await checkAndroidPermission('camera'),
    mediaLibrary: await checkAndroidPermission('mediaLibrary'),
  };
}

export async function isPermissionPermanentlyDenied(
  permissionType: AndroidPermissionType
): Promise<boolean> {
  const hasPermission = await checkAndroidPermission(permissionType);
  return !hasPermission;
}
