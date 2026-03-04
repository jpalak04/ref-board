export const colors = {
  bg: '#141414',
  surface: '#1A1A1A',
  surfaceHigh: '#222222',
  overlay: 'rgba(20,20,20,0.95)',
  // Brand accents
  lime: '#B5CC6A',
  coral: '#E8846A',
  cream: '#F5E6C8',
  lavender: '#A89EC4',
  teal: '#7CB9A0',
  amber: '#D4956A',
  // Text
  textPrimary: '#F5F5F5',
  textSecondary: '#A3A3A3',
  textMuted: '#737373',
  textInverse: '#141414',
  // Border
  borderSubtle: 'rgba(255,255,255,0.08)',
  borderVisible: 'rgba(255,255,255,0.15)',
  borderActive: '#B5CC6A',
};

// Map Supabase color name strings to hex
const COLOR_NAME_MAP: Record<string, string> = {
  lime: '#B5CC6A',
  coral: '#E8846A',
  cream: '#F5E6C8',
  lavender: '#A89EC4',
  teal: '#7CB9A0',
  mint: '#7CB9A0',
  amber: '#D4956A',
  peach: '#E8AC6A',
  sky: '#9BB8D3',
  blue: '#9BB8D3',
  pink: '#C9A0A0',
  rose: '#C9A0A0',
  purple: '#A89EC4',
  green: '#B5CC6A',
  orange: '#E8846A',
};

export function getCategoryColor(color: string): string {
  if (!color) return colors.lime;
  if (color.startsWith('#')) return color;
  return COLOR_NAME_MAP[color.toLowerCase()] || colors.lime;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fonts = {
  heading: 'Syne_700Bold',
  headingSemi: 'Syne_600SemiBold',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
};

export const CATEGORY_COLORS = [
  '#B5CC6A',
  '#E8846A',
  '#F5E6C8',
  '#A89EC4',
  '#7CB9A0',
  '#D4956A',
  '#9BB8D3',
  '#C9A0A0',
];

export const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  reel: { label: 'REEL', color: '#E8846A' },
  image: { label: 'IMAGE', color: '#B5CC6A' },
  link: { label: 'LINK', color: '#A89EC4' },
  note: { label: 'NOTE', color: '#F5E6C8' },
};
