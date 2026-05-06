/**
 * Typography scale — system fonts (SF Pro on iOS · Roboto on Android).
 * Rule: sentence case everywhere. Labels/tabs are the only uppercase exception.
 */
export const typography = {
  display: {
    fontSize: 22,
    fontWeight: '500' as const,
    lineHeight: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  /** UPPERCASE labels / tabs */
  label: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.77,
    textTransform: 'uppercase' as const,
  },
  micro: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 14,
  },
  button: {
    fontSize: 15,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 30,
  },
} as const;
