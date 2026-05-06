import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { HistoryScreenContent } from '@/components/organisms/history/HistoryScreenContent';
import { useHistoryScreen } from '@/hooks/history/useHistoryScreen';

type HistoryNavigationParams = {
  History: undefined;
  Login: undefined;
};

interface HistoryScreenProps {
  navigation: NavigationProp<HistoryNavigationParams, 'History'>;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const { insets, colors, isDark, title, viewState } = useHistoryScreen();

  return (
    <HistoryScreenContent
      colors={colors}
      isDark={isDark}
      insetsTop={insets.top}
      insetsBottom={insets.bottom}
      title={title}
      viewState={viewState}
      onPressLogin={() => navigation.navigate('Login')}
    />
  );
};

