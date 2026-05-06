export interface ThemeColors {
  /** CTA buttons, headings */
  primary: string;
  secondary: string;
  /** Icons, active states, links */
  accent: string;
  /** Active chip bg, icon bg */
  accentSoft: string;
  background: string;
  backgroundSecondary: string;
  /** Cards, sheets */
  card: string;
  /** Main text */
  textPrimary: string;
  /** Subtitles, labels */
  textSecondary: string;
  /** Placeholders, hints */
  textHint: string;
  border: string;
  shadow: string;
  /** Map base fill */
  mapBg: string;
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
