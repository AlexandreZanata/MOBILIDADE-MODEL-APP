import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography } from '@/theme';
import { ProfileMenuItem } from '@/models/profile/types';
import { tp } from '@/i18n/profile';

interface ProfileMenuCardProps {
  items: ProfileMenuItem[];
  onAction(action: ProfileMenuItem['action']): void;
}

export function ProfileMenuCard({ items, onAction }: ProfileMenuCardProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    wrapper: { marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.md },
    title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.md },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    label: { ...typography.body, color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.border },
    badge: {
      minWidth: spacing.lg,
      height: spacing.lg,
      borderRadius: spacing.lg,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
    },
    badgeText: { ...typography.caption, color: colors.card },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{tp('menuTitle')}</Text>
      <Card>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <View key={item.id}>
              <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => onAction(item.action)}>
                <View style={styles.rowLeft}>
                  <Ionicons name={item.icon} size={spacing.md + spacing.xs} color={colors.primary} />
                  <Text style={styles.label}>{item.title}</Text>
                </View>
                <View style={styles.rowRight}>
                  {item.badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                  {item.showChevron ? (
                    <Ionicons name="chevron-forward" size={spacing.md + spacing.xs} color={colors.textSecondary} />
                  ) : null}
                </View>
              </TouchableOpacity>
              {!isLast && <View style={styles.divider} />}
            </View>
          );
        })}
      </Card>
    </View>
  );
}
