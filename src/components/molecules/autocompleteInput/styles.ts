import { Animated, StyleSheet } from 'react-native';
import { spacing } from '@/theme';

interface StylesParams {
  colors: {
    card: string;
    background: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    primary: string;
    shadow: string;
    status: { error: string };
  };
  error: boolean;
  isFocused: boolean;
  isLabelFloating: boolean;
}

export function createAutocompleteStyles({
  colors,
  error,
  isFocused,
  isLabelFloating,
}: StylesParams) {
  return StyleSheet.create({
    container: { marginBottom: 0, zIndex: 100 },
    inputContainer: { position: 'relative', height: 60 },
    input: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: spacing.md + 4,
      paddingRight: 52,
      paddingTop: spacing.md + 6,
      paddingBottom: spacing.md - 2,
      borderWidth: isFocused ? 2.5 : 2,
      borderColor: error ? colors.status.error : isFocused ? colors.primary : colors.border,
      color: colors.textPrimary,
      fontSize: 16,
    },
    inputFocusedShadow: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    inputDisabled: { backgroundColor: colors.background, opacity: 0.7, borderColor: colors.border },
    label: { position: 'absolute', left: spacing.md + 4, zIndex: 1, pointerEvents: 'none' },
    labelText: { fontSize: 16, fontWeight: '400' },
    rightIconContainer: {
      position: 'absolute',
      right: spacing.sm + 4,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      width: 44,
      zIndex: 2,
    },
    clearButton: { padding: 8 },
    dropdown: {
      position: 'absolute',
      top: 64,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.border,
      maxHeight: 220,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 1000,
    },
    dropdownContent: { borderRadius: 14, overflow: 'hidden' },
    itemContainer: {
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemContainerLast: { borderBottomWidth: 0 },
    itemText: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
    itemTextHighlight: { color: colors.primary, fontWeight: '600' },
    selectedItemBackground: { backgroundColor: `${colors.primary}15` },
    emptyContainer: { paddingVertical: spacing.lg, paddingHorizontal: spacing.md, alignItems: 'center' },
    emptyIcon: { marginBottom: spacing.xs },
    emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    loadingContainer: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    loadingText: { fontSize: 14, color: colors.textSecondary },
    errorText: {
      marginTop: spacing.xs,
      marginLeft: spacing.xs,
      fontSize: 12,
      color: colors.status.error,
      fontWeight: '500',
    },
    selectedIndicator: { marginLeft: spacing.xs },
  });
}

export function getAutocompleteLabelAnimation(
  labelAnim: Animated.Value,
  isLabelFloating: boolean,
  error: boolean,
  colors: StylesParams['colors']
) {
  return {
    top: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [spacing.md + 6, spacing.xs + 2] }),
    scale: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }),
    color: isLabelFloating ? (error ? colors.status.error : colors.primary) : colors.textSecondary,
    fontSize: isLabelFloating ? 12 : 16,
    fontWeight: isLabelFloating ? '600' : '400',
  } as const;
}
