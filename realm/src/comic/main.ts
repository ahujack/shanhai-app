import { API_BASE, chatPath } from '../config';
import { track } from '../api/fortune';
import type { FortuneSlip } from '../api/fortune';
import { COMIC_CACHE_KEY, COMIC_SLIP_KEY, type FortuneComic } from './types';

const boot = document.getElementById('boot')!;
const bootMsg = document.getElementById('boot-msg')!;
const bootFill = document.getElementById('boot-fill')!;
const reader = document.getElementById('reader')!;
const strip = document.getElementById('strip')!;
const titleEl = document.getElementById('comic-title')!;
const subEl = document.getElementById('comic-sub')!;
const closingEl = document.getElementById('closing')!;
const chatLink = document.getElementById('chat-link') as HTMLAnchorElement;
const shareBtn = document.getElementById('share-btn')!;
const againBtn = document.getElementById('again-btn')!;
const toast = document.getElementById('toast')!;

function setBoot(p: number, msg?: string) {
  bootFill.style.width = `${Math.round(p * 100)}%`;
  if (msg) bootMsg.textContent = msg;
}

function showToast(text: string) {
  toast.textContent = text;
  toast.classList.remove('hidden');
  window.setTimeout(() => toast.classList.add('hidden'), 2200);
}

function readSlip(): FortuneSlip | null {
  try {
    const raw = sessionStorage.getItem(COMIC_SLIP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FortuneSlip;
  } catch {
    return null;
  }
}

async function fetchComic(slip: FortuneSlip | null): Promise<FortuneComic> {
  const res = await fetch(`${API_BASE}/fortunes/comic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slip: slip || undefined,
      companionId: 'elder',
    }),
  });
  if (!res.ok) throw new Error(`comic ${res.status}`);
  return res.json();
}

function renderComic(comic: FortuneComic) {
  titleEl.textContent = comic.title;
  subEl.textContent = comic.subtitle;
  closingEl.textContent = comic.closing;
  chatLink.href = chatPath(comic.companion.id);

  const cover = document.createElement('section');
  cover.className = 'panel cover';
  cover.dataset.visual = 'hall';
  cover.innerHTML = `
    <div class="rank">${escapeHtml(comic.rank)}</div>
    <h1>${escapeHtml(comic.poemTitle || comic.title)}</h1>
    <p>${escapeHtml(comic.companion.name)} · ${escapeHtml(comic.companion.title)}</p>
    <p>${escapeHtml(comic.subtitle)}</p>
  `;

  strip.replaceChildren(cover);

  comic.panels.forEach((panel, i) => {
    const el = document.createElement('section');
    el.className = 'panel';
    el.dataset.visual = panel.visual || 'path';
    el.innerHTML = `
      <div class="panel-index">${String(i + 1).padStart(2, '0')}</div>
      ${panel.poemLine ? `<p class="poem-line">${escapeHtml(panel.poemLine)}</p>` : ''}
      <p class="caption">${escapeHtml(panel.caption)}</p>
      <div class="bubble">
        <span class="who">${escapeHtml(comic.companion.name)}</span>
        ${escapeHtml(panel.bubble)}
      </div>
    `;
    strip.appendChild(el);
  });

  shareBtn.onclick = async () => {
    const shareData = {
      title: comic.title,
      text: comic.shareText,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${comic.shareText}\n${window.location.href}`);
        showToast('已复制分享文案');
      }
      void track('realm_comic_share', { id: comic.id, slipId: comic.slipId });
    } catch {
      /* 用户取消分享 */
    }
  };

  againBtn.onclick = () => {
    sessionStorage.removeItem(COMIC_SLIP_KEY);
    sessionStorage.removeItem(COMIC_CACHE_KEY);
    window.location.href = './';
  };

  boot.classList.add('hidden');
  reader.classList.remove('hidden');
  void track('realm_comic_view', { id: comic.id, slipId: comic.slipId, rank: comic.rank });
}

function escapeHtml(s: string) {
  return String(s || '').replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!,
  );
}

async function main() {
  setBoot(0.2, '展开签诗…');
  const slip = readSlip();
  setBoot(0.45, slip ? '灵伴正在分镜…' : '没有签底，改用观中常签起稿…');

  try {
    const cached = sessionStorage.getItem(COMIC_CACHE_KEY);
    if (cached) {
      const comic = JSON.parse(cached) as FortuneComic;
      setBoot(0.9, '装订成册…');
      renderComic(comic);
      return;
    }
  } catch {
    /* ignore */
  }

  try {
    const comic = await fetchComic(slip);
    sessionStorage.setItem(COMIC_CACHE_KEY, JSON.stringify(comic));
    setBoot(0.92, '装订成册…');
    renderComic(comic);
  } catch (err) {
    console.error(err);
    bootMsg.textContent = '这一卷暂时画不出来，请回道观再抽一支。';
    bootFill.style.width = '100%';
    const back = document.createElement('a');
    back.href = './';
    back.textContent = '回道观';
    back.style.cssText =
      'color:#c9a85a;letter-spacing:.12em;margin-top:12px;display:inline-block;text-decoration:none;';
    boot.appendChild(back);
  }
}

void main();
