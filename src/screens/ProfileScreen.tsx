import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType, PhotoQuality } from 'react-native-image-picker';
import { Card } from '@/components/atoms/Card';
import { ProfilePhotoPicker } from '@/components/organisms/ProfilePhotoPicker';
import { spacing, typography, borders, shadows } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { apiService, API_BASE_URL } from '@/services/api';
import { StarRatingBadge } from '@/components/atoms/StarRating';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { getProfileImageUrl } from '@/services/profileImageCache';
import { requestMediaLibraryPermission, requestCameraPermission, openAppSettings } from '@/services/permissionsService';

interface ProfileScreenProps {
  navigation: any;
}

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: number;
  showChevron?: boolean;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { logout, user, refreshUserData, isLoading: authLoading } = useAuth();
  const ensureToken = useTokenRefresh();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingData] = useState(false);
  const [isUploadingCNH, setIsUploadingCNH] = useState(false);
  const [userRating, setUserRating] = useState<{ currentRating: string; totalRatings: number } | null>(null);
  const [isLoadingRating, setIsLoadingRating] = useState(false);
  const [cachedPhotoUrl, setCachedPhotoUrl] = useState<string | undefined>(undefined);

  // Verifica se o usuário é motorista
  const isDriver = (): boolean => {
    return user?.type === 'driver' || user?.roles?.includes('driver') || user?.type_label === 'Motorista' || !!user?.cnhNumber;
  };

  // Busca o rating do usuário
  const fetchUserRating = async () => {
    try {
      setIsLoadingRating(true);
      const response = isDriver() 
        ? await apiService.getDriverRating()
        : await apiService.getPassengerRating();
      
      if (__DEV__) {
        console.log('[Profile] Rating response:', response);
      }
      
      if (response.success && response.data) {
        setUserRating({
          currentRating: response.data.currentRating || '0',
          totalRatings: response.data.totalRatings || 0,
        });
      }
    } catch (error) {
      console.error('[Profile] Erro ao buscar rating:', error);
    } finally {
      setIsLoadingRating(false);
    }
  };

  // Atualiza dados do usuário quando a tela é focada (só se cache expirou)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        // Não força atualização, usa cache se ainda válido
        refreshUserData();
        // Busca o rating do usuário
        fetchUserRating();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Função para obter nome do usuário
  const getUserName = (): string => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuário';
  };

  // Função para obter email do usuário
  const getUserEmail = (): string => {
    return user?.email || 'Não informado';
  };

  // Função para obter CPF formatado
  const getUserCPF = (): string => {
    return user?.cpf || 'Não informado';
  };

  // Função para obter telefone formatado
  const getUserPhone = (): string => {
    return user?.phone || 'Não informado';
  };

  // Função para obter data de nascimento formatada
  const getUserBirthDate = (): string => {
    if (!user?.birthDate) return 'Não informado';
    try {
      const date = new Date(user.birthDate);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return user.birthDate;
    }
  };


// Função para obter tipo do usuário formatado
  const getUserType = (): string => {
    if (user?.type_label) return user.type_label;
    if (user?.type) {
      const types: Record<string, string> = {
        admin: 'Administrador',
        funcionario: 'Funcionário',
        motorista: 'Motorista',
        passageiro: 'Passageiro',
      };
      return types[user.type] || user.type;
    }
    return 'Usuário';
  };

  // URL da foto de perfil - busca da API como antes, mas com cache local da imagem
  const getProfilePhotoUrl = (): string | undefined => {
    // Verifica se o usuário tem foto cadastrada
    const hasPhoto = Boolean(
      (user as any)?.photoUrl ||
      (user as any)?.profilePhotoUrl ||
      (user as any)?.profile_photo_url ||
      (user as any)?.photo ||
      (user as any)?.photo_url ||
      (user as any)?.avatar ||
      (user as any)?.avatarUrl ||
      (user as any)?.avatar_url ||
      (user as any)?.picture ||
      (user as any)?.picture_url
    );

    // Se não tem foto cadastrada, retorna undefined
    if (!hasPhoto) {
      return undefined;
    }

    // Obtém o userId para usar na rota pública
    const profileId =
      (user as any)?.userId ||
      (user as any)?.id ||
      (user as any)?.user_id;

    if (!profileId) {
      return undefined;
    }

    // Cache buster para forçar recarregamento quando a foto muda
    const cacheBuster =
      (user as any)?.updatedAt ||
      (user as any)?.updated_at ||
      Date.now();

    // Usa sempre a rota pública para servir a foto (como estava antes)
    const apiUrl = `${API_BASE_URL}/profile-photos/${profileId}?t=${cacheBuster}`;
    
    // Retorna a URL cacheada se disponível, senão retorna a URL da API
    // O cache será atualizado em background pelo useEffect
    return cachedPhotoUrl || apiUrl;
  };

  // Carrega a imagem do cache quando o usuário ou foto mudar
  useEffect(() => {
    const loadCachedImage = async () => {
      // Verifica se o usuário tem foto cadastrada
      const hasPhoto = Boolean(
        (user as any)?.photoUrl ||
        (user as any)?.profilePhotoUrl ||
        (user as any)?.profile_photo_url ||
        (user as any)?.photo ||
        (user as any)?.photo_url ||
        (user as any)?.avatar ||
        (user as any)?.avatarUrl ||
        (user as any)?.avatar_url ||
        (user as any)?.picture ||
        (user as any)?.picture_url
      );

      if (!hasPhoto) {
        setCachedPhotoUrl(undefined);
        return;
      }

      const profileId =
        (user as any)?.userId ||
        (user as any)?.id ||
        (user as any)?.user_id;

      if (!profileId) {
        setCachedPhotoUrl(undefined);
        return;
      }

      // Cache buster para forçar recarregamento quando a foto muda
      const cacheBuster =
        (user as any)?.updatedAt ||
        (user as any)?.updated_at ||
        Date.now();

      // URL da API (como estava antes)
      const apiUrl = `${API_BASE_URL}/profile-photos/${profileId}?t=${cacheBuster}`;

      try {
        // Obtém a URL do cache (local se disponível, senão da API)
        // Se não estiver em cache, baixa em background
        const cachedUrl = await getProfileImageUrl(profileId, apiUrl);
        setCachedPhotoUrl(cachedUrl);
      } catch (error) {
        console.warn('[Profile] Erro ao carregar imagem do cache:', error);
        // Em caso de erro, usa a URL da API diretamente
        setCachedPhotoUrl(apiUrl);
      }
    };

    if (user) {
      loadCachedImage();
    }
  }, [user, (user as any)?.updatedAt, (user as any)?.updated_at]);

  // Função para obter número da CNH formatado
  const getCNHNumber = (): string => {
    return user?.cnhNumber || 'Não informado';
  };

  // Obtém o tipo de usuário para o ProfilePhotoPicker
  const getUserTypeForPicker = (): 'driver' | 'passenger' => {
    return isDriver() ? 'driver' : 'passenger';
  };

  // Função para obter categoria da CNH
  const getCNHCategory = (): string => {
    return user?.cnhCategory || 'Não informado';
  };

  // Função para obter data de validade da CNH formatada
  const getCNHExpirationDate = (): string => {
    if (!user?.cnhExpirationDate) return 'Não informado';
    try {
      const date = new Date(user.cnhExpirationDate);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return user.cnhExpirationDate;
    }
  };

  // Função para obter status do motorista
  const getDriverStatus = (): string => {
    if (!user?.status) return 'Não informado';
    const statusMap: Record<string, string> = {
      ONBOARDING: 'Cadastro em andamento',
      AWAITING_CNH: 'Aguardando CNH',
      CNH_REVIEW: 'CNH em análise',
      AWAITING_VEHICLE: 'Aguardando veículo',
      VEHICLE_REVIEW: 'Veículo em análise',
      ACTIVE: 'Ativo',
      INACTIVE: 'Inativo',
      SUSPENDED: 'Suspenso',
    };
    return statusMap[user.status] || user.status;
  };

  // Callback quando a foto de perfil é atualizada
  const handleProfilePhotoUpdated = async () => {
    await refreshUserData(true);
  };

  // Função para fazer upload da CNH
  const handleUploadCNH = async () => {
    try {
      // Mostra opções para escolher foto ou tirar foto
      Alert.alert(
        'Enviar CNH',
        'Escolha uma opção:',
        [
          {
            text: 'Galeria',
            onPress: async () => {
              const hasPermission = await requestMediaLibraryPermission();
              if (!hasPermission) {
                Alert.alert(
                  'Permissão necessária',
                  'Precisamos de permissão para acessar suas fotos para enviar a CNH.',
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
                    console.error('[ProfileScreen] Erro ao selecionar imagem:', response.errorMessage);
                    Alert.alert('Erro', 'Não foi possível acessar as imagens. Tente novamente.');
                    return;
                  }
                  if (response.assets && response.assets[0] && response.assets[0].uri) {
                    uploadCNHFile(response.assets[0].uri);
                  }
                }
              );
            },
          },
          {
            text: 'Câmera',
            onPress: async () => {
              const hasPermission = await requestCameraPermission();
              if (!hasPermission) {
                Alert.alert(
                  'Permissão necessária',
                  'Precisamos de permissão para acessar sua câmera.',
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
                    console.error('[ProfileScreen] Erro ao capturar foto:', response.errorMessage);
                    Alert.alert('Erro', 'Não foi possível acessar a câmera. Tente novamente.');
                    return;
                  }
                  if (response.assets && response.assets[0] && response.assets[0].uri) {
                    uploadCNHFile(response.assets[0].uri);
                  }
                }
              );
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível acessar as imagens. Tente novamente.');
    }
  };

  // Função para fazer upload do arquivo da CNH
  const uploadCNHFile = async (fileUri: string) => {
    // Garante token válido antes da ação
    await ensureToken();

    setIsUploadingCNH(true);
    try {
      const response = await apiService.uploadDriverDocument('CNH', fileUri);

      if (response.success) {
        Alert.alert(
          'Sucesso',
          'CNH enviada com sucesso! Aguarde a análise.',
          [
            {
              text: 'OK',
              onPress: async () => {
                // Atualiza os dados do usuário após upload
                await refreshUserData(true);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Erro',
          response.error || 'Não foi possível enviar a CNH. Tente novamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao fazer upload da CNH:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao enviar a CNH. Tente novamente.');
    } finally {
      setIsUploadingCNH(false);
    }
  };

  // Função para atualizar dados manualmente (força atualização)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshUserData(), // Atualiza dados do usuário
        fetchUserRating(), // Atualiza o rating
      ]);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: '1',
      title: 'Métodos de Pagamento',
      icon: 'card-outline',
      onPress: () => {},
      showChevron: true,
    },
    {
      id: '2',
      title: 'Histórico',
      icon: 'time-outline',
      onPress: () => navigation.navigate('History'),
      showChevron: true,
    },
    {
      id: '3',
      title: 'Endereços Salvos',
      icon: 'location-outline',
      onPress: () => {},
      showChevron: true,
    },
    {
      id: '4',
      title: 'Cupons e Descontos',
      icon: 'pricetag-outline',
      onPress: () => {},
      badge: 3,
      showChevron: true,
    },
    {
      id: '5',
      title: 'Ajuda',
      icon: 'help-circle-outline',
      onPress: () => {},
      showChevron: true,
    },
    {
      id: '6',
      title: 'Sobre',
      icon: 'information-circle-outline',
      onPress: () => {},
      showChevron: true,
    },
    {
      id: '7',
      title: 'Sair',
      icon: 'log-out-outline',
      onPress: handleLogout,
      showChevron: false,
    },
  ];

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 0,
      paddingTop: 0,
    },
    headerContainer: {
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl,
      paddingHorizontal: spacing.md,
      minHeight: 200,
      backgroundColor: colors.background,
    },
    headerContent: {
      backgroundColor: 'transparent',
    },
    // Seção de perfil melhorada
    profileSection: {
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    avatarContainer: {
      marginBottom: spacing.md,
    },
    userInfo: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    userNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs / 2,
    },
    userRatingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
      paddingVertical: spacing.xs,
    },
    totalRatingsText: {
      ...typography.caption,
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
    },
    userName: {
      ...typography.h1,
      fontSize: 26,
      color: colors.textPrimary,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: hexToRgba(colors.secondary, 0.15),
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: hexToRgba(colors.secondary, 0.2),
    },
    ratingText: {
      ...typography.caption,
      fontSize: 13,
      fontWeight: '700',
      color: colors.secondary,
    },
    // Container unificado de informações
    infoContainer: {
      paddingHorizontal: spacing.md,
      marginTop: -spacing.sm,
      marginBottom: spacing.md,
      paddingBottom: 0,
    },
    infoCard: {
      marginBottom: 0,
    },
    infoCardHeader: {
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    infoCardTitle: {
      ...typography.h2,
      fontSize: 15,
      color: colors.textPrimary,
      fontWeight: '700',
      marginBottom: 4,
    },
    infoCardSubtitle: {
      ...typography.caption,
      fontSize: 11,
      color: colors.textSecondary,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    infoLabel: {
      ...typography.body,
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    infoValue: {
      ...typography.body,
      fontSize: 13,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    // Menu melhorado
    menuContainer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: 0,
      marginBottom: 0,
    },
    sectionTitle: {
      ...typography.h2,
      fontSize: 17,
      color: colors.textPrimary,
      fontWeight: '700',
      marginBottom: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    menuCard: {
      marginBottom: 0,
    },
    menuItemsWrapper: {
      marginBottom: spacing.lg,
      padding: 0,
      paddingBottom: 0,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: 52,
    },
    menuItemFirst: {
      // Garante que o primeiro item tenha padding no topo
      paddingTop: spacing.sm,
    },
    menuItemLast: {
      paddingBottom: spacing.md,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    menuItemIcon: {
      width: 40,
      height: 40,
      borderRadius: borders.radiusMedium,
      backgroundColor: hexToRgba(colors.primary, 0.12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuItemIconLogout: {
      backgroundColor: hexToRgba(colors.status.error, 0.12),
    },
    menuItemText: {
      ...typography.body,
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '500',
    },
    menuItemTextLogout: {
      color: colors.status.error,
    },
    menuItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    menuItemDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: spacing.md + 40 + spacing.md,
      marginRight: spacing.md,
      opacity: 0.5,
    },
    badge: {
      backgroundColor: colors.secondary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      ...typography.caption,
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    loadingContainer: {
      paddingVertical: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: spacing.sm,
    },
    uploadCNHButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: borders.radiusMedium,
      ...shadows.small,
      shadowColor: colors.shadow,
    },
    uploadCNHButtonText: {
      ...typography.body,
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          contentInsetAdjustmentBehavior="automatic"
          bounces={true}
          alwaysBounceVertical={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header sem gradiente */}
          <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
              {/* Seção de perfil centralizada */}
              <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                  <ProfilePhotoPicker
                    currentPhotoUrl={getProfilePhotoUrl()}
                    userName={getUserName()}
                    userType={getUserTypeForPicker()}
                    size={120}
                    onPhotoUpdated={handleProfilePhotoUpdated}
                    editable={true}
                    maxFileSizeMB={5}
                  />
                </View>
                
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>{getUserName()}</Text>
                    {user?.type && (
                      <View style={styles.ratingBadge}>
                        <Ionicons name="person" size={16} color={colors.secondary} />
                        <Text style={styles.ratingText}>{getUserType()}</Text>
                      </View>
                    )}
                  </View>
                  {userRating && (
                    <View style={styles.userRatingContainer}>
                      <StarRatingBadge
                        rating={parseFloat(userRating.currentRating) || 0}
                        maxRating={10}
                        starCount={5}
                        starSize={16}
                      />
                      <Text style={styles.totalRatingsText}>
                        {userRating.totalRatings > 0 
                          ? `(${userRating.totalRatings} ${userRating.totalRatings === 1 ? 'avaliação' : 'avaliações'})`
                          : '(Sem avaliações ainda)'
                        }
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Container unificado de Informações do Usuário e Email */}
          <View style={styles.infoContainer}>
            <Card style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Text style={styles.infoCardTitle}>Informações Pessoais</Text>
                <Text style={styles.infoCardSubtitle}>Seus dados cadastrados no sistema</Text>
              </View>
              {authLoading || isLoadingData ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Carregando dados...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nome</Text>
                    <Text style={styles.infoValue}>{getUserName()}</Text>
                  </View>
                  {user?.email && (
                    <View style={styles.infoRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Text style={styles.infoLabel}>E-mail</Text>
                        {user?.emailVerified && (
                          <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
                        )}
                      </View>
                      <Text style={styles.infoValue}>{getUserEmail()}</Text>
                    </View>
                  )}
                  {user?.cpf && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>CPF</Text>
                      <Text style={styles.infoValue}>{getUserCPF()}</Text>
                    </View>
                  )}
                  {user?.phone && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Telefone</Text>
                      <Text style={styles.infoValue}>{getUserPhone()}</Text>
                    </View>
                  )}
                  {user?.birthDate && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Data de Nascimento</Text>
                      <Text style={styles.infoValue}>{getUserBirthDate()}</Text>
                    </View>
                  )}
                  {/* Campos específicos do motorista */}
                  {isDriver() && (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Número da CNH</Text>
                        <Text style={styles.infoValue}>{getCNHNumber()}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Categoria da CNH</Text>
                        <Text style={styles.infoValue}>{getCNHCategory()}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Validade da CNH</Text>
                        <Text style={styles.infoValue}>{getCNHExpirationDate()}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Status</Text>
                        <Text style={styles.infoValue}>{getDriverStatus()}</Text>
                      </View>
                      {/* Botão para upload de CNH */}
                      {(!user?.cnhNumber || user?.status === 'AWAITING_CNH' || user?.status === 'ONBOARDING') && (
                        <TouchableOpacity
                          style={styles.uploadCNHButton}
                          onPress={handleUploadCNH}
                          disabled={isUploadingCNH}
                          activeOpacity={0.7}
                        >
                          {isUploadingCNH ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                              <Text style={styles.uploadCNHButtonText}>
                                {user?.cnhNumber ? 'Atualizar CNH' : 'Enviar CNH'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                      {user?.type && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Tipo de Conta</Text>
                          <Text style={styles.infoValue}>{getUserType()}</Text>
                        </View>
                      )}
                    </>
                  )}
                  {user?.type && !isDriver() && (
                    <View style={[styles.infoRow, styles.infoRowLast]}>
                      <Text style={styles.infoLabel}>Tipo de Conta</Text>
                      <Text style={styles.infoValue}>{getUserType()}</Text>
                    </View>
                  )}
                </>
              )}
            </Card>
          </View>

          {/* Menu de opções */}
          <View style={styles.menuContainer}>
            <Card style={styles.menuItemsWrapper}>
              {menuItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.menuItem,
                      index === 0 && styles.menuItemFirst,
                      index === menuItems.length - 1 && styles.menuItemLast
                    ]}>
                      <View style={styles.menuItemLeft}>
                        <View style={[
                          styles.menuItemIcon,
                          item.id === '7' && styles.menuItemIconLogout
                        ]}>
                          <Ionicons 
                            name={item.icon} 
                            size={20} 
                            color={item.id === '7' ? colors.status.error : colors.primary} 
                          />
                        </View>
                        <Text style={[
                          styles.menuItemText,
                          item.id === '7' && styles.menuItemTextLogout
                        ]}>{item.title}</Text>
                      </View>
                      <View style={styles.menuItemRight}>
                        {item.badge && item.badge > 0 && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.badge}</Text>
                          </View>
                        )}
                        {item.showChevron && (
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={colors.textSecondary}
                          />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                  {index < menuItems.length - 1 && (
                    <View style={styles.menuItemDivider} />
                  )}
                </React.Fragment>
              ))}
            </Card>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

