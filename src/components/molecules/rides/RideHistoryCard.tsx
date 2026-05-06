import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/atoms/Avatar';
import { spacing, typography, shadows } from '@/theme';

interface RideHistoryCardProps {
  colors: {
    card: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    primary: string;
    status: { success: string; error: string; warning: string };
  };
  name: string;
  dateText: string;
  priceText: string;
  distanceText: string;
  durationText: string;
  status: string;
  photoUrl?: string;
  onPress(): void;
}

function getStatusColor(status: string, colors: RideHistoryCardProps['colors']): string {
  const value = status.toUpperCase();
  if (['CONCLUIDA', 'COMPLETED', 'CORRIDA_FINALIZADA'].includes(value)) return colors.status.success;
  if (['CANCELADA_MOTORISTA', 'CANCELADA_PASSAGEIRO', 'CANCELLED', 'CANCELED_BY_DRIVER', 'CANCELED_BY_PASSENGER', 'NO_SHOW', 'EXPIRED', 'EXPIRADA'].includes(value)) {
    return colors.status.error;
  }
  if (['SOLICITADA', 'REQUESTED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'IN_PROGRESS', 'WAITING_AT_DESTINATION'].includes(value)) {
    return colors.status.warning;
  }
  return colors.textSecondary;
}

function getStatusText(status: string): string {
  const value = status.toUpperCase();
  const map: Record<string, string> = {
    CONCLUIDA: 'Concluída',
    COMPLETED: 'Concluída',
    CORRIDA_FINALIZADA: 'Concluída',
    CANCELADA_MOTORISTA: 'Cancelada pelo motorista',
    CANCELADA_PASSAGEIRO: 'Cancelada pelo passageiro',
    CANCELLED: 'Cancelada',
    CANCELED_BY_DRIVER: 'Cancelada',
    CANCELED_BY_PASSENGER: 'Cancelada pelo passageiro',
    NO_SHOW: 'Não compareceu',
    EXPIRED: 'Expirada',
    EXPIRADA: 'Expirada',
    SOLICITADA: 'Solicitada',
    REQUESTED: 'Solicitada',
    DRIVER_ASSIGNED: 'Motorista atribuído',
    DRIVER_ARRIVING: 'Motorista chegando',
    DRIVER_ARRIVED: 'Motorista chegou',
    IN_PROGRESS: 'Em andamento',
    WAITING_AT_DESTINATION: 'Aguardando no destino',
  };
  return map[value] ?? status;
}

export function RideHistoryCard(props: RideHistoryCardProps) {
  const styles = createStyles(props.colors);
  const statusColor = getStatusColor(props.status, props.colors);

  return (
    <TouchableOpacity onPress={props.onPress} activeOpacity={0.7}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Avatar uri={props.photoUrl} name={props.name} size={44} />
          <View style={styles.mainInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{props.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{getStatusText(props.status)}</Text>
              </View>
            </View>
            <Text style={styles.date}>{props.dateText}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.details}>
          <View style={styles.metaContainer}>
            {Boolean(props.distanceText) && (
              <View style={styles.metaItem}>
                <Ionicons name="navigate-outline" size={14} color={props.colors.primary} />
                <Text style={styles.metaText}>{props.distanceText}</Text>
              </View>
            )}
            {Boolean(props.durationText) && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={props.colors.primary} />
                <Text style={styles.metaText}>{props.durationText}</Text>
              </View>
            )}
          </View>
          <Text style={styles.price}>{props.priceText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function createStyles(colors: RideHistoryCardProps['colors']) {
  return StyleSheet.create({
    card: { marginBottom: spacing.xs, borderRadius: 14, backgroundColor: colors.card, padding: spacing.md, ...shadows.small },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    mainInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
    name: { ...typography.h2, fontSize: 15, color: colors.textPrimary, flex: 1 },
    statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
    statusText: { ...typography.caption, fontWeight: '700', fontSize: 10, textTransform: 'uppercase' },
    date: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xs, opacity: 0.4 },
    details: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metaContainer: { flexDirection: 'row', gap: spacing.sm },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    metaText: { ...typography.caption, color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
    price: { ...typography.h2, color: colors.primary, fontSize: 16, fontWeight: '800' },
  });
}
