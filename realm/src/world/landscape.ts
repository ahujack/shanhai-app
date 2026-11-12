import * as THREE from 'three';
import { C, box, cyl, mesh, rng, softTexture, stoneTexture } from './kit';
import { inkWashMaterial, mossTexture } from './ink';

/** 庭院地面：青石板 + 青苔边 + 淡墨草地 */
export function makeGround(): THREE.Group {
  const g = new THREE.Group();

  const grass = new THREE.Mesh(
    new THREE.CircleGeometry(58, 64),
    new THREE.MeshLambertMaterial({ color: C.grass, flatShading: false }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  g.add(grass);

  // 青苔环
  const moss = new THREE.Mesh(
    new THREE.RingGeometry(16.2, 19.5, 64),
    new THREE.MeshLambertMaterial({
      color: 0xffffff,
      map: mossTexture(),
      flatShading: false,
      transparent: true,
      opacity: 0.85,
    }),
  );
  moss.rotation.x = -Math.PI / 2;
  moss.position.y = 0.012;
  moss.receiveShadow = true;
  g.add(moss);

  const stoneMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: stoneTexture(),
    flatShading: false,
  });
  const yard = new THREE.Mesh(new THREE.CircleGeometry(16.8, 64), stoneMat);
  yard.rotation.x = -Math.PI / 2;
  yard.position.y = 0.018;
  yard.receiveShadow = true;
  g.add(yard);

  g.add(box(3.5, 0.05, 26, C.stone, 0, 0.045, 1));
  g.add(box(0.2, 0.04, 24, C.stoneDark, -1.9, 0.035, 1));
  g.add(box(0.2, 0.04, 24, C.stoneDark, 1.9, 0.035, 1));

  for (let i = 0; i < 6; i++) {
    g.add(box(6.0 - i * 0.28, 0.12, 0.62, C.stoneDark, 0, 0.07 + i * 0.12, -4.9 - i * 0.5));
  }
  return g;
}

/** 更像游戏里的松：主干分叉 + 层叠墨色冠 */
function pine(x: number, z: number, scale = 1): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);

  g.add(cyl(0.11, 0.18, 2.2, 7, C.trunk, 0, 1.1, 0));
  // 分枝
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const branch = cyl(0.04, 0.06, 0.9, 5, C.trunk, Math.cos(a) * 0.35, 1.4 + i * 0.25, Math.sin(a) * 0.35);
    branch.rotation.z = Math.cos(a) * 0.9;
    branch.rotation.x = Math.sin(a) * 0.5;
    g.add(branch);
  }
  for (let i = 0; i < 6; i++) {
    const layer = mesh(
      new THREE.ConeGeometry(1.55 - i * 0.18, 0.85, 7),
      i % 2 ? C.pine : C.pineDark,
    );
    layer.position.set((i % 3) * 0.08 - 0.08, 1.55 + i * 0.48, (i % 2) * 0.06);
    layer.scale.set(1.05, 0.68, 1.05);
    g.add(layer);
  }
  return g;
}

export function makeTrees(): THREE.Group {
  const g = new THREE.Group();
  const spots: Array<[number, number, number]> = [
    [-8.5, 8, 1.2],
    [8.8, 7.5, 1.1],
    [-9.5, -6, 1.3],
    [9.2, -7, 1.15],
    [-14, 2, 1.45],
    [14.5, 0, 1.5],
    [-13, 12, 1.6],
    [12.5, 13, 1.55],
    [-16, -10, 1.7],
    [16, -9, 1.65],
    [-7, 11.5, 0.95],
    [7.2, 11.2, 1.0],
    [-11, -12, 1.35],
    [11, -12.5, 1.3],
  ];
  for (const [x, z, s] of spots) g.add(pine(x, z, s));
  return g;
}

/** 远山：多层平滑 hump，水墨剪影 */
export function makeMountains(): THREE.Group {
  const g = new THREE.Group();
  const rand = rng(42);

  const layers = [
    { z: -48, y: 0, color: 0x5c635c, opacity: 0.72, count: 7, spread: 1 },
    { z: -72, y: 1.5, color: 0x7a8278, opacity: 0.48, count: 8, spread: 1.35 },
    { z: -98, y: 3, color: 0x9aa298, opacity: 0.3, count: 9, spread: 1.75 },
  ];

  for (const layer of layers) {
    const layerG = new THREE.Group();
    for (let i = 0; i < layer.count; i++) {
      const w = (18 + rand() * 30) * layer.spread;
      const h = (7 + rand() * 14) * layer.spread;
      // 水墨晕染山体：边缘留白、远层更淡
      const mountain = new THREE.Mesh(
        new THREE.SphereGeometry(1, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
        inkWashMaterial(layer.color, layer.opacity),
      );
      mountain.scale.set(w * 0.55, h * 0.55, w * 0.35);
      mountain.position.set((rand() - 0.5) * 140, layer.y, (rand() - 0.5) * 18);
      mountain.castShadow = false;
      mountain.receiveShadow = false;
      mountain.renderOrder = -2;
      layerG.add(mountain);
    }
    layerG.position.z = layer.z;
    g.add(layerG);
  }

  for (let i = 0; i < 9; i++) {
    const rock = mesh(new THREE.DodecahedronGeometry(1.0 + rand() * 1.4, 0), C.rock);
    rock.position.set((rand() - 0.5) * 40, 0.4, 16 + rand() * 10);
    rock.rotation.set(rand(), rand() * 2, rand());
    rock.scale.set(1, 0.7 + rand() * 0.45, 1.1);
    g.add(rock);
  }
  return g;
}

export function makeClouds(color: THREE.Color): THREE.Group {
  const g = new THREE.Group();
  const rand = rng(7);
  const map = softTexture();
  for (let i = 0; i < 16; i++) {
    const cloud = new THREE.Group();
    const n = 4 + Math.floor(rand() * 4);
    for (let j = 0; j < n; j++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map,
          color,
          transparent: true,
          opacity: 0.2 + rand() * 0.2,
          depthWrite: false,
          fog: true,
        }),
      );
      s.scale.set(9 + rand() * 12, 3.5 + rand() * 3, 1);
      s.position.set((j - 1.5) * 3.4, rand() * 1.4, rand());
      cloud.add(s);
    }
    cloud.position.set((rand() - 0.5) * 140, 9 + rand() * 16, -30 - rand() * 60);
    g.add(cloud);
  }
  return g;
}

export function makeGroundMist(): THREE.Group {
  const g = new THREE.Group();
  const map = softTexture();
  const rand = rng(19);
  for (let i = 0; i < 16; i++) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map,
        color: C.mist,
        transparent: true,
        opacity: 0.14 + rand() * 0.12,
        depthWrite: false,
      }),
    );
    s.scale.set(7 + rand() * 6, 2 + rand() * 1.4, 1);
    s.position.set((rand() - 0.5) * 30, 0.4 + rand() * 0.5, (rand() - 0.5) * 26);
    s.userData.phase = rand() * Math.PI * 2;
    s.userData.baseX = s.position.x;
    g.add(s);
  }
  g.name = 'ground-mist';
  return g;
}

export function tickGroundMist(root: THREE.Object3D, t: number) {
  const mist = root.getObjectByName('ground-mist');
  if (!mist) return;
  mist.children.forEach((child) => {
    const s = child as THREE.Sprite;
    const phase = (s.userData.phase as number) + t * 0.12;
    s.position.x = (s.userData.baseX as number) + Math.sin(phase) * 1.0;
    (s.material as THREE.SpriteMaterial).opacity = 0.1 + (Math.sin(phase * 1.4) * 0.5 + 0.5) * 0.14;
  });
}
