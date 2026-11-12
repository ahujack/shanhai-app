/**
 * 仪式乐器合成：噪声冲击 + 谐振体 + 轻混响。
 * 木鱼要「笃」一声实木感，不能是蜂鸣器哔哔声。
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let verb: ConvolverNode | null = null;

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  if (!master) {
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);
    verb = makeImpulse(ctx);
    const verbGain = ctx.createGain();
    verbGain.gain.value = 0.22;
    verb.connect(verbGain);
    verbGain.connect(master);
  }
  return ctx;
}

function out(): AudioNode {
  ac();
  return master!;
}

function wet(): AudioNode {
  ac();
  return verb!;
}

/** 短脉冲响应，模拟庭院回响 */
function makeImpulse(c: AudioContext): ConvolverNode {
  const len = Math.floor(c.sampleRate * 1.4);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / c.sampleRate;
      d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 3.2) * (0.55 + 0.45 * Math.sin(i * 0.013 + ch));
    }
  }
  const node = c.createConvolver();
  node.buffer = buf;
  return node;
}

function noiseBuffer(seconds: number): AudioBuffer {
  const c = ac();
  const n = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function connectDryWet(node: AudioNode, dry = 1, wetAmt = 0.35) {
  const c = ac();
  const dryG = c.createGain();
  dryG.gain.value = dry;
  node.connect(dryG);
  dryG.connect(out());
  if (wetAmt > 0) {
    const wetG = c.createGain();
    wetG.gain.value = wetAmt;
    node.connect(wetG);
    wetG.connect(wet());
  }
}

/** 带通噪声冲击：木击/槌击质感 */
function noiseHit(o: {
  when?: number;
  duration?: number;
  freq?: number;
  q?: number;
  gain?: number;
  wet?: number;
}) {
  const c = ac();
  const t0 = c.currentTime + (o.when ?? 0);
  const dur = o.duration ?? 0.08;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(0.25);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(o.freq ?? 900, t0);
  bp.Q.value = o.q ?? 2.2;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.5, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp);
  bp.connect(g);
  connectDryWet(g, 1, o.wet ?? 0.2);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

/** 谐振正弦：木腔/金属腔 */
function partial(o: {
  freq: number;
  duration: number;
  gain?: number;
  when?: number;
  type?: OscillatorType;
  attack?: number;
  wet?: number;
  detune?: number;
}) {
  const c = ac();
  const t0 = c.currentTime + (o.when ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.detune) osc.detune.setValueAtTime(o.detune, t0);
  const attack = o.attack ?? 0.008;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.1, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.duration);
  osc.connect(g);
  connectDryWet(g, 1, o.wet ?? 0.3);
  osc.start(t0);
  osc.stop(t0 + o.duration + 0.05);
}

export const sounds = {
  unlock() {
    void ac().resume();
  },

  /** 木鱼：短促实木「笃」——噪声冲击 + 短腔共鸣，绝不拉长成音高 */
  moktak() {
    // 槌面撞击
    noiseHit({ freq: 1400, q: 1.1, duration: 0.045, gain: 0.55, wet: 0.12 });
    noiseHit({ freq: 620, q: 3.5, duration: 0.07, gain: 0.38, wet: 0.18, when: 0.002 });
    // 空心木腔：极短、略闷
    partial({ freq: 380, duration: 0.14, gain: 0.16, attack: 0.003, type: 'triangle', wet: 0.15 });
    partial({ freq: 560, duration: 0.11, gain: 0.09, attack: 0.003, type: 'sine', wet: 0.12 });
    partial({ freq: 210, duration: 0.16, gain: 0.07, attack: 0.004, type: 'sine', wet: 0.1 });
    // 收尾轻触
    noiseHit({ freq: 980, q: 2.0, duration: 0.03, gain: 0.12, when: 0.04, wet: 0.08 });
  },

  /** 铜磬：清越长音，非谐波金属分音 */
  qing() {
    noiseHit({ freq: 2200, q: 4, duration: 0.03, gain: 0.18, wet: 0.25 });
    partial({ freq: 612, duration: 2.4, gain: 0.11, attack: 0.01, wet: 0.45 });
    partial({ freq: 918, duration: 2.0, gain: 0.055, attack: 0.012, wet: 0.4, detune: 6 });
    partial({ freq: 1284, duration: 1.6, gain: 0.035, attack: 0.015, wet: 0.35 });
    partial({ freq: 1836, duration: 1.2, gain: 0.02, attack: 0.02, wet: 0.3 });
    partial({ freq: 306, duration: 1.8, gain: 0.04, attack: 0.02, type: 'triangle', wet: 0.35 });
  },

  /** 大钟：低沉悠远 */
  bell() {
    noiseHit({ freq: 280, q: 1.4, duration: 0.12, gain: 0.35, wet: 0.4 });
    partial({ freq: 110, duration: 4.2, gain: 0.14, attack: 0.02, wet: 0.55 });
    partial({ freq: 165, duration: 3.6, gain: 0.07, attack: 0.025, wet: 0.5, detune: -4 });
    partial({ freq: 275, duration: 3.0, gain: 0.05, attack: 0.03, wet: 0.45 });
    partial({ freq: 440, duration: 2.4, gain: 0.03, attack: 0.04, type: 'triangle', wet: 0.4 });
    partial({ freq: 660, duration: 1.8, gain: 0.018, attack: 0.05, wet: 0.35 });
  },

  /** 上香：炭火轻响 + 烟气感 */
  incense() {
    noiseHit({ freq: 180, q: 0.7, duration: 0.35, gain: 0.12, wet: 0.3 });
    noiseHit({ freq: 2400, q: 6, duration: 0.04, gain: 0.08, when: 0.08, wet: 0.1 });
    noiseHit({ freq: 1800, q: 5, duration: 0.03, gain: 0.05, when: 0.18, wet: 0.08 });
    partial({ freq: 140, duration: 0.7, gain: 0.03, attack: 0.08, type: 'triangle', wet: 0.25 });
  },

  /** 祈福：柔和风铃声 */
  wish() {
    const notes = [523.25, 659.25, 783.99, 987.77];
    notes.forEach((f, i) => {
      partial({
        freq: f,
        duration: 1.1 - i * 0.12,
        gain: 0.045 - i * 0.006,
        when: i * 0.11,
        attack: 0.02,
        wet: 0.5,
      });
      noiseHit({ freq: f * 2.2, q: 8, duration: 0.04, gain: 0.06, when: i * 0.11, wet: 0.25 });
    });
  },

  /** 静坐：低缓入定 */
  sit() {
    partial({ freq: 82, duration: 1.6, gain: 0.05, attack: 0.25, type: 'sine', wet: 0.4 });
    partial({ freq: 123, duration: 1.4, gain: 0.025, attack: 0.3, type: 'triangle', wet: 0.35 });
    noiseHit({ freq: 400, q: 0.6, duration: 0.5, gain: 0.04, wet: 0.2 });
  },

  /** 抽签：签筒摇晃摩擦 */
  draw() {
    for (let i = 0; i < 5; i++) {
      noiseHit({
        freq: 900 + Math.random() * 700,
        q: 1.8,
        duration: 0.05 + Math.random() * 0.04,
        gain: 0.1,
        when: i * 0.055,
        wet: 0.12,
      });
    }
    partial({ freq: 260, duration: 0.25, gain: 0.04, when: 0.22, attack: 0.01, type: 'triangle', wet: 0.15 });
  },

  /** 灵伴：清亮现身 */
  companion() {
    const notes = [392, 494, 587, 740];
    notes.forEach((f, i) => {
      partial({
        freq: f,
        duration: 0.9 + i * 0.15,
        gain: 0.04 - i * 0.004,
        when: i * 0.13,
        attack: 0.03,
        wet: 0.55,
      });
    });
    noiseHit({ freq: 1600, q: 3, duration: 0.08, gain: 0.08, when: 0.05, wet: 0.3 });
  },
};
