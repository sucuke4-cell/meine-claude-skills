import * as THREE from 'three';

const TL = await (await fetch('./timeline.json')).json();
const W = 1080, H = 1920;
const VO = TL.vo;
const vs = k => VO[k].start, ve = k => VO[k].start + VO[k].dur;

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const ease = u => { u = clamp(u); return u * u * (3 - 2 * u); };
const easeOut = u => 1 - Math.pow(1 - clamp(u), 3);
const easeIn = u => Math.pow(clamp(u), 3);
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, u) => a.clone().lerp(b, u);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const flick = t => 0.85 + 0.1 * Math.sin(t * 7.3) + 0.05 * Math.sin(t * 23.1 + 1.7);
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.userData.canvas = c; return t;
}
function mat(color, o = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.0, ...o }); }
function box(w, h, d, m) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof m === 'object' && m.isMaterial ? m : mat(m));
  mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}

// ---------- avatars ----------
const faceCache = new Map();
function faceTexture(expr) {
  if (faceCache.has(expr)) return faceCache.get(expr);
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = '#141414'; g.strokeStyle = '#141414'; g.lineCap = 'round'; g.lineWidth = 12;
    const eye = (x, y, w, h) => { g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, 10); g.fill(); };
    const brows = (inner, outer) => { g.lineWidth = 10; g.beginPath(); g.moveTo(52, outer); g.lineTo(104, inner); g.moveTo(204, outer); g.lineTo(152, inner); g.stroke(); };
    const glowEyes = (y, col) => { g.save(); g.shadowColor = col; g.shadowBlur = 30; g.fillStyle = col; eye(80, y, 34, 20); eye(176, y, 34, 20); g.restore(); };
    switch (expr) {
      case 'laugh':
        for (const x of [80, 176]) { g.beginPath(); g.arc(x, 105, 22, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
        g.beginPath(); g.moveTo(70, 160); g.quadraticCurveTo(128, 240, 186, 160); g.closePath(); g.fill(); break;
      case 'shock':
        for (const x of [80, 176]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, 100, 30, 0, Math.PI * 2); g.fill(); g.lineWidth = 6; g.stroke(); g.fillStyle = '#141414'; g.beginPath(); g.arc(x, 104, 9, 0, Math.PI * 2); g.fill(); }
        brows(58, 50); g.beginPath(); g.ellipse(128, 190, 24, 32, 0, 0, Math.PI * 2); g.fill(); break;
      case 'worried':
        eye(80, 110, 26, 40); eye(176, 110, 26, 40); brows(60, 72);
        g.lineWidth = 10; g.beginPath(); g.moveTo(88, 192); g.quadraticCurveTo(108, 176, 128, 190); g.quadraticCurveTo(148, 204, 168, 188); g.stroke(); break;
      case 'determined':
        eye(80, 112, 26, 34); eye(176, 112, 26, 34); brows(84, 66);
        g.lineWidth = 10; g.beginPath(); g.moveTo(96, 186); g.lineTo(160, 182); g.stroke(); break;
      case 'stern':
        eye(80, 112, 26, 26); eye(176, 112, 26, 26); brows(86, 76);
        g.lineWidth = 10; g.beginPath(); g.moveTo(96, 188); g.lineTo(160, 188); g.stroke(); break;
      case 'smirk':
        eye(80, 112, 26, 26); eye(176, 112, 26, 26); brows(80, 80);
        g.lineWidth = 10; g.beginPath(); g.moveTo(92, 186); g.quadraticCurveTo(140, 200, 172, 172); g.stroke(); break;
      case 'redeyes':
        glowEyes(112, '#ff2020'); brows(90, 70);
        g.lineWidth = 10; g.beginPath(); g.moveTo(84, 180); g.quadraticCurveTo(128, 214, 176, 176); g.stroke(); break;
      case 'keeper':
        glowEyes(118, '#ff1a1a'); break;
      case 'sleep':
        g.lineWidth = 8; for (const x of [80, 176]) { g.beginPath(); g.moveTo(x - 20, 112); g.lineTo(x + 20, 112); g.stroke(); }
        g.beginPath(); g.moveTo(112, 190); g.lineTo(144, 190); g.stroke(); break;
      case 'sad':
        eye(80, 112, 24, 34); eye(176, 112, 24, 34); brows(62, 74);
        g.beginPath(); g.arc(128, 215, 40, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); break;
      default:
        eye(80, 105, 26, 44); eye(176, 105, 26, 44);
        g.beginPath(); g.arc(128, 150, 48, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
    }
  });
  faceCache.set(expr, t); return t;
}
function tagTex(name, color) {
  return canvasTex(512, 128, (g, w, h) => {
    g.font = '800 72px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 12; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(name, w / 2, h / 2);
    g.fillStyle = color; g.fillText(name, w / 2, h / 2);
  });
}
function nameTag(name, color = '#ffffff') {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTex(name, color), transparent: true, depthWrite: false, fog: false }));
  s.scale.set(1.5, 0.375, 1); return s;
}
function makeAvatar(o) {
  const g = new THREE.Group(); const P = {};
  const hip = new THREE.Group(); hip.position.y = 0.95; g.add(hip);
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(0.25 * sx, 0, 0); hip.add(leg);
    const l = box(0.47, 0.82, 0.48, o.legs); l.position.y = -0.41; leg.add(l);
    const sh = box(0.49, 0.14, 0.58, o.shoes); sh.position.set(0, -0.86, 0.05); leg.add(sh);
    P[sx < 0 ? 'legL' : 'legR'] = leg;
  }
  const body = new THREE.Group(); hip.add(body); P.body = body;
  const torso = box(1.0, 0.95, 0.52, o.top); torso.position.y = 0.475; body.add(torso);
  if (o.stripe) { const s = box(1.02, 0.14, 0.54, o.stripe); s.position.y = 0.55; body.add(s); }
  if (o.skirt) { const sk = box(1.1, 0.34, 0.6, o.skirt); sk.position.y = 0.02; hip.add(sk); }
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(0.72 * sx, 0.86, 0); body.add(arm);
    const sl = box(0.42, 0.68, 0.44, o.top); sl.position.y = -0.3; arm.add(sl);
    const hand = box(0.38, 0.24, 0.4, o.skin); hand.position.y = -0.76; arm.add(hand);
    P[sx < 0 ? 'armL' : 'armR'] = arm;
  }
  const head = new THREE.Group(); head.position.y = 0.95 + 0.38; body.add(head); P.head = head;
  head.add(box(0.74, 0.74, 0.74, o.skin));
  const faceM = new THREE.MeshBasicMaterial({ map: faceTexture('smile'), transparent: true, toneMapped: false });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), faceM); face.position.z = 0.375; head.add(face); P.faceM = faceM;
  const hair = o.hair;
  if (o.hairStyle === 'cap') {
    const top = box(0.8, 0.18, 0.8, hair); top.position.y = 0.44; head.add(top);
    const fr = box(0.8, 0.14, 0.12, hair); fr.position.set(0, 0.3, 0.36); head.add(fr);
    const bk = box(0.8, 0.5, 0.12, hair); bk.position.set(0, 0.16, -0.38); head.add(bk);
    const tuft = box(0.22, 0.16, 0.3, hair); tuft.position.set(0.18, 0.6, 0.05); tuft.rotation.z = -0.4; head.add(tuft);
  } else if (o.hairStyle === 'pigtails') {
    const top = box(0.8, 0.16, 0.8, hair); top.position.y = 0.44; head.add(top);
    const bk = box(0.8, 0.62, 0.12, hair); bk.position.set(0, 0.1, -0.38); head.add(bk);
    const bang = box(0.8, 0.16, 0.12, hair); bang.position.set(0, 0.3, 0.36); head.add(bang);
    for (const sx of [-1, 1]) {
      const tie = box(0.18, 0.12, 0.18, 0xff5fa2); tie.position.set(0.5 * sx, 0.18, -0.1); head.add(tie);
      const pt = box(0.24, 0.62, 0.24, hair); pt.position.set(0.52 * sx, -0.2, -0.1); pt.rotation.z = 0.15 * sx; head.add(pt);
    }
  } else if (o.hairStyle === 'crown') {
    const base = box(0.82, 0.16, 0.82, 0xf1c40f); base.position.y = 0.45; head.add(base);
    for (const [x, z] of [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32], [0, 0.32]]) {
      const sp = box(0.16, 0.24, 0.16, mat(0xf1c40f, { metalness: 0.7, roughness: 0.3 })); sp.position.set(x, 0.62, z); head.add(sp);
    }
  } else if (o.hairStyle === 'short') {
    const top = box(0.8, 0.18, 0.8, hair); top.position.y = 0.44; head.add(top);
  } else if (o.hairStyle === 'hood') {
    const hm = mat(0x060606, { roughness: 1 });
    const top = box(0.9, 0.2, 0.9, hm); top.position.y = 0.47; head.add(top);
    const bk = box(0.9, 0.9, 0.14, hm); bk.position.set(0, 0.05, -0.43); head.add(bk);
    for (const sx of [-1, 1]) { const sd = box(0.12, 0.9, 0.9, hm); sd.position.set(0.44 * sx, 0.05, 0); head.add(sd); }
  }
  if (o.name) { const tag = nameTag(o.name, o.tagColor); tag.position.y = 3.15; g.add(tag); P.tag = tag; }
  g.userData.P = P; return g;
}
function setFace(av, expr) { av.userData.P.faceM.map = faceTexture(expr); }
function pose(av, p = {}) {
  const P = av.userData.P;
  P.legL.rotation.x = p.legL || 0; P.legR.rotation.x = p.legR || 0;
  P.armL.rotation.set(p.armLx || 0, 0, p.armLz || 0); P.armR.rotation.set(p.armRx || 0, 0, p.armRz || 0);
  P.head.rotation.set(p.headX || 0, p.headY || 0, p.headZ || 0);
  P.body.rotation.set(p.bodyX || 0, p.bodyY || 0, p.bodyZ || 0);
  P.body.position.y = p.bob || 0;
}
const walkPose = (phase, amt = 0.6, extra = {}) => { const s = Math.sin(phase) * amt; return { legL: s, legR: -s, armLx: -s * 0.9, armRx: s * 0.9, bob: Math.abs(Math.cos(phase)) * 0.05 * amt / 0.6, ...extra }; };
function place(av, x, z, rotY, y = 0) { av.position.set(x, y, z); av.rotation.set(0, rotY, 0); av.visible = true; }
const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

// ===== Shadow Shift – Part 1 (main scene; helpers + avatars are prepended by build_scene.py) =====
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.018);
const camera = new THREE.PerspectiveCamera(52, W / H, 0.05, 200); scene.add(camera);
const fill = new THREE.PointLight(0xffe8d8, 3, 8, 1.4); camera.add(fill); fill.position.set(0.3, 0.4, 0);
const hemi = new THREE.HemisphereLight(0xffffff, 0x202020, 1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 90 }); sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);

// ---------- street set ----------
const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), mat(0x2f4a2c, { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(140, 5), mat(0x2b2d33, { roughness: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.y = 0.01; road.receiveShadow = true; scene.add(road);
for (const z of [-3.2, 3.2]) { const sw = box(140, 0.15, 1.6, 0x8d8f96); sw.position.set(0, 0.075, z); sw.castShadow = false; scene.add(sw); }
for (let x = -60; x < 60; x += 4) { const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.15), new THREE.MeshBasicMaterial({ color: 0xd8d2a0 })); dash.rotation.x = -Math.PI / 2; dash.position.set(x, 0.02, 0); scene.add(dash); }
const windowMats = [];
function house(x, z, w, h, d, color, roof, face = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const body = box(w, h, d, color); body.position.y = h / 2; g.add(body);
  const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, 2.4, 4), mat(roof)); r.position.y = h + 1.2; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  const wm = mat(0x223344, { emissive: 0xffc870, emissiveIntensity: 0 }); windowMats.push(wm);
  for (const [wx, wy] of [[-w / 4, h * 0.72], [w / 4, h * 0.72], [-w / 4, h * 0.3]]) { const win = box(0.9, 0.9, 0.08, wm); win.castShadow = false; win.position.set(wx, wy, face * (d / 2 + 0.03)); g.add(win); }
  const door = box(0.9, 1.7, 0.08, 0x4a2e1a); door.position.set(w / 4, 0.85, face * (d / 2 + 0.03)); g.add(door);
  return g;
}
const theoHouse = house(0, -8, 6, 4.4, 5, 0x6f8fb8, 0x3a3a4a);
[[-14, 0xc9a07a], [-7, 0x9c6b8e], [7, 0x8fb07a], [14, 0xc7b37a], [-21, 0x8a8fb0], [21, 0xb0807a]].forEach(([x, c]) => house(x, -8, 5, 4, 5, c, 0x4a3a3a));
[[-10, 0xb0a080], [0, 0x80a0a8], [10, 0xa07a7a]].forEach(([x, c]) => { const h = house(x, 15, 5, 4, 5, c, 0x3a3a3a, -1); });
// Theo's balcony
const balcony = box(2.6, 0.2, 1.4, 0x5a4a3a); balcony.position.set(1.4, 2.55, -5.0); scene.add(balcony);
const rail = box(2.6, 0.6, 0.1, 0x5a4a3a); rail.position.set(1.4, 2.95, -4.35); scene.add(rail);
const curtain = box(0.95, 0.95, 0.04, 0x8a2a3a); curtain.castShadow = false; curtain.position.set(-1.5, 3.17, -5.4); scene.add(curtain);
// street lamps
const lampMats = [], lampLights = [];
for (const x of [-12, -4, 4, 12]) {
  const pole = box(0.16, 4.6, 0.16, 0x2a2a30); pole.position.set(x, 2.3, -3.6); scene.add(pole);
  const arm = box(0.9, 0.1, 0.1, 0x2a2a30); arm.position.set(x + 0.4, 4.55, -3.6); scene.add(arm);
  const lm = mat(0xfff0c0, { emissive: 0xffd080, emissiveIntensity: 0 }); lampMats.push(lm);
  const head = box(0.5, 0.25, 0.4, lm); head.castShadow = false; head.position.set(x + 0.8, 4.4, -3.6); scene.add(head);
  const pl = new THREE.PointLight(0xffc880, 0, 14, 1.4); pl.position.set(x + 0.8, 4.1, -3.4); scene.add(pl); lampLights.push(pl);
}
// clock tower
const tower = new THREE.Group(); tower.position.set(-6, 0, -15); scene.add(tower);
{ const b = box(3.2, 11, 3.2, 0x6a6a72); b.position.y = 5.5; tower.add(b);
  const top = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3, 4), mat(0x3a3040)); top.position.y = 12.5; top.rotation.y = Math.PI / 4; tower.add(top); }
const clockTex = canvasTex(512, 512, (g) => {
  g.fillStyle = '#f2ead6'; g.beginPath(); g.arc(256, 256, 250, 0, Math.PI * 2); g.fill(); g.lineWidth = 24; g.strokeStyle = '#2a1a12'; g.stroke();
  g.fillStyle = '#1a1a1a'; g.font = '900 60px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; g.fillText(['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][i - 1], 256 + Math.sin(a) * 180, 256 - Math.cos(a) * 180); }
});
const clockFaceM = mat(0xffffff, { map: clockTex, emissive: 0xffe0a0, emissiveIntensity: 0.15 });
const clockMesh = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), clockFaceM); clockMesh.position.set(0, 8.6, 1.62); tower.add(clockMesh);
const hourH = new THREE.Group(), minH = new THREE.Group(); hourH.position.set(0, 8.6, 1.66); minH.position.set(0, 8.6, 1.7); tower.add(hourH, minH);
{ const a = box(0.12, 0.6, 0.03, 0x111111); a.position.y = 0.27; hourH.add(a); const b = box(0.08, 0.95, 0.03, 0x111111); b.position.y = 0.45; minH.add(b); }
function setTowerTime(h, m) { minH.rotation.z = -m / 60 * Math.PI * 2; hourH.rotation.z = -((h % 12) + m / 60) / 12 * Math.PI * 2; }
// factory (exterior)
const factory = new THREE.Group(); factory.position.set(26, 0, -13); scene.add(factory);
const factWinM = mat(0x221a14, { emissive: 0xff8030, emissiveIntensity: 0 });
{ const b = box(12, 7, 9, 0x4a3530); b.position.y = 3.5; factory.add(b);
  const ch = box(1.4, 8, 1.4, 0x3a2a26); ch.position.set(-3.5, 9, -2); factory.add(ch);
  for (let i = 0; i < 4; i++) { const w = box(1.6, 1.2, 0.1, factWinM); w.castShadow = false; w.position.set(-4.2 + i * 2.8, 4.6, 4.55); factory.add(w); }
  const d = box(3, 3.6, 0.1, 0x1a1410); d.position.set(0, 1.8, 4.55); factory.add(d); }

// ---------- Theo's room set (at z = +60) ----------
const ROOM = v3(0, 0, 60);
const roomG = new THREE.Group(); roomG.position.copy(ROOM); scene.add(roomG);
const wallM = mat(0xd9c9a8, { roughness: 0.95 });
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat(0x8a6a4a)); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; roomG.add(fl);
  const back = box(10, 5, 0.2, wallM); back.position.set(0, 2.5, -3); roomG.add(back);
  const left = box(0.2, 5, 10, wallM); left.position.set(-4, 2.5, 2); roomG.add(left);
  const right = box(0.2, 5, 10, wallM); right.position.set(4, 2.5, 2); roomG.add(right);
  const bed = box(2.2, 0.6, 3.2, 0x3a5a8a); bed.position.set(-2.6, 0.3, 0); roomG.add(bed);
  const pillow = box(1.4, 0.25, 0.7, 0xeeeeee); pillow.position.set(-2.6, 0.72, -1.1); roomG.add(pillow);
  const desk = box(1.6, 1.0, 0.8, 0x6a4a2a); desk.position.set(2.8, 0.5, -1.6); roomG.add(desk); }
const roomWinM = new THREE.MeshBasicMaterial({ color: 0x0a1030, toneMapped: false });
const roomWin = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), roomWinM); roomWin.position.set(-3.88, 2.6, 1.6); roomWin.rotation.y = Math.PI / 2; roomG.add(roomWin);
const closet = box(1.8, 3.2, 0.9, 0x5a3e26); closet.position.set(1.2, 1.6, -2.45); roomG.add(closet);
const closetIn = box(1.5, 2.9, 0.1, mat(0x3a4258, { emissive: 0x2a3550, emissiveIntensity: 1.2 })); closetIn.position.set(1.2, 1.55, -1.98); closetIn.castShadow = false; roomG.add(closetIn);
const closetDoor = new THREE.Group(); closetDoor.position.set(0.45, 0, -1.95); roomG.add(closetDoor);
{ const dd = box(1.5, 2.9, 0.08, 0x6a4a2e); dd.position.set(0.75, 1.55, 0); closetDoor.add(dd); const kn = box(0.1, 0.1, 0.1, 0xd4a017); kn.position.set(1.3, 1.5, 0.08); closetDoor.add(kn); }
const roomLamp = new THREE.PointLight(0xffc890, 0, 12, 1.5); roomLamp.position.set(0, 4.3, 0.5); roomG.add(roomLamp);
const wallTex = canvasTex(1024, 768, () => {});
function drawWall(r) {
  const g = wallTex.userData.canvas.getContext('2d'); g.clearRect(0, 0, 1024, 768);
  [['THEY LIED.', 200, 150], ['IT\'S NOT A', 420, 130], ['SUNRISE.', 630, 150]].forEach(([txt, y, size], i) => {
    const rr = clamp(r * 3 - i); if (rr <= 0) return;
    g.save(); g.beginPath(); g.rect(0, y - 110, 60 + 900 * rr, 220); g.clip();
    g.font = `900 ${size}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 25; g.fillStyle = 'rgba(8,8,12,0.95)'; g.fillText(txt, 512, y);
    for (let k = 0; k < 8; k++) { g.fillRect(150 + k * 95 + (k * 37 % 40), y + size * 0.35, 9, 30 + (k * 53 % 90) * rr); }
    g.restore(); });
  wallTex.needsUpdate = true;
}
drawWall(0);
const writing = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), new THREE.MeshBasicMaterial({ map: wallTex, transparent: true, depthWrite: false })); writing.position.set(-1.6, 2.7, -2.88); roomG.add(writing);

// ---------- factory interior (at z = -60) ----------
const FAC = v3(0, 0, -60);
const facG = new THREE.Group(); facG.position.copy(FAC); scene.add(facG);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), mat(0x2a2420, { roughness: 1 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; facG.add(fl);
  const bw = box(30, 14, 0.4, 0x3a2a24); bw.position.set(0, 7, -9); facG.add(bw);
  for (const sx of [-1, 1]) { const sw = box(0.4, 14, 22, 0x3a2a24); sw.position.set(12 * sx, 7, 2); facG.add(sw); }
  for (const [x, z, s] of [[-3.2, 6.5, 1.2], [-4.3, 6.9, 0.9], [3.6, 7.0, 1.1]]) { const c = box(s, s, s, 0x6b4a2b); c.position.set(x, s / 2, z); facG.add(c); }
  for (const [x, z] of [[-4.5, -1], [4.5, -1], [-4.5, -5], [4.5, -5]]) { const p = box(0.3, 9, 0.3, 0x55504a); p.position.set(x, 4.5, z); facG.add(p); }
  const plat = box(9.3, 0.25, 1.2, 0x55504a); plat.position.set(0, 2.6, 0.6); facG.add(plat); }
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffa040, toneMapped: false, side: THREE.DoubleSide });
const bigSun = new THREE.Mesh(new THREE.SphereGeometry(3.0, 40, 24, 0, Math.PI * 1.55), sunMat); bigSun.position.set(0, 5.2, -3.2); facG.add(bigSun);
const sunCage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3.25, 1)), new THREE.LineBasicMaterial({ color: 0x8a7a6a })); sunCage.position.copy(bigSun.position); facG.add(sunCage);
const sunLight = new THREE.PointLight(0xffa050, 0, 30, 1.2); sunLight.position.set(0, 5.2, 0.5); facG.add(sunLight);
const sparks = []; { const r = rng(55); for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: 0xffd070, toneMapped: false })); m.userData = { a: r() * 6.28, r: 2.6 + r() * 1.2, y: 2.5 + r() * 5, sp: 0.5 + r(), ph: r() * 6 }; facG.add(m); sparks.push(m); } }

// ---------- characters ----------
const theo = makeAvatar({ skin: 0xe8b98a, hair: 0x5a3a1e, hairStyle: 'cap', top: 0x3a8a5a, stripe: 0xe8e8e8, legs: 0x4a4a52, shoes: 0xf0f0f0 });
const mom = makeAvatar({ skin: 0xe8b98a, hair: 0x5a3a1e, hairStyle: 'pigtails', top: 0x4a6ab0, legs: 0x2a2a3a, shoes: 0x222222 });
const TOWN_STYLES = [
  { skin: 0xc68642, hair: 0x2c1b10, hairStyle: 'short', top: 0xb0503a, legs: 0x333333, shoes: 0x222222 },
  { skin: 0xffdbac, hair: 0xb0b0b0, hairStyle: 'short', top: 0x7a6a9a, legs: 0x3d3d3d, shoes: 0x444444 },
  { skin: 0x8d5524, hair: 0x111111, hairStyle: 'pigtails', top: 0xd4a017, legs: 0x2c3e50, shoes: 0x222222 },
  { skin: 0xf1c27d, hair: 0x7f4f24, hairStyle: 'short', top: 0x2e86de, legs: 0x1f2a44, shoes: 0x111111 },
];
const town = TOWN_STYLES.map(s => makeAvatar(s));
scene.add(theo, mom, ...town);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x040406, transparent: true, opacity: 0.9, depthWrite: true });
function makeShadow(style, scale = 1) {
  const a = makeAvatar(style);
  a.traverse(o => { if (o.isMesh) { if (o.material === a.userData.P.faceM) o.visible = false; else { o.material = shadowMat; o.castShadow = false; o.receiveShadow = false; } } });
  const holder = new THREE.Group(); holder.add(a); a.scale.setScalar(scale); holder.userData.av = a; scene.add(holder);
  return holder;
}
const townShadows = TOWN_STYLES.map(s => makeShadow(s));
const theoShadow = makeShadow({ skin: 0, hair: 0, hairStyle: 'cap', top: 0, legs: 0, shoes: 0 });
const WORKER_STYLES = Array.from({ length: 8 }, (_, i) => ({ skin: 0, hair: 0, hairStyle: ['short', 'cap', 'pigtails', 'short'][i % 4], top: 0, legs: 0, shoes: 0 }));
const workers = WORKER_STYLES.map(s => makeShadow(s));
const foreman = makeShadow({ skin: 0, hair: 0, hairStyle: 'short', top: 0, legs: 0, shoes: 0 }, 1.5);
{ const fa = foreman.userData.av; const hat = box(0.6, 0.7, 0.6, shadowMat); hat.castShadow = false; hat.position.set(0, 0.85, 0); fa.userData.P.head.add(hat);
  const brim = box(1.0, 0.08, 1.0, shadowMat); brim.castShadow = false; brim.position.set(0, 0.5, 0); fa.userData.P.head.add(brim);
  const eyeM = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.07), eyeM); e.position.set(0.15 * sx, 0.05, 0.38); fa.userData.P.head.add(e); } }
function setCast(av, on) { av.traverse(o => { if (o.isMesh && o.material !== av.userData.P.faceM) o.castShadow = on; }); }
// k: 0 = lying flat on the ground (pointing away from the light), 1 = standing
function placeShadow(h, x, z, rotY, k, walkPhase = null, amt = 0.5) {
  h.visible = true; h.position.set(x, 0.02, z); h.rotation.set(0, rotY, 0);
  const a = h.userData.av; a.rotation.set(lerp(-Math.PI / 2, 0, k), 0, 0); a.position.set(0, 0, 0);
  const s = a.scale.x; a.scale.set(s, s * lerp(1.5, 1, k), s);
  pose(a, walkPhase === null ? {} : walkPose(walkPhase, amt));
}
function shadowStand(h, k) { const a = h.userData.av; const s = a.scale.x; a.scale.set(s, s * lerp(1.5, 1, k), s); }

// ---------- time of day ----------
const TOD = {
  dusk: { bg: 0x5a3858, sky: 0xffa070, gnd: 0x202030, hemi: 0.75, sun: 0xff9a60, sunI: 2.2, sunPos: [-24, 7, 6], lamps: 0.3, win: 0.6, fog: 0.016 },
  night: { bg: 0x0a0e1e, sky: 0x3a4a7a, gnd: 0x101018, hemi: 0.55, sun: 0x9ab0ff, sunI: 0.9, sunPos: [-12, 22, 10], lamps: 1, win: 1, fog: 0.02 },
  morning: { bg: 0x9fd0ff, sky: 0xffffff, gnd: 0x557755, hemi: 1.1, sun: 0xfff0d0, sunI: 2.8, sunPos: [22, 9, 12], lamps: 0, win: 0, fog: 0.008 },
};
function setTOD(name, focus = v3(0, 0, 0)) {
  const d = TOD[name];
  scene.background.setHex(d.bg); scene.fog.color.setHex(d.bg); scene.fog.density = d.fog;
  hemi.color.setHex(d.sky); hemi.groundColor.setHex(d.gnd); hemi.intensity = d.hemi;
  sun.color.setHex(d.sun); sun.intensity = d.sunI;
  sun.position.set(focus.x + d.sunPos[0], d.sunPos[1], focus.z + d.sunPos[2]); sun.target.position.copy(focus);
  lampMats.forEach(m => m.emissiveIntensity = d.lamps * 2.2); lampLights.forEach(l => l.intensity = d.lamps * 18);
  windowMats.forEach(m => m.emissiveIntensity = d.win * 1.6); factWinM.emissiveIntensity = d.win * 2.5;
}

// ---------- DOM ----------
const $ = id => document.getElementById(id);
function setText(id, html, op = 1) { const e = $(id); if (e.innerHTML !== html) e.innerHTML = html; e.style.opacity = op; }
const SPK_COLOR = { N: '#ffffff', T: '#8fe3a0', MO: '#ffb3c7', F: '#c9c9ff' };
const S = Object.fromEntries(TL.scenes.map(s => [s.id, s]));
const ALL = [theo, mom, ...town];
const SHADOWS = [...townShadows, theoShadow, ...workers, foreman];
const TOWN_POS = [[-5.5, 3.0], [-2.0, 2.8], [3.0, 3.1], [6.5, 2.9]];

window.renderAt = function (t) {
  ALL.forEach(a => { a.visible = false; setCast(a, true); a.position.y = 0; a.rotation.set(0, 0, 0); });
  SHADOWS.forEach(h => h.visible = false);
  const sc = TL.scenes.find(s => t >= s.start && t < s.end) || TL.scenes[TL.scenes.length - 1];
  const lt = t - sc.start, dur = sc.end - sc.start, u = clamp(lt / dur);
  let camPos = v3(0, 3, 10), look = v3(0, 2, 0), fov = 52, tod = 'night', focus = v3(0, 0, 0);
  let flash = 0, flashCol = '#000', tint = 0, big = '', sub = '', bop = 0, bigColor = '#ffffff', shake = 0;
  let curtainK = 0, closetK = 0, wallK = 0, fadeHand = 0, roomLight = 0, roomWin = 0x0a1030, sunGlow = 0, flicker = 0;
  let towerH = 9, towerM = 0;
  setFace(theo, 'smile'); setFace(mom, 'smile'); town.forEach(a => setFace(a, 'smile'));
  [theo, mom, ...town].forEach(a => pose(a));
  const theoHand = theo.userData.P.armR.children[1];

  switch (sc.id) {
    case 1: { // dusk, 8:59, people walking home with long shadows
      tod = 'dusk'; towerH = 8; towerM = 59;
      town.forEach((a, i) => { const [x, z] = TOWN_POS[i]; const xx = x + (i % 2 ? -1 : 1) * lt * 0.9; place(a, xx, z, i % 2 ? -Math.PI / 2 : Math.PI / 2); pose(a, walkPose(t * 6 + i, 0.5)); });
      camPos = lerpV(v3(2, 12, 18), v3(1, 7, 12), ease(u)); look = lerpV(v3(-4, 6, -10), v3(-2, 3, -6), ease(u));
      break;
    }
    case 2: { // nine o'clock: shadows peel off and walk away
      tod = 'dusk'; towerH = 9; towerM = 0;
      const tp = vs('peels') - 0.2;
      town.forEach((a, i) => {
        const [x, z] = TOWN_POS[i]; place(a, x, z, faceTo(x, z, -6, -15)); setFace(a, 'blank');
        const pk = clamp((t - tp - i * 0.25) / 1.4);
        setCast(a, pk <= 0);
        if (pk > 0) {
          const wk = clamp((t - vs('factory') - i * 0.2) / 5);
          const sx = x + 0.9 + wk * 18, sz = z - 0.2 - wk * 2.5;
          placeShadow(townShadows[i], wk > 0 ? sx : x + 0.9, wk > 0 ? sz : z - 0.2, wk > 0 ? faceTo(x, z, x + 18, z - 2.5) : Math.PI / 2, ease(pk), wk > 0 ? t * 6 + i : null);
          if (pk < 1) townShadows[i].rotation.y = Math.PI / 2 + 0;
        }
      });
      if (t < vs('peels') - 0.3) { camPos = lerpV(v3(-4.5, 8.0, -9.0), v3(-4.8, 8.4, -10.5), ease((t - sc.start) / 3)); look = v3(-6, 8.6, -13.4); }
      else if (t < vs('factory') - 0.1) { camPos = lerpV(v3(-0.5, 3.4, 12.5), v3(-0.3, 3.0, 11.0), ease((t - vs('peels')) / 3)); look = v3(0, 1.0, 2.6); fov = 56; }
      else { camPos = lerpV(v3(2, 3.5, 9), v3(8, 3.5, 9), ease((t - vs('factory')) / 4.5)); look = lerpV(v3(4, 1.5, 2), v3(14, 2, -4), ease((t - vs('factory')) / 4.5)); }
      break;
    }
    case 3: { // sunrise: shadows come back
      tod = 'morning'; towerH = 6; towerM = 0;
      town.forEach((a, i) => {
        const [x, z] = TOWN_POS[i]; place(a, x, z, faceTo(x, z, 0, 10)); setFace(a, 'smile');
        const back = clamp((t - sc.start - 0.4 - i * 0.4) / 2.4);
        setCast(a, back >= 1);
        if (back < 1) { const wk = 1 - clamp(back * 1.6); placeShadow(townShadows[i], x - 1.2 + wk * 10, z - 1.0 - wk * 1.5, faceTo(x + 10, z - 2.5, x, z), back > 0.62 ? 1 - ease((back - 0.62) / 0.38) : 1, t * 6 + i); }
      });
      camPos = lerpV(v3(0, 4.5, 11), v3(0, 3.6, 9), ease(u)); look = v3(0, 1.2, 2.5); focus = v3(0, 0, 3);
      break;
    }
    case 4: { // Theo on the balcony: goodnight, shadow
      tod = 'night'; towerH = 9; towerM = 0;
      place(theo, 1.4, -5.0, 0, 2.65); setFace(theo, 'smile'); setCast(theo, false);
      const wave = t > vs('goodnight') - 0.2 && t < vs('waved') + 1.0;
      pose(theo, wave ? { armRx: -2.7, armRz: 0.3 + Math.sin(t * 10) * 0.3 } : {});
      const sk = clamp((t - vs('waved')) / 0.8);
      placeShadow(theoShadow, 1.6, -1.5, Math.PI, 1);
      pose(theoShadow.userData.av, t > vs('waved') ? { armRx: -2.7, armRz: 0.3 + Math.sin(t * 10) * 0.3 } : { headX: -0.4 });
      theoShadow.userData.av.userData.P.head.rotation.x = -0.45;
      if (t < vs('goodnight') - 0.2) { camPos = lerpV(v3(5, 4.5, 6), v3(4, 4.0, 4.5), ease((t - sc.start) / 4)); look = v3(1.4, 3.4, -5); }
      else if (t < vs('waved') - 0.1) { camPos = v3(2.6, 3.9, -1.2); look = v3(1.4, 3.9, -5.0); }
      else { camPos = lerpV(v3(4.6, 1.1, 1.8), v3(4.2, 1.2, 1.2), ease((t - vs('waved')) / 3)); look = v3(1.4, 2.8, -3.6); fov = 58; }
      break;
    }
    case 5: { // the morning without a shadow
      tod = 'morning'; towerH = 7; towerM = 30; focus = v3(1, 0, 3);
      place(theo, 1.2, 3.0, Math.PI / 2 + 0.6); setFace(theo, t < vs('didnt') ? 'smile' : 'shock'); setCast(theo, false);
      town.forEach((a, i) => { if (i > 1) return; const [x, z] = [[-3.4, 2.4], [6.0, 3.7]][i]; place(a, x + (i ? -1 : 1) * lt * 0.4, z, i ? -Math.PI / 2 : Math.PI / 2); pose(a, walkPose(t * 6 + i, 0.4)); });
      if (t < vs('didnt') - 0.2) { camPos = lerpV(v3(1.2, 2.4, 9.5), v3(1.2, 2.3, 8.3), ease(u * 2)); look = v3(1.2, 1.6, 3.0); }
      else { camPos = lerpV(v3(1.4, 8.0, 9.0), v3(1.3, 7.2, 8.0), ease((t - vs('didnt')) / 3)); look = v3(1.2, 0.2, 2.8); fov = 54; }
      break;
    }
    case 6: { // Mom: nobody can know / fading
      if (t < vs('fade') - 0.2) {
        tod = 'morning'; towerH = 7; towerM = 31; focus = v3(1, 0, -2);
        const pull = ease((t - vs('noone') + 0.6) / 1.4);
        place(theo, lerp(1.2, 1.6, pull), lerp(-1.6, -5.0, pull), lerp(Math.PI, Math.PI, 1)); setCast(theo, false); setFace(theo, 'worried');
        place(mom, lerp(1.0, 1.4, pull), lerp(-2.6, -5.6, pull), pull > 0.05 ? Math.PI : 0); setFace(mom, t < vs('noone') ? 'shock' : 'worried');
        pose(mom, { armRx: -1.4, armLx: -0.4 });
        curtainK = clamp((t - vs('noone') - 1.0) / 1.0);
        if (t < vs('noone') - 0.1) { camPos = v3(2.4, 2.3, 0.6); look = v3(1.0, 2.2, -2.6); }
        else { camPos = lerpV(v3(3.5, 3.4, 4.5), v3(3.0, 3.6, 3.6), ease((t - vs('noone')) / 3)); look = v3(0.0, 2.6, -5.4); }
      } else { // in his room: the hand starts to fade
        tod = 'night'; roomLight = 1; roomWin = 0x9fd0ff;
        place(theo, ROOM.x + 0.2, ROOM.z + 0.6, 0); setCast(theo, false); setFace(theo, 'shock');
        pose(theo, { armRx: -1.3, armRz: 0.2, headX: 0.35 });
        fadeHand = ease((t - vs('fade') - 1.2) / 2.2);
        theo.updateMatrixWorld(true); const hp = theoHand.getWorldPosition(new THREE.Vector3());
        camPos = lerpV(hp.clone().add(v3(1.2, 1.0, 3.4)), hp.clone().add(v3(0.9, 0.8, 2.6)), ease((t - vs('fade')) / 4)); look = hp.clone().add(v3(-0.2, 0.3, 0)); fov = 54;
      }
      break;
    }
    case 7: { // the decision, then following the shadows
      if (t < vs('thatnight') - 0.2) {
        tod = 'night'; roomLight = 0.6;
        place(theo, ROOM.x + 0.2, ROOM.z + 0.6, 0); setCast(theo, false); setFace(theo, 'determined'); fadeHand = 1;
        camPos = lerpV(v3(ROOM.x + 0.3, 2.3, ROOM.z + 2.6), v3(ROOM.x + 0.25, 2.3, ROOM.z + 2.2), ease(u * 2)); look = v3(ROOM.x + 0.2, 2.25, ROOM.z + 0.6);
      } else {
        tod = 'night'; towerH = 9; towerM = 1; focus = v3(8, 0, 0);
        const k = (t - vs('thatnight'));
        workers.slice(0, 5).forEach((h, i) => { placeShadow(h, -3 + i * 1.6 + k * 1.3, -0.8 + (i % 2) * 1.2, Math.PI / 2, 1, t * 6 + i); });
        const tx = -6.5 + k * 1.3;
        place(theo, tx, 1.8, Math.PI / 2); setCast(theo, false); setFace(theo, 'worried'); fadeHand = 1;
        pose(theo, walkPose(t * 5, 0.35, { bodyX: 0.35 }));
        camPos = v3(tx - 3.2, 1.6, 4.6); look = v3(tx + 3, 1.2, 0.2); fov = 56;
      }
      break;
    }
    case 8: { // inside the factory
      tod = 'night'; focus = FAC.clone(); sunGlow = 1;
      const spots = [[-3.5, 0.6, 2.75], [-1.5, 0.6, 2.75], [1.5, 0.6, 2.75], [3.5, 0.6, 2.75], [-2.6, -0.4, 0], [2.6, -0.4, 0], [-1.0, 1.8, 0], [1.2, 1.8, 0]];
      workers.forEach((h, i) => { const [x, z, y] = spots[i]; placeShadow(h, FAC.x + x, FAC.z + z, Math.PI, 1); h.position.y = y + 0.02;
        const hit = Math.max(0, Math.sin(t * 6 + i * 1.3)); pose(h.userData.av, { armRx: -2.4 + hit * 1.4, armLx: -0.6 }); });
      const tw = vs('watching');
      placeShadow(foreman, FAC.x + 0.8, FAC.z + 3.4, t < vs('short') - 0.3 ? Math.PI : 0, 1);
      place(theo, FAC.x - 3.4, FAC.z + 7.6, Math.PI - 0.3); setCast(theo, false); setFace(theo, 'shock'); fadeHand = 1;
      if (t < vs('short') - 0.2) { camPos = lerpV(v3(FAC.x - 4.2, 2.6, FAC.z + 10.5), v3(FAC.x - 3.6, 2.8, FAC.z + 9.6), ease((t - sc.start) / 4)); look = v3(FAC.x, 4.0, FAC.z - 2); fov = 58; }
      else if (t < vs('sunrise2') - 0.1) { camPos = lerpV(v3(FAC.x + 0.4, 2.9, FAC.z + 6.6), v3(FAC.x + 0.5, 3.0, FAC.z + 6.1), ease((t - vs('short')) / 4)); look = v3(FAC.x + 0.8, 3.1, FAC.z + 3.4); }
      else { camPos = lerpV(v3(FAC.x + 1.5, 4.5, FAC.z + 6.5), v3(FAC.x + 0.8, 5.0, FAC.z + 4.8), ease((t - vs('sunrise2')) / 4)); look = v3(FAC.x, 5.2, FAC.z - 3.2); fov = 56; }
      break;
    }
    case 9: { // someone's watching -> run
      tod = 'night'; focus = FAC.clone(); sunGlow = 1;
      if (t < vs('ran') - 0.1) {
        placeShadow(foreman, FAC.x + 0.8, FAC.z + 3.4, faceTo(0.8, 3.4, -3.4, 7.6) * ease((t - sc.start) / 0.8), 1);
        place(theo, FAC.x - 3.4, FAC.z + 7.6, Math.PI - 0.3); setCast(theo, false); setFace(theo, 'shock'); fadeHand = 1;
        camPos = lerpV(v3(FAC.x - 0.6, 3.6, FAC.z + 5.8), v3(FAC.x - 0.2, 3.7, FAC.z + 5.3), ease(u * 2)); look = v3(FAC.x + 0.8, 3.4, FAC.z + 3.4);
      } else {
        focus = v3(10, 0, 0);
        const k = t - vs('ran'); const tx = 14 - k * 4.5;
        place(theo, tx, 1.5, -Math.PI / 2); setCast(theo, false); setFace(theo, 'shock'); fadeHand = 1;
        pose(theo, walkPose(t * 15, 0.95, { bodyX: 0.25 }));
        camPos = v3(tx - 4.5, 2.0, 4.2); look = v3(tx, 1.5, 1.5);
      }
      break;
    }
    case 10: { // the closet
      tod = 'night'; roomLight = 0.6; flicker = 0.5;
      place(theo, ROOM.x - 0.7, ROOM.z + 1.4, faceTo(-0.7, 1.4, 1.2, -1.6)); setCast(theo, false); setFace(theo, t < vs('you') ? 'shock' : 'worried'); fadeHand = 1;
      closetK = ease((t - sc.start) / 2.5);
      const crouch = t < vs('wrote');
      placeShadow(theoShadow, ROOM.x + 1.2, ROOM.z - 1.6, 0, 1);
      const sa = theoShadow.userData.av;
      if (crouch) { sa.position.y = -0.35; pose(sa, { bodyX: 0.5, armLx: -1.8, armRx: -1.8, armLz: -0.5, armRz: 0.5, headX: 0.3, legL: -1.2, legR: -1.2 }); sa.position.x = Math.sin(t * 40) * 0.02; }
      if (t > vs('wrote') - 0.2) pose(sa, { armRx: -2.2, armRz: -0.4, headY: 0 });
      if (t > vs('wrote') + 2.2) { theoShadow.position.x = ROOM.x - 0.2; pose(sa, { armRx: -1.9 + Math.sin(t * 8) * 0.3, armRz: 0.5 }); theoShadow.rotation.y = Math.PI; }
      wallK = clamp((t - vs('wrote') - 2.2) / 3.2);
      if (t < vs('you') - 0.2) { camPos = lerpV(v3(ROOM.x + 3.0, 2.0, ROOM.z + 2.8), v3(ROOM.x + 2.6, 1.8, ROOM.z + 2.0), ease(u * 1.5)); look = v3(ROOM.x + 1.0, 1.2, ROOM.z - 1.8); }
      else if (t < vs('wrote') + 2.0) { camPos = lerpV(v3(ROOM.x + 2.6, 1.9, ROOM.z + 2.0), v3(ROOM.x + 2.3, 1.8, ROOM.z + 1.5), ease((t - vs('you')) / 4)); look = v3(ROOM.x + 1.1, 1.5, ROOM.z - 1.7); }
      else { camPos = lerpV(v3(ROOM.x + 1.4, 2.6, ROOM.z + 3.6), v3(ROOM.x + 0.5, 2.6, ROOM.z + 3.0), ease((t - vs('wrote') - 2) / 4)); look = v3(ROOM.x - 1.2, 2.6, ROOM.z - 2.9); }
      if (wallK >= 1) { big = 'THEY LIED.<br><span style="font-size:110px">IT\'S NOT A SUNRISE.</span>'; bigColor = '#ffffff'; bop = clamp((t - (vs('wrote') + 5.4)) / 0.3); }
      break;
    }
    case 11: { // nine o'clock... at midnight
      tod = 'night';
      const tick = clamp((t - vs('again') + 0.2) / 0.4);
      towerH = 12; towerM = 0;
      flicker = 0.4;
      camPos = lerpV(v3(-3.5, 6.5, -6.0), v3(-4.5, 7.6, -8.8), ease(u)); look = v3(-6, 8.6, -13.4);
      if (t >= vs('midnight')) { sub = ''; }
      tint = clamp((t - (sc.end - 3.2)) / 0.6) * 0.55;
      if (t >= sc.end - 3.2) { big = 'PART 2?'; bigColor = '#ffffff'; sub = 'What are they<br>REALLY building? 👇'; bop = clamp((t - (sc.end - 3.2)) / 0.3); }
      break;
    }
  }

  // world state
  setTOD(tod, focus);
  setTowerTime(towerH, towerM);
  curtain.scale.y = Math.max(0.01, curtainK); curtain.position.y = 3.17 + (1 - curtainK) * 0.45;
  closetDoor.rotation.y = -1.6 * closetK;
  drawWall(wallK);
  roomLamp.intensity = roomLight * 22 * (flicker ? (Math.sin(t * 31) > 0.7 ? 0.4 : 1) : 1);
  roomWinM.color.setHex(roomWin);
  theoHand.material.transparent = fadeHand > 0; theoHand.material.opacity = 1 - 0.75 * fadeHand;
  sunGlow && (sunMat.color.setRGB(1.6, 0.6 + 0.1 * Math.sin(t * 3), 0.15));
  sunLight.intensity = sunGlow * 60 * (0.9 + 0.1 * Math.sin(t * 7));
  bigSun.rotation.y = t * 0.15; sunCage.rotation.y = -t * 0.1;
  sparks.forEach(m => { const d = m.userData; const a = d.a + t * d.sp; m.position.set(Math.cos(a) * d.r, d.y + Math.sin(t * 3 + d.ph) * 0.3, -3.2 + Math.sin(a) * d.r); m.visible = sunGlow > 0; });
  if (flicker) hemi.intensity *= (Math.sin(t * 29) > 0.75 ? 0.55 : 1);

  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  const cs = shake * 0.06;
  camera.position.copy(camPos).add(v3(Math.sin(t * 83) * cs, Math.sin(t * 61) * cs, 0));
  camera.lookAt(look);
  renderer.render(scene, camera);

  // ---- overlays ----
  $('flash').style.background = flashCol; $('flash').style.opacity = flash;
  $('tint').style.opacity = tint;
  let hook = '', hookOp = 0;
  if (sc.id === 1) { hook = '<span class="series">SHADOW SHIFT · PART 1</span>'; hookOp = clamp(lt / 0.3); }
  setText('hook', hook, hookOp);
  const cap = TL.captions.find(c => t >= c.start && t < c.end + 0.12);
  const capEl = $('cap'); capEl.style.color = cap ? SPK_COLOR[cap.spk] : '#fff';
  setText('cap', cap ? cap.text : '', cap ? 1 : 0);
  $('big').style.color = bigColor;
  setText('big', big, bop); setText('sub', sub, bop);
  setText('sys', '', 0);
  return true;
};
window.DURATION = TL.duration;
window.READY = true;
