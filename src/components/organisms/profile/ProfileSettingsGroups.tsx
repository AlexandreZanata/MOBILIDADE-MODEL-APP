import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { useTheme } from '@/context/ThemeContext';
import { borders, spacing, typography } from '@/theme';
import { ProfileMenuAction, ProfileSettingsGroup } from '@/models/profile/types';

const ROW_MIN_HEIGHT = spacing.lg * 3 + spacing.xs;
const ICON_BOX = spacing.lg + spacing.xs;

export interface ProfileSettingsGroupsProps {
  groups: ProfileSettingsGroup[];
  onRowPress(action: ProfileMenuAction): void;
}

export function ProfileSettingsGroups({ groups, onRowPress }: ProfileSettingsGroupsProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    outer: { marginHorizontal: spacing.md, marginTop: spacing.lg, gap: spacing.lg },
    groupLabel: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    card: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      overflow: 'hidden',
      borderRadius: borders.radiusLarge,
      borderWidth: borders.widthHairline,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: ROW_MIN_HEIGHT,
      paddingHorizontal: spacing.lg,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
    label: { ...typography.body, color: colors.textPrimary, flex: 1 },
    divider: { height: borders.widthHairline, backgroundColor: colors.border, marginLeft: spacing.lg + ICON_BOX + spacing.md },
    rightCluster: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    badge: {
      minWidth: spacing.lg,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borders.radiusFull,
      backgroundColor: colors.accentSoft,
    },
    badgeText: { ...typography.micro, fontSize: typography.label.fontSize, fontWeight: '500', color: colors.accent },
    valueText: { ...typography.caption, color: colors.textSecondary },
  });

  const renderRight = useCallback(
    (right: ProfileSettingsGroup['rows'][0]['right']) => {
      switch (right.type) {
        case 'chevron':
          return <Ionicons name="chevron-forward" size={spacing.md} color={colors.textHint} />;
        case 'toggle':
          return (
            <Switch
              value={right.value}
              onValueChange={(v) => right.onToggle(v)}
              trackColor={{ false: colors.border, true: colors.accentSoft }}
              thumbColor={right.value ? colors.accent : colors.card}
              accessibilityRole="switch"
            />
          );
        case 'badge':
          return (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{String(right.count)}</Text>
            </View>
          );
        case 'badgeAndChevron':
          return (
            <View style={styles.rightCluster}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{String(right.count)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={spacing.md} color={colors.textHint} />
            </View>
          );
        case 'value':
          return (
            <View style={styles.rightCluster}>
              <Text style={styles.valueText}>{right.label}</Text>
              <Ionicons name="chevron-forward" size={spacing.md} color={colors.textHint} />
            </View>
          );
      }
    },
    [colors.accent, colors.accentSoft, colors.border, colors.card, colors.textHint, styles]
  );

  return (
    <View style={styles.outer}>
      {groups.map((group) => (
        <View key={group.id}>
          <Text style={styles.groupLabel}>{group.label}</Text>
          <Card style={styles.card}>
            {group.rows.map((row, index) => {
              const isLast = index === group.rows.length - 1;
              const isToggle = row.right.type === 'toggle';
              const content = (
                <>
                  <View style={styles.rowLeft}>
                    <Ionicons name={row.icon as keyof typeof Ionicons.glyphMap} size={ICON_BOX} color={colors.textSecondary} />
                    <Text style={styles.label}>{row.label}</Text>
                  </View>
                  <View style={styles.rightCluster}>{renderRight(row.right)}</View>
                </>
              );
              return (
                <View key={row.id}>
                  {isToggle ? (
                    <View style={styles.row}>{content}</View>
                  ) : (
                    <Pressable style={styles.row} onPress={() => onRowPress(row.action)} accessibilityRole="button">
                      {content}
                    </Pressable>
                  )}
                  {!isLast ? <View style={styles.divider} /> : null}
                </View>
              );
            })}
          </Card>
        </View>
      ))}
    </View>
  );
}
