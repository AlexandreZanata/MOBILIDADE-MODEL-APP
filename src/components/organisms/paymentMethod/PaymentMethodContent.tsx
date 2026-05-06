import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/atoms/Button';
import { PaymentMethodCard } from '@/components/molecules/paymentMethod/PaymentMethodCard';
import { useTheme } from '@/context/ThemeContext';
import { tpm } from '@/i18n/paymentMethod';
import { PaymentBrand, PaymentMethod } from '@/models/paymentMethod/types';
import { spacing, typography } from '@/theme';

interface PaymentMethodContentProps {
  insets: EdgeInsets;
  methods: PaymentMethod[];
  brands: PaymentBrand[];
  selectedMethod: string | null;
  selectedBrand: string | null;
  isLoadingMethods: boolean;
  isLoadingBrands: boolean;
  isSubmitting: boolean;
  onSelectMethod(methodId: string): void;
  onSelectBrand(brandId: string): void;
  onConfirm(): void;
}

export function PaymentMethodContent({
  insets,
  methods,
  brands,
  selectedMethod,
  selectedBrand,
  isLoadingMethods,
  isLoadingBrands,
  isSubmitting,
  onSelectMethod,
  onSelectBrand,
  onConfirm,
}: PaymentMethodContentProps) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    contentContainer: {
      paddingHorizontal: spacing.md,
      paddingTop: Math.max(insets.top, spacing.lg) + spacing.md,
      paddingBottom: spacing.md,
    },
    header: { marginBottom: spacing.xl },
    title: { ...typography.h1, fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
    subtitle: { ...typography.body, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { padding: spacing.lg, alignItems: 'center' },
    emptyText: { marginTop: spacing.md, color: colors.textSecondary, textAlign: 'center' },
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.md),
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });

  if (isLoadingMethods) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.subtitle, { marginTop: spacing.md }]}>{tpm('loadingMethods')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{tpm('screenTitle')}</Text>
          <Text style={styles.subtitle}>{tpm('screenSubtitle')}</Text>
        </View>
        {methods.length > 0 ? (
          methods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              isSelected={selectedMethod === method.id}
              brands={brands}
              selectedBrand={selectedBrand}
              isLoadingBrands={isLoadingBrands}
              onPressMethod={onSelectMethod}
              onPressBrand={onSelectBrand}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>{tpm('noMethodsAvailable')}</Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={isSubmitting ? tpm('creatingRide') : tpm('confirmRide')}
          onPress={onConfirm}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
      </View>
    </View>
  );
}
