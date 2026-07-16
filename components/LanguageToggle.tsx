import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useI18nStore } from '../src/store/i18n';
import type { AppLanguage } from '../src/i18n/translations';

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

type Props = {
  style?: ViewStyle;
  compact?: boolean;
};

const options: Array<{ value: AppLanguage; label: string }> = [
  { value: 'en-US', label: 'EN' },
  { value: 'zh-CN', label: '简' },
  { value: 'zh-TW', label: '繁' },
];

export default function LanguageToggle({ style, compact = false }: Props) {
  const language = useI18nStore((state) => state.language);
  const setLanguage = useI18nStore((state) => state.setLanguage);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
      {options.map((item) => {
        const active = language === item.value;
        return (
          <TouchableOpacity
            key={item.value}
            style={[styles.btn, compact && styles.btnCompact, active && styles.btnActive, webPointer]}
            onPress={() => void setLanguage(item.value)}
            accessibilityRole="button"
            accessibilityLabel={`Switch language to ${item.label}`}
          >
            <Text style={[styles.text, compact && styles.textCompact, active && styles.textActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.28)',
    backgroundColor: 'rgba(11, 18, 32, 0.78)',
    padding: 3,
    gap: 3,
  },
  wrapCompact: {
    alignSelf: 'flex-end',
  },
  btn: {
    minWidth: 48,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCompact: {
    minWidth: 40,
    height: 30,
  },
  btnActive: {
    backgroundColor: '#D6B36A',
  },
  text: {
    color: '#C7D0DF',
    fontSize: 13,
    fontWeight: '900',
  },
  textCompact: {
    fontSize: 12,
  },
  textActive: {
    color: '#17120D',
  },
});
