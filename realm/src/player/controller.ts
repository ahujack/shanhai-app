import * as THREE from 'three';
import { animateWalk, createAvatar } from './avatar';

export interface CameraFocus {
  /** 看向的世界坐标 */
  lookAt: THREE.Vector3;
  /** 镜头相对目标的水平角（绕 Y） */
  yaw?: number;
  pitch?: number;
  distance?: number;
  /** 秒；到期自动解除 */
  duration?: number;
}

export interface PlayerController {
  avatar: THREE.Group;
  position: THREE.Vector3;
  moving: boolean;
  nearestHotspotId: string | null;
  setTarget: (x: number, z: number) => void;
  /** 临时把镜头推到灵伴等目标上 */
  focusOn: (focus: CameraFocus) => void;
  clearFocus: () => void;
  lookYaw: number;
  update: (dt: number, t: number) => void;
  getPose: () => { x: number; z: number; yaw: number };
}

export function createPlayerController(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
  walkable: (x: number, z: number) => boolean,
  getHotspots: () => Array<{ id: string; position: THREE.Vector3; radius: number }>,
): PlayerController {
  const avatar = createAvatar();
  // 庭院偏前，镜头落在院中看向三清殿，避开山门檐口穿模
  avatar.position.set(0, 0, 1.2);
  avatar.rotation.y = Math.PI;
  scene.add(avatar);

  const target = new THREE.Vector3(0, 0, 1.2);
  const velocity = new THREE.Vector3();
  let moving = false;
  let nearestHotspotId: string | null = null;
  let lookYaw = 0;
  let orbitPitch = 0.36;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let movedDuringPointer = false;
  let camReady = false;
  let focus: {
    lookAt: THREE.Vector3;
    yaw: number;
    pitch: number;
    distance: number;
    until: number;
  } | null = null;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  const camOffset = new THREE.Vector3();
  const desiredCam = new THREE.Vector3();
  const lookAt = new THREE.Vector3();

  const onPointerDown = (e: PointerEvent) => {
    dragging = true;
    movedDuringPointer = false;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 4) movedDuringPointer = true;
    lastX = e.clientX;
    lastY = e.clientY;
    lookYaw -= dx * 0.005;
    orbitPitch = THREE.MathUtils.clamp(orbitPitch + dy * 0.004, 0.16, 0.92);
  };

  const onPointerUp = (e: PointerEvent) => {
    dragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (movedDuringPointer) return;
    // 点击地面走路
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(groundPlane, hit)) {
      if (walkable(hit.x, hit.z)) {
        target.set(hit.x, 0, hit.z);
      }
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      orbitPitch = THREE.MathUtils.clamp(orbitPitch + e.deltaY * 0.0012, 0.16, 0.92);
    },
    { passive: false },
  );

  const setTarget = (x: number, z: number) => {
    if (walkable(x, z)) target.set(x, 0, z);
  };

  const focusOn = (f: CameraFocus) => {
    // 默认从玩家一侧看向目标
    const dx = avatar.position.x - f.lookAt.x;
    const dz = avatar.position.z - f.lookAt.z;
    const autoYaw = Math.atan2(dx, dz);
    focus = {
      lookAt: f.lookAt.clone(),
      yaw: f.yaw ?? autoYaw,
      pitch: f.pitch ?? 0.32,
      distance: f.distance ?? 4.8,
      until: performance.now() / 1000 + (f.duration ?? 3.2),
    };
  };

  const clearFocus = () => {
    focus = null;
  };

  return {
    avatar,
    get position() {
      return avatar.position;
    },
    get moving() {
      return moving;
    },
    get nearestHotspotId() {
      return nearestHotspotId;
    },
    get lookYaw() {
      return lookYaw;
    },
    setTarget,
    focusOn,
    clearFocus,
    getPose() {
      return { x: avatar.position.x, z: avatar.position.z, yaw: avatar.rotation.y };
    },
    update(dt, t) {
      if (focus && t > focus.until) focus = null;

      const to = target.clone().sub(avatar.position);
      to.y = 0;
      const dist = to.length();
      if (dist > 0.08) {
        moving = true;
        to.normalize();
        const speed = Math.min(4.2, 2.2 + dist * 0.6);
        velocity.copy(to).multiplyScalar(speed * dt);
        const next = avatar.position.clone().add(velocity);
        if (walkable(next.x, next.z)) {
          avatar.position.copy(next);
        } else {
          // 滑墙：分别试 x/z
          if (walkable(next.x, avatar.position.z)) avatar.position.x = next.x;
          if (walkable(avatar.position.x, next.z)) avatar.position.z = next.z;
          else target.copy(avatar.position);
        }
        avatar.rotation.y = Math.atan2(to.x, to.z);
      } else {
        moving = false;
        avatar.position.x = target.x;
        avatar.position.z = target.z;
      }

      animateWalk(avatar, moving, t);

      // 最近热点
      let best: string | null = null;
      let bestD = Infinity;
      for (const h of getHotspots()) {
        const d = avatar.position.distanceTo(h.position);
        if (d < h.radius && d < bestD) {
          bestD = d;
          best = h.id;
        }
      }
      nearestHotspotId = best;

      if (focus) {
        const distCam = focus.distance;
        camOffset.set(
          Math.sin(focus.yaw) * Math.cos(focus.pitch) * distCam,
          Math.sin(focus.pitch) * distCam + 1.1,
          Math.cos(focus.yaw) * Math.cos(focus.pitch) * distCam,
        );
        desiredCam.copy(focus.lookAt).add(camOffset);
        camera.position.lerp(desiredCam, 1 - Math.pow(0.0002, dt));
        lookAt.copy(focus.lookAt);
        lookAt.y = 1.35;
        camera.lookAt(lookAt);
        return;
      }

      // 游戏向跟拍：中距、偏低俯仰，把飞檐与远山一起收进画面
      let distCam = 8.2;
      camOffset.set(
        Math.sin(lookYaw) * Math.cos(orbitPitch) * distCam,
        Math.sin(orbitPitch) * distCam + 1.35,
        Math.cos(lookYaw) * Math.cos(orbitPitch) * distCam,
      );
      desiredCam.copy(avatar.position).add(camOffset);
      // 防穿地 / 防钻进厢房墙体（环视时的黑屏元凶）
      desiredCam.y = Math.max(2.6, desiredCam.y);
      const maxX = 7.2;
      const minZ = avatar.position.z - 6.5;
      const maxZ = avatar.position.z + 7.5;
      if (Math.abs(desiredCam.x) > maxX || desiredCam.z < minZ || desiredCam.z > maxZ) {
        distCam = 5.8;
        camOffset.set(
          Math.sin(lookYaw) * Math.cos(orbitPitch) * distCam,
          Math.sin(orbitPitch) * distCam + 1.5,
          Math.cos(lookYaw) * Math.cos(orbitPitch) * distCam,
        );
        desiredCam.copy(avatar.position).add(camOffset);
        desiredCam.y = Math.max(2.8, desiredCam.y);
        desiredCam.x = THREE.MathUtils.clamp(desiredCam.x, -maxX, maxX);
        desiredCam.z = THREE.MathUtils.clamp(desiredCam.z, minZ, maxZ);
      }
      if (!camReady) {
        camera.position.copy(desiredCam);
        camReady = true;
      } else {
        camera.position.lerp(desiredCam, 1 - Math.pow(0.001, dt));
      }
      lookAt.set(avatar.position.x, 1.5, avatar.position.z);
      camera.lookAt(lookAt);
    },
  };
}
