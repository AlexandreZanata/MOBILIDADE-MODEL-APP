import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType, PhotoQuality } from 'react-native-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography, borders, shadows } from '@/theme';
import { apiService } from '@/services/api';
import { requestMediaLibraryPermission, requestCameraPermission, openAppSettings } from '@/services/permissionsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CROP_SIZE = SCREEN_WIDTH * 0.8;

interface ProfilePhotoPickerProps {
  /** URL atual da foto de perfil */
  currentPhotoUrl?: string;
  /** Nome do usuário (para exibir iniciais como fallback) */
  userName?: string;
  /** Tipo de usuário: 'driver' ou 'passenger' */
  userType: 'driver' | 'passenger';
  /** Tamanho do avatar em pixels */
  size?: number;
  /** Callback após upload bem-sucedido */
  onPhotoUpdated?: () => void;
  /** Se está carregando */
  isLoading?: boolean;
  /** Se permite edição */
  editable?: boolean;
  /** Tamanho máximo do arquivo em MB */
  maxFileSizeMB?: number;
}

/**
 * Componente simplificado para seleção e upload de foto de perfil
 * Usa react-native-image-picker (mais leve e nativo)
 */
export const ProfilePhotoPicker: React.FC<ProfilePhotoPickerProps> = ({
  currentPhotoUrl,
  userName = 'Usuário',
  userType,
  size = 120,
  onPhotoUpdated,
  isLoading = false,
  editable = true,
  maxFileSizeMB = 5,
}) => {
  const { colors } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  const isProcessing = isUploading || isRemoving || isLoading;

  /**
   * Gera as iniciais do nome do usuário
   */
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Verifica se o arquivo está dentro do tamanho permitido
   */
  const validateFileSize = async (uri: string): Promise<boolean> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && typeof fileInfo.size === 'number') {
        const sizeInMb = fileInfo.size / (1024 * 1024);
        if (sizeInMb > maxFileSizeMB) {
          Alert.alert(
            'Arquivo muito grande',
            `A foto deve ter no máximo ${maxFileSizeMB}MB. Sua foto tem ${sizeInMb.toFixed(1)}MB.`
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      console.warn('[ProfilePhotoPicker] Não foi possível verificar o tamanho da foto:', error);
      return true;
    }
  };

  /**
   * Abre a galeria para selecionar uma foto
   */
  const pickFromGallery = async () => {
    try {
      // Solicita permissão de acesso à galeria
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar suas fotos. Por favor, permita o acesso nas configurações do aplicativo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir Configurações',
              onPress: async () => {
                await openAppSettings();
              },
            },
          ]
        );
        return;
      }

      launchImageLibrary(
        {
          mediaType: 'photo' as MediaType,
          quality: 0.8 as PhotoQuality,
          selectionLimit: 1,
          includeBase64: false,
        },
        (response: ImagePickerResponse) => {
          if (response.didCancel) {
            return;
          }
          if (response.errorCode) {
            console.error('[ProfilePhotoPicker] Erro ao selecionar foto:', response.errorMessage);
            Alert.alert('Erro', 'Não foi possível acessar as imagens. Tente novamente.');
            return;
          }
          if (response.assets && response.assets[0] && response.assets[0].uri) {
            processSelectedImage(response.assets[0].uri);
          }
        }
      );
    } catch (error) {
      console.error('[ProfilePhotoPicker] Erro ao selecionar foto:', error);
      Alert.alert('Erro', 'Não foi possível acessar as imagens. Tente novamente.');
    }
  };

  /**
   * Abre a câmera para capturar uma foto
   */
  const captureFromCamera = async () => {
    try {
      // Solicita permissão de acesso à câmera
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar sua câmera. Por favor, permita o acesso nas configurações do aplicativo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir Configurações',
              onPress: async () => {
                await openAppSettings();
              },
            },
          ]
        );
        return;
      }

      launchCamera(
        {
          mediaType: 'photo' as MediaType,
          quality: 0.8 as PhotoQuality,
          saveToPhotos: false,
        },
        (response: ImagePickerResponse) => {
          if (response.didCancel) {
            return;
          }
          if (response.errorCode) {
            console.error('[ProfilePhotoPicker] Erro ao capturar foto:', response.errorMessage);
            Alert.alert('Erro', 'Não foi possível acessar a câmera. Tente novamente.');
            return;
          }
          if (response.assets && response.assets[0] && response.assets[0].uri) {
            processSelectedImage(response.assets[0].uri);
          }
        }
      );
    } catch (error) {
      console.error('[ProfilePhotoPicker] Erro ao capturar foto:', error);
      Alert.alert('Erro', 'Não foi possível acessar a câmera. Tente novamente.');
    }
  };

  /**
   * Processa a imagem selecionada e faz o preview
   */
  const processSelectedImage = async (uri: string) => {
    const isValidSize = await validateFileSize(uri);
    if (!isValidSize) return;

    setPreviewUri(uri);
    setPreviewModalVisible(true);
  };

  /**
   * Confirma o upload da foto
   */
  const confirmUpload = async () => {
    if (!previewUri) return;

    setPreviewModalVisible(false);
    setIsUploading(true);

    try {
      const response = await apiService.uploadProfilePhoto(previewUri, userType);

      if (response.success) {
        setImageLoadError(false);
        Alert.alert('Sucesso', response.message || 'Foto de perfil atualizada com sucesso!');
        onPhotoUpdated?.();
      } else {
        Alert.alert(
          'Erro',
          response.error || 'Não foi possível atualizar a foto de perfil. Tente novamente.'
        );
      }
    } catch (error) {
      console.error('[ProfilePhotoPicker] Erro ao fazer upload:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao enviar a foto de perfil. Tente novamente.');
    } finally {
      setIsUploading(false);
      setPreviewUri(null);
    }
  };

  /**
   * Cancela o preview e fecha o modal
   */
  const cancelPreview = () => {
    setPreviewModalVisible(false);
    setPreviewUri(null);
  };

  /**
   * Remove a foto de perfil atual
   */
  const removePhoto = async () => {
    setIsRemoving(true);

    try {
      const response = await apiService.deleteProfilePhoto(userType);

      if (response.success) {
        setImageLoadError(false);
        Alert.alert('Foto removida', response.message || 'Foto de perfil removida com sucesso.');
        onPhotoUpdated?.();
      } else {
        Alert.alert(
          'Erro',
          response.error || 'Não foi possível remover a foto de perfil. Tente novamente.'
        );
      }
    } catch (error) {
      console.error('[ProfilePhotoPicker] Erro ao remover foto:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao remover a foto. Tente novamente.');
    } finally {
      setIsRemoving(false);
    }
  };

  /**
   * Exibe confirmação antes de remover
   */
  const confirmRemove = () => {
    if (isProcessing) return;

    Alert.alert('Remover foto', 'Deseja remover sua foto de perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: removePhoto,
      },
    ]);
  };

  /**
   * Exibe menu de opções para editar a foto
   */
  const showOptionsMenu = () => {
    if (isProcessing || !editable) return;

    Alert.alert('Foto de Perfil', 'Escolha uma opção:', [
      {
        text: 'Escolher da Galeria',
        onPress: pickFromGallery,
      },
      {
        text: 'Tirar Foto',
        onPress: captureFromCamera,
      },
      ...(currentPhotoUrl && !imageLoadError
        ? [
            {
              text: 'Remover Foto',
              style: 'destructive' as const,
              onPress: confirmRemove,
            },
          ]
        : []),
      {
        text: 'Cancelar',
        style: 'cancel' as const,
      },
    ]);
  };

  // Helper para converter hex para rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarWrapper: {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 4,
      borderColor: colors.card,
      overflow: 'hidden',
      backgroundColor: colors.backgroundSecondary,
      ...shadows.large,
      shadowColor: colors.shadow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    initialsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba(colors.primary, 0.15),
      width: '100%',
      height: '100%',
    },
    initialsText: {
      ...typography.h1,
      fontSize: size * 0.35,
      color: colors.primary,
      fontWeight: '700',
    },
    editButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: size * 0.33,
      height: size * 0.33,
      minWidth: 36,
      minHeight: 36,
      borderRadius: size * 0.165,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.card,
      ...shadows.medium,
      shadowColor: colors.shadow,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: hexToRgba(colors.background, 0.7),
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: size / 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalContent: {
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalTitle: {
      ...typography.h2,
      color: '#FFFFFF',
      marginBottom: spacing.lg,
    },
    previewContainer: {
      width: CROP_SIZE,
      height: CROP_SIZE,
      borderRadius: CROP_SIZE / 2,
      overflow: 'hidden',
      borderWidth: 4,
      borderColor: colors.primary,
      ...shadows.large,
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    previewHint: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    modalButtons: {
      flexDirection: 'row',
      marginTop: spacing.xl,
      gap: spacing.md,
    },
    modalButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borders.radiusMedium,
      minWidth: 120,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: hexToRgba(colors.textSecondary, 0.2),
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      ...typography.body,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: '#FFFFFF',
    },
    confirmButtonText: {
      color: '#FFFFFF',
    },
  });

  const showPhoto = currentPhotoUrl && !imageLoadError;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={editable ? 0.8 : 1}
        onPress={showOptionsMenu}
        disabled={isProcessing || !editable}
      >
        <View style={styles.avatarWrapper}>
          {showPhoto ? (
            <Image
              source={{ uri: currentPhotoUrl }}
              style={styles.avatarImage}
              onError={() => {
                setImageLoadError(true);
              }}
              onLoad={() => {
                setImageLoadError(false);
              }}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>{getInitials(userName)}</Text>
            </View>
          )}

          {isProcessing && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>

        {editable && (
          <View style={styles.editButton}>
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="camera" size={Math.max(16, size * 0.14)} color="#FFFFFF" />
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Modal de Preview */}
      <Modal
        visible={previewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelPreview}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Prévia da Foto</Text>

            <View style={styles.previewContainer}>
              {previewUri && (
                <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
              )}
            </View>

            <Text style={styles.previewHint}>
              Esta será sua foto de perfil visível para outros usuários
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelPreview}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmUpload}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.confirmButtonText]}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfilePhotoPicker;
