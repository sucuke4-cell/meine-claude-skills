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

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const FOG_BASE = new THREE.Color(0x0b0e18), FOG_RED = new THREE.Color(0x3a0507), FOG_IN = new THREE.Color(0x2a0508);
scene.background = FOG_BASE.clone();
scene.fog = new THREE.FogExp2(FOG_BASE.clone(), 0.045);
const camera = new THREE.PerspectiveCamera(52, W / H, 0.05, 100);
scene.add(camera);

const hemi = new THREE.HemisphereLight(0x5a6aa0, 0x121018, 1.3); scene.add(hemi);
const HEMI_SKY = new THREE.Color(0x5a6aa0), HEMI_IN = new THREE.Color(0xa04040);
const moon = new THREE.DirectionalLight(0x9aa8ff, 1.4);
moon.position.set(6, 14, 8); moon.target.position.set(0, 0, -1);
moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
Object.assign(moon.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 45 });
scene.add(moon, moon.target);
const doorLight = new THREE.PointLight(0xff2020, 10, 16, 1.6); doorLight.position.set(0, 3, -4.6); scene.add(doorLight);
const innerLight = new THREE.PointLight(0xff1a10, 0, 22, 1.4); innerLight.position.set(0.3, 2.6, -5.4); scene.add(innerLight);
const lampL = new THREE.PointLight(0xffc68a, 6, 7, 1.8); lampL.position.set(-3.2, 4.2, -5.5); scene.add(lampL);
const lampR = lampL.clone(); lampR.position.x = 3.2; scene.add(lampR);
const fill = new THREE.PointLight(0xffe8d8, 4, 9, 1.4); camera.add(fill); fill.position.set(0.3, 0.4, 0);
const cubeLight = new THREE.PointLight(0xff2a2a, 0, 9, 1.6); cubeLight.position.set(0, 2.2, 4.5); scene.add(cubeLight);
const insideLight = new THREE.PointLight(0xff4a3a, 0, 22, 1.2); insideLight.position.set(0, 5, 0.5); scene.add(insideLight);

// ---------- lobby ----------
const floorTex = canvasTex(512, 512, (g) => {
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
    const off = r % 2 ? 51 : 0; g.fillStyle = `hsl(232,18%,${15 + ((r * 7 + c * 3) % 5)}%)`;
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
const lampMeshes = [];
for (const sx of [-1, 1]) {
  const l = box(0.35, 0.5, 0.25, mat(0xffd9a0, { emissive: 0xffb060, emissiveIntensity: 2.2 }));
  l.position.set(3.2 * sx, 4.3, -6.15); l.castShadow = false; scene.add(l); lampMeshes.push(l);
}
const ring = new THREE.Mesh(new THREE.RingGeometry(2.45, 2.6, 48, 1, Math.PI, Math.PI),
  new THREE.MeshBasicMaterial({ color: 0x8a0f14, transparent: true, opacity: 0.75 }));
ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.02, -6.0); scene.add(ring);
for (const [x, z, s, r] of [[-6.5, -4.8, 1.2, 0.3], [-5.4, -5.3, 0.9, -0.2], [6.2, -4.5, 1.3, 0.5], [6.4, -2.9, 0.8, 0.1]]) {
  const c = box(s, s, s, 0x6b4a2b); c.position.set(x, s / 2, z); c.rotation.y = r; scene.add(c);
}

// ---------- door ----------
const DOOR_Z = -6.05, DW = 3, DH = 5;
const frameM = mat(0x2a1a12);
for (const [x, y, w, h] of [[-1.7, DH / 2, 0.4, DH + 0.4], [1.7, DH / 2, 0.4, DH + 0.4], [0, DH + 0.2, 3.8, 0.4]]) {
  const f = box(w, h, 0.5, frameM); f.position.set(x, y, DOOR_Z - 0.05); scene.add(f);
}
const glowMat = new THREE.MeshBasicMaterial({ color: 0xff2a18, toneMapped: false });
const glow = new THREE.Mesh(new THREE.PlaneGeometry(DW, DH), glowMat); glow.position.set(0, DH / 2, DOOR_Z - 0.18); scene.add(glow);
const doorPivot = new THREE.Group(); doorPivot.position.set(-DW / 2, 0, DOOR_Z); scene.add(doorPivot);
const doorShake = new THREE.Group(); doorPivot.add(doorShake);
const slabM = mat(0x9e0f18, { emissive: 0x1c0000, emissiveIntensity: 1, roughness: 0.55 });
const slab = box(DW, DH, 0.22, slabM); slab.position.set(DW / 2, DH / 2, 0); doorShake.add(slab);
for (const [x, y, w, h] of [[0.78, 3.6, 1.05, 1.7], [2.22, 3.6, 1.05, 1.7], [0.78, 1.35, 1.05, 2.0], [2.22, 1.35, 1.05, 2.0]]) {
  const p = box(w, h, 0.06, mat(0x8f0c14, { emissive: 0x200000 })); p.position.set(x, y, 0.13); doorShake.add(p);
}
const gold = mat(0xd4a017, { metalness: 0.8, roughness: 0.3, emissive: 0x332200 });
const handlePivot = new THREE.Group(); handlePivot.position.set(DW - 0.35, 2.3, 0.2); doorShake.add(handlePivot);
handlePivot.add(box(0.16, 0.16, 0.16, gold));
const lever = box(0.42, 0.09, 0.1, gold); lever.position.set(-0.2, 0, 0.08); handlePivot.add(lever);
const wordsTex = canvasTex(1024, 1024, (g) => {
  g.font = '900 210px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = '#fff'; g.shadowBlur = 40; g.fillStyle = '#fff3f0';
  g.fillText('MILO...', 512, 300); g.fillText('YOUR', 512, 560); g.fillText('TURN.', 512, 790);
});
const wordsMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.7), new THREE.MeshBasicMaterial({ map: wordsTex, transparent: true, depthWrite: false }));
wordsMesh.position.set(DW / 2, 2.7, 0.175); doorShake.add(wordsMesh);

// ---------- sign (+ hidden rule #2 plank) ----------
const signTex = canvasTex(512, 384, (g, w, h) => {
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#6d4828' : '#84592f'; g.fillRect(0, i * 64, w, 64); }
  g.strokeStyle = '#3b2412'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  g.textAlign = 'center'; g.fillStyle = '#ffe9a8'; g.font = '900 62px Inter'; g.fillText('RULE #1', w / 2, 95);
  g.fillStyle = '#ff2a2a'; g.font = '900 64px Inter'; g.fillText('NEVER OPEN', w / 2, 200); g.fillText('THE RED DOOR', w / 2, 285);
  g.fillStyle = '#ffe9a8'; g.font = '700 34px Inter'; g.fillText('- the admins', w / 2, 345);
});
const sign = new THREE.Group(); scene.add(sign);
const post = box(0.16, 2.2, 0.16, 0x4a301b); post.position.y = 1.1; sign.add(post);
const woodM = mat(0x6d4828);
const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.08), [woodM, woodM, woodM, woodM, mat(0xffffff, { map: signTex, emissive: 0x221100 }), woodM]);
board.position.set(0, 2.45, 0.1); board.castShadow = true; sign.add(board);
const rule2Tex = canvasTex(512, 320, () => {});
function drawRule2(r) {
  const c = rule2Tex.userData.canvas, g = c.getContext('2d'), w = 512, h = 320;
  for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#5f3e22' : '#74502c'; g.fillRect(0, i * 64, w, 64); }
  g.strokeStyle = '#3b2412'; g.lineWidth = 12; g.strokeRect(6, 6, w - 12, h - 12);
  const lines = [['RULE #2', 80, 60], ['NEVER TRUST', 175, 66], ['THE ADMIN', 260, 66]];
  lines.forEach(([txt, y, size], i) => {
    const rr = clamp(r * 3 - i);
    if (rr <= 0) return;
    g.save(); g.beginPath(); g.rect(0, y - 60, 40 + 440 * rr, 120); g.clip();
    g.font = `900 ${size}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = '#fff'; g.shadowBlur = 18; g.fillStyle = '#fff4ee'; g.fillText(txt, w / 2, y);
    g.restore();
  });
  rule2Tex.needsUpdate = true;
}
drawRule2(0);
const plank = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.08), [woodM, woodM, woodM, woodM, mat(0xffffff, { map: rule2Tex, emissive: 0x150a00 }), woodM]);
plank.position.set(0, 1.3, 0.1); plank.castShadow = true; sign.add(plank);

// ---------- clock ----------
const clockG = new THREE.Group(); scene.add(clockG);
const faceTex = canvasTex(512, 512, (g) => {
  g.fillStyle = '#f2ead6'; g.beginPath(); g.arc(256, 256, 250, 0, Math.PI * 2); g.fill();
  g.lineWidth = 26; g.strokeStyle = '#2a1a12'; g.stroke();
  g.fillStyle = '#1a1a1a'; g.font = '900 64px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; g.fillText(String(i), 256 + Math.sin(a) * 180, 256 - Math.cos(a) * 180); }
});
clockG.add(new THREE.Mesh(new THREE.CircleGeometry(0.85, 48), mat(0xffffff, { map: faceTex, emissive: 0x111111 })));
const hourHand = new THREE.Group(), minHand = new THREE.Group(); clockG.add(hourHand, minHand);
{ const hh = box(0.07, 0.42, 0.03, 0x111111); hh.position.set(0, 0.19, 0.03); hourHand.add(hh);
  const mh = box(0.045, 0.66, 0.03, 0x8a0000); mh.position.set(0, 0.31, 0.05); minHand.add(mh); }

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

const milo = makeAvatar({ skin: 0xf1c27d, hair: 0xe8731c, hairStyle: 'cap', top: 0xd62828, stripe: 0xf5f5f5, legs: 0x1d3557, shoes: 0xf5f5f5, name: 'Milo' });
const juno = makeAvatar({ skin: 0xe0ac69, hair: 0x8e44ad, hairStyle: 'pigtails', top: 0xf4c430, legs: 0x2b2b2b, shoes: 0x111111, skirt: 0x141414, name: 'Juno', tagColor: '#ffd23f' });
const admin = makeAvatar({ skin: 0xf1c27d, hair: 0xf1c40f, hairStyle: 'crown', top: 0x6c3483, legs: 0x1b1b2f, shoes: 0x111111, name: 'ADMIN', tagColor: '#f1c40f' });
const keeper = makeAvatar({ skin: 0x070707, hair: 0x000000, hairStyle: 'hood', top: 0x0b0b0b, legs: 0x060606, shoes: 0x000000 });
keeper.scale.setScalar(1.38);
scene.add(milo, juno, admin, keeper);
const NPC_STYLE = [
  { skin: 0xc68642, hair: 0x2c1b10, hairStyle: 'short', top: 0x2e86de, legs: 0x333333, shoes: 0x222222 },
  { skin: 0x8d5524, hair: 0x111111, hairStyle: 'short', top: 0x27ae60, legs: 0x3d3d3d, shoes: 0xeeeeee },
  { skin: 0xffdbac, hair: 0x7f4f24, hairStyle: 'short', top: 0xe67e22, legs: 0x2c3e50, shoes: 0x222222 },
  { skin: 0xe0ac69, hair: 0x111111, hairStyle: 'short', top: 0x16a085, legs: 0x4a235a, shoes: 0x111111 },
  { skin: 0xf1c27d, hair: 0xb03a2e, hairStyle: 'short', top: 0x95a5a6, legs: 0x1f2a44, shoes: 0x222222 },
];
const npcs = NPC_STYLE.map(s => { const a = makeAvatar(s); scene.add(a); return a; });

// jacket (floor) and jacket held by Milo
function jacketMesh(s = 1) {
  const g = new THREE.Group();
  const j = box(0.95 * s, 0.07, 0.75 * s, 0xf4c430); j.position.y = 0.04; g.add(j);
  for (const sx of [-1, 1]) { const sl = box(0.7 * s, 0.07, 0.28 * s, 0xe2b020); sl.position.set(0.72 * s * sx, 0.04, 0.15 * sx); sl.rotation.y = 0.5 * sx; g.add(sl); }
  return g;
}
const jacket = jacketMesh(); scene.add(jacket);
const held = box(0.45, 0.6, 0.18, 0xf4c430); held.position.set(0, -0.95, 0.12); milo.userData.P.armR.add(held);

// inside world: floating blocks, name tags, glass cube, shards
const insideG = new THREE.Group(); scene.add(insideG);
const floaters = []; { const r = rng(11);
  for (let i = 0; i < 26; i++) {
    const s = 0.3 + r() * 0.9; const c = [0x6b4a2b, 0x34384a, 0x9e0f18, 0x23263a][i % 4];
    const m = box(s, s, s, c); m.userData = { x: (r() - 0.5) * 15, y: 1.5 + r() * 6, z: -4 + r() * 13, sp: 0.2 + r() * 0.6, ph: r() * 6 };
    insideG.add(m); floaters.push(m);
  } }
const TAG_NAMES = ['ALEX', 'CHLOE', 'DEV', 'HUGO', 'ISLA', 'JADE', 'KIRA', 'LIAM', 'MILA', 'NICO', 'OLLY', 'PIA', 'KAI', 'ZOE', 'MAX', 'LILY', 'NOAH', 'MIA', 'LEO', 'AVA', 'SAM', 'RUBY', 'ELI', 'NINA', 'OWEN', 'IVY', 'FINN', 'ROSA', 'TOM', 'EMMA', 'JAX', 'LUNA', 'BEN', 'ARIA'];
const floorTags = []; { const r = rng(5);
  TAG_NAMES.forEach((n, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.28), new THREE.MeshBasicMaterial({ map: tagTex(n, '#f0f0f0'), transparent: true, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = Math.PI + (r() - 0.5) * 1.2;
    m.position.set((r() - 0.5) * 6, 0.025, -2.6 + r() * 6.5); insideG.add(m); floorTags.push(m);
  }); }
const junoTag = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.33), new THREE.MeshBasicMaterial({ map: tagTex('JUNO', '#ffd23f'), transparent: true, depthWrite: false, toneMapped: false }));
junoTag.rotation.x = -Math.PI / 2; junoTag.rotation.z = Math.PI + 0.25; junoTag.position.set(1.4, 0.03, 1.6); insideG.add(junoTag);
const CUBE = v3(0, 0, 4.5);
const glassM = new THREE.MeshStandardMaterial({ color: 0xff3030, emissive: 0x550000, transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0.1, depthWrite: false });
const glass = new THREE.Mesh(new THREE.BoxGeometry(1.9, 3.3, 1.9), glassM); glass.position.set(CUBE.x, 1.65, CUBE.z);
const glassEdges = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: 0xff5050, toneMapped: false }));
glass.add(glassEdges); scene.add(glass);
const shards = []; { const r = rng(9);
  for (let x = -1; x <= 1; x++) for (let y = 0; y < 3; y++) for (let z = -1; z <= 1; z++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.6), glassM.clone());
    m.userData = { p: v3(x * 0.63, 0.55 + y * 1.1, z * 0.63), v: v3(x * 2.5 + (r() - 0.5) * 2, 2 + r() * 3, z * 2.5 + (r() - 0.5) * 2), s: r() * 8 };
    scene.add(m); shards.push(m);
  } }
const miloTag = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.28), new THREE.MeshBasicMaterial({ map: tagTex('MILO', '#ff6b6b'), transparent: true, depthWrite: false, toneMapped: false }));
miloTag.rotation.x = -Math.PI / 2; miloTag.rotation.z = -0.3; miloTag.position.set(0.5, 0.03, -4.4); scene.add(miloTag);

// ---------- DOM ----------
const $ = id => document.getElementById(id);
function setText(id, html, op = 1) { const e = $(id); if (e.innerHTML !== html) e.innerHTML = html; e.style.opacity = op; }
const SPK_COLOR = { N: '#ffffff', M: '#8fd8ff', J: '#ffd23f', A: '#f1c40f', K: '#ff4545', AK: '#ff4545' };

const S = Object.fromEntries(TL.scenes.map(s => [s.id, s]));

function hideAll() {
  for (const o of [milo, juno, admin, keeper, jacket, glass, miloTag, insideG]) o.visible = false;
  npcs.forEach(n => n.visible = false); shards.forEach(s => s.visible = false);
  held.visible = false;
  for (const a of [milo, juno, admin, keeper]) if (a.userData.P.tag) a.userData.P.tag.visible = false;
}

window.renderAt = function (t) {
  hideAll();
  const sc = TL.scenes.find(s => t >= s.start && t < s.end) || TL.scenes[TL.scenes.length - 1];
  const lt = t - sc.start, dur = sc.end - sc.start, u = clamp(lt / dur);
  let camPos = v3(0, 2.6, 6), look = v3(0, 2.5, -6), fov = 52;
  let inside = false, open = 1, words = 1, shake = 0, fogRed = 0.6, flash = 0, flashCol = '#fff', tint = 0, rule2 = 0, flicker = 0;
  ['milo', 'juno', 'admin'].forEach(() => {});
  setFace(milo, 'worried'); setFace(juno, 'worried'); setFace(admin, 'stern'); setFace(keeper, 'keeper');
  pose(milo); pose(juno); pose(admin); pose(keeper);
  sign.position.set(2.85, 0, -5.0); sign.rotation.set(0, -0.35, 0);
  clockG.position.set(-4.3, 5.1, -6.22);
  minHand.rotation.z = 0; hourHand.rotation.z = 0;
  drawRule2(0);
  let rule2Draw = 0;

  switch (sc.id) {
    case 1: { // recap
      place(milo, 0.85, -0.9, Math.PI); setFace(milo, 'shock');
      pose(milo, { armLx: -1.2, armRx: -1.0, armLz: -0.3, armRz: 0.3, bodyX: -0.15 });
      jacket.visible = true; jacket.position.set(0.05, 0, -3.95); jacket.rotation.y = 0.4;
      camPos = lerpV(v3(2.7, 3.0, 2.6), v3(2.1, 2.9, 1.4), ease(u)); look = v3(-0.2, 2.2, -6);
      flicker = 0.4;
      break;
    }
    case 2: { // everyone ran
      place(milo, 0.6, -2.0, Math.PI); setFace(milo, 'shock');
      jacket.visible = true; jacket.position.set(0.05, 0, -3.95); jacket.rotation.y = 0.4;
      const runs = [[-1.8, 0.4, -3.5, 10], [1.9, 0.8, 3.2, 10], [-0.6, 1.4, -1.4, 11], [2.8, 1.6, 5, 10], [-3.0, 1.2, -6, 9]];
      runs.forEach(([x0, z0, x1, z1], i) => {
        const k = easeIn(clamp((lt - i * 0.12) / 2.2) * 0.6) * 1.0 + clamp((lt - i * 0.12) / 2.2) * 0.6;
        const x = lerp(x0, x1, clamp(k)), z = lerp(z0, z1, clamp(k));
        place(npcs[i], x, z, faceTo(x0, z0, x1, z1)); pose(npcs[i], walkPose(lt * 15 + i, 0.95, { bodyX: 0.2 })); setFace(npcs[i], 'shock');
      });
      camPos = lerpV(v3(-0.4, 2.7, -4.9), v3(-0.3, 2.6, -4.5), ease(u)); look = v3(0.3, 1.6, 3.0); fov = 62; setFace(milo, 'shock'); milo.rotation.y = faceTo(0.6, -2.0, -0.4, -4.9);
      break;
    }
    case 3: { // except Milo + picks up jacket
      const bend = Math.sin(clamp((lt - 0.6) / 2.2) * Math.PI);
      const picked = lt > 1.7;
      const tl = vs('notleaving') - sc.start;
      const turn = ease((lt - tl + 0.4) / 0.6);
      place(milo, 0.3, -3.3, lerp(Math.PI, faceTo(0.3, -3.3, 1.4, -1.2), turn));
      pose(milo, { bodyX: 0.85 * bend, armRx: -1.0 * bend - (picked ? 0.25 * (1 - bend) : 0), armLx: -0.4 * bend, headX: 0.3 * bend, legL: -0.3 * bend, legR: -0.3 * bend });
      milo.position.y = -0.25 * bend;
      jacket.visible = !picked; jacket.position.set(0.05, 0, -3.95); jacket.rotation.y = 0.4;
      held.visible = picked;
      setFace(milo, lt > tl - 0.3 ? 'determined' : 'sad');
      if (lt < tl - 0.3) { camPos = lerpV(v3(3.6, 2.3, -0.8), v3(3.3, 2.2, -1.3), ease(u)); look = v3(0.2, 0.9, -3.6); fov = 56; }
      else { camPos = lerpV(v3(1.3, 2.3, -1.2), v3(1.1, 2.3, -1.6), ease((lt - tl) / 2)); look = v3(0.3, 2.25, -3.3); }
      break;
    }
    case 4: { // admin
      const walkIn = clamp(lt / 1.3);
      const ax = lerp(-4.5, -0.9, easeOut(walkIn)), az = lerp(-1.2, -2.4, easeOut(walkIn));
      place(admin, ax, az, faceTo(ax, az, 0.9, -3.0));
      pose(admin, walkIn < 1 ? walkPose(lt * 9, 0.6 * (1 - walkIn)) : { armRx: -0.5 * ease((t - vs('stop')) / 0.3) * (t < ve('stop') ? 1 : 0), armRz: 0.2 });
      place(milo, 0.9, -3.0, faceTo(0.9, -3.0, -0.9, -2.4)); held.visible = true; setFace(milo, 'determined');
      if (t < vs('why') - 0.1) { // over Milo's shoulder onto the admin
        camPos = lerpV(v3(1.6, 2.75, -4.6), v3(1.5, 2.7, -4.35), ease(u * 2)); look = v3(-0.9, 2.15, -2.4); setFace(admin, 'stern');
      } else if (t < vs('noanswer') - 0.1) { // over admin's shoulder onto Milo
        camPos = v3(-2.3, 2.9, -1.1); look = v3(0.9, 2.2, -3.0); setFace(admin, 'stern');
      } else { // admin close-up, eyes flicker red for a moment
        camPos = lerpV(v3(0.9, 2.3, -1.9), v3(0.6, 2.3, -2.0), ease((t - vs('noanswer')) / 2.5)); look = v3(-0.9, 2.25, -2.4);
        const fl = t - (ve('noanswer') - 0.25);
        setFace(admin, fl > 0 && fl < 0.13 ? 'redeyes' : 'stern');
        admin.userData.P.head.rotation.y = -0.25 * ease((t - vs('noanswer')) / 1.5);
      }
      break;
    }
    case 5: { // steps into the red light
      const k = clamp(lt / 3.6);
      const z = lerp(-3.0, -6.6, ease(k));
      place(milo, lerp(0.9, 0.3, k), z, Math.PI); pose(milo, walkPose(lt * 7, 0.55)); held.visible = true;
      camPos = lerpV(v3(1.6, 2.7, 0.8), v3(0.8, 2.5, -2.6), ease(k)); look = v3(0.2, 2.2, -8);
      flash = clamp((lt - (dur - 1.3)) / 1.0); flashCol = '#ffd0c8';
      break;
    }
    case 6: { // inside: same lobby, but wrong
      inside = true;
      place(milo, 0.4, lerp(-4.7, -3.6, ease(u)), 0); setFace(milo, 'worried'); held.visible = true;
      pose(milo, walkPose(lt * 5, 0.25 * (1 - u)));
      flash = 1 - clamp(lt / 0.8); flashCol = '#ffd0c8';
      if (t < vs('wrong') - 0.1) { camPos = lerpV(v3(-0.9, 2.4, -0.2), v3(-0.6, 2.3, -1.1), ease(u * 1.5)); look = v3(0.4, 2.0, -4.3); }
      else { const k = ease((t - vs('wrong')) / 2.5); camPos = lerpV(v3(0.2, 2.4, -1.6), v3(-0.6, 2.4, -2.4), k); look = v3(-2.75, 2.4, -4.95); }
      break;
    }
    case 7: { // name tags
      inside = true;
      place(milo, -0.6, -0.4, faceTo(-0.6, -0.4, 1.4, 1.6)); setFace(milo, 'sad'); held.visible = true; pose(milo, { headX: 0.45 });
      if (t < vs('newest') - 0.1) {
        const k = ease((t - sc.start) / (vs('newest') - sc.start));
        camPos = lerpV(v3(1.3, 1.7, -2.6), v3(0.2, 1.4, 1.6), k); look = lerpV(v3(0.2, 0, 0.4), v3(1.0, 0, 3.8), k);
      } else {
        const k = easeOut((t - vs('newest')) / (sc.end - vs('newest')));
        camPos = lerpV(v3(1.0, 2.4, 0.3), v3(1.35, 1.25, 1.2), k); look = v3(1.4, 0, 1.6);
      }
      break;
    }
    case 8: { // Juno in the glass
      inside = true; glass.visible = true;
      place(juno, CUBE.x, CUBE.z, Math.PI); setFace(juno, 'worried');
      const knock = Math.max(0, Math.sin(t * 9)) * 0.25;
      pose(juno, { armLx: -1.45 - knock, armRx: -1.45 + knock * 0.5, bodyX: 0.08 });
      held.visible = true;
      const run = clamp((t - vs('trapped')) / 2.4);
      const mx = lerp(-0.6, 0.9, ease(run)), mz = lerp(-0.4, 2.9, ease(run));
      place(milo, mx, mz, run > 0 ? faceTo(-0.6, -0.4, 0.9, 2.9) : lerp(faceTo(-0.6, -0.4, 1.4, 1.6), faceTo(-0.6, -0.4, 0, 4.5), ease((t - vs('overhere')) / 0.5)));
      pose(milo, run > 0 && run < 1 ? walkPose(t * 14, 0.9, { bodyX: 0.2 }) : { headX: 0 });
      setFace(milo, 'shock');
      if (t < vs('trapped') - 0.1) { camPos = v3(0.6, 2.2, 1.6); look = v3(-0.6, 2.2, -0.4); setFace(milo, 'shock'); }
      else if (t < vs('shouldnt') - 0.1) { const k = ease((t - vs('trapped')) / 3.5); camPos = lerpV(v3(-1.2, 6.8, -3.4), v3(-0.6, 6.0, -1.8), k); look = v3(0.3, 1.0, 3.9); fov = 58; }
      else { camPos = lerpV(v3(-0.6, 2.3, 2.3), v3(-0.45, 2.3, 2.75), ease((t - vs('shouldnt')) / 2)); look = v3(0, 2.3, 4.5); }
      break;
    }
    case 9: { // the Keeper
      inside = true; glass.visible = true; held.visible = true;
      place(juno, CUBE.x, CUBE.z, Math.PI); setFace(juno, 'shock'); pose(juno, { armLx: -1.45, armRx: -1.45 });
      place(milo, 0.9, 2.9, faceTo(0.9, 2.9, 0, 6.6)); setFace(milo, t > ve('choose') - 0.6 ? 'determined' : 'shock');
      const k = ease((t - vs('fog')) / 4.0);
      const kz = lerp(12, 6.6, k);
      place(keeper, 0, kz, Math.PI, 0.05 + Math.sin(t * 1.7) * 0.05);
      pose(keeper, k < 1 ? walkPose(t * 4, 0.3 * (1 - k)) : { headZ: 0.12 * Math.sin(t * 0.8), armLz: -0.1, armRz: 0.1 });
      if (t > vs('choose')) { pose(keeper, { armRx: -1.1, armRz: 0.25, armLx: -0.2, headZ: 0.1 }); }
      flicker = 1;
      if (t < vs('rule') - 0.2) { camPos = lerpV(v3(-1.7, 1.1, 1.0), v3(-1.4, 1.15, 1.6), ease(u * 2)); look = v3(0, 2.6, 6.5); fov = 56; }
      else if (t < vs('choose') - 0.1) { camPos = lerpV(v3(1.7, 2.3, 3.4), v3(1.3, 2.6, 4.2), ease((t - vs('rule')) / 5)); look = v3(0, 3.1, 6.6); }
      else { camPos = lerpV(v3(3.9, 2.5, -0.2), v3(3.5, 2.5, 0.5), ease((t - vs('choose')) / 4)); look = v3(0.2, 2.4, 5.0); }
      break;
    }
    case 10: { // the choice
      inside = true; held.visible = true;
      place(milo, 0.9, 2.9, faceTo(0.9, 2.9, 0, 6.6)); setFace(milo, 'determined');
      place(keeper, 0, 6.6, Math.PI, 0.05 + Math.sin(t * 1.7) * 0.05); pose(keeper, { armRx: -1.1, armRz: 0.25, headZ: 0.1 });
      const ts = ve('letgo') + 0.35, sh = t - ts;
      flicker = 1;
      if (sh < 0) {
        glass.visible = true;
        place(juno, CUBE.x, CUBE.z, Math.PI); setFace(juno, t < vs('letgo') ? 'sad' : 'shock');
        pose(juno, { armLx: -1.45, armRx: -1.45 });
      } else { // shatter + Juno pulled back to the door
        shards.forEach(m => { const d = m.userData; m.visible = true;
          m.position.set(CUBE.x + d.p.x + d.v.x * sh, Math.max(0.3, d.p.y + d.v.y * sh - 4.9 * sh * sh), CUBE.z + d.p.z + d.v.z * sh);
          m.rotation.set(d.s * sh, d.s * sh * 0.7, 0); m.material.opacity = 0.32 * clamp(1 - sh / 1.6); });
        const k = easeIn(clamp(sh / 1.5));
        place(juno, CUBE.x, lerp(CUBE.z, -6.5, k), Math.PI, 1.6 * Math.sin(Math.PI * clamp(sh / 1.5)));
        juno.rotation.z = sh * 3; setFace(juno, 'shock'); pose(juno, { armLx: -2.6, armRx: -2.6, armLz: -0.4, armRz: 0.4 });
        pose(keeper, { armRx: -1.5, armLx: -1.5, headZ: 0.1 });
        shake = clamp(1 - sh / 0.6);
        flash = clamp((sh - 0.9) / 0.6);
      }
      if (t < vs('letgo') - 0.1) { camPos = lerpV(v3(-0.7, 2.3, 2.3), v3(-0.55, 2.3, 2.7), ease((t - sc.start) / 2)); look = v3(0, 2.3, 4.5); }
      else if (t < ts - 0.1) { camPos = v3(1.6, 2.35, 4.4); look = v3(0.9, 2.2, 2.9); }
      else { camPos = lerpV(v3(3.8, 2.6, 0.2), v3(3.4, 2.7, 0.6), ease(sh / 2)); look = v3(0.3, 2.0, 3.5); }
      break;
    }
    case 11: { // back in the lobby
      open = 0; words = 0; fogRed = 0;
      flash = 1 - clamp(lt / 0.9);
      const wake = ease((t - vs('woke') - 0.6) / 1.6);
      place(juno, 0.2, -2.6, faceTo(0.2, -2.6, 0, -6)); juno.position.y = lerp(0.3, 0, wake);
      juno.rotation.x = lerp(-Math.PI / 2, 0, wake); setFace(juno, wake < 0.3 ? 'sleep' : 'worried');
      miloTag.visible = true;
      if (t < vs('gone') + 0.6) { camPos = lerpV(v3(3.0, 2.7, 0.4), v3(2.7, 2.6, -0.2), ease(u)); look = v3(0.2, 0.7, -2.8); }
      else { const k = ease((t - vs('gone') - 0.6) / 2.4); camPos = lerpV(v3(1.3, 1.4, -2.7), v3(1.0, 1.9, -2.2), k); look = lerpV(v3(0.5, 0, -4.4), v3(0.2, 2.6, -6), k); setFace(juno, 'sad'); }
      break;
    }
    case 12: { // rule #2
      open = 0; words = 0; fogRed = 0; miloTag.visible = true;
      place(juno, 1.5, -3.5, faceTo(1.5, -3.5, 2.85, -5.0)); setFace(juno, 'shock');
      rule2Draw = clamp((t - vs('newrule') - 1.0) / 3.2);
      const k = ease(u);
      camPos = lerpV(v3(3.9, 2.2, -2.4), v3(3.5, 1.95, -3.5), k); look = v3(2.8, 1.75, -4.95);
      break;
    }
    case 13: { // the twist
      open = 0; words = 0; fogRed = 0; miloTag.visible = true;
      const turn = ease((lt - 0.2) / 0.9);
      place(juno, 1.9, -3.7, lerp(faceTo(1.9, -3.7, 2.85, -5.0), faceTo(1.9, -3.7, 0.9, -2.4), turn)); setFace(juno, 'shock');
      place(admin, 0.9, -2.4, faceTo(0.9, -2.4, 1.9, -3.7));
      const red = t >= vs('welcome') - 0.15;
      setFace(admin, red ? 'redeyes' : 'smirk');
      rule2Draw = 1;
      camPos = lerpV(v3(1.3, 2.7, -5.6), v3(1.15, 2.6, -5.0), ease(u)); look = v3(0.9, 2.25, -2.4);
      if (red) flicker = 0.6;
      tint = clamp((t - (sc.end - 2.9)) / 0.6) * 0.55;
      break;
    }
  }

  // world state
  insideG.visible = inside;
  if (inside) { sign.position.set(-2.85, 4.9, -5.0); sign.rotation.set(0, 0.35, Math.PI); clockG.position.x = 4.3;
    minHand.rotation.z = t * 2.5; hourHand.rotation.z = t * 0.4;
    floaters.forEach(m => { const d = m.userData; m.position.set(d.x, d.y + Math.sin(t * d.sp + d.ph) * 0.4, d.z); m.rotation.set(t * d.sp * 0.5, t * d.sp * 0.3 + d.ph, 0); }); }
  drawRule2(rule2Draw);
  doorPivot.rotation.y = -1.35 * open;
  wordsMesh.visible = words > 0;
  const sk = shake * 0.05;
  doorShake.position.set(Math.sin(t * 90) * sk, 0, Math.cos(t * 70) * sk * 0.6);

  const fl = flick(t) * (flicker ? (1 - flicker * 0.35 * (Math.sin(t * 31) > 0.6 ? 1 : 0)) : 1);
  doorLight.intensity = 11 * fl;
  innerLight.intensity = open * 90 * fl;
  glowMat.color.setRGB(1.6, 0.08 + 0.04 * Math.sin(t * 9), 0.04);
  hemi.color.copy(inside ? HEMI_IN : HEMI_SKY);
  hemi.intensity = (inside ? 1.9 : 1.1) * fl; insideLight.intensity = inside ? 30 * fl : 0;
  moon.intensity = inside ? 0.5 : 1.2;
  lampL.intensity = lampR.intensity = (inside ? 0 : 5) * (0.9 + 0.1 * Math.sin(t * 13));
  lampMeshes.forEach(l => l.visible = !inside);
  cubeLight.intensity = glass.visible ? 18 * fl : 0;
  const fogC = inside ? FOG_IN : FOG_BASE.clone().lerp(FOG_RED, fogRed * open * 0.8);
  scene.fog.color.copy(fogC); scene.fog.density = inside ? 0.035 : 0.045; scene.background.copy(fogC);

  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  const cs = shake * 0.06;
  camera.position.copy(camPos).add(v3(Math.sin(t * 83) * cs, Math.sin(t * 61) * cs, 0));
  camera.lookAt(look);
  if (inside) floaters.forEach(m => { m.visible = m.position.distanceTo(camera.position) > 3.0; });
  renderer.render(scene, camera);

  // ---- overlays ----
  $('flash').style.background = flashCol; $('flash').style.opacity = flash;
  $('tint').style.opacity = tint;
  let hook = '', hookOp = 0;
  if (sc.id === 1 && lt < 3.2) { hook = '<span class="part">PART 2</span><br>What was behind<br>the <em>red door</em>?'; hookOp = clamp(lt / 0.25) * clamp((3.2 - lt) / 0.3); }
  setText('hook', hook, hookOp);
  const cap = (sc.id === 1 && lt < 3.2) ? null : TL.captions.find(c => t >= c.start && t < c.end + 0.12);
  const capEl = $('cap'); capEl.style.color = cap ? SPK_COLOR[cap.spk] : '#fff';
  setText('cap', cap ? cap.text : '', cap ? 1 : 0);
  let big = '', sub = '', bop = 0, bigColor = '#ff2a2a';
  if (sc.id === 7 && t >= ve('newest') + 0.25) { big = 'JUNO'; bigColor = '#ffd23f'; bop = clamp((t - ve('newest') - 0.25) / 0.15); }
  if (sc.id === 12 && rule2Draw >= 1) { big = '<span style="font-size:92px">RULE #2</span><br><span style="font-size:110px">NEVER TRUST<br>THE ADMIN</span>'; bop = clamp((t - (vs('newrule') + 4.2)) / 0.25); }
  if (sc.id === 13 && t >= sc.end - 2.9) { big = 'PART 3?'; sub = 'Should Juno go back<br>for <span style="color:#8fd8ff">Milo</span>? 👇'; bop = clamp((t - (sc.end - 2.9)) / 0.3); }
  $('big').style.color = bigColor;
  setText('big', big, bop); setText('sub', sub, bop);
  return true;
};
window.DURATION = TL.duration;
window.READY = true;
