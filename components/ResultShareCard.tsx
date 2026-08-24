import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
  ImageStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import theme from '../constants/Colors';
import { serifTitle } from '../constants/typography';
import { useI18nStore } from '../src/store/i18n';
import { trackNamedEvent } from '../src/services/analytics';
import {
  buildReferralUrl,
  shareResultCopy,
  showShareSuccessAlert,
  type ResultShareKind,
} from '../src/utils/referralShare';
import { downloadWebSharePng } from '../src/utils/shareCardImage';

const colors = theme.dark;
const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};
const cloudWandererImage = require('../assets/personas/elder.png');

type Props = {
  kind: ResultShareKind;
  headline: string;
  summary: string;
  /** 可截图式短标签，如「边界松的给予型」 */
  shareLabel?: string;
  badge?: string;
  referralCode?: string | null;
  requireLogin?: boolean;
  disabled?: boolean;
};

const KIND_META: Record<ResultShareKind, { glyph: string; paper: [string, string] }> = {
  zi: { glyph: '字', paper: ['#16110C', '#0C0A08'] },
  reading: { glyph: '卦', paper: ['#12151C', '#0A0C11'] },
  bazi: { glyph: '命', paper: ['#16140C', '#0C0B08'] },
  fortune: { glyph: '签', paper: ['#101612', '#080C0A'] },
  report: { glyph: '镜', paper: ['#15120C', '#0B0A07'] },
};

export default function ResultShareCard({
  kind,
  headline,
  summary,
  shareLabel,
  badge,
  referralCode,
  requireLogin = false,
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
  const displayLabel = (shareLabel || '').trim().slice(0, 32);
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
      hasLabel: !!displayLabel,
      platform: Platform.OS,
    });
    if (displayLabel) {
      trackNamedEvent('result_label_share', { kind, label: displayLabel.slice(0, 40) });
    }

    try {
      let savedImage = false;
      if (Platform.OS === 'web') {
        savedImage = await downloadWebSharePng({
          kind,
          headline: displayHeadline,
          summary: displaySummary,
          shareLabel: displayLabel,
          url: inviteUrl,
        });
      } else if (canShareImage && shotRef.current?.capture) {
        const uri = await shotRef.current.capture();
        const available = await Sharing.isAvailableAsync();
        if (uri && available) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: tx('分享解读', 'Share reading', '分享解讀'),
            UTI: 'public.png',
          });
          savedImage = true;
        }
      }

      const ok = await shareResultCopy({
        language,
        kind,
        headline: displayHeadline,
        summary: displaySummary,
        shareLabel: displayLabel,
        referralCode,
      });

      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2600);
      }
      if (Platform.OS === 'web' && (ok || savedImage)) {
        showShareSuccessAlert(language, savedImage);
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
        <LinearGradient colors={meta.paper} style={styles.card}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            <Text style={styles.slogan}>
              {tx('不是判决，是下一步的坐标', 'Not a verdict. A compass.', '不是判決，是下一步的座標')}
            </Text>

            <View style={styles.cardTop}>
              <View style={styles.brandRow}>
                <Text style={styles.brand}>{tx('山海灵境', 'Shanhai Realm', '山海靈境')}</Text>
                <Text style={styles.companionLine}>
                  {tx('云游子交付', 'Delivered by Yunyouzi', '雲遊子交付')}
                </Text>
                {badge ? <Text style={styles.badge}>{badge}</Text> : null}
              </View>
              <View style={styles.companionMark}>
                <Image
                  source={cloudWandererImage}
                  style={styles.companionImage as ImageStyle}
                  resizeMode="cover"
                />
                <View style={styles.glyphBadge}>
                  <Text style={styles.glyphText}>{meta.glyph}</Text>
                </View>
              </View>
            </View>

            {!!displayLabel && (
              <View style={styles.labelChip}>
                <Text style={styles.labelChipText} numberOfLines={1}>
                  {displayLabel}
                </Text>
              </View>
            )}

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
                <Text style={styles.inviteHint}>
                  {tx('打开链接即可体验', 'Open the link to try', '打開連結即可體驗')}
                </Text>
              )}
              <Text style={styles.brandUrl} numberOfLines={1}>
                {inviteUrl.replace(/^https?:\/\//, '')}
              </Text>
              <Text style={styles.watermark}>
                {tx('山海灵境 · shanhai.app', 'Shanhai Realm · shanhai.app', '山海靈境 · shanhai.app')}
              </Text>
              <Text style={styles.disclaimer}>
                {tx('仅供娱乐与自我反思', 'For reflection, not prophecy', '僅供娛樂與自我反思')}
              </Text>
            </View>
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
              : Platform.OS === 'web'
                ? tx('保存分享图', 'Save share image', '保存分享圖')
                : tx('分享这张图', 'Share this card', '分享這張圖')}
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
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.55)',
    minHeight: 248,
  },
  frame: {
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.22)',
    padding: 16,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: 'rgba(214, 179, 106, 0.7)',
  },
  cornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
  slogan: {
    ...serifTitle,
    color: 'rgba(214, 179, 106, 0.78)',
    fontSize: 12,
    letterSpacing: 1.2,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  brandRow: {
    flex: 1,
    paddingRight: 12,
  },
  brand: {
    ...serifTitle,
    color: colors.tabIconSelected,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 4,
  },
  badge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    color: '#EDE4D4',
    fontSize: 11,
    letterSpacing: 0.6,
    backgroundColor: 'rgba(214, 179, 106, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.28)',
  },
  companionLine: {
    color: 'rgba(232, 236, 243, 0.58)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.4,
  },
  labelChip: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 2,
    backgroundColor: 'rgba(214, 179, 106, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.42)',
  },
  labelChipText: {
    color: '#F5E6C8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  companionMark: {
    width: 56,
    height: 56,
  },
  companionImage: {
    width: 56,
    height: 56,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.5)',
    backgroundColor: '#17120D',
  },
  glyphBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17120A',
    borderWidth: 1,
    borderColor: 'rgba(214, 179, 106, 0.68)',
  },
  glyphText: {
    color: colors.tabIconSelected,
    fontSize: 12,
    fontWeight: '700',
  },
  headline: {
    ...serifTitle,
    color: '#F7F1E6',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  summary: {
    color: 'rgba(232, 226, 212, 0.82)',
    fontSize: 14,
    lineHeight: 23,
  },
  footer: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(214, 179, 106, 0.18)',
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
  brandUrl: {
    marginTop: 8,
    color: colors.tabIconSelected,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  watermark: {
    marginTop: 4,
    color: 'rgba(214, 179, 106, 0.55)',
    fontSize: 11,
    fontWeight: '600',
  },
  disclaimer: {
    marginTop: 10,
    color: 'rgba(232, 236, 243, 0.45)',
    fontSize: 10,
  },
  shareBtn: {
    marginTop: 12,
    backgroundColor: colors.tabIconSelected,
    borderRadius: 8,
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
