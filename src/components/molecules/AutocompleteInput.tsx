import React from 'react';
import { ActivityIndicator, Animated, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { createAutocompleteStyles, getAutocompleteLabelAnimation } from '@/components/molecules/autocompleteInput/styles';
import { AutocompleteInputProps, AutocompleteItem } from '@/components/molecules/autocompleteInput/types';
import { useAutocompleteInput } from '@/components/molecules/autocompleteInput/useAutocompleteInput';

export type { AutocompleteItem } from '@/components/molecules/autocompleteInput/types';

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
  const {
    inputRef,
    isFocused,
    showDropdown,
    searchText,
    items,
    isLoading,
    hasSearched,
    labelAnim,
    isLabelFloating,
    handleTextChange,
    handleFocus,
    handleBlur,
    handleSelectItem,
    handleClear,
  } = useAutocompleteInput({
    value,
    onSelect,
    onSearch,
    minChars,
    debounceMs,
  });
  const styles = createAutocompleteStyles({ colors, error, isFocused, isLabelFloating });
  const labelAnimation = getAutocompleteLabelAnimation(labelAnim, isLabelFloating, error, colors);

  const renderItem = ({ item, index }: { item: AutocompleteItem; index: number }) => {
    const isSelected = value?.id === item.id;
    const isLast = index === items.length - 1;

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isLast && styles.itemContainerLast,
          isSelected && styles.selectedItemBackground,
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
            style={styles.emptyIcon}
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
            isFocused && !error && styles.inputFocusedShadow,
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
              top: labelAnimation.top,
              transform: [{ scale: labelAnimation.scale }],
              color: labelAnimation.color,
              fontSize: labelAnimation.fontSize,
              fontWeight: labelAnimation.fontWeight,
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

