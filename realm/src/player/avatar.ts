import * as THREE from 'three';
import { C, box, cyl, mesh } from '../world/kit';

/** 小道童：道袍、广袖、发髻、腰带，比方块人精致一档 */
export function createAvatar(tint = C.wallRed): THREE.Group {
  const g = new THREE.Group();
  g.name = 'avatar';

  // 下裳
  g.add(box(0.5, 0.55, 0.34, tint, 0, 0.48, 0));
  // 上衣
  const robe = box(0.46, 0.5, 0.3, tint, 0, 0.95, 0);
  robe.name = 'robe';
  g.add(robe);
  // 广袖
  const sleeveL = box(0.2, 0.42, 0.18, tint, -0.34, 0.92, 0.02);
  sleeveL.rotation.z = 0.25;
  const sleeveR = box(0.2, 0.42, 0.18, tint, 0.34, 0.92, 0.02);
  sleeveR.rotation.z = -0.25;
  g.add(sleeveL, sleeveR);
  // 交领
  g.add(box(0.22, 0.28, 0.06, C.white, 0, 1.05, 0.14));
  // 腰带 + 玉佩
  g.add(box(0.5, 0.08, 0.36, C.gold, 0, 0.7, 0));
  g.add(box(0.08, 0.14, 0.04, C.gold, 0.12, 0.58, 0.18));

  const head = mesh(new THREE.SphereGeometry(0.2, 12, 10), C.skin);
  head.position.y = 1.38;
  g.add(head);
  // 发髻
  const hair = mesh(new THREE.SphereGeometry(0.21, 10, 8), C.hair);
  hair.scale.set(1, 0.62, 1);
  hair.position.set(0, 1.5, 0);
  g.add(hair);
  g.add(cyl(0.07, 0.09, 0.14, 8, C.hair, 0, 1.66, 0));
  g.add(cyl(0.025, 0.025, 0.16, 5, C.wood, 0, 1.76, 0));

  const legL = box(0.13, 0.4, 0.15, 0x3a322c, -0.12, 0.2, 0);
  legL.name = 'legL';
  const legR = box(0.13, 0.4, 0.15, 0x3a322c, 0.12, 0.2, 0);
  legR.name = 'legR';
  g.add(legL, legR);
  // 履
  g.add(box(0.16, 0.06, 0.24, C.woodDark, -0.12, 0.04, 0.02));
  g.add(box(0.16, 0.06, 0.24, C.woodDark, 0.12, 0.04, 0.02));

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  shadow.userData.skipOutline = true;
  g.add(shadow);

  return g;
}

export function animateWalk(avatar: THREE.Group, moving: boolean, t: number) {
  const legL = avatar.getObjectByName('legL');
  const legR = avatar.getObjectByName('legR');
  if (!legL || !legR) return;
  if (moving) {
    const swing = Math.sin(t * 10) * 0.38;
    legL.rotation.x = swing;
    legR.rotation.x = -swing;
    avatar.position.y = Math.abs(Math.sin(t * 10)) * 0.045;
  } else {
    legL.rotation.x = THREE.MathUtils.lerp(legL.rotation.x, 0, 0.2);
    legR.rotation.x = THREE.MathUtils.lerp(legR.rotation.x, 0, 0.2);
    avatar.position.y = 0;
  }
}

export function createRemoteAvatar(name: string): THREE.Group {
  const g = createAvatar(0x6a737a);
  g.scale.setScalar(0.95);
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = 'rgba(242,234,220,0.88)';
  ctx.beginPath();
  ctx.roundRect(0, 0, 256, 64, 32);
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,70,40,0.3)';
  ctx.stroke();
  ctx.fillStyle = '#3a342c';
  ctx.font = '600 28px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.slice(0, 8), 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(1.4, 0.35, 1);
  sprite.position.y = 2.15;
  g.add(sprite);
  return g;
}
