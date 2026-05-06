import { useColorScheme } from 'react-native';

import { darkColors, lightColors } from '@/context/theme/colors';
import { ThemeContextType } from '@/context/theme/types';

export function useThemeProviderValue(): ThemeContextType {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  return { isDark, colors };
}
