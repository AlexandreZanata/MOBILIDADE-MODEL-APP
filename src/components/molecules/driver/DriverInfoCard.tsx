import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme';
import { DriverInfoItem } from '@/models/driver/types';

interface DriverInfoCardProps {
  title: string;
  iconName: 'car-outline' | 'cube-outline';
  items: DriverInfoItem[];
  highlightedIcon: 'location' | null;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function DriverInfoCard({ title, iconName, items, highlightedIcon }: DriverInfoCardProps) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginHorizontal: spacing.md,
          marginBottom: spacing.md,
        },
        header: {
          marginBottom: spacing.md,
          paddingBottom: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerContent: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs + 2,
        },
        title: {
          fontSize: 15,
          lineHeight: 20,
          fontWeight: '600',
          color: colors.textPrimary,
          fontFamily: 'Poppins-SemiBold',
        },
        info: {
          gap: spacing.sm,
        },
        item: {
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        itemContent: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
        },
        iconContainer: {
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        },
        highlightedIconContainer: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        },
        itemText: {
          flex: 1,
          gap: 2,
        },
        label: {
          fontSize: 11,
          lineHeight: 14,
          fontWeight: '500',
          color: colors.textSecondary,
          fontFamily: 'Poppins-SemiBold',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        value: {
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '400',
          color: colors.textPrimary,
          fontFamily: 'Poppins-Regular',
        },
      }),
    [colors]
  );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name={iconName} size={20} color={colors.primary} />
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      <View style={styles.info}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isHighlighted = highlightedIcon === item.icon;
          const backgroundColor = isHighlighted
            ? hexToRgba(colors.primary, 0.08)
            : hexToRgba(colors.textSecondary, 0.06);

          return (
            <View key={`${item.label}-${item.value}`} style={[styles.item, isLast && { borderBottomWidth: 0 }]}>
              <View style={styles.itemContent}>
                <View
                  style={[
                    isHighlighted ? styles.highlightedIconContainer : styles.iconContainer,
                    { backgroundColor },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={isHighlighted ? 18 : 16}
                    color={isHighlighted ? colors.primary : colors.textSecondary}
                  />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.value} numberOfLines={item.icon === 'location' ? 2 : 1}>
                    {item.value}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
