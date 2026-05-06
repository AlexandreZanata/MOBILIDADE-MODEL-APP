export interface ThemeColors {
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

export interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
}
