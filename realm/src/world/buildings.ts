import * as THREE from 'three';
import { C, box, cyl, latticePlane, paperTexture, plaque, roof } from './kit';
import { makeEaveLantern } from './ink';
import type { Hotspot } from './props';

function wallMat() {
  const tex = paperTexture().clone();
  tex.needsUpdate = true;
  tex.repeat.set(2.4, 1.6);
  return new THREE.MeshLambertMaterial({
    color: C.wall,
    map: tex,
    flatShading: false,
  });
}

/** 柱间斗拱：三层小方木 */
function dougong(x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.add(box(0.42, 0.1, 0.28, C.wood, 0, 0, 0));
  g.add(box(0.28, 0.1, 0.42, C.woodDark, 0, 0.1, 0));
  g.add(box(0.5, 0.1, 0.22, C.wood, 0, 0.2, 0));
  g.add(box(0.16, 0.18, 0.16, C.columnDark, 0, 0.34, 0));
  return g;
}

/** 石栏杆一段 */
function railing(len: number): THREE.Group {
  const g = new THREE.Group();
  const posts = Math.max(2, Math.floor(len / 1.1));
  for (let i = 0; i < posts; i++) {
    const t = posts === 1 ? 0.5 : i / (posts - 1);
    const x = -len / 2 + len * t;
    g.add(box(0.14, 0.7, 0.14, C.stoneDark, x, 0.35, 0));
    g.add(box(0.2, 0.08, 0.2, C.stone, x, 0.72, 0));
  }
  g.add(box(len, 0.08, 0.1, C.stone, 0, 0.55, 0));
  g.add(box(len * 0.98, 0.06, 0.08, C.stoneDark, 0, 0.28, 0));
  return g;
}

function hallBody(w: number, h: number, d: number, columns = 4): THREE.Group {
  const g = new THREE.Group();
  // 多层台基
  g.add(box(w + 2.0, 0.28, d + 1.6, C.stoneDark, 0, 0.14, 0));
  g.add(box(w + 1.6, 0.2, d + 1.25, C.stone, 0, 0.38, 0));
  g.add(box(w + 1.35, 0.14, d + 1.0, C.stoneDark, 0, 0.55, 0));

  const wall = box(w, h, d, wallMat(), 0, 0.62 + h / 2, 0);
  g.add(wall);
  g.add(box(w + 0.14, 0.14, d + 0.14, C.wallShade, 0, 0.62 + h, 0));

  const span = w * 0.8;
  for (let i = 0; i < columns; i++) {
    const t = columns === 1 ? 0.5 : i / (columns - 1);
    const x = -span / 2 + span * t;
    // 柱础
    g.add(cyl(0.22, 0.26, 0.18, 12, C.stoneDark, x, 0.72, d / 2 + 0.22));
    g.add(cyl(0.17, 0.19, h + 0.2, 12, C.column, x, 0.82 + (h + 0.2) / 2, d / 2 + 0.22));
    // 斗拱
    g.add(dougong(x, 0.62 + h - 0.05, d / 2 + 0.22));
  }

  // 额枋 + 金线
  g.add(box(span + 0.6, 0.24, 0.3, C.columnDark, 0, 0.62 + h - 0.2, d / 2 + 0.22));
  g.add(box(span + 0.45, 0.08, 0.12, C.gold, 0, 0.62 + h - 0.34, d / 2 + 0.34));
  // 雀替
  for (const sx of [-1, 1]) {
    const qt = box(0.55, 0.22, 0.12, C.column, sx * (span / 2 - 0.2), 0.62 + h - 0.45, d / 2 + 0.28);
    qt.rotation.z = sx * 0.4;
    g.add(qt);
  }

  // 大门
  g.add(box(w * 0.3, h * 0.72, 0.14, C.column, 0, 0.62 + (h * 0.72) / 2, d / 2 + 0.02));
  for (const sx of [-0.09, 0.09]) {
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 2; col++) {
        const nail = cyl(
          0.028,
          0.028,
          0.035,
          6,
          C.gold,
          sx * w * 0.07 + (col - 0.5) * 0.13,
          1.05 + row * 0.36,
          d / 2 + 0.1,
        );
        nail.rotation.x = Math.PI / 2;
        g.add(nail);
      }
    }
  }
  // 门环
  for (const sx of [-0.22, 0.22]) {
    const ring = meshRing(0.08, 0.015, C.gold);
    ring.position.set(sx * w * 0.08, 0.62 + h * 0.32, d / 2 + 0.12);
    g.add(ring);
  }
  g.add(box(w * 0.34, 0.1, 0.28, C.woodDark, 0, 0.68, d / 2 + 0.1));

  for (const sx of [-w * 0.32, w * 0.32]) {
    const win = latticePlane(w * 0.17, h * 0.4);
    win.position.set(sx, 0.62 + h * 0.48, d / 2 + 0.03);
    g.add(win);
  }

  // 台基石栏
  for (const sz of [1, -1]) {
    if (sz > 0) {
      const rail = railing(w * 0.9);
      rail.position.set(0, 0.62, d / 2 + 0.55);
      g.add(rail);
    }
  }
  for (const sx of [-1, 1]) {
    const rail = railing(d * 0.7);
    rail.rotation.y = Math.PI / 2;
    rail.position.set(sx * (w / 2 + 0.55), 0.62, 0);
    g.add(rail);
  }

  return g;
}

function meshRing(r: number, tube: number, color: number) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(r, tube, 6, 14),
    new THREE.MeshLambertMaterial({ color }),
  );
}

export function makeGate(hotspots: Hotspot[]): THREE.Group {
  const g = new THREE.Group();
  g.position.set(0, 0, 14);
  g.add(hallBody(9.5, 3.5, 2.7, 4));
  const r = roof({ w: 13.2, d: 5.2, h: 2.85, ridge: 5.6, lift: 1.25 });
  r.position.y = 4.35;
  g.add(r);
  const board = plaque('山海灵境', 3.8, 0.9);
  board.position.set(0, 3.45, 1.5);
  g.add(board);

  for (const sx of [-6.4, 6.4]) {
    const wing = hallBody(2.5, 2.5, 2.3, 2);
    wing.position.x = sx;
    g.add(wing);
    const wr = roof({ w: 3.9, d: 3.5, h: 1.65, ridge: 1.0, lift: 0.65 });
    wr.position.set(sx, 3.35, 0);
    g.add(wr);
  }

  for (const sx of [-2.9, 2.9]) {
    g.add(box(0.6, 0.75, 0.42, C.stoneDark, sx, 0.95, 1.65));
    const drum = cyl(0.3, 0.3, 0.2, 14, C.stone, sx, 1.42, 1.65);
    drum.rotation.z = Math.PI / 2;
    g.add(drum);
  }

  // 檐灯
  for (const sx of [-3.2, 3.2]) {
    const lamp = makeEaveLantern();
    lamp.position.set(sx, 3.9, 1.55);
    g.add(lamp);
  }

  hotspots.push({
    id: 'gate',
    kind: 'gate',
    name: '山门',
    prompt: '回望山门',
    position: new THREE.Vector3(0, 0, 14),
    radius: 3.5,
    object: g,
  });
  return g;
}

export function makeMainHall(): THREE.Group {
  const g = new THREE.Group();
  g.position.set(0, 0, -10);
  g.add(hallBody(14, 4.4, 7.6, 6));
  const lower = roof({ w: 18.2, d: 11.0, h: 2.65, ridge: 8.4, lift: 1.35 });
  lower.position.y = 5.15;
  g.add(lower);
  const upper = roof({ w: 11.5, d: 7.6, h: 2.35, ridge: 5.4, lift: 1.15 });
  upper.position.y = 7.45;
  g.add(upper);
  const board = plaque('三清殿', 3.4, 0.82);
  board.position.set(0, 4.05, 4.0);
  g.add(board);
  const left = plaque('山海有灵', 0.44, 2.5, { vertical: true });
  left.position.set(-2.7, 2.5, 3.95);
  g.add(left);
  const right = plaque('一念知止', 0.44, 2.5, { vertical: true });
  right.position.set(2.7, 2.5, 3.95);
  g.add(right);
  g.add(box(3.4, 0.75, 1.0, C.wood, 0, 1.2, -1.15));
  g.add(box(0.55, 1.2, 0.38, C.gold, 0, 2.0, -1.15));
  for (const sx of [-4.5, -1.5, 1.5, 4.5]) {
    const lamp = makeEaveLantern();
    lamp.position.set(sx, 4.7, 4.05);
    g.add(lamp);
  }
  return g;
}

export function makeSideHall(x: number, title: string, rotY: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, -1);
  g.rotation.y = rotY;
  g.add(hallBody(7.6, 3.3, 5.3, 4));
  const r = roof({ w: 10.5, d: 7.6, h: 2.15, ridge: 4.4, lift: 0.82 });
  r.position.y = 4.15;
  g.add(r);
  const board = plaque(title, 2.5, 0.65);
  board.position.set(0, 3.1, 2.8);
  g.add(board);
  for (const sx of [-2.2, 2.2]) {
    const lamp = makeEaveLantern();
    lamp.position.set(sx, 3.85, 2.85);
    g.add(lamp);
  }
  return g;
}

export function makePavilion(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(box(3.4, 0.2, 3.4, C.stone, 0, 0.1, 0));
  g.add(box(3.6, 0.12, 3.6, C.stoneDark, 0, 0.22, 0));
  for (const sx of [-1.15, 1.15]) {
    for (const sz of [-1.15, 1.15]) {
      g.add(cyl(0.12, 0.14, 2.55, 10, C.column, sx, 1.45, sz));
      g.add(dougong(sx, 2.65, sz));
    }
  }
  g.add(box(2.6, 0.14, 2.6, C.columnDark, 0, 2.75, 0));
  const r = roof({ w: 4.7, d: 4.7, h: 1.8, ridge: 0, lift: 0.78 });
  r.position.y = 2.9;
  g.add(r);
  const lamp = makeEaveLantern();
  lamp.position.set(0, 2.7, 0);
  g.add(lamp);
  return g;
}

export function makeCourtyardWalls(): THREE.Group {
  const g = new THREE.Group();
  const wm = wallMat();
  for (const sx of [-11.5, 11.5]) {
    g.add(box(0.4, 1.65, 28, wm, sx, 0.82, 0));
    g.add(box(0.62, 0.14, 28.3, C.roofDark, sx, 1.68, 0));
    g.add(box(0.78, 0.08, 28.3, C.roof, sx, 1.8, 0));
    // 墙垛
    for (let z = -12; z <= 12; z += 4) {
      g.add(box(0.55, 1.85, 0.55, wm, sx, 0.92, z));
    }
  }
  g.add(box(23.4, 1.65, 0.4, wm, 0, 0.82, -15.5));
  g.add(box(23.7, 0.14, 0.62, C.roofDark, 0, 1.68, -15.5));
  g.add(box(23.7, 0.08, 0.78, C.roof, 0, 1.8, -15.5));
  return g;
}

/** 甬道两侧石栏 */
export function makePathRailings(): THREE.Group {
  const g = new THREE.Group();
  for (const sx of [-2.1, 2.1]) {
    const rail = railing(18);
    rail.position.set(sx, 0.02, 0.5);
    g.add(rail);
  }
  return g;
}
