import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, ListRenderItem, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/atoms/Button';
import { useTheme } from '@/context/ThemeContext';
import { tb } from '@/i18n/billing';
import { BillingCycle } from '@/models/billing/types';
import { spacing, typography } from '@/theme';
import { BillingCycleCard } from '@/components/molecules/billing/BillingCycleCard';

interface BillingCyclesListProps {
  cycles: BillingCycle[];
  isLoadingCycles: boolean;
  hasMore: boolean;
  isGeneratingPix: boolean;
  formatCurrency(value: number): string;
  formatDate(value: string): string;
  formatDateShort(value: string): string;
  onGeneratePix(cycle: BillingCycle): void;
  onLoadMore(): void;
}

export function BillingCyclesList({
  cycles,
  isLoadingCycles,
  hasMore,
  isGeneratingPix,
  formatCurrency,
  formatDate,
  formatDateShort,
  onGeneratePix,
  onLoadMore,
}: BillingCyclesListProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors.textSecondary);

  const renderItem = useCallback<ListRenderItem<BillingCycle>>(
    ({ item }) => (
      <BillingCycleCard
        cycle={item}
        isGeneratingPix={isGeneratingPix}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        formatDateShort={formatDateShort}
        onGeneratePix={onGeneratePix}
      />
    ),
    [formatCurrency, formatDate, formatDateShort, isGeneratingPix, onGeneratePix]
  );

  const keyExtractor = useCallback((item: BillingCycle) => item.id, []);

  const ListEmptyComponent = isLoadingCycles ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  ) : (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={spacing.xxl + spacing.md} color={colors.textSecondary} style={styles.emptyStateIcon} />
      <Text style={styles.emptyStateText}>{tb('emptyCycles')}</Text>
    </View>
  );

  const ListFooterComponent = hasMore ? (
    <Button
      title={tb('loadMore')}
      onPress={onLoadMore}
      variant="secondary"
      fullWidth
      disabled={isLoadingCycles}
    />
  ) : null;

  return (
    <FlatList
      data={cycles}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      initialNumToRender={6}
      windowSize={7}
      maxToRenderPerBatch={8}
      updateCellsBatchingPeriod={50}
    />
  );
}

const createStyles = (textSecondary: string) =>
  StyleSheet.create({
    listContent: {
      paddingBottom: spacing.xl,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
    },
    emptyStateIcon: {
      marginBottom: spacing.md,
    },
    emptyStateText: {
      ...typography.body,
      color: textSecondary,
      textAlign: 'center',
    },
  });
