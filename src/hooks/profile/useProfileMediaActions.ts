import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '@/services/api';
import { openAppSettings } from '@/services/permissionsService';
import { profileService } from '@/services/profile/profileService';
import { tp } from '@/i18n/profile';
import { ProfileUserType } from '@/models/profile/types';

interface UseProfileMediaActionsParams {
  ensureToken(): Promise<boolean>;
  refreshUserData(force?: boolean): Promise<void>;
  userTypeForUpload: ProfileUserType;
  profilePhotoUserId: string | undefined;
  onProfilePhotoCached(url: string): void;
  onAfterCnhUpload(): Promise<void>;
}

export function useProfileMediaActions({
  ensureToken,
  refreshUserData,
  userTypeForUpload,
  profilePhotoUserId,
  onProfilePhotoCached,
  onAfterCnhUpload,
}: UseProfileMediaActionsParams) {
  const [isUploadingCNH, setIsUploadingCNH] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const processPickerResult = useCallback(
    async (
      result: ImagePicker.ImagePickerResult,
      onFile: (fileUri: string) => Promise<void>
    ) => {
      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;
      try {
        await onFile(uri);
      } catch {
        Alert.alert(tp('genericErrorTitle'), tp('genericErrorDescription'));
      }
    },
    []
  );

  const requestUploadSource = useCallback(
    (onFile: (fileUri: string) => Promise<void>) => {
      Alert.alert(tp('chooseImageTitle'), tp('chooseImageDescription'), [
        {
          text: tp('gallery'),
          onPress: () => {
            void (async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(tp('permissionTitle'), tp('mediaPermissionDescription'), [
                  { text: tp('cancel'), style: 'cancel' },
                  { text: tp('openSettings'), onPress: () => openAppSettings() },
                ]);
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              await processPickerResult(result, onFile);
            })();
          },
        },
        {
          text: tp('camera'),
          onPress: () => {
            void (async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(tp('permissionTitle'), tp('cameraPermissionDescription'), [
                  { text: tp('cancel'), style: 'cancel' },
                  { text: tp('openSettings'), onPress: () => openAppSettings() },
                ]);
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              await processPickerResult(result, onFile);
            })();
          },
        },
        { text: tp('cancel'), style: 'cancel' },
      ]);
    },
    [processPickerResult]
  );

  const uploadCnh = useCallback(
    async (fileUri: string) => {
      setIsUploadingCNH(true);
      try {
        await ensureToken();
        const result = await profileService.uploadDocumentCnh(fileUri);
        if (!result.success) {
          Alert.alert(tp('genericErrorTitle'), result.error?.message || tp('genericErrorDescription'));
          return;
        }
        Alert.alert(tp('uploadSuccessTitle'), tp('uploadCnhSuccessDescription'));
        await onAfterCnhUpload();
      } finally {
        setIsUploadingCNH(false);
      }
    },
    [ensureToken, onAfterCnhUpload]
  );

  const handlePhotoUpload = useCallback(() => {
    requestUploadSource(async (fileUri) => {
      setIsUploadingPhoto(true);
      try {
        await ensureToken();
        const response = await profileService.uploadProfilePhoto(fileUri, userTypeForUpload);
        if (!response.success) {
          Alert.alert(tp('genericErrorTitle'), response.error?.message || tp('genericErrorDescription'));
          return;
        }
        await refreshUserData(true);
        if (profilePhotoUserId) {
          onProfilePhotoCached(`${API_BASE_URL}/profile-photos/${profilePhotoUserId}?t=${Date.now()}`);
        }
      } finally {
        setIsUploadingPhoto(false);
      }
    });
  }, [ensureToken, onProfilePhotoCached, profilePhotoUserId, refreshUserData, requestUploadSource, userTypeForUpload]);

  const handleUploadCnh = useCallback(() => requestUploadSource(uploadCnh), [requestUploadSource, uploadCnh]);

  return {
    isUploadingCNH,
    isUploadingPhoto,
    handlePhotoUpload,
    handleUploadCnh,
  };
}
