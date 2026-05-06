import { Alert } from 'react-native';
import {
  ImagePickerResponse,
  MediaType,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { IMAGE_PICKER_DEFAULT_QUALITY, PERMISSIONS_SERVICE_LOG } from './constants';
import { requestCameraPermission, requestMediaLibraryPermission } from './androidPermissions';
import { showPermissionDeniedAlert } from './alerts';
import { openAppSettings } from './settings';
import { ImagePickerOptions } from './types';

function resolveAssetUri(response: ImagePickerResponse): string | null {
  if (response.didCancel) {
    return null;
  }

  if (response.errorCode) {
    console.error(`${PERMISSIONS_SERVICE_LOG} Erro no image picker:`, response.errorMessage);
    return null;
  }

  const firstAsset = response.assets?.[0];
  return firstAsset?.uri ?? null;
}

export async function pickImageFromGallery(options?: ImagePickerOptions): Promise<string | null> {
  try {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      await showPermissionDeniedAlert('galeria', openAppSettings);
      return null;
    }

    return new Promise((resolve) => {
      launchImageLibrary(
        {
          mediaType: 'photo' as MediaType,
          quality: options?.quality ?? IMAGE_PICKER_DEFAULT_QUALITY,
          selectionLimit: 1,
          includeBase64: false,
        },
        (response) => {
          const uri = resolveAssetUri(response);
          if (!uri && response.errorCode) {
            Alert.alert('Erro', 'Não foi possível acessar as imagens. Tente novamente.');
          }
          resolve(uri);
        }
      );
    });
  } catch (error) {
    console.error(`${PERMISSIONS_SERVICE_LOG} Erro ao abrir galeria:`, error);
    Alert.alert('Erro', 'Não foi possível acessar as imagens. Tente novamente.');
    return null;
  }
}

export async function captureImageFromCamera(options?: ImagePickerOptions): Promise<string | null> {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      await showPermissionDeniedAlert('câmera', openAppSettings);
      return null;
    }

    return new Promise((resolve) => {
      launchCamera(
        {
          mediaType: 'photo' as MediaType,
          quality: options?.quality ?? IMAGE_PICKER_DEFAULT_QUALITY,
          saveToPhotos: false,
        },
        (response) => {
          const uri = resolveAssetUri(response);
          if (!uri && response.errorCode) {
            Alert.alert('Erro', 'Não foi possível acessar a câmera. Tente novamente.');
          }
          resolve(uri);
        }
      );
    });
  } catch (error) {
    console.error(`${PERMISSIONS_SERVICE_LOG} Erro ao abrir câmera:`, error);
    Alert.alert('Erro', 'Não foi possível acessar a câmera. Tente novamente.');
    return null;
  }
}
