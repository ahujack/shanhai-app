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
  smoke: '#D5DBE8',
  success: '#4FAF8E',
  warn: '#C96A6A',
};

const base = {
  borderRadius: 20,
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
    text: '#E8ECF3',
    mutedText: '#8C97AE',
    textSecondary: '#8C97AE',
    background: '#F5F7FB',
    surface: '#FFFFFF',
    accent: palette.ember,
    accentSecondary: '#4B57C6',
    tabIconDefault: '#8B94A7',
    tabIconSelected: palette.gold,
    gradient: [palette.ember, palette.emberDeep],
    tint: '#4B57C6',
    card: '#FFFFFF',
  },
  dark: {
    ...base,
    text: '#E8ECF3',
    mutedText: palette.lilac,
    textSecondary: palette.mist,
    background: palette.ink,
    surface: palette.night,
    accent: palette.ember,
    accentSecondary: palette.elevated,
    tabIconDefault: '#707A90',
    tabIconSelected: palette.gold,
    gradient: [palette.ember, palette.emberDeep],
    tint: palette.elevated,
    card: palette.elevated,
  },
};

export default theme;
