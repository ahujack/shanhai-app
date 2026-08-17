import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { AppLanguage, t as translate } from '../i18n/translations';
import { setGlobalAppLanguage } from '../services/api';
import { useUserStore } from './user';

const LANGUAGE_KEY = 'shanhai_app_language';

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
};

function normalizeLanguage(raw: string | null | undefined): AppLanguage {
  if (!raw) return 'zh-CN';
  if (raw === 'en-US' || raw === 'zh-CN' || raw === 'zh-TW') return raw;
  const lower = raw.toLowerCase();
  if (lower.startsWith('en')) return 'en-US';
  if (lower.includes('tw') || lower.includes('hk') || lower === 'zh-hant') return 'zh-TW';
  return 'zh-CN';
}

function isSearchCrawler(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Googlebot|bingbot|BingPreview|Baiduspider|YandexBot|DuckDuckBot|Slurp|Applebot/i.test(
    navigator.userAgent || '',
  );
}

function detectPreferredLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'zh-CN';
  // 与 <html lang="zh-CN"> 一致，避免美区爬虫把整站判成英文 I Ching 站
  if (isSearchCrawler()) return 'zh-CN';
  const candidates = [
    window.navigator?.language,
    ...(Array.isArray(window.navigator?.languages) ? window.navigator.languages : []),
  ].filter(Boolean);
  return normalizeLanguage(candidates[0]);
}

interface I18nState {
  language: AppLanguage;
  /** 每次切换语言 +1，供页面感知并刷新缓存内容 */
  languageRevision: number;
  initialized: boolean;
  loadLanguage: () => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  tx: (zh: string, en: string, tw: string) => string;
}

function createTranslator(language: AppLanguage) {
  return (key: string, fallback?: string) => translate(language, key, fallback);
}

function createTx(language: AppLanguage) {
  return (zh: string, en: string, tw: string) =>
    language === 'en-US' ? en : language === 'zh-TW' ? tw : zh;
}

export const useI18nStore = create<I18nState>((set, get) => ({
  language: 'zh-CN',
  languageRevision: 0,
  initialized: false,
  t: createTranslator('zh-CN'),
  tx: createTx('zh-CN'),
  loadLanguage: async () => {
    try {
      const stored = await storage.getItem(LANGUAGE_KEY);
      const normalized = stored ? normalizeLanguage(stored) : detectPreferredLanguage();
      setGlobalAppLanguage(normalized);
      set({
        language: normalized,
        initialized: true,
        t: createTranslator(normalized),
        tx: createTx(normalized),
      });
    } catch {
      set({ initialized: true });
    }
  },
  setLanguage: async (language: AppLanguage) => {
    const prev = get().language;
    const normalized = normalizeLanguage(language);
    if (normalized === prev) return;

    setGlobalAppLanguage(normalized);
    set((state) => ({
      language: normalized,
      languageRevision: state.languageRevision + 1,
      t: createTranslator(normalized),
      tx: createTx(normalized),
    }));
    await storage.setItem(LANGUAGE_KEY, normalized);

    const { user, hasChart, refreshChart } = useUserStore.getState();
    if (user && hasChart) {
      refreshChart().catch(() => null);
    }
  },
}));
