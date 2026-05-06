import React, { memo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import { Avatar } from '@/components/atoms/Avatar';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography } from '@/theme';
import { DriverTripViewData } from '@/models/driverTripInProgress/types';
import { tdt } from '@/i18n/driverTripInProgress';
import { apiService } from '@/services/api';

interface Props {
  view: DriverTripViewData;
  onLayoutHeight: (height: number) => void;
  onToggleMinimized: () => void;
  onPrimaryAction: () => void;
  onOpenCancelModal: () => void;
}

export const DriverTripInProgressInfoCard = memo((props: Props) => {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    container: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.sm },
    sectionTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    label: { ...typography.caption, color: colors.textSecondary },
    value: { ...typography.body, color: colors.textPrimary },
  });

  return (
    <Card style={styles.container} onLayout={(event) => props.onLayoutHeight(event.nativeEvent.layout.height)}>
      <View style={[styles.row, { justifyContent: 'space-between', marginBottom: spacing.xs }]}>
        <Text style={styles.sectionTitle}>{tdt('tripInProgressTitle')}</Text>
        <TouchableOpacity onPress={props.onToggleMinimized}>
          <Ionicons name={props.view.isMinimized ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {!props.view.isMinimized && (
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 180 }}>
          {props.view.passengerInfo && (
            <View style={[styles.row, { marginBottom: spacing.sm }]}>
              <Avatar
                uri={props.view.passengerInfo.photoUrl || (props.view.passengerInfo.id ? apiService.getProfilePhotoUrl(props.view.passengerInfo.id) : undefined)}
                name={props.view.passengerInfo.name}
                size={40}
              />
              <View>
                <Text style={styles.value}>{props.view.passengerInfo.name}</Text>
                {props.view.passengerInfo.phone ? <Text style={styles.label}>{props.view.passengerInfo.phone}</Text> : null}
              </View>
            </View>
          )}
          <Text style={styles.label}>{tdt('originLabel')}</Text>
          <Text style={[styles.value, { marginBottom: spacing.sm }]} numberOfLines={2}>{props.view.originAddress}</Text>
        </ScrollView>
      )}
      {props.view.statusButton ? (
        <Button
          title={props.view.statusButton.title}
          onPress={props.onPrimaryAction}
          variant={props.view.statusButton.variant}
          fullWidth
          disabled={props.view.isUpdating}
        />
      ) : null}
      {props.view.canCancelRide ? (
        <Button title={tdt('cancelRideButton')} onPress={props.onOpenCancelModal} variant="ghost" fullWidth disabled={props.view.isUpdating} />
      ) : null}
    </Card>
  );
});
