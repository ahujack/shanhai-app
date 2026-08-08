import type { AppLanguage } from '../i18n/translations';

type TripleText = {
  zhCN: string;
  enUS: string;
  zhTW: string;
};

type LocalizeOptions = {
  rawMessage?: string;
  language: AppLanguage;
  fallback: TripleText;
};

const containsCjk = (value: string) => /[\u4e00-\u9fff]/.test(value);

const pick = (language: AppLanguage, text: TripleText): string => {
  if (language === 'en-US') return text.enUS;
  if (language === 'zh-TW') return text.zhTW;
  return text.zhCN;
};

const MAPPINGS: Array<{ pattern: RegExp; text: TripleText }> = [
  {
    pattern: /(邮箱|郵箱).*(未注册|不存在)|email.*(not.*(register|exist)|no account)/i,
    text: {
      zhCN: '该邮箱未注册，请先注册后再登录。',
      enUS: 'This email is not registered yet. Please sign up first.',
      zhTW: '該郵箱尚未註冊，請先註冊再登入。',
    },
  },
  {
    pattern: /(邮箱|郵箱).*(已注册)|email.*already.*registered/i,
    text: {
      zhCN: '该邮箱已注册，可直接登录或找回密码。',
      enUS: 'This email is already registered. Log in directly or reset password.',
      zhTW: '該郵箱已註冊，可直接登入或找回密碼。',
    },
  },
  {
    // 避免误匹配业务文案里的 “过期/expired”（如会员权益已过期）
    pattern: /(验证码|驗證碼|otp|verification code).*(错误|無效|无效|过期|過期|invalid|expired)/i,
    text: {
      zhCN: '验证码错误或已过期，请重新获取。',
      enUS: 'Verification code is invalid or expired. Please request a new one.',
      zhTW: '驗證碼錯誤或已過期，請重新獲取。',
    },
  },
  {
    pattern: /(密码|密碼|password).*(错误|錯誤|incorrect|wrong)|invalid credentials/i,
    text: {
      zhCN: '邮箱或密码错误，请检查后重试。',
      enUS: 'Email or password is incorrect. Please try again.',
      zhTW: '郵箱或密碼錯誤，請檢查後重試。',
    },
  },
  {
    pattern: /(频繁|頻繁|too many|rate limit|limit exceeded)/i,
    text: {
      zhCN: '请求过于频繁，请稍后再试。',
      enUS: 'Too many requests. Please try again later.',
      zhTW: '請求過於頻繁，請稍後再試。',
    },
  },
  {
    pattern: /(network|timeout|连接|連線|网络|網路|failed to fetch|load failed)/i,
    text: {
      zhCN: '网络连接不稳定，请检查后重试。',
      enUS: 'Network connection is unstable. Please check and retry.',
      zhTW: '網路連線不穩定，請檢查後重試。',
    },
  },
  {
    pattern: /(server|服务|服務|internal|500|gateway|upstream)/i,
    text: {
      zhCN: '服务暂时异常，请稍后重试。',
      enUS: 'Service is temporarily unavailable. Please try again later.',
      zhTW: '服務暫時異常，請稍後重試。',
    },
  },
];

export function localizeAuthMessage({ rawMessage, language, fallback }: LocalizeOptions): string {
  const raw = String(rawMessage || '').trim();

  if (raw) {
    const matched = MAPPINGS.find((item) => item.pattern.test(raw));
    if (matched) {
      return pick(language, matched.text);
    }

    if (language === 'zh-CN') {
      return raw;
    }

    return containsCjk(raw) ? pick(language, fallback) : raw;
  }

  return pick(language, fallback);
}

