import * as THREE from 'three';
import {
  makeGate,
  makeMainHall,
  makeSideHall,
  makePavilion,
  makeCourtyardWalls,
  makePathRailings,
} from './buildings';
import { makeGround, makeTrees, makeMountains, makeClouds, makeGroundMist, tickGroundMist } from './landscape';
import {
  makeIncense,
  makeMoktak,
  makeQing,
  makeBell,
  makeCushion,
  makeDrawLot,
  makeWishTree,
  makeCompanionSpot,
  makeLantern,
  makeLions,
  tickSmoke,
  pulseEmbers,
  tickRitualStrikes,
  type Hotspot,
} from './props';
import { tickCompanions } from './companion-anim';
import { outlineGroup } from './ink';
import { COMPANIONS } from '../config';
import type { Sky } from './sky';

export interface World {
  root: THREE.Group;
  hotspots: Hotspot[];
  /** 参与墨线描边的主体（建筑/树/角色道具） */
  outlineTargets: THREE.Object3D[];
  walkable: (x: number, z: number) => boolean;
  update: (t: number) => void;
}

export function createWorld(sky: Sky): World {
  const root = new THREE.Group();
  const hotspots: Hotspot[] = [];
  const outlineTargets: THREE.Object3D[] = [];

  const track = <T extends THREE.Object3D>(obj: T, outline = true): T => {
    root.add(obj);
    if (outline) outlineTargets.push(obj);
    return obj;
  };

  root.add(makeGround());
  root.add(makeMountains());
  root.add(makeClouds(sky.cloudColor));
  root.add(makeGroundMist());
  track(makeTrees());
  track(makeCourtyardWalls());
  track(makePathRailings(), false);
  track(makeGate(hotspots));
  track(makeMainHall());
  track(makeSideHall(-9.5, '测字斋', Math.PI / 2));
  track(makeSideHall(9.5, '观象轩', -Math.PI / 2));
  track(makePavilion(-7.5, 6.5));
  track(makePavilion(7.5, 6.5));
  track(makeLions(12.2));

  track(makeIncense(0, -3.2, hotspots));
  track(makeMoktak(-3.2, 1.5, hotspots));
  track(makeQing(3.2, 1.5, hotspots));
  track(makeBell(-7.5, 6.5, hotspots));
  track(makeCushion(-1.3, -1.2, hotspots, 0.15));
  track(makeCushion(1.3, -1.2, hotspots, -0.15));
  track(makeDrawLot(4.8, -4.5, hotspots));
  track(makeWishTree(-5.5, 4.2, hotspots));

  for (const [c, x, z] of [
    [COMPANIONS[0], -6.2, -4.8],
    [COMPANIONS[1], 0, -5.4],
    [COMPANIONS[2], 6.2, -4.8],
  ] as const) {
    track(makeCompanionSpot(x, z, c.name, hotspots, c.robe, c.aura));
  }

  for (const [x, z] of [
    [-3.5, 10],
    [3.5, 10],
    [-5, -5],
    [5, -5],
    [-10, 3],
    [10, 3],
  ] as const) {
    track(makeLantern(x, z, sky.glow));
  }

  // 国风游戏常用：网格背面墨线，比全场 OutlinePass 更干净
  for (const obj of outlineTargets) {
    outlineGroup(obj, 0.032);
  }

  const incenseActive = { on: true };

  const walkable = (x: number, z: number) => {
    if (Math.hypot(x, z) > 16.5) return false;
    if (Math.abs(x) > 10.6 && z > -14 && z < 12) return false;
    if (z < -14.8 || z > 16) return false;
    if (Math.abs(x) < 7.2 && z < -6.5 && z > -14) return false;
    if (Math.abs(x) < 5.2 && z > 12.5 && z < 15.5) return false;
    return true;
  };

  return {
    root,
    hotspots,
    outlineTargets,
    walkable,
    update(t) {
      tickSmoke(root, t, incenseActive.on);
      pulseEmbers(root, t, incenseActive.on);
      tickRitualStrikes(root, t);
      tickCompanions(root, t);
      tickGroundMist(root, t);
    },
  };
}

export type { Hotspot };
