// HUSHRYD Theme Configuration
export const theme = {
  colors: {
    // Primary brand colors
    primary: '#FF6B35',
    primaryLight: '#FF8A65',
    primaryDark: '#E64A19',

    // Secondary colors
    secondary: '#6C757D',
    secondaryLight: '#9CA3AF',
    secondaryDark: '#495057',

    // Status colors
    success: '#28A745',
    successLight: '#E8F5E9',
    successDark: '#1E7E34',

    warning: '#FFC107',
    warningLight: '#FFF3E0',
    warningDark: '#E65100',

    error: '#DC3545',
    errorLight: '#FFEBEE',
    errorDark: '#C62828',

    info: '#17A2B8',
    infoLight: '#E3F2FD',
    infoDark: '#0D47A1',

    // Neutral colors
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    black: '#000000',

    // Background colors
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceVariant: '#F9FAFB',

    // Text colors
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textDisabled: '#9CA3AF',

    // Border colors
    border: '#E9ECEF',
    borderLight: '#F1F3F4',
    borderDark: '#DEE2E6',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },

  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
    },
  },
};

// Helper functions
export const getColor = (colorName: keyof typeof theme.colors) => {
  return theme.colors[colorName];
};

export const getSpacing = (size: keyof typeof theme.spacing) => {
  return theme.spacing[size];
};

export const getBorderRadius = (size: keyof typeof theme.borderRadius) => {
  return theme.borderRadius[size];
};

export const getShadow = (size: keyof typeof theme.shadows) => {
  return theme.shadows[size];
};

export const getFontSize = (size: keyof typeof theme.typography.fontSize) => {
  return theme.typography.fontSize[size];
};

export const getFontWeight = (weight: keyof typeof theme.typography.fontWeight) => {
  return theme.typography.fontWeight[weight];
};

// Default exports
export default theme;
