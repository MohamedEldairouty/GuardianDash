export const colors = {
  bg: '#0B0F1A',
  bgElevated: '#121826',
  surface: '#1A2030',
  border: '#252C3D',

  text: '#FFFFFF',
  textMuted: '#8B93A7',
  textDim: '#5A6276',

  primary: '#3B82F6',
  primaryGlow: '#60A5FA',

  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerGlow: '#FB7185',

  gauge: {
    safe: '#10B981',
    caution: '#F59E0B',
    critical: '#EF4444',
  },
} as const;

export type Colors = typeof colors;
