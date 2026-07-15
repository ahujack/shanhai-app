import { Alert, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { AppLanguage } from '../i18n/translations';

export const REFERRAL_REGISTER_BASE = 'https://www.shanhai.app/register';

export type ResultShareKind = 'zi' | 'reading' | 'bazi' | 'fortune';

type ShareCopy = {
  title: string;
  body: string;
  cta: string;
};

function pickCopy(language: AppLanguage, kind: ResultShareKind): { label: string; inviteLine: string } {
  const kindLabel =
    language === 'en-US'
      ? ({ zi: 'Character Reading', reading: 'Divination Reading', bazi: 'BaZi Chart', fortune: 'Daily Fortune' } as const)[kind]
      : language === 'zh-TW'
        ? ({ zi: '測字解讀', reading: '占卜解讀', bazi: '八字命盤', fortune: '今日靈簽' } as const)[kind]
        : ({ zi: '测字解读', reading: '占卜解读', bazi: '八字命盘', fortune: '今日灵签' } as const)[kind];

  const inviteLine =
    language === 'en-US'
      ? 'Register with my invite link — we both get +50 points!'
      : language === 'zh-TW'
        ? '用我的邀請連結註冊，你我都可獲得 +50 積分！'
        : '用我的邀请链接注册，你我各得 50 积分！';

  return { label: kindLabel, inviteLine };
}

export function buildReferralUrl(referralCode: string): string {
  const code = String(referralCode || '').trim();
  return `${REFERRAL_REGISTER_BASE}?ref=${encodeURIComponent(code)}`;
}

export function buildResultShareCopy(params: {
  language: AppLanguage;
  kind: ResultShareKind;
  headline: string;
  summary: string;
  referralCode?: string | null;
}): ShareCopy {
  const { language, kind, headline, summary, referralCode } = params;
  const { label, inviteLine } = pickCopy(language, kind);
  const safeHeadline = headline.trim().slice(0, 120);
  const safeSummary = summary.trim().slice(0, 280);
  const url = referralCode ? buildReferralUrl(referralCode) : 'https://www.shanhai.app';

  if (language === 'en-US') {
    return {
      title: 'Shanhai Realm',
      body: [
        `🔮 I just tried ${label} on Shanhai Realm`,
        safeHeadline ? `📌 Result: ${safeHeadline}` : '',
        safeSummary ? `💬 It read: ${safeSummary}` : '',
        referralCode ? `\nInvite code: ${referralCode}` : '',
        inviteLine,
        `\nTry it: ${url}`,
        '\nFor entertainment reference only.',
      ]
        .filter(Boolean)
        .join('\n'),
      cta: inviteLine,
    };
  }

  const brand = language === 'zh-TW' ? '山海靈境' : '山海灵境';
  const intro = language === 'zh-TW'
    ? `🔮 我剛在${brand}做了一次${label}`
    : `🔮 我刚在${brand}做了一次${label}`;
  const resultLabel = language === 'zh-TW' ? '📌 結果：' : '📌 结果：';
  const summaryLabel = language === 'zh-TW' ? '💬 解讀說：' : '💬 解读说：';
  const tryLabel = language === 'zh-TW' ? '立即體驗：' : '立即体验：';
  const disclaimer = language === 'zh-TW' ? '僅供娛樂參考，不構成專業建議。' : '仅供娱乐参考，不构成专业建议。';
  return {
    title: brand,
    body: [
      intro,
      safeHeadline ? `${resultLabel}${safeHeadline}` : '',
      safeSummary ? `${summaryLabel}${safeSummary}` : '',
      referralCode ? `\n邀请码：${referralCode}` : '',
      inviteLine,
      `\n${tryLabel}${url}`,
      `\n${disclaimer}`,
    ]
      .filter(Boolean)
      .join('\n'),
    cta: inviteLine,
  };
}

export async function shareResultCopy(params: {
  language: AppLanguage;
  kind: ResultShareKind;
  headline: string;
  summary: string;
  referralCode?: string | null;
  onCopied?: () => void;
}): Promise<boolean> {
  const { onCopied } = params;
  const copy = buildResultShareCopy(params);

  if (Platform.OS === 'web') {
    try {
      await Clipboard.setStringAsync(copy.body);
      onCopied?.();
      return true;
    } catch {
      return false;
    }
  }

  try {
    await Share.share({ message: copy.body, title: copy.title });
    return true;
  } catch {
    try {
      await Clipboard.setStringAsync(copy.body);
      onCopied?.();
      return true;
    } catch {
      return false;
    }
  }
}

export function showShareSuccessAlert(language: AppLanguage, hasReferral: boolean): void {
  const title =
    language === 'en-US' ? '✅ Ready to share' : language === 'zh-TW' ? '✅ 已準備好分享' : '✅ 已准备好分享';
  const message = hasReferral
    ? language === 'en-US'
      ? 'Content copied. Share with friends — both of you get +50 points after they register.'
      : language === 'zh-TW'
        ? '內容已複製。分享給朋友，對方註冊成功後你們各得 +50 積分。'
        : '内容已复制。分享给朋友，对方注册成功后你们各得 50 积分。'
    : language === 'en-US'
      ? 'Content copied. Share your reading with friends on Shanhai Realm.'
      : language === 'zh-TW'
        ? '內容已複製。把這份解讀分享給朋友吧。'
        : '内容已复制。把这份解读分享给朋友吧。';

  Alert.alert(title, message);
}
