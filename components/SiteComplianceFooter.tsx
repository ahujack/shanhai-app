import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';

/** 与 Creem / 应用内文案一致，请与商户后台、域名邮箱保持一致 */
export const SUPPORT_EMAIL = 'support@shanhai.app';

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

type Props = {
  /** compact：聊天页底部一行；full：登录页等稍大间距 */
  variant?: 'compact' | 'full';
};

export function SiteComplianceFooter({ variant = 'compact' }: Props) {
  const router = useRouter();

  const openMail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => null);
  };

  return (
    <View style={[styles.wrap, variant === 'full' && styles.wrapFull]}>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => router.push('/privacy')} style={webPointer} accessibilityRole="link">
          <Text style={styles.link}>隐私政策</Text>
        </TouchableOpacity>
        <Text style={styles.sep}>·</Text>
        <TouchableOpacity onPress={() => router.push('/terms')} style={webPointer} accessibilityRole="link">
          <Text style={styles.link}>服务条款</Text>
        </TouchableOpacity>
        <Text style={styles.sep}>·</Text>
        <TouchableOpacity onPress={() => router.push('/pricing')} style={webPointer} accessibilityRole="link">
          <Text style={styles.link}>价格说明</Text>
        </TouchableOpacity>
        <Text style={styles.sep}>·</Text>
        <TouchableOpacity onPress={() => router.push('/faq')} style={webPointer} accessibilityRole="link">
          <Text style={styles.link}>常见问题</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={openMail} style={webPointer} accessibilityRole="link">
        <Text style={styles.email}>客服邮箱：{SUPPORT_EMAIL}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(248, 208, 95, 0.15)',
  },
  wrapFull: {
    paddingVertical: 20,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  link: {
    color: '#B8A8D8',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  sep: {
    color: '#5C4B7A',
    fontSize: 12,
    marginHorizontal: 2,
  },
  email: {
    color: '#F8D05F',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
