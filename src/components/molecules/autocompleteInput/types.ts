import { ViewStyle } from 'react-native';

export interface AutocompleteItem {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface AutocompleteInputProps {
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
