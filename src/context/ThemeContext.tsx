import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundSecondary: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  shadow: string;
  status: {
    success: string;
    error: string;
    warning: string;
    pending: string;
  };
}

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  primary: '#0374C8',
  secondary: '#F7B733',
  accent: '#2DD4BF',
  background: '#F0F3F5',
  backgroundSecondary: '#FFFFFF',
  card: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  shadow: 'rgba(3,116,200,0.08)',
  status: {
    success: '#2DD4BF',
    error: '#EF4444',
    warning: '#F59E0B',
    pending: '#6B7280',
  },
};

const darkColors: ThemeColors = {
  primary: '#0374C8',
  secondary: '#F7B733',
  accent: '#2DD4BF',
  background: '#1A1F2E',
  backgroundSecondary: '#2D3646',
  card: '#2D3646',
  textPrimary: '#F0F4F8',
  textSecondary: '#A8B3C1',
  border: '#2D3442',
  shadow: 'rgba(3,116,200,0.4)',
  status: {
    success: '#2DD4BF',
    error: '#EF4444',
    warning: '#F59E0B',
    pending: '#A8B3C1',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

