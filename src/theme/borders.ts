/** Design token border-radius scale (px) */
export const borders = {
  /** Hairline dividers / card outlines (spec: 0.5px) */
  widthHairline: 0.5,
  /** Profile avatar ring (spec: 2.5px accent) */
  profileAvatarBorderWidth: 2.5,
  /** chips, tags, input fields */
  radiusSmall: 8,
  /** buttons, payment options */
  radiusMedium: 12,
  /** cards, sheets inner sections */
  radiusLarge: 16,
  /** bottom sheets top corners */
  radiusXL: 24,
  /** pills, search bar, avatar */
  radiusFull: 50,
} as const;
