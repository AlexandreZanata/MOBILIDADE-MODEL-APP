import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EdgeInsets } from 'react-native-safe-area-context';
import { DriverVehiclesList } from '@/components/organisms/driverVehicles/DriverVehiclesList';
import { useTheme } from '@/context/ThemeContext';
import { tdv } from '@/i18n/driverVehicles';
import { DriverVehicle } from '@/models/driverVehicles/types';
import { borders, shadows, spacing, typography } from '@/theme';

interface DriverVehiclesContentProps {
  insets: EdgeInsets;
  vehicles: DriverVehicle[];
  uploadingVehicleId: string | null;
  isDocumentPending(status: string): boolean;
  onUploadDocument(vehicleId: string): void;
  onAddVehicle(): void;
}

export function DriverVehiclesContent({
  insets,
  vehicles,
  uploadingVehicleId,
  isDocumentPending,
  onUploadDocument,
  onAddVehicle,
}: DriverVehiclesContentProps) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.md,
      paddingTop: Math.max(insets.top, spacing.md),
      paddingBottom: spacing.sm + 90,
    },
    header: { marginBottom: spacing.lg },
    title: { ...typography.h1, fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
    subtitle: { ...typography.body, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
    addButton: {
      position: 'absolute',
      bottom: spacing.sm,
      left: spacing.md,
      right: spacing.md,
      backgroundColor: colors.accent,
      borderRadius: borders.radiusLarge,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      ...shadows.medium,
      shadowColor: colors.shadow,
      zIndex: 10,
    },
    addButtonText: { ...typography.body, fontSize: 16, fontWeight: '700', color: colors.onAccent },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{tdv('screenTitle')}</Text>
          <Text style={styles.subtitle}>{tdv('screenSubtitle')}</Text>
        </View>
        <DriverVehiclesList
          vehicles={vehicles}
          uploadingVehicleId={uploadingVehicleId}
          isDocumentPending={isDocumentPending}
          onUploadDocument={onUploadDocument}
        />
      </ScrollView>
      <TouchableOpacity style={styles.addButton} onPress={onAddVehicle}>
        <Ionicons name="add" size={24} color={colors.onAccent} />
        <Text style={styles.addButtonText}>{tdv('addVehicle')}</Text>
      </TouchableOpacity>
    </View>
  );
}
