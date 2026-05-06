import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
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
    handleShowCurrentPix,
    handleCopyPixCode,
    closePixModal,
  } = useDriverBilling();

  const formatCurrency = useMemo(
    () =>
      (value: number): string =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
    []
  );

  const formatDate = useMemo(
    () =>
      (dateString: string): string =>
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
    () =>
      (dateString: string): string =>
        new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(dateString)),
    []
  );

  const HEADER_HEIGHT = 56;
  const topOffset = Math.max(insets.top, spacing.lg);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        // Status-bar background fill
        topSafeArea: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: colors.background,
          zIndex: 10,
        },
        backButton: {
          position: 'absolute',
          top: topOffset + spacing.sm,
          left: spacing.md,
          width: HEADER_HEIGHT,
          height: HEADER_HEIGHT,
          borderRadius: HEADER_HEIGHT / 2,
          backgroundColor: colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.small,
          shadowColor: colors.shadow,
          borderWidth: 1,
          borderColor: colors.border,
          zIndex: 20,
        },
        // Scrollable area starts below the back button
        scrollView: {
          flex: 1,
          marginTop: topOffset + spacing.sm + HEADER_HEIGHT + spacing.sm,
        },
        scrollContent: {
          paddingHorizontal: spacing.md,
          paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl,
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
        // The FlatList needs a fixed height so it can scroll independently
        listWrapper: {
          flex: 1,
          minHeight: 300,
        },
      }),
    [colors, insets.bottom, insets.top, topOffset]
  );

  // ─── Loading state ────────────────────────────────────────────────────────

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

  // ─── Main content ─────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Status-bar background fill */}
      <View style={styles.topSafeArea} />

      {/* Back button — floats above scroll content */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={tb('backButton')}
      >
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>

      {/*
       * ScrollView wraps the header + summary card + section title.
       * BillingCyclesList (FlatList) is rendered inside with nestedScrollEnabled
       * so it can grow to its full content height within the outer scroll.
       */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
            onShowCurrentPix={handleShowCurrentPix}
          />
        )}

        <Text style={styles.sectionTitle}>{tb('historyTitle')}</Text>

        {/* Wrap FlatList in a View with a minimum height so it renders */}
        <View style={styles.listWrapper}>
          <BillingCyclesList
            cycles={cycles}
            isLoadingCycles={isLoadingCycles}
            hasMore={hasMore}
            isGeneratingPix={isGeneratingPix}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            formatDateShort={formatDateShort}
            onGeneratePix={handleGeneratePix}
            onLoadMore={() => void loadCycles(true)}
          />
        </View>
      </ScrollView>

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
