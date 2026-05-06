import React, { forwardRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { th } from '@/i18n/home';

interface Props {
  query: string;
  isSearching: boolean;
  showHelperText: boolean;
  onChangeQuery: (text: string) => void;
  onClear: () => void;
  onLayoutHeight: (height: number) => void;
}

export const HomeSearchBar = forwardRef<TextInput, Props>(function HomeSearchBar(
  { query, isSearching, showHelperText, onChangeQuery, onClear, onLayoutHeight },
  ref
) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    container: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.background, paddingTop: Math.max(insets.top, spacing.md), alignItems: 'center' },
    bar: { width: '100%', maxWidth: 600, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
    input: { flex: 1, ...typography.body, color: colors.textPrimary, paddingVertical: spacing.xs },
    helper: { ...typography.caption, color: colors.textSecondary, fontSize: 11, marginTop: 4, marginLeft: 4, fontStyle: 'italic', alignSelf: 'flex-start' },
  });

  return (
    <View style={styles.container} onLayout={(event) => onLayoutHeight(event.nativeEvent.layout.height)}>
      <View style={styles.bar}>
        <Ionicons name="location-outline" size={20} color={colors.primary} />
        <TextInput
          ref={ref}
          style={styles.input}
          placeholder={th('searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={onChangeQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={onClear}>
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
        <View>{isSearching ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="search" size={20} color={colors.primary} />}</View>
      </View>
      {showHelperText && <Text style={styles.helper}>{th('helperText')}</Text>}
    </View>
  );
});
