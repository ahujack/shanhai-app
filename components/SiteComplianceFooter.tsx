import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';

/** 与 Creem / 应用内文案一致，请与商户后台、域名邮箱保持一致 */
export const SUPPORT_EMAIL = 'support@shanhai.app';

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

type Props = {
  /**
   * compact：带顶部分割线的独立条（用于长页底部）
   * dock：贴在输入框上方，无顶边线、字略小（对话首页）
   * full：登录/注册页较大间距
   */
  variant?: 'compact' | 'dock' | 'full';
};

export function SiteComplianceFooter({ variant = 'compact' }: Props) {
  const router = useRouter();

  const openMail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => null);
  };

  const isDock = variant === 'dock';

  return (
    <View
      style={[
        styles.wrap,
        variant === 'full' && styles.wrapFull,
        variant === 'dock' && styles.wrapDock,
        variant === 'compact' && styles.wrapCompact,
      ]}
    >
      <View style={[styles.row, isDock && styles.rowDock]}>
        <TouchableOpacity onPress={() => router.push('/privacy')} style={webPointer} accessibilityRole="link">
          <Text style={[styles.link, isDock && styles.linkDock]}>隐私政策</Text>
        </TouchableOpacity>
        <Text style={[styles.sep, isDock && styles.sepDock]}>·</Text>
        <TouchableOpacity onPress={() => router.push('/terms')} style={webPointer} accessibilityRole="link">
          <Text style={[styles.link, isDock && styles.linkDock]}>服务条款</Text>
        </TouchableOpacity>
        <Text style={[styles.sep, isDock && styles.sepDock]}>·</Text>
        <TouchableOpacity onPress={() => router.push('/pricing')} style={webPointer} accessibilityRole="link">
          <Text style={[styles.link, isDock && styles.linkDock]}>价格说明</Text>
        </TouchableOpacity>
        <Text style={[styles.sep, isDock && styles.sepDock]}>·</Text>
        <TouchableOpacity onPress={() => router.push('/faq')} style={webPointer} accessibilityRole="link">
          <Text style={[styles.link, isDock && styles.linkDock]}>常见问题</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={openMail} style={webPointer} accessibilityRole="link">
        <Text style={[styles.email, isDock && styles.emailDock]}>客服邮箱：{SUPPORT_EMAIL}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  wrapCompact: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(248, 208, 95, 0.15)',
  },
  wrapDock: {
    paddingTop: 4,
    paddingBottom: 8,
    borderTopWidth: 0,
  },
  wrapFull: {
    paddingVertical: 20,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(248, 208, 95, 0.15)',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  rowDock: {
    marginBottom: 4,
  },
  link: {
    color: '#B8A8D8',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  linkDock: {
    fontSize: 11,
    color: '#8D8DAA',
    textDecorationLine: 'none',
  },
  sep: {
    color: '#5C4B7A',
    fontSize: 12,
    marginHorizontal: 2,
  },
  sepDock: {
    fontSize: 11,
    color: '#4A3D5C',
  },
  email: {
    color: '#F8D05F',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  emailDock: {
    fontSize: 11,
    fontWeight: '500',
    color: '#A8946E',
    textDecorationLine: 'none',
  },
});
