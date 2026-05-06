import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { borders, spacing, typography } from '@/theme';
import { ServiceOption } from '@/models/serviceSelection/types';
import { tss } from '@/i18n/serviceSelection';

interface ServiceSelectionColors {
  background: string;
  backgroundSecondary: string;
  textPrimary: string;
  textSecondary: string;
  secondary: string;
  border: string;
}

interface ServiceSelectionContentProps {
  colors: ServiceSelectionColors;
  insetsTop: number;
  insetsBottom: number;
  services: ServiceOption[];
  selectedServiceId: string;
  onSelectService(serviceId: string): void;
  onConfirm(): void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ServiceSelectionContent(props: ServiceSelectionContentProps) {
  const styles = createStyles(props.colors, props.insetsTop, props.insetsBottom);

  const renderServiceCard = (service: ServiceOption) => {
    const isSelected = props.selectedServiceId === service.id;
    return (
      <TouchableOpacity key={service.id} onPress={() => props.onSelectService(service.id)} activeOpacity={0.8}>
        <Card
          style={StyleSheet.flatten([styles.serviceCard, isSelected && styles.serviceCardSelected])}
          selected={isSelected}
        >
          <View style={styles.serviceContent}>
            <View style={[styles.serviceIconContainer, isSelected && styles.serviceIconContainerSelected]}>
              <Ionicons name={service.icon} size={28} color={isSelected ? props.colors.secondary : props.colors.textSecondary} />
            </View>
            <View style={styles.serviceInfo}>
              <View style={styles.serviceHeader}>
                <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>{service.name}</Text>
                {isSelected ? (
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
              <View style={styles.serviceDetails}>
                <Text style={styles.serviceTime}>{service.time}</Text>
                <Text style={[styles.servicePrice, isSelected && styles.servicePriceSelected]}>{service.price}</Text>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={Platform.OS === 'ios' ? styles.contentContainer : undefined}
      >
        {Platform.OS === 'ios' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContainer}>
            {props.services.map(renderServiceCard)}
          </ScrollView>
        ) : (
          <View style={styles.contentContainer}>{props.services.map(renderServiceCard)}</View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button title={tss('confirmButton')} onPress={props.onConfirm} variant="secondary" fullWidth />
      </View>
    </View>
  );
}

function createStyles(colors: ServiceSelectionColors, insetsTop: number, insetsBottom: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    contentContainer: {
      paddingHorizontal: spacing.md,
      paddingTop: Math.max(insetsTop, spacing.lg) + spacing.md,
      paddingBottom: spacing.md,
    },
    horizontalScrollContainer: { paddingHorizontal: spacing.md, gap: spacing.xs },
    serviceCard: {
      marginBottom: Platform.OS === 'ios' ? 0 : spacing.xs,
      width: Platform.OS === 'ios' ? 320 : undefined,
      borderWidth: 1,
      borderColor: colors.border,
    },
    serviceCardSelected: { borderWidth: 2, borderColor: colors.secondary },
    serviceContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    serviceIconContainer: {
      width: 64,
      height: 64,
      borderRadius: borders.radiusMedium,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    serviceIconContainerSelected: { backgroundColor: hexToRgba(colors.secondary, 0.1) },
    serviceInfo: { flex: 1, gap: spacing.xs },
    serviceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    serviceName: { ...typography.h2, fontSize: 18, lineHeight: 24, color: colors.textPrimary, flex: 1 },
    serviceNameSelected: { color: colors.secondary },
    checkIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    serviceDetails: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    serviceTime: { ...typography.caption, fontSize: 13, color: colors.textSecondary, flex: 1 },
    servicePrice: { ...typography.h2, fontSize: 20, lineHeight: 28, fontWeight: '700', color: colors.textPrimary },
    servicePriceSelected: { color: colors.secondary },
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
