// ===== Interior + town-prop kit: rooms with sunlit windows, school furniture, home furniture,
// signs, bus stop, a big school building, and a floating "energy battery" HUD sprite. =====
import * as THREE from 'three';
import { canvasTex, mat, rng } from './world_kit.js';

const hex = c => `#${c.toString(16).padStart(6, '0')}`;

export function woodTex(base = 0xa87a4e, seed = 3) {
  const r = rng(seed);
  return canvasTex(512, 512, (g) => {
    g.fillStyle = hex(base); g.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 8; row++) {
      const y = row * 64; const off = r() * 512;
      g.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.08})`; g.fillRect(0, y, 512, 64);
      for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(60,30,10,${0.08 + r() * 0.1})`; g.lineWidth = 1; g.beginPath(); const yy = y + r() * 64; g.moveTo(0, yy); g.bezierCurveTo(170, yy + r() * 6 - 3, 340, yy + r() * 6 - 3, 512, yy); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, y, 512, 2);
      g.fillRect((off) % 512, y, 2, 64); g.fillRect((off + 256) % 512, y, 2, 64);
    }
  });
}
export function tileTex(a = 0xe8e2d4, b = 0xcfc6b2) {
  return canvasTex(256, 256, (g) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = hex((i + j) % 2 ? a : b); g.fillRect(i * 64, j * 64, 64, 64); } g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); } });
}
function wallTex(base, stripe = null) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = hex(base); g.fillRect(0, 0, 256, 256);
    const r = rng(base % 977); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.035})`; g.fillRect(r() * 256, r() * 256, 2, 2); }
    if (stripe != null) { g.fillStyle = hex(stripe); g.fillRect(0, 170, 256, 86); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, 166, 256, 6); }
  });
}

// text sign on a plane
export function sign(lines, w, h, bg = '#2a4a8a', fg = '#ffffff', font = 'bold 120px Inter, Arial', border = '#ffffff') {
  const tex = canvasTex(1024, Math.round(1024 * h / w), (g, W, H) => {
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    if (border) { g.strokeStyle = border; g.lineWidth = 18; g.strokeRect(14, 14, W - 28, H - 28); }
    g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    const L = Array.isArray(lines) ? lines : [lines];
    L.forEach((t, i) => g.fillText(t, W / 2, H * (i + 0.5) / L.length));
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(0xffffff, { map: tex, roughness: 0.6 }));
}

// ---------------- room: floor + 3 walls (open toward +z), sunny windows on one side ----------------
export function room({ w = 12, d = 10, h = 4.2, wall = 0xf2e6cf, stripe = 0x7aa0c0, floor = 'wood', floorColor = 0xb2854f, windowWall = 'left', windows = 3, ceiling = true } = {}) {
  const g = new THREE.Group();
  const fTex = floor === 'wood' ? woodTex(floorColor) : tileTex();
  fTex.wrapS = fTex.wrapT = THREE.RepeatWrapping; fTex.repeat.set(w / 4, d / 4);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(0xffffff, { map: fTex, roughness: 0.55 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const wT = wallTex(wall, stripe); wT.wrapS = THREE.RepeatWrapping; wT.repeat.set(w / 4, 1);
  const wM = mat(0xffffff, { map: wT, roughness: 0.9 });
  const sT = wallTex(wall, stripe); sT.wrapS = THREE.RepeatWrapping; sT.repeat.set(d / 4, 1);
  const sM = mat(0xffffff, { map: sT, roughness: 0.9 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wM); back.position.set(0, h / 2, -d / 2); back.receiveShadow = true; g.add(back);
  const winGlow = [];
  for (const side of [-1, 1]) {
    const isWin = (windowWall === 'left' && side < 0) || (windowWall === 'right' && side > 0);
    const x = side * w / 2;
    if (!isWin) { const wl = new THREE.Mesh(new THREE.PlaneGeometry(d, h), sM); wl.position.set(x, h / 2, 0); wl.rotation.y = -side * Math.PI / 2; wl.receiveShadow = true; g.add(wl); continue; }
    // window wall: built from pieces around window openings, sunlight passes through openings
    const wy0 = 1.1, wy1 = 3.3, ww = d / windows * 0.62;
    const lower = new THREE.Mesh(new THREE.PlaneGeometry(d, wy0), sM.clone()); lower.position.set(x, wy0 / 2, 0); lower.rotation.y = -side * Math.PI / 2; g.add(lower);
    const upper = new THREE.Mesh(new THREE.PlaneGeometry(d, h - wy1), sM.clone()); upper.position.set(x, (wy1 + h) / 2, 0); upper.rotation.y = -side * Math.PI / 2; g.add(upper);
    for (let i = 0; i <= windows; i++) {
      const z0 = -d / 2 + (i === 0 ? 0 : (d / windows) * (i - 0.5) + ww / 2), z1 = i === windows ? d / 2 : -d / 2 + (d / windows) * (i + 0.5) - ww / 2;
      if (z1 - z0 <= 0.01) continue;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, wy1 - wy0), sM); p.position.set(x, (wy0 + wy1) / 2, (z0 + z1) / 2); p.rotation.y = -side * Math.PI / 2; g.add(p);
    }
    for (let i = 0; i < windows; i++) {
      const zc = -d / 2 + (d / windows) * (i + 0.5);
      // bright sky behind glass (emissive), frame + cross bars
      const skyM = new THREE.MeshBasicMaterial({ color: 0xcfeaff, toneMapped: false });
      const skyP = new THREE.Mesh(new THREE.PlaneGeometry(ww, wy1 - wy0), skyM); skyP.position.set(x + side * 0.6, (wy0 + wy1) / 2, zc); skyP.rotation.y = -side * Math.PI / 2; g.add(skyP); winGlow.push(skyM);
      const frM = mat(0xffffff, { roughness: 0.5 });
      for (const [fw, fh, oy, oz] of [[ww + 0.16, 0.12, wy1, 0], [ww + 0.16, 0.16, wy0, 0], [0.1, wy1 - wy0, (wy0 + wy1) / 2, -ww / 2], [0.1, wy1 - wy0, (wy0 + wy1) / 2, ww / 2], [0.06, wy1 - wy0, (wy0 + wy1) / 2, 0], [ww, 0.06, (wy0 + wy1) / 2, 0]]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, fh, fw === 0.1 || fw === 0.06 ? fw : fw), frM);
        b.scale.set(1, 1, 1); b.geometry = new THREE.BoxGeometry(0.14, fh, fw); b.position.set(x, oy, zc + oz); g.add(b);
      }
    }
  }
  // baseboard
  const bb = mat(0x6a4a32); const b1 = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, 0.05), bb); b1.position.set(0, 0.09, -d / 2 + 0.03); g.add(b1);
  if (ceiling) { const c = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(0xf6f0e6, { roughness: 1 })); c.rotation.x = Math.PI / 2; c.position.y = h; g.add(c); }
  // front wall (faces inward): one-sided, so a camera outside the room still sees in
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wM); front.position.set(0, h / 2, d / 2); front.rotation.y = Math.PI; g.add(front);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  winGlow.forEach(m => g.traverse(o => { if (o.material === m) { o.castShadow = false; o.receiveShadow = false; } }));
  g.userData.winGlow = winGlow;
  return g;
}

// ---------------- school furniture ----------------
export function desk(color = 0xc89a62) {
  const g = new THREE.Group(); const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.8), mat(color, { map: woodTex(color, 9), roughness: 0.5 })); top.position.y = 0.92; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const legM = mat(0x5a6470, { metalness: 0.5, roughness: 0.4 });
  for (const sx of [-0.58, 0.58]) for (const sz of [-0.33, 0.33]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), legM); l.position.set(sx, 0.45, sz); l.castShadow = true; g.add(l); }
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.3), mat([0xd94a4a, 0x3a7ad0, 0x3aa05a, 0xf0b030][(color >> 3) % 4])); book.position.set(-0.2, 0.985, 0.05); book.rotation.y = 0.2; g.add(book);
  return g;
}
export function chair(color = 0x3a7ad0) {
  const g = new THREE.Group(); const m = mat(color, { roughness: 0.45 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.07, 0.58), m); seat.position.y = 0.52; seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.06), m); back.position.set(0, 0.85, -0.28); back.castShadow = true; g.add(back);
  const legM = mat(0x5a6470, { metalness: 0.5, roughness: 0.4 });
  for (const sx of [-0.26, 0.26]) for (const sz of [-0.24, 0.24]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.52, 6), legM); l.position.set(sx, 0.26, sz); g.add(l); }
  return g;
}
export function chalkboard(lines = [], w = 5, h = 2) {
  const g = new THREE.Group();
  const tex = canvasTex(1024, Math.round(1024 * h / w), (c, W, H) => {
    c.fillStyle = '#2d4a3a'; c.fillRect(0, 0, W, H); const r = rng(4);
    for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,255,255,${r() * 0.05})`; c.beginPath(); c.ellipse(r() * W, r() * H, 60 + r() * 80, 10 + r() * 20, r(), 0, 7); c.fill(); }
    c.fillStyle = 'rgba(240,240,230,0.9)'; c.font = '56px "Comic Sans MS", Inter, Arial'; c.textBaseline = 'top';
    lines.forEach((t, i) => c.fillText(t, 50, 40 + i * 80));
  });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(0xffffff, { map: tex, roughness: 0.9 })); g.add(board);
  const fr = mat(0xa07a4a); for (const [bw, bh, x, y] of [[w + 0.2, 0.12, 0, h / 2], [w + 0.2, 0.16, 0, -h / 2], [0.12, h, -w / 2, 0], [0.12, h, w / 2, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.08), fr); b.position.set(x, y, 0.02); g.add(b); }
  return g;
}
export function wallClock() {
  const g = new THREE.Group(); const tex = canvasTex(256, 256, (c) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(128, 128, 120, 0, 7); c.fill(); c.lineWidth = 14; c.strokeStyle = '#222'; c.stroke(); c.lineWidth = 8; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; c.beginPath(); c.moveTo(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); c.lineTo(128 + Math.cos(a) * 108, 128 + Math.sin(a) * 108); c.stroke(); } c.lineWidth = 10; c.beginPath(); c.moveTo(128, 128); c.lineTo(128, 60); c.moveTo(128, 128); c.lineTo(180, 140); c.stroke(); });
  g.add(new THREE.Mesh(new THREE.CircleGeometry(0.4, 24), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }))); return g;
}
export function poster(color = 0xf0b030, title = 'READ!', w = 1.0, h = 1.3) { return sign([title], w, h, hex(color), '#ffffff', 'bold 150px Inter, Arial', null); }
export function longTable(len = 5) {
  const g = new THREE.Group(); const top = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 1.2), mat(0xe8e2d6, { roughness: 0.35 })); top.position.y = 0.9; top.castShadow = true; top.receiveShadow = true; g.add(top);
  const legM = mat(0x6a7480, { metalness: 0.5, roughness: 0.4 });
  for (const sx of [-len / 2 + 0.3, len / 2 - 0.3]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 1.0), legM); l.position.set(sx, 0.45, 0); g.add(l); }
  for (const sz of [-0.95, 0.95]) { const bench = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.42), mat(0x3a8ac8, { roughness: 0.45 })); bench.position.set(0, 0.5, sz); bench.castShadow = true; g.add(bench); for (const sx of [-len / 2 + 0.3, len / 2 - 0.3]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.3), legM); l.position.set(sx, 0.25, sz); g.add(l); } }
  return g;
}
export function tray(seed = 1) {
  const r = rng(seed); const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.48), mat(0xd86a3a, { roughness: 0.4 })); g.add(t);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.03, 16), mat(0xffffff)); plate.position.set(-0.14, 0.035, 0); g.add(plate);
  const food = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat([0xe0b060, 0x6aa040, 0xc04a30][r() * 3 | 0])); food.scale.y = 0.5; food.position.set(-0.14, 0.07, 0); g.add(food);
  const milk = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.1), mat(0xffffff)); milk.position.set(0.2, 0.1, -0.08); g.add(milk);
  const apple = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(0xd03030)); apple.position.set(0.2, 0.08, 0.1); g.add(apple);
  return g;
}
export function cookie() { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 18), mat(0xc88a4a, { roughness: 0.9 })); g.add(c); for (let i = 0; i < 6; i++) { const ch = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), mat(0x3a2010)); const a = i * 1.1; ch.position.set(Math.cos(a) * 0.06, 0.017, Math.sin(a) * 0.06); g.add(ch); } return g; }
export function locker(color = 0x3a6ab0) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.0, 0.5), mat(color, { metalness: 0.35, roughness: 0.4 })); b.position.y = 1.0; b.castShadow = true; g.add(b); for (let i = 0; i < 4; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.02), mat(0x1a2a3a)); v.position.set(0, 1.7 - i * 0.06, 0.26); g.add(v); } const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.04), mat(0xcccccc, { metalness: 0.8 })); h.position.set(0.2, 1.0, 0.27); g.add(h); return g; }

// ---------------- home furniture ----------------
export function bed(blanket = 0x5a8ad0) {
  const g = new THREE.Group(); const fr = mat(0x8a5a3a, { map: woodTex(0x8a5a3a, 12) });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 2.6), fr); base.position.y = 0.3; base.castShadow = true; g.add(base);
  const mat_ = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.25, 2.5), mat(0xf4f0ea)); mat_.position.y = 0.6; g.add(mat_);
  const bl = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.12, 1.7), mat(blanket, { roughness: 0.95 })); bl.position.set(0, 0.76, 0.4); bl.castShadow = true; g.add(bl);
  const pil = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 10), mat(0xffffff, { roughness: 1 })); pil.scale.set(1.3, 0.35, 0.7); pil.position.set(0, 0.82, -0.9); g.add(pil);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.12), fr); head.position.set(0, 0.75, -1.3); head.castShadow = true; g.add(head);
  return g;
}
export function nightLamp() { const g = new THREE.Group(); const tbl = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.5), mat(0x9a6a44)); tbl.position.y = 0.3; g.add(tbl); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.35, 8), mat(0x444444)); st.position.y = 0.78; g.add(st); const shadeM = mat(0xfff0c8, { emissive: 0xffc870, emissiveIntensity: 0.0, side: THREE.DoubleSide }); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 0.26, 16, 1, true), shadeM); sh.position.y = 1.02; g.add(sh); const light = new THREE.PointLight(0xffc880, 0, 6, 1.6); light.position.y = 1.0; g.add(light); g.userData = { shadeM, light }; return g; }
export function rug(color = 0xd0605a) { const tex = canvasTex(256, 256, (c) => { c.fillStyle = hex(color); c.fillRect(0, 0, 256, 256); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 10; c.strokeRect(20, 20, 216, 216); c.strokeRect(50, 50, 156, 156); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), mat(0xffffff, { map: tex, roughness: 1 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.01; m.receiveShadow = true; return m; }
export function shelf() { const g = new THREE.Group(); const m = mat(0x8a5a3a); const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.4), m); box.position.y = 0.9; box.castShadow = true; g.add(box); const r = rng(8); for (let s = 0; s < 3; s++) for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34 + r() * 0.1, 0.3), mat([0xd94a4a, 0x3a7ad0, 0x3aa05a, 0xf0b030, 0x8a4ab0][r() * 5 | 0])); b.position.set(-0.45 + i * 0.15, 0.35 + s * 0.55, 0.06); g.add(b); } return g; }
export function counter(len = 3) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(len, 0.9, 0.7), mat(0xf0ece4)); b.position.y = 0.45; b.castShadow = true; g.add(b); const top = new THREE.Mesh(new THREE.BoxGeometry(len + 0.05, 0.06, 0.75), mat(0x5a5a5e, { roughness: 0.3 })); top.position.y = 0.93; g.add(top); for (let i = 0; i < Math.floor(len / 0.7); i++) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.03), mat(0xaaaaaa, { metalness: 0.8 })); h.position.set(-len / 2 + 0.35 + i * 0.7, 0.75, 0.36); g.add(h); } return g; }
export function fridge() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.0, 0.75), mat(0xe8eef2, { roughness: 0.3, metalness: 0.2 })); b.position.y = 1.0; b.castShadow = true; g.add(b); const line = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.02), mat(0x999999)); line.position.set(0, 1.3, 0.38); g.add(line); const h = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.05), mat(0x999999, { metalness: 0.8 })); h.position.set(0.36, 1.6, 0.4); g.add(h); for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.22), mat([0xffd040, 0x6ac0ff, 0xff8aa0][i])); p.position.set(-0.2 + i * 0.16, 1.0 + (i % 2) * 0.15, 0.381); g.add(p); } return g; }

// ---------------- town props ----------------
export function busStop() {
  const g = new THREE.Group(); const pm = mat(0x3a4a5a, { metalness: 0.4, roughness: 0.4 });
  for (const sx of [-1.3, 1.3]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, 0.1), pm); p.position.set(sx, 1.25, -0.5); p.castShadow = true; g.add(p); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1.4), mat(0x2a7ad0)); roof.position.set(0, 2.5, 0); roof.castShadow = true; g.add(roof);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), new THREE.MeshStandardMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.25, roughness: 0.1 })); glass.position.set(0, 1.4, -0.55); g.add(glass);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.45), mat(0x9a6a40)); bench.position.set(0, 0.5, -0.25); bench.castShadow = true; g.add(bench);
  const s = sign('BUS', 0.6, 0.6, '#2a7ad0', '#fff', 'bold 300px Inter, Arial'); s.position.set(1.3, 2.9, -0.5); g.add(s);
  return g;
}
export function schoolBuilding(name = 'MAPLE HILL SCHOOL') {
  const g = new THREE.Group();
  const brick = canvasTex(512, 512, (c) => { c.fillStyle = '#b4583e'; c.fillRect(0, 0, 512, 512); for (let y = 0; y < 512; y += 24) for (let x = (y / 24) % 2 ? -24 : 0; x < 512; x += 48) { c.fillStyle = `rgba(${150 + Math.random() * 40 | 0},${70 + Math.random() * 25 | 0},${50 + Math.random() * 20 | 0},1)`; c.fillRect(x + 2, y + 2, 44, 20); } });
  brick.wrapS = brick.wrapT = THREE.RepeatWrapping; brick.repeat.set(4, 2);
  const bM = mat(0xffffff, { map: brick, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(22, 7, 8), bM); body.position.y = 3.5; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(22.6, 0.4, 8.6), mat(0x3a3a40)); roof.position.y = 7.2; g.add(roof);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(5, 9.5, 8.4), bM); tower.position.set(0, 4.75, 0.2); tower.castShadow = true; g.add(tower);
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(4.0, 2.4, 4), mat(0x2a4a6a, { flatShading: true })); towerRoof.rotation.y = Math.PI / 4; towerRoof.position.set(0, 10.7, 0.2); g.add(towerRoof);
  const winM = mat(0x88b8d8, { roughness: 0.15, metalness: 0.3, emissive: 0x335577, emissiveIntensity: 0.2 });
  for (let row = 0; row < 2; row++) for (let i = 0; i < 8; i++) { const x = -10 + i * 2.6 + (i >= 4 ? 2.3 : 0) - (i < 4 ? 0 : 0); if (Math.abs(x) < 3) continue; const wn = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 0.1), winM); wn.position.set(x, 2.2 + row * 2.8, 4.02); g.add(wn); const sill = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.25), mat(0xeeeeee)); sill.position.set(x, 1.3 + row * 2.8, 4.1); g.add(sill); }
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 0.12), mat(0x2a5a8a, { roughness: 0.4 })); door.position.set(0, 1.3, 4.42); g.add(door);
  const dg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.4), winM); for (const sx of [-0.55, 0.55]) { const d2 = dg.clone(); d2.position.set(sx, 1.6, 4.49); g.add(d2); }
  const s = sign(name, 4.6, 0.8, '#f4ecd8', '#2a3a5a', 'bold 110px Inter, Arial', '#2a3a5a'); s.position.set(0, 3.5, 4.43); g.add(s);
  const clock = wallClock(); clock.position.set(0, 7.6, 4.43); clock.scale.setScalar(1.8); g.add(clock);
  const steps = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 1.2), mat(0xbdb6aa)); steps.position.set(0, 0.15, 5); steps.receiveShadow = true; g.add(steps);
  // flag pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 8, 8), mat(0xdddddd, { metalness: 0.7 })); pole.position.set(-8, 4, 7); g.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), mat(0xd94a4a, { side: THREE.DoubleSide })); flag.position.set(-7.2, 7.3, 7); g.add(flag); g.userData.flag = flag;
  return g;
}
export function fence(len = 10) { const g = new THREE.Group(); const m = mat(0xf4f0e8); for (let x = -len / 2; x <= len / 2; x += 0.5) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.06), m); p.position.set(x, 0.45, 0); p.castShadow = true; g.add(p); } for (const y of [0.3, 0.7]) { const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.05), m); r.position.set(0, y, -0.04); g.add(r); } return g; }
export function flowerBed(len = 3, seed = 2) { const r = rng(seed); const g = new THREE.Group(); const soil = new THREE.Mesh(new THREE.BoxGeometry(len, 0.2, 0.7), mat(0x5a3a22)); soil.position.y = 0.1; g.add(soil); for (let i = 0; i < len * 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat([0xff6a8a, 0xffd040, 0xffffff, 0xb070ff, 0xff8a40][r() * 5 | 0], { roughness: 0.6 })); f.position.set((r() - 0.5) * len * 0.95, 0.28 + r() * 0.12, (r() - 0.5) * 0.55); g.add(f); const st = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), mat(0x3a8a3a)); st.position.set(f.position.x, 0.2, f.position.z); st.scale.y = 0.6; g.add(st); } return g; }
export function streetLamp() { const g = new THREE.Group(); const m = mat(0x2a3038, { metalness: 0.5, roughness: 0.4 }); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 4, 8), m); p.position.y = 2; p.castShadow = true; g.add(p); const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.07, 0.07), m); arm.position.set(0.35, 3.95, 0); g.add(arm); const bulbM = mat(0xfff4d0, { emissive: 0xffd890, emissiveIntensity: 0 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), bulbM); b.position.set(0.7, 3.82, 0); g.add(b); g.userData.bulbM = bulbM; return g; }

// ---------------- energy battery HUD sprite ----------------
const batCache = new Map();
function batteryTexture(pct, dead) {
  const key = dead ? 'dead' : pct; if (batCache.has(key)) return batCache.get(key);
  const t = canvasTex(320, 150, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const col = dead ? '#6a6a6a' : pct > 60 ? '#38d66b' : pct > 25 ? '#ffc93a' : '#ff4a3d';
    // body
    const x = 18, y = 22, w = 250, h = 106, r = 22;
    const rr = (X, Y, Wd, Hd, R) => { g.beginPath(); g.moveTo(X + R, Y); g.arcTo(X + Wd, Y, X + Wd, Y + Hd, R); g.arcTo(X + Wd, Y + Hd, X, Y + Hd, R); g.arcTo(X, Y + Hd, X, Y, R); g.arcTo(X, Y, X + Wd, Y, R); g.closePath(); };
    g.fillStyle = 'rgba(20,24,30,0.75)'; rr(x, y, w, h, r); g.fill();
    g.lineWidth = 9; g.strokeStyle = '#ffffff'; rr(x, y, w, h, r); g.stroke();
    g.fillStyle = '#ffffff'; rr(x + w + 4, y + 32, 22, 42, 7); g.fill();
    const fw = Math.max(0, (w - 24) * (dead ? 0 : pct / 100));
    if (fw > 2) { g.fillStyle = col; rr(x + 12, y + 12, Math.max(fw, 14), h - 24, 12); g.fill(); g.fillStyle = 'rgba(255,255,255,0.28)'; rr(x + 14, y + 14, Math.max(fw - 4, 10), (h - 24) * 0.35, 9); g.fill(); }
    g.font = '900 62px Inter, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,0.85)'; const label = dead ? '0%' : `${pct}%`;
    g.strokeText(label, x + w / 2, y + h / 2 + 3); g.fillStyle = '#ffffff'; g.fillText(label, x + w / 2, y + h / 2 + 3);
  });
  batCache.set(key, t); return t;
}
export function makeBattery() {
  const m = new THREE.SpriteMaterial({ map: batteryTexture(100), transparent: true, depthWrite: false, toneMapped: false, fog: false });
  const s = new THREE.Sprite(m); s.scale.set(1.15, 0.54, 1); s.position.y = 3.35; s.renderOrder = 5;
  s.userData.set = (pct, dead = false, blink = 1) => { pct = Math.max(0, Math.min(100, Math.round(pct))); m.map = batteryTexture(pct, dead); m.opacity = blink; };
  return s;
}

// ---------------- glowing energy particles flowing along curves ----------------
const glowTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(160,255,190,0.9)'); gr.addColorStop(1, 'rgba(80,255,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
export function energyStream(count = 40, color = 0x7dffa8) {
  const g = new THREE.Group(); const m = new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const parts = []; for (let i = 0; i < count; i++) { const s = new THREE.Sprite(m); s.scale.setScalar(0.18); g.add(s); parts.push(s); }
  // update(t, from, to, amount 0..1): particles travel from 'from' to 'to' along an arc
  g.userData.update = (t, from, to, amt = 1, arc = 0.8) => {
    parts.forEach((s, i) => {
      const k = ((t * 0.9 + i / count) % 1); s.visible = amt > 0 && (i / count) < amt;
      const p = from.clone().lerp(to, k); p.y += Math.sin(k * Math.PI) * arc; p.x += Math.sin(i * 7.1 + t * 3) * 0.06; p.z += Math.cos(i * 5.3 + t * 3) * 0.06;
      s.position.copy(p); s.scale.setScalar(0.12 + 0.1 * Math.sin(k * Math.PI));
    });
  };
  return g;
}
