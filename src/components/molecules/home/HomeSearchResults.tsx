import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeDestination } from '@/models/home/types';
import { spacing, typography, shadows } from '@/theme';
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

export function HomeSearchResults({ visible, isSearching, searchQuery, top, results, onClose, onSelect }: Props) {
  const { colors } = useTheme();
  if (!visible) return null;
  const styles = StyleSheet.create({
    container: {
      position: 'absolute', top, left: spacing.md, right: spacing.md, maxHeight: '40%',
      backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, zIndex: 1000, ...shadows.medium,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
    item: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    name: { ...typography.body, color: colors.textPrimary, fontWeight: '600', marginBottom: spacing.xs },
    address: { ...typography.caption, color: colors.textSecondary },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{th('resultsTitle')}</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {isSearching ? (
        <View style={{ padding: spacing.md, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.placeId}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => (
            <TouchableOpacity style={[styles.item, index === results.length - 1 && { borderBottomWidth: 0 }]} onPress={() => onSelect(item)}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.address} numberOfLines={2}>{item.displayName}</Text>
            </TouchableOpacity>
          )}
        />
      ) : searchQuery.trim() ? (
        <View style={styles.item}>
          <Text style={styles.address}>{th('noResultsInCity')}</Text>
        </View>
      ) : null}
    </View>
  );
}
