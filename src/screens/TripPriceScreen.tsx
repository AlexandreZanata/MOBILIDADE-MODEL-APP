import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { tripsService } from '@/services/tripsService';

interface TripPriceScreenProps {
  navigation: any;
  route: {
    params?: {
      origin?: { lat: number; lng: number };
      destination?: { lat: number; lng: number };
    };
  };
}

interface TripCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  final_fare?: number;
  distance_km?: number;
  duration_seconds?: number;
  minimum_fare?: number;
  price_multiplier?: number | string; // Pode vir como string ou number da API
  active?: boolean;
}

export const TripPriceScreen: React.FC<TripPriceScreenProps> = ({
  navigation,
  route,
}) => {
  const [categories, setCategories] = useState<TripCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [estimateId, setEstimateId] = useState<string | null>(null);
  const [estimateTimestamp, setEstimateTimestamp] = useState<number | null>(null);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const origin = route?.params?.origin;
  const destination = route?.params?.destination;

  // Chaves para cache
  const CACHE_KEYS = {
    TRIP_CATEGORIES: '@vamu:trip_categories',
    TRIP_CATEGORIES_TIMESTAMP: '@vamu:trip_categories_timestamp',
  };

  // Cache válido por 30 minutos
  const CACHE_VALIDITY_MS = 30 * 60 * 1000;

  // Calcula a distância entre dois pontos geográficos usando a fórmula de Haversine
  const calculateDistance = (
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number => {
    const R = 6371; // Raio da Terra em quilômetros
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distância em quilômetros
  };

  // Carregar categorias do cache
  const loadCachedCategories = async (): Promise<TripCategory[] | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.TRIP_CATEGORIES);
      const cachedTimestamp = await AsyncStorage.getItem(CACHE_KEYS.TRIP_CATEGORIES_TIMESTAMP);
      
      if (cached && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        
        // Verifica se o cache ainda é válido (menos de 30 minutos)
        if (now - timestamp < CACHE_VALIDITY_MS) {
          return JSON.parse(cached);
        }
      }
    } catch (error) {
      console.error('[TripPrice] Erro ao carregar cache:', error);
    }
    return null;
  };

  // Salvar categorias no cache
  const saveCategoriesToCache = async (categories: TripCategory[]) => {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.TRIP_CATEGORIES, JSON.stringify(categories));
      await AsyncStorage.setItem(CACHE_KEYS.TRIP_CATEGORIES_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error('[TripPrice] Erro ao salvar cache:', error);
    }
  };

  useEffect(() => {
    if (origin && destination) {
      // Valida se a distância é maior que zero antes de carregar
      const distance = calculateDistance(origin, destination);
      if (distance < 0.01) { // Menos de 10 metros (0.01 km)
        setIsLoading(false);
        setCategories([]);
        return;
      }
      loadCategories();
    } else {
      Alert.alert('Erro', 'Origem e destino são necessários');
      navigation.goBack();
    }
  }, []);

  // Recarrega categorias e atualiza preços quando a tela receber foco novamente
  // Isso garante que os preços estejam atualizados quando o usuário voltar da tela de pagamentos
  useFocusEffect(
    React.useCallback(() => {
      if (origin && destination) {
        const distance = calculateDistance(origin, destination);
        if (distance >= 0.01) {
          console.log('[TripPrice] Tela recebeu foco, atualizando preços...');
          // Recarrega categorias da API para obter preços atualizados
          loadCategoriesFromAPI();
        }
      }
    }, [origin, destination])
  );

  // Renovação automática da estimativa quando expirar (1 minuto)
  useEffect(() => {
    if (!estimateTimestamp || !origin || !destination) return;

    const ESTIMATE_EXPIRATION_MS = 60 * 1000; // 1 minuto
    const CHECK_INTERVAL_MS = 10 * 1000; // Verifica a cada 10 segundos
    
    // Função para verificar e renovar se necessário
    const checkAndRenew = () => {
      const now = Date.now();
      const estimateAge = now - estimateTimestamp;
      
      // Se expirou ou está próximo de expirar (5 segundos antes), renova
      if (estimateAge >= ESTIMATE_EXPIRATION_MS - 5000) {
        console.log('[TripPrice] Estimativa expirada ou próxima de expirar, renovando automaticamente...');
        // eslint-disable-next-line react-hooks/exhaustive-deps
        loadCategoriesFromAPI();
      }
    };

    // Verifica imediatamente se já expirou
    checkAndRenew();

    // Configura intervalo para verificar periodicamente
    const interval = setInterval(checkAndRenew, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimateTimestamp, origin, destination]);

  const loadCategories = async () => {
    if (!origin || !destination) return;

    // Valida se a distância é maior que zero antes de carregar
    const distance = calculateDistance(origin, destination);
    if (distance < 0.01) { // Menos de 10 metros (0.01 km)
      setIsLoading(false);
      setCategories([]);
      return;
    }

    setIsLoading(true);
    try {
      // Tenta carregar do cache primeiro
      const cachedCategories = await loadCachedCategories();
      if (cachedCategories && cachedCategories.length > 0) {
        console.log('[TripPrice] Categorias carregadas do cache:', cachedCategories.length);
        setCategories(cachedCategories);
        if (cachedCategories.length > 0) {
          setSelectedCategory(cachedCategories[0].id);
        }
        setIsLoading(false);
        
        // Atualiza em background sem bloquear
        await loadCategoriesFromAPI();
        return;
      }

      // Se não tem cache, busca da API
      await loadCategoriesFromAPI();
    } catch (error) {
      console.error('[TripPrice] Erro ao carregar categorias:', error);
      setIsLoading(false);
    }
  };


  const loadCategoriesFromAPI = async () => {
    if (!origin || !destination) return;

    // Valida se a distância é maior que zero antes de fazer a requisição
    const distance = calculateDistance(origin, destination);
    if (distance < 0.01) { // Menos de 10 metros (0.01 km)
      setIsLoading(false);
      setCategories([]);
      return;
    }

    try {
      console.log('[TripPrice] Carregando categorias com estimativas da API...');
      
      // Usa a nova API: POST /v1/passengers/fare-estimate
      const response = await tripsService.getCategoriesWithEstimate(
        { lat: origin.lat, lng: origin.lng },
        { lat: destination.lat, lng: destination.lng }
      );

      console.log('[TripPrice] Resposta do /v1/passengers/fare-estimate:', {
        success: response.success,
        hasData: !!response.data,
        hasEstimateId: !!response.data?.estimateId,
        categoriesCount: response.data?.categories?.length || 0,
      });

      if (response.success && response.data) {
        // Obtém o estimateId da resposta e armazena o timestamp
        if (response.data.estimateId) {
          setEstimateId(response.data.estimateId);
          setEstimateTimestamp(Date.now()); // Armazena o timestamp atual
        }

        // Mapeia as categorias do formato da API para o formato esperado pela UI
        // Formato da API: { category: {...}, estimate: {...} }
        const categoriesData: TripCategory[] = (response.data.categories || [])
          .filter((item: any) => {
            // Verifica se tem category e estimate
            const isValid = item.category && item.category.id && item.category.name && item.estimate;
            if (!isValid && __DEV__) {
              console.warn('[TripPrice] Categoria inválida filtrada:', item);
            }
            return isValid;
          })
          .map((item: any) => {
            const cat = item.category;
            const estimate = item.estimate;
            
            return {
              id: cat.id,
              name: cat.name || 'Categoria',
              description: cat.description,
              icon: cat.icon,
              // Campos de estimativa vêm do objeto estimate
              final_fare: estimate.final_fare,
              distance_km: estimate.distance_km,
              duration_seconds: estimate.duration_seconds,
              minimum_fare: estimate.minimum_fare,
              price_multiplier: cat.price_multiplier,
              active: cat.active !== false, // Assume ativo se não especificado
            };
          });
        
        console.log('[TripPrice] Categorias válidas após filtro:', categoriesData.length);
        
        if (categoriesData.length === 0) {
          console.warn('[TripPrice] Nenhuma categoria válida encontrada na resposta');
          setCategories([]);
          Alert.alert('Erro', 'Não foi possível carregar as categorias. Tente novamente.');
          setIsLoading(false);
          return;
        }
        
        // Salva no cache
        await saveCategoriesToCache(categoriesData);
        
        setCategories(categoriesData);
        setSelectedCategory(categoriesData[0].id);
      } else {
        // Em caso de erro
        setCategories([]);
        console.error('[TripPrice] Erro na resposta:', response);
        
        // Só mostra alerta se não tem categorias do cache
        if (categories.length === 0) {
          Alert.alert('Erro', response.message || response.error || 'Não foi possível carregar as categorias. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('[TripPrice] Erro ao carregar categorias da API:', error);
      // Em caso de erro, garante que categories seja um array vazio
      // Só mostra alerta se não tem categorias do cache
      if (categories.length === 0) {
        setCategories([]);
        Alert.alert('Erro', 'Não foi possível carregar as categorias. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1).replace('.', ',')} km`;
  };

  const handleConfirm = async () => {
    if (!selectedCategory || !origin || !destination) {
      Alert.alert('Atenção', 'Por favor, selecione uma categoria');
      return;
    }

    // Encontra a categoria selecionada para pegar o preço
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    const estimatedFare = selectedCategoryData?.final_fare || null;

    // Navega para a tela de método de pagamento
    navigation.navigate('PaymentMethod', {
      origin,
      destination,
      tripCategoryId: selectedCategory,
      estimatedFare, // Passa o preço estimado
      estimateId, // Passa o estimateId para criar a corrida
      estimateTimestamp, // Passa o timestamp para verificar expiração
    });
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
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: spacing.md,
      paddingTop: Math.max(insets.top, spacing.lg) + spacing.md,
      paddingBottom: spacing.md,
    },
    header: {
      marginBottom: spacing.xl,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryCard: {
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryCardSelected: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    categoryContent: {
      gap: spacing.sm,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
      gap: spacing.md,
    },
    categoryHeaderLeft: {
      flex: 1,
      gap: spacing.xs,
    },
    categoryName: {
      ...typography.h2,
      fontSize: 18,
      lineHeight: 24,
      color: colors.textPrimary,
      fontWeight: '700',
      fontFamily: 'Poppins-Bold',
    },
    categoryNameSelected: {
      color: colors.primary,
    },
    categoryDescription: {
      ...typography.body,
      fontSize: 12,
      lineHeight: 16,
      color: colors.textSecondary,
      marginTop: 2,
      fontFamily: 'Poppins-Regular',
    },
    categoryPriceContainer: {
      alignItems: 'flex-end',
      gap: 2,
      minWidth: 100,
    },
    categoryPrice: {
      ...typography.h2,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'Poppins-Bold',
    },
    categoryPriceSelected: {
      color: colors.primary,
    },
    categoryPriceLabel: {
      ...typography.caption,
      fontSize: 10,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontFamily: 'Poppins-SemiBold',
    },
    categoryDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      marginTop: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    categoryDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    categoryDetailIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: hexToRgba(colors.textSecondary, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryDetailText: {
      ...typography.caption,
      fontSize: 13,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Medium',
    },
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.md),
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });


  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.subtitle, { marginTop: spacing.md }]}>
            Calculando preços...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Escolha sua viagem</Text>
          <Text style={styles.subtitle}>
            Selecione a categoria que melhor atende suas necessidades
          </Text>
        </View>

        {Array.isArray(categories) && categories.length > 0 ? (
          categories
            .filter((category) => category && category.id) // Filtra categorias inválidas
            .map((category) => {
              const isSelected = selectedCategory === category.id;
              const categoryName = category?.name || 'Categoria';

              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  activeOpacity={0.8}
                >
                  <Card
                    style={StyleSheet.flatten([
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                    ])}
                    selected={isSelected}
                  >
                    <View style={styles.categoryContent}>
                      <View style={styles.categoryHeader}>
                        <View style={styles.categoryHeaderLeft}>
                          <Text
                            style={[
                              styles.categoryName,
                              isSelected && styles.categoryNameSelected,
                            ]}
                          >
                            {categoryName}
                          </Text>
                          {category.description && (
                            <Text style={styles.categoryDescription}>
                              {category.description}
                            </Text>
                          )}
                        </View>
                        
                        <View style={styles.categoryPriceContainer}>
                          {category.final_fare !== undefined ? (
                            <>
                              <Text
                                style={[
                                  styles.categoryPrice,
                                  isSelected && styles.categoryPriceSelected,
                                ]}
                              >
                                {formatPrice(category.final_fare)}
                              </Text>
                              <Text style={styles.categoryPriceLabel}>
                                Preço final
                              </Text>
                            </>
                          ) : category.price_multiplier !== undefined ? (
                            <>
                              <Text
                                style={[
                                  styles.categoryPrice,
                                  isSelected && styles.categoryPriceSelected,
                                ]}
                              >
                                {typeof category.price_multiplier === 'number' 
                                  ? `${category.price_multiplier.toFixed(2)}x`
                                  : `${category.price_multiplier}x`}
                              </Text>
                              <Text style={styles.categoryPriceLabel}>
                                Multiplicador
                              </Text>
                            </>
                          ) : null}
                        </View>
                      </View>
                      
                      {(category.duration_seconds !== undefined || category.distance_km !== undefined) && (
                        <View style={styles.categoryDetails}>
                          {category.duration_seconds !== undefined && (
                            <View style={styles.categoryDetailItem}>
                              <View style={styles.categoryDetailIcon}>
                                <Ionicons
                                  name="time-outline"
                                  size={12}
                                  color={colors.textSecondary}
                                />
                              </View>
                              <Text style={styles.categoryDetailText}>
                                {formatDuration(category.duration_seconds)}
                              </Text>
                            </View>
                          )}
                          {category.distance_km !== undefined && (
                            <View style={styles.categoryDetailItem}>
                              <View style={styles.categoryDetailIcon}>
                                <Ionicons
                                  name="location-outline"
                                  size={12}
                                  color={colors.textSecondary}
                                />
                              </View>
                              <Text style={styles.categoryDetailText}>
                                {formatDistance(category.distance_km)}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
        ) : (
          <View style={{ padding: spacing.lg, alignItems: 'center' }}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={{ marginTop: spacing.md, color: colors.textSecondary, textAlign: 'center' }}>
              {origin && destination && calculateDistance(origin, destination) < 0.01
                ? 'Selecione um destino primeiro...'
                : 'Nenhuma categoria disponível no momento.'}
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title="Confirmar corrida"
          onPress={handleConfirm}
          variant="primary"
          fullWidth
          disabled={!selectedCategory}
        />
      </View>
    </View>
  );
};

