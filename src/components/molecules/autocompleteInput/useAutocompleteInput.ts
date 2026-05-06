import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, TextInput } from 'react-native';
import { autocompleteItemsSchema } from '@/components/molecules/autocompleteInput/schemas';
import { AutocompleteInputProps, AutocompleteItem } from '@/components/molecules/autocompleteInput/types';

interface Params {
  value: AutocompleteItem | null;
  onSelect: AutocompleteInputProps['onSelect'];
  onSearch: AutocompleteInputProps['onSearch'];
  minChars: number;
  debounceMs: number;
}

export function useAutocompleteInput({
  value,
  onSelect,
  onSearch,
  minChars,
  debounceMs,
}: Params) {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState<AutocompleteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideDropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (hideDropdownTimeoutRef.current) clearTimeout(hideDropdownTimeoutRef.current);
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
      const parsed = autocompleteItemsSchema.safeParse(results);
      if (!parsed.success) {
        console.error('[Autocomplete] Resultado inválido da busca:', parsed.error.flatten());
        setItems([]);
        return;
      }
      setItems(parsed.data);
    } catch (error) {
      console.error('[Autocomplete] Erro na busca:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [minChars, onSearch]);

  const handleTextChange = useCallback((text: string) => {
    setSearchText(text);
    if (value && text !== value.name) onSelect(null);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      void performSearch(text);
    }, debounceMs);
  }, [debounceMs, onSelect, performSearch, value]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowDropdown(true);
    if (searchText.length === 0 && minChars === 0) void performSearch('');
  }, [minChars, performSearch, searchText.length]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    hideDropdownTimeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  }, []);

  const handleSelectItem = useCallback((item: AutocompleteItem) => {
    setSearchText(item.name);
    onSelect(item);
    setShowDropdown(false);
    Keyboard.dismiss();
  }, [onSelect]);

  const handleClear = useCallback(() => {
    setSearchText('');
    onSelect(null);
    setItems([]);
    setHasSearched(false);
    inputRef.current?.focus();
  }, [onSelect]);

  return {
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
  };
}
