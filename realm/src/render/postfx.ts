import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

export interface PostFX {
  composer: EffectComposer;
  setOutline: (objects: THREE.Object3D[]) => void;
  resize: (w: number, h: number, dpr: number) => void;
  render: () => void;
}

/** 游戏向后处理：微泛光 + 宣纸色偏 + FXAA（墨线由网格背面描边承担，避免 OutlinePass 读回卡顿） */
export function createPostFX(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  lowPower: boolean,
): PostFX {
  const size = new THREE.Vector2();
  renderer.getSize(size);
  // RenderPass 写入中间缓冲；ACES / 曝光由 OutputPass 按 renderer 设置应用
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  if (!lowPower) {
    const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.16, 0.72, 0.84);
    composer.addPass(bloom);
  }

  const inkPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uAmount: { value: 0.16 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform float uAmount;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(tDiffuse, vUv);
        float g = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        vec3 ink = mix(c.rgb, vec3(g), uAmount);
        ink *= vec3(1.04, 1.0, 0.94);
        ink = pow(ink, vec3(0.94));
        vec2 p = vUv - 0.5;
        float vig = smoothstep(0.92, 0.22, dot(p, p) * 2.35);
        ink *= mix(0.88, 1.0, vig);
        gl_FragColor = vec4(ink, c.a);
      }`,
  });
  composer.addPass(inkPass);

  const fxaa = new ShaderPass(FXAAShader);
  const dpr = renderer.getPixelRatio();
  fxaa.material.uniforms['resolution'].value.set(1 / (size.x * dpr), 1 / (size.y * dpr));
  composer.addPass(fxaa);
  composer.addPass(new OutputPass());

  return {
    composer,
    setOutline() {
      /* mesh ink outlines handle silhouettes */
    },
    resize(w, h, pixelRatio) {
      composer.setSize(w, h);
      composer.setPixelRatio(pixelRatio);
      fxaa.material.uniforms['resolution'].value.set(1 / (w * pixelRatio), 1 / (h * pixelRatio));
    },
    render() {
      composer.render();
    },
  };
}
