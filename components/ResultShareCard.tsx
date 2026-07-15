import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import theme from '../constants/Colors';
import { useI18nStore } from '../src/store/i18n';
import { trackNamedEvent } from '../src/services/analytics';
import {
  buildReferralUrl,
  shareResultCopy,
  showShareSuccessAlert,
  type ResultShareKind,
} from '../src/utils/referralShare';

const colors = theme.dark;
const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

type Props = {
  kind: ResultShareKind;
  headline: string;
  summary: string;
  badge?: string;
  referralCode?: string | null;
  requireLogin?: boolean;
  disabled?: boolean;
};

const KIND_META: Record<ResultShareKind, { emoji: string; accent: [string, string] }> = {
  zi: { emoji: '字', accent: ['#3D2A5C', '#1A1230'] },
  reading: { emoji: '卦', accent: ['#2A3D5C', '#121A30'] },
  bazi: { emoji: '命', accent: ['#3D3A2A', '#1A1810'] },
  fortune: { emoji: '签', accent: ['#2A4D3A', '#101A14'] },
};

export default function ResultShareCard({
  kind,
  headline,
  summary,
  badge,
  referralCode,
  requireLogin = true,
  disabled = false,
}: Props) {
  const router = useRouter();
  const language = useI18nStore((state) => state.language);
  const t = useI18nStore((state) => state.t);
  const shotRef = useRef<ViewShot | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const tx = (zh: string, en: string, tw: string) =>
    language === 'en-US' ? en : language === 'zh-TW' ? tw : zh;

  const meta = KIND_META[kind];
  const displayHeadline = headline.trim() || tx('我刚做了一次解读', 'My reading result', '我剛做了一次解讀');
  const displaySummary = summary.trim().slice(0, 160);
  const inviteUrl = referralCode ? buildReferralUrl(referralCode) : 'https://www.shanhai.app';
  const canShareImage = Platform.OS !== 'web';

  const handleShare = async () => {
    if (disabled || sharing) return;
    if (requireLogin && !referralCode) {
      Alert.alert(
        t('common.notice', '提示'),
        tx('登录后可带邀请码分享，好友注册后你们各得 50 积分。', 'Log in to share with your invite code. Both sides get +50 points.', '登入後可帶邀請碼分享，好友註冊後你們各得 50 積分。'),
        [
          { text: t('common.cancel', '取消'), style: 'cancel' },
          { text: t('common.login', '去登录'), onPress: () => router.push('/login') },
        ],
      );
      return;
    }

    setSharing(true);
    trackNamedEvent('result_share', {
      kind,
      hasReferral: !!referralCode,
      platform: Platform.OS,
    });

    try {
      if (canShareImage && shotRef.current?.capture) {
        const uri = await shotRef.current.capture();
        const available = await Sharing.isAvailableAsync();
        if (uri && available) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: tx('分享解读', 'Share reading', '分享解讀'),
            UTI: 'public.png',
          });
        }
      }

      const ok = await shareResultCopy({
        language,
        kind,
        headline: displayHeadline,
        summary: displaySummary,
        referralCode,
      });

      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2600);
      }
      if (Platform.OS === 'web' && ok) {
        showShareSuccessAlert(language, !!referralCode);
      }
    } catch (e) {
      console.error('[ResultShareCard] share failed', e);
      Alert.alert(
        tx('分享失败', 'Share failed', '分享失敗'),
        tx('请稍后重试', 'Please try again later', '請稍後重試'),
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <ViewShot ref={shotRef} options={{ format: 'png', quality: 0.95, result: 'tmpfile' }}>
        <LinearGradient colors={meta.accent} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>{tx('山海灵境', 'Shanhai Realm', '山海靈境')}</Text>
              {badge ? <Text style={styles.badge}>{badge}</Text> : null}
            </View>
            <View style={styles.glyphCircle}>
              <Text style={styles.glyphText}>{meta.emoji}</Text>
            </View>
          </View>

          <Text style={styles.headline} numberOfLines={2}>
            {displayHeadline}
          </Text>
          {!!displaySummary && (
            <Text style={styles.summary} numberOfLines={4}>
              {displaySummary}
            </Text>
          )}

          <View style={styles.footer}>
            {referralCode ? (
              <>
                <Text style={styles.inviteLabel}>{tx('邀请码', 'Invite code', '邀請碼')}</Text>
                <Text style={styles.inviteCode}>{referralCode}</Text>
                <Text style={styles.inviteHint} numberOfLines={1}>
                  {tx('好友注册，你们各得 50 积分', 'Both get +50 pts', '好友註冊，你們各得 50 積分')}
                </Text>
              </>
            ) : (
              <Text style={styles.inviteHint}>{inviteUrl.replace('https://', '')}</Text>
            )}
            <Text style={styles.disclaimer}>
              {tx('仅供娱乐参考', 'For entertainment only', '僅供娛樂參考')}
            </Text>
          </View>
        </LinearGradient>
      </ViewShot>

      <TouchableOpacity
        style={[styles.shareBtn, (disabled || sharing) && styles.shareBtnDisabled]}
        onPress={handleShare}
        disabled={disabled || sharing}
        accessibilityRole="button"
      >
        {sharing ? (
          <ActivityIndicator color="#1A1230" size="small" />
        ) : (
          <Text style={styles.shareBtnText}>
            {copied
              ? tx('已复制，可以发给好友', 'Copied. Share with friends', '已複製，可以發給好友')
              : tx('复制分享文案', 'Copy share text', '複製分享文案')}
          </Text>
        )}
      </TouchableOpacity>
      {copied ? (
        <Text style={styles.copySuccessText}>
          {tx('复制成功，可直接粘贴发给好友', 'Copied. Paste it to share with friends.', '複製成功，可直接貼上發給好友')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 4,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.35)',
    minHeight: 220,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  brandRow: {
    flex: 1,
    paddingRight: 12,
  },
  brand: {
    color: colors.tabIconSelected,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  badge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    color: '#E8ECF3',
    fontSize: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  glyphCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(214, 179, 106, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphText: {
    color: colors.tabIconSelected,
    fontSize: 24,
    fontWeight: '700',
  },
  headline: {
    color: '#F5F0E8',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 8,
  },
  summary: {
    color: 'rgba(232, 236, 243, 0.82)',
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(214, 179, 106, 0.2)',
  },
  inviteLabel: {
    color: 'rgba(232, 236, 243, 0.55)',
    fontSize: 11,
    marginBottom: 2,
  },
  inviteCode: {
    color: colors.tabIconSelected,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  inviteHint: {
    color: 'rgba(232, 236, 243, 0.7)',
    fontSize: 12,
  },
  disclaimer: {
    marginTop: 10,
    color: 'rgba(232, 236, 243, 0.45)',
    fontSize: 10,
  },
  shareBtn: {
    marginTop: 12,
    backgroundColor: colors.tabIconSelected,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    ...webPointer,
  },
  shareBtnDisabled: {
    opacity: 0.6,
  },
  shareBtnText: {
    color: '#1A1230',
    fontSize: 15,
    fontWeight: '700',
  },
  copySuccessText: {
    color: colors.tabIconSelected,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '700',
  },
});
