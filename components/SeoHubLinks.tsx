import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebTextLink } from './WebTextLink';
import { trackNamedEvent } from '../src/services/analytics';

const LINKS = [
  { href: '/bazi-calculator', label: '免费八字排盘' },
  { href: '/character-divination', label: '测字算命' },
  { href: '/guides', label: '使用指南' },
];

/** Always-visible hub on web homepage so rendered DOM keeps canonical landing links. */
export function SeoHubLinks() {
  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.wrap}>
      {LINKS.map((item, index) => (
        <React.Fragment key={item.href}>
          {index > 0 ? <Text style={styles.sep}>·</Text> : null}
          <WebTextLink
            href={item.href}
            onPress={() => trackNamedEvent('home_seo_hub_click', { href: item.href })}
          >
            <Text style={styles.link}>{item.label}</Text>
          </WebTextLink>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  link: {
    color: '#D6B36A',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  sep: {
    color: '#5C4B7A',
    fontSize: 13,
  },
});
