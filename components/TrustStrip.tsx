import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18nStore } from '../src/store/i18n';

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

type Props = {
  compact?: boolean;
};

export default function TrustStrip({ compact = false }: Props) {
  const router = useRouter();
  const language = useI18nStore((s) => s.language);
  const copy =
    language === 'en-US'
      ? {
          kicker: 'Not a verdict. A compass for your next step.',
          title: 'Trust & reading integrity',
          items: [
            {
              label: 'Independent snapshot',
              body: 'A paid destiny report is saved as its own snapshot. It does not drift with chat to please you.',
            },
            {
              label: 'Privacy first',
              body: 'We do not sell personal data. Birth details are used for your chart and can be deleted on request.',
            },
            {
              label: 'Reflection, not prophecy',
              body: 'Readings help you name a next step. They are not medical, legal, or financial advice.',
            },
          ],
          privacy: 'Read privacy policy',
        }
      : language === 'zh-TW'
        ? {
            kicker: '不是判決，是下一步的座標。',
            title: '信任與解讀原則',
            items: [
              {
                label: '獨立快照',
                body: '付費命運報告會單獨保存，不會跟著聊天記錄去討好你。',
              },
              {
                label: '隱私優先',
                body: '我們不出售個人資料。生辰用於排盤，可申請刪除。',
              },
              {
                label: '反思，而非預言',
                body: '解讀幫你看清下一步，不構成醫療、法律或財務建議。',
              },
            ],
            privacy: '閱讀隱私政策',
          }
        : {
            kicker: '不是判决，是下一步的坐标。',
            title: '信任与解读原则',
            items: [
              {
                label: '独立快照',
                body: '付费命运报告会单独保存，不会跟着聊天记录去讨好你。',
              },
              {
                label: '隐私优先',
                body: '我们不出售个人数据。生辰用于排盘，可申请删除。',
              },
              {
                label: '反思，而非预言',
                body: '解读帮你看清下一步，不构成医疗、法律或财务建议。',
              },
            ],
            privacy: '阅读隐私政策',
          };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.kicker}>{copy.kicker}</Text>
      {compact ? null : <Text style={styles.title}>{copy.title}</Text>}
      {copy.items.map((item) => (
        <View key={item.label} style={styles.row}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      ))}
      <TouchableOpacity
        style={webPointer}
        onPress={() => router.push('/privacy')}
        accessibilityRole="link"
      >
        <Text style={styles.link}>{copy.privacy}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.28)',
    backgroundColor: 'rgba(18, 16, 12, 0.55)',
  },
  wrapCompact: {
    padding: 14,
  },
  kicker: {
    color: '#D6B36A',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    lineHeight: 20,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  title: {
    color: '#F5F0E8',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  row: {
    marginBottom: 10,
  },
  label: {
    color: '#E9D29B',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  body: {
    color: '#C9D0DC',
    fontSize: 13,
    lineHeight: 20,
  },
  link: {
    marginTop: 4,
    color: '#D6B36A',
    fontSize: 13,
    fontWeight: '700',
  },
});
