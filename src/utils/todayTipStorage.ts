import AsyncStorage from '@react-native-async-storage/async-storage';

export type TodayTipSource = 'fortune' | 'reading' | 'zi' | 'bazi' | 'chat' | 'report';

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

/** 当天已有一招、尚未关闭时，作为打开 App 的晨间定向 */
export function shouldShowTodayOrientation(
  record: TodayTipRecord | null,
  today = localDateKey(),
): boolean {
  if (!record?.tip) return false;
  if (record.dismissed) return false;
  return record.date === today;
}

export function buildTodayAskPrompt(record: TodayTipRecord): string {
  const tip = record.tip;
  if (record.source === 'report') {
    return `我今天想继续追问深度命运报告里的「本周一招」：${tip}。请先用一句接住我现在的状态，立刻给结论，再给今天能做的更小一步。我可能做了、卡住了、或想换一招。`;
  }
  return `今天的一招是：${tip}。我想继续：做了 / 卡住了 / 想把这一步拆小一点。请先用一句接住，立刻给结论，再给下一步。`;
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
  if (record.source === 'report') {
    return `昨天深度命运报告里给我的「本周一招」是：${tip}。我今天想继续：做了 / 没做 / 想换一招都可以。请先用一句接住现状，立刻给结论，再给下一步。`;
  }
  return `昨天给我的「今日一招」是：${tip}。我今天想继续：做了 / 没做 / 想换一招都可以。请先用一句接住现状，立刻给结论，再给下一步。`;
}
