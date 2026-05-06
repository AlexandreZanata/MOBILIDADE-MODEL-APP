import React, { forwardRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { borders, shadows, spacing, typography } from '@/theme';
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

/**
 * Search bar — integrated into the layout flow (not floating/absolute).
 * Sits at the top of the screen, respects safe area, and has a solid
 * background so the map never bleeds through.
 */
export const HomeSearchBar = forwardRef<TextInput, Props>(function HomeSearchBar(
  { query, isSearching, showHelperText, onChangeQuery, onClear, onLayoutHeight },
  ref,
) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingTop: Math.max(insets.top, spacing.md),
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      zIndex: 100,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: borders.radiusMedium,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      ...(isDark ? {} : shadows.medium),
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      paddingVertical: spacing.xs,
    },
    helper: {
      ...typography.caption,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: spacing.xs,
      marginLeft: spacing.xs,
    },
  });

  return (
    <View
      style={styles.container}
      onLayout={(e) => onLayoutHeight(e.nativeEvent.layout.height)}
    >
      <View style={styles.bar}>
        <Ionicons name="location-outline" size={20} color={colors.accent} />

        <TextInput
          ref={ref}
          style={styles.input}
          placeholder={th('searchPlaceholder')}
          placeholderTextColor={colors.textHint}
          value={query}
          onChangeText={onChangeQuery}
          returnKeyType="search"
          accessibilityLabel={th('searchPlaceholder')}
        />

        {query.length > 0 && (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Limpar pesquisa"
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        <View>
          {isSearching ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons name="search" size={20} color={colors.accent} />
          )}
        </View>
      </View>

      {showHelperText && (
        <Text style={styles.helper}>{th('helperText')}</Text>
      )}
    </View>
  );
});
