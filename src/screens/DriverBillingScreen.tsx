import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Clipboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import Button from '@/components/Button';
import { spacing, typography, shadows } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import {
  apiService,
  BillingCycleResponse,
  DriverBillingStatusResponse,
  DriverBillingCyclesResponse,
  PixQrCodeResponse,
  BillingCycleStatus,
} from '@/services/api';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';

interface DriverBillingScreenProps {
  navigation: any;
}

const STATUS_COLORS: Record<BillingCycleStatus, string> = {
  PENDING: '#6B7280',
  PROCESSING: '#3B82F6',
  AWAITING_PAYMENT: '#F59E0B',
  PAID: '#10B981',
  PARTIALLY_PAID: '#F59E0B',
  OVERDUE: '#EF4444',
  GRACE_PERIOD: '#F97316',
  BLOCKED: '#DC2626',
  CANCELLED: '#6B7280',
};

const STATUS_LABELS: Record<BillingCycleStatus, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  AWAITING_PAYMENT: 'Aguardando Pagamento',
  PAID: 'Pago',
  PARTIALLY_PAID: 'Pago Parcialmente',
  OVERDUE: 'Vencido',
  GRACE_PERIOD: 'Período de Carência',
  BLOCKED: 'Bloqueado',
  CANCELLED: 'Cancelado',
};

export const DriverBillingScreen: React.FC<DriverBillingScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const ensureToken = useTokenRefresh();
  const [billingStatus, setBillingStatus] = useState<DriverBillingStatusResponse | null>(null);
  const [cycles, setCycles] = useState<BillingCycleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCycles, setIsLoadingCycles] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycleResponse | null>(null);
  const [pixData, setPixData] = useState<PixQrCodeResponse | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  const loadBillingStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      await ensureToken();
      const response = await apiService.getDriverBillingStatus();
      
      if (response.success && response.data) {
        console.log('[DriverBilling] Status carregado:', response.data);
        setBillingStatus(response.data);
      } else {
        console.error('[DriverBilling] Erro ao carregar status:', response);
        Alert.alert('Erro', response.message || 'Não foi possível carregar o status de cobrança.');
      }
    } catch (error) {
      console.error('[DriverBilling] Erro ao carregar status:', error);
      Alert.alert('Erro', 'Não foi possível carregar o status de cobrança.');
    } finally {
      setIsLoading(false);
    }
  }, [ensureToken]);

  const loadCycles = useCallback(async (append: boolean = false) => {
    try {
      if (!append) {
        setIsLoadingCycles(true);
      }
      
      await ensureToken();
      const response = await apiService.getDriverBillingCycles({
        cursor: append ? nextCursor : undefined,
        limit: 20,
      });
      
      if (response.success && response.data) {
        // A API pode retornar um array direto ou um objeto com items
        let items: BillingCycleResponse[] = [];
        let hasMore = false;
        let cursor: string | undefined = undefined;

        // Verifica se é um array direto
        if (Array.isArray(response.data)) {
          items = response.data;
          hasMore = false; // Se for array direto, não há paginação
          console.log('[DriverBilling] Ciclos carregados (array direto):', items.length);
        } else if (response.data.items) {
          // É um objeto com items (paginação)
          items = response.data.items || [];
          hasMore = response.data.hasMore || false;
          cursor = response.data.nextCursor;
          console.log('[DriverBilling] Ciclos carregados (paginação):', items.length);
        }

        // Log para debug: mostra o total pendente calculado
        const totalRemaining = items.reduce((sum, cycle) => sum + (cycle.remainingAmount || 0), 0);
        console.log('[DriverBilling] Total pendente calculado dos ciclos:', totalRemaining);

        if (append) {
          setCycles((prev) => [...(prev || []), ...items]);
        } else {
          setCycles(items);
        }
        setHasMore(hasMore);
        setNextCursor(cursor);
      } else {
        if (!append) {
          setCycles([]);
          Alert.alert('Erro', response.message || 'Não foi possível carregar os ciclos de cobrança.');
        }
      }
    } catch (error) {
      console.error('[DriverBilling] Erro ao carregar ciclos:', error);
      if (!append) {
        setCycles([]);
        Alert.alert('Erro', 'Não foi possível carregar os ciclos de cobrança.');
      }
    } finally {
      setIsLoadingCycles(false);
    }
  }, [ensureToken, nextCursor]);

  useFocusEffect(
    useCallback(() => {
      loadBillingStatus();
      loadCycles();
    }, [loadBillingStatus, loadCycles])
  );

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const handleGeneratePix = async (cycle: BillingCycleResponse) => {
    try {
      // Valida se o ciclo tem valor pendente
      if (cycle.remainingAmount <= 0) {
        Alert.alert('Aviso', 'Este ciclo não possui valor pendente para pagamento.');
        return;
      }

      setIsGeneratingPix(true);
      await ensureToken();
      
      console.log('[DriverBilling] Gerando PIX para ciclo:', cycle.id, '| Valor:', cycle.remainingAmount);
      
      // Gera chave de idempotência única
      const idempotencyKey = `${cycle.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const response = await apiService.generateCyclePix(cycle.id, idempotencyKey);
      
      console.log('[DriverBilling] Resposta da geração de PIX:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        message: response.message,
        status: response.status,
      });
      
      if (response.success && response.data) {
        setPixData(response.data);
        setSelectedCycle(cycle);
        setShowPixModal(true);
      } else {
        const errorMessage = response.message || response.error || 'Não foi possível gerar o QR Code PIX.';
        console.error('[DriverBilling] Erro ao gerar PIX:', {
          message: errorMessage,
          status: response.status,
          error: response.error,
        });
        
        // Mensagem mais específica para erro 500
        if (response.status === 500) {
          Alert.alert(
            'Erro no Servidor',
            'O servidor encontrou um erro ao processar sua solicitação. Por favor, tente novamente em alguns instantes ou entre em contato com o suporte.'
          );
        } else {
          Alert.alert('Erro', errorMessage);
        }
      }
    } catch (error) {
      console.error('[DriverBilling] Exceção ao gerar PIX:', error);
      Alert.alert('Erro', 'Não foi possível gerar o QR Code PIX. Tente novamente.');
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleGenerateDebtPix = async () => {
    try {
      // Valida se há débito pendente
      if (totalPending <= 0) {
        Alert.alert('Aviso', 'Não há débito pendente para pagamento.');
        return;
      }

      setIsGeneratingPix(true);
      await ensureToken();
      
      console.log('[DriverBilling] Gerando PIX para débito total | Total pendente:', totalPending);
      console.log('[DriverBilling] Ciclos disponíveis:', cycles.length);
      
      // Gera chave de idempotência única
      const idempotencyKey = `debt-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const response = await apiService.generateDebtPix(idempotencyKey);
      
      console.log('[DriverBilling] Resposta da geração de PIX do débito:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        message: response.message,
        status: response.status,
      });
      
      if (response.success && response.data) {
        setPixData(response.data);
        setSelectedCycle(null);
        setShowPixModal(true);
      } else {
        const errorMessage = response.message || response.error || 'Não foi possível gerar o QR Code PIX.';
        console.error('[DriverBilling] Erro ao gerar PIX do débito:', {
          message: errorMessage,
          status: response.status,
          error: response.error,
        });
        
        // Mensagem mais específica para erro 500
        if (response.status === 500) {
          Alert.alert(
            'Erro no Servidor',
            'O servidor encontrou um erro ao processar sua solicitação. Por favor, tente novamente em alguns instantes ou entre em contato com o suporte.'
          );
        } else {
          Alert.alert('Erro', errorMessage);
        }
      }
    } catch (error) {
      console.error('[DriverBilling] Exceção ao gerar PIX do débito:', error);
      Alert.alert('Erro', 'Não foi possível gerar o QR Code PIX. Tente novamente.');
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleCopyPixCode = () => {
    if (pixData) {
      Clipboard.setString(pixData.copyPaste || pixData.qrCode);
      Alert.alert('Sucesso', 'Código PIX copiado para a área de transferência!');
    }
  };

  const renderCycleCard = (cycle: BillingCycleResponse) => {
    const statusColor = STATUS_COLORS[cycle.status] || colors.textSecondary;
    const statusLabel = STATUS_LABELS[cycle.status] || cycle.status;
    const isPayable = ['AWAITING_PAYMENT', 'OVERDUE', 'GRACE_PERIOD', 'PARTIALLY_PAID'].includes(cycle.status);
    
    return (
      <Card key={cycle.id} style={styles.cycleCard}>
        <View style={styles.cycleHeader}>
          <View style={styles.cycleHeaderLeft}>
            <Text style={styles.cyclePeriod}>
              {formatDateShort(cycle.periodStart)} - {formatDateShort(cycle.periodEnd)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.cycleAmount}>{formatCurrency(cycle.totalAmount)}</Text>
        </View>
        
        <View style={styles.cycleDetails}>
          <View style={styles.cycleDetailRow}>
            <Text style={styles.cycleDetailLabel}>Corridas:</Text>
            <Text style={styles.cycleDetailValue}>{cycle.rideCount}</Text>
          </View>
          <View style={styles.cycleDetailRow}>
            <Text style={styles.cycleDetailLabel}>Valor por corrida:</Text>
            <Text style={styles.cycleDetailValue}>{formatCurrency(cycle.pricePerRide)}</Text>
          </View>
          {cycle.paidAmount > 0 && (
            <View style={styles.cycleDetailRow}>
              <Text style={styles.cycleDetailLabel}>Pago:</Text>
              <Text style={[styles.cycleDetailValue, { color: colors.status.success }]}>
                {formatCurrency(cycle.paidAmount)}
              </Text>
            </View>
          )}
          {cycle.remainingAmount > 0 && (
            <View style={styles.cycleDetailRow}>
              <Text style={styles.cycleDetailLabel}>Restante:</Text>
              <Text style={[styles.cycleDetailValue, { color: colors.status.error }]}>
                {formatCurrency(cycle.remainingAmount)}
              </Text>
            </View>
          )}
          {cycle.pixExpiresAt && (
            <View style={styles.cycleDetailRow}>
              <Text style={styles.cycleDetailLabel}>Vencimento PIX:</Text>
              <Text style={styles.cycleDetailValue}>{formatDate(cycle.pixExpiresAt)}</Text>
            </View>
          )}
        </View>
        
        {isPayable && (
          <Button
            title="Gerar QR Code PIX"
            onPress={() => handleGeneratePix(cycle)}
            variant="primary"
            fullWidth
            style={styles.generatePixButton}
            disabled={isGeneratingPix}
          />
        )}
      </Card>
    );
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
    // Faixa fixa superior (barra de notificação)
    topSafeArea: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: insets.top,
      backgroundColor: colors.background,
      zIndex: 10,
    },
    // Faixa fixa inferior (barra de navegação)
    bottomSafeArea: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: insets.bottom,
      backgroundColor: colors.background,
      zIndex: 10,
    },
    scrollContent: {
      padding: spacing.md,
      paddingTop: Math.max(insets.top, spacing.lg) + spacing.md + 56,
      paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl,
    },
    backButton: {
      position: 'absolute',
      top: Math.max(insets.top, spacing.lg) + spacing.sm,
      left: spacing.md,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.small,
      shadowColor: colors.shadow,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 20,
    },
    header: {
      marginBottom: spacing.lg,
    },
    headerTitle: {
      ...typography.h1,
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
      fontFamily: 'Poppins-Bold',
    },
    headerSubtitle: {
      ...typography.body,
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
    },
    statusCard: {
      marginBottom: spacing.lg,
    },
    statusHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    statusTitle: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    statusAmount: {
      ...typography.h2,
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: 'Poppins-Bold',
    },
    statusDetails: {
      gap: spacing.sm,
    },
    statusDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusDetailLabel: {
      ...typography.body,
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
    },
    statusDetailValue: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    blockedWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: hexToRgba(colors.status.error, 0.1),
      borderRadius: 12,
      marginTop: spacing.md,
    },
    blockedWarningText: {
      ...typography.body,
      fontSize: 14,
      color: colors.status.error,
      flex: 1,
      fontFamily: 'Poppins-Medium',
    },
    sectionTitle: {
      ...typography.h2,
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.md,
      fontFamily: 'Poppins-Bold',
    },
    cyclesList: {
      gap: spacing.md,
    },
    cycleCard: {
      marginBottom: spacing.md,
    },
    cycleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    cycleHeaderLeft: {
      flex: 1,
    },
    cyclePeriod: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
      fontFamily: 'Poppins-SemiBold',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
      gap: spacing.xs,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      ...typography.caption,
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Poppins-SemiBold',
    },
    cycleAmount: {
      ...typography.h2,
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
      fontFamily: 'Poppins-Bold',
    },
    cycleDetails: {
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    cycleDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cycleDetailLabel: {
      ...typography.body,
      fontSize: 14,
      color: colors.textSecondary,
      fontFamily: 'Poppins-Regular',
    },
    cycleDetailValue: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    generatePixButton: {
      marginTop: spacing.sm,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl * 2,
    },
    emptyStateIcon: {
      marginBottom: spacing.md,
    },
    emptyStateText: {
      ...typography.body,
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      fontFamily: 'Poppins-Regular',
    },
    pixModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    pixModalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: spacing.lg,
      width: '100%',
      maxWidth: 400,
      ...shadows.large,
      shadowColor: colors.shadow,
    },
    pixModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    pixModalTitle: {
      ...typography.h2,
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      fontFamily: 'Poppins-Bold',
    },
    pixModalClose: {
      padding: spacing.xs,
    },
    pixQrCode: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      marginBottom: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pixQrCodeImage: {
      width: '90%',
      height: '90%',
      resizeMode: 'contain',
    },
    pixAmount: {
      ...typography.h2,
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: spacing.md,
      fontFamily: 'Poppins-Bold',
    },
    pixExpires: {
      ...typography.caption,
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
      fontFamily: 'Poppins-Regular',
    },
    pixCopyButton: {
      marginBottom: spacing.md,
    },
    pixInstructions: {
      ...typography.body,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      fontFamily: 'Poppins-Regular',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyStateText, { marginTop: spacing.md }]}>
            Carregando informações...
          </Text>
        </View>
      </View>
    );
  }

  // Calcula o total pendente a partir dos ciclos carregados
  // Isso garante que o valor esteja correto mesmo se a API de status retornar 0
  const calculatedTotalPending = cycles.reduce((sum, cycle) => {
    // Soma apenas ciclos que ainda têm valor pendente (remainingAmount > 0)
    // e que não estão pagos ou cancelados
    if (cycle.remainingAmount > 0 && 
        cycle.status !== 'PAID' && 
        cycle.status !== 'CANCELLED') {
      return sum + (cycle.remainingAmount || 0);
    }
    return sum;
  }, 0);

  // Usa o valor calculado dos ciclos se o billingStatus.totalPending for 0 ou não estiver disponível
  const totalPending = billingStatus?.totalPending && billingStatus.totalPending > 0 
    ? billingStatus.totalPending 
    : calculatedTotalPending;

  // Log para debug
  console.log('[DriverBilling] Total pendente:', {
    fromStatus: billingStatus?.totalPending,
    calculated: calculatedTotalPending,
    final: totalPending,
    cyclesCount: cycles.length,
  });
  
  const isBlocked = billingStatus?.isBlocked || false;

  return (
    <View style={styles.container}>
      {/* Faixa fixa superior (barra de notificação) */}
      <View style={styles.topSafeArea} />

      {/* Faixa fixa inferior (barra de navegação) */}
      <View style={styles.bottomSafeArea} />

      {/* Botão de Voltar */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pagamentos</Text>
          <Text style={styles.headerSubtitle}>Gerencie seus pagamentos e ciclos de cobrança</Text>
        </View>

        {billingStatus && (
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Total Pendente</Text>
              <Text style={styles.statusAmount}>{formatCurrency(totalPending)}</Text>
            </View>
            
            <View style={styles.statusDetails}>
              <View style={styles.statusDetailRow}>
                <Text style={styles.statusDetailLabel}>Corridas pendentes:</Text>
                <Text style={styles.statusDetailValue}>
                  {billingStatus.totalPendingRides || 0}
                </Text>
              </View>
              {billingStatus.currentCycle && (
                <View style={styles.statusDetailRow}>
                  <Text style={styles.statusDetailLabel}>Ciclo atual:</Text>
                  <Text style={styles.statusDetailValue}>
                    {formatDateShort(billingStatus.currentCycle.periodStart)} - {formatDateShort(billingStatus.currentCycle.periodEnd)}
                  </Text>
                </View>
              )}
            </View>

            {isBlocked && (
              <View style={styles.blockedWarning}>
                <Ionicons name="alert-circle" size={20} color={colors.status.error} />
                <Text style={styles.blockedWarningText}>
                  Você está bloqueado devido a pagamentos em atraso. Pague suas pendências para continuar recebendo corridas.
                </Text>
              </View>
            )}

            {totalPending > 0 && (
              <Button
                title={`Pagar Tudo (${formatCurrency(totalPending)})`}
                onPress={handleGenerateDebtPix}
                variant="primary"
                fullWidth
                style={{ marginTop: spacing.md }}
                disabled={isGeneratingPix}
              />
            )}
          </Card>
        )}

        <Text style={styles.sectionTitle}>Histórico de Ciclos</Text>

        {isLoadingCycles && (!cycles || cycles.length === 0) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !cycles || cycles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="receipt-outline"
              size={64}
              color={colors.textSecondary}
              style={styles.emptyStateIcon}
            />
            <Text style={styles.emptyStateText}>
              Nenhum ciclo de cobrança encontrado.
            </Text>
          </View>
        ) : (
          <View style={styles.cyclesList}>
            {cycles.map(renderCycleCard)}
            {hasMore && (
              <Button
                title="Carregar mais"
                onPress={() => loadCycles(true)}
                variant="secondary"
                fullWidth
                disabled={isLoadingCycles}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal de QR Code PIX */}
      <Modal
        visible={showPixModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPixModal(false)}
      >
        <View style={styles.pixModal}>
          <View style={styles.pixModalContent}>
            <View style={styles.pixModalHeader}>
              <Text style={styles.pixModalTitle}>QR Code PIX</Text>
              <TouchableOpacity
                style={styles.pixModalClose}
                onPress={() => setShowPixModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {pixData && (
              <>
                <Text style={styles.pixAmount}>{formatCurrency(pixData.amount)}</Text>
                
                {pixData.qrCodeBase64 ? (
                  <View style={styles.pixQrCode}>
                    <Image
                      source={{ uri: `data:image/png;base64,${pixData.qrCodeBase64}` }}
                      style={styles.pixQrCodeImage}
                    />
                  </View>
                ) : (
                  <View style={styles.pixQrCode}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                )}

                <Text style={styles.pixExpires}>
                  Vence em: {formatDate(pixData.expiresAt)}
                </Text>

                <Button
                  title="Copiar Código PIX"
                  onPress={handleCopyPixCode}
                  variant="primary"
                  fullWidth
                  style={styles.pixCopyButton}
                />

                <Text style={styles.pixInstructions}>
                  Escaneie o QR Code com o app do seu banco ou copie o código PIX para pagar.
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

