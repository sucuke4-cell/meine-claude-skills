// ===== Detailed blocky avatars ("block style"): rounded-edge boxes with painted clothing on every face,
// expressive face decals, and lots of 3D accessories (hats, crowns, chains, glasses, hair, backpacks...). =====
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const hex = c => `#${(c >>> 0).toString(16).padStart(6, '0')}`;
function tex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, ...o });
const GOLD = () => M(0xe8b830, { metalness: 0.85, roughness: 0.28 });
function shade(c, k) { const r = Math.min(255, ((c >> 16) & 255) * k) | 0, g = Math.min(255, ((c >> 8) & 255) * k) | 0, b = Math.min(255, (c & 255) * k) | 0; return (r << 16) | (g << 8) | b; }
function rbox(w, h, d, r = 0.08) { return new RoundedBoxGeometry(w, h, d, 4, r); }
// fabric noise + seams so flat colours look like cloth
function fabric(g, w, h, base, seam = true) { g.fillStyle = hex(base); g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } if (seam) { g.strokeStyle = 'rgba(0,0,0,0.18)'; g.setLineDash([6, 5]); g.lineWidth = 2; g.strokeRect(6, 6, w - 12, h - 12); g.setLineDash([]); } }

// ---------------- clothing face painters (front/back/side of torso, arms, legs) ----------------
const SHIRTS = {
  // dark suit: lapels, white shirt, tie, buttons, pocket square
  suit: (o) => ({ front: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color); g.fillStyle = '#f4f2ee'; g.beginPath(); g.moveTo(w * 0.32, 0); g.lineTo(w * 0.5, h * 0.55); g.lineTo(w * 0.68, 0); g.fill();
      g.fillStyle = hex(o.tie ?? 0xe8b830); g.beginPath(); g.moveTo(w * 0.46, h * 0.06); g.lineTo(w * 0.54, h * 0.06); g.lineTo(w * 0.56, h * 0.42); g.lineTo(w * 0.5, h * 0.5); g.lineTo(w * 0.44, h * 0.42); g.fill(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(w * 0.47, h * 0.1, w * 0.06, 3);
      g.strokeStyle = hex(shade(o.color, 0.6)); g.lineWidth = 5; g.beginPath(); g.moveTo(w * 0.3, 0); g.lineTo(w * 0.46, h * 0.6); g.moveTo(w * 0.7, 0); g.lineTo(w * 0.54, h * 0.6); g.stroke();
      g.fillStyle = hex(o.button ?? 0xd8b040); for (const y of [0.68, 0.82]) { g.beginPath(); g.arc(w * 0.5, h * y, 6, 0, 7); g.fill(); }
      g.fillStyle = hex(o.tie ?? 0xe8b830); g.beginPath(); g.moveTo(w * 0.72, h * 0.28); g.lineTo(w * 0.86, h * 0.28); g.lineTo(w * 0.8, h * 0.36); g.fill(); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(w * 0.7, h * 0.36, w * 0.18, 3);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(w * 0.14, h * 0.7, w * 0.2, 3); g.fillRect(w * 0.66, h * 0.7, w * 0.2, 3); }),
    back: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h * 0.5); g.lineTo(w / 2, h); g.stroke(); }) }),
  // white tunic with a jewelled golden collar (pharaoh)
  tunic: (o) => { const collar = (g, w, h) => { const cols = ['#e8b830', '#1a9a8a', '#e8b830', '#c0392b', '#e8b830', '#2a5aa8']; cols.forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 9; g.beginPath(); g.arc(w / 2, -h * 0.05, w * 0.26 + i * 9, 0.05 * Math.PI, 0.95 * Math.PI); g.stroke(); }); g.fillStyle = '#1a9a8a'; for (let i = 0; i < 11; i++) { const a = 0.12 * Math.PI + i * 0.076 * Math.PI; g.beginPath(); g.arc(w / 2 + Math.cos(a) * w * 0.5, -h * 0.05 + Math.sin(a) * w * 0.5, 6, 0, 7); g.fill(); } };
    return { front: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color, false); g.fillStyle = 'rgba(0,0,0,0.06)'; for (let x = 20; x < w; x += 26) g.fillRect(x, h * 0.4, 3, h * 0.6); collar(g, w, h); g.fillStyle = '#e8b830'; g.fillRect(0, h * 0.8, w, 12); g.fillStyle = '#1a9a8a'; for (let x = 8; x < w; x += 24) g.fillRect(x, h * 0.82, 10, 8); }),
      back: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color, false); collar(g, w, h); }) }; },
  // olive field jacket with pockets, zipper, straps (survivor)
  jacket: (o) => ({ front: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(w * 0.49, 0, 4, h); g.fillStyle = '#b8b0a0'; for (let y = 6; y < h; y += 10) g.fillRect(w * 0.485, y, 8, 3);
      for (const x of [0.1, 0.58]) { g.fillStyle = hex(shade(o.color, 0.82)); g.fillRect(w * x, h * 0.52, w * 0.32, h * 0.3); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; g.strokeRect(w * x, h * 0.52, w * 0.32, h * 0.3); g.fillRect(w * x, h * 0.52, w * 0.32, 10); }
      if (o.straps) { g.fillStyle = hex(o.straps); g.fillRect(w * 0.18, 0, w * 0.1, h); g.fillRect(w * 0.72, 0, w * 0.1, h); g.fillStyle = '#c8c8c8'; g.fillRect(w * 0.17, h * 0.3, w * 0.12, 10); g.fillRect(w * 0.71, h * 0.3, w * 0.12, 10); } }),
    back: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color); }) }),
  // navy uniform: double row of gold buttons, belt, badge (conductor)
  uniform: (o) => ({ front: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color); g.strokeStyle = hex(o.trim ?? 0xe8b830); g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8);
      g.fillStyle = '#e8b830'; for (let i = 0; i < 4; i++) for (const x of [0.36, 0.64]) { g.beginPath(); g.arc(w * x, h * (0.18 + i * 0.16), 8, 0, 7); g.fill(); g.fillStyle = '#a07818'; g.beginPath(); g.arc(w * x, h * (0.18 + i * 0.16), 3, 0, 7); g.fill(); g.fillStyle = '#e8b830'; }
      g.fillStyle = '#1a1a1a'; g.fillRect(0, h * 0.8, w, 20); g.fillStyle = '#e8b830'; g.fillRect(w * 0.44, h * 0.79, w * 0.12, 24); g.fillStyle = '#1a1a1a'; g.fillRect(w * 0.47, h * 0.82, w * 0.06, 12);
      g.fillStyle = '#e8b830'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 7 : 16; g.lineTo(w * 0.8 + Math.cos(a) * r, h * 0.22 + Math.sin(a) * r); } g.fill(); }),
    back: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color); g.fillStyle = '#1a1a1a'; g.fillRect(0, h * 0.8, w, 20); }) }),
  // khaki explorer shirt: pockets with flaps, buttons, rolled-sleeve look
  safari: (o) => ({ front: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color); g.fillStyle = hex(shade(o.color, 0.85)); g.beginPath(); g.moveTo(w * 0.36, 0); g.lineTo(w * 0.5, h * 0.2); g.lineTo(w * 0.64, 0); g.fill(); g.fillStyle = '#5a4020'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w * 0.5, h * (0.26 + i * 0.13), 5, 0, 7); g.fill(); }
      for (const x of [0.14, 0.62]) { g.fillStyle = hex(shade(o.color, 0.88)); g.fillRect(w * x, h * 0.22, w * 0.24, h * 0.22); g.fillStyle = hex(shade(o.color, 0.75)); g.fillRect(w * x, h * 0.22, w * 0.24, h * 0.07); g.fillStyle = '#5a4020'; g.beginPath(); g.arc(w * (x + 0.12), h * 0.27, 4, 0, 7); g.fill(); }
      g.fillStyle = '#6a4a2a'; g.fillRect(0, h * 0.84, w, 18); g.fillStyle = '#c8a050'; g.fillRect(w * 0.45, h * 0.835, w * 0.1, 20); }),
    back: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color); g.fillStyle = '#6a4a2a'; g.fillRect(0, h * 0.84, w, 18); }) }),
  // long coat with fur collar shading, belt and big buttons (heiress)
  coat: (o) => ({ front: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color, false); g.strokeStyle = hex(shade(o.color, 0.6)); g.lineWidth = 4; g.beginPath(); g.moveTo(w * 0.5, h * 0.12); g.lineTo(w * 0.5, h); g.stroke();
      g.fillStyle = hex(shade(o.color, 0.75)); g.fillRect(0, h * 0.6, w, 22); g.fillStyle = '#e8e8f0'; g.fillRect(w * 0.42, h * 0.595, w * 0.16, 26); g.fillStyle = hex(shade(o.color, 0.75)); g.fillRect(w * 0.46, h * 0.615, w * 0.08, 14);
      g.fillStyle = '#d8d8e8'; for (const y of [0.3, 0.45, 0.78]) for (const x of [0.4, 0.6]) { g.beginPath(); g.arc(w * x, h * y, 7, 0, 7); g.fill(); } }),
    back: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color, false); g.fillStyle = hex(shade(o.color, 0.75)); g.fillRect(0, h * 0.6, w, 22); }) }),
  // orange hazmat suit with reflective stripes and a chest badge
  hazmat: (o) => ({ front: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color); g.fillStyle = '#d8dde4'; g.fillRect(0, h * 0.55, w, 18); g.fillRect(0, h * 0.75, w, 18); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(0, h * 0.555, w, 4); g.fillRect(0, h * 0.755, w, 4);
      g.fillStyle = '#222'; g.fillRect(w * 0.49, 0, 5, h * 0.55); g.fillStyle = '#ffd84a'; g.beginPath(); g.moveTo(w * 0.72, h * 0.16); g.lineTo(w * 0.86, h * 0.4); g.lineTo(w * 0.58, h * 0.4); g.fill(); g.fillStyle = '#222'; g.font = 'bold 30px Arial'; g.textAlign = 'center'; g.fillText('!', w * 0.72, h * 0.37); }),
    back: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color); g.fillStyle = '#d8dde4'; g.fillRect(0, h * 0.55, w, 18); g.fillRect(0, h * 0.75, w, 18); g.fillStyle = '#222'; g.font = 'bold 40px Arial'; g.textAlign = 'center'; g.fillText('RESCUE', w / 2, h * 0.35); }) }),
  // quilted puffer jacket with white trim (adventure kid)
  puffer: (o) => ({ front: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color, false); for (let y = 30; y < h; y += 42) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, y, w, 5); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, y - 16, w, 10); }
      g.fillStyle = '#f4f4f4'; g.fillRect(w * 0.47, 0, w * 0.06, h); g.fillStyle = '#aaa'; for (let y = 6; y < h; y += 12) g.fillRect(w * 0.49, y, w * 0.02, 5); g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, w, 16); g.fillRect(0, h - 16, w, 16); }),
    back: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color, false); for (let y = 30; y < h; y += 42) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, y, w, 5); } g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, w, 16); g.fillRect(0, h - 16, w, 16); }) }),
  // simple tee / hoodie with stripe
  tee: (o) => ({ front: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color); g.fillStyle = hex(shade(o.color, 0.8)); g.beginPath(); g.arc(w / 2, 0, w * 0.18, 0, Math.PI); g.fill(); if (o.stripe != null) { g.fillStyle = hex(o.stripe); g.fillRect(0, h * 0.45, w, 26); } if (o.logo) { g.fillStyle = hex(o.logo); g.beginPath(); g.arc(w / 2, h * 0.3, 22, 0, 7); g.fill(); } }),
    back: tex(256, 256, (g, w, h) => { fabric(g, w, h, o.color); if (o.stripe != null) { g.fillStyle = hex(o.stripe); g.fillRect(0, h * 0.45, w, 26); } }) }),
};
function sleeveTex(o) { return tex(128, 256, (g, w, h) => { fabric(g, w, h, o.sleeve ?? o.color); if (o.cuff != null) { g.fillStyle = hex(o.cuff); g.fillRect(0, h * 0.62, w, 14); } g.fillStyle = hex(o.skin); g.fillRect(0, h * 0.68, w, h * 0.32); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, h * 0.68, w, 4); if (o.gloves != null) { g.fillStyle = hex(o.gloves); g.fillRect(0, h * 0.68, w, h * 0.32); } }); }
function legTex(o) { return tex(128, 256, (g, w, h) => { fabric(g, w, h, o.pants); if (o.pantsStripe != null) { g.fillStyle = hex(o.pantsStripe); g.fillRect(w * 0.82, 0, w * 0.1, h * 0.8); } g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(w * 0.15, h * 0.35, w * 0.3, 3); g.fillStyle = hex(o.shoes ?? 0x2a2a2a); g.fillRect(0, h * 0.8, w, h * 0.2); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, h * 0.8, w, 4); if (o.boots) { g.fillStyle = hex(o.shoes ?? 0x4a3020); g.fillRect(0, h * 0.62, w, h * 0.38); g.fillStyle = 'rgba(0,0,0,0.3)'; for (let y = h * 0.66; y < h * 0.8; y += 10) g.fillRect(w * 0.3, y, w * 0.4, 2); } }); }

// ---------------- faces ----------------
const faceCache = new Map();
function faceTex(skin, expr, o) {
  const key = [skin, expr, o.beard, o.mustache, o.brows, o.lashes, o.freckles, o.blush].join('|'); if (faceCache.has(key)) return faceCache.get(key);
  const t = tex(256, 256, (g, w, h) => {
    g.fillStyle = hex(skin); g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(0, h * 0.86, w, h * 0.14);
    const ink = '#1a1414'; g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = 'round';
    const eyeY = 110, L = 86, R = 170;
    const eye = (x, open = 1) => { if (open < 0.3) { g.lineWidth = 7; g.beginPath(); g.arc(x, eyeY + 4, 14, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); return; } g.beginPath(); g.ellipse(x, eyeY, 11, 15 * open, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 4, eyeY - 6, 4, 0, 7); g.fill(); g.fillStyle = ink; if (o.lashes) { g.lineWidth = 3; g.beginPath(); g.moveTo(x - 12, eyeY - 10); g.lineTo(x - 18, eyeY - 16); g.stroke(); } };
    const brow = (inner, outer) => { g.lineWidth = 8; g.beginPath(); g.moveTo(L - 22, outer); g.lineTo(L + 14, inner); g.moveTo(R + 22, outer); g.lineTo(R - 14, inner); g.stroke(); };
    switch (expr) {
      case 'angry': eye(L, 0.75); eye(R, 0.75); brow(92, 80); g.lineWidth = 7; g.beginPath(); g.moveTo(104, 182); g.quadraticCurveTo(128, 172, 152, 182); g.stroke(); break;
      case 'smug': eye(L, 0.6); eye(R, 0.6); brow(88, 84); g.lineWidth = 7; g.beginPath(); g.moveTo(102, 178); g.quadraticCurveTo(140, 192, 160, 170); g.stroke(); break;
      case 'surprise': eye(L, 1.2); eye(R, 1.2); brow(78, 82); g.beginPath(); g.ellipse(128, 182, 12, 16, 0, 0, 7); g.fill(); break;
      case 'sad': eye(L); eye(R); brow(82, 92); g.lineWidth = 7; g.beginPath(); g.arc(128, 196, 22, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); break;
      case 'grin': eye(L, 0.2); eye(R, 0.2); brow(84, 84); g.beginPath(); g.moveTo(96, 166); g.quadraticCurveTo(128, 214, 160, 166); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(104, 168, 48, 8); break;
      case 'stern': eye(L, 0.8); eye(R, 0.8); brow(90, 86); g.lineWidth = 7; g.beginPath(); g.moveTo(108, 180); g.lineTo(148, 180); g.stroke(); break;
      default: eye(L); eye(R); if (o.brows !== false) brow(86, 86); g.lineWidth = 7; g.beginPath(); g.arc(128, 160, 24, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
    }
    if (o.freckles) { g.fillStyle = 'rgba(140,70,40,0.5)'; for (const [x, y] of [[70, 140], [80, 146], [62, 148], [186, 140], [176, 146], [194, 148]]) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); } }
    if (o.blush) { g.fillStyle = 'rgba(255,110,110,0.3)'; g.beginPath(); g.ellipse(64, 150, 18, 10, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(192, 150, 18, 10, 0, 0, 7); g.fill(); }
    if (o.mustache) { g.fillStyle = hex(o.mustache); g.beginPath(); g.moveTo(128, 154); g.bezierCurveTo(100, 142, 80, 160, 92, 168); g.bezierCurveTo(104, 164, 118, 160, 128, 162); g.bezierCurveTo(138, 160, 152, 164, 164, 168); g.bezierCurveTo(176, 160, 156, 142, 128, 154); g.fill(); }
    if (o.beard) { g.fillStyle = hex(o.beard); g.beginPath(); g.moveTo(70, 150); g.quadraticCurveTo(76, 236, 128, 240); g.quadraticCurveTo(180, 236, 186, 150); g.quadraticCurveTo(170, 200, 128, 204); g.quadraticCurveTo(86, 200, 70, 150); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 40; i++) g.fillRect(80 + Math.random() * 96, 170 + Math.random() * 60, 2, 6); }
  });
  faceCache.set(key, t); return t;
}

// ---------------- the avatar ----------------
// o: { skin, shirt:'suit'|'tunic'|'jacket'|'uniform'|'tee', color, sleeve, cuff, tie, pants, pantsStripe, shoes, boots, gloves,
//      face:{...}, hair:{style,color}, hat:'tophat'|'cap'|'conductor'|'nemes'|'beanie'|'bandana'|null, hatColor, glasses:'round'|'square'|null,
//      chain:bool, backpack:color|null, scarf:color|null, scale }
export function makeBlockAvatar(o) {
  const g = new THREE.Group(); const P = { o }; g.userData.P = P; g.scale.setScalar(o.scale ?? 0.6);
  const skinM = M(o.skin, { roughness: 0.55 });
  const shirt = SHIRTS[o.shirt || 'tee'](o);
  const plain = M(o.color);
  // torso (2 x 2 x 1) — material order: +x, -x, +y, -y, +z(front), -z(back)
  const torsoMats = [M(0xffffff, { map: sleeveTexSide(o) }), M(0xffffff, { map: sleeveTexSide(o) }), M(o.color), M(o.color), M(0xffffff, { map: shirt.front }), M(0xffffff, { map: shirt.back })];
  const hip = new THREE.Group(); hip.position.y = 2.0; g.add(hip); P.hip = hip;
  const body = new THREE.Group(); hip.add(body); P.body = body;
  const torso = new THREE.Mesh(rbox(2, 2, 1, 0.1), torsoMats); torso.position.y = 1.0; torso.castShadow = torso.receiveShadow = true; body.add(torso);
  // arms
  const armM = M(0xffffff, { map: sleeveTex(o) }); const armMats = [armM, armM, M(o.sleeve ?? o.color), M(o.gloves ?? o.skin), armM, armM];
  for (const s of [-1, 1]) { const pivot = new THREE.Group(); pivot.position.set(1.5 * s, 1.85, 0); body.add(pivot); const arm = new THREE.Mesh(rbox(0.96, 2, 0.96, 0.12), armMats); arm.position.y = -0.85; arm.castShadow = true; pivot.add(arm); P[s < 0 ? 'armL' : 'armR'] = pivot; }
  // legs
  const legM = M(0xffffff, { map: legTex(o) }); const legMats = [legM, legM, M(o.pants), M(o.shoes ?? 0x2a2a2a), legM, legM];
  for (const s of [-1, 1]) { const pivot = new THREE.Group(); pivot.position.set(0.5 * s, 0, 0); hip.add(pivot); const leg = new THREE.Mesh(rbox(0.98, 2, 0.98, 0.1), legMats); leg.position.y = -1.0; leg.castShadow = true; pivot.add(leg); P[s < 0 ? 'legL' : 'legR'] = pivot; }
  // head (rounded block) with face on the front material
  const head = new THREE.Group(); head.position.y = 2.6; body.add(head); P.head = head;
  P.faceM = M(0xffffff, { map: faceTex(o.skin, 'smile', o.face || {}), roughness: 0.55 });
  const headMesh = new THREE.Mesh(rbox(1.22, 1.22, 1.18, 0.3), [skinM, skinM, skinM, skinM, P.faceM, skinM]); headMesh.castShadow = true; head.add(headMesh);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.3, 16), skinM); neck.position.y = -0.62; head.add(neck);
  addHair(head, o); addHat(head, o); addGlasses(head, o);
  if (o.chain) addChain(body);
  if (o.backpack != null) addBackpack(body, o.backpack);
  if (o.scarf != null) addScarf(body, o.scarf);
  if (o.belt) addBelt(body, o.belt);
  if (o.pearls) { const pm = M(0xf8f4ec, { roughness: 0.15, metalness: 0.1 }); for (let i = 0; i <= 20; i++) { const u = i / 20; const bead = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), pm); bead.position.set((u - 0.5) * 1.1, 1.98 - Math.sin(u * Math.PI) * 0.62, 0.53); body.add(bead); } }
  if (o.fur != null) { const fm = M(o.fur, { roughness: 1 }); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), fm); puff.position.set(Math.cos(a) * 0.82, 2.0 + Math.sin(i * 1.7) * 0.05, Math.sin(a) * 0.46); body.add(puff); } }
  if (o.satchel != null) { const sm = M(o.satchel, { roughness: 0.8 }); const strap = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.9, 0.06), sm); strap.position.set(0, 1.05, 0.53); strap.rotation.z = 0.72; body.add(strap); const bag = new THREE.Mesh(rbox(0.8, 0.62, 0.3, 0.08), sm); bag.position.set(-1.05, 0.2, 0.35); body.add(bag); const flap = new THREE.Mesh(rbox(0.82, 0.3, 0.06, 0.04), M(shade(o.satchel, 0.8))); flap.position.set(-1.05, 0.38, 0.52); body.add(flap); }
  if (o.prop) addProp(P.armR, o.prop);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
}
function sleeveTexSide(o) { return tex(128, 256, (g, w, h) => fabric(g, w, h, o.color)); }

function addHair(head, o) {
  const hcfg = o.hair; if (!hcfg) return; const m = M(hcfg.color, { roughness: 0.8 });
  const add = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); k.rotation.set(rx, ry, rz); k.castShadow = true; head.add(k); return k; };
  if (hcfg.style === 'curly') { for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2, rr = 0.48 + (i % 3) * 0.06; add(new THREE.IcosahedronGeometry(0.2 + (i % 4) * 0.03, 1), Math.cos(a) * rr * 0.95, 0.56 + Math.sin(i * 2.3) * 0.08, Math.sin(a) * rr * 0.9 - 0.08); } for (let i = 0; i < 9; i++) add(new THREE.IcosahedronGeometry(0.2, 1), -0.4 + i * 0.1, 0.48 + (i % 2) * 0.06, 0.46); }
  else if (hcfg.style === 'slick') { add(rbox(1.3, 0.34, 1.26, 0.14), 0, 0.6, -0.02); add(rbox(1.3, 0.8, 0.3, 0.12), 0, 0.2, -0.5); add(rbox(0.2, 0.6, 1.0, 0.08), -0.62, 0.25, -0.05); add(rbox(0.2, 0.6, 1.0, 0.08), 0.62, 0.25, -0.05); }
  else if (hcfg.style === 'swoop') { add(rbox(1.3, 0.36, 1.26, 0.16), 0, 0.6, -0.02); add(rbox(0.9, 0.3, 0.4, 0.12), 0.2, 0.55, 0.5, 0, 0, -0.25); add(rbox(1.3, 0.7, 0.3, 0.12), 0, 0.25, -0.5); }
  else if (hcfg.style === 'bun') { add(rbox(1.3, 0.34, 1.26, 0.16), 0, 0.6, -0.02); add(new THREE.SphereGeometry(0.32, 16, 12), 0, 0.82, -0.42); add(rbox(1.3, 0.6, 0.3, 0.12), 0, 0.3, -0.5); }
  else if (hcfg.style === 'bob') { add(rbox(1.34, 0.36, 1.3, 0.16), 0, 0.6, -0.02); add(rbox(1.36, 0.95, 0.34, 0.14), 0, 0.12, -0.52); for (const s of [-1, 1]) add(rbox(0.26, 0.95, 0.95, 0.12), 0.66 * s, 0.12, -0.08); add(rbox(1.1, 0.26, 0.2, 0.1), 0, 0.5, 0.56); }
  else if (hcfg.style === 'ponytail') { add(rbox(1.32, 0.34, 1.28, 0.16), 0, 0.6, -0.02); add(rbox(1.3, 0.6, 0.3, 0.12), 0, 0.3, -0.5); const tie = add(new THREE.SphereGeometry(0.14, 10, 8), 0, 0.5, -0.7); const tail = add(rbox(0.36, 1.1, 0.36, 0.16), 0, -0.05, -0.82, 0.25); }
  else if (hcfg.style === 'pixie') { add(rbox(1.3, 0.3, 1.26, 0.14), 0, 0.6, -0.02); for (let i = 0; i < 6; i++) add(new THREE.ConeGeometry(0.16, 0.36, 4), -0.45 + i * 0.18, 0.82, 0.25 - (i % 2) * 0.2, 0.4, 0, -0.3 + i * 0.12); add(rbox(1.3, 0.5, 0.3, 0.12), 0, 0.35, -0.5); }
  else if (hcfg.style === 'long') { add(rbox(1.32, 0.36, 1.28, 0.16), 0, 0.6, -0.02); add(rbox(1.34, 1.6, 0.36, 0.14), 0, -0.1, -0.5); for (const s of [-1, 1]) add(rbox(0.26, 1.4, 0.7, 0.1), 0.64 * s, -0.05, -0.05); }
}
function addHat(head, o) {
  const k = o.hat; if (!k) return; const c = o.hatColor ?? 0x222222;
  if (k === 'tophat') { const gm = GOLD(); const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.08, 40), gm); brim.position.y = 0.66; head.add(brim); const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.7, 1.15, 40), gm); crown.position.y = 1.26; head.add(crown); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.71, 0.71, 0.2, 40), M(0x2a1a0a)); band.position.y = 0.82; head.add(band); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.04, 40), gm); top.position.y = 1.84; head.add(top); }
  else if (k === 'conductor') { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.66, 0.5, 32), M(c)); cap.position.y = 0.78; head.add(cap); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.72, 0.12, 32), M(c)); top.position.y = 1.06; head.add(top); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.735, 0.735, 0.14, 32), GOLD()); band.position.y = 0.62; head.add(band); const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.05, 32, 1, false, -Math.PI / 2, Math.PI), M(0x111111, { roughness: 0.25 })); visor.scale.set(1, 1, 0.75); visor.position.set(0, 0.56, 0.2); head.add(visor);
    const star = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.07 : 0.17; star[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, -Math.sin(a) * r); } const s = new THREE.Mesh(new THREE.ExtrudeGeometry(star, { depth: 0.04, bevelEnabled: false }), GOLD()); s.position.set(0, 0.82, 0.72); head.add(s); }
  else if (k === 'nemes') { // striped pharaoh headdress + crown with gems
    const stripes = tex(256, 256, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#e8b830' : '#2a5aa8'; g.fillRect(0, i * 16, w, 16); } });
    const nm = M(0xffffff, { map: stripes, roughness: 0.4, metalness: 0.3 });
    const cap = new THREE.Mesh(rbox(1.36, 0.5, 1.3, 0.2), nm); cap.position.y = 0.58; head.add(cap);
    for (const s of [-1, 1]) { const flap = new THREE.Mesh(rbox(0.4, 1.6, 0.66, 0.12), nm); flap.position.set(0.72 * s, -0.15, 0.06); flap.rotation.z = 0.12 * s; head.add(flap); }
    const back = new THREE.Mesh(rbox(1.2, 1.2, 0.3, 0.12), nm); back.position.set(0, 0.1, -0.66); head.add(back);
    const gm = GOLD(); const band = new THREE.Mesh(rbox(1.42, 0.22, 1.36, 0.08), gm); band.position.y = 0.42; head.add(band);
    const crown = new THREE.Group(); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32; const sp = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.36, 4), gm); sp.position.set(Math.cos(a) * 0.68, 0.98, -Math.sin(a) * 0.66 + 0.02); crown.add(sp); const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.075), M([0x1abc9c, 0xc0392b, 0x2a5aa8][i % 3], { roughness: 0.1, metalness: 0.3, emissive: [0x0a4a3a, 0x4a0a0a, 0x0a1a4a][i % 3], emissiveIntensity: 0.4 })); gem.position.set(Math.cos(a) * 0.72, 0.62, -Math.sin(a) * 0.7 + 0.02); crown.add(gem); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.06, 8, 40), gm); ring.rotation.x = Math.PI / 2; ring.position.y = 0.8; crown.add(ring);
    const cobra = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 6), gm); cobra.position.set(0, 1.05, 0.66); crown.add(cobra); const hoodC = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), gm); hoodC.scale.set(1, 1.3, 0.4); hoodC.position.set(0, 1.0, 0.62); crown.add(hoodC);
    head.add(crown); }
  else if (k === 'explorer') { const m = M(c, { roughness: 0.9 }); const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.08, 40), m); brim.position.y = 0.62; head.add(brim); const crown = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 16, 0, 7, 0, 1.25), m); crown.scale.y = 0.9; crown.position.y = 0.6; head.add(crown); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.14, 32), M(0x5a3a1e)); band.position.y = 0.74; head.add(band);
    const gm = M(0x5a3a1e); const strap = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.05, 6, 32), M(0x2a2a2a)); strap.rotation.x = Math.PI / 2; strap.position.y = 0.92; head.add(strap); for (const s of [-1, 1]) { const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 20), M(0x8a6a3a, { metalness: 0.6, roughness: 0.3 })); lens.rotation.x = Math.PI / 2; lens.position.set(0.22 * s, 0.94, 0.62); head.add(lens); const gl = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), M(0x7ac8e8, { roughness: 0.05, metalness: 0.4, emissive: 0x1a4a6a, emissiveIntensity: 0.3 })); gl.position.set(0.22 * s, 0.94, 0.7); head.add(gl); } }
  else if (k === 'earmuffs') { const band = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.06, 8, 32, Math.PI), M(0xe8e8f0)); band.position.y = 0.05; head.add(band); for (const s of [-1, 1]) { const muff = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), M(c, { roughness: 1 })); muff.scale.set(0.6, 1, 1); muff.position.set(0.68 * s, -0.02, 0); head.add(muff); } }
  else if (k === 'gasmask') { const band = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.06, 6, 32), M(0x222222)); band.rotation.x = Math.PI / 2; band.position.y = 0.42; head.add(band); const mask = new THREE.Mesh(rbox(0.8, 0.5, 0.3, 0.14), M(0x3a3e44, { roughness: 0.5 })); mask.position.set(0, 0.62, 0.55); mask.rotation.x = -0.5; head.add(mask); for (const s of [-1, 1]) { const lens = new THREE.Mesh(new THREE.CircleGeometry(0.14, 20), M(0x9ad0e8, { roughness: 0.05, metalness: 0.5 })); lens.position.set(0.2 * s, 0.72, 0.74); lens.rotation.x = -0.5; head.add(lens); } const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.2, 16), M(0x5a5e64)); filter.rotation.x = Math.PI / 2 - 0.5; filter.position.set(0, 0.5, 0.75); head.add(filter); }
  else if (k === 'bandana') { const m = M(c, { roughness: 0.9 }); const b = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.1, 8, 32), m); b.rotation.x = Math.PI / 2; b.scale.set(1, 0.92, 1); b.position.y = -0.7; head.add(b); const knot = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 4), m); knot.position.set(0, -0.86, 0.6); knot.rotation.x = Math.PI; head.add(knot); }
  else if (k === 'beanie') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.74, 24, 16, 0, 7, 0, 1.4), M(c, { roughness: 0.95 })); b.position.y = 0.32; head.add(b); const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.24, 32), M(shade(c, 0.85), { roughness: 0.95 })); cuff.position.y = 0.48; head.add(cuff); }
  else if (k === 'cap') { const top = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 16, 0, 7, 0, 1.3), M(c)); top.position.y = 0.4; head.add(top); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 24, 1, false, -Math.PI / 2, Math.PI), M(shade(c, 0.7))); brim.scale.set(1, 1, 1.1); brim.position.set(0, 0.5, 0.4); head.add(brim); }
}
function addGlasses(head, o) {
  if (!o.glasses) return;
  if (o.glasses === 'sunglasses') { const fm = M(0xd8d8e0, { metalness: 0.9, roughness: 0.2 }); const lm = M(0x2a1a3a, { roughness: 0.05, metalness: 0.6 }); for (const s of [-1, 1]) { const l = new THREE.Mesh(rbox(0.42, 0.28, 0.06, 0.1), lm); l.position.set(0.25 * s, 0.1, 0.62); head.add(l); const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.6), fm); arm.position.set(0.62 * s, 0.14, 0.3); head.add(arm); } const br = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.04), fm); br.position.set(0, 0.16, 0.63); head.add(br); return; }
  const fm = o.glasses === 'gold' ? GOLD() : M(0x111111, { roughness: 0.3 });
  const lens = new THREE.MeshStandardMaterial({ color: 0x88aacc, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.2 });
  for (const s of [-1, 1]) { const frame = new THREE.Mesh(o.glasses === 'round' ? new THREE.TorusGeometry(0.17, 0.03, 8, 24) : new THREE.TorusGeometry(0.19, 0.03, 4, 4), fm); if (o.glasses !== 'round') frame.rotation.z = Math.PI / 4; frame.position.set(0.24 * s, 0.1, 0.61); head.add(frame); const l = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), lens); l.position.set(0.24 * s, 0.1, 0.6); head.add(l); const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.6), fm); arm.position.set(0.6 * s, 0.12, 0.3); head.add(arm); }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.035), fm); bridge.position.set(0, 0.12, 0.62); head.add(bridge);
}
function addChain(body) { const gm = GOLD(); const N = 22; for (let i = 0; i <= N; i++) { const u = i / N; const x = (u - 0.5) * 1.3, y = 1.95 - Math.sin(u * Math.PI) * 0.95, z = 0.54 + Math.sin(u * Math.PI) * 0.03; const bead = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), gm); bead.position.set(x, y, z); body.add(bead); } const med = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 24), gm); med.rotation.x = Math.PI / 2; med.position.set(0, 0.92, 0.56); body.add(med); const d = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), M(0xd8f4ff, { metalness: 0.2, roughness: 0.05, emissive: 0x3a6a8a, emissiveIntensity: 0.3 })); d.position.set(0, 0.92, 0.62); body.add(d); }
function addBackpack(body, c) { const m = M(c, { roughness: 0.85 }); const b = new THREE.Mesh(rbox(1.6, 1.7, 0.6, 0.16), m); b.position.set(0, 1.05, -0.8); body.add(b); const p = new THREE.Mesh(rbox(1.1, 0.6, 0.25, 0.08), M(shade(c, 0.8))); p.position.set(0, 0.62, -1.2); body.add(p); const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.7, 16), M(0x5a4a3a)); roll.rotation.z = Math.PI / 2; roll.position.set(0, 2.0, -0.8); body.add(roll); }
function addScarf(body, c) { const m = M(c, { roughness: 1 }); const r = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.18, 10, 24), m); r.rotation.x = Math.PI / 2; r.scale.set(1.25, 0.85, 1); r.position.y = 2.05; body.add(r); const tail = new THREE.Mesh(rbox(0.36, 0.9, 0.1, 0.05), m); tail.position.set(0.45, 1.6, 0.55); tail.rotation.z = 0.15; body.add(tail); }
function addProp(arm, kind) {
  const p = new THREE.Group(); p.position.set(0, -1.95, 0.25); arm.add(p);
  if (kind === 'lantern') { const frame = M(0x3a2a1a, { metalness: 0.5 }); const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 12), new THREE.MeshStandardMaterial({ color: 0xffd88a, emissive: 0xffb040, emissiveIntensity: 2.2, transparent: true, opacity: 0.9 })); glass.position.y = -0.35; p.add(glass); const top = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.2, 12), frame); top.position.y = -0.06; p.add(top); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.08, 12), frame); base.position.y = -0.6; p.add(base); const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 6, 16, Math.PI), frame); handle.position.y = 0.04; p.add(handle); const l = new THREE.PointLight(0xffb050, 3, 6, 1.6); l.position.y = -0.35; p.add(l); }
  else if (kind === 'flashlight') { const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.6, 12), M(0x2a2a2a, { metalness: 0.6, roughness: 0.3 })); body.rotation.x = Math.PI / 2; body.position.z = 0.25; p.add(body); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), new THREE.MeshBasicMaterial({ color: 0xfffbe0, toneMapped: false })); lens.position.z = 0.56; p.add(lens); const beam = new THREE.Mesh(new THREE.ConeGeometry(0.9, 4, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff4c0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })); beam.rotation.x = -Math.PI / 2; beam.position.z = 2.55; p.add(beam); const l = new THREE.SpotLight(0xfff4d0, 20, 14, 0.4, 0.5); l.position.z = 0.5; l.target.position.set(0, 0, 5); p.add(l, l.target); }
  else if (kind === 'ticket') { const t = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.02), M(0xe8b830, { metalness: 0.7, roughness: 0.3, emissive: 0x4a3000, emissiveIntensity: 0.3 })); t.position.set(0, -0.1, 0.1); t.rotation.set(-0.3, 0, 0.2); p.add(t); }
}
function addBelt(body, c) { const b = new THREE.Mesh(rbox(2.06, 0.22, 1.06, 0.06), M(c)); b.position.y = 0.12; body.add(b); const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.06), GOLD()); buckle.position.set(0, 0.12, 0.54); body.add(buckle); }

// ---------------- animation helpers ----------------
export function setBlockFace(av, expr) { const P = av.userData.P; if (P._e === expr) return; P._e = expr; P.faceM.map = faceTex(P.o.skin, expr, P.o.face || {}); P.faceM.needsUpdate = true; }
export function poseBlock(av, p = {}) { const P = av.userData.P; P.armL.rotation.set(p.armLx || 0, 0, p.armLz || 0); P.armR.rotation.set(p.armRx || 0, 0, p.armRz || 0); P.legL.rotation.x = p.legL || 0; P.legR.rotation.x = p.legR || 0; P.head.rotation.set(p.headX || 0, p.headY || 0, p.headZ || 0); P.body.rotation.set(p.bodyX || 0, p.bodyY || 0, p.bodyZ || 0); }
