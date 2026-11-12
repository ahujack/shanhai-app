import * as THREE from 'three';
import { PRESENCE_URL } from '../config';
import { createRemoteAvatar } from '../player/avatar';

export interface PresenceHandle {
  count: number;
  updateLocal: (pose: { x: number; z: number; yaw: number }) => void;
  dispose: () => void;
}

interface PeerState {
  id: string;
  name: string;
  x: number;
  z: number;
  yaw: number;
  mesh: THREE.Group;
  target: THREE.Vector3;
  targetYaw: number;
}

const NAMES = [
  '清风', '松间', '云水', '静石', '晚照', '空山', '苔痕', '薄雾',
  '归鹤', '闲棋', '听雨', '半窗', '素琴', '忘机', '抱朴', '守一',
];

function randomName() {
  return NAMES[Math.floor(Math.random() * NAMES.length)] + NAMES[Math.floor(Math.random() * NAMES.length)];
}

/**
 * 多人在场客户端。
 * Worker 不可用时静默降级为单人，不影响逛观。
 */
export function connectPresence(
  scene: THREE.Scene,
  onCount: (n: number) => void,
): PresenceHandle {
  const peers = new Map<string, PeerState>();
  let socket: WebSocket | null = null;
  let closed = false;
  let selfId = '';
  let selfName = randomName();
  let lastSent = 0;
  let count = 1;
  let retryMs = 1500;
  let failStreak = 0;

  const setCount = () => {
    count = peers.size + 1;
    onCount(count);
  };

  const ensurePeer = (id: string, name: string) => {
    let p = peers.get(id);
    if (p) return p;
    const mesh = createRemoteAvatar(name);
    scene.add(mesh);
    p = {
      id,
      name,
      x: 0,
      z: 0,
      yaw: 0,
      mesh,
      target: new THREE.Vector3(),
      targetYaw: 0,
    };
    peers.set(id, p);
    setCount();
    return p;
  };

  const removePeer = (id: string) => {
    const p = peers.get(id);
    if (!p) return;
    scene.remove(p.mesh);
    peers.delete(id);
    setCount();
  };

  const connect = () => {
    if (closed) return;
    // 连续失败太多次就降级为单人，避免控制台刷屏
    if (failStreak >= 3) {
      onCount(1);
      return;
    }
    try {
      socket = new WebSocket(PRESENCE_URL);
    } catch {
      failStreak += 1;
      onCount(1);
      return;
    }

    socket.addEventListener('open', () => {
      failStreak = 0;
      retryMs = 1500;
      socket?.send(JSON.stringify({ type: 'hello', name: selfName }));
    });

    socket.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg.type === 'welcome') {
          selfId = msg.id;
          if (msg.name) selfName = msg.name;
          for (const peer of msg.peers || []) {
            const p = ensurePeer(peer.id, peer.name || '道友');
            p.target.set(peer.x || 0, 0, peer.z || 0);
            p.mesh.position.copy(p.target);
            p.targetYaw = peer.yaw || 0;
          }
          setCount();
        } else if (msg.type === 'join') {
          ensurePeer(msg.id, msg.name || '道友');
        } else if (msg.type === 'leave') {
          removePeer(msg.id);
        } else if (msg.type === 'pose' && msg.id !== selfId) {
          const p = ensurePeer(msg.id, msg.name || '道友');
          p.target.set(msg.x || 0, 0, msg.z || 0);
          p.targetYaw = msg.yaw || 0;
        }
      } catch {
        /* ignore bad frames */
      }
    });

    socket.addEventListener('close', () => {
      for (const id of [...peers.keys()]) removePeer(id);
      if (closed) return;
      failStreak += 1;
      const wait = retryMs;
      retryMs = Math.min(20000, retryMs * 2);
      setTimeout(connect, wait);
    });

    socket.addEventListener('error', () => {
      // close 会触发重连
    });
  };

  connect();

  // 远端插值
  const tick = () => {
    if (closed) return;
    for (const p of peers.values()) {
      p.mesh.position.lerp(p.target, 0.18);
      p.mesh.rotation.y = THREE.MathUtils.lerp(p.mesh.rotation.y, p.targetYaw, 0.2);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return {
    get count() {
      return count;
    },
    updateLocal(pose) {
      const now = performance.now();
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      if (now - lastSent < 80) return;
      lastSent = now;
      socket.send(JSON.stringify({ type: 'pose', x: pose.x, z: pose.z, yaw: pose.yaw }));
    },
    dispose() {
      closed = true;
      socket?.close();
      for (const id of [...peers.keys()]) removePeer(id);
    },
  };
}
