import React, { createContext, useContext, ReactNode } from 'react';
import { useThemeProviderValue } from '@/context/theme/useThemeProvider';
import { ThemeContextType } from '@/context/theme/types';
export type { ThemeContextType, ThemeColors } from '@/context/theme/types';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useThemeProviderValue();

  return (
    <ThemeContext.Provider value={value}>
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

