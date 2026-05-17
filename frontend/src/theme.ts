import { Platform } from 'react-native';

export const colors = {
  primary: '#0E3A60',
  primaryHover: '#0A2944',
  secondary: '#FDB813',
  background: '#F7F9FC',
  surface: '#FFFFFF',
  textMain: '#061224',
  textMuted: '#5C6A7B',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  danger: '#EF4444',
  success: '#10B981',
};

export const radius = {
  card: 20,
  button: 16,
  input: 12,
  badge: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const shadows = {
  card:
    Platform.OS === 'web'
      ? {
          boxShadow: '0px 8px 24px rgba(14, 58, 96, 0.06)',
        }
      : {
          shadowColor: '#0E3A60',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 24,
          elevation: 3,
        },
};
