/** 从各类结果提炼可截图式「人格/状态标签」 */

export function truncateShareLabel(text: string, max = 28): string {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/[「」『』【】\[\]""'']/g, '')
    .trim();
  if (!clean) return '';
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

export function buildFortuneShareLabel(input: {
  fortuneRank?: string | null;
  socialLine?: string | null;
  mission?: string | null;
  poemTitle?: string | null;
}): string {
  const rank = truncateShareLabel(input.fortuneRank || '', 8);
  const social = truncateShareLabel(input.socialLine || '', 22);
  if (rank && social) return truncateShareLabel(`${rank}·${social}`, 28);
  if (social) return social;
  if (input.mission) return truncateShareLabel(`今日一招：${input.mission}`, 28);
  if (rank) return rank;
  return truncateShareLabel(input.poemTitle || '', 28);
}

export function buildZiShareLabel(input: {
  zi?: string | null;
  jixiong?: string | null;
  coldReading?: string | null;
  focusSummary?: string | null;
}): string {
  const zi = String(input.zi || '').trim().charAt(0);
  const jx = truncateShareLabel(input.jixiong || '', 6);
  const cold = truncateShareLabel(input.coldReading || input.focusSummary || '', 20);
  if (zi && cold) return truncateShareLabel(`${zi}·${cold}`, 28);
  if (zi && jx) return truncateShareLabel(`${zi}·${jx}`, 28);
  if (cold) return cold;
  return zi ? truncateShareLabel(`一字：${zi}`, 28) : '';
}

export function buildReadingShareLabel(input: {
  verdict?: string | null;
  emotionalTone?: string | null;
  nextStep?: string | null;
}): string {
  const verdict = truncateShareLabel(input.verdict || '', 28);
  if (verdict) return verdict;
  const tone = truncateShareLabel(input.emotionalTone || '', 16);
  if (tone) return tone;
  return truncateShareLabel(input.nextStep || '', 28);
}

export function buildReportShareLabel(input: {
  yearFocus?: string | null;
  weeklyAction?: string | null;
  overall?: string | null;
}): string {
  if (input.yearFocus) return truncateShareLabel(input.yearFocus, 28);
  if (input.weeklyAction) return truncateShareLabel(`本周一招：${input.weeklyAction}`, 28);
  return truncateShareLabel(input.overall || '', 28);
}

export function buildBaziShareLabel(input: {
  overall?: string | null;
  mindset?: string | null;
  dayGanZhi?: string | null;
}): string {
  const overall = truncateShareLabel(input.overall || '', 28);
  if (overall) return overall;
  const mindset = truncateShareLabel(input.mindset || '', 28);
  if (mindset) return mindset;
  const day = String(input.dayGanZhi || '').trim();
  return day ? truncateShareLabel(`日主 ${day}`, 28) : '';
}
