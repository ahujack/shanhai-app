import * as THREE from 'three';
import { C, softTexture } from './kit';

/** 墨色描边：背面放大一层，游戏国风常用手法 */
export function addInkOutline(
  mesh: THREE.Mesh | THREE.Group,
  thickness = 0.035,
  color = 0x1a1c1e,
): void {
  const targets: THREE.Mesh[] = [];
  if ((mesh as THREE.Mesh).isMesh) targets.push(mesh as THREE.Mesh);
  mesh.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o !== mesh) targets.push(o as THREE.Mesh);
  });

  for (const m of targets) {
    if (m.userData.inkOutlined || m.userData.skipOutline || m.userData.isOutline) continue;
    if (!m.geometry) continue;
    const mat = m.material as THREE.Material | THREE.Material[];
    const first = Array.isArray(mat) ? mat[0] : mat;
    if (first && (first as THREE.MeshBasicMaterial).transparent && (first as THREE.MeshBasicMaterial).opacity < 0.55) {
      continue;
    }
    // 极扁/极细的构件跳过，避免膨胀成黑块
    const box3 = new THREE.Box3().setFromObject(m);
    const size = new THREE.Vector3();
    box3.getSize(size);
    if (size.x < 0.08 || size.y < 0.06 || size.z < 0.08) continue;

    const outline = new THREE.Mesh(
      m.geometry,
      new THREE.MeshBasicMaterial({
        color,
        side: THREE.BackSide,
        fog: true,
      }),
    );
    outline.scale.multiplyScalar(1 + thickness);
    outline.renderOrder = (m.renderOrder || 0) - 1;
    outline.castShadow = false;
    outline.receiveShadow = false;
    outline.userData.isOutline = true;
    m.add(outline);
    m.userData.inkOutlined = true;
  }
}

/** 给一组物体批量描边 */
export function outlineGroup(root: THREE.Object3D, thickness = 0.028) {
  root.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    if (o.userData.isOutline || o.userData.skipOutline) return;
    const m = o as THREE.Mesh;
    if (!m.geometry) return;
    addInkOutline(m, thickness);
  });
}

/** 水墨晕染山石材质：边缘淡、中心稍深 */
export function inkWashMaterial(color: number, opacity = 1): THREE.ShaderMaterial {
  const c = new THREE.Color(color);
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: c },
      uOpacity: { value: opacity },
      uFogColor: { value: new THREE.Color(0xe7e2d4) },
      uFogNear: { value: 22 },
      uFogFar: { value: 110 },
    },
    transparent: opacity < 0.99,
    depthWrite: opacity > 0.95,
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vW;
      #include <common>
      #include <fog_pars_vertex>
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vW = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform vec3 uFogColor;
      uniform float uFogNear;
      uniform float uFogFar;
      varying vec3 vN;
      varying vec3 vW;
      void main() {
        // 假光照 + 边缘留白（宣纸感）
        float ndl = clamp(dot(normalize(vN), normalize(vec3(0.35, 0.85, 0.25))), 0.0, 1.0);
        float rim = pow(1.0 - abs(dot(normalize(vN), vec3(0.0, 0.0, 1.0))), 2.2);
        vec3 col = uColor * (0.55 + ndl * 0.5);
        col = mix(col, uFogColor, rim * 0.35);
        // 距离雾
        float depth = length(vW - cameraPosition);
        float fogFactor = smoothstep(uFogNear, uFogFar, depth);
        col = mix(col, uFogColor, fogFactor * 0.85);
        gl_FragColor = vec4(col, uOpacity * (1.0 - fogFactor * 0.15));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** 青苔边缘贴图 */
let mossTex: THREE.CanvasTexture | null = null;
export function mossTexture(): THREE.CanvasTexture {
  if (mossTex) return mossTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#8f9a7e';
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 400; i++) {
    g.fillStyle = `rgba(40,60,40,${Math.random() * 0.25})`;
    g.beginPath();
    g.arc(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 3, 0, Math.PI * 2);
    g.fill();
  }
  mossTex = new THREE.CanvasTexture(c);
  mossTex.wrapS = mossTex.wrapT = THREE.RepeatWrapping;
  mossTex.colorSpace = THREE.SRGBColorSpace;
  return mossTex;
}

/** 檐下灯笼 */
export function makeEaveLantern(color = C.column): THREE.Group {
  const g = new THREE.Group();
  g.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6),
      new THREE.MeshLambertMaterial({ color: C.woodDark }),
    ),
  );
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 0.32, 10),
    new THREE.MeshLambertMaterial({ color: 0xd9a060, emissive: 0xc07030, emissiveIntensity: 0.35 }),
  );
  body.position.y = -0.28;
  g.add(body);
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.12, 0.08, 10),
    new THREE.MeshLambertMaterial({ color }),
  );
  cap.position.y = -0.1;
  g.add(cap);
  const light = new THREE.PointLight(0xffb070, 0.55, 5, 2);
  light.position.y = -0.28;
  g.add(light);
  // 柔光晕
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: softTexture(),
      color: 0xffc090,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  halo.scale.set(0.9, 0.9, 1);
  halo.position.y = -0.28;
  g.add(halo);
  return g;
}
