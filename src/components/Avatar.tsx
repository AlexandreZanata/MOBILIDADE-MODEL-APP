import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { typography } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface AvatarProps {
  /** URL da imagem do avatar */
  uri?: string;
  /** Nome do usuário (para gerar iniciais como fallback) */
  name?: string;
  /** Tamanho do avatar em pixels */
  size?: number;
  /** Estilo adicional para o container */
  style?: ViewStyle;
  /** Se está carregando os dados do usuário */
  isLoading?: boolean;
  /** Callback quando a imagem falha ao carregar */
  onImageError?: () => void;
  /** Se deve mostrar borda */
  showBorder?: boolean;
  /** Cor de fundo customizada para as iniciais */
  initialsBackgroundColor?: string;
  /** Cor do texto das iniciais */
  initialsTextColor?: string;
}

/**
 * Componente Avatar para exibir foto de perfil com fallback para iniciais
 */
export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 56,
  style,
  isLoading = false,
  onImageError,
  showBorder = true,
  initialsBackgroundColor,
  initialsTextColor,
}) => {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!uri);

  // Reset error state quando uri muda
  useEffect(() => {
    if (uri) {
      setImageError(false);
      setImageLoading(true);
      if (__DEV__) {
        console.log('[Avatar] URI recebida:', uri);
      }
    }
  }, [uri]);

  /**
   * Gera as iniciais do nome
   */
  const getInitials = (userName: string): string => {
    return userName
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Handler para erro ao carregar imagem
   */
  const handleImageError = (error?: any) => {
    if (__DEV__) {
      console.log('[Avatar] Erro ao carregar imagem:', uri, error?.nativeEvent);
    }
    setImageError(true);
    setImageLoading(false);
    onImageError?.();
  };

  /**
   * Handler quando a imagem carrega com sucesso
   */
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  // Helper para converter hex para rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const showImage = uri && !imageError;
  const bgColor = initialsBackgroundColor || hexToRgba(colors.primary, 0.15);
  const textColor = initialsTextColor || colors.primary;

  const styles = StyleSheet.create({
    avatar: {
      backgroundColor: showImage ? colors.card : bgColor,
      borderWidth: showBorder ? 2 : 0,
      borderColor: colors.border,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    initials: {
      ...typography.h2,
      color: textColor,
      fontWeight: '700',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: hexToRgba(colors.background, 0.5),
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      {showImage ? (
        <>
          <Image
            source={{ 
              uri,
              // Headers para autenticação se necessário
              headers: uri?.includes('profile-photos') ? {
                'Accept': 'image/*',
              } : undefined,
            }}
            style={styles.image}
            onError={(error) => handleImageError(error)}
            onLoad={handleImageLoad}
            resizeMode="cover"
          />
          {imageLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </>
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: size * 0.35,
            },
          ]}
        >
          {name ? getInitials(name) : '??'}
        </Text>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

export default Avatar;
