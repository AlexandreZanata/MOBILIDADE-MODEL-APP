import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { DriverVehicleStatusBadge } from '@/components/molecules/driverVehicles/DriverVehicleStatusBadge';
import { useTheme } from '@/context/ThemeContext';
import { tdv } from '@/i18n/driverVehicles';
import { DriverVehicle } from '@/models/driverVehicles/types';
import { spacing, typography } from '@/theme';

interface DriverVehicleCardProps {
  vehicle: DriverVehicle;
  isDocumentPending: boolean;
  isUploading: boolean;
  onUploadDocument(vehicleId: string): void;
}

export function DriverVehicleCard({ vehicle, isDocumentPending, isUploading, onUploadDocument }: DriverVehicleCardProps) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    card: { marginBottom: spacing.md },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    title: {
      ...typography.h2,
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
    },
    info: { gap: spacing.xs },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    label: { ...typography.caption, fontSize: 12, color: colors.textSecondary, minWidth: 80 },
    value: { ...typography.body, fontSize: 14, fontWeight: '500', color: colors.textPrimary, flex: 1 },
    uploadButton: {
      marginTop: spacing.md,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    uploadButtonText: { ...typography.body, fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  });

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {vehicle.brand} {vehicle.model}
        </Text>
        <DriverVehicleStatusBadge status={vehicle.status} />
      </View>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.label}>{tdv('plateLabel')}</Text>
          <Text style={styles.value}>{vehicle.licensePlate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{tdv('yearInfoLabel')}</Text>
          <Text style={styles.value}>{vehicle.year}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{tdv('colorInfoLabel')}</Text>
          <Text style={styles.value}>{vehicle.color}</Text>
        </View>
      </View>
      {isDocumentPending ? (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => onUploadDocument(vehicle.id)}
          disabled={isUploading}
          activeOpacity={0.8}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="document-attach-outline" size={18} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>{tdv('uploadCrlv')}</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}
    </Card>
  );
}
