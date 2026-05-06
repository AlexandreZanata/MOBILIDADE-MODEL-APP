import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { useTheme } from '@/context/ThemeContext';
import { borders, spacing, typography } from '@/theme';
import { tp } from '@/i18n/profile';

export interface ProfileIdentitySummaryCardProps {
  name: string;
  email: string;
}

const ICON_BOX = spacing.lg + spacing.xs;

export function ProfileIdentitySummaryCard({ name, email }: ProfileIdentitySummaryCardProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    wrap: { marginHorizontal: spacing.md, marginTop: spacing.md },
    card: {
      borderWidth: borders.widthHairline,
      borderColor: colors.border,
      borderRadius: borders.radiusLarge,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    divider: { height: borders.widthHairline, backgroundColor: colors.border, marginLeft: ICON_BOX + spacing.md },
    textCol: { flex: 1 },
    label: { ...typography.caption, color: colors.textSecondary },
    value: { ...typography.body, color: colors.textPrimary, fontWeight: '500' },
  });

  return (
    <View style={styles.wrap}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="person-outline" size={ICON_BOX} color={colors.textSecondary} />
          <View style={styles.textCol}>
            <Text style={styles.label}>{tp('name')}</Text>
            <Text style={styles.value}>{name}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={ICON_BOX} color={colors.textSecondary} />
          <View style={styles.textCol}>
            <Text style={styles.label}>{tp('email')}</Text>
            <Text style={styles.value}>{email}</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}
