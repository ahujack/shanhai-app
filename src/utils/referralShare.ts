import { Alert, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { AppLanguage } from '../i18n/translations';

export const REFERRAL_INVITE_BASE = 'https://www.shanhai.app/invite';

export type ResultShareKind = 'zi' | 'reading' | 'bazi' | 'fortune';

type ShareCopy = {
  title: string;
  body: string;
  cta: string;
};

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      const clipboard = (globalThis as any)?.navigator?.clipboard;
      if (clipboard?.writeText) {
        await clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fallback below */
    }
    try {
      const doc = (globalThis as any)?.document;
      if (doc?.createElement && doc?.body) {
        const textarea = doc.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        doc.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = doc.execCommand?.('copy') !== false;
        doc.body.removeChild(textarea);
        return ok;
      }
    } catch {
      /* fallback below */
    }
  }
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

function pickCopy(language: AppLanguage, kind: ResultShareKind): { label: string; inviteLine: string } {
  const kindLabel =
    language === 'en-US'
      ? ({ zi: 'Symbol Reading', reading: 'Oracle Reading', bazi: 'Eastern Birth Chart', fortune: 'Daily Oracle' } as const)[kind]
      : language === 'zh-TW'
        ? ({ zi: '測字解讀', reading: '占卜解讀', bazi: '八字命盤', fortune: '今日靈簽' } as const)[kind]
        : ({ zi: '测字解读', reading: '占卜解读', bazi: '八字命盘', fortune: '今日灵签' } as const)[kind];

  const inviteLine =
    language === 'en-US'
      ? 'Register with my invite link — we both get +50 points for readings!'
      : language === 'zh-TW'
        ? '用我的連結註冊，你我各得 50 積分。'
        : '用我的链接注册，你我各得 50 积分。';

  return { label: kindLabel, inviteLine };
}

export function buildReferralUrl(referralCode: string): string {
  const code = String(referralCode || '').trim();
  return `${REFERRAL_INVITE_BASE}?ref=${encodeURIComponent(code)}`;
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
        `🔮 I just tried Shanhai Realm, an Eastern oracle AI, for a ${label}`,
        safeHeadline ? `📌 Main takeaway: ${safeHeadline}` : '',
        safeSummary ? `💬 Note: ${safeSummary}` : '',
        referralCode ? `\nInvite code: ${referralCode}` : '',
        referralCode ? inviteLine : 'Try the Eastern oracle AI yourself.',
        `\nTry it here: ${url}`,
        '\nFor entertainment and self-reflection only. — shanhai.app',
      ]
        .filter(Boolean)
        .join('\n'),
      cta: referralCode ? inviteLine : 'Try it on shanhai.app',
    };
  }

  const brand = language === 'zh-TW' ? '山海靈境' : '山海灵境';
  const intro = language === 'zh-TW'
    ? `🔮 我剛在${brand}看了一次${label}`
    : `🔮 我刚在${brand}看了一次${label}`;
  const resultLabel = language === 'zh-TW' ? '📌 主要提醒：' : '📌 主要提醒：';
  const summaryLabel = language === 'zh-TW' ? '💬 其中一句：' : '💬 其中一句：';
  const tryLabel = language === 'zh-TW' ? '立即體驗：' : '立即体验：';
  const disclaimer = language === 'zh-TW'
    ? '僅供娛樂參考，不構成專業建議。— shanhai.app'
    : '仅供娱乐参考，不构成专业建议。— shanhai.app';
  const guestCta = language === 'zh-TW' ? '你也可以打開連結自己試一次。' : '你也可以打开链接自己试一次。';
  return {
    title: brand,
    body: [
      intro,
      safeHeadline ? `${resultLabel}${safeHeadline}` : '',
      safeSummary ? `${summaryLabel}${safeSummary}` : '',
      referralCode ? `\n邀请码：${referralCode}` : '',
      referralCode ? inviteLine : guestCta,
      `\n${tryLabel}${url}`,
      `\n${disclaimer}`,
    ]
      .filter(Boolean)
      .join('\n'),
    cta: referralCode ? inviteLine : guestCta,
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
    if (await copyTextToClipboard(copy.body)) {
      onCopied?.();
      return true;
    }
    return false;
  }

  try {
    await Share.share({ message: copy.body, title: copy.title });
    return true;
  } catch {
    if (await copyTextToClipboard(copy.body)) {
      onCopied?.();
      return true;
    }
    return false;
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
