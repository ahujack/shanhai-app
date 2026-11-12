import * as THREE from 'three';

/** 与 shanhai-app 一致的衬线字体栈（墨金气质） */
export const SERIF = '"Noto Serif SC","Songti SC","Source Han Serif SC","STSong","SimSun",serif';

/**
 * 江南水墨道观配色：粉墙黛瓦、朱红梁柱、淡墨远山。
 * 参考杭州抱朴道院一类气质，偏宣纸而不是塑料低模。
 */
export const C = {
  /** 粉墙 */
  wall: 0xf3eee3,
  wallShade: 0xe4dccf,
  /** 朱红柱 / 门 */
  wallRed: 0xa03a2c,
  column: 0x8b2f24,
  columnDark: 0x6e241c,
  /** 黛瓦 */
  roof: 0x3a4248,
  roofDark: 0x2a3136,
  band: 0x4a555c,
  /** 青石 */
  stone: 0xc5c0b4,
  stoneDark: 0x9a9588,
  paving: 0xb7b1a4,
  /** 木 */
  wood: 0x6a4632,
  woodDark: 0x443022,
  /** 点金 */
  gold: 0xc9a85a,
  bronze: 0x6e5c3b,
  bronzeDark: 0x4b402c,
  brass: 0xb08d3c,
  /** 草木：去饱和，像淡墨敷色 */
  grass: 0x8f9a7e,
  rock: 0x6d7368,
  rockFar: 0x9aa19a,
  pine: 0x3d5648,
  pineDark: 0x2f4338,
  trunk: 0x5a4538,
  white: 0xf7f2e8,
  paper: 0xf2eadc,
  ink: 0x2a2e32,
  mist: 0xd8d2c6,
  ribbon: 0xb83328,
  straw: 0xc4a56a,
  ginkgo: 0xb89a5a,
  skin: 0xedcfb0,
  hair: 0x1c1a1b,
};

/** 确定性随机数：所有人看到的山、树位置一致 */
export function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const matCache = new Map<string, THREE.MeshLambertMaterial>();

/** 低模材质；同色复用。墙面略柔，瓦面保留平面感 */
export function mat(color: number, flat = true): THREE.MeshLambertMaterial {
  const key = `${color}:${flat ? 1 : 0}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: flat });
    matCache.set(key, m);
  }
  return m;
}

/** 宣纸噪点贴图：给墙、地一点手绘感 */
let paperTex: THREE.CanvasTexture | null = null;
export function paperTexture(): THREE.CanvasTexture {
  if (paperTex) return paperTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f2eadc';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4200; i++) {
    const a = Math.random() * 0.07;
    g.fillStyle = `rgba(40,45,50,${a})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1.2, 1.2);
  }
  // 淡淡纤维纹
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(120,110,90,${0.03 + Math.random() * 0.04})`;
    g.beginPath();
    g.moveTo(Math.random() * 256, Math.random() * 256);
    g.quadraticCurveTo(Math.random() * 256, Math.random() * 256, Math.random() * 256, Math.random() * 256);
    g.stroke();
  }
  paperTex = new THREE.CanvasTexture(c);
  paperTex.wrapS = paperTex.wrapT = THREE.RepeatWrapping;
  paperTex.colorSpace = THREE.SRGBColorSpace;
  return paperTex;
}

/** 青石板接缝 */
let stoneTex: THREE.CanvasTexture | null = null;
export function stoneTexture(): THREE.CanvasTexture {
  if (stoneTex) return stoneTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#b7b1a4';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(70,68,60,0.28)';
  g.lineWidth = 2;
  const step = 32;
  for (let y = 0; y <= 256; y += step) {
    g.beginPath();
    g.moveTo(0, y + (Math.random() - 0.5) * 2);
    g.lineTo(256, y + (Math.random() - 0.5) * 2);
    g.stroke();
  }
  for (let x = 0; x <= 256; x += step) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 256);
    g.stroke();
  }
  for (let i = 0; i < 800; i++) {
    g.fillStyle = `rgba(60,58,50,${Math.random() * 0.06})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  stoneTex = new THREE.CanvasTexture(c);
  stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
  stoneTex.repeat.set(8, 8);
  stoneTex.colorSpace = THREE.SRGBColorSpace;
  return stoneTex;
}

/** 窗棂平面 */
export function latticePlane(w: number, h: number): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 320;
  const g = c.getContext('2d')!;
  g.fillStyle = '#6e241c';
  g.fillRect(0, 0, 256, 320);
  g.fillStyle = '#d8cfc0';
  const pad = 18;
  g.fillRect(pad, pad, 256 - pad * 2, 320 - pad * 2);
  g.strokeStyle = '#5a2a22';
  g.lineWidth = 7;
  const cols = 4;
  const rows = 5;
  const iw = (256 - pad * 2) / cols;
  const ih = (320 - pad * 2) / rows;
  for (let i = 0; i <= cols; i++) {
    const x = pad + i * iw;
    g.beginPath();
    g.moveTo(x, pad);
    g.lineTo(x, 320 - pad);
    g.stroke();
  }
  for (let j = 0; j <= rows; j++) {
    const y = pad + j * ih;
    g.beginPath();
    g.moveTo(pad, y);
    g.lineTo(256 - pad, y);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshLambertMaterial({ map: tex }),
  );
  m.castShadow = true;
  return m;
}

export function mesh(
  geo: THREE.BufferGeometry,
  material: number | THREE.Material,
  shadow: { cast?: boolean; receive?: boolean } = {},
): THREE.Mesh {
  const m = new THREE.Mesh(geo, typeof material === 'number' ? mat(material) : material);
  m.castShadow = shadow.cast ?? true;
  m.receiveShadow = shadow.receive ?? true;
  return m;
}

export function box(w: number, h: number, d: number, color: number | THREE.Material, x = 0, y = 0, z = 0) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), color);
  m.position.set(x, y, z);
  return m;
}

export function cyl(
  rTop: number,
  rBottom: number,
  h: number,
  seg: number,
  color: number | THREE.Material,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), color);
  m.position.set(x, y, z);
  return m;
}

/** 给几何体写入顶点色，便于合并后用一个材质绘制 */
export function paint(geo: THREE.BufferGeometry, color: number): THREE.BufferGeometry {
  const c = new THREE.Color(color);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

export interface RoofOptions {
  /** 檐口总宽（X） */
  w: number;
  /** 檐口总深（Z） */
  d: number;
  /** 屋顶高度 */
  h: number;
  /** 正脊长度；0 为攒尖顶（亭子） */
  ridge?: number;
  /** 翼角起翘高度 */
  lift?: number;
  /** 坡面曲线指数，越大檐口越平、屋脊越陡 */
  curve?: number;
}

/**
 * 中式屋顶：檐口平缓、近脊陡峭，四角起翘。
 * 由若干圈矩形环从檐口收到屋脊，环上的点越靠近角部抬得越高。
 */
export function roofGeometry(o: RoofOptions): THREE.BufferGeometry {
  const rings = 6;
  const segs = 8;
  const ridge = o.ridge ?? 0;
  const lift = o.lift ?? o.h * 0.3;
  const curve = o.curve ?? 1.7;
  const perRing = segs * 4;
  const pos: number[] = [];

  for (let k = 0; k <= rings; k++) {
    const t = k / rings;
    const hx = THREE.MathUtils.lerp(o.w / 2, ridge / 2, t);
    const hz = THREE.MathUtils.lerp(o.d / 2, 0, t);
    const y0 = o.h * Math.pow(t, curve);
    const corners: Array<[number, number]> = [
      [hx, hz],
      [-hx, hz],
      [-hx, -hz],
      [hx, -hz],
    ];
    for (let e = 0; e < 4; e++) {
      const [ax, az] = corners[e];
      const [bx, bz] = corners[(e + 1) % 4];
      for (let j = 0; j < segs; j++) {
        const s = j / segs;
        const cornerness = Math.pow(Math.abs(2 * s - 1), 3);
        const fade = (1 - t) * (1 - t);
        const flare = 1 + 0.05 * cornerness * fade;
        pos.push(
          THREE.MathUtils.lerp(ax, bx, s) * flare,
          y0 + lift * cornerness * fade,
          THREE.MathUtils.lerp(az, bz, s) * flare,
        );
      }
    }
  }

  const idx: number[] = [];
  for (let k = 0; k < rings; k++) {
    for (let i = 0; i < perRing; i++) {
      const a = k * perRing + i;
      const b = k * perRing + ((i + 1) % perRing);
      const c = (k + 1) * perRing + ((i + 1) % perRing);
      const d = (k + 1) * perRing + i;
      idx.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** 黛瓦瓦垄贴图 */
let tileTex: THREE.CanvasTexture | null = null;
export function roofTileTexture(): THREE.CanvasTexture {
  if (tileTex) return tileTex;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#3a4248';
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 14) {
    g.fillStyle = y % 28 === 0 ? '#2a3136' : '#454e55';
    g.fillRect(0, y, 256, 10);
    g.strokeStyle = 'rgba(15,18,20,0.45)';
    g.beginPath();
    g.moveTo(0, y + 10);
    g.lineTo(256, y + 10);
    g.stroke();
    for (let x = 0; x < 256; x += 18) {
      g.strokeStyle = 'rgba(20,24,28,0.25)';
      g.beginPath();
      g.arc(x + 9, y + 5, 7, Math.PI, 0);
      g.stroke();
    }
  }
  tileTex = new THREE.CanvasTexture(c);
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(3, 2);
  tileTex.colorSpace = THREE.SRGBColorSpace;
  return tileTex;
}

const roofMats = new Map<string, THREE.MeshLambertMaterial>();
function roofMat(color: number) {
  const key = String(color);
  let m = roofMats.get(key);
  if (!m) {
    const tex = roofTileTexture().clone();
    tex.needsUpdate = true;
    tex.repeat.set(4, 2.5);
    m = new THREE.MeshLambertMaterial({
      color,
      map: tex,
      flatShading: false,
      side: THREE.DoubleSide,
    });
    roofMats.set(key, m);
  }
  return m;
}

/** 屋顶 + 正脊 + 垂脊 + 瓦垄 + 檐下彩画带 */
export function roof(o: RoofOptions & { color?: number; bandColor?: number | null }): THREE.Group {
  const g = new THREE.Group();
  const detailed: RoofOptions = { ...o, curve: o.curve ?? 1.85 };
  const tiles = mesh(roofGeometryHigh(detailed), roofMat(o.color ?? C.roof));
  g.add(tiles);

  const ridge = o.ridge ?? 0;
  // 前后坡瓦垄：短筒沿坡铺，增强「游戏建筑」可读性
  const rows = Math.max(5, Math.floor(o.w / 0.85));
  for (let i = 0; i < rows; i++) {
    const t = rows === 1 ? 0.5 : i / (rows - 1);
    const x = -o.w * 0.42 + o.w * 0.84 * t;
    for (const sz of [1, -1]) {
      const ridgeLine = cyl(0.045, 0.05, o.d * 0.38, 5, C.roofDark, x, o.h * 0.38, sz * o.d * 0.22);
      ridgeLine.rotation.x = sz * 0.55;
      g.add(ridgeLine);
    }
  }
  // 檐口滴水瓦当
  const drips = Math.max(6, Math.floor(o.w / 0.7));
  for (let i = 0; i < drips; i++) {
    const t = drips === 1 ? 0.5 : i / (drips - 1);
    const x = -o.w * 0.46 + o.w * 0.92 * t;
    for (const sz of [1, -1]) {
      g.add(cyl(0.06, 0.08, 0.1, 6, C.roofDark, x, 0.02, sz * (o.d / 2 - 0.05)));
    }
  }

  if (ridge > 0) {
    g.add(box(ridge + 0.55, 0.28, 0.32, C.roofDark, 0, o.h + 0.12, 0));
    const n = Math.max(4, Math.floor(ridge / 0.7));
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = -ridge / 2 + ridge * t;
      g.add(cyl(0.07, 0.07, 0.22, 6, C.roofDark, x, o.h + 0.28, 0));
    }
    for (const sx of [-1, 1]) {
      const end = box(0.38, 0.78, 0.38, C.roofDark, sx * (ridge / 2 + 0.22), o.h + 0.38, 0);
      end.rotation.z = -sx * 0.28;
      g.add(end);
      const hip = box(0.18, 0.16, o.d * 0.42, C.roofDark, sx * (o.w * 0.28), o.h * 0.45, o.d * 0.12);
      hip.rotation.x = -0.35;
      hip.rotation.z = sx * 0.2;
      g.add(hip);
    }
  } else {
    g.add(cyl(0.12, 0.2, 0.3, 8, C.roofDark, 0, o.h + 0.1, 0));
    const ball = mesh(new THREE.SphereGeometry(0.24, 10, 8), C.gold);
    ball.position.set(0, o.h + 0.45, 0);
    g.add(ball);
  }

  if (o.bandColor !== null) {
    g.add(box(o.w * 0.8, 0.36, o.d * 0.76, o.bandColor ?? C.band, 0, -0.18, 0));
    g.add(box(o.w * 0.78, 0.06, o.d * 0.74, C.gold, 0, -0.02, 0));
  }
  return g;
}

/** 更高细分屋顶 */
export function roofGeometryHigh(o: RoofOptions): THREE.BufferGeometry {
  const rings = 10;
  const segs = 12;
  const ridge = o.ridge ?? 0;
  const lift = o.lift ?? o.h * 0.3;
  const curve = o.curve ?? 1.85;
  const perRing = segs * 4;
  const pos: number[] = [];

  for (let k = 0; k <= rings; k++) {
    const t = k / rings;
    const hx = THREE.MathUtils.lerp(o.w / 2, ridge / 2, t);
    const hz = THREE.MathUtils.lerp(o.d / 2, 0, t);
    const y0 = o.h * Math.pow(t, curve);
    const corners: Array<[number, number]> = [
      [hx, hz],
      [-hx, hz],
      [-hx, -hz],
      [hx, -hz],
    ];
    for (let e = 0; e < 4; e++) {
      const [ax, az] = corners[e];
      const [bx, bz] = corners[(e + 1) % 4];
      for (let j = 0; j < segs; j++) {
        const s = j / segs;
        const cornerness = Math.pow(Math.abs(2 * s - 1), 2.6);
        const fade = (1 - t) * (1 - t);
        const flare = 1 + 0.07 * cornerness * fade;
        pos.push(
          THREE.MathUtils.lerp(ax, bx, s) * flare,
          y0 + lift * cornerness * fade,
          THREE.MathUtils.lerp(az, bz, s) * flare,
        );
      }
    }
  }

  const idx: number[] = [];
  for (let k = 0; k < rings; k++) {
    for (let i = 0; i < perRing; i++) {
      const a = k * perRing + i;
      const b = k * perRing + ((i + 1) % perRing);
      const c = (k + 1) * perRing + ((i + 1) % perRing);
      const d = (k + 1) * perRing + i;
      idx.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export interface TextOptions {
  w?: number;
  h?: number;
  size?: number;
  color?: string;
  bg?: string | null;
  border?: string | null;
  vertical?: boolean;
  weight?: number;
}

export function textTexture(text: string, o: TextOptions = {}): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = o.w ?? 512;
  c.height = o.h ?? 160;
  const g = c.getContext('2d')!;
  if (o.bg) {
    g.fillStyle = o.bg;
    g.fillRect(0, 0, c.width, c.height);
  }
  if (o.border) {
    g.strokeStyle = o.border;
    g.lineWidth = Math.max(4, Math.min(c.width, c.height) * 0.04);
    const pad = g.lineWidth * 1.4;
    g.strokeRect(pad, pad, c.width - pad * 2, c.height - pad * 2);
  }
  const size = o.size ?? Math.floor(c.height * 0.6);
  g.fillStyle = o.color ?? '#d6b36a';
  g.font = `${o.weight ?? 700} ${size}px ${SERIF}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (o.vertical) {
    const chars = [...text];
    const step = c.height / (chars.length + 0.6);
    chars.forEach((ch, i) => g.fillText(ch, c.width / 2, step * (i + 0.8)));
  } else {
    g.fillText(text, c.width / 2, c.height / 2 + size * 0.04);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** 匾额或楹联：黑漆描金，正面朝 +Z */
export function plaque(text: string, w: number, h: number, o: { vertical?: boolean } = {}): THREE.Group {
  const g = new THREE.Group();
  g.add(box(w + 0.18, h + 0.18, 0.1, C.gold, 0, 0, -0.03));
  const px = o.vertical ? 160 : 640;
  const py = Math.round((px * h) / w);
  const tex = textTexture(text, {
    w: px,
    h: py,
    bg: '#2a1c18',
    color: '#e4c778',
    border: '#8a6a30',
    vertical: o.vertical,
    size: o.vertical ? Math.floor(px * 0.58) : Math.floor(py * 0.58),
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex }));
  face.position.z = 0.03;
  g.add(face);
  return g;
}

/** 悬浮文字标签：宣纸底 + 墨字 */
export function label(text: string, o: { color?: string; bg?: string; scale?: number } = {}): THREE.Sprite {
  const size = 40;
  const padX = 24;
  const probe = document.createElement('canvas').getContext('2d')!;
  probe.font = `600 ${size}px ${SERIF}`;
  const w = Math.ceil(probe.measureText(text).width) + padX * 2;
  const h = 68;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = o.bg ?? 'rgba(242,234,220,0.88)';
  g.beginPath();
  g.roundRect(0, 0, w, h, h / 2);
  g.fill();
  g.strokeStyle = 'rgba(90,70,40,0.28)';
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = o.color ?? '#3a342c';
  g.font = `600 ${size}px ${SERIF}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  const k = (o.scale ?? 1) * 0.0075;
  sprite.scale.set(w * k, h * k, 1);
  return sprite;
}

/** 柔和的圆形渐变贴图：烟、雾、光晕共用 */
let softTex: THREE.CanvasTexture | null = null;
export function softTexture(): THREE.CanvasTexture {
  if (softTex) return softTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  softTex = new THREE.CanvasTexture(c);
  return softTex;
}
