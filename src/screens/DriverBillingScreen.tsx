import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, shadows } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useDriverBilling } from '@/hooks/billing/useDriverBilling';
import { DriverBillingSummaryCard } from '@/components/organisms/billing/DriverBillingSummaryCard';
import { BillingCyclesList } from '@/components/organisms/billing/BillingCyclesList';
import { PixPaymentModal } from '@/components/organisms/billing/PixPaymentModal';
import { tb } from '@/i18n/billing';

type RootStackParamList = {
  DriverBilling: undefined;
};

interface DriverBillingScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'DriverBilling'>;
}

export const DriverBillingScreen: React.FC<DriverBillingScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    canAccessBilling,
    billingStatus,
    cycles,
    isLoading,
    isLoadingCycles,
    pixData,
    showPixModal,
    isGeneratingPix,
    hasMore,
    totalPending,
    loadCycles,
    handleGeneratePix,
    handleGenerateDebtPix,
    handleCopyPixCode,
    closePixModal,
  } = useDriverBilling();

  const formatCurrency = useMemo(
    () => (value: number): string =>
      new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      }).format(value),
    []
  );

  const formatDate = useMemo(
    () => (dateString: string): string =>
      new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      }).format(new Date(dateString)),
    []
  );

  const formatDateShort = useMemo(
    () => (dateString: string): string =>
      new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      }).format(new Date(dateString)),
    []
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
      width: spacing.lg + spacing.md,
      height: spacing.lg + spacing.md,
      borderRadius: spacing.md + spacing.sm,
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
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    headerSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    sectionTitle: {
      ...typography.h2,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
      noAccessText: {
        ...typography.body,
        color: colors.textSecondary,
      },
  }),
    [colors, insets.bottom, insets.top]
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.noAccessText, { marginTop: spacing.md }]}>{tb('loading')}</Text>
        </View>
      </View>
    );
  }

  if (!canAccessBilling) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.noAccessText}>{tb('statusLoadError')}</Text>
        </View>
      </SafeAreaView>
    );
  }

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

      <View style={[styles.container, styles.scrollContent]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{tb('title')}</Text>
          <Text style={styles.headerSubtitle}>{tb('subtitle')}</Text>
        </View>

        {billingStatus && (
          <DriverBillingSummaryCard
            billingStatus={billingStatus}
            totalPending={totalPending}
            isGeneratingPix={isGeneratingPix}
            formatCurrency={formatCurrency}
            formatDateShort={formatDateShort}
            onGenerateDebtPix={handleGenerateDebtPix}
          />
        )}

        <Text style={styles.sectionTitle}>{tb('historyTitle')}</Text>

        <BillingCyclesList
          cycles={cycles}
          isLoadingCycles={isLoadingCycles}
          hasMore={hasMore}
          isGeneratingPix={isGeneratingPix}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          formatDateShort={formatDateShort}
          onGeneratePix={handleGeneratePix}
          onLoadMore={() => loadCycles(true)}
        />
      </View>

      <PixPaymentModal
        visible={showPixModal}
        pixData={pixData}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onCopyPixCode={handleCopyPixCode}
        onClose={closePixModal}
      />
    </View>
  );
};

