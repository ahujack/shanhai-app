import AsyncStorage from '@react-native-async-storage/async-storage';

export type TodayTipSource = 'fortune' | 'reading' | 'zi' | 'bazi' | 'chat';

export type TodayTipRecord = {
  date: string; // YYYY-MM-DD local
  tip: string;
  source: TodayTipSource;
  headline?: string;
  dismissed?: boolean;
  followedUpAt?: string | null;
};

const TODAY_TIP_KEY = 'shanhai_today_tip_v1';

export function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function loadTodayTip(): Promise<TodayTipRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(TODAY_TIP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TodayTipRecord;
    if (!parsed?.date || !parsed?.tip) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveTodayTip(input: {
  tip: string;
  source: TodayTipSource;
  headline?: string;
  date?: string;
}): Promise<TodayTipRecord | null> {
  const tip = String(input.tip || '').trim().slice(0, 120);
  if (!tip) return null;
  const record: TodayTipRecord = {
    date: input.date || localDateKey(),
    tip,
    source: input.source,
    headline: input.headline?.trim().slice(0, 80) || undefined,
    dismissed: false,
    followedUpAt: null,
  };
  try {
    await AsyncStorage.setItem(TODAY_TIP_KEY, JSON.stringify(record));
    return record;
  } catch {
    return null;
  }
}

/** 有昨日（或更早）未关闭、未回访的「今日一招」时展示回访卡 */
export function shouldShowFollowUp(record: TodayTipRecord | null, today = localDateKey()): boolean {
  if (!record?.tip) return false;
  if (record.dismissed) return false;
  if (record.followedUpAt) return false;
  return record.date < today;
}

export async function markTodayTipFollowedUp(): Promise<void> {
  const current = await loadTodayTip();
  if (!current) return;
  try {
    await AsyncStorage.setItem(
      TODAY_TIP_KEY,
      JSON.stringify({
        ...current,
        followedUpAt: new Date().toISOString(),
      } satisfies TodayTipRecord),
    );
  } catch {
    // ignore
  }
}

export async function dismissTodayTip(): Promise<void> {
  const current = await loadTodayTip();
  if (!current) return;
  try {
    await AsyncStorage.setItem(
      TODAY_TIP_KEY,
      JSON.stringify({
        ...current,
        dismissed: true,
      } satisfies TodayTipRecord),
    );
  } catch {
    // ignore
  }
}

export function buildFollowUpPrompt(record: TodayTipRecord): string {
  const tip = record.tip;
  return `昨天给我的「今日一招」是：${tip}。我今天想继续聊聊：做了 / 没做 / 想换一招都可以，先帮我接住现状，再给下一步。`;
}
