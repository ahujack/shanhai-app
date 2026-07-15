import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REFERRAL_ATTRIBUTION_KEY = 'shanhai_referral_attribution';
const DEFAULT_ATTRIBUTION_DAYS = 30;

type StoredReferral = {
  code: string;
  capturedAt: number;
  expiresAt: number;
};

function normalizeReferralCode(value?: string | null): string {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '');
}

export async function captureReferralFromUrl(): Promise<string | null> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search || '');
    const raw = params.get('ref') || params.get('utm_ref') || params.get('invite');
    const code = normalizeReferralCode(raw);
    if (!code) return null;
    const now = Date.now();
    const payload: StoredReferral = {
      code,
      capturedAt: now,
      expiresAt: now + DEFAULT_ATTRIBUTION_DAYS * 86400000,
    };
    await AsyncStorage.setItem(REFERRAL_ATTRIBUTION_KEY, JSON.stringify(payload));
    try {
      window.localStorage?.setItem(REFERRAL_ATTRIBUTION_KEY, JSON.stringify(payload));
    } catch {
      // ignore localStorage failure
    }
    return code;
  } catch {
    return null;
  }
}

export async function getStoredReferralCode(): Promise<string | null> {
  try {
    const raw =
      (await AsyncStorage.getItem(REFERRAL_ATTRIBUTION_KEY)) ||
      (typeof window !== 'undefined'
        ? window.localStorage?.getItem(REFERRAL_ATTRIBUTION_KEY)
        : null);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReferral;
    const code = normalizeReferralCode(parsed.code);
    if (!code || !parsed.expiresAt || parsed.expiresAt < Date.now()) {
      await clearStoredReferralCode();
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

export async function clearStoredReferralCode(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REFERRAL_ATTRIBUTION_KEY);
  } catch {
    // ignore
  }
  try {
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem(REFERRAL_ATTRIBUTION_KEY);
    }
  } catch {
    // ignore
  }
}
