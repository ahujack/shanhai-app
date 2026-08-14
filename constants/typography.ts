import { Platform, type TextStyle } from 'react-native';

/** 标题/口号用：不阻塞首屏，Web 由 WebFonts 异步加载 Noto Serif SC */
export const serifFamily = Platform.select({
  web: '"Noto Serif SC", "Songti SC", "STSong", "Noto Serif", Georgia, serif',
  ios: 'Songti SC',
  android: 'serif',
  default: 'serif',
}) as string;

export const serifTitle: TextStyle = {
  fontFamily: serifFamily,
};

export const serifDisplay: TextStyle = {
  fontFamily: serifFamily,
  letterSpacing: 1.2,
};
