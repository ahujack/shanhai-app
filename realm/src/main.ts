import * as THREE from 'three';
import { createSky, phaseFromClock } from './world/sky';
import { createWorld } from './world';
import { createPlayerController } from './player/controller';
import { createPostFX } from './render/postfx';
import { bindPanelChrome } from './ui/panel';
import { runInteraction } from './ui/interactions';
import { connectPresence } from './presence/client';
import { sounds } from './audio/sounds';
import { track } from './api/fortune';

const boot = document.getElementById('boot')!;
const bootMsg = document.getElementById('boot-msg')!;
const bootFill = document.getElementById('boot-fill')!;
const hud = document.getElementById('hud')!;
const prompt = document.getElementById('prompt')!;
const promptBtn = document.getElementById('prompt-btn') as HTMLButtonElement;
const hint = document.getElementById('hint')!;
const phaseLabel = document.getElementById('phase-label')!;
const presenceLabel = document.getElementById('presence-label')!;
const canvas = document.getElementById('c') as HTMLCanvasElement;

function setBoot(p: number, msg?: string) {
  bootFill.style.width = `${Math.round(p * 100)}%`;
  if (msg) bootMsg.textContent = msg;
}

async function main() {
  setBoot(0.1, '核对山门方位…');

  const lowPower =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined &&
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8) <= 4;

  const phase = phaseFromClock();
  const phaseText = { dawn: '晨', day: '昼', dusk: '暮', night: '夜' }[phase];
  phaseLabel.textContent = phaseText;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !lowPower,
    powerPreference: lowPower ? 'low-power' : 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = phase === 'night' ? 1.08 : 1.05;
  renderer.setClearColor(phase === 'night' ? 0x2e3644 : 0xe7e2d4, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 400);

  setBoot(0.35, '铺开山色与云雾…');
  const sky = createSky(scene, phase, lowPower);

  setBoot(0.55, '竖柱上梁…');
  const world = createWorld(sky);
  scene.add(world.root);

  setBoot(0.75, '请小道童入观…');
  const player = createPlayerController(scene, camera, canvas, world.walkable, () => world.hotspots);
  const interactCtx = { player };

  setBoot(0.85, '晕染墨色…');
  const postfx = createPostFX(renderer, scene, camera, lowPower);
  // OutlinePass 只描角色与近处道具，建筑改走网格墨线，避免近檐糊成黑块
  const propOutlines = world.hotspots.map((h) => h.object);
  postfx.setOutline([player.avatar, ...propOutlines]);
  postfx.resize(window.innerWidth, window.innerHeight, renderer.getPixelRatio());

  bindPanelChrome();
  // 关面板时收回特写镜头
  document.getElementById('panel-close')?.addEventListener('click', () => player.clearFocus());
  document.getElementById('panel')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('panel')) player.clearFocus();
  });

  const presence = connectPresence(scene, (n) => {
    presenceLabel.textContent = n <= 1 ? '独处' : `${n} 人同在`;
  });

  setBoot(0.92, '香火初起…');
  await new Promise((r) => setTimeout(r, 280));

  boot.classList.add('hidden');
  hud.classList.remove('hidden');
  void track('realm_enter', { phase });

  // 首次点击解锁音频
  const unlock = () => {
    sounds.unlock();
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock);

  // 提示 12 秒后淡出
  setTimeout(() => hint.classList.add('fade'), 12000);

  let activeHotspotId: string | null = null;
  const refreshPrompt = () => {
    const id = player.nearestHotspotId;
    if (id === activeHotspotId) return;
    activeHotspotId = id;
    if (!id) {
      prompt.classList.add('hidden');
      return;
    }
    const hs = world.hotspots.find((h) => h.id === id);
    if (!hs) {
      prompt.classList.add('hidden');
      return;
    }
    promptBtn.textContent = hs.prompt;
    prompt.classList.remove('hidden');
  };

  promptBtn.addEventListener('click', () => {
    const hs = world.hotspots.find((h) => h.id === player.nearestHotspotId);
    if (hs) void runInteraction(hs, interactCtx);
  });

  // 底部快捷导航：走到对应热点；灵伴会选最近的一位
  document.querySelectorAll<HTMLButtonElement>('.dock [data-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.go;
      const candidates = world.hotspots.filter((h) => h.kind === kind);
      if (!candidates.length) return;
      const hs = candidates.reduce((best, cur) =>
        player.position.distanceTo(cur.position) < player.position.distanceTo(best.position) ? cur : best,
      );
      // 走到热点前方一点
      const dx = player.position.x - hs.position.x;
      const dz = player.position.z - hs.position.z;
      const len = Math.hypot(dx, dz) || 1;
      const standX = hs.position.x + (dx / len) * Math.min(1.2, hs.radius * 0.45);
      const standZ = hs.position.z + (dz / len) * Math.min(1.2, hs.radius * 0.45);
      player.setTarget(standX, standZ);
      // 若已经很近，直接互动
      if (player.position.distanceTo(hs.position) < hs.radius) {
        void runInteraction(hs, interactCtx);
        return;
      }
      // 抵达后再自动触发（避免路过木鱼等被误点）
      const watch = setInterval(() => {
        if (player.position.distanceTo(hs.position) < hs.radius * 0.92) {
          clearInterval(watch);
          void runInteraction(hs, interactCtx);
        }
      }, 200);
      setTimeout(() => clearInterval(watch), 8000);
    });
  });

  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    postfx.resize(w, h, renderer.getPixelRatio());
  };
  window.addEventListener('resize', onResize);

  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    player.update(dt, t);
    world.update(t);
    sky.update(camera);
    presence.updateLocal(player.getPose());
    refreshPrompt();
    postfx.render();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

main().catch((err) => {
  console.error(err);
  bootMsg.textContent = '道观暂时进不去，请刷新再试。';
  bootFill.style.width = '100%';
});
