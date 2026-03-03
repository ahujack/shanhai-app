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

export const theme = {
  light: {
    ...base,
    text: '#F7F6F0',
    mutedText: palette.mist,
    background: palette.ink,
    surface: palette.night,
    accent: palette.ember,
    accentSecondary: palette.plum,
    tabIconDefault: '#6E6E8A',
    tabIconSelected: palette.gold,
    gradient: [palette.ember, palette.emberDeep],
  },
  dark: {
    ...base,
    text: '#F7F6F0',
    mutedText: '#B2B4C8',
    background: '#0A0716',
    surface: '#161126',
    accent: palette.ember,
    accentSecondary: '#4C2F80',
    tabIconDefault: '#6E6E8A',
    tabIconSelected: palette.gold,
    gradient: [palette.ember, palette.emberDeep],
  },
};

export default theme;
