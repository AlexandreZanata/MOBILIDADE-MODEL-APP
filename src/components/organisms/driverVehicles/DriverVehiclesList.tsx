import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DriverVehicleCard } from '@/components/molecules/driverVehicles/DriverVehicleCard';
import { useTheme } from '@/context/ThemeContext';
import { tdv } from '@/i18n/driverVehicles';
import { DriverVehicle } from '@/models/driverVehicles/types';
import { spacing, typography } from '@/theme';

interface DriverVehiclesListProps {
  vehicles: DriverVehicle[];
  uploadingVehicleId: string | null;
  isDocumentPending(status: string): boolean;
  onUploadDocument(vehicleId: string): void;
}

export function DriverVehiclesList({
  vehicles,
  uploadingVehicleId,
  isDocumentPending,
  onUploadDocument,
}: DriverVehiclesListProps) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 2 },
    emptyText: { ...typography.body, fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xs },
    emptySubtext: { ...typography.caption, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  });

  if (vehicles.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="car-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyText}>{tdv('emptyTitle')}</Text>
        <Text style={styles.emptySubtext}>{tdv('emptySubtitle')}</Text>
      </View>
    );
  }

  return (
    <>
      {vehicles.map((vehicle) => (
        <DriverVehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          isDocumentPending={isDocumentPending(vehicle.status)}
          isUploading={uploadingVehicleId === vehicle.id}
          onUploadDocument={onUploadDocument}
        />
      ))}
    </>
  );
}
