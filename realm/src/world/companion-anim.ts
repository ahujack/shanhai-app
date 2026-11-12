import * as THREE from 'three';
import { SERIF } from './kit';

export interface CompanionAnimState {
  bowUntil: number;
  glowUntil: number;
  bubbleUntil: number;
  speakText: string;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function bubbleTexture(text: string): THREE.CanvasTexture {
  const padX = 28;
  const padY = 22;
  const maxW = 420;
  const size = 30;
  const probe = document.createElement('canvas').getContext('2d')!;
  probe.font = `600 ${size}px ${SERIF}`;

  // 简单按字宽折行
  const chars = [...text];
  const lines: string[] = [];
  let line = '';
  for (const ch of chars) {
    const next = line + ch;
    if (probe.measureText(next).width > maxW - padX * 2 && line) {
      lines.push(line);
      line = ch;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);

  const lineH = 40;
  const w = Math.min(
    maxW,
    Math.ceil(Math.max(...lines.map((l) => probe.measureText(l).width)) + padX * 2),
  );
  const h = padY * 2 + lines.length * lineH + 14;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;

  // 气泡底
  g.fillStyle = 'rgba(11,13,20,0.82)';
  g.strokeStyle = 'rgba(214,179,106,0.55)';
  g.lineWidth = 3;
  const r = 22;
  g.beginPath();
  g.moveTo(r, 0);
  g.lineTo(w - r, 0);
  g.quadraticCurveTo(w, 0, w, r);
  g.lineTo(w, h - 18 - r);
  g.quadraticCurveTo(w, h - 18, w - r, h - 18);
  g.lineTo(w / 2 + 14, h - 18);
  g.lineTo(w / 2, h - 2);
  g.lineTo(w / 2 - 14, h - 18);
  g.lineTo(r, h - 18);
  g.quadraticCurveTo(0, h - 18, 0, h - 18 - r);
  g.lineTo(0, r);
  g.quadraticCurveTo(0, 0, r, 0);
  g.closePath();
  g.fill();
  g.stroke();

  g.fillStyle = '#f4ebdc';
  g.font = `600 ${size}px ${SERIF}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  lines.forEach((l, i) => {
    g.fillText(l, w / 2, padY + lineH * (i + 0.45));
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** 触发灵伴问候仪式：鞠躬 + 光晕 + 台词气泡 */
export function triggerCompanionGreeting(
  object: THREE.Object3D,
  text: string,
  now = performance.now() / 1000,
) {
  const state = (object.userData.anim as CompanionAnimState) || {
    bowUntil: 0,
    glowUntil: 0,
    bubbleUntil: 0,
    speakText: '',
  };
  state.bowUntil = now + 1.35;
  state.glowUntil = now + 3.2;
  state.bubbleUntil = now + 4.2;
  state.speakText = text;
  object.userData.anim = state;

  const bubble = object.getObjectByName('speech-bubble') as THREE.Sprite | undefined;
  if (bubble) {
    const old = bubble.material.map;
    const tex = bubbleTexture(text);
    (bubble.material as THREE.SpriteMaterial).map = tex;
    (bubble.material as THREE.SpriteMaterial).needsUpdate = true;
    old?.dispose();
    const aspect = tex.image.width / tex.image.height;
    bubble.scale.set(2.4 * aspect, 2.4, 1);
    bubble.visible = true;
  }
}

/** 每帧驱动灵伴：呼吸、鞠躬、光晕、气泡淡入淡出 */
export function tickCompanions(root: THREE.Object3D, t: number) {
  root.traverse((obj) => {
    if (obj.name !== 'companion-root') return;

    const figure = obj.getObjectByName('companion-figure');
    const aura = obj.getObjectByName('companion-aura') as THREE.Mesh | undefined;
    const ring = obj.getObjectByName('companion-ring') as THREE.Mesh | undefined;
    const bubble = obj.getObjectByName('speech-bubble') as THREE.Sprite | undefined;
    const motes = obj.getObjectByName('companion-motes');
    const state = obj.userData.anim as CompanionAnimState | undefined;

    // 闲时呼吸
    if (figure) {
      const breath = 1 + Math.sin(t * 1.6 + obj.position.x) * 0.018;
      figure.scale.set(1, breath, 1);
    }

    if (!state) {
      if (aura) {
        const m = aura.material as THREE.MeshBasicMaterial;
        m.opacity = 0.08 + Math.sin(t * 2) * 0.03;
      }
      if (bubble) bubble.visible = false;
      return;
    }

    // 鞠躬：前俯再起
    if (figure) {
      const bowLeft = state.bowUntil - t;
      if (bowLeft > 0) {
        const u = 1 - bowLeft / 1.35;
        const bend = u < 0.45 ? easeOutCubic(u / 0.45) : 1 - easeInOut((u - 0.45) / 0.55);
        figure.rotation.x = bend * 0.42;
      } else {
        figure.rotation.x = THREE.MathUtils.lerp(figure.rotation.x, 0, 0.12);
      }
    }

    // 光晕
    if (aura) {
      const m = aura.material as THREE.MeshBasicMaterial;
      const glowLeft = state.glowUntil - t;
      if (glowLeft > 0) {
        const u = 1 - glowLeft / 3.2;
        const pulse = 0.22 + 0.28 * Math.sin(t * 6);
        m.opacity = pulse * (u < 0.2 ? u / 0.2 : 1 - Math.max(0, (u - 0.75) / 0.25));
        aura.scale.setScalar(1.1 + Math.sin(t * 5) * 0.08);
      } else {
        m.opacity = THREE.MathUtils.lerp(m.opacity, 0.1, 0.08);
        aura.scale.setScalar(THREE.MathUtils.lerp(aura.scale.x, 1, 0.08));
      }
    }

    if (ring) {
      ring.rotation.z = t * 0.7;
      const m = ring.material as THREE.MeshBasicMaterial;
      const glowLeft = state.glowUntil - t;
      m.opacity = glowLeft > 0 ? 0.35 + Math.sin(t * 8) * 0.1 : 0.12;
    }

    // 气泡
    if (bubble) {
      const left = state.bubbleUntil - t;
      const mat = bubble.material as THREE.SpriteMaterial;
      if (left > 0) {
        bubble.visible = true;
        const u = 1 - left / 4.2;
        const fadeIn = Math.min(1, u / 0.18);
        const fadeOut = u > 0.82 ? 1 - (u - 0.82) / 0.18 : 1;
        mat.opacity = Math.max(0, fadeIn * fadeOut);
        bubble.position.y = 2.55 + Math.sin(t * 2.2) * 0.04;
      } else {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, 0.15);
        if (mat.opacity < 0.02) bubble.visible = false;
      }
    }

    // 光点上浮
    if (motes && state.glowUntil > t) {
      motes.children.forEach((child, i) => {
        const s = child as THREE.Sprite;
        const phase = t * 0.9 + i * 0.9;
        const k = (phase % 2.4) / 2.4;
        s.position.set(Math.sin(phase + i) * 0.55, 0.6 + k * 2.1, Math.cos(phase * 0.8) * 0.4);
        s.scale.setScalar(0.18 + (1 - k) * 0.22);
        (s.material as THREE.SpriteMaterial).opacity = (1 - k) * 0.55;
      });
      motes.visible = true;
    } else if (motes) {
      motes.visible = false;
    }
  });
}

/** 等待问候动画进行到可开面板的时机 */
export function waitCompanionBeat(ms = 900): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
