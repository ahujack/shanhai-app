import * as THREE from 'three';
import { COMPANIONS, MAIN_SITE, chatPath } from '../config';

function go(path: string) {
  const url = path.startsWith('http') ? path : path;
  window.location.assign(url);
}
import { drawFortune, track } from '../api/fortune';
import { sounds } from '../audio/sounds';
import { openPanel, closePanel } from './panel';
import { triggerCompanionGreeting, waitCompanionBeat } from '../world/companion-anim';
import { triggerRitualStrike } from '../world/props';
import type { Hotspot } from '../world';
import type { PlayerController } from '../player/controller';

export type InteractionContext = {
  player?: PlayerController;
};

const WISH_KEY = 'shanhai_realm_wishes_v1';

function loadWishes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(WISH_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveWish(text: string) {
  const list = loadWishes().slice(0, 19);
  list.unshift(text);
  localStorage.setItem(WISH_KEY, JSON.stringify(list));
}

export async function runInteraction(hotspot: Hotspot, ctx: InteractionContext = {}) {
  sounds.unlock();
  void track('realm_interact', { kind: hotspot.kind, name: hotspot.name });

  switch (hotspot.kind) {
    case 'incense':
      sounds.incense();
      openPanel(
        '上香',
        `<p>三炷清香，先把心里的事放下片刻。</p>
         <p class="muted">这是道观里的静心仪式，不是宗教礼拜。内容仅供自我反思。</p>`,
        [{ label: '知道了', primary: true, onClick: closePanel }],
      );
      break;

    case 'moktak':
      sounds.moktak();
      triggerRitualStrike(hotspot.object, 'moktak');
      openPanel(
        '敲木鱼',
        `<p>笃——一声实木落定。把纷乱的念头敲回当下。</p>
         <p class="muted">可连敲几次，听庭院里的短回响。</p>`,
        [
          {
            label: '再敲一声',
            primary: true,
            onClick: () => {
              sounds.moktak();
              triggerRitualStrike(hotspot.object, 'moktak');
            },
          },
          { label: '收功', onClick: closePanel },
        ],
      );
      break;

    case 'qing':
      sounds.qing();
      triggerRitualStrike(hotspot.object, 'qing');
      openPanel(
        '击磬',
        `<p>磬音清越，余韵在廊柱间轻轻转了一圈。</p>`,
        [
          {
            label: '再击',
            primary: true,
            onClick: () => {
              sounds.qing();
              triggerRitualStrike(hotspot.object, 'qing');
            },
          },
          { label: '合上', onClick: closePanel },
        ],
      );
      break;

    case 'bell':
      sounds.bell();
      triggerRitualStrike(hotspot.object, 'bell');
      openPanel(
        '撞钟',
        `<p>钟声从梁上漫下来，山门方向仿佛也跟着静了一寸。</p>`,
        [
          {
            label: '再撞一记',
            primary: true,
            onClick: () => {
              sounds.bell();
              triggerRitualStrike(hotspot.object, 'bell');
            },
          },
          { label: '听见了', onClick: closePanel },
        ],
      );
      break;

    case 'cushion':
      sounds.sit();
      openPanel(
        '静坐',
        `<p>找一个舒适姿势。吸气四秒，停两秒，呼气六秒。</p>
         <p class="muted">不必久坐。一分钟也算回来。</p>`,
        [
          {
            label: '开始一分钟',
            primary: true,
            onClick: () => {
              closePanel();
              openPanel('静坐中', `<p>跟着呼吸。这一分钟只属于你。</p><p class="muted" id="sit-timer">60</p>`);
              let left = 60;
              const timer = setInterval(() => {
                left -= 1;
                const el = document.getElementById('sit-timer');
                if (el) el.textContent = String(left);
                if (left <= 0) {
                  clearInterval(timer);
                  openPanel('静坐完成', `<p>很好。把这份安定带回接下来的一步。</p>`, [
                    { label: '起身', primary: true, onClick: closePanel },
                  ]);
                }
              }, 1000);
            },
          },
          { label: '下次吧', onClick: closePanel },
        ],
      );
      break;

    case 'draw':
      sounds.draw();
      openPanel('抽签', `<p>心中默念一事，抽出一支今日签。</p><p class="muted">正在摇签筒…</p>`);
      try {
        const slip = await drawFortune();
        const poem = [slip.poem?.line1, slip.poem?.line2, slip.poem?.line3, slip.poem?.line4]
          .filter(Boolean)
          .join('<br/>');
        openPanel(
          slip.poem?.title ? `签诗 · ${slip.poem.title}` : '今日签',
          `<p><strong>${slip.fortuneRank || '签'}</strong> ${slip.drawCode ? `· ${slip.drawCode}` : ''}</p>
           <div class="poem">${poem || '山海有灵，一念知止。'}</div>
           <p>${slip.interpretation?.overall || slip.socialLine || ''}</p>
           <p class="muted">${slip.mission || slip.funTip || (slip.advice || []).slice(0, 2).join(' · ')}</p>`,
          [
            {
              label: '去殿内深聊',
              primary: true,
              onClick: () => go(chatPath('elder')),
            },
            { label: '收起', onClick: closePanel },
          ],
        );
        void track('realm_draw', { rank: slip.fortuneRank, id: slip.id });
      } catch {
        openPanel('抽签未成', `<p>签筒暂时安静。请稍后再试，或到主站抽今日签。</p>`, [
          {
            label: '打开今日签',
            primary: true,
            onClick: () => go(`${MAIN_SITE}/daily-fortune`),
          },
          { label: '关闭', onClick: closePanel },
        ]);
      }
      break;

    case 'wish': {
      sounds.wish();
      const recent = loadWishes()
        .slice(0, 3)
        .map((w) => `<li>${escapeHtml(w)}</li>`)
        .join('');
      openPanel(
        '祈福树',
        `<p>把一句心愿系在树上。只存在本机，不上传。</p>
         <input id="wish-input" maxlength="40" placeholder="例如：愿近日心安、事顺" />
         ${recent ? `<p class="muted">近愿</p><ul class="muted">${recent}</ul>` : ''}`,
        [
          {
            label: '系上',
            primary: true,
            onClick: () => {
              const input = document.getElementById('wish-input') as HTMLInputElement | null;
              const text = input?.value.trim();
              if (!text) return;
              saveWish(text);
              sounds.wish();
              openPanel('已系上', `<p>「${escapeHtml(text)}」已挂在枝上。愿你记得自己许过的那一步。</p>`, [
                { label: '好', primary: true, onClick: closePanel },
              ]);
              void track('realm_wish');
            },
          },
          { label: '取消', onClick: closePanel },
        ],
      );
      break;
    }

    case 'companion': {
      const c =
        COMPANIONS.find((x) => hotspot.name.includes(x.name)) ||
        COMPANIONS.find((x) => x.name === hotspot.name) ||
        COMPANIONS[0];

      // 镜头推近 + 鞠躬光晕 + 台词气泡
      sounds.companion();
      triggerCompanionGreeting(hotspot.object, c.greeting);
      ctx.player?.focusOn({
        lookAt: new THREE.Vector3(hotspot.position.x, 0, hotspot.position.z),
        distance: 4.6,
        pitch: 0.28,
        duration: 4.0,
      });

      openPanel(
        c.name,
        `<p class="muted">灵伴正在起身相迎…</p>`,
        [],
      );
      await waitCompanionBeat(950);

      openPanel(
        c.name,
        `<p class="poem">${c.greeting}</p>
         <p><strong>${c.title}</strong> · ${c.blurb}</p>
         <p class="muted">在道观里先认门；要深聊时再进殿内对话。</p>`,
        [
          {
            label: `去问${c.name}`,
            primary: true,
            onClick: () => {
              ctx.player?.clearFocus();
              go(c.path);
            },
          },
          {
            label: '测字',
            onClick: () => {
              ctx.player?.clearFocus();
              go(`${MAIN_SITE}/zi`);
            },
          },
          {
            label: '八字',
            onClick: () => {
              ctx.player?.clearFocus();
              go(`${MAIN_SITE}/bazi`);
            },
          },
          {
            label: '稍后再说',
            onClick: () => {
              ctx.player?.clearFocus();
              closePanel();
            },
          },
        ],
      );
      void track('realm_companion', { id: c.id, name: c.name });
      break;
    }

    case 'gate':
      openPanel(
        '山门',
        `<p>山海灵境 · 云游道观。</p>
         <p>不是判决，是下一步的坐标。</p>
         <p class="muted">内容仅供娱乐与自我反思。</p>`,
        [
          {
            label: '进入对话',
            primary: true,
            onClick: () => go(chatPath()),
          },
          {
            label: '去测字',
            onClick: () => go(`${MAIN_SITE}/zi`),
          },
          { label: '继续逛', onClick: closePanel },
        ],
      );
      break;
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!,
  );
}
