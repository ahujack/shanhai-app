const palette = {
  ink: '#0B0D14',
  night: '#121827',
  elevated: '#1A2233',
  ember: '#7C6CFF',
  emberDeep: '#6758DD',
  plum: '#2A3448',
  lilac: '#AAB3C5',
  mist: '#94A0B8',
  gold: '#D6B36A',
  cream: '#F4EBDC',
  smoke: '#D5DBE8',
  success: '#4FAF8E',
  warn: '#C96A6A',
};

const base = {
  borderRadius: 16,
  palette,
};

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  text: string;
  mutedText: string;
  textSecondary: string;
  background: string;
  surface: string;
  accent: string;
  accentSecondary: string;
  cta: string;
  tabIconDefault: string;
  tabIconSelected: string;
  gradient: string[];
  borderRadius: number;
  palette: typeof palette;
  tint: string;
  card: string;
}

export interface Theme {
  light: ThemeColors;
  dark: ThemeColors;
}

export const theme = {
  light: {
    ...base,
    text: '#1A1610',
    mutedText: '#6B6258',
    textSecondary: '#6B6258',
    background: '#F5F1E8',
    surface: '#FFFFFF',
    accent: palette.gold,
    accentSecondary: '#C4A15A',
    cta: palette.ember,
    tabIconDefault: '#8B94A7',
    tabIconSelected: palette.gold,
    gradient: [palette.ember, palette.emberDeep],
    tint: palette.gold,
    card: '#FFFFFF',
  },
  dark: {
    ...base,
    text: palette.cream,
    mutedText: palette.lilac,
    textSecondary: palette.mist,
    background: palette.ink,
    surface: palette.night,
    accent: palette.gold,
    accentSecondary: palette.elevated,
    cta: palette.ember,
    tabIconDefault: '#707A90',
    tabIconSelected: palette.gold,
    gradient: [palette.ember, palette.emberDeep],
    tint: palette.gold,
    card: palette.elevated,
  },
};

export default theme;

