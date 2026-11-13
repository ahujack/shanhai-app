import { API_BASE } from '../config';

export interface FortuneSlip {
  id: string;
  poem?: {
    title?: string;
    line1?: string;
    line2?: string;
    line3?: string;
    line4?: string;
  };
  interpretation?: {
    overall?: string;
    love?: string;
    career?: string;
    wealth?: string;
    health?: string;
  };
  advice?: string[];
  fortuneRank?: string;
  mission?: string;
  socialLine?: string;
  funTip?: string;
  drawCode?: string;
}

export async function drawFortune(): Promise<FortuneSlip> {
  const res = await fetch(`${API_BASE}/fortunes/draw`);
  if (!res.ok) throw new Error(`抽签失败 (${res.status})`);
  return res.json();
}

export async function composeFortuneComic(
  slip?: FortuneSlip,
  companionId: 'elder' | 'youth' | 'oracle' = 'elder',
) {
  const res = await fetch(`${API_BASE}/fortunes/comic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slip, companionId }),
  });
  if (!res.ok) throw new Error(`条漫失败 (${res.status})`);
  return res.json();
}

export async function track(name: string, props?: Record<string, unknown>) {
  try {
    await fetch(`${API_BASE}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [{ name, props, clientTime: new Date().toISOString() }],
        client: {
          locale: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          region: 'realm',
        },
      }),
    });
  } catch {
    /* 埋点失败不影响体验 */
  }
}
