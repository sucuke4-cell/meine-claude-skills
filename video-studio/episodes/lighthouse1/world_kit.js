// ===== World-building kit v2: richer materials, layered foliage, detailed buildings,
// gradient sky+clouds, water with sparkle, contact shadows, bloom post-processing. =====
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const ease = u => { u = clamp(u); return u * u * (3 - 2 * u); };
export const easeOut = u => 1 - Math.pow(1 - clamp(u), 3);
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const lerpV = (a, b, u) => a.clone().lerp(b, u);
export const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
export function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t; }
export function mat(color, o = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.68, metalness: 0.02, ...o }); }

// ---------------- renderer / composer with bloom ----------------
export function setupRenderer(W, H) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H); renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.prepend(renderer.domElement);
  return renderer;
}
export function setupComposer(renderer, scene, camera, W, H) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.3, 0.6, 0.92);
  composer.addPass(bloom);
  // subtle vignette + grade
  const vignette = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, amt: { value: 0.32 }, warm: { value: 0.0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float amt; uniform float warm; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - 0.5; float vig = 1.0 - amt * dot(d,d) * 1.6;
        c.rgb *= vig; c.rgb = mix(c.rgb, c.rgb * vec3(1.06,1.0,0.94) + vec3(warm*0.03,warm*0.015,0.0), 1.0);
        gl_FragColor = c; }`
  });
  composer.addPass(vignette);
  return { composer, bloom, vignette };
}

// ---------------- sky: gradient dome + sun glow + clouds ----------------
export function makeSky(topColor, botColor, radius = 150) {
  const geo = new THREE.SphereGeometry(radius, 24, 16);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, fog: false, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(topColor) }, bot: { value: new THREE.Color(botColor) } },
    vertexShader: `varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying float h; uniform vec3 top; uniform vec3 bot;
      void main(){ float t = smoothstep(-0.15, 0.55, h); gl_FragColor = vec4(mix(bot, top, t), 1.0); }`
  });
  const dome = new THREE.Mesh(geo, m);
  dome.userData.setColors = (t, b) => { m.uniforms.top.value.set(t); m.uniforms.bot.value.set(b); };
  return dome;
}
export function sunGlowSprite(color = 0xfff2c8, size = 22) {
  const tex = canvasTex(256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,240,200,0.55)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, toneMapped: false, fog: false }));
  s.scale.set(size, size, 1); return s;
}
export function cloudField(count, spread, y, seed = 1) {
  const r = rng(seed); const g = new THREE.Group();
  const tex = canvasTex(256, 128, (c) => {
    c.clearRect(0, 0, 256, 128);
    for (let i = 0; i < 7; i++) { const gr = c.createRadialGradient(40 + i * 24, 64, 4, 40 + i * 24, 64, 46 - Math.abs(i - 3) * 6); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.arc(40 + i * 24, 64, 46 - Math.abs(i - 3) * 6, 0, 7); c.fill(); }
  });
  const sm = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, opacity: 0.9 });
  for (let i = 0; i < count; i++) { const s = new THREE.Sprite(sm); const sc = 14 + r() * 16; s.scale.set(sc * 1.8, sc * 0.9, 1); s.position.set((r() - 0.5) * spread, y + r() * 6, -spread * 0.3 - r() * spread * 0.7); g.add(s); }
  return g;
}

// ---------------- ground: textured grass/dirt/sand/stone with blade/grain detail ----------------
export function groundTexture(kind, baseA, baseB, seed = 1) {
  const r = rng(seed);
  return canvasTex(512, 512, (g) => {
    g.fillStyle = `#${baseA.toString(16).padStart(6, '0')}`; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) {
      const x = r() * 512, y = r() * 512; const shade = r();
      g.fillStyle = `rgba(${((baseB >> 16) & 255)},${((baseB >> 8) & 255)},${(baseB & 255)},${0.08 + shade * 0.22})`;
      if (kind === 'grass') { g.save(); g.translate(x, y); g.rotate(r() * 0.6 - 0.3); g.fillRect(0, 0, 1.4, 5 + r() * 6); g.restore(); }
      else if (kind === 'sand') { g.beginPath(); g.arc(x, y, 0.6 + r() * 1.3, 0, 7); g.fill(); }
      else if (kind === 'stone') { g.fillRect(x, y, 2 + r() * 3, 2 + r() * 3); }
      else { g.beginPath(); g.arc(x, y, 1 + r() * 2, 0, 7); g.fill(); }
    }
    if (kind === 'stone') { g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 2; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(r() * 512, 0); g.lineTo(r() * 512, 512); g.stroke(); } for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(0, r() * 512); g.lineTo(512, r() * 512); g.stroke(); } }
  });
}
export function ground(w, d, kind = 'grass', colA = 0x3a6a34, colB = 0x2a5424, repeat = 14) {
  const tex = groundTexture(kind, colA, colB, (colA + colB) % 9999);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(repeat * w / 40, repeat * d / 40);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 1, 1), mat(0xffffff, { map: tex, roughness: kind === 'sand' ? 0.95 : 0.9 }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m;
}

// ---------------- water: layered gradient + animated sparkle ----------------
export function water(w, d, deep = 0x0a4a68, shallow = 0x2aa0c8) {
  const sparkTex = canvasTex(256, 256, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); const r = rng(5); for (let i = 0; i < 180; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; g.fillRect(r() * 256, r() * 256, 1.4, 1.4); } });
  sparkTex.wrapS = sparkTex.wrapT = THREE.RepeatWrapping; sparkTex.repeat.set(w / 6, d / 6);
  const m = new THREE.MeshStandardMaterial({ color: deep, roughness: 0.22, metalness: 0.15, emissive: shallow, emissiveIntensity: 0.12, emissiveMap: sparkTex, transparent: true, opacity: 0.94 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 1, 1), m); mesh.rotation.x = -Math.PI / 2;
  mesh.userData.sparkTex = sparkTex; mesh.userData.update = t => { sparkTex.offset.set(t * 0.015, t * 0.01); };
  return mesh;
}

// ---------------- contact shadow (soft blob under feet, grounds characters) ----------------
const blobTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
export function contactShadow(scale = 1.2) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012; m.renderOrder = 1; return m;
}

// ---------------- foliage: layered, varied, full-looking trees ----------------
export function treeRound(seed = 1, scale = 1) {
  const r = rng(seed); const g = new THREE.Group();
  const trunkH = 1.6 + r() * 0.8;
  const barkTex = canvasTex(64, 128, (c) => { c.fillStyle = '#4a3522'; c.fillRect(0, 0, 64, 128); for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.2})`; c.beginPath(); c.moveTo(Math.random() * 64, 0); c.lineTo(Math.random() * 64, 128); c.stroke(); } });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, trunkH * scale, 8), mat(0xffffff, { map: barkTex, roughness: 0.95 }));
  trunk.position.y = trunkH * scale / 2; trunk.castShadow = true; g.add(trunk);
  const greens = [0x2f6b2f, 0x376f34, 0x245c2a, 0x3c7a3a];
  for (let i = 0; i < 4; i++) {
    const s = (1.1 - i * 0.15) * scale * (0.9 + r() * 0.3);
    const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), mat(greens[i % greens.length], { roughness: 0.85, flatShading: true }));
    foliage.position.set((r() - 0.5) * 0.3 * scale, trunkH * scale + i * 0.55 * scale, (r() - 0.5) * 0.3 * scale);
    foliage.castShadow = true; foliage.receiveShadow = true; g.add(foliage);
  }
  return g;
}
export function treePine(seed = 1, scale = 1) {
  const r = rng(seed); const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.16 * scale, 0.8 * scale, 7), mat(0x3a2a1a));
  trunk.position.y = 0.4 * scale; trunk.castShadow = true; g.add(trunk);
  const greens = [0x1f4d2e, 0x255a34, 0x1a3f26];
  for (let i = 0; i < 4; i++) { const s = (1.3 - i * 0.26) * scale; const cone = new THREE.Mesh(new THREE.ConeGeometry(s, s * 1.3, 9), mat(greens[i % 3], { flatShading: true, roughness: 0.9 })); cone.position.y = 0.8 * scale + i * 0.62 * scale; cone.castShadow = true; cone.receiveShadow = true; g.add(cone); }
  return g;
}

// ---------------- detailed building: windows grid, door, roof overhang, trim, chimney ----------------
export function building(opt) {
  const { w = 5, h = 4, d = 5, wallColor = 0xb08a6a, roofColor = 0x5a3a2a, roofKind = 'hip', windowRows = 2, windowCols = 2, lit = 0.4, doorSide = 1, trimColor = 0xffffff, chimney = false, seed = 1 } = opt;
  const r = rng(seed); const g = new THREE.Group();
  const wallTex = canvasTex(256, 256, (c) => {
    c.fillStyle = `#${wallColor.toString(16).padStart(6, '0')}`; c.fillRect(0, 0, 256, 256);
    c.strokeStyle = 'rgba(0,0,0,0.08)'; c.lineWidth = 2;
    for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(0, i * 32); c.lineTo(256, i * 32); c.stroke(); }
  });
  const wallM = mat(0xffffff, { map: wallTex, roughness: 0.85 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallM); body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  // base trim
  const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.3, d + 0.1), mat(0x5a4a40, { roughness: 0.9 })); base.position.y = 0.15; g.add(base);
  // corner trim posts
  for (const cx of [-w / 2, w / 2]) for (const cz of [-d / 2, d / 2]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, 0.16), mat(trimColor, { roughness: 0.8 })); post.position.set(cx, h / 2, cz); g.add(post); }
  // windows (grid, each independently lit, with frame + sill + glow)
  const winMats = [];
  const faceWidth = w; const marginX = faceWidth * 0.18, usable = faceWidth - marginX * 2;
  for (let row = 0; row < windowRows; row++) for (let col = 0; col < windowCols; col++) {
    const wx = -w / 2 + marginX + usable * (col + 0.5) / windowCols;
    const wy = h * (0.3 + row * (0.55 / Math.max(1, windowRows - 1 || 1))) + (windowRows === 1 ? h * 0.15 : 0);
    const winGlassM = mat(0x223344, { emissive: 0xffcf8a, emissiveIntensity: 0, roughness: 0.3, metalness: 0.1 });
    winMats.push(winGlassM);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.08), mat(trimColor));
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), winGlassM);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.14), mat(trimColor));
    for (const z of [d / 2 + 0.045, -d / 2 - 0.045]) { const f = frame.clone(), gl = glass.clone(), si = sill.clone(); f.position.set(wx, wy, z); gl.position.set(wx, wy, z + Math.sign(z) * 0.05); si.position.set(wx, wy - 0.46, z + Math.sign(z) * 0.08); g.add(f, gl, si); }
  }
  winMats.forEach(m => { if (r() < lit) m.emissiveIntensity = 0.9 + r() * 0.5; });
  // door
  const doorW = 0.9, doorH = 1.9;
  const doorM = mat(0x4a2e1a, { roughness: 0.7 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.1), doorM);
  door.position.set(w * 0.22 * doorSide, doorH / 2, d / 2 + 0.05); g.add(door);
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.18, doorH + 0.18, 0.06), mat(trimColor));
  doorFrame.position.set(w * 0.22 * doorSide, doorH / 2, d / 2 + 0.02); g.add(doorFrame);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), mat(0xd4af37, { metalness: 0.7, roughness: 0.3 }));
  knob.position.set(w * 0.22 * doorSide + doorW * 0.32, doorH * 0.5, d / 2 + 0.11); g.add(knob);
  // small porch roof over door
  const porch = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.6, 0.12, 0.6), mat(roofColor));
  porch.position.set(w * 0.22 * doorSide, doorH + 0.2, d / 2 + 0.35); porch.castShadow = true; g.add(porch);
  // roof
  if (roofKind === 'hip') { const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, h * 0.48, 4), mat(roofColor, { roughness: 0.75, flatShading: true })); roof.position.y = h + h * 0.24; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof); }
  else { const roofH = h * 0.42; const shape = new THREE.Group(); const half = new THREE.Mesh(new THREE.BoxGeometry(Math.max(w, d) * 0.82, 0.12, Math.max(w, d) * 0.62), mat(roofColor, { roughness: 0.8 })); for (const s of [-1, 1]) { const p = half.clone(); p.rotation.z = s * 0.5; p.position.set(0, h + roofH * 0.5, s * Math.max(w, d) * 0.16); p.castShadow = true; shape.add(p); } shape.position.y = roofH * 0.2; g.add(shape); }
  if (chimney) { const ch = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.3, 0.4), mat(0x6a4a3a)); ch.position.set(w * 0.25, h + 1.0, -d * 0.2); ch.castShadow = true; g.add(ch); }
  g.userData.windowMats = winMats;
  return g;
}

// ---------------- pier / dock planks ----------------
export function pier(len, width = 2.2, postEvery = 2.5) {
  const g = new THREE.Group();
  const plankTex = canvasTex(256, 64, (c) => { c.fillStyle = '#7a5a3a'; c.fillRect(0, 0, 256, 64); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, 64); c.stroke(); } });
  plankTex.wrapS = THREE.RepeatWrapping; plankTex.repeat.set(len / 3, 1);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, len), mat(0xffffff, { map: plankTex, roughness: 0.9 }));
  deck.position.y = 1.1; deck.castShadow = true; deck.receiveShadow = true; g.add(deck);
  const postM = mat(0x5a4530, { roughness: 0.95 });
  for (let z = -len / 2 + 1; z < len / 2; z += postEvery) for (const x of [-width / 2 + 0.15, width / 2 - 0.15]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.4, 8), postM); post.position.set(x, 0.4, z); post.castShadow = true; g.add(post); }
  return g;
}

// ---------------- lighthouse ----------------
export function lighthouse(h = 11, r1 = 1.1, r2 = 0.7) {
  const g = new THREE.Group();
  const stripeTex = canvasTex(64, 256, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#e8e0d4' : '#c23a3a'; c.fillRect(0, i * 32, 64, 32); } });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, h, 16), mat(0xffffff, { map: stripeTex, roughness: 0.6 }));
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(r2 + 0.35, r2 + 0.35, 0.25, 16), mat(0x2a2a2a)); gallery.position.y = h + 0.1; gallery.castShadow = true; g.add(gallery);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(r2 + 0.35, r2 + 0.35, 0.5, 16, 1, true), mat(0x1a1a1a, { side: THREE.DoubleSide, wireframe: true })); rail.position.y = h + 0.35; g.add(rail);
  const lampRoomM = mat(0xfff6d0, { emissive: 0xffe9a0, emissiveIntensity: 1.6, transparent: true, opacity: 0.95 });
  const lampRoom = new THREE.Mesh(new THREE.CylinderGeometry(r2 - 0.1, r2 - 0.1, 1.2, 12), lampRoomM); lampRoom.position.y = h + 1.0; g.add(lampRoom);
  const roofCone = new THREE.Mesh(new THREE.ConeGeometry(r2 + 0.1, 1.0, 12), mat(0xb0303a)); roofCone.position.y = h + 2.1; roofCone.castShadow = true; g.add(roofCone);
  const lamp = new THREE.PointLight(0xfff0c0, 0, 40, 1.4); lamp.position.y = h + 1.0; g.add(lamp);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.55, 14, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
  beam.rotation.z = Math.PI / 2; beam.position.set(7, h + 1.0, 0); g.add(beam);
  g.userData = { lamp, lampRoomM, beam, h };
  g.userData.setBeamAngle = (ang) => { beam.position.set(Math.cos(ang) * 7, h + 1.0, Math.sin(ang) * 7); beam.rotation.y = ang; beam.rotation.z = Math.PI / 2; };
  return g;
}

// ---------------- boat ----------------
export function boat(color = 0x6a3a2a) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.15, 3.2, 8, 1, false, 0, Math.PI), mat(color, { roughness: 0.7 }));
  hull.rotation.z = Math.PI / 2; hull.rotation.y = Math.PI / 2; hull.position.y = 0.35; hull.castShadow = true; g.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 2.8), mat(0x8a6a4a)); deck.position.y = 0.55; g.add(deck);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.4, 6), mat(0x4a3a2a)); mast.position.set(0, 1.7, 0.2); mast.castShadow = true; g.add(mast);
  const sailM = mat(0xf0ead8, { roughness: 0.9, side: THREE.DoubleSide });
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.6), sailM); sail.position.set(0.02, 1.9, 0.2); sail.rotation.y = 0.15; sail.castShadow = true; g.add(sail);
  return g;
}

// ---------------- weather: rain + storm clouds + lightning flash helper ----------------
export function rainField(count, spread, areaY, seed = 1) {
  const r = rng(seed); const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(0.025, 0.5, 0.025);
  const m = new THREE.MeshBasicMaterial({ color: 0xbcd6e8, transparent: true, opacity: 0.55 });
  const drops = [];
  for (let i = 0; i < count; i++) { const mesh = new THREE.Mesh(geo, m); mesh.userData = { x: (r() - 0.5) * spread, z: (r() - 0.5) * spread, y: r() * areaY, sp: 14 + r() * 8 }; g.add(mesh); drops.push(mesh); }
  g.userData.update = (t, cx, cz) => drops.forEach(d => { const u = d.userData; let y = (u.y - t * u.sp) % areaY; if (y < 0) y += areaY; d.position.set(cx + u.x, y, cz + u.z); });
  return g;
}
