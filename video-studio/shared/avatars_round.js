// ===== Rounded, expressive avatar system (smooth, LEGO-ish, varied outfits) =====
import * as THREE from 'three';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const ease = u => { u = clamp(u); return u * u * (3 - 2 * u); };
export const easeOut = u => 1 - Math.pow(1 - clamp(u), 3);
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const lerpV = (a, b, u) => a.clone().lerp(b, u);
export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
export function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t; }
export function mat(color, o = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.0, ...o }); }

// ---- expressive face textures ----
const faceCache = new Map();
function drawFace(g, expr, blush) {
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#1a1414'; g.strokeStyle = '#1a1414'; g.lineCap = 'round'; g.lineJoin = 'round';
  if (blush) { g.fillStyle = 'rgba(255,120,120,0.35)'; g.beginPath(); g.ellipse(58, 150, 26, 16, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(198, 150, 26, 16, 0, 0, 7); g.fill(); g.fillStyle = '#1a1414'; }
  const eyeDot = (x, y, r = 16) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  const eyeShine = (x, y) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 5, y - 6, 5, 0, 7); g.fill(); g.fillStyle = '#1a1414'; };
  const brow = (inner, outer) => { g.lineWidth = 11; g.beginPath(); g.moveTo(44, outer); g.lineTo(96, inner); g.moveTo(212, outer); g.lineTo(160, inner); g.stroke(); };
  const closedEyes = (y, down) => { g.lineWidth = 12; for (const x of [70, 186]) { g.beginPath(); g.arc(x, y + (down ? 10 : -6), 22, down ? Math.PI * 1.15 : Math.PI * 0.2, down ? Math.PI * 1.85 : Math.PI * 0.8); g.stroke(); } };
  switch (expr) {
    case 'smile': eyeDot(70, 110); eyeDot(186, 110); eyeShine(70, 110); eyeShine(186, 110); g.lineWidth = 12; g.beginPath(); g.arc(128, 150, 44, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); break;
    case 'happy': closedEyes(108, false); g.lineWidth = 13; g.beginPath(); g.moveTo(74, 168); g.quadraticCurveTo(128, 232, 182, 168); g.stroke(); break;
    case 'laugh': closedEyes(108, false); g.beginPath(); g.moveTo(72, 165); g.quadraticCurveTo(128, 240, 184, 165); g.closePath(); g.fill(); g.fillStyle = '#d2544f'; g.beginPath(); g.ellipse(128, 200, 26, 13, 0, 0, 7); g.fill(); break;
    case 'sad': eyeDot(70, 118, 15); eyeDot(186, 118, 15); brow(84, 100); g.lineWidth = 12; g.beginPath(); g.arc(128, 205, 40, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); break;
    case 'cry': g.lineWidth = 12; closedEyes(120, true); brow(80, 98); g.beginPath(); g.arc(128, 208, 36, Math.PI * 1.2, Math.PI * 1.8); g.stroke();
      g.fillStyle = '#6fc4ff'; for (const x of [62, 194]) { g.beginPath(); g.moveTo(x, 135); g.quadraticCurveTo(x - 7, 165, x, 185); g.quadraticCurveTo(x + 7, 165, x, 135); g.fill(); } break;
    case 'worried': eyeDot(70, 115); eyeDot(186, 115); brow(74, 90); g.lineWidth = 11; g.beginPath(); g.moveTo(96, 195); g.quadraticCurveTo(118, 180, 140, 194); g.quadraticCurveTo(160, 206, 180, 190); g.stroke(); break;
    case 'surprise': g.fillStyle = '#fff'; for (const x of [70, 186]) { g.beginPath(); g.arc(x, 108, 26, 0, 7); g.fill(); g.lineWidth = 5; g.stroke(); } g.fillStyle = '#1a1414'; eyeDot(70, 112, 11); eyeDot(186, 112, 11); brow(70, 58); g.beginPath(); g.ellipse(128, 195, 22, 28, 0, 0, 7); g.fill(); break;
    case 'angry': eyeDot(72, 116, 14); eyeDot(184, 116, 14); g.lineWidth = 13; g.beginPath(); g.moveTo(44, 88); g.lineTo(104, 108); g.moveTo(212, 88); g.lineTo(152, 108); g.stroke(); g.beginPath(); g.moveTo(94, 195); g.lineTo(162, 195); g.stroke(); break;
    case 'warm': closedEyes(112, false); g.lineWidth = 12; g.beginPath(); g.arc(128, 158, 36, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); break;
    case 'blink': g.lineWidth = 12; for (const x of [70, 186]) { g.beginPath(); g.moveTo(x - 20, 112); g.lineTo(x + 20, 112); g.stroke(); } g.beginPath(); g.arc(128, 150, 40, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); break;
    default: eyeDot(70, 110); eyeDot(186, 110); g.lineWidth = 11; g.beginPath(); g.moveTo(104, 180); g.lineTo(152, 180); g.stroke();
  }
}
// talking mouths: expr 'base~a' / 'base~o' / 'base~e' draws base eyes/brows with an open mouth
function drawTalk(g, base, m, blush) {
  drawFace(g, base, blush);
  g.clearRect(80, 146, 96, 100);
  g.fillStyle = '#1a1414';
  if (m === 'o') { g.beginPath(); g.ellipse(128, 190, 18, 24, 0, 0, 7); g.fill(); }
  else if (m === 'e') { g.beginPath(); g.ellipse(128, 182, 34, 12, 0, 0, 7); g.fill(); }
  else { g.beginPath(); g.moveTo(88, 168); g.quadraticCurveTo(128, 236, 168, 168); g.closePath(); g.fill(); }
  g.fillStyle = '#d2544f'; g.beginPath(); g.ellipse(128, m === 'e' ? 188 : 202, 14, 6, 0, 0, 7); g.fill();
}
function faceTexture(expr, blush) { const key = expr + (blush ? '_b' : ''); if (faceCache.has(key)) return faceCache.get(key); const t = canvasTex(256, 256, g => { if (expr.includes('~')) { const [b, m] = expr.split('~'); drawTalk(g, b, m, blush); } else drawFace(g, expr, blush); }); faceCache.set(key, t); return t; }

const SKINS = [0xffe0bd, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffcd94];
const HAIRS = [0x2a1a10, 0x5a3a1e, 0xe8731c, 0x111111, 0x8e5a2a, 0xb0b0b0, 0x7a3a8a, 0xd94a6a, 0xf0c040];
const SHIRTS = [0xd94a4a, 0x3a7ad0, 0x3aa05a, 0xf0b030, 0x8a4ab0, 0xe06aa0, 0x2aa0a0, 0xe06a2a, 0x4a5a7a, 0x50b070];
const PANTS = [0x2a3a5a, 0x3a3a42, 0x5a3a2a, 0x2a2a2a, 0x4a4a52, 0x3a2a4a];

function roundedCap(r, len, m) { const g = new THREE.Group(); const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 20), m); g.add(cyl); for (const s of [1, -1]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), m); cap.position.y = s * len / 2; g.add(cap); } g.traverse(o => { o.castShadow = true; o.receiveShadow = true; }); return g; }

export function makeAvatar(opt = {}) {
  const r = rng(opt.seed ?? (Math.random() * 1e9 | 0));
  const skin = opt.skin ?? SKINS[r() * SKINS.length | 0];
  const hairCol = opt.hair ?? HAIRS[r() * HAIRS.length | 0];
  const shirt = opt.top ?? SHIRTS[r() * SHIRTS.length | 0];
  const pants = opt.legs ?? PANTS[r() * PANTS.length | 0];
  const hairStyle = opt.hairStyle ?? ['swoop', 'bun', 'short', 'spiky', 'long', 'curly', 'bald'][r() * 7 | 0];
  const accessory = opt.acc ?? ['none', 'none', 'cap', 'glasses', 'bow', 'beanie', 'headphones'][r() * 7 | 0];
  const skinM = mat(skin), hairM = mat(hairCol, { roughness: 0.75 }), shirtM = mat(shirt), pantM = mat(pants, { roughness: 0.7 });
  const g = new THREE.Group(); const P = { scale: opt.scale ?? 1 };
  g.scale.setScalar(P.scale);
  const hip = new THREE.Group(); hip.position.y = 0.95; g.add(hip); P.hip = hip;
  // legs
  for (const sx of [-1, 1]) { const leg = new THREE.Group(); leg.position.set(0.22 * sx, 0, 0); hip.add(leg); const l = roundedCap(0.2, 0.52, pantM); l.position.y = -0.4; leg.add(l); const sh = new THREE.Mesh(new THREE.SphereGeometry(0.23, 18, 12), mat(0xf2f2f2)); sh.scale.set(1, 0.6, 1.4); sh.position.set(0, -0.78, 0.07); sh.castShadow = true; leg.add(sh); P[sx < 0 ? 'legL' : 'legR'] = leg; }
  const body = new THREE.Group(); hip.add(body); P.body = body;
  const torso = roundedCap(0.42, 0.56, shirtM); torso.position.y = 0.5; torso.scale.set(1.08, 1, 0.82); body.add(torso);
  if (r() > 0.55) { const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.435, 0.435, 0.14, 20), mat(r() > 0.5 ? 0xffffff : 0x222222)); stripe.scale.set(1.08, 1, 0.82); stripe.position.y = 0.46; body.add(stripe); }
  // arms
  for (const sx of [-1, 1]) { const arm = new THREE.Group(); arm.position.set(0.52 * sx, 0.8, 0); body.add(arm); const a = roundedCap(0.145, 0.46, shirtM); a.position.y = -0.28; arm.add(a); const hand = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), skinM); hand.position.y = -0.56; hand.castShadow = true; arm.add(hand); P[sx < 0 ? 'armL' : 'armR'] = arm; }
  // head
  const head = new THREE.Group(); head.position.y = 1.02 + 0.44; body.add(head); P.head = head;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.46, 28, 22), skinM); skull.scale.set(1, 1.08, 0.96); skull.castShadow = true; head.add(skull);
  const faceM = new THREE.MeshBasicMaterial({ map: faceTexture('smile'), transparent: true, toneMapped: false });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), faceM); face.position.set(0, 0.02, 0.44); face.rotation.x = -0.04; head.add(face); P.faceM = faceM; P.blush = false;
  // hair
  const hgrp = new THREE.Group(); head.add(hgrp);
  const addH = (geo, x, y, z, rot = 0) => { const m = new THREE.Mesh(geo, hairM); m.position.set(x, y, z); m.rotation.z = rot; m.castShadow = true; hgrp.add(m); return m; };
  if (hairStyle !== 'bald') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.49, 24, 18, 0, 7, 0, 1.4), hairM); cap.scale.set(1, 1.05, 0.98); cap.position.y = 0.04; cap.castShadow = true; hgrp.add(cap);
    if (hairStyle === 'swoop') { addH(new THREE.SphereGeometry(0.2, 12, 10), 0.26, 0.22, 0.34); }
    else if (hairStyle === 'bun') { addH(new THREE.SphereGeometry(0.2, 14, 12), 0, 0.46, -0.12); }
    else if (hairStyle === 'spiky') { for (let i = 0; i < 5; i++) addH(new THREE.ConeGeometry(0.1, 0.22, 8), -0.3 + i * 0.15, 0.5, 0.1); }
    else if (hairStyle === 'long') { for (const sx of [-1, 1]) addH(new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.12, 0.45, 6, 10) : new THREE.CylinderGeometry(0.12, 0.12, 0.6, 10), 0.4 * sx, -0.1, -0.1); addH(new THREE.CylinderGeometry(0.46, 0.46, 0.4, 18), 0, -0.1, -0.2); }
    else if (hairStyle === 'curly') { for (let i = 0; i < 8; i++) { const a = i / 8 * 7; addH(new THREE.SphereGeometry(0.16, 10, 8), Math.cos(a) * 0.4, 0.28 + Math.sin(a) * 0.15, Math.sin(a) * 0.2); } }
  }
  // accessory
  if (accessory === 'cap') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14, 0, 7, 0, 1.2), mat(SHIRTS[r() * SHIRTS.length | 0])); b.scale.set(1, 1, 1); b.position.y = 0.12; head.add(b); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 18, 1, false, 0, Math.PI), mat(0x222222)); brim.position.set(0, 0.16, 0.3); head.add(brim); }
  else if (accessory === 'beanie') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14, 0, 7, 0, 1.5), mat(SHIRTS[r() * SHIRTS.length | 0], { roughness: 0.9 })); b.position.y = 0.08; head.add(b); }
  else if (accessory === 'glasses') { const gm = new THREE.MeshStandardMaterial({ color: 0x111111 }); for (const sx of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 18), gm); ring.position.set(0.17 * sx, 0.04, 0.45); head.add(ring); } const br = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.03), gm); br.position.set(0, 0.04, 0.46); head.add(br); }
  else if (accessory === 'bow') { for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 10), mat(0xe05a8a)); b.position.set(0.15 * sx, 0.46, -0.12); b.rotation.z = -Math.PI / 2 * sx; head.add(b); } const kn = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(0xe05a8a)); kn.position.set(0, 0.42, -0.05); head.add(kn); }
  else if (accessory === 'headphones') { const band = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.04, 8, 20, Math.PI), mat(0x222222)); band.position.y = 0.3; head.add(band); for (const sx of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14), mat(0x333333)); cup.rotation.z = Math.PI / 2; cup.position.set(0.47 * sx, 0.02, 0); head.add(cup); } }
  // tear drops (animated, hidden by default)
  P.tears = [];
  for (const sx of [-1, 1]) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0x8fd4ff, transparent: true, opacity: 0.85, toneMapped: false })); d.scale.set(1, 1.5, 1); d.visible = false; head.add(d); d.userData.x = 0.16 * sx; P.tears.push(d); }
  g.userData.P = P; g.userData.phase = r() * 6.28;
  return g;
}

export function setFace(av, expr) { const P = av.userData.P; if (P._expr !== expr) { P._expr = expr; P.faceM.map = faceTexture(expr, P.blush); } }
export function setBlush(av, on) { const P = av.userData.P; P.blush = on; P.faceM.map = faceTexture(P._expr || 'smile', on); }
export function setTears(av, on, t) { av.userData.P.tears.forEach(d => { d.visible = on; if (on) { const f = (t * 1.2 + (d.userData.x > 0 ? 0.5 : 0)) % 1; d.position.set(d.userData.x, 0.0 - f * 0.5, 0.45); d.material.opacity = 0.85 * (1 - f); } }); }
export function pose(av, p = {}) { const P = av.userData.P; P.armL.rotation.set(p.armLx || 0, 0, p.armLz || 0); P.armR.rotation.set(p.armRx || 0, 0, p.armRz || 0); P.legL.rotation.x = p.legL || 0; P.legR.rotation.x = p.legR || 0; P.head.rotation.set(p.headX || 0, p.headY || 0, p.headZ || 0); P.body.rotation.set(p.bodyX || 0, p.bodyY || 0, p.bodyZ || 0); P.body.position.y = p.bob || 0; }
// idle breathing + subtle sway; call every frame, then layer pose on top with mix
export function idleP(av, t) { const ph = av.userData.phase; return { bob: Math.sin(t * 1.6 + ph) * 0.015, bodyZ: Math.sin(t * 0.8 + ph) * 0.02, headY: Math.sin(t * 0.5 + ph) * 0.06, armLz: 0.08 + Math.sin(t * 1.6 + ph) * 0.02, armRz: -0.08 - Math.sin(t * 1.6 + ph) * 0.02 }; }
export function idle(av, t) { pose(av, idleP(av, t)); }
export function blinkFace(av, t, baseExpr) { const open = (t + av.userData.phase) % 3.4 > 0.14; setFace(av, open ? baseExpr : 'blink'); if (!open && (baseExpr === 'smile' || baseExpr === 'happy')) setFace(av, 'blink'); }
export const walkPose = (phase, amt = 0.6, ex = {}) => { const s = Math.sin(phase) * amt; return { legL: s, legR: -s, armLx: -s * 0.8, armRx: s * 0.8, bob: Math.abs(Math.cos(phase)) * 0.05 * amt / 0.6, ...ex }; };
export const place = (av, x, z, rotY, y = 0) => { av.position.set(x, y, z); av.rotation.set(0, rotY, 0); av.visible = true; };

// lip-flap while speaking: call every frame with whether this avatar is speaking right now
export function talkFace(av, t, speaking, baseExpr) {
  if (!speaking) { blinkFace(av, t, baseExpr); return; }
  const k = Math.floor((t + av.userData.phase) * 9) % 5;
  setFace(av, k === 4 ? baseExpr : baseExpr + '~' + ['a', 'o', 'e', 'a'][k]);
}
// gesture library (layered on top of idle via pose())
export const G = {
  wave: (t) => ({ armRz: 2.5, armLz: -0.1, headZ: 0.08, _wave: Math.sin(t * 9) * 0.35 }),
  point: () => ({ armRx: -1.5, armRz: 0.1 }),
  shrug: () => ({ armLz: -0.9, armRz: 0.9, armLx: -0.3, armRx: -0.3, headZ: 0.15 }),
  cheer: (t) => ({ armLz: -2.6, armRz: 2.6, bob: Math.abs(Math.sin(t * 8)) * 0.12 }),
  handsHead: () => ({ armLz: -2.3, armRz: 2.3, armLx: -0.7, armRx: -0.7 }),
  crossArms: () => ({ armLx: -1.25, armRx: -1.25, armLz: 0.75, armRz: -0.75 }),
  hug: (k = 1) => ({ armLx: -1.35 * k, armRx: -1.35 * k, armLz: -0.25 * k, armRz: 0.25 * k }),
  explain: (t) => ({ armRx: -0.9 + Math.sin(t * 4) * 0.25, armRz: 0.3, armLx: -0.5 + Math.sin(t * 4 + 1.5) * 0.2, armLz: -0.3 }),
  sad: () => ({ headX: 0.32, armLz: -0.05, armRz: 0.05, bodyX: 0.08 }),
  give: () => ({ armRx: -1.25, armRz: -0.05 }),
  handShoulder: () => ({ armRx: -1.45, armRz: -0.2 }),
  laughBend: (t) => ({ bodyX: 0.22 + Math.sin(t * 12) * 0.05, armLx: -0.6, armRx: -0.6, armLz: 0.4, armRz: -0.4 }),
  sit: (ex = {}) => ({ legL: -1.5, legR: -1.5, ...ex }),
};
export function poseG(av, t, ...parts) { const p = Object.assign(idleP(av, t), ...parts); pose(av, p); if (p._wave) av.userData.P.armR.rotation.x = p._wave; }
