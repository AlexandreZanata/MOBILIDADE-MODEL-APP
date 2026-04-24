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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { spacing, typography, borders } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { apiService, PaymentMethodResponse, CardBrandResponse } from '@/services/api';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';

interface PaymentMethodScreenProps {
  navigation: any;
  route: {
    params?: {
      origin?: { lat: number; lng: number };
      destination?: { lat: number; lng: number };
      tripCategoryId?: string;
      estimatedFare?: number; // Preço estimado da corrida
      estimateId?: string; // ID da estimativa para criar a corrida
      estimateTimestamp?: number; // Timestamp de quando o estimateId foi obtido
    };
  };
}

interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  type: 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'wallet';
  description?: string;
  requires_card_brand: boolean;
  enabled: boolean;
}

interface PaymentBrand {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
}

export const PaymentMethodScreen: React.FC<PaymentMethodScreenProps> = ({
  navigation,
  route,
}) => {
  const { origin, destination, tripCategoryId, estimateId: initialEstimateId, estimateTimestamp: initialEstimateTimestamp } = route?.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const ensureToken = useTokenRefresh();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentBrands, setPaymentBrands] = useState<PaymentBrand[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  // Estados para gerenciar a estimativa atualizada
  const [currentEstimateId, setCurrentEstimateId] = useState<string | null>(initialEstimateId || null);
  const [currentEstimateTimestamp, setCurrentEstimateTimestamp] = useState<number | null>(initialEstimateTimestamp || null);

  // Chaves para cache
  const CACHE_KEYS = {
    PAYMENT_METHODS: '@vamu:payment_methods',
    PAYMENT_METHODS_TIMESTAMP: '@vamu:payment_methods_timestamp',
    PAYMENT_BRANDS: '@vamu:payment_brands',
    PAYMENT_BRANDS_TIMESTAMP: '@vamu:payment_brands_timestamp',
  };

  // Cache válido por 1 hora
  const CACHE_VALIDITY_MS = 60 * 60 * 1000;

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Carregar métodos do cache
  const loadCachedPaymentMethods = async (): Promise<PaymentMethod[] | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.PAYMENT_METHODS);
      const cachedTimestamp = await AsyncStorage.getItem(CACHE_KEYS.PAYMENT_METHODS_TIMESTAMP);
      
      if (cached && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        
        // Verifica se o cache ainda é válido (menos de 1 hora)
        if (now - timestamp < CACHE_VALIDITY_MS) {
          return JSON.parse(cached);
        }
      }
    } catch (error) {
      console.error('[PaymentMethod] Erro ao carregar cache:', error);
    }
    return null;
  };

  // Salvar métodos no cache
  const savePaymentMethodsToCache = async (methods: PaymentMethod[]) => {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.PAYMENT_METHODS, JSON.stringify(methods));
      await AsyncStorage.setItem(CACHE_KEYS.PAYMENT_METHODS_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error('[PaymentMethod] Erro ao salvar cache:', error);
    }
  };

  // Carregar bandeiras do cache
  const loadCachedPaymentBrands = async (paymentMethodId: string): Promise<PaymentBrand[] | null> => {
    try {
      const cacheKey = `${CACHE_KEYS.PAYMENT_BRANDS}_${paymentMethodId}`;
      const timestampKey = `${CACHE_KEYS.PAYMENT_BRANDS_TIMESTAMP}_${paymentMethodId}`;
      
      const cached = await AsyncStorage.getItem(cacheKey);
      const cachedTimestamp = await AsyncStorage.getItem(timestampKey);
      
      if (cached && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        
        // Verifica se o cache ainda é válido (menos de 1 hora)
        if (now - timestamp < CACHE_VALIDITY_MS) {
          return JSON.parse(cached);
        }
      }
    } catch (error) {
      console.error('[PaymentMethod] Erro ao carregar cache de bandeiras:', error);
    }
    return null;
  };

  // Salvar bandeiras no cache
  const savePaymentBrandsToCache = async (paymentMethodId: string, brands: PaymentBrand[]) => {
    try {
      const cacheKey = `${CACHE_KEYS.PAYMENT_BRANDS}_${paymentMethodId}`;
      const timestampKey = `${CACHE_KEYS.PAYMENT_BRANDS_TIMESTAMP}_${paymentMethodId}`;
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(brands));
      await AsyncStorage.setItem(timestampKey, Date.now().toString());
    } catch (error) {
      console.error('[PaymentMethod] Erro ao salvar cache de bandeiras:', error);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (selectedMethod) {
      const method = paymentMethods.find((m) => m.id === selectedMethod);
      if (method?.requires_card_brand) {
        loadPaymentBrands(selectedMethod);
      } else {
        setPaymentBrands([]);
        setSelectedBrand(null);
      }
    }
  }, [selectedMethod]);

  // Renovação automática da estimativa quando expirar (1 minuto)
  // Monitora enquanto o usuário está na tela de pagamentos
  useEffect(() => {
    if (!currentEstimateTimestamp || !origin || !destination || !currentEstimateId) return;

    const ESTIMATE_EXPIRATION_MS = 60 * 1000; // 1 minuto
    const RENEWAL_THRESHOLD_MS = 55 * 1000; // 55 segundos (renova 5s antes)
    const CHECK_INTERVAL_MS = 10 * 1000; // Verifica a cada 10 segundos
    
    // Função para verificar e renovar se necessário
    const checkAndRenew = async () => {
      const now = Date.now();
      const estimateAge = now - currentEstimateTimestamp;
      
      // Se expirou ou está próximo de expirar (5 segundos antes), renova
      if (estimateAge >= RENEWAL_THRESHOLD_MS) {
        console.log('[PaymentMethod] Estimativa expirada ou próxima de expirar, renovando automaticamente...');
        
        try {
          const estimateResponse = await apiService.fareEstimate(origin, destination);
          
          if (estimateResponse.success && estimateResponse.data?.estimateId) {
            console.log('[PaymentMethod] Nova estimativa obtida automaticamente:', estimateResponse.data.estimateId);
            // Atualiza os estados locais com a nova estimativa
            setCurrentEstimateId(estimateResponse.data.estimateId);
            setCurrentEstimateTimestamp(Date.now());
          } else {
            console.warn('[PaymentMethod] Não foi possível renovar estimativa automaticamente');
          }
        } catch (error) {
          console.error('[PaymentMethod] Erro ao renovar estimativa automaticamente:', error);
        }
      }
    };

    // Verifica imediatamente se já expirou
    checkAndRenew();

    // Configura intervalo para verificar periodicamente
    const interval = setInterval(checkAndRenew, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [currentEstimateTimestamp, origin, destination, currentEstimateId]);

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    try {
      // Tenta carregar do cache primeiro
      const cachedMethods = await loadCachedPaymentMethods();
      if (cachedMethods && cachedMethods.length > 0) {
        console.log('[PaymentMethod] Métodos carregados do cache:', cachedMethods.length);
        setPaymentMethods(cachedMethods);
        if (cachedMethods.length > 0) {
          setSelectedMethod(cachedMethods[0].id);
        }
        setIsLoading(false);
        
        // Atualiza em background sem bloquear
        await loadPaymentMethodsFromAPI();
        return;
      }

      // Se não tem cache, busca da API
      await loadPaymentMethodsFromAPI();
    } catch (error) {
      console.error('[PaymentMethod] Erro ao carregar métodos:', error);
      setIsLoading(false);
    }
  };

  // Mapeia o slug para o tipo de pagamento
  const getPaymentTypeFromSlug = (slug: string): 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'wallet' => {
    const normalizedSlug = slug.toLowerCase();
    if (normalizedSlug.includes('credit') || normalizedSlug === 'credito' || normalizedSlug === 'credit_card') {
      return 'credit_card';
    }
    if (normalizedSlug.includes('debit') || normalizedSlug === 'debito' || normalizedSlug === 'debit_card') {
      return 'debit_card';
    }
    if (normalizedSlug === 'pix') {
      return 'pix';
    }
    if (normalizedSlug === 'cash' || normalizedSlug === 'dinheiro') {
      return 'cash';
    }
    if (normalizedSlug.includes('wallet') || normalizedSlug === 'carteira') {
      return 'wallet';
    }
    // Default para credit_card se não conseguir identificar
    return 'credit_card';
  };

  // Determina se um método requer bandeira de cartão
  const requiresCardBrand = (slug: string): boolean => {
    const type = getPaymentTypeFromSlug(slug);
    return type === 'credit_card' || type === 'debit_card';
  };

  const loadPaymentMethodsFromAPI = async () => {
    try {
      const response = await apiService.getPaymentMethods();
      console.log('[PaymentMethod] Resposta da API:', {
        success: response.success,
        hasData: !!response.data,
        dataType: response.data ? (Array.isArray(response.data) ? 'array' : typeof response.data) : 'null',
        dataLength: Array.isArray(response.data) ? response.data.length : 0,
      });

      if (response.success && response.data && Array.isArray(response.data)) {
        // A nova API retorna um array direto de PaymentMethodResponse
        const apiMethods: PaymentMethodResponse[] = response.data;

        console.log('[PaymentMethod] Métodos recebidos da API:', apiMethods.length);

        // Filtra apenas métodos habilitados e mapeia para o formato local
        const methods: PaymentMethod[] = apiMethods
          .filter((m) => m && m.id && m.name && m.enabled)
          .map((m) => ({
            id: m.id,
            name: m.name,
            slug: m.slug,
            type: getPaymentTypeFromSlug(m.slug),
            description: m.description,
            requires_card_brand: requiresCardBrand(m.slug),
            enabled: m.enabled,
          }));

        console.log('[PaymentMethod] Métodos processados:', methods.length);

        // Salva no cache
        await savePaymentMethodsToCache(methods);
        
        setPaymentMethods(methods);

        // Seleciona o primeiro método por padrão
        if (methods.length > 0) {
          setSelectedMethod(methods[0].id);
        } else {
          console.warn('[PaymentMethod] Nenhum método de pagamento válido encontrado');
        }
      } else {
        console.error('[PaymentMethod] Resposta inválida:', response);
        // Não mostra alerta se já tem métodos do cache
        if (paymentMethods.length === 0) {
          Alert.alert('Erro', response.message || 'Não foi possível carregar os métodos de pagamento');
        }
      }
    } catch (error) {
      console.error('[PaymentMethod] Erro ao carregar métodos da API:', error);
      // Não mostra alerta se já tem métodos do cache
      if (paymentMethods.length === 0) {
        Alert.alert('Erro', 'Não foi possível carregar os métodos de pagamento');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentBrands = async (paymentMethodId: string) => {
    try {
      // Tenta carregar do cache primeiro
      const cachedBrands = await loadCachedPaymentBrands(paymentMethodId);
      if (cachedBrands && cachedBrands.length > 0) {
        console.log('[PaymentMethod] Bandeiras carregadas do cache:', cachedBrands.length);
        setPaymentBrands(cachedBrands);
        if (cachedBrands.length > 0) {
          setSelectedBrand(cachedBrands[0].id);
        }
        
        // Atualiza em background sem bloquear
        await loadPaymentBrandsFromAPI(paymentMethodId);
        return;
      }

      // Se não tem cache, busca da API
      await loadPaymentBrandsFromAPI(paymentMethodId);
    } catch (error) {
      console.error('[PaymentMethod] Erro ao carregar bandeiras:', error);
      setPaymentBrands([]);
    }
  };

  const loadPaymentBrandsFromAPI = async (paymentMethodId: string) => {
    try {
      // Usa a nova rota que retorna todas as bandeiras habilitadas
      const response = await apiService.getCardBrands();
      console.log('[PaymentMethod] Resposta de bandeiras:', {
        success: response.success,
        hasData: !!response.data,
        dataType: response.data ? (Array.isArray(response.data) ? 'array' : typeof response.data) : 'null',
        dataLength: Array.isArray(response.data) ? response.data.length : 0,
      });

      if (response.success && response.data && Array.isArray(response.data)) {
        // A nova API retorna um array direto de CardBrandResponse
        const apiBrands: CardBrandResponse[] = response.data;

        console.log('[PaymentMethod] Bandeiras recebidas da API:', apiBrands.length);

        // Filtra apenas bandeiras habilitadas e mapeia para o formato local
        const brands: PaymentBrand[] = apiBrands
          .filter((b) => b && b.id && b.name && b.enabled)
          .map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            enabled: b.enabled,
          }));

        console.log('[PaymentMethod] Bandeiras processadas:', brands.length);

        // Salva no cache (mantém paymentMethodId para compatibilidade com cache existente)
        await savePaymentBrandsToCache(paymentMethodId, brands);
        
        setPaymentBrands(brands);

        // Seleciona a primeira bandeira por padrão
        if (brands.length > 0) {
          setSelectedBrand(brands[0].id);
        } else {
          console.warn('[PaymentMethod] Nenhuma bandeira válida encontrada');
        }
      } else {
        console.warn('[PaymentMethod] Resposta de bandeiras inválida ou vazia');
        // Não limpa se já tem bandeiras do cache
        if (paymentBrands.length === 0) {
          setPaymentBrands([]);
        }
      }
    } catch (error) {
      console.error('[PaymentMethod] Erro ao carregar bandeiras da API:', error);
      // Não limpa se já tem bandeiras do cache
      if (paymentBrands.length === 0) {
        setPaymentBrands([]);
      }
    }
  };

  const getMethodIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        return 'card-outline';
      case 'cash':
        return 'cash-outline';
      case 'pix':
        return 'flash-outline';
      case 'wallet':
        return 'wallet-outline';
      default:
        return 'card-outline';
    }
  };

  const handleConfirm = async () => {
    if (!selectedMethod) {
      Alert.alert('Atenção', 'Por favor, selecione um método de pagamento');
      return;
    }

    if (!origin || !destination || !tripCategoryId) {
      Alert.alert('Erro', 'Dados da viagem não encontrados');
      navigation.goBack();
      return;
    }

    if (!currentEstimateId) {
      Alert.alert('Erro', 'ID da estimativa não encontrado. Por favor, tente novamente.');
      navigation.goBack();
      return;
    }

    // Garante token válido antes da ação
    await ensureToken();

    setIsCreatingTrip(true);
    try {
      let finalEstimateId = currentEstimateId;
      
      // Verifica se o estimateId expirou ou está próximo de expirar (1 minuto = 60000ms)
      // Renova se passou mais de 55 segundos (5 segundos antes de expirar)
      const ESTIMATE_EXPIRATION_MS = 60 * 1000; // 1 minuto
      const RENEWAL_THRESHOLD_MS = 55 * 1000; // 55 segundos (renova 5s antes)
      const now = Date.now();
      const estimateAge = currentEstimateTimestamp ? now - currentEstimateTimestamp : Infinity;
      
      if (estimateAge > RENEWAL_THRESHOLD_MS) {
        console.log('[PaymentMethod] estimateId expirado ou próximo de expirar, obtendo nova estimativa...');
        
        // Faz nova requisição de estimativa para obter um estimateId válido
        const estimateResponse = await apiService.fareEstimate(origin, destination);
        
        if (!estimateResponse.success || !estimateResponse.data?.estimateId) {
          Alert.alert(
            'Erro',
            'A estimativa expirou e não foi possível obter uma nova. Por favor, tente novamente.'
          );
          setIsCreatingTrip(false);
          return;
        }
        
        finalEstimateId = estimateResponse.data.estimateId;
        // Atualiza os estados locais
        setCurrentEstimateId(finalEstimateId);
        setCurrentEstimateTimestamp(Date.now());
        console.log('[PaymentMethod] Nova estimativa obtida:', finalEstimateId);
      }

      // Determina o paymentBrandId apenas se o método requerer
      const method = paymentMethods.find((m) => m.id === selectedMethod);
      let paymentBrandId: string | undefined = undefined;
      
      if (method?.requires_card_brand) {
        if (!selectedBrand) {
          Alert.alert('Atenção', 'Por favor, selecione a bandeira do cartão');
          setIsCreatingTrip(false);
          return;
        }
        paymentBrandId = selectedBrand;
      }

      // Cria a corrida usando a API
      let response = await apiService.createRide(
        finalEstimateId,
        tripCategoryId,
        selectedMethod,
        paymentBrandId
      );

      // Verifica se o erro é relacionado a estimativa expirada
      // O erro pode vir em diferentes formatos:
      // - response.error (string)
      // - response.message (string)
      // - response.data?.errorMessage (string)
      // - response.data?.errorCode (string)
      const errorMessage = response.message || response.error || (response.data as any)?.errorMessage || '';
      const errorCode = (response.data as any)?.errorCode || '';
      const errorMessageLower = errorMessage.toLowerCase();
      const errorCodeLower = errorCode.toLowerCase();
      
      const isEstimateExpired = 
        // Verifica mensagens de erro relacionadas a estimativa
        (errorMessageLower.includes('estimativa') || 
         errorMessageLower.includes('estimate')) && 
        (errorMessageLower.includes('expir') || 
         errorMessageLower.includes('expirado') ||
         errorMessageLower.includes('não encontrado') ||
         errorMessageLower.includes('not found') ||
         errorMessageLower.includes('invalid')) ||
        // Verifica código de erro
        (errorCodeLower.includes('invalid') && 
         (errorMessageLower.includes('estimativa') || errorMessageLower.includes('estimate'))) ||
        // Verifica status HTTP 400 com mensagem relacionada
        (response.status === 400 && 
         (errorMessageLower.includes('estimativa') || 
          errorMessageLower.includes('estimate') ||
          errorCodeLower === 'invalid_request'));

      // Se a estimativa expirou, tenta obter uma nova e criar a corrida novamente
      if (!response.success && isEstimateExpired) {
        console.log('[PaymentMethod] Estimativa expirada detectada, obtendo nova estimativa...');
        
        // Faz nova requisição de estimativa
        const estimateResponse = await apiService.fareEstimate(origin, destination);
        
        if (estimateResponse.success && estimateResponse.data?.estimateId) {
          finalEstimateId = estimateResponse.data.estimateId;
          // Atualiza os estados locais
          setCurrentEstimateId(finalEstimateId);
          setCurrentEstimateTimestamp(Date.now());
          console.log('[PaymentMethod] Nova estimativa obtida, tentando criar corrida novamente...');
          
          // Tenta criar a corrida novamente com a nova estimativa
          response = await apiService.createRide(
            finalEstimateId,
            tripCategoryId,
            selectedMethod,
            paymentBrandId
          );
        }
      }

      if (response.success && response.data) {
        const tripData = response.data;
        const tripId = tripData?.id || tripData?.trip_id;
        
        if (tripId) {
          // Navega para tela de aguardo do motorista
          const estimatedFare = route?.params?.estimatedFare || tripData?.estimatedPrice || tripData?.estimated_fare || tripData?.finalPrice || tripData?.final_fare || null;
          navigation.navigate('WaitingForDriver', {
            userLocation: origin,
            destination: destination,
            tripData: tripData,
            tripId: tripId,
            estimatedFare,
          });
          return;
        } else {
          Alert.alert('Erro', 'A corrida foi criada mas não foi possível obter o ID. Tente novamente.');
        }
      } else {
        // Mostra erro da API apenas se não for erro de estimativa expirada (já tentamos renovar)
        const finalErrorMessage = response.message || response.error || 'Não foi possível criar a corrida. Tente novamente.';
        Alert.alert('Erro', finalErrorMessage);
      }
    } catch (error: any) {
      console.error('[PaymentMethod] Erro ao criar corrida:', error);
      Alert.alert('Erro', error.message || 'Não foi possível criar a corrida. Tente novamente.');
    } finally {
      setIsCreatingTrip(false);
    }
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
    methodWrapper: {
      marginBottom: spacing.md,
    },
    methodCard: {
      marginBottom: 0,
      borderWidth: 1,
      borderColor: colors.border,
    },
    methodCardSelected: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    methodCardWithBrands: {
      paddingBottom: spacing.xs,
    },
    methodContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    methodIconContainer: {
      width: 56,
      height: 56,
      borderRadius: borders.radiusMedium,
      backgroundColor: hexToRgba(colors.primary, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
    },
    methodIconContainerSelected: {
      backgroundColor: hexToRgba(colors.primary, 0.15),
    },
    methodInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    methodName: {
      ...typography.h2,
      fontSize: 18,
      lineHeight: 24,
      color: colors.textPrimary,
      fontWeight: '700',
      fontFamily: 'Poppins-Bold',
    },
    methodNameSelected: {
      color: colors.primary,
    },
    methodDescription: {
      ...typography.body,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
    },
    brandsContainer: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: hexToRgba(colors.border, 0.3),
    },
    brandsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    brandCard: {
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: colors.background,
      minHeight: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    brandCardSelected: {
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: hexToRgba(colors.primary, 0.06),
    },
    brandName: {
      ...typography.body,
      fontSize: 12,
      color: colors.textPrimary,
      fontFamily: 'Poppins-Medium',
      letterSpacing: 0.2,
    },
    brandNameSelected: {
      color: colors.primary,
      fontWeight: '600',
      fontFamily: 'Poppins-SemiBold',
    },
    brandsLoadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xs,
      gap: spacing.xs,
    },
    brandsLoadingText: {
      ...typography.body,
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
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
            Carregando métodos de pagamento...
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
          <Text style={styles.title}>Método de Pagamento</Text>
          <Text style={styles.subtitle}>
            Selecione como deseja pagar pela viagem
          </Text>
        </View>

        {paymentMethods.length > 0 ? (
          paymentMethods.map((method) => {
            const isSelected = selectedMethod === method.id;
            const icon = getMethodIcon(method.type);

            return (
              <View key={method.id} style={styles.methodWrapper}>
                <TouchableOpacity
                  onPress={() => setSelectedMethod(method.id)}
                  activeOpacity={0.8}
                >
                  <Card
                    style={StyleSheet.flatten([
                      styles.methodCard,
                      isSelected && styles.methodCardSelected,
                      isSelected && method.requires_card_brand && styles.methodCardWithBrands,
                    ])}
                    selected={isSelected}
                  >
                    <View style={styles.methodContent}>
                      <View
                        style={[
                          styles.methodIconContainer,
                          isSelected && styles.methodIconContainerSelected,
                        ]}
                      >
                        <Ionicons
                          name={icon}
                          size={28}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                      </View>
                      <View style={styles.methodInfo}>
                        <Text
                          style={[
                            styles.methodName,
                            isSelected && styles.methodNameSelected,
                          ]}
                        >
                          {method.name}
                        </Text>
                        {method.description && (
                          <Text style={styles.methodDescription}>
                            {method.description}
                          </Text>
                        )}
                      </View>
                    </View>

                    {isSelected && method.requires_card_brand && (
                      <View style={styles.brandsContainer}>
                        {paymentBrands.length > 0 ? (
                          <View style={styles.brandsRow}>
                            {paymentBrands.map((brand) => {
                              const isBrandSelected = selectedBrand === brand.id;
                              return (
                                <TouchableOpacity
                                  key={brand.id}
                                  onPress={() => setSelectedBrand(brand.id)}
                                  activeOpacity={0.7}
                                >
                                  <View
                                    style={[
                                      styles.brandCard,
                                      isBrandSelected && styles.brandCardSelected,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.brandName,
                                        isBrandSelected && styles.brandNameSelected,
                                      ]}
                                    >
                                      {brand.name}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        ) : (
                          <View style={styles.brandsLoadingContainer}>
                            <ActivityIndicator size="small" color={colors.textSecondary} />
                            <Text style={styles.brandsLoadingText}>
                              Carregando bandeiras...
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={{ padding: spacing.lg, alignItems: 'center' }}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={{ marginTop: spacing.md, color: colors.textSecondary, textAlign: 'center' }}>
              Nenhum método de pagamento disponível no momento.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isCreatingTrip ? 'Criando corrida...' : 'Confirmar e Solicitar Corrida'}
          onPress={handleConfirm}
          disabled={isCreatingTrip}
          loading={isCreatingTrip}
        />
      </View>
    </View>
  );
};

