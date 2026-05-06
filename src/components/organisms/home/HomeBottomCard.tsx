import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme';
import { HomeDestination } from '@/models/home/types';
import { th } from '@/i18n/home';

interface Props {
  destination: HomeDestination | null;
  isMinimized: boolean;
  onToggleMinimized: () => void;
  onRequestTrip: () => void;
  onLayoutHeight: (height: number) => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function HomeBottomCard({ destination, isMinimized, onToggleMinimized, onRequestTrip, onLayoutHeight }: Props) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    card: { position: 'absolute', bottom: 8, left: spacing.md, right: spacing.md },
    title: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.textPrimary, fontFamily: 'Poppins-SemiBold' },
    info: { marginBottom: spacing.md, gap: spacing.md },
    destinationWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: hexToRgba(colors.primary, 0.08), alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    label: { fontSize: 11, lineHeight: 14, fontWeight: '500', color: colors.textSecondary, fontFamily: 'Poppins-SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
    value: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: colors.textPrimary, fontFamily: 'Poppins-Regular', flex: 1 },
  });

  return (
    <Card style={styles.card} onLayout={(event) => onLayoutHeight(event.nativeEvent.layout.height)}>
      <View style={{ marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 }}>
            <Ionicons name="car-outline" size={20} color={colors.primary} />
            <Text style={styles.title}>{th('newRideTitle')}</Text>
          </View>
          <TouchableOpacity onPress={onToggleMinimized}>
            <Ionicons name={isMinimized ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {!isMinimized && (
        <View style={styles.info}>
          <View style={styles.destinationWrap}>
            <View style={styles.iconCircle}><Ionicons name="location" size={18} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{th('destinationLabel')}</Text>
              <Text style={styles.value} numberOfLines={2}>{destination?.displayName || th('selectDestination')}</Text>
            </View>
          </View>
          {destination && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textSecondary }}>{th('estimatedTimeLabel')}</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{th('estimatedTimeValue')}</Text>
            </View>
          )}
        </View>
      )}

      <Button title={th('requestTripButton')} onPress={onRequestTrip} variant="secondary" fullWidth style={{ marginTop: spacing.xs }} />
    </Card>
  );
}
