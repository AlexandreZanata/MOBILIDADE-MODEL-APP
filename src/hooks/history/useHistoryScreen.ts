import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { th } from '@/i18n/history';
import { historyFacade } from '@/services/history/historyFacade';

export function useHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useAuth();

  const viewState = useMemo(
    () => historyFacade.buildViewState(isAuthenticated),
    [isAuthenticated]
  );

  return {
    insets,
    colors,
    isDark,
    isAuthenticated,
    title: th('title'),
    viewState,
  };
}
