import React, { createElement } from 'react';
import { Platform, Pressable, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

type Props = {
  href: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle | TextStyle>;
  onPress?: () => void;
};

/** Real <a href> on web so crawlers see links; SPA navigation on click. */
export function WebTextLink({ href, children, style, onPress }: Props) {
  const router = useRouter();
  const go = () => {
    onPress?.();
    router.push(href as never);
  };

  if (Platform.OS === 'web') {
    return createElement(
      'a',
      {
        href,
        style: { textDecoration: 'none', color: 'inherit' },
        onClick: (event: MouseEvent) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
            return;
          }
          event.preventDefault();
          go();
        },
      },
      children,
    );
  }

  return (
    <Pressable onPress={go} accessibilityRole="link" style={style}>
      {children}
    </Pressable>
  );
}
