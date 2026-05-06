import React, { memo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeDestination } from '@/models/home/types';
import { borders, shadows, spacing, typography } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { th } from '@/i18n/home';

interface Props {
  visible: boolean;
  isSearching: boolean;
  searchQuery: string;
  top: number;
  results: HomeDestination[];
  onClose: () => void;
  onSelect: (item: HomeDestination) => void;
}

const ResultItem = memo(function ResultItem({
  item,
  isLast,
  onSelect,
}: {
  item: HomeDestination;
  isLast: boolean;
  onSelect: (item: HomeDestination) => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        resultItemStyles.item,
        { borderBottomColor: colors.border },
        isLast && { borderBottomWidth: 0 },
      ]}
      onPress={() => onSelect(item)}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      <View style={[resultItemStyles.iconBox, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="location-outline" size={16} color={colors.accent} />
      </View>
      <View style={resultItemStyles.textBlock}>
        <Text
          style={[resultItemStyles.name, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={[resultItemStyles.address, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.displayName}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const resultItemStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    minHeight: 56,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: borders.radiusSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  name: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  address: {
    ...typography.caption,
  },
});

export function HomeSearchResults({
  visible,
  isSearching,
  searchQuery,
  top,
  results,
  onClose,
  onSelect,
}: Props) {
  const { colors, isDark } = useTheme();

  if (!visible) return null;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top,
      left: spacing.lg,
      right: spacing.lg,
      maxHeight: '45%',
      backgroundColor: colors.card,
      borderRadius: borders.radiusLarge,
      zIndex: 200,
      overflow: 'hidden',
      ...(isDark
        ? { borderWidth: 0.5, borderColor: colors.border }
        : shadows.medium),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    title: {
      ...typography.subtitle,
      color: colors.textPrimary,
    },
    closeBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingContainer: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyContainer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    emptyText: {
      ...typography.body,
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{th('resultsTitle')}</Text>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar resultados"
        >
          <Ionicons name="close" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.placeId}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => (
            <ResultItem
              item={item}
              isLast={index === results.length - 1}
              onSelect={onSelect}
            />
          )}
        />
      ) : searchQuery.trim() ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{th('noResultsInCity')}</Text>
        </View>
      ) : null}
    </View>
  );
}
