import { ThemeColors } from '@/context/theme/types';

export const lightColors: ThemeColors = {
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

export const darkColors: ThemeColors = {
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
