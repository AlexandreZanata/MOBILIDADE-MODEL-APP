import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { useTheme } from '@/context/ThemeContext';
import { PaymentBrand, PaymentMethod } from '@/models/paymentMethod/types';
import { borders, spacing, typography } from '@/theme';
import { tpm } from '@/i18n/paymentMethod';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  isSelected: boolean;
  brands: PaymentBrand[];
  selectedBrand: string | null;
  isLoadingBrands: boolean;
  onPressMethod(methodId: string): void;
  onPressBrand(brandId: string): void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getMethodIcon(type: PaymentMethod['type']): keyof typeof Ionicons.glyphMap {
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
}

export function PaymentMethodCard({
  method,
  isSelected,
  brands,
  selectedBrand,
  isLoadingBrands,
  onPressMethod,
  onPressBrand,
}: PaymentMethodCardProps) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    wrapper: { marginBottom: spacing.md },
    card: { borderWidth: 1, borderColor: colors.border },
    selectedCard: { borderWidth: 2, borderColor: colors.primary },
    content: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: borders.radiusMedium,
      backgroundColor: hexToRgba(colors.primary, isSelected ? 0.15 : 0.08),
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { flex: 1, gap: spacing.xs },
    name: { ...typography.h2, fontSize: 18, lineHeight: 24, color: isSelected ? colors.primary : colors.textPrimary },
    description: { ...typography.body, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
    brandsContainer: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: hexToRgba(colors.border, 0.3) },
    brandsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
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
    brandCardSelected: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: hexToRgba(colors.primary, 0.06) },
    brandName: { ...typography.body, fontSize: 12, color: colors.textPrimary },
    brandNameSelected: { color: colors.primary, fontWeight: '600' },
    loadingBrandsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs, gap: spacing.xs },
    loadingBrandsText: { ...typography.body, fontSize: 12, color: colors.textSecondary },
  });

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={() => onPressMethod(method.id)} activeOpacity={0.8}>
        <Card style={StyleSheet.flatten([styles.card, isSelected ? styles.selectedCard : null])} selected={isSelected}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name={getMethodIcon(method.type)} size={28} color={isSelected ? colors.primary : colors.textSecondary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{method.name}</Text>
              {method.description ? <Text style={styles.description}>{method.description}</Text> : null}
            </View>
          </View>
          {isSelected && method.requiresCardBrand ? (
            <View style={styles.brandsContainer}>
              {isLoadingBrands ? (
                <View style={styles.loadingBrandsContainer}>
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                  <Text style={styles.loadingBrandsText}>{tpm('loadingBrands')}</Text>
                </View>
              ) : (
                <View style={styles.brandsRow}>
                  {brands.map((brand) => {
                    const brandSelected = selectedBrand === brand.id;
                    return (
                      <TouchableOpacity key={brand.id} onPress={() => onPressBrand(brand.id)} activeOpacity={0.7}>
                        <View style={[styles.brandCard, brandSelected && styles.brandCardSelected]}>
                          <Text style={[styles.brandName, brandSelected && styles.brandNameSelected]}>{brand.name}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ) : null}
        </Card>
      </TouchableOpacity>
    </View>
  );
}
