import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { AppLanguage, t as translate } from '../i18n/translations';
import { setGlobalAppLanguage } from '../services/api';

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

interface I18nState {
  language: AppLanguage;
  initialized: boolean;
  loadLanguage: () => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: string, fallback?: string) => string;
}

function createTranslator(language: AppLanguage) {
  return (key: string, fallback?: string) => translate(language, key, fallback);
}

export const useI18nStore = create<I18nState>((set) => ({
  language: 'zh-CN',
  initialized: false,
  t: createTranslator('zh-CN'),
  loadLanguage: async () => {
    try {
      const stored = await storage.getItem(LANGUAGE_KEY);
      const normalized = normalizeLanguage(stored);
      setGlobalAppLanguage(normalized);
      set({ language: normalized, initialized: true, t: createTranslator(normalized) });
    } catch {
      set({ initialized: true });
    }
  },
  setLanguage: async (language: AppLanguage) => {
    const normalized = normalizeLanguage(language);
    setGlobalAppLanguage(normalized);
    set({ language: normalized, t: createTranslator(normalized) });
    await storage.setItem(LANGUAGE_KEY, normalized);
  },
}));

