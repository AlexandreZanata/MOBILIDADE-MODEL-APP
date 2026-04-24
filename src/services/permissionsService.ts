/**
 * Serviço centralizado para gerenciar permissões do aplicativo
 * Reformulado para usar react-native-image-picker (mais leve que expo-image-picker)
 * Compatível com Android 10+, 11+, 13+
 */

import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType, PhotoQuality } from 'react-native-image-picker';

export interface PermissionStatus {
  camera: boolean;
  mediaLibrary: boolean;
}

export type PermissionResult = 'granted' | 'denied' | 'blocked' | 'unavailable';

/**
 * Solicita permissão de galeria (fotos e vídeos) no Android
 * No iOS, a permissão é solicitada automaticamente pelo react-native-image-picker
 */
async function requestMediaLibraryPermissionAndroid(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS solicita automaticamente
  }

  try {
    // Android 13+ (API 33+)
    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        {
          title: 'Permissão de Acesso às Imagens',
          message: 'O aplicativo precisa acessar suas imagens para selecionar fotos.',
          buttonNeutral: 'Perguntar depois',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Permitir',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    // Android < 13 (API < 33)
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'Permissão de Acesso ao Armazenamento',
        message: 'O aplicativo precisa acessar seu armazenamento para selecionar fotos.',
        buttonNeutral: 'Perguntar depois',
        buttonNegative: 'Cancelar',
        buttonPositive: 'Permitir',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('[PermissionsService] Erro ao solicitar permissão de galeria:', error);
    return false;
  }
}

/**
 * Solicita permissão de câmera no Android
 * No iOS, a permissão é solicitada automaticamente pelo react-native-image-picker
 */
async function requestCameraPermissionAndroid(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS solicita automaticamente
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Permissão de Acesso à Câmera',
        message: 'O aplicativo precisa acessar sua câmera para tirar fotos.',
        buttonNeutral: 'Perguntar depois',
        buttonNegative: 'Cancelar',
        buttonPositive: 'Permitir',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('[PermissionsService] Erro ao solicitar permissão de câmera:', error);
    return false;
  }
}

/**
 * Verifica se a permissão de galeria já foi concedida (Android)
 */
async function checkMediaLibraryPermissionAndroid(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS sempre retorna true (solicita quando necessário)
  }

  try {
    if (Platform.Version >= 33) {
      const status = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      return status;
    } else {
      const status = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      return status;
    }
  } catch (error) {
    console.warn('[PermissionsService] Erro ao verificar permissão de galeria:', error);
    return false;
  }
}

/**
 * Verifica se a permissão de câmera já foi concedida (Android)
 */
async function checkCameraPermissionAndroid(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS sempre retorna true (solicita quando necessário)
  }

  try {
    const status = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
    return status;
  } catch (error) {
    console.warn('[PermissionsService] Erro ao verificar permissão de câmera:', error);
    return false;
  }
}

/**
 * Solicita permissão de galeria (fotos e vídeos)
 * Implementação robusta com tratamento de erros e compatibilidade Android 10-13+
 * Retorna true se concedida, false se negada
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  try {
    // Verifica se já tem permissão
    const hasPermission = await checkMediaLibraryPermissionAndroid();
    if (hasPermission) {
      console.log('[PermissionsService] Permissão de galeria já concedida');
      return true;
    }

    // Solicita permissão
    console.log('[PermissionsService] Solicitando permissão de galeria...');
    const granted = await requestMediaLibraryPermissionAndroid();

    if (granted) {
      console.log('[PermissionsService] Permissão de galeria concedida');
      return true;
    }

    // Permissão negada
    console.warn('[PermissionsService] Permissão de galeria negada');
    return false;
  } catch (error) {
    console.error('[PermissionsService] Erro ao solicitar permissão de galeria:', error);
    return false;
  }
}

/**
 * Solicita permissão de câmera
 * Implementação robusta com tratamento de erros e compatibilidade Android 10-13+
 * Retorna true se concedida, false se negada
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    // Verifica se já tem permissão
    const hasPermission = await checkCameraPermissionAndroid();
    if (hasPermission) {
      console.log('[PermissionsService] Permissão de câmera já concedida');
      return true;
    }

    // Solicita permissão
    console.log('[PermissionsService] Solicitando permissão de câmera...');
    const granted = await requestCameraPermissionAndroid();

    if (granted) {
      console.log('[PermissionsService] Permissão de câmera concedida');
      return true;
    }

    // Permissão negada
    console.warn('[PermissionsService] Permissão de câmera negada');
    return false;
  } catch (error) {
    console.error('[PermissionsService] Erro ao solicitar permissão de câmera:', error);
    return false;
  }
}

/**
 * Verifica se as permissões já foram concedidas (sem solicitar)
 * Útil para verificar estado antes de usar funcionalidades
 */
export async function checkImagePermissions(): Promise<PermissionStatus> {
  const status: PermissionStatus = {
    camera: false,
    mediaLibrary: false,
  };

  try {
    status.camera = await checkCameraPermissionAndroid();
    status.mediaLibrary = await checkMediaLibraryPermissionAndroid();
    return status;
  } catch (error) {
    console.error('[PermissionsService] Erro ao verificar permissões:', error);
    return status;
  }
}

/**
 * Verifica se a permissão foi negada permanentemente (usuário marcou "não perguntar novamente")
 * Retorna true se a permissão foi bloqueada permanentemente
 */
export async function isPermissionPermanentlyDenied(
  permissionType: 'camera' | 'mediaLibrary'
): Promise<boolean> {
  try {
    if (Platform.OS !== 'android') {
      return false; // iOS não tem esse conceito da mesma forma
    }

    let hasPermission: boolean;
    if (permissionType === 'camera') {
      hasPermission = await checkCameraPermissionAndroid();
    } else {
      hasPermission = await checkMediaLibraryPermissionAndroid();
    }

    // Se não tem permissão e já tentamos solicitar, provavelmente foi negada permanentemente
    // No Android, isso é difícil de detectar sem tentar solicitar novamente
    // Vamos assumir que se não tem permissão, pode ter sido negada permanentemente
    return !hasPermission;
  } catch (error) {
    console.error('[PermissionsService] Erro ao verificar se permissão foi negada permanentemente:', error);
    return false;
  }
}

/**
 * Abre as configurações do aplicativo
 */
export async function openAppSettings(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Linking.openSettings();
    } else if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    }
  } catch (error) {
    console.error('[PermissionsService] Erro ao abrir configurações:', error);
  }
}

/**
 * Exibe alerta informando sobre permissão negada
 * Oferece opção de abrir configurações
 * Versão melhorada com tratamento de permissão negada permanentemente
 */
export async function showPermissionDeniedAlert(
  permissionType: 'câmera' | 'galeria',
  onOpenSettings?: () => void
): Promise<void> {
  const isPermanentlyDenied = await isPermissionPermanentlyDenied(
    permissionType === 'câmera' ? 'camera' : 'mediaLibrary'
  );

  const message = isPermanentlyDenied
    ? `Para ${permissionType === 'câmera' ? 'tirar fotos' : 'selecionar fotos'}, precisamos de acesso à sua ${permissionType}. A permissão foi negada anteriormente. Por favor, permita o acesso nas configurações do aplicativo.`
    : `Para ${permissionType === 'câmera' ? 'tirar fotos' : 'selecionar fotos'}, precisamos de acesso à sua ${permissionType}. Por favor, permita o acesso.`;

  Alert.alert(
    'Permissão necessária',
    message,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: isPermanentlyDenied ? 'Abrir Configurações' : 'Permitir',
        onPress: async () => {
          if (isPermanentlyDenied || onOpenSettings) {
            if (onOpenSettings) {
              onOpenSettings();
            } else {
              await openAppSettings();
            }
          }
        },
      },
    ]
  );
}

/**
 * Abre a galeria para selecionar uma imagem
 * Retorna a URI da imagem selecionada ou null se cancelado
 * Nota: allowsEditing e aspect não são suportados diretamente pelo react-native-image-picker
 * O crop/editing deve ser feito em outro componente se necessário
 */
export async function pickImageFromGallery(options?: {
  quality?: PhotoQuality;
}): Promise<string | null> {
  try {
    // Solicita permissão primeiro
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      await showPermissionDeniedAlert('galeria', openAppSettings);
      return null;
    }

    return new Promise((resolve) => {
      launchImageLibrary(
        {
          mediaType: 'photo' as MediaType,
          quality: options?.quality || 0.8 as PhotoQuality,
          selectionLimit: 1,
          includeBase64: false,
        },
        (response: ImagePickerResponse) => {
          if (response.didCancel) {
            resolve(null);
          } else if (response.errorCode) {
            console.error('[PermissionsService] Erro ao selecionar imagem:', response.errorMessage);
            Alert.alert('Erro', 'Não foi possível acessar as imagens. Tente novamente.');
            resolve(null);
          } else if (response.assets && response.assets[0]) {
            resolve(response.assets[0].uri || null);
          } else {
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('[PermissionsService] Erro ao abrir galeria:', error);
    Alert.alert('Erro', 'Não foi possível acessar as imagens. Tente novamente.');
    return null;
  }
}

/**
 * Abre a câmera para capturar uma foto
 * Retorna a URI da foto capturada ou null se cancelado
 */
export async function captureImageFromCamera(options?: {
  quality?: PhotoQuality;
}): Promise<string | null> {
  try {
    // Solicita permissão primeiro
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      await showPermissionDeniedAlert('câmera', openAppSettings);
      return null;
    }

    return new Promise((resolve) => {
      launchCamera(
        {
          mediaType: 'photo' as MediaType,
          quality: options?.quality || 0.8 as PhotoQuality,
          saveToPhotos: false,
        },
        (response: ImagePickerResponse) => {
          if (response.didCancel) {
            resolve(null);
          } else if (response.errorCode) {
            console.error('[PermissionsService] Erro ao capturar foto:', response.errorMessage);
            Alert.alert('Erro', 'Não foi possível acessar a câmera. Tente novamente.');
            resolve(null);
          } else if (response.assets && response.assets[0]) {
            resolve(response.assets[0].uri || null);
          } else {
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('[PermissionsService] Erro ao abrir câmera:', error);
    Alert.alert('Erro', 'Não foi possível acessar a câmera. Tente novamente.');
    return null;
  }
}
