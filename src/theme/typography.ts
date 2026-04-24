const fontFamily = {
  regular: 'Poppins-Regular',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
};

export const typography = {
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
    fontFamily: fontFamily.bold,
  },
  h2: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600' as const,
    fontFamily: fontFamily.semiBold,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    fontFamily: fontFamily.regular,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    fontFamily: fontFamily.regular,
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    fontFamily: fontFamily.semiBold,
  },
};

