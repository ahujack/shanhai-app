const palette = {
  ink: '#0F0B1F',
  night: '#1C1232',
  ember: '#FFAA54',
  emberDeep: '#FF7043',
  plum: '#5C3D99',
  lilac: '#C8A6FF',
  mist: '#8D8DAA',
  gold: '#F8D05F',
  smoke: '#C3C3D3',
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
    text: '#F7F6F0',
    mutedText: palette.mist,
    textSecondary: palette.mist,
    background: palette.ink,
    surface: palette.night,
    accent: palette.ember,
    accentSecondary: palette.plum,
    tabIconDefault: '#6E6E8A',
    tabIconSelected: palette.gold,
    gradient: [palette.ember, palette.emberDeep],
    tint: palette.plum,
    card: palette.night,
  },
  dark: {
    ...base,
    text: '#F7F6F0',
    mutedText: '#B2B4C8',
    textSecondary: '#B2B4C8',
    background: '#0A0716',
    surface: '#161126',
    accent: palette.ember,
    accentSecondary: '#4C2F80',
    tabIconDefault: '#6E6E8A',
    tabIconSelected: palette.gold,
    gradient: [palette.ember, palette.emberDeep],
    tint: '#4C2F80',
    card: '#1A1328',
  },
};

export default theme;
