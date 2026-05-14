export const colors = {
  bg: '#FFFFFF',
  bgDim: '#F5F6F8',
  text: '#0E0F12',
  textMuted: '#5B6068',
  accent: '#3B82F6',
  danger: '#DC2626',
  success: '#16A34A',
  overlay: 'rgba(0,0,0,0.55)',
} as const;

export const space = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
} as const;

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;

export const font = {
  size: { xs: 12, sm: 14, md: 16, lg: 20, xl: 28, hero: 40 },
  weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
} as const;
