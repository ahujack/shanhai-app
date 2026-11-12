import * as THREE from 'three';
import { C, box, cyl, label, mesh, softTexture } from './kit';
import { COMPANIONS } from '../config';

export type HotspotKind =
  | 'incense'
  | 'moktak'
  | 'qing'
  | 'bell'
  | 'cushion'
  | 'draw'
  | 'wish'
  | 'companion'
  | 'gate';

export interface Hotspot {
  id: string;
  kind: HotspotKind;
  name: string;
  prompt: string;
  position: THREE.Vector3;
  radius: number;
  object: THREE.Object3D;
}

function addHotspot(
  list: Hotspot[],
  kind: HotspotKind,
  name: string,
  prompt: string,
  object: THREE.Object3D,
  x: number,
  z: number,
  radius = 2.2,
  y = 0,
) {
  list.push({
    id: `${kind}-${list.length}`,
    kind,
    name,
    prompt,
    position: new THREE.Vector3(x, y, z),
    radius,
    object,
  });
}

/** 青铜香炉 + 三炷香 */
export function makeIncense(x: number, z: number, hotspots: Hotspot[]): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(cyl(0.55, 0.62, 0.18, 10, C.stoneDark, 0, 0.09, 0));
  g.add(cyl(0.42, 0.48, 0.7, 10, C.bronze, 0, 0.5, 0));
  g.add(cyl(0.5, 0.5, 0.1, 10, C.bronzeDark, 0, 0.88, 0));
  for (const sx of [-0.28, 0.28]) {
    const ear = box(0.08, 0.28, 0.14, C.bronzeDark, sx * 0.52, 0.78, 0);
    g.add(ear);
  }

  const sticks = new THREE.Group();
  sticks.name = 'incense-sticks';
  for (let i = 0; i < 3; i++) {
    const stick = cyl(0.018, 0.022, 0.9, 5, 0xc9b48a, (i - 1) * 0.1, 1.35, 0.02 * (i % 2));
    sticks.add(stick);
    const tip = mesh(new THREE.SphereGeometry(0.03, 6, 4), 0xff6a3c);
    tip.position.set((i - 1) * 0.1, 1.82, 0.02 * (i % 2));
    tip.name = 'ember';
    sticks.add(tip);
  }
  g.add(sticks);

  const smoke = new THREE.Group();
  smoke.name = 'smoke';
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: softTexture(),
        color: 0xd8d2c4,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    s.scale.setScalar(0.4);
    s.userData.phase = i * 0.7;
    smoke.add(s);
  }
  smoke.position.set(0, 1.9, 0);
  g.add(smoke);

  const tag = label('上香');
  tag.position.set(0, 2.35, 0);
  g.add(tag);

  addHotspot(hotspots, 'incense', '香炉', '上香', g, x, z, 2.4);
  return g;
}

/** 木鱼 */
export function makeMoktak(x: number, z: number, hotspots: Hotspot[]): THREE.Group {
  const g = new THREE.Group();
  g.name = 'moktak-root';
  g.position.set(x, 0, z);
  g.add(box(0.9, 0.18, 0.7, C.woodDark, 0, 0.09, 0));
  const body = mesh(new THREE.SphereGeometry(0.38, 14, 12), C.wood);
  body.name = 'moktak-body';
  body.scale.set(1.15, 0.85, 1);
  body.position.y = 0.48;
  g.add(body);
  const mouth = mesh(new THREE.TorusGeometry(0.16, 0.04, 6, 14), C.woodDark);
  mouth.rotation.x = Math.PI / 2;
  mouth.position.set(0, 0.55, 0.28);
  g.add(mouth);
  // 槌：柄 + 槌头，绕近端摆动
  const mallet = new THREE.Group();
  mallet.name = 'mallet';
  mallet.position.set(0.38, 0.55, 0.12);
  mallet.rotation.z = 0.55;
  const shaft = cyl(0.028, 0.032, 0.52, 6, C.woodDark, 0, -0.12, 0);
  shaft.rotation.z = 0.2;
  mallet.add(shaft);
  const head = mesh(new THREE.SphereGeometry(0.08, 10, 8), C.wood);
  head.position.set(0.04, -0.36, 0);
  mallet.add(head);
  g.add(mallet);
  const tag = label('敲木鱼');
  tag.position.set(0, 1.35, 0);
  g.add(tag);
  addHotspot(hotspots, 'moktak', '木鱼', '敲木鱼', g, x, z, 2.1);
  return g;
}

/** 铜磬 */
export function makeQing(x: number, z: number, hotspots: Hotspot[]): THREE.Group {
  const g = new THREE.Group();
  g.name = 'qing-root';
  g.position.set(x, 0, z);
  g.add(box(0.7, 0.14, 0.7, C.wood, 0, 0.07, 0));
  const bowl = mesh(new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), C.brass);
  bowl.name = 'qing-bowl';
  bowl.position.y = 0.28;
  g.add(bowl);
  const rim = mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 20), C.gold);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.42;
  g.add(rim);
  const stick = new THREE.Group();
  stick.name = 'stick';
  stick.position.set(0.4, 0.42, 0);
  stick.rotation.z = -0.55;
  stick.add(cyl(0.03, 0.035, 0.48, 6, C.woodDark, 0, -0.1, 0));
  stick.add(mesh(new THREE.SphereGeometry(0.055, 8, 6), C.wood));
  (stick.children[1] as THREE.Object3D).position.set(0, -0.32, 0);
  g.add(stick);
  const tag = label('击磬');
  tag.position.set(0, 1.15, 0);
  g.add(tag);
  addHotspot(hotspots, 'qing', '铜磬', '击磬', g, x, z, 2.0);
  return g;
}

/** 大钟 */
export function makeBell(x: number, z: number, hotspots: Hotspot[]): THREE.Group {
  const g = new THREE.Group();
  g.name = 'bell-root';
  g.position.set(x, 0, z);
  for (const sx of [-0.9, 0.9]) g.add(box(0.16, 3.2, 0.16, C.wood, sx, 1.6, 0));
  g.add(box(2.1, 0.18, 0.18, C.wood, 0, 3.15, 0));
  g.add(box(2.2, 0.12, 0.7, C.stoneDark, 0, 0.06, 0));
  const bell = mesh(new THREE.CylinderGeometry(0.35, 0.55, 1.1, 14), C.bronze);
  bell.position.y = 2.2;
  bell.name = 'bell-body';
  g.add(bell);
  g.add(cyl(0.12, 0.2, 0.25, 8, C.bronzeDark, 0, 2.85, 0));
  const tag = label('撞钟');
  tag.position.set(0, 3.55, 0);
  g.add(tag);
  addHotspot(hotspots, 'bell', '大钟', '撞钟', g, x, z, 2.6);
  return g;
}

/** 蒲团 */
export function makeCushion(x: number, z: number, hotspots: Hotspot[], rotY = 0): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  const pad = mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.12, 16), 0x8b3a32);
  pad.position.y = 0.06;
  g.add(pad);
  const rim = mesh(new THREE.TorusGeometry(0.4, 0.04, 6, 20), C.gold);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.12;
  g.add(rim);
  const tag = label('静坐');
  tag.position.set(0, 0.85, 0);
  g.add(tag);
  addHotspot(hotspots, 'cushion', '蒲团', '静坐片刻', g, x, z, 1.8);
  return g;
}

/** 签筒 */
export function makeDrawLot(x: number, z: number, hotspots: Hotspot[]): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(box(0.9, 0.7, 0.9, C.wood, 0, 0.35, 0));
  g.add(cyl(0.28, 0.32, 0.85, 10, C.woodDark, 0, 1.05, 0));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const stick = box(0.04, 0.7, 0.04, C.straw, Math.cos(a) * 0.12, 1.55, Math.sin(a) * 0.12);
    stick.rotation.z = Math.cos(a) * 0.08;
    stick.rotation.x = Math.sin(a) * 0.08;
    g.add(stick);
  }
  const tag = label('抽签');
  tag.position.set(0, 2.15, 0);
  g.add(tag);
  addHotspot(hotspots, 'draw', '签筒', '抽一支签', g, x, z, 2.2);
  return g;
}

/** 祈福树（银杏）+ 红绳 */
export function makeWishTree(x: number, z: number, hotspots: Hotspot[]): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(cyl(0.22, 0.32, 2.4, 7, C.trunk, 0, 1.2, 0));
  for (let i = 0; i < 5; i++) {
    const canopy = mesh(new THREE.SphereGeometry(1.1 - i * 0.08, 8, 6), i % 2 ? C.ginkgo : 0xe0b84a);
    canopy.position.set(Math.cos(i) * 0.35, 2.6 + (i % 3) * 0.35, Math.sin(i * 1.7) * 0.35);
    canopy.scale.set(1.2, 0.75, 1.1);
    g.add(canopy);
  }
  for (let i = 0; i < 10; i++) {
    const ribbon = box(0.04, 0.45, 0.01, C.ribbon, Math.cos(i) * 0.7, 1.9 + (i % 3) * 0.15, Math.sin(i) * 0.7);
    ribbon.rotation.y = i;
    g.add(ribbon);
  }
  const tag = label('祈福');
  tag.position.set(0, 4.2, 0);
  g.add(tag);
  addHotspot(hotspots, 'wish', '祈福树', '系一条心愿', g, x, z, 2.8);
  return g;
}

/** 灵伴石座：可鞠躬、光晕、台词气泡的可动画角色 */
export function makeCompanionSpot(
  x: number,
  z: number,
  name: string,
  hotspots: Hotspot[],
  hue: number,
  auraColor = C.gold,
): THREE.Group {
  const g = new THREE.Group();
  g.name = 'companion-root';
  g.position.set(x, 0, z);
  // 默认朝 +Z，面向庭院来客

  const meta = COMPANIONS.find((c) => c.name === name);
  g.userData.companionId = meta?.id || name;

  g.add(cyl(0.55, 0.62, 0.2, 8, C.stone, 0, 0.1, 0));

  // 脚下光环
  const ring = mesh(
    new THREE.RingGeometry(0.55, 0.78, 24),
    new THREE.MeshBasicMaterial({
      color: auraColor,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.name = 'companion-ring';
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  ring.castShadow = false;
  g.add(ring);

  const aura = mesh(
    new THREE.SphereGeometry(0.95, 16, 12),
    new THREE.MeshBasicMaterial({
      color: auraColor,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
    }),
  );
  aura.name = 'companion-aura';
  aura.position.y = 1.05;
  aura.castShadow = false;
  g.add(aura);

  // 可动画的人形（与道童同级精致度）
  const figure = new THREE.Group();
  figure.name = 'companion-figure';
  figure.add(box(0.48, 0.55, 0.32, hue, 0, 0.48, 0));
  const body = box(0.44, 0.48, 0.28, hue, 0, 0.95, 0);
  body.name = 'robe';
  figure.add(body);
  const sleeveL = box(0.18, 0.4, 0.16, hue, -0.32, 0.92, 0.02);
  sleeveL.rotation.z = 0.22;
  const sleeveR = box(0.18, 0.4, 0.16, hue, 0.32, 0.92, 0.02);
  sleeveR.rotation.z = -0.22;
  figure.add(sleeveL, sleeveR);
  figure.add(box(0.48, 0.07, 0.34, C.gold, 0, 0.7, 0));
  const head = mesh(new THREE.SphereGeometry(0.2, 12, 10), C.skin);
  head.position.y = 1.36;
  figure.add(head);
  const hair = mesh(new THREE.SphereGeometry(0.21, 10, 8), C.hair);
  hair.scale.set(1, 0.62, 1);
  hair.position.set(0, 1.48, 0);
  figure.add(hair);
  figure.add(cyl(0.07, 0.09, 0.14, 8, C.hair, 0, 1.64, 0));
  figure.add(box(0.08, 0.14, 0.08, C.wood, 0, 1.74, 0));
  g.add(figure);

  // 漂浮光点（问候时才明显）
  const motes = new THREE.Group();
  motes.name = 'companion-motes';
  motes.visible = false;
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: softTexture(),
        color: auraColor,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    s.scale.setScalar(0.2);
    motes.add(s);
  }
  g.add(motes);

  // 台词气泡（默认隐藏）
  const bubble = new THREE.Sprite(
    new THREE.SpriteMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  bubble.name = 'speech-bubble';
  bubble.position.set(0, 2.55, 0);
  bubble.visible = false;
  g.add(bubble);

  const tag = label(name);
  tag.position.set(0, 1.95, 0);
  g.add(tag);

  addHotspot(hotspots, 'companion', name, `请教${name}`, g, x, z, 2.3);
  return g;
}

/** 石灯笼 */
export function makeLantern(x: number, z: number, glow: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(cyl(0.22, 0.28, 0.2, 6, C.stone, 0, 0.1, 0));
  g.add(cyl(0.12, 0.14, 0.9, 6, C.stoneDark, 0, 0.65, 0));
  const house = box(0.42, 0.45, 0.42, C.stone, 0, 1.25, 0);
  g.add(house);
  const lightMat = new THREE.MeshBasicMaterial({
    color: 0xffd29a,
    transparent: true,
    opacity: 0.15 + glow * 0.55,
  });
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), lightMat);
  flame.position.y = 1.25;
  g.add(flame);
  if (glow > 0.2) {
    const light = new THREE.PointLight(0xffc07a, 0.4 + glow * 1.4, 8, 2);
    light.position.y = 1.3;
    g.add(light);
  }
  g.add(box(0.5, 0.08, 0.5, C.stoneDark, 0, 1.52, 0));
  return g;
}

/** 石狮一对 */
export function makeLions(z: number): THREE.Group {
  const g = new THREE.Group();
  for (const sx of [-2.2, 2.2]) {
    const lion = new THREE.Group();
    lion.position.set(sx, 0, z);
    lion.add(box(0.7, 0.35, 0.55, C.stone, 0, 0.35, 0));
    lion.add(box(0.55, 0.45, 0.7, C.stone, 0, 0.75, -0.05));
    lion.add(mesh(new THREE.SphereGeometry(0.28, 8, 6), C.stone));
    lion.children[lion.children.length - 1].position.set(0, 1.15, 0.15);
    lion.add(box(0.12, 0.35, 0.12, C.stoneDark, 0.22, 0.55, 0.28));
    g.add(lion);
  }
  return g;
}

export function tickSmoke(root: THREE.Object3D, t: number, active: boolean) {
  root.traverse((obj) => {
    if (obj.name !== 'smoke') return;
    obj.children.forEach((child, i) => {
      const s = child as THREE.Sprite;
      const phase = (s.userData.phase as number) + t * 0.35;
      const k = ((phase % 3) / 3);
      s.position.set(Math.sin(phase + i) * 0.12, k * 1.4, Math.cos(phase * 0.7) * 0.1);
      s.scale.setScalar(0.3 + k * 0.9);
      const mat = s.material as THREE.SpriteMaterial;
      mat.opacity = active ? (1 - k) * 0.45 : 0;
    });
  });
}

export function pulseEmbers(root: THREE.Object3D, t: number, active: boolean) {
  root.traverse((obj) => {
    if (obj.name !== 'ember') return;
    const m = obj as THREE.Mesh;
    const mat = m.material as THREE.MeshLambertMaterial;
    const pulse = 0.5 + 0.5 * Math.sin(t * 8 + m.position.x * 10);
    mat.emissive = new THREE.Color(active ? 0xff4a1a : 0x000000);
    mat.emissiveIntensity = active ? 0.6 + pulse * 0.8 : 0;
  });
}

/** 触发仪式器物短动画 */
export function triggerRitualStrike(object: THREE.Object3D, kind: 'moktak' | 'qing' | 'bell') {
  object.userData.strikeUntil = performance.now() / 1000 + (kind === 'bell' ? 1.8 : 0.45);
  object.userData.strikeKind = kind;
  object.userData.strikeT0 = performance.now() / 1000;
}

function resetRitualPose(obj: THREE.Object3D, kind: string) {
  if (kind === 'moktak') {
    const mallet = obj.getObjectByName('mallet');
    const body = obj.getObjectByName('moktak-body');
    if (mallet) mallet.rotation.z = 0.55;
    if (body) body.scale.set(1.15, 0.85, 1);
  } else if (kind === 'qing') {
    const stick = obj.getObjectByName('stick');
    const bowl = obj.getObjectByName('qing-bowl');
    if (stick) stick.rotation.z = -0.55;
    if (bowl) {
      bowl.rotation.z = 0;
      bowl.position.y = 0.28;
    }
  } else if (kind === 'bell') {
    const bell = obj.getObjectByName('bell-body');
    if (bell) {
      bell.rotation.z = 0;
      bell.rotation.x = 0;
    }
  }
}

export function tickRitualStrikes(root: THREE.Object3D, t: number) {
  root.traverse((obj) => {
    const until = obj.userData.strikeUntil as number | undefined;
    if (!until) return;
    const kind = (obj.userData.strikeKind as string) || '';
    if (t > until) {
      resetRitualPose(obj, kind);
      obj.userData.strikeUntil = 0;
      return;
    }
    const t0 = (obj.userData.strikeT0 as number) || t;
    const u = Math.min(1, (t - t0) / Math.max(0.01, until - t0));

    if (kind === 'moktak') {
      const mallet = obj.getObjectByName('mallet');
      const body = obj.getObjectByName('moktak-body');
      if (mallet) {
        // 抬起 → 落下 → 回弹
        const swing =
          u < 0.35
            ? -0.55 * (u / 0.35)
            : u < 0.5
              ? -0.55 + 1.15 * ((u - 0.35) / 0.15)
              : 0.6 * (1 - (u - 0.5) / 0.5);
        mallet.rotation.z = 0.55 + swing;
      }
      if (body) {
        const squash = u > 0.35 && u < 0.55 ? 1 - 0.06 * Math.sin(((u - 0.35) / 0.2) * Math.PI) : 1;
        body.scale.set(1.15 / squash, 0.85 * squash, 1 / squash);
      }
    } else if (kind === 'qing') {
      const stick = obj.getObjectByName('stick');
      const bowl = obj.getObjectByName('qing-bowl');
      if (stick) {
        const swing = u < 0.4 ? -0.7 * Math.sin((u / 0.4) * Math.PI) : 0;
        stick.rotation.z = -0.55 + swing;
      }
      if (bowl) {
        bowl.rotation.z = u < 0.85 ? Math.sin(u * Math.PI * 8) * 0.06 * (1 - u) : 0;
        bowl.position.y = 0.28 + (u < 0.7 ? Math.abs(Math.sin(u * Math.PI * 6)) * 0.01 : 0);
      }
    } else if (kind === 'bell') {
      const bell = obj.getObjectByName('bell-body');
      if (bell) {
        bell.rotation.z = Math.sin(u * Math.PI * 5) * 0.12 * (1 - u);
        bell.rotation.x = Math.sin(u * Math.PI * 3.2) * 0.04 * (1 - u);
      }
    }
  });
}
