import { Alert, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { AppLanguage } from '../i18n/translations';

export const REFERRAL_INVITE_BASE = 'https://www.shanhai.app/invite';

export type ResultShareKind = 'zi' | 'reading' | 'bazi' | 'fortune' | 'report';

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

function pickCopy(language: AppLanguage): { inviteLine: string; guestCta: string; disclaimer: string } {
  if (language === 'en-US') {
    return {
      inviteLine: 'If it helped, try it here.',
      guestCta: 'Open the link and try one reading.',
      disclaimer: 'For entertainment and self-reflection only.',
    };
  }
  if (language === 'zh-TW') {
    return {
      inviteLine: '覺得有用，打開連結自己試一次。',
      guestCta: '打開連結，自己測一次。',
      disclaimer: '僅供娛樂參考，不構成專業建議。',
    };
  }
  return {
    inviteLine: '觉得有用，打开链接自己试一次。',
    guestCta: '打开链接，自己测一次。',
    disclaimer: '仅供娱乐参考，不构成专业建议。',
  };
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
  shareLabel?: string | null;
  referralCode?: string | null;
}): ShareCopy {
  const { language, headline, summary, shareLabel, referralCode } = params;
  const { inviteLine, guestCta, disclaimer } = pickCopy(language);
  const safeLabel = String(shareLabel || '').trim().slice(0, 32);
  const safeHeadline = headline.trim().slice(0, 120);
  const safeSummary = summary.trim().slice(0, 160);
  const url = referralCode ? buildReferralUrl(referralCode) : 'https://www.shanhai.app';
  const brand = language === 'en-US' ? 'Shanhai Realm' : language === 'zh-TW' ? '山海靈境' : '山海灵境';
  const anchorPrefix = language === 'en-US' ? 'Anchor: ' : language === 'zh-TW' ? '錨點：' : '锚点：';

  return {
    title: brand,
    body: [
      safeHeadline,
      safeLabel ? `${anchorPrefix}${safeLabel}` : '',
      safeSummary,
      `\n${url}`,
      disclaimer,
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
  shareLabel?: string | null;
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

export function showShareSuccessAlert(language: AppLanguage, hasImage: boolean): void {
  const title =
    language === 'en-US' ? 'Ready to share' : language === 'zh-TW' ? '已準備好分享' : '已准备好分享';
  const message = hasImage
    ? language === 'en-US'
      ? 'Image saved and text copied. Post the image; the sentence is in your clipboard.'
      : language === 'zh-TW'
        ? '圖片已保存，文案已複製。發圖時把那句結論貼上即可。'
        : '图片已保存，文案已复制。发图时把那句结论贴上即可。'
    : language === 'en-US'
      ? 'Text copied. Share the conclusion with a friend.'
      : language === 'zh-TW'
        ? '文案已複製。把這句結論發給朋友吧。'
        : '文案已复制。把这句结论发给朋友吧。';

  Alert.alert(title, message);
}
