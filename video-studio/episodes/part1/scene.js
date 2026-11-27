import * as THREE from 'three';

const TL = await (await fetch('./timeline.json')).json();
const W = 1080, H = 1920;

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const ease = u => { u = clamp(u); return u * u * (3 - 2 * u); };
const easeOut = u => 1 - Math.pow(1 - clamp(u), 3);
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

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const FOG_BASE = new THREE.Color(0x0b0e18), FOG_RED = new THREE.Color(0x3a0507);
scene.background = FOG_BASE.clone();
scene.fog = new THREE.FogExp2(FOG_BASE.clone(), 0.045);
const camera = new THREE.PerspectiveCamera(52, W / H, 0.05, 100);

const hemi = new THREE.HemisphereLight(0x5a6aa0, 0x121018, 1.3); scene.add(hemi);
const moon = new THREE.DirectionalLight(0x9aa8ff, 1.4);
moon.position.set(6, 14, 8); moon.target.position.set(0, 0, -3);
moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
Object.assign(moon.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
scene.add(moon, moon.target);
const doorLight = new THREE.PointLight(0xff2020, 25, 16, 1.6); doorLight.position.set(0, 3, -4.6); scene.add(doorLight);
const innerLight = new THREE.PointLight(0xff1a10, 0, 22, 1.4); innerLight.position.set(0.3, 2.6, -5.4); scene.add(innerLight);
const lampL = new THREE.PointLight(0xffc68a, 6, 7, 1.8); lampL.position.set(-3.2, 4.2, -5.5); scene.add(lampL);
const lampR = lampL.clone(); lampR.position.x = 3.2; scene.add(lampR);
const fill = new THREE.PointLight(0xffe8d8, 4, 9, 1.4); camera.add(fill); fill.position.set(0.3, 0.4, 0); scene.add(camera);

// ---------- lobby ----------
const floorTex = canvasTex(512, 512, (g, w, h) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    g.fillStyle = (x + y) % 2 ? '#2b2e38' : '#34384a'; g.fillRect(x * 64, y * 64, 64, 64);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3; g.strokeRect(x * 64, y * 64, 64, 64);
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(5, 5);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat(0xffffff, { map: floorTex, roughness: 0.9 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

const wallTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#23263a'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 5; c++) {
    const off = r % 2 ? 51 : 0;
    g.fillStyle = `hsl(232,18%,${15 + ((r * 7 + c * 3) % 5)}%)`;
    g.fillRect(c * 102 + off + 3, r * 64 + 3, 96, 58);
  }
});
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(6, 3);
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), mat(0xffffff, { map: wallTex }));
backWall.position.set(0, 6, -6.3); backWall.receiveShadow = true; scene.add(backWall);
for (const sx of [-1, 1]) {
  const sw = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), mat(0xffffff, { map: wallTex }));
  sw.position.set(9 * sx, 6, 4); sw.rotation.y = -sx * Math.PI / 2; scene.add(sw);
}

// wall lamps
for (const sx of [-1, 1]) {
  const l = box(0.35, 0.5, 0.25, mat(0xffd9a0, { emissive: 0xffb060, emissiveIntensity: 2.2 }));
  l.position.set(3.2 * sx, 4.3, -6.15); l.castShadow = false; scene.add(l);
}

// "keep out" half ring on the floor
const ring = new THREE.Mesh(new THREE.RingGeometry(2.45, 2.6, 48, 1, Math.PI, Math.PI),
  new THREE.MeshBasicMaterial({ color: 0x8a0f14, transparent: true, opacity: 0.75 }));
ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.02, -6.0); scene.add(ring);

// crates
for (const [x, z, s, r] of [[-6.5, -4.8, 1.2, 0.3], [-5.4, -5.3, 0.9, -0.2], [6.2, -4.5, 1.3, 0.5], [6.4, -2.9, 0.8, 0.1]]) {
  const c = box(s, s, s, 0x6b4a2b); c.position.set(x, s / 2, z); c.rotation.y = r; scene.add(c);
}

// ---------- the red door ----------
const DOOR_Z = -6.05, DW = 3, DH = 5;
const frameM = mat(0x2a1a12);
for (const [x, y, w, h] of [[-1.7, DH / 2, 0.4, DH + 0.4], [1.7, DH / 2, 0.4, DH + 0.4], [0, DH + 0.2, 3.8, 0.4]]) {
  const f = box(w, h, 0.5, frameM); f.position.set(x, y, DOOR_Z - 0.05); scene.add(f);
}
const glowMat = new THREE.MeshBasicMaterial({ color: 0xff2a18, toneMapped: false });
const glow = new THREE.Mesh(new THREE.PlaneGeometry(DW, DH), glowMat);
glow.position.set(0, DH / 2, DOOR_Z - 0.18); scene.add(glow);

const doorPivot = new THREE.Group(); doorPivot.position.set(-DW / 2, 0, DOOR_Z); scene.add(doorPivot);
const doorShake = new THREE.Group(); doorPivot.add(doorShake);
const slabM = mat(0x9e0f18, { emissive: 0x1c0000, emissiveIntensity: 1, roughness: 0.55 });
const slab = box(DW, DH, 0.22, slabM); slab.position.set(DW / 2, DH / 2, 0); doorShake.add(slab);
// panels
for (const [x, y, w, h] of [[0.78, 3.6, 1.05, 1.7], [2.22, 3.6, 1.05, 1.7], [0.78, 1.35, 1.05, 2.0], [2.22, 1.35, 1.05, 2.0]]) {
  const p = box(w, h, 0.06, mat(0x8f0c14, { emissive: 0x200000 })); p.position.set(x, y, 0.13); doorShake.add(p);
}
// handle (pivot so it can turn)
const handlePivot = new THREE.Group(); handlePivot.position.set(DW - 0.35, 2.3, 0.2); doorShake.add(handlePivot);
const gold = mat(0xd4a017, { metalness: 0.8, roughness: 0.3, emissive: 0x332200 });
const knob = box(0.16, 0.16, 0.16, gold); handlePivot.add(knob);
const lever = box(0.42, 0.09, 0.1, gold); lever.position.set(-0.2, 0, 0.08); handlePivot.add(lever);
// light leaking from the edge
const edgeGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.06, DH), new THREE.MeshBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0 }));
edgeGlow.position.set(DW / 2 - 0.02, DH / 2, DOOR_Z + 0.13); scene.add(edgeGlow);

// scratched words on the door
const wordsTex = canvasTex(1024, 1024, () => {});
const wordsMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.7), new THREE.MeshBasicMaterial({ map: wordsTex, transparent: true, depthWrite: false }));
wordsMesh.position.set(DW / 2, 2.7, 0.175); doorShake.add(wordsMesh);
function drawWords(r1, r2) {
  const c = wordsTex.userData.canvas, g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 1024);
  const lines = [['MILO...', 300, r1], ['YOUR', 560, r2], ['TURN.', 790, clamp(r2 * 2 - 1)]];
  const reveal = [r1, clamp(r2 * 2), clamp(r2 * 2 - 1)];
  lines.forEach(([txt, y], i) => {
    g.save();
    g.beginPath(); g.rect(0, 0, 80 + 880 * reveal[i], 1024); g.clip();
    g.font = '900 210px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = '#ffffff'; g.shadowBlur = 40; g.fillStyle = '#fff3f0';
    g.fillText(txt, 512, y);
    g.shadowBlur = 0; g.strokeStyle = 'rgba(60,0,0,.6)'; g.lineWidth = 4;
    for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(130 + k * 140, y - 70); g.lineTo(170 + k * 140, y + 70); g.stroke(); }
    g.restore();
  });
  wordsTex.needsUpdate = true;
}
drawWords(0, 0);

// warning sign
const signTex = canvasTex(512, 384, (g, w, h) => {
  g.fillStyle = '#7a5230'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#6d4828' : '#84592f'; g.fillRect(0, i * 64, w, 60); }
  g.strokeStyle = '#3b2412'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  g.textAlign = 'center'; g.fillStyle = '#ffe9a8'; g.font = '900 62px Inter'; g.fillText('RULE #1', w / 2, 95);
  g.fillStyle = '#ff2a2a'; g.font = '900 64px Inter';
  g.fillText('NEVER OPEN', w / 2, 200); g.fillText('THE RED DOOR', w / 2, 285);
  g.fillStyle = '#ffe9a8'; g.font = '700 34px Inter'; g.fillText('- the admins', w / 2, 345);
});
const sign = new THREE.Group(); sign.position.set(2.85, 0, -5.0); sign.rotation.y = -0.35; scene.add(sign);
const post = box(0.16, 2.2, 0.16, 0x4a301b); post.position.y = 1.1; sign.add(post);
const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.08), [mat(0x6d4828), mat(0x6d4828), mat(0x6d4828), mat(0x6d4828), mat(0xffffff, { map: signTex, emissive: 0x221100 }), mat(0x6d4828)]);
board.position.set(0, 2.45, 0.1); board.castShadow = true; sign.add(board);

// wall clock
const clockG = new THREE.Group(); clockG.position.set(-4.3, 5.1, -6.22); scene.add(clockG);
const faceTex = canvasTex(512, 512, (g, w) => {
  g.fillStyle = '#f2ead6'; g.beginPath(); g.arc(256, 256, 250, 0, Math.PI * 2); g.fill();
  g.lineWidth = 26; g.strokeStyle = '#2a1a12'; g.stroke();
  g.fillStyle = '#1a1a1a'; g.font = '900 64px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; g.fillText(String(i), 256 + Math.sin(a) * 180, 256 - Math.cos(a) * 180); }
});
const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.85, 48), mat(0xffffff, { map: faceTex, emissive: 0x111111 }));
clockG.add(clockFace);
const hourHand = new THREE.Group(), minHand = new THREE.Group(); clockG.add(hourHand, minHand);
const hh = box(0.07, 0.42, 0.03, 0x111111); hh.position.set(0, 0.19, 0.03); hourHand.add(hh);
const mh = box(0.045, 0.66, 0.03, 0x8a0000); mh.position.set(0, 0.31, 0.05); minHand.add(mh);
function setClock(minutesBefore) { // 0 = midnight
  const m = (60 - minutesBefore) % 60;
  minHand.rotation.z = -m / 60 * Math.PI * 2;
  hourHand.rotation.z = -((11 + m / 60) % 12 + (minutesBefore === 0 ? 1 : 0)) / 12 * Math.PI * 2;
}

// ---------- avatars ----------
const faceCache = new Map();
function faceTexture(expr) {
  if (faceCache.has(expr)) return faceCache.get(expr);
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = '#141414'; g.strokeStyle = '#141414'; g.lineCap = 'round'; g.lineWidth = 12;
    const eye = (x, y, w, h) => { g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, 10); g.fill(); };
    if (expr === 'laugh') {
      for (const x of [80, 176]) { g.beginPath(); g.arc(x, 105, 22, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      g.beginPath(); g.moveTo(70, 160); g.quadraticCurveTo(128, 240, 186, 160); g.closePath(); g.fill();
      g.fillStyle = '#c0392b'; g.beginPath(); g.ellipse(128, 195, 26, 12, 0, 0, Math.PI * 2); g.fill();
    } else if (expr === 'shock') {
      for (const x of [80, 176]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, 100, 30, 0, Math.PI * 2); g.fill(); g.lineWidth = 6; g.stroke(); g.fillStyle = '#141414'; g.beginPath(); g.arc(x, 104, 9, 0, Math.PI * 2); g.fill(); }
      g.lineWidth = 10; g.beginPath(); g.moveTo(50, 50); g.lineTo(105, 58); g.moveTo(206, 50); g.lineTo(151, 58); g.stroke();
      g.beginPath(); g.ellipse(128, 190, 24, 32, 0, 0, Math.PI * 2); g.fill();
    } else if (expr === 'worried') {
      eye(80, 110, 26, 40); eye(176, 110, 26, 40);
      g.lineWidth = 10; g.beginPath(); g.moveTo(52, 72); g.lineTo(100, 60); g.moveTo(204, 72); g.lineTo(156, 60); g.stroke();
      g.beginPath(); g.moveTo(88, 192); g.quadraticCurveTo(108, 176, 128, 190); g.quadraticCurveTo(148, 204, 168, 188); g.stroke();
    } else if (expr === 'blank') {
      eye(80, 110, 22, 22); eye(176, 110, 22, 22);
      g.lineWidth = 8; g.beginPath(); g.moveTo(100, 190); g.lineTo(156, 190); g.stroke();
    } else { // smile
      eye(80, 105, 26, 44); eye(176, 105, 26, 44);
      g.beginPath(); g.arc(128, 150, 48, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
    }
  });
  faceCache.set(expr, t); return t;
}
function nameTag(name, color = '#ffffff') {
  const t = canvasTex(512, 128, (g, w, h) => {
    g.font = '800 72px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 12; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(name, w / 2, h / 2);
    g.fillStyle = color; g.fillText(name, w / 2, h / 2);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
  s.scale.set(1.5, 0.375, 1); return s;
}

function makeAvatar(o) {
  const g = new THREE.Group();
  const P = {};
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
  const faceM = new THREE.MeshBasicMaterial({ map: faceTexture('smile'), transparent: true });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), faceM); face.position.z = 0.375; head.add(face);
  P.faceM = faceM;
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
  }
  if (o.name) { const tag = nameTag(o.name, o.tagColor); tag.position.y = 3.15; g.add(tag); P.tag = tag; }
  g.userData.P = P;
  return g;
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
function walk(av, phase, amt = 0.6) {
  const s = Math.sin(phase) * amt;
  pose(av, { legL: s, legR: -s, armLx: -s * 0.9, armRx: s * 0.9, bob: Math.abs(Math.cos(phase)) * 0.05 });
}
function place(av, x, z, rotY) { av.position.set(x, 0, z); av.rotation.y = rotY; av.visible = true; }
const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

const milo = makeAvatar({ skin: 0xf1c27d, hair: 0xe8731c, hairStyle: 'cap', top: 0xd62828, stripe: 0xf5f5f5, legs: 0x1d3557, shoes: 0xf5f5f5, name: 'Milo' });
const juno = makeAvatar({ skin: 0xe0ac69, hair: 0x8e44ad, hairStyle: 'pigtails', top: 0xf4c430, legs: 0x2b2b2b, shoes: 0x111111, skirt: 0x141414, name: 'Juno', tagColor: '#ffd23f' });
scene.add(milo, juno);
const NPC_STYLE = [
  { skin: 0xc68642, hair: 0x2c1b10, hairStyle: 'short', top: 0x2e86de, legs: 0x333333, shoes: 0x222222 },
  { skin: 0xf1c27d, hair: 0xf1c40f, hairStyle: 'crown', top: 0x6c3483, legs: 0x1b1b2f, shoes: 0x111111, name: 'ADMIN', tagColor: '#f1c40f' },
  { skin: 0x8d5524, hair: 0x111111, hairStyle: 'short', top: 0x27ae60, legs: 0x3d3d3d, shoes: 0xeeeeee },
  { skin: 0xffdbac, hair: 0x7f4f24, hairStyle: 'short', top: 0xe67e22, legs: 0x2c3e50, shoes: 0x222222 },
  { skin: 0xe0ac69, hair: 0x111111, hairStyle: 'short', top: 0x16a085, legs: 0x4a235a, shoes: 0x111111 },
  { skin: 0xf1c27d, hair: 0xb03a2e, hairStyle: 'short', top: 0x95a5a6, legs: 0x1f2a44, shoes: 0x222222 },
];
const npcs = NPC_STYLE.map(s => { const a = makeAvatar(s); scene.add(a); return a; });

// jacket on the floor + vanish particles
const jacket = new THREE.Group(); scene.add(jacket);
{ const j = box(0.95, 0.07, 0.75, 0xf4c430); j.position.y = 0.04; jacket.add(j);
  for (const sx of [-1, 1]) { const s = box(0.7, 0.07, 0.28, 0xe2b020); s.position.set(0.72 * sx, 0.04, 0.15 * sx); s.rotation.y = 0.5 * sx; jacket.add(s); } }
const parts = []; { const r = rng(7);
  for (let i = 0; i < 36; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), new THREE.MeshBasicMaterial({ color: i % 3 ? 0xb06ad8 : 0xffd23f, transparent: true }));
    m.userData = { x: (r() - 0.5) * 1.0, y: 0.3 + r() * 2.2, z: (r() - 0.5) * 0.8, vy: 0.4 + r() * 0.9, vx: (r() - 0.5) * 0.5, spin: r() * 6 };
    scene.add(m); parts.push(m);
  } }

// ---------- DOM text ----------
const $ = id => document.getElementById(id);
function setText(id, html, op = 1) { const e = $(id); if (e.innerHTML !== html) e.innerHTML = html; e.style.opacity = op; }

// ---------- per-frame state ----------
const S = Object.fromEntries(TL.scenes.map(s => [s.id, s]));
const knocks = TL.sfx.knocks;
const vo5 = TL.vo[4]; // "Then, at exactly midnight..."

function hideAll() { milo.visible = juno.visible = jacket.visible = false; npcs.forEach(n => n.visible = false); parts.forEach(p => p.visible = false); }

window.renderAt = function (t) {
  hideAll();
  const sc = TL.scenes.find(s => t >= s.start && t < s.end) || TL.scenes[TL.scenes.length - 1];
  const lt = t - sc.start, dur = sc.end - sc.start, u = clamp(lt / dur);
  let camPos = v3(0, 2.6, 6), look = v3(0, 2.5, -6);
  let midnight = t >= vo5.start + 1.4;
  let fov = 52, open = 0, handle = 0, words = [0, 0], edge = 0, shake = 0, fogRed = 0, tint = 0;
  setClock(midnight ? 0 : 1);
  setFace(milo, 'smile'); setFace(juno, 'smile');
  pose(milo); pose(juno);
  milo.userData.P.tag.visible = juno.userData.P.tag.visible = true;

  // background idlers (scenes 1-3)
  const idle = (n, i, x, z, back = 0) => { place(n, x, z + back, faceTo(x, z, 0, -6)); pose(n, { armLz: 0.05, armRz: -0.05, headX: 0.05 * Math.sin(t * 1.3 + i) }); };

  switch (sc.id) {
    case 1: {
      camPos = lerpV(v3(0, 2.7, 7.5), v3(0, 2.6, 0.8), ease(u)); look = v3(0, 2.5, -6);
      idle(npcs[0], 0, -5.5, -1.5); idle(npcs[3], 3, 5.8, -0.5); idle(npcs[2], 2, -6.5, 0.5);
      break;
    }
    case 2: {
      camPos = lerpV(v3(1.2, 2.1, -1.6), v3(0.6, 2.0, -0.6), ease(u));
      look = lerpV(v3(2.75, 2.45, -4.9), v3(0.4, 3.4, -6), ease((u - 0.35) / 0.65));
      break;
    }
    case 3: {
      place(milo, 0.7, -1.9, faceTo(0.7, -1.9, 2.2, 1.6) - 0.15);
      const laugh = Math.sin(lt * 14) * 0.06;
      setFace(milo, 'laugh');
      pose(milo, { armLz: -1.25, armLx: 0.55, armRx: -0.7, armRz: 0.35 + laugh, bodyX: -0.1 + laugh, bob: Math.abs(laugh), headX: -0.18 + laugh * 1.5, headY: 0.1 });
      for (const [i, x, z] of [[0, -2.8, -0.6], [3, -3.8, 0.4], [2, -1.9, 0.9]]) {
        idle(npcs[i], i, x, z, -0.0); npcs[i].position.z += ease(u) * 0.5; setFace(npcs[i], 'worried');
      }
      camPos = lerpV(v3(2.2, 2.0, 1.6), v3(1.9, 2.1, 1.0), ease(u)); look = v3(0.5, 1.9, -2.6);
      break;
    }
    case 4: {
      camPos = lerpV(v3(0, 10.5, 7.0), v3(0, 9.8, 5.6), ease(u)); look = v3(0, 0, -3.4);
      const lanes = [[-1, -2.6, 0.9, 0], [1, -1.6, 0.8, 1], [-1, -0.4, 1.0, 2], [1, 0.6, 0.85, 3], [-1, -1.1, 0.95, 4], [1, -3.0, 0.7, 5]];
      lanes.forEach(([dir, z, spd, i], k) => {
        const n = npcs[i]; const x = dir * (-6 + ((lt * spd * 1.6 + k * 2.3) % 12));
        // bend the path around the forbidden circle
        const zz = z - (z < -1.5 ? Math.max(0, 1.2 - Math.abs(x) * 0.4) * -1 : 0);
        place(n, x, zz, dir > 0 ? Math.PI / 2 : -Math.PI / 2); walk(n, lt * 7 + k, 0.55);
      });
      place(milo, 3.2, 1.6, faceTo(3.2, 1.6, 0, -6)); setFace(milo, 'smile');
      break;
    }
    case 5: {
      const k0 = knocks[0] - 0.35;
      if (t < k0) { // clock close-up
        camPos = lerpV(v3(-4.3, 5.1, -3.6), v3(-4.3, 5.1, -4.4), ease(lt / (k0 - sc.start)));
        look = v3(-4.3, 5.1, -6.2);
      } else {
        camPos = lerpV(v3(0.5, 2.4, 2.6), v3(0.3, 2.5, 1.4), ease((t - k0) / (sc.end - k0)));
        look = v3(0, 2.5, -6);
        place(milo, -1.1, -1.4, faceTo(-1.1, -1.4, 0, -6)); setFace(milo, 'worried');
        milo.userData.P.tag.visible = false;
      }
      for (const kt of knocks) { const d = t - kt; if (d >= 0 && d < 0.35) shake = Math.max(shake, (1 - d / 0.35)); }
      break;
    }
    case 6: {
      camPos = lerpV(v3(0.75, 2.35, -4.3), v3(0.95, 2.32, -4.9), ease(u)); look = v3(1.2, 2.3, -5.9);
      handle = ease((u - 0.1) / 0.6) * 0.9; edge = 0.35 + 0.35 * Math.sin(lt * 6);
      break;
    }
    case 7: {
      place(milo, 0.45, -2.6, Math.PI); place(juno, -0.75, -2.2, faceTo(-0.75, -2.2, 0.45, -2.6) + 0.75); fov = 62;
      setFace(milo, 'worried'); setFace(juno, 'worried');
      const g = ease((u - 0.25) / 0.25);
      pose(juno, { armRx: 0, armLx: -1.25 * g, armLz: 0.15 * g, bodyX: 0.1 * g, headY: -0.2 });
      pose(milo, { headY: -0.9 * ease((u - 0.3) / 0.3), armLx: 0.3 * g, bodyY: -0.1 * g });
      milo.userData.P.tag.visible = juno.userData.P.tag.visible = false;
      const jl = TL.vo[7];
      const onJuno = t >= jl.start - 0.2;
      if (onJuno) juno.userData.P.head.rotation.y = 0.35;
      camPos = onJuno ? lerpV(v3(-1.2, 2.3, -5.0), v3(-1.0, 2.3, -4.4), ease((t - jl.start + 0.2) / (sc.end - jl.start + 0.2)))
                      : lerpV(v3(-0.3, 2.1, -5.7), v3(-0.25, 2.1, -5.4), ease(u));
      look = onJuno ? v3(-0.75, 2.25, -2.15) : v3(-0.1, 1.8, -2.4);
      edge = 0.3;
      break;
    }
    case 8: {
      const turn = ease((u - 0.15) / 0.45);
      place(milo, 0.35, -2.6, lerp(Math.PI, 0.25, turn)); setFace(milo, 'worried');
      pose(milo, { headY: lerp(0, 0.3, turn) });
      place(juno, 0.05, -3.9, 0); setFace(juno, 'blank'); pose(juno, { armLz: 0.05, armRz: -0.05 });
      milo.userData.P.tag.visible = false; juno.userData.P.tag.visible = false;
      camPos = v3(0.9, 2.1, 0.9); look = v3(0.25, 1.9, -2.8);
      edge = 0.3;
      break;
    }
    case 9: {
      place(milo, 0.35, -2.6, lerp(0.25, Math.PI, ease(lt / 0.35))); setFace(milo, 'shock');
      pose(milo, { armLx: -0.4, armRx: -0.4, armLz: -0.3, armRz: 0.3, bodyX: 0.08 });
      milo.userData.P.tag.visible = false;
      jacket.visible = true; jacket.position.set(0.05, 0, -3.95); jacket.rotation.y = 0.4;
      parts.forEach(p => { const d = p.userData; const a = lt; p.visible = a < 2.5;
        p.position.set(0.05 + d.x + d.vx * a, d.y + d.vy * a, -3.95 + d.z); p.rotation.set(a * d.spin, a * d.spin, 0);
        p.material.opacity = clamp(1 - a / 2.5); });
      // camera between door and Milo, looking at his face; jacket in the foreground
      camPos = lerpV(v3(1.0, 2.0, -5.7), v3(0.6, 2.2, -4.7), easeOut(u)); look = v3(0.35, 1.9, -2.6);
      edge = 0.5;
      break;
    }
    case 10: {
      place(milo, 0.75, -2.0, Math.PI); setFace(milo, 'shock'); milo.userData.P.tag.visible = false;
      pose(milo, { armLx: -0.3, armRx: -0.3 });
      jacket.visible = true; jacket.position.set(0.05, 0, -3.95); jacket.rotation.y = 0.4;
      camPos = lerpV(v3(2.3, 2.9, -0.6), v3(1.9, 2.8, -1.6), ease(u)); look = v3(0.1, 2.8, -6);
      words = [ease(u / 0.38), ease((u - 0.42) / 0.45)];
      edge = 0.5 + 0.3 * Math.sin(lt * 5);
      break;
    }
    case 11: {
      words = [1, 1];
      open = ease((lt - 0.8) / 4.0);
      const back = easeOut((lt - 1.6) / 2.5);
      place(milo, 0.85, lerp(-2.2, -0.9, back), Math.PI); setFace(milo, 'shock'); milo.userData.P.tag.visible = false;
      const st = Math.sin(lt * 9) * 0.25 * (back > 0 && back < 1 ? 1 : 0);
      pose(milo, { armLx: -1.4 * back, armRx: -1.2 * back, armLz: -0.3, armRz: 0.3, bodyX: -0.25 * back, legL: st, legR: -st });
      jacket.visible = true; jacket.position.set(0.05, 0, -3.95); jacket.rotation.y = 0.4;
      camPos = lerpV(v3(0.3, 2.1, 2.6), v3(0.2, 2.5, 0.3), ease(u)); look = v3(0, 2.5, -6);
      fogRed = open; edge = 0.6 * (1 - open);
      tint = clamp((t - (sc.end - 2.0)) / 0.6) * 0.45;
      shake = open > 0 && open < 1 ? 0.12 : 0;
      break;
    }
  }

  // door state
  doorPivot.rotation.y = -1.35 * open;
  handlePivot.rotation.z = handle;
  const sk = shake * 0.05;
  doorShake.position.set(Math.sin(t * 90) * sk, 0, Math.cos(t * 70) * sk * 0.6);
  drawWords(words[0], words[1]);
  edgeGlow.material.opacity = clamp(edge);

  // lights
  const fl = flick(t);
  doorLight.intensity = (midnight ? 13 : 9) * fl + shake * 18;
  innerLight.intensity = open * 90 * fl;
  glowMat.color.setRGB(1.6, 0.08 + 0.04 * Math.sin(t * 9), 0.04);
  slabM.emissiveIntensity = 1 + shake * 2 + edge * 0.6;
  hemi.intensity = midnight ? 0.75 : 1.3;
  moon.intensity = midnight ? 0.9 : 1.4;
  lampL.intensity = lampR.intensity = (midnight ? 2.5 : 6) * (0.9 + 0.1 * Math.sin(t * 13));
  scene.fog.color.copy(FOG_BASE).lerp(FOG_RED, fogRed * 0.8); scene.background.copy(scene.fog.color);

  // camera
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  const cs = shake * 0.06;
  camera.position.copy(camPos).add(v3(Math.sin(t * 83) * cs, Math.sin(t * 61) * cs, 0));
  camera.lookAt(look);
  renderer.render(scene, camera);

  // ---- overlays ----
  $('tint').style.opacity = tint;
  let hook = '', hookOp = 0;
  if (sc.id === 1) { hook = 'This server had<br><em>ONE</em> rule.'; hookOp = clamp(lt / 0.25); }
  if (sc.id === 2) { hook = '<em>NEVER</em> open<br>the red door.'; hookOp = clamp(lt / 0.2); }
  setText('hook', hook, hookOp);
  const cap = (sc.id <= 2) ? null : TL.captions.find(c => t >= c.start && t < c.end + 0.12);
  const capEl = $('cap'); capEl.classList.toggle('juno', !!(cap && cap.juno));
  setText('cap', cap ? cap.text : '', cap ? 1 : 0);
  let big = '', sub = '', bop = 0;
  if (sc.id === 5 && t >= vo5.start + 1.4 && t < knocks[0] - 0.35) { big = '12:00 AM'; bop = clamp((t - vo5.start - 1.4) / 0.15); }
  if (sc.id === 11 && t >= sc.end - 2.0) { big = 'PART 2?'; sub = 'Would <span style="color:#ff2a2a">YOU</span> open it? 👇'; bop = clamp((t - (sc.end - 2.0)) / 0.3); }
  setText('big', big, bop); setText('sub', sub, bop);
  return true;
};
window.DURATION = TL.duration;
window.READY = true;
