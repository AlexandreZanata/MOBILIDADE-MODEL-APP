import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { shadows, spacing, typography } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { useDriverBilling } from '@/hooks/billing/useDriverBilling';
import { DriverBillingSummaryCard } from '@/components/organisms/billing/DriverBillingSummaryCard';
import { BillingCycleCard } from '@/components/molecules/billing/BillingCycleCard';
import { PixPaymentModal } from '@/components/organisms/billing/PixPaymentModal';
import Button from '@/components/atoms/Button';
import { tb } from '@/i18n/billing';
import { BillingCycle } from '@/models/billing/types';

type RootStackParamList = { DriverBilling: undefined };

interface DriverBillingScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'DriverBilling'>;
}

const BACK_BTN_SIZE = 48;

export const DriverBillingScreen: React.FC<DriverBillingScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const {
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

  // ─── Formatters (stable references) ──────────────────────────────────────

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
    []
  );

  const formatDate = useCallback(
    (dateString: string) =>
      new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateString)),
    []
  );

  const formatDateShort = useCallback(
    (dateString: string) =>
      new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(dateString)),
    []
  );

  // ─── Styles ───────────────────────────────────────────────────────────────

  const topOffset = Math.max(insets.top, spacing.lg);
  const listTopOffset = topOffset + spacing.sm + BACK_BTN_SIZE + spacing.sm;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
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
          width: BACK_BTN_SIZE,
          height: BACK_BTN_SIZE,
          borderRadius: BACK_BTN_SIZE / 2,
          backgroundColor: colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.small,
          shadowColor: colors.shadow,
          borderWidth: 1,
          borderColor: colors.border,
          zIndex: 20,
        },
        // The FlatList starts below the floating back button
        list: {
          flex: 1,
          marginTop: listTopOffset,
        },
        listContent: {
          paddingHorizontal: spacing.md,
          paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl,
        },
        // ── ListHeaderComponent ──
        listHeader: {
          paddingTop: spacing.md,
        },
        pageTitle: {
          ...typography.h1,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: spacing.xs,
        },
        pageSubtitle: {
          ...typography.body,
          color: colors.textSecondary,
          marginBottom: spacing.lg,
        },
        sectionTitle: {
          ...typography.h2,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: spacing.md,
        },
        // ── Loading / empty states ──
        centeredState: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.xl,
        },
        stateText: {
          ...typography.body,
          color: colors.textSecondary,
          marginTop: spacing.md,
          textAlign: 'center',
        },
        emptyState: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.xxl,
        },
        emptyStateIcon: {
          marginBottom: spacing.md,
        },
        loadingMore: {
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        },
      }),
    [colors, insets.bottom, insets.top, listTopOffset, topOffset]
  );

  // ─── FlatList pieces ──────────────────────────────────────────────────────

  const renderItem = useCallback<ListRenderItem<BillingCycle>>(
    ({ item }) => (
      <BillingCycleCard
        cycle={item}
        isGeneratingPix={isGeneratingPix}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        formatDateShort={formatDateShort}
        onGeneratePix={handleGeneratePix}
      />
    ),
    [formatCurrency, formatDate, formatDateShort, handleGeneratePix, isGeneratingPix]
  );

  const keyExtractor = useCallback((item: BillingCycle) => item.id, []);

  /**
   * Everything above the cycle cards lives here — title, summary card, section
   * heading. Keeping it in ListHeaderComponent means there is exactly one
   * scrollable container and no VirtualizedList nesting warning.
   */
  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.listHeader}>
        <Text style={styles.pageTitle}>{tb('title')}</Text>
        <Text style={styles.pageSubtitle}>{tb('subtitle')}</Text>

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
      </View>
    ),
    [
      billingStatus,
      formatCurrency,
      formatDateShort,
      handleGenerateDebtPix,
      handleShowCurrentPix,
      isGeneratingPix,
      styles,
      totalPending,
    ]
  );

  const ListEmptyComponent = useMemo(
    () =>
      isLoadingCycles ? (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="receipt-outline"
            size={spacing.xxl + spacing.md}
            color={colors.textSecondary}
            style={styles.emptyStateIcon}
          />
          <Text style={styles.stateText}>{tb('emptyCycles')}</Text>
        </View>
      ),
    [colors.primary, colors.textSecondary, isLoadingCycles, styles]
  );

  const ListFooterComponent = useMemo(
    () =>
      hasMore ? (
        <Button
          title={tb('loadMore')}
          onPress={() => void loadCycles(true)}
          variant="secondary"
          fullWidth
          disabled={isLoadingCycles}
        />
      ) : null,
    [hasMore, isLoadingCycles, loadCycles]
  );

  // ─── Full-screen loading state ────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>{tb('loading')}</Text>
        </View>
      </View>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Status-bar background fill */}
      <View style={styles.topSafeArea} />

      {/* Floating back button — sits above the list */}
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
       * Single FlatList owns all scrolling.
       * ListHeaderComponent renders the page title, summary card, and section
       * heading — no ScrollView wrapper needed or used.
       */}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={cycles}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        initialNumToRender={8}
        windowSize={7}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
      />

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
