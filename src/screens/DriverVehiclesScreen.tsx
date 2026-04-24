import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType, PhotoQuality } from 'react-native-image-picker';
import { Card } from '@/components/atoms/Card';
import { AutocompleteInput, AutocompleteItem } from '@/components/molecules/AutocompleteInput';
import { spacing, typography, shadows } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { vehiclesService, VehicleBrand, VehicleModel } from '@/services/vehiclesService';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { requestMediaLibraryPermission, requestCameraPermission, openAppSettings } from '@/services/permissionsService';

interface DriverVehiclesScreenProps {
  navigation: any;
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  baseFare: string;
  perKmRate: string;
  minFare: string;
}

interface Vehicle {
  id: string;
  driverProfileId: string;
  serviceCategoryId: string | null;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const DriverVehiclesScreen: React.FC<DriverVehiclesScreenProps> = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const ensureToken = useTokenRefresh();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingVehicleId, setUploadingVehicleId] = useState<string | null>(null);
  const lastLoadTimeRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  const LOAD_THROTTLE_MS = 5000; // 5 segundos entre carregamentos

  // Form fields
  const [licensePlate, setLicensePlate] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<AutocompleteItem | null>(null);
  const [selectedModel, setSelectedModel] = useState<AutocompleteItem | null>(null);
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [serviceCategoryId, setServiceCategoryId] = useState('');

  // Errors - declarado antes das funções que o utilizam
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Busca de marcas de veículos
  const searchBrands = useCallback(async (query: string): Promise<AutocompleteItem[]> => {
    try {
      const response = await vehiclesService.getBrands({
        q: query,
        limit: 20,
        sort: 'name',
      });

      if (response.success && response.data?.items) {
        return response.data.items.map((brand: VehicleBrand) => ({
          id: brand.id,
          name: brand.name,
        }));
      }
      return [];
    } catch (error) {
      console.error('[DriverVehicles] Erro ao buscar marcas:', error);
      return [];
    }
  }, []);

  // Busca de modelos de veículos (filtrado por marca selecionada)
  const searchModels = useCallback(async (query: string): Promise<AutocompleteItem[]> => {
    try {
      let response;
      
      if (selectedBrand) {
        // Se tem marca selecionada, busca modelos da marca
        response = await vehiclesService.getModelsByBrand(selectedBrand.id, {
          q: query,
          limit: 20,
          sort: 'name',
        });
      } else {
        // Se não tem marca, busca todos os modelos
        response = await vehiclesService.getModels({
          q: query,
          limit: 20,
          sort: 'name',
        });
      }

      if (response.success && response.data?.items) {
        return response.data.items.map((model: VehicleModel) => ({
          id: model.id,
          name: model.name,
        }));
      }
      return [];
    } catch (error) {
      console.error('[DriverVehicles] Erro ao buscar modelos:', error);
      return [];
    }
  }, [selectedBrand]);

  // Quando a marca muda, limpa o modelo selecionado
  const handleBrandChange = useCallback((item: AutocompleteItem | null) => {
    setSelectedBrand(item);
    // Limpa o modelo quando a marca muda
    if (item?.id !== selectedBrand?.id) {
      setSelectedModel(null);
    }
    if (errors.brand) setErrors(prev => ({ ...prev, brand: '' }));
  }, [selectedBrand, errors.brand]);

  const handleModelChange = useCallback((item: AutocompleteItem | null) => {
    setSelectedModel(item);
    if (errors.model) setErrors(prev => ({ ...prev, model: '' }));
  }, [errors.model]);

  // Carrega veículos e categorias quando a tela é focada
  useFocusEffect(
    React.useCallback(() => {
      // Evita múltiplas chamadas simultâneas
      if (isLoadingRef.current) {
        if (__DEV__) {
          console.log('[DriverVehicles] Carregamento já em andamento, ignorando...');
        }
        return;
      }
      loadData();
    }, [])
  );

  const loadData = async () => {
    // Evita múltiplas chamadas simultâneas
    if (isLoadingRef.current) {
      if (__DEV__) {
        console.log('[DriverVehicles] Carregamento já em andamento, ignorando...');
      }
      return;
    }

    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTimeRef.current;
    
    // Throttle: evita múltiplos carregamentos em menos de 5 segundos
    if (timeSinceLastLoad < LOAD_THROTTLE_MS && lastLoadTimeRef.current > 0) {
      if (__DEV__) {
        console.log(`[DriverVehicles] Throttle: aguardando ${Math.ceil((LOAD_THROTTLE_MS - timeSinceLastLoad) / 1000)}s antes de recarregar`);
      }
      return;
    }
    
    lastLoadTimeRef.current = now;
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      await Promise.all([loadVehicles(), loadServiceCategories()]);
    } catch (error) {
      console.error('[DriverVehicles] Erro ao carregar dados:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await apiService.getDriverVehicles();
      if (response.success && response.data?.items) {
        setVehicles(response.data.items);
      } else {
        setVehicles([]);
      }
    } catch (error) {
      console.error('[DriverVehicles] Erro ao carregar veículos:', error);
      setVehicles([]);
    }
  };

  const loadServiceCategories = async () => {
    try {
      const response = await apiService.getDriverServiceCategories();
      if (response.success && response.data?.items) {
        setServiceCategories(response.data.items);
      }
    } catch (error) {
      console.error('[DriverVehicles] Erro ao carregar categorias:', error);
      Alert.alert('Erro', 'Não foi possível carregar as categorias de serviço.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!licensePlate.trim()) {
      newErrors.licensePlate = 'Placa é obrigatória';
    } else if (!/^[A-Z]{3}-?\d{4}$/i.test(licensePlate.trim()) && !/^[A-Z]{3}\d[A-Z]\d{2}$/i.test(licensePlate.trim())) {
      // Suporta formato antigo (ABC-1234) e Mercosul (ABC1D23)
      newErrors.licensePlate = 'Placa inválida (formato: ABC-1234 ou ABC1D23)';
    }

    if (!selectedBrand) {
      newErrors.brand = 'Selecione uma marca';
    }

    if (!selectedModel) {
      newErrors.model = 'Selecione um modelo';
    }

    if (!year.trim()) {
      newErrors.year = 'Ano é obrigatório';
    } else {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        newErrors.year = 'Ano inválido';
      }
    }

    if (!color.trim()) {
      newErrors.color = 'Cor é obrigatória';
    }

    if (!serviceCategoryId) {
      newErrors.serviceCategoryId = 'Categoria de serviço é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!selectedBrand || !selectedModel) {
      Alert.alert('Erro', 'Selecione a marca e o modelo do veículo.');
      return;
    }

    // Garante token válido antes da ação
    await ensureToken();

    setIsSubmitting(true);
    try {
      const response = await apiService.createDriverVehicle({
        licensePlate: licensePlate.trim().toUpperCase(),
        brandId: selectedBrand.id,
        modelId: selectedModel.id,
        year: parseInt(year),
        color: color.trim(),
        serviceCategoryId,
      });

      if (response.success) {
        Alert.alert('Sucesso', 'Veículo cadastrado com sucesso!', [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              setShowAddModal(false);
              loadData();
            },
          },
        ]);
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível cadastrar o veículo.');
      }
    } catch (error: any) {
      console.error('[DriverVehicles] Erro ao cadastrar veículo:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar o veículo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setLicensePlate('');
    setSelectedBrand(null);
    setSelectedModel(null);
    setYear('');
    setColor('');
    setServiceCategoryId('');
    setErrors({});
  };

  const handleOpenModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      resetForm();
      setShowAddModal(false);
    }
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      PENDING_DOCS: 'Aguardando Documentos',
      AWAITING_VEHICLE: 'Aguardando Documento do Veículo',
      PENDING: 'Em Análise',
      APPROVED: 'Aprovado',
      REJECTED: 'Rejeitado',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      PENDING_DOCS: colors.status.warning,
      AWAITING_VEHICLE: colors.status.warning,
      PENDING: colors.status.warning,
      APPROVED: colors.status.success,
      REJECTED: colors.status.error,
    };
    return colorMap[status] || colors.textSecondary;
  };

  const handleUploadDocument = async (vehicleId: string) => {
    try {
      Alert.alert(
        'Enviar Documento',
        'Selecione como deseja enviar o CRLV do veículo:',
        [
          {
            text: 'Galeria',
            onPress: async () => {
              const hasPermission = await requestMediaLibraryPermission();
              if (!hasPermission) {
                Alert.alert(
                  'Permissão necessária',
                  'Precisamos de permissão para acessar suas fotos.',
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
                    console.error('[DriverVehicles] Erro ao selecionar imagem:', response.errorMessage);
                    Alert.alert('Erro', 'Não foi possível acessar as imagens. Tente novamente.');
                    return;
                  }
                  if (response.assets && response.assets[0] && response.assets[0].uri) {
                    uploadVehicleDocument(vehicleId, response.assets[0].uri);
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
                    console.error('[DriverVehicles] Erro ao capturar foto:', response.errorMessage);
                    Alert.alert('Erro', 'Não foi possível acessar a câmera. Tente novamente.');
                    return;
                  }
                  if (response.assets && response.assets[0] && response.assets[0].uri) {
                    uploadVehicleDocument(vehicleId, response.assets[0].uri);
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

  const uploadVehicleDocument = async (vehicleId: string, fileUri: string) => {
    // Garante token válido antes da ação
    await ensureToken();

    setUploadingVehicleId(vehicleId);
    try {
      const response = await apiService.uploadDriverDocument('VEHICLE_DOC', fileUri, vehicleId);

      if (response.success) {
        Alert.alert(
          'Sucesso',
          'CRLV enviado com sucesso! Aguarde a análise.',
          [
            {
              text: 'OK',
              onPress: async () => {
                // Recarrega os veículos após upload
                await loadVehicles();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Erro',
          response.error || 'Não foi possível enviar o CRLV. Tente novamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao fazer upload do CRLV:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao enviar o CRLV. Tente novamente.');
    } finally {
      setUploadingVehicleId(null);
    }
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.md,
      paddingTop: Math.max(insets.top, spacing.md),
      paddingBottom: spacing.sm + 90,
    },
    header: {
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.h1,
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.body,
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl * 2,
    },
    emptyIcon: {
      marginBottom: spacing.md,
    },
    emptyText: {
      ...typography.body,
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    emptySubtext: {
      ...typography.caption,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    addButton: {
      position: 'absolute',
      bottom: spacing.sm,
      left: spacing.md,
      right: spacing.md,
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      ...shadows.medium,
      shadowColor: colors.shadow,
      zIndex: 10,
    },
    addButtonText: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    vehicleCard: {
      marginBottom: spacing.md,
    },
    vehicleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    vehicleTitle: {
      ...typography.h2,
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
    },
    vehicleStatusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 8,
    },
    vehicleStatusText: {
      ...typography.caption,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    vehicleInfo: {
      gap: spacing.xs,
    },
    vehicleInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    vehicleInfoLabel: {
      ...typography.caption,
      fontSize: 12,
      color: colors.textSecondary,
      minWidth: 80,
    },
    vehicleInfoValue: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '500',
      color: colors.textPrimary,
      flex: 1,
    },
    uploadButton: {
      marginTop: spacing.md,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    uploadButtonText: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // Modal Full Screen Styles
    modalFullScreen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      ...typography.h2,
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    modalScroll: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    sectionTitle: {
      ...typography.h2,
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    formGroup: {
      marginBottom: spacing.md,
    },
    formLabel: {
      ...typography.caption,
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    formInput: {
      ...typography.body,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formInputError: {
      borderColor: colors.status.error,
    },
    formError: {
      ...typography.caption,
      fontSize: 12,
      color: colors.status.error,
      marginTop: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    formSelect: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 48,
      justifyContent: 'center',
      flexDirection: 'row',
      alignItems: 'center',
    },
    formSelectText: {
      ...typography.body,
      fontSize: 16,
      color: colors.textPrimary,
    },
    formSelectPlaceholder: {
      color: colors.textSecondary,
    },
    categoryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      marginBottom: spacing.sm,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryOptionSelected: {
      backgroundColor: hexToRgba(colors.primary, 0.05),
      borderColor: colors.primary,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.textSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    radioButtonSelected: {
      borderColor: colors.primary,
    },
    radioButtonInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    categoryOptionText: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    categoryOptionTextSelected: {
      fontWeight: '600',
      color: colors.primary,
    },
    modalFooter: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.medium,
      shadowColor: colors.primary,
    },
    submitButtonDisabled: {
      opacity: 0.7,
      backgroundColor: colors.textSecondary,
    },
    submitButtonText: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    // Removido: modalOverlay, modalContent, modalCloseButton (não mais usados)
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.scrollContent, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Meus Veículos</Text>
          <Text style={styles.subtitle}>Gerencie seus veículos cadastrados</Text>
        </View>

        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color={colors.textSecondary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>Nenhum veículo cadastrado</Text>
            <Text style={styles.emptySubtext}>Cadastre seu primeiro veículo para começar a receber corridas</Text>
          </View>
        ) : (
          vehicles.map((vehicle) => (
            <Card key={vehicle.id} style={styles.vehicleCard}>
              <View style={styles.vehicleHeader}>
                <Text 
                  style={styles.vehicleTitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {vehicle.brand} {vehicle.model}
                </Text>
                {(vehicle.status === 'PENDING_DOCS' || vehicle.status === 'AWAITING_VEHICLE') ? (
                  <View style={[styles.vehicleStatusContainer, { backgroundColor: hexToRgba(colors.status.warning, 0.1) }]}>
                    <Ionicons name="warning-outline" size={14} color={colors.status.warning} />
                    <Text style={[styles.vehicleStatusText, { color: colors.status.warning }]}>DOCUMENTOS</Text>
                  </View>
                ) : (
                  <View style={[styles.vehicleStatusContainer, { backgroundColor: hexToRgba(getStatusColor(vehicle.status), 0.1) }]}>
                    <Text style={[styles.vehicleStatusText, { color: getStatusColor(vehicle.status) }]}>{getStatusLabel(vehicle.status)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleInfoRow}>
                  <Text style={styles.vehicleInfoLabel}>Placa:</Text>
                  <Text style={styles.vehicleInfoValue}>{vehicle.licensePlate}</Text>
                </View>
                <View style={styles.vehicleInfoRow}>
                  <Text style={styles.vehicleInfoLabel}>Ano:</Text>
                  <Text style={styles.vehicleInfoValue}>{vehicle.year}</Text>
                </View>
                <View style={styles.vehicleInfoRow}>
                  <Text style={styles.vehicleInfoLabel}>Cor:</Text>
                  <Text style={styles.vehicleInfoValue}>{vehicle.color}</Text>
                </View>
              </View>
              {(vehicle.status === 'AWAITING_VEHICLE' || vehicle.status === 'PENDING_DOCS') && (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleUploadDocument(vehicle.id)}
                  disabled={uploadingVehicleId === vehicle.id}
                  activeOpacity={0.8}
                >
                  {uploadingVehicleId === vehicle.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="document-attach-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.uploadButtonText}>Enviar CRLV</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={handleOpenModal} activeOpacity={0.8}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Cadastrar Veículo</Text>
      </TouchableOpacity>

      <Modal visible={showAddModal} animationType="slide" onRequestClose={handleCloseModal}>
        <View style={styles.modalFullScreen}>
          <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, spacing.md) }]}>
            <TouchableOpacity style={styles.backButton} onPress={handleCloseModal}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Novo Veículo</Text>
            <View style={{ width: 40 }} />
          </View>

          <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView 
              style={styles.modalScroll} 
              contentContainerStyle={{ paddingBottom: spacing.xl }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              <Text style={styles.sectionTitle}>Dados do Veículo</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Placa do Veículo</Text>
                <TextInput
                  style={[styles.formInput, errors.licensePlate && styles.formInputError]}
                  value={licensePlate}
                  onChangeText={(text) => {
                    setLicensePlate(text);
                    if (errors.licensePlate) setErrors({ ...errors, licensePlate: '' });
                  }}
                  placeholder="ABC-1234"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                {errors.licensePlate && <Text style={styles.formError}>{errors.licensePlate}</Text>}
              </View>

              <View style={[styles.formGroup, { zIndex: 200 }]}>
                <AutocompleteInput
                  label="Marca"
                  placeholder="Selecione a marca"
                  value={selectedBrand}
                  onSelect={handleBrandChange}
                  onSearch={searchBrands}
                  error={!!errors.brand}
                  errorMessage={errors.brand}
                  minChars={0}
                  debounceMs={300}
                  emptyMessage="Nenhuma marca encontrada"
                  loadingMessage="Buscando marcas..."
                />
              </View>

              <View style={[styles.formGroup, { zIndex: 100 }]}>
                <AutocompleteInput
                  label="Modelo"
                  placeholder={selectedBrand ? "Selecione o modelo" : "Selecione uma marca primeiro"}
                  value={selectedModel}
                  onSelect={handleModelChange}
                  onSearch={searchModels}
                  error={!!errors.model}
                  errorMessage={errors.model}
                  disabled={!selectedBrand}
                  minChars={0}
                  debounceMs={300}
                  emptyMessage={selectedBrand ? "Nenhum modelo encontrado" : "Selecione uma marca primeiro"}
                  loadingMessage="Buscando modelos..."
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.formLabel}>Ano</Text>
                  <TextInput
                    style={[styles.formInput, errors.year && styles.formInputError]}
                    value={year}
                    onChangeText={(text) => {
                      setYear(text.replace(/[^0-9]/g, ''));
                      if (errors.year) setErrors({ ...errors, year: '' });
                    }}
                    placeholder="2020"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  {errors.year && <Text style={styles.formError}>{errors.year}</Text>}
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                  <Text style={styles.formLabel}>Cor</Text>
                  <TextInput
                    style={[styles.formInput, errors.color && styles.formInputError]}
                    value={color}
                    onChangeText={(text) => {
                      setColor(text);
                      if (errors.color) setErrors({ ...errors, color: '' });
                    }}
                    placeholder="Branco"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="words"
                  />
                  {errors.color && <Text style={styles.formError}>{errors.color}</Text>}
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Categoria</Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Categoria de Serviço</Text>
                {serviceCategories.length === 0 ? (
                  <View style={styles.formSelect}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.formSelectText, styles.formSelectPlaceholder, { marginLeft: spacing.xs }]}>
                      Carregando categorias...
                    </Text>
                  </View>
                ) : (
                  <View>
                    {serviceCategories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryOption,
                          serviceCategoryId === category.id && styles.categoryOptionSelected,
                        ]}
                        onPress={() => {
                          setServiceCategoryId(category.id);
                          if (errors.serviceCategoryId) setErrors({ ...errors, serviceCategoryId: '' });
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.radioButton,
                          serviceCategoryId === category.id && styles.radioButtonSelected
                        ]}>
                          {serviceCategoryId === category.id && <View style={styles.radioButtonInner} />}
                        </View>
                        <Text
                          style={[
                            styles.categoryOptionText,
                            serviceCategoryId === category.id && styles.categoryOptionTextSelected,
                          ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {errors.serviceCategoryId && (
                      <Text style={styles.formError}>{errors.serviceCategoryId}</Text>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Cadastrar Veículo</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

