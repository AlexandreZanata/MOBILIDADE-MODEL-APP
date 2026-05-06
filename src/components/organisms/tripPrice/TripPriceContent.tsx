import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { spacing, typography } from '@/theme';
import { TripCategoryOption } from '@/models/tripPrice/types';
import { ttp } from '@/i18n/tripPrice';

interface TripPriceColors {
  background: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  border: string;
}

interface TripPriceContentProps {
  colors: TripPriceColors;
  insetsTop: number;
  insetsBottom: number;
  categories: TripCategoryOption[];
  selectedCategoryId: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  hasTooShortDistance: boolean;
  onSelectCategory(categoryId: string): void;
  onConfirm(): void;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TripPriceContent(props: TripPriceContentProps) {
  const styles = createStyles(props.colors, props.insetsTop, props.insetsBottom);

  if (props.isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={props.colors.primary} />
          <Text style={[styles.subtitle, { marginTop: spacing.md }]}>{ttp('loadingPrices')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{ttp('title')}</Text>
          <Text style={styles.subtitle}>{ttp('subtitle')}</Text>
        </View>

        {props.categories.length > 0 ? (
          props.categories.map((category) => {
            const isSelected = props.selectedCategoryId === category.id;
            return (
              <TouchableOpacity key={category.id} onPress={() => props.onSelectCategory(category.id)} activeOpacity={0.8}>
                <Card style={StyleSheet.flatten([styles.categoryCard, isSelected && styles.categoryCardSelected])} selected={isSelected}>
                  <View style={styles.categoryContent}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryHeaderLeft}>
                        <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>
                          {category.name || ttp('fallbackCategory')}
                        </Text>
                        {category.description ? <Text style={styles.categoryDescription}>{category.description}</Text> : null}
                      </View>
                      <View style={styles.categoryPriceContainer}>
                        <Text style={[styles.categoryPrice, isSelected && styles.categoryPriceSelected]}>{formatPrice(category.finalFare)}</Text>
                        <Text style={styles.categoryPriceLabel}>{ttp('finalPrice')}</Text>
                      </View>
                    </View>
                    <View style={styles.categoryDetails}>
                      <View style={styles.categoryDetailItem}>
                        <View style={styles.categoryDetailIcon}>
                          <Ionicons name="time-outline" size={12} color={props.colors.textSecondary} />
                        </View>
                        <Text style={styles.categoryDetailText}>{formatDuration(category.durationSeconds)}</Text>
                      </View>
                      <View style={styles.categoryDetailItem}>
                        <View style={styles.categoryDetailIcon}>
                          <Ionicons name="location-outline" size={12} color={props.colors.textSecondary} />
                        </View>
                        <Text style={styles.categoryDetailText}>{formatDistance(category.distanceKm)}</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color={props.colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              {props.hasTooShortDistance ? ttp('noDestination') : ttp('noCategoriesAvailable')}
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={ttp('confirmRide')}
          onPress={props.onConfirm}
          variant="primary"
          fullWidth
          loading={props.isSubmitting}
          disabled={!props.selectedCategoryId || props.isSubmitting}
        />
      </View>
    </View>
  );
}

function createStyles(colors: TripPriceColors, insetsTop: number, insetsBottom: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    contentContainer: {
      paddingHorizontal: spacing.md,
      paddingTop: Math.max(insetsTop, spacing.lg) + spacing.md,
      paddingBottom: spacing.md,
    },
    header: { marginBottom: spacing.xl },
    title: { ...typography.h1, fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
    subtitle: { ...typography.body, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    categoryCard: { marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
    categoryCardSelected: { borderWidth: 2, borderColor: colors.primary },
    categoryContent: { gap: spacing.sm },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
      gap: spacing.md,
    },
    categoryHeaderLeft: { flex: 1, gap: spacing.xs },
    categoryName: { ...typography.h2, fontSize: 18, lineHeight: 24, color: colors.textPrimary, fontWeight: '700', fontFamily: 'Poppins-Bold' },
    categoryNameSelected: { color: colors.primary },
    categoryDescription: { ...typography.body, fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 2, fontFamily: 'Poppins-Regular' },
    categoryPriceContainer: { alignItems: 'flex-end', gap: 2, minWidth: 100 },
    categoryPrice: { ...typography.h2, fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.textPrimary, fontFamily: 'Poppins-Bold' },
    categoryPriceSelected: { color: colors.primary },
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
    categoryDetailItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    categoryDetailIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: hexToRgba(colors.textSecondary, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryDetailText: { ...typography.caption, fontSize: 13, color: colors.textSecondary, fontFamily: 'Poppins-Medium' },
    emptyState: { padding: spacing.lg, alignItems: 'center' },
    emptyStateText: { marginTop: spacing.md, color: colors.textSecondary, textAlign: 'center' },
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insetsBottom, spacing.md),
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
}
