/**
 * Shadow tokens — light mode only.
 * In dark mode replace with `border: 0.5px solid [border token]`.
 */
export const shadows = {
  /** map buttons */
  small: {
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  /** search bar, floating cards */
  medium: {
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  /** bottom sheets */
  large: {
    shadowColor: 'rgba(0,0,0,0.16)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
