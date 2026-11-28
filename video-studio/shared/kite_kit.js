// ===== Kite / festival kit: kites with tails, glowing friendship strings (tube pool), bunting,
// festival tents, banner arch, a cliff edge with a valley below and distant mountains. =====
import * as THREE from 'three';
import { canvasTex, mat, rng } from './world_kit.js';

const hex = c => `#${c.toString(16).padStart(6, '0')}`;

// ---------------- kite ----------------
export function makeKite(seed = 1, colors = null) {
  const r = rng(seed); const pal = [0xff4a5a, 0xffc93a, 0x3ab0ff, 0x6ad86a, 0xb070ff, 0xff8a3a, 0xff6ab0, 0x2ad0c0];
  const c1 = colors?.[0] ?? pal[r() * pal.length | 0], c2 = colors?.[1] ?? pal[r() * pal.length | 0];
  const style = r() * 3 | 0;
  const tex = canvasTex(256, 256, (g) => {
    g.fillStyle = hex(c1); g.fillRect(0, 0, 256, 256); g.fillStyle = hex(c2);
    if (style === 0) { g.fillRect(0, 0, 128, 128); g.fillRect(128, 128, 128, 128); }
    else if (style === 1) { for (let i = 0; i < 6; i++) g.fillRect(0, i * 44, 256, 22); }
    else { g.beginPath(); g.arc(128, 128, 70, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 30, 0, 7); g.fill(); }
  });
  const geo = new THREE.BufferGeometry();
  // diamond: top, right, bottom, left (in XY plane, facing +z)
  const v = new Float32Array([0, 0.62, 0, 0.42, 0.08, 0, 0, -0.62, 0, -0.42, 0.08, 0]);
  geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0.5, 1, 1, 0.56, 0.5, 0, 0, 0.56]), 2));
  geo.setIndex([0, 3, 1, 1, 3, 2]); geo.computeVertexNormals();
  const g = new THREE.Group();
  const sail = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.6 })); sail.castShadow = true; g.add(sail);
  const stickM = mat(0x6a4a2a);
  const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.24, 5), stickM); s1.position.z = 0.01; g.add(s1);
  const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.84, 5), stickM); s2.rotation.z = Math.PI / 2; s2.position.set(0, 0.08, 0.01); g.add(s2);
  // tail with bows
  const tail = []; const bowM = mat(c2, { side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), bowM); b.rotation.z = Math.PI / 2; g.add(b); tail.push(b); }
  g.userData = { tail, sail, c1, c2 };
  // sway(t): flutter + tail wave (call each frame)
  g.userData.sway = (t, amt = 1) => { const ph = seed * 1.7; g.rotation.z = Math.sin(t * 2.1 + ph) * 0.18 * amt; g.rotation.x = Math.sin(t * 1.4 + ph) * 0.12 * amt;
    tail.forEach((b, i) => b.position.set(Math.sin(t * 5 + i * 0.9 + ph) * 0.08 * (i + 1) * 0.5 * amt, -0.7 - i * 0.18, 0)); };
  g.userData.sway(0);
  return g;
}

// ---------------- strings: a pool of tube meshes rebuilt every frame ----------------
export function makeStringPool(scene, n = 80) {
  const pool = []; let used = 0;
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true })); m.frustumCulled = false; m.visible = false; scene.add(m); pool.push(m); }
  const api = {
    reset() { pool.forEach(m => m.visible = false); used = 0; },
    // draw a sagging string from a to b. prog 0..1 grows it from a toward b.
    draw(a, b, { color = 0xff6a8a, r = 0.022, sag = 0.35, prog = 1, opacity = 1, glow = 1 } = {}) {
      if (prog <= 0.001 || used >= pool.length) return; const m = pool[used++];
      const pts = []; const N = 14;
      for (let i = 0; i <= N; i++) { const u = (i / N) * prog; const p = a.clone().lerp(b, u); p.y -= Math.sin(u * Math.PI) * sag; pts.push(p); }
      m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 5, false);
      m.material.color.setHex(color).multiplyScalar(glow); m.material.opacity = opacity; m.visible = true;
    },
  };
  return api;
}

// ---------------- festival decorations ----------------
export function bunting(a, b, sag = 0.6, seed = 3) {
  const r = rng(seed); const g = new THREE.Group(); const pal = [0xff4a5a, 0xffc93a, 0x3ab0ff, 0x6ad86a, 0xff6ab0, 0xffffff];
  const N = Math.max(4, Math.round(a.distanceTo(b) / 0.55));
  const pts = []; for (let i = 0; i <= N; i++) { const u = i / N; const p = a.clone().lerp(b, u); p.y -= Math.sin(u * Math.PI) * sag; pts.push(p); }
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 2, 0.02, 4), mat(0xf4f0e8)); g.add(rope);
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.18, 0, 0, 0.18, 0, 0, 0, -0.36, 0]), 3)); tri.computeVertexNormals();
  for (let i = 1; i < N; i++) { const f = new THREE.Mesh(tri, mat(pal[r() * pal.length | 0], { side: THREE.DoubleSide })); f.position.copy(pts[i]); f.lookAt(pts[i].clone().add(new THREE.Vector3(-(b.z - a.z), 0, b.x - a.x))); g.add(f); }
  return g;
}
export function tent(color = 0xff4a5a, w = 3) {
  const g = new THREE.Group(); const stripe = canvasTex(256, 64, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#ffffff' : hex(color); c.fillRect(i * 32, 0, 32, 64); } });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.75, 1.4, 8), mat(0xffffff, { map: stripe })); roof.position.y = 2.9; roof.castShadow = true; g.add(roof);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.7, w * 0.7, 2.2, 8, 1, true), mat(0xfff4e0, { side: THREE.DoubleSide })); body.position.y = 1.1; body.castShadow = true; g.add(body);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), mat(color, { side: THREE.DoubleSide })); flag.position.set(0.25, 4.0, 0); g.add(flag);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 5), mat(0x444444)); pole.position.y = 3.8; g.add(pole);
  return g;
}
export function bannerArch(text, w = 8) {
  const g = new THREE.Group(); const pm = mat(0x8a5a3a, { roughness: 0.8 });
  for (const sx of [-w / 2, w / 2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.4, 8), pm); p.position.set(sx, 2.2, 0); p.castShadow = true; g.add(p); }
  const tex = canvasTex(1024, 160, (c, W, H) => { c.fillStyle = '#2a5aa8'; c.fillRect(0, 0, W, H); c.strokeStyle = '#ffd94a'; c.lineWidth = 14; c.strokeRect(8, 8, W - 16, H - 16); c.fillStyle = '#fff'; c.font = 'bold 84px Inter, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, H / 2 + 4); });
  const b = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 160 / 1024), mat(0xffffff, { map: tex })); b.position.y = 4.0; g.add(b); const bk = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 160 / 1024), mat(0x2a5aa8)); bk.position.y = 4.0; bk.rotation.y = Math.PI; g.add(bk);
  return g;
}
// cliff edge at z = edgeZ: rock face + a valley below with fields, a river, trees and far mountains
export function valley(edgeZ = -46, seed = 4) {
  const r = rng(seed); const g = new THREE.Group();
  const rockTex = canvasTex(256, 256, (c) => { c.fillStyle = '#7a6a58'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(0,0,0,${r() * 0.2})`; c.fillRect(r() * 256, r() * 256, 6 + r() * 20, 3 + r() * 8); } });
  rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping; rockTex.repeat.set(12, 2);
  const face = new THREE.Mesh(new THREE.BoxGeometry(200, 26, 4), mat(0xffffff, { map: rockTex, roughness: 1 })); face.position.set(0, -13.05, edgeZ - 2); face.receiveShadow = true; g.add(face);
  const fields = canvasTex(512, 512, (c) => { const cols = ['#7ab84a', '#9ac85a', '#c8b860', '#5a9a3a', '#b0d070']; for (let i = 0; i < 40; i++) { c.fillStyle = cols[r() * cols.length | 0]; c.fillRect(r() * 512, r() * 512, 40 + r() * 120, 30 + r() * 90); } c.strokeStyle = '#4aa8e0'; c.lineWidth = 14; c.beginPath(); c.moveTo(0, 300); c.bezierCurveTo(150, 200, 300, 420, 512, 260); c.stroke(); });
  fields.wrapS = fields.wrapT = THREE.RepeatWrapping; fields.repeat.set(3, 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 260), mat(0xffffff, { map: fields, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -24, edgeZ - 132); g.add(floor);
  for (let i = 0; i < 70; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(1.2 + r() * 1.5, 4 + r() * 4, 7), mat([0x2f6b2f, 0x3c7a3a, 0x245c2a][r() * 3 | 0], { flatShading: true })); t.position.set((r() - 0.5) * 220, -22, edgeZ - 15 - r() * 140); g.add(t); }
  for (let i = 0; i < 9; i++) { const h = 30 + r() * 30; const m = new THREE.Mesh(new THREE.ConeGeometry(25 + r() * 20, h, 6), mat(0x7a8aa8, { flatShading: true, roughness: 1 })); m.position.set(-160 + i * 40 + r() * 10, -24 + h / 2, edgeZ - 200 - r() * 40); g.add(m); const cap = new THREE.Mesh(new THREE.ConeGeometry((25) * 0.3, h * 0.3, 6), mat(0xffffff, { flatShading: true })); cap.position.set(m.position.x, -24 + h * 0.85, m.position.z); g.add(cap); }
  // fence along the edge
  const fm = mat(0x8a5a3a); for (let x = -30; x <= 30; x += 1.2) { if (Math.abs(x) < 3) continue; const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.12), fm); p.position.set(x, 0.5, edgeZ + 0.6); p.castShadow = true; g.add(p); }
  for (const xs of [[-30, -3], [3, 30]]) for (const y of [0.45, 0.85]) { const rl = new THREE.Mesh(new THREE.BoxGeometry(xs[1] - xs[0], 0.08, 0.08), fm); rl.position.set((xs[0] + xs[1]) / 2, y, edgeZ + 0.6); g.add(rl); }
  return g;
}
