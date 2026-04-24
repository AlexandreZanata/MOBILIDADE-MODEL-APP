import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Keyboard,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

export interface AutocompleteItem {
  id: string;
  name: string;
  [key: string]: any;
}

interface AutocompleteInputProps {
  label: string;
  placeholder?: string;
  value: AutocompleteItem | null;
  onSelect: (item: AutocompleteItem | null) => void;
  onSearch: (query: string) => Promise<AutocompleteItem[]>;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  style?: ViewStyle;
  debounceMs?: number;
  minChars?: number;
  emptyMessage?: string;
  loadingMessage?: string;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  placeholder = 'Digite para buscar...',
  value,
  onSelect,
  onSearch,
  error = false,
  errorMessage,
  disabled = false,
  style,
  debounceMs = 300,
  minChars = 0,
  emptyMessage = 'Nenhum resultado encontrado',
  loadingMessage = 'Buscando...',
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState<AutocompleteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [labelAnim] = useState(new Animated.Value(value ? 1 : 0));
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  const hasValue = !!value;
  const isLabelFloating = isFocused || hasValue || searchText.length > 0;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isLabelFloating ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isLabelFloating, labelAnim]);

  // Limpa o timeout ao desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const performSearch = useCallback(async (query: string) => {
    if (query.length < minChars) {
      setItems([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const results = await onSearch(query);
      setItems(results);
    } catch (error) {
      console.error('[Autocomplete] Erro na busca:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [onSearch, minChars]);

  const handleTextChange = (text: string) => {
    setSearchText(text);
    
    // Se tinha um valor selecionado e o usuário começou a digitar, limpa a seleção
    if (value && text !== value.name) {
      onSelect(null);
    }

    // Cancela busca anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Agenda nova busca com debounce
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(text);
    }, debounceMs);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
    // Se não tem texto e minChars é 0, faz busca inicial
    if (searchText.length === 0 && minChars === 0) {
      performSearch('');
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay para permitir clique nos itens
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const handleSelectItem = (item: AutocompleteItem) => {
    setSearchText(item.name);
    onSelect(item);
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    setSearchText('');
    onSelect(null);
    setItems([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [spacing.md + 6, spacing.xs + 2],
  });

  const labelScale = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  const labelColor = isLabelFloating
    ? error ? colors.status.error : colors.primary
    : colors.textSecondary;

  const styles = StyleSheet.create({
    container: {
      marginBottom: 0,
      zIndex: 100,
    },
    inputContainer: {
      position: 'relative',
      height: 60,
    },
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
      borderColor: error
        ? colors.status.error
        : isFocused
          ? colors.primary
          : colors.border,
      color: colors.textPrimary,
      fontSize: 16,
    },
    inputDisabled: {
      backgroundColor: colors.background,
      opacity: 0.7,
      borderColor: colors.border,
    },
    label: {
      position: 'absolute',
      left: spacing.md + 4,
      zIndex: 1,
      pointerEvents: 'none',
    },
    labelText: {
      fontSize: 16,
      fontWeight: '400',
    },
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
    clearButton: {
      padding: 8,
    },
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
    dropdownContent: {
      borderRadius: 14,
      overflow: 'hidden',
    },
    itemContainer: {
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemContainerLast: {
      borderBottomWidth: 0,
    },
    itemText: {
      fontSize: 15,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    itemTextHighlight: {
      color: colors.primary,
      fontWeight: '600',
    },
    emptyContainer: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    errorText: {
      marginTop: spacing.xs,
      marginLeft: spacing.xs,
      fontSize: 12,
      color: colors.status.error,
      fontWeight: '500',
    },
    selectedIndicator: {
      marginLeft: spacing.xs,
    },
  });

  const renderItem = ({ item, index }: { item: AutocompleteItem; index: number }) => {
    const isSelected = value?.id === item.id;
    const isLast = index === items.length - 1;

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isLast && styles.itemContainerLast,
          isSelected && { backgroundColor: `${colors.primary}15` },
        ]}
        onPress={() => handleSelectItem(item)}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            style={[
              styles.itemText,
              isSelected && styles.itemTextHighlight,
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.primary}
              style={styles.selectedIndicator}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDropdownContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      );
    }

    if (hasSearched && items.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="search-outline"
            size={24}
            color={colors.textSecondary}
            style={{ marginBottom: spacing.xs }}
          />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.dropdownContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {renderItem({ item, index })}
          </React.Fragment>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            isFocused && !error && {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            },
            disabled && styles.inputDisabled,
          ]}
          placeholder={isLabelFloating ? placeholder : ''}
          placeholderTextColor={colors.textSecondary}
          value={searchText || value?.name || ''}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <Animated.Text
          style={[
            styles.label,
            styles.labelText,
            {
              top: labelTop,
              transform: [{ scale: labelScale }],
              color: labelColor,
              fontSize: isLabelFloating ? 12 : 16,
              fontWeight: isLabelFloating ? '600' : '400',
            },
          ]}
        >
          {label}
        </Animated.Text>
        <View style={styles.rightIconContainer}>
          {(searchText.length > 0 || value) ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-down" size={22} color={colors.textSecondary} />
          )}
        </View>
      </View>

      {showDropdown && (items.length > 0 || isLoading || hasSearched) && (
        <View style={styles.dropdown}>
          {renderDropdownContent()}
        </View>
      )}

      {error && errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
};

