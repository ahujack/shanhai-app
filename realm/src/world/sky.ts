import * as THREE from 'three';
import { softTexture } from './kit';

export type Phase = 'dawn' | 'day' | 'dusk' | 'night';

/** 按访客本地时间决定时辰 */
export function phaseFromClock(d = new Date()): Phase {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 5 && h < 7.5) return 'dawn';
  if (h >= 7.5 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'dusk';
  return 'night';
}

interface PhaseLook {
  skyTop: number;
  horizon: number;
  cloud: number;
  hemiSky: number;
  hemiGround: number;
  hemi: number;
  sun: number;
  sunPower: number;
  sunDir: [number, number, number];
  glow: number;
  stars: boolean;
  disc: number | null;
  fogNear: number;
  fogFar: number;
}

/** 水墨宣纸天光：少蓝、多灰赭，雾气更重 */
const LOOKS: Record<Phase, PhaseLook> = {
  dawn: {
    skyTop: 0xb7c0c6,
    horizon: 0xe8d7c4,
    cloud: 0xf0e4d6,
    hemiSky: 0xf0e6d8,
    hemiGround: 0x8a8678,
    hemi: 1.25,
    sun: 0xf0c9a0,
    sunPower: 1.55,
    sunDir: [-26, 14, 12],
    glow: 0.55,
    stars: false,
    disc: 0xffefd8,
    fogNear: 18,
    fogFar: 95,
  },
  day: {
    skyTop: 0xc5cdc8,
    horizon: 0xe7e2d4,
    cloud: 0xf2eee4,
    hemiSky: 0xf4f0e6,
    hemiGround: 0x8f9486,
    hemi: 1.35,
    sun: 0xfff4e4,
    sunPower: 1.7,
    sunDir: [18, 30, 14],
    glow: 0.08,
    stars: false,
    disc: null,
    fogNear: 28,
    fogFar: 130,
  },
  dusk: {
    skyTop: 0x6f7388,
    horizon: 0xe2b896,
    cloud: 0xd9b59a,
    hemiSky: 0xe8c4a8,
    hemiGround: 0x6e6860,
    hemi: 1.1,
    sun: 0xe89a6c,
    sunPower: 1.35,
    sunDir: [28, 10, 8],
    glow: 0.85,
    stars: false,
    disc: 0xffc08a,
    fogNear: 16,
    fogFar: 88,
  },
  night: {
    skyTop: 0x1c2430,
    horizon: 0x2e3644,
    cloud: 0x3a4454,
    hemiSky: 0x8a96aa,
    hemiGround: 0x2a3038,
    hemi: 1.15,
    sun: 0xb8c8e8,
    sunPower: 0.95,
    sunDir: [-16, 28, 12],
    glow: 1,
    stars: true,
    disc: 0xe9efff,
    fogNear: 20,
    fogFar: 100,
  },
};

export interface Sky {
  phase: Phase;
  glow: number;
  cloudColor: THREE.Color;
  horizonColor: THREE.Color;
  update(camera: THREE.Camera): void;
}

export function createSky(scene: THREE.Scene, phase: Phase, lowPower: boolean): Sky {
  const look = LOOKS[phase];
  const horizon = new THREE.Color(look.horizon);

  scene.fog = new THREE.Fog(horizon, look.fogNear, look.fogFar);
  scene.background = horizon;

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(320, 24, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        top: { value: new THREE.Color(look.skyTop) },
        bottom: { value: horizon },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 top;
        uniform vec3 bottom;
        varying vec3 vDir;
        void main() {
          float h = clamp(vDir.y * 1.35 + 0.08, 0.0, 1.0);
          // 接近地平线处再压一点灰，像墨晕开
          vec3 col = mix(bottom, top, pow(h, 0.85));
          float wash = smoothstep(0.0, 0.35, h);
          col = mix(bottom * 0.96, col, wash);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  );
  dome.renderOrder = -10;
  scene.add(dome);

  const hemi = new THREE.HemisphereLight(look.hemiSky, look.hemiGround, look.hemi);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(look.sun, look.sunPower);
  const dir = new THREE.Vector3(...look.sunDir).normalize();
  sun.position.copy(dir).multiplyScalar(70).add(new THREE.Vector3(0, 0, -4));
  sun.target.position.set(0, 0, -4);
  sun.castShadow = true;
  const size = lowPower ? 1024 : 2048;
  sun.shadow.mapSize.set(size, size);
  const cam = sun.shadow.camera;
  cam.left = -36;
  cam.right = 36;
  cam.top = 44;
  cam.bottom = -40;
  cam.near = 5;
  cam.far = 160;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);

  // 补环境光，让粉墙在雾里仍可读
  scene.add(new THREE.AmbientLight(0xf0ebe2, phase === 'night' ? 0.32 : 0.34));

  const followers: THREE.Object3D[] = [dome];

  if (look.disc !== null) {
    const disc = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: softTexture(),
        color: look.disc,
        fog: false,
        depthWrite: false,
        transparent: true,
        opacity: 0.9,
      }),
    );
    const anchor = new THREE.Group();
    disc.position.copy(dir).multiplyScalar(280);
    disc.scale.setScalar(phase === 'night' ? 30 : 52);
    anchor.add(disc);
    scene.add(anchor);
    followers.push(anchor);
  }

  if (look.stars) {
    const n = 320;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random();
      const v = Math.random() * 0.9 + 0.1;
      const theta = u * Math.PI * 2;
      const phi = Math.acos(v);
      p[i * 3] = 300 * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = 300 * Math.cos(phi);
      p[i * 3 + 2] = 300 * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const stars = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xdfe6ff,
        size: 1.4,
        sizeAttenuation: false,
        fog: false,
        transparent: true,
        opacity: 0.75,
      }),
    );
    scene.add(stars);
    followers.push(stars);
  }

  return {
    phase,
    glow: look.glow,
    cloudColor: new THREE.Color(look.cloud),
    horizonColor: horizon,
    update(camera) {
      for (const f of followers) f.position.copy(camera.position);
    },
  };
}
