import { Platform } from 'react-native';
import type { ResultShareKind } from './referralShare';

const GOLD = '#D6B36A';
const PAPER = '#0C0A08';
const CREAM = '#F7F1E6';
const MUTED = 'rgba(232, 226, 212, 0.72)';

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const chars = Array.from(String(text || '').trim());
  if (!chars.length) return [];
  const lines: string[] = [];
  let current = '';
  for (const ch of chars) {
    const next = current + ch;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = ch;
      if (lines.length === maxLines) {
        const last = lines[maxLines - 1];
        lines[maxLines - 1] = `${last.slice(0, Math.max(1, last.length - 1))}…`;
        return lines;
      }
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function kindGlyph(kind: ResultShareKind): string {
  return ({ zi: '字', reading: '卦', bazi: '命', fortune: '签', report: '镜' } as const)[kind];
}

/** Web 导出 3:4 分享图，适合小红书。Native 仍走 ViewShot。 */
export async function downloadWebSharePng(input: {
  kind: ResultShareKind;
  headline: string;
  summary?: string;
  shareLabel?: string;
  url: string;
}): Promise<boolean> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  const width = 1080;
  const height = 1440;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.strokeRect(48, 48, width - 96, height - 96);
  ctx.lineWidth = 1;
  ctx.strokeRect(72, 72, width - 144, height - 144);

  const fontStack = '"Noto Serif SC", "Songti SC", "PingFang SC", serif';
  ctx.fillStyle = GOLD;
  ctx.font = `600 28px ${fontStack}`;
  ctx.fillText('山海灵境', 108, 160);
  ctx.font = `italic 26px ${fontStack}`;
  ctx.fillStyle = 'rgba(214, 179, 106, 0.78)';
  ctx.fillText('不是判决，是下一步的坐标', 108, 210);

  ctx.fillStyle = GOLD;
  ctx.font = `700 36px ${fontStack}`;
  ctx.fillText(kindGlyph(input.kind), width - 160, 168);

  let y = 300;
  const label = String(input.shareLabel || '').trim();
  if (label) {
    ctx.font = `700 36px ${fontStack}`;
    const padX = 22;
    const labelW = Math.min(ctx.measureText(label).width + padX * 2, width - 216);
    ctx.strokeStyle = 'rgba(214, 179, 106, 0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(108, y - 44, labelW, 64);
    ctx.fillStyle = '#F5E6C8';
    ctx.fillText(label, 108 + padX, y);
    y += 100;
  }

  ctx.fillStyle = CREAM;
  ctx.font = `600 54px ${fontStack}`;
  const headlineLines = wrapLines(ctx, input.headline, width - 216, 4);
  for (const line of headlineLines) {
    ctx.fillText(line, 108, y);
    y += 72;
  }

  const summary = String(input.summary || '').trim();
  if (summary) {
    y += 24;
    ctx.fillStyle = MUTED;
    ctx.font = `400 34px ${fontStack}`;
    const summaryLines = wrapLines(ctx, summary, width - 216, 6);
    for (const line of summaryLines) {
      ctx.fillText(line, 108, y);
      y += 50;
    }
  }

  const url = String(input.url || 'https://www.shanhai.app').replace(/^https?:\/\//, '');
  ctx.fillStyle = GOLD;
  ctx.font = `700 30px ${fontStack}`;
  ctx.fillText(url, 108, height - 160);
  ctx.fillStyle = 'rgba(232, 226, 212, 0.45)';
  ctx.font = `400 24px ${fontStack}`;
  ctx.fillText('仅供娱乐与自我反思  ·  shanhai.app', 108, height - 110);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return false;
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = 'shanhai-share.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
  return true;
}
