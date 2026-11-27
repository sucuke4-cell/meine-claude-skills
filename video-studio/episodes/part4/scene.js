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
const doorFrames = [];
for (const [x, y, w, h] of [[-1.7, DH / 2, 0.4, DH + 0.4], [1.7, DH / 2, 0.4, DH + 0.4], [0, DH + 0.2, 3.8, 0.4]]) {
  const f = box(w, h, 0.5, frameM); f.position.set(x, y, DOOR_Z - 0.05); scene.add(f); doorFrames.push(f);
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
    const cg = makeCrown(); head.add(cg); P.crown = cg;
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


// ---------- Part 3 assets ----------
function makeCrown(glowMat) {
  const g = new THREE.Group();
  const m = glowMat || mat(0xf1c40f, { metalness: 0.7, roughness: 0.3 });
  const base = box(0.82, 0.16, 0.82, m); base.position.y = 0.45; g.add(base);
  for (const [x, z] of [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32], [0, 0.32]]) {
    const sp = box(0.16, 0.24, 0.16, m); sp.position.set(x, 0.62, z); g.add(sp);
  }
  return g;
}
const crownGlowM = mat(0xf1c40f, { metalness: 0.6, roughness: 0.3, emissive: 0xffaa00, emissiveIntensity: 0.3 });
const heldCrown = makeCrown(crownGlowM); heldCrown.scale.setScalar(0.8); heldCrown.position.set(0, -1.35, 0.1);
juno.userData.P.armR.add(heldCrown);
const doorCrown = makeCrown(crownGlowM); doorCrown.position.set(1.15, 1.95, DOOR_Z + 0.35); scene.add(doorCrown);
const crownLight = new THREE.PointLight(0xffb030, 0, 6, 1.6); scene.add(crownLight);

// chains across the door (an X) + padlock
const chainM = mat(0x8a8f98, { metalness: 0.85, roughness: 0.35 });
const links = [];
{ const r = rng(21);
  for (const [x0, y0, x1, y1] of [[-1.45, 4.7, 1.45, 0.35], [1.45, 4.7, -1.45, 0.35]]) {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(L / 0.2);
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.032, 6, 12), chainM);
      m.castShadow = true;
      const base = v3(lerp(x0, x1, u), lerp(y0, y1, u), DOOR_Z + 0.32 + (i % 2) * 0.03);
      m.position.copy(base);
      m.rotation.set(i % 2 ? Math.PI / 2 : 0, 0, Math.atan2(y1 - y0, x1 - x0));
      m.userData = { base, rot: m.rotation.clone(), v: v3((r() - 0.5) * 5, 1 + r() * 3, 1.5 + r() * 3), s: (r() - 0.5) * 14 };
      scene.add(m); links.push(m);
    }
  } }
const lockG = new THREE.Group(); lockG.position.set(0, 2.5, DOOR_Z + 0.42); scene.add(lockG);
{ const body = box(0.5, 0.45, 0.22, mat(0xc9a227, { metalness: 0.8, roughness: 0.3 })); lockG.add(body);
  const sh = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 16, Math.PI), chainM); sh.position.y = 0.22; lockG.add(sh); }
lockG.userData.v = v3(0.6, 2.5, 2.5);
const edgeGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.07, DH), new THREE.MeshBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0, toneMapped: false }));
edgeGlow.position.set(DW / 2 - 0.02, DH / 2, DOOR_Z + 0.13); scene.add(edgeGlow);

// the vanished players (with their name tags)
const VANISHED = [
  ['KAI', { skin: 0xc68642, hair: 0x1b1b1b, hairStyle: 'short', top: 0x5b6ee1, legs: 0x2d2d2d, shoes: 0x111111 }],
  ['ZOE', { skin: 0xffdbac, hair: 0xd35400, hairStyle: 'pigtails', top: 0x48c9b0, legs: 0x34495e, shoes: 0xffffff }],
  ['MAX', { skin: 0x8d5524, hair: 0x111111, hairStyle: 'short', top: 0xe74c3c, legs: 0x1c2833, shoes: 0x222222 }],
  ['LILY', { skin: 0xf1c27d, hair: 0xf7dc6f, hairStyle: 'pigtails', top: 0xaf7ac5, legs: 0x283747, shoes: 0x111111 }],
  ['NOAH', { skin: 0xe0ac69, hair: 0x5d4037, hairStyle: 'short', top: 0x58d68d, legs: 0x212f3d, shoes: 0xeeeeee }],
];
const vanished = VANISHED.map(([name, st]) => { const a = makeAvatar({ ...st, name, tagColor: '#d8f5ff' }); scene.add(a); return a; });

// rule #3 sign (left of the door)
const rule3Tex = canvasTex(512, 384, () => {});
function drawRule3(r) {
  const g = rule3Tex.userData.canvas.getContext('2d'), w = 512, h = 384;
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#6d4828' : '#84592f'; g.fillRect(0, i * 64, w, 64); }
  g.strokeStyle = '#3b2412'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  [['RULE #3', 95, 62, '#ffe9a8'], ['NEVER LEAVE', 200, 64, '#7dffa8'], ['A FRIEND BEHIND', 285, 56, '#7dffa8']].forEach(([txt, y, size, col], i) => {
    const rr = clamp(r * 3 - i); if (rr <= 0) return;
    g.save(); g.beginPath(); g.rect(0, y - 60, 30 + 460 * rr, 120); g.clip();
    g.font = `900 ${size}px Inter`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = col; g.shadowBlur = 20; g.fillStyle = col; g.fillText(txt, w / 2, y); g.restore();
  });
  rule3Tex.needsUpdate = true;
}
drawRule3(0);
const sign3 = new THREE.Group(); sign3.position.set(-2.85, 0, -5.0); sign3.rotation.y = 0.35; scene.add(sign3);
{ const p3 = box(0.16, 2.2, 0.16, 0x4a301b); p3.position.y = 1.1; sign3.add(p3);
  const b3 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.08), [woodM, woodM, woodM, woodM, mat(0xffffff, { map: rule3Tex, emissive: 0x112211 }), woodM]);
  b3.position.set(0, 2.45, 0.1); b3.castShadow = true; sign3.add(b3); }
const sign3Light = new THREE.PointLight(0x7dffa8, 0, 4, 1.6); sign3Light.position.set(-2.6, 2.6, -4.2); scene.add(sign3Light);


// ---------- Part 4 assets ----------
const doorParts = [doorPivot, glow, ring, ...doorFrames];
// Milo's shadow: it has the Keeper's shape
const shadowTex = canvasTex(256, 512, (g) => {
  const rects = [[78, 18, 100, 100], [56, 118, 144, 175], [14, 122, 42, 250], [200, 122, 42, 250], [66, 290, 54, 210], [136, 290, 54, 210]];
  g.shadowColor = '#ff2020'; g.shadowBlur = 18; g.fillStyle = 'rgba(70,0,0,0.9)'; rects.forEach(r => g.fillRect(...r));
  g.shadowBlur = 0; g.fillStyle = 'rgba(5,0,0,0.95)'; rects.forEach(([x, y, w, h]) => g.fillRect(x + 6, y + 6, w - 12, h - 12));
  g.fillStyle = 'rgba(255,30,30,1)'; g.fillRect(100, 58, 22, 12); g.fillRect(134, 58, 22, 12);
});
const miloShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0, toneMapped: false }));
miloShadow.rotation.x = -Math.PI / 2; miloShadow.position.set(0, 0.03, -2.9); milo.add(miloShadow);
// puffs for vanishing / returning players
const puffPool = []; { const r = rng(31);
  for (let k = 0; k < 10; k++) { const arr = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, toneMapped: false }));
      m.userData = { x: (r() - 0.5) * 0.9, y: 0.3 + r() * 2.2, z: (r() - 0.5) * 0.7, vy: 0.6 + r() * 1.2, vx: (r() - 0.5) * 0.6, s: r() * 6 };
      m.visible = false; scene.add(m); arr.push(m);
    } puffPool.push(arr); } }
function puffAt(k, x, z, age, color, inward = false) {
  if (age > 1.3) return;
  puffPool[k].forEach(m => { const d = m.userData; const a = inward ? 1.3 - age : age; m.visible = true; m.material.color.setHex(color);
    m.position.set(x + d.x + d.vx * a, d.y + d.vy * a, z + d.z); m.rotation.set(a * d.s, a * d.s, 0); m.material.opacity = clamp(1 - age / 1.3); });
}
// door debris
const debris = []; { const r = rng(41);
  for (let i = 0; i < 34; i++) {
    const m = box(0.4 + r() * 0.4, 0.4 + r() * 0.6, 0.18, i % 3 ? slabM : frameM);
    m.userData = { p: v3((r() - 0.5) * 3.2, 0.3 + r() * 4.8, DOOR_Z), v: v3((r() - 0.5) * 6, 1 + r() * 5, 3 + r() * 6), s: (r() - 0.5) * 12 };
    m.visible = false; scene.add(m); debris.push(m);
  } }
// the blue door (final scene)
const blueG = new THREE.Group(); blueG.position.set(5.6, 0, -6.12); scene.add(blueG);
const blueSlabM = mat(0x2a6bff, { emissive: 0x0a2a88, emissiveIntensity: 1.2, roughness: 0.5 });
{ for (const [x, y, w, h] of [[-0.95, 1.45, 0.25, 3.0], [0.95, 1.45, 0.25, 3.0], [0, 3.0, 2.15, 0.25]]) { const f = box(w, h, 0.35, 0x1a1a2a); f.position.set(x, y, -0.05); blueG.add(f); }
  const bglow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.9), new THREE.MeshBasicMaterial({ color: 0x40a0ff, toneMapped: false })); bglow.position.set(0, 1.45, -0.1); blueG.add(bglow); }
const bluePivot = new THREE.Group(); bluePivot.position.set(-0.85, 0, 0.02); blueG.add(bluePivot);
{ const bs = box(1.7, 2.9, 0.14, blueSlabM); bs.position.set(0.85, 1.45, 0); bluePivot.add(bs);
  const bk = box(0.14, 0.14, 0.14, gold); bk.position.set(1.5, 1.35, 0.12); bluePivot.add(bk); }
const blueLight = new THREE.PointLight(0x4aa8ff, 0, 9, 1.4); blueLight.position.set(5.6, 2.0, -5.2); scene.add(blueLight);
const WARM_SKY = new THREE.Color(0xffd9b0), FOG_WARM = new THREE.Color(0x3b3350);

// ---------- DOM ----------
const $ = id => document.getElementById(id);
function setText(id, html, op = 1) { const e = $(id); if (e.innerHTML !== html) e.innerHTML = html; e.style.opacity = op; }
const SPK_COLOR = { N: '#ffffff', M: '#8fd8ff', MF: '#8fd8ff', J: '#ffd23f', A: '#f1c40f', K: '#ff4545', AK: '#ff4545', P: '#9be37a' };

const S = Object.fromEntries(TL.scenes.map(s => [s.id, s]));

function hideAll() {
  for (const o of [milo, juno, admin, keeper, jacket, glass, miloTag, insideG]) o.visible = false;
  npcs.forEach(n => n.visible = false); shards.forEach(s => s.visible = false);
  held.visible = false; heldCrown.visible = false; doorCrown.visible = false; sign3.visible = false;
  vanished.forEach(v => v.visible = false);
  for (const a of [milo, juno, admin, keeper]) if (a.userData.P.tag) a.userData.P.tag.visible = false;
  admin.userData.P.crown.visible = true; blueG.visible = false; miloShadow.material.opacity = 0;
  debris.forEach(d => d.visible = false); puffPool.forEach(a => a.forEach(m => m.visible = false));
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
  let doorOn = 1, doorBreak = -1, dark = 0, warm = 0, glitch = 0, shadowOp = 0, blueOn = 0, blueOpen = 0;
  let rule2Draw = 1, rule3Draw = 0, crownGlow = 0, edge = 0, sysMsg = '', chains = 1, chainT = -1;

  // ---- Part 4: The Last Door (finale) ----
  const SPOTS = [[-2.6, -3.9], [-1.6, -3.3], [-0.6, -4.1], [1.9, -3.4], [2.9, -3.9], [3.7, -3.0], [-3.5, -3.0], [-0.3, -2.9], [2.5, -2.6], [-2.2, -2.4]];
  const group = [...vanished, ...npcs];
  const cheer = (a, i, k = 1) => pose(a, { armLx: -2.8 * k, armRx: -2.8 * k, armLz: -0.3 * k, armRz: 0.3 * k, bob: Math.abs(Math.sin(t * 7 + i)) * 0.25 * k });
  const placeGroup = (f = 'laugh', k = 1) => group.forEach((a, i) => { const [x, z] = SPOTS[i]; place(a, x, z, faceTo(x, z, 0.8, 1.5)); setFace(a, f); if (k) cheer(a, i, k); if (a.userData.P.tag) a.userData.P.tag.visible = true; });
  open = 0; words = 0; fogRed = 0; chains = 0; rule2Draw = 1; rule3Draw = 1; sign3.visible = true;
  held.visible = true;

  switch (sc.id) {
    case 1: { // celebration -> server restart
      place(milo, 0.3, -2.2, 0); place(juno, 1.3, -2.2, 0); setFace(milo, 'laugh'); setFace(juno, 'laugh');
      placeGroup('laugh', 0.8);
      const tr = vs('recap') + 3.3;
      if (t >= tr) { sysMsg = '⚠ [SERVER] Restarting...'; glitch = clamp((t - tr) / 1.2); flicker = 1; }
      flash = clamp((t - (sc.end - 0.35)) / 0.35);
      camPos = lerpV(v3(0.8, 2.7, 2.2), v3(0.8, 2.5, 0.8), ease(u)); look = v3(0.8, 2.0, -3.0);
      break;
    }
    case 2: { // the door is gone
      doorOn = 0; flash = 1 - clamp(lt / 0.5); glitch = clamp(1 - lt / 1.2);
      place(milo, 0.3, -2.2, 0); place(juno, 1.3, -2.2, 0);
      if (t < vs('over') - 0.2) {
        camPos = lerpV(v3(-1.2, 3.3, 0.6), v3(-1.0, 3.2, -1.2), ease((t - sc.start) / (vs('over') - sc.start))); look = v3(0, 2.7, -6.3);
        setFace(juno, 'shock'); setFace(milo, 'blank'); placeGroup('shock', 0);
      } else {
        placeGroup('laugh', 1); setFace(juno, 'laugh'); setFace(milo, 'smile'); cheer(juno, 0, 0.8);
        camPos = lerpV(v3(0.8, 3.3, 2.6), v3(0.8, 3.1, 2.0), ease((t - vs('over')) / 2)); look = v3(0.6, 1.6, -3.0);
      }
      break;
    }
    case 3: { // something is wrong with Milo
      doorOn = 0; placeGroup('laugh', 0.4); if (t >= vs('shadow') - 0.1) group.forEach(a => { a.position.z += 3.4; a.position.x *= 1.3; });
      place(juno, 1.3, -2.2, -Math.PI / 2 + 0.3); setFace(juno, 'worried');
      place(milo, 0.3, -2.2, t < vs('shadow') ? Math.PI / 2 - 0.3 : 0); setFace(milo, t < vs('fine') ? 'blank' : 'smile');
      if (t < vs('fine') - 0.1) { camPos = v3(0.8, 2.3, 0.1); look = v3(0.8, 2.2, -2.2); }
      else if (t < vs('shadow') - 0.1) { camPos = lerpV(v3(0.9, 2.35, 0.3), v3(0.85, 2.35, 0.0), ease((t - vs('fine')) / 1.5)); look = v3(0.3, 2.25, -2.2); }
      else { shadowOp = clamp((t - vs('shadow') - 0.6) / 1.2); camPos = lerpV(v3(0.6, 7.2, 0.8), v3(0.5, 7.6, 0.4), ease((t - vs('shadow')) / 4)); look = v3(0.3, 0, -3.6); fov = 50; flicker = 0.5; }
      break;
    }
    case 4: { // lights out, players vanish
      doorOn = 0;
      dark = clamp((t - vs('lights') - 0.4) / 2.2);
      place(juno, 1.3, -2.2, faceTo(1.3, -2.2, -1, -3.5)); setFace(juno, t > vs('onebyone') ? 'shock' : 'worried');
      place(milo, 0.3, -2.2, Math.PI); setFace(milo, 'blank'); shadowOp = 0.6;
      group.forEach((a, i) => {
        const tv = vs('onebyone') + 0.7 + i * 0.42;
        const [x, z] = SPOTS[i];
        if (t < tv) { place(a, x, z, faceTo(x, z, 0.8, -2.2)); setFace(a, 'worried'); pose(a, { headY: Math.sin(t * 2 + i) * 0.4 }); if (a.userData.P.tag) a.userData.P.tag.visible = true; }
        else puffAt(i, x, z, t - tv, 0xff3030);
      });
      camPos = lerpV(v3(0.6, 4.6, 2.8), v3(0.5, 4.2, 2.2), ease(u)); look = v3(0.2, 1.0, -3.2); fov = 56;
      break;
    }
    case 5: { // Milo doesn't move
      doorOn = 0; dark = 1;
      const run = clamp(lt / 1.2);
      place(juno, lerp(2.0, 1.2, ease(run)), lerp(-1.2, -2.05, ease(run)), faceTo(1.2, -2.05, 0.3, -2.2)); setFace(juno, 'worried');
      pose(juno, run < 1 ? walkPose(t * 12, 0.8) : { armLx: -1.2, armLz: 0.2 });
      const turn = ease((t - vs('really') + 0.4) / 1.4);
      place(milo, 0.3, -2.2, lerp(Math.PI, 0.35, turn)); setFace(milo, turn > 0.4 ? 'redeyes' : 'blank'); shadowOp = 0.7;
      if (turn > 0) flicker = 1;
      if (t < vs('didnt') - 0.1) { camPos = v3(1.9, 2.3, 0.1); look = v3(1.1, 2.2, -2.2); }
      else if (t < vs('really') - 0.4) { camPos = lerpV(v3(0.5, 2.6, 0.8), v3(0.45, 2.6, 0.4), ease((t - vs('didnt')) / 2.5)); look = v3(0.3, 2.1, -2.2); }
      else { camPos = lerpV(v3(0.75, 2.3, -0.1), v3(0.65, 2.3, -0.45), ease((t - vs('really')) / 4)); look = v3(0.3, 2.25, -2.2); }
      break;
    }
    case 6: { // the door returns
      dark = 1; fogRed = 1;
      const ta = vs('took') + 1.2;
      doorOn = t < ta ? 0 : (t < ta + 0.8 ? (Math.sin((t - ta) * 60) > 0 ? 1 : 0) : 1);
      if (t >= ta && t < ta + 0.8) glitch = 0.5;
      open = ease((t - ta - 1.0) / 3.0) * 0.9;
      place(milo, 0.3, -2.2, 0.35, t > vs('chose') ? 0.18 * ease((t - vs('chose')) / 1) : 0); setFace(milo, 'redeyes'); shadowOp = 0.8;
      if (t > vs('chose')) pose(milo, { armLz: -1.2, armRz: 1.2, headX: -0.1 });
      place(juno, 1.2, -2.05, faceTo(1.2, -2.05, 0.3, -2.2)); setFace(juno, 'shock'); pose(juno, { bodyX: -0.15 });
      flicker = 1;
      if (t < vs('chose') - 0.1) { camPos = lerpV(v3(2.8, 2.7, 0.8), v3(2.6, 2.6, 0.3), ease(u)); look = v3(0, 2.4, -5.0); fov = 56; }
      else { camPos = lerpV(v3(0.7, 1.4, -0.3), v3(0.6, 1.45, -0.6), ease((t - vs('chose')) / 4)); look = v3(0.3, 2.7, -2.4); fov = 56; }
      break;
    }
    case 7: { // the jacket
      dark = 1; fogRed = 1; open = 0.9; flicker = 0.5;
      place(milo, 0.3, -2.2, 0.25); setFace(milo, 'redeyes'); shadowOp = 0.8;
      pose(milo, { armRx: -0.25, armRz: -0.15 });
      place(juno, 1.9, -1.7, faceTo(1.9, -1.7, 0.3, -2.2)); setFace(juno, 'sad');
      pose(juno, { armLx: -0.5 });
      if (t < vs('saw') - 0.1 || t >= vs('carried') - 0.1) { camPos = lerpV(v3(-0.4, 2.4, -0.1), v3(-0.25, 2.4, -0.4), ease(u)); look = v3(1.9, 2.25, -1.7); }
      else {
        pose(milo, { armRx: -1.25, armRz: 0.35 });
        camPos = lerpV(v3(0.9, 2.2, 1.4), v3(0.9, 2.1, 0.8), ease((t - vs('saw')) / 4)); look = v3(0.9, 1.5, -1.6); fov = 58;
      }
      break;
    }
    case 8: { // Milo fights back
      dark = 1; fogRed = 1; open = 0.9;
      const fight = Math.sin(t * 23) + Math.sin(t * 7.7) > 0.4;
      place(milo, 0.3 + Math.sin(t * 40) * 0.03, -2.2, 0.35); setFace(milo, fight ? 'redeyes' : 'worried'); shadowOp = fight ? 0.9 : 0.4;
      pose(milo, { armLx: -2.5, armRx: -2.5, armLz: -0.6, armRz: 0.6, bodyX: 0.25 + Math.sin(t * 17) * 0.05, headZ: Math.sin(t * 13) * 0.1 });
      place(juno, 1.25, -2.0, faceTo(1.25, -2.0, 0.3, -2.2)); setFace(juno, 'shock');
      shake = 0.35; flicker = 1;
      camPos = lerpV(v3(0.85, 2.4, 0.1), v3(0.8, 2.4, -0.3), ease(u)); look = v3(0.3, 2.2, -2.2);
      break;
    }
    case 9: { // rule number three
      dark = 1; fogRed = 1; open = 0.9;
      place(milo, 0.3, -2.2, 0.9); setFace(milo, Math.sin(t * 9) > 0.7 ? 'redeyes' : 'worried'); shadowOp = 0.6;
      const g = ease((t - vs('grabbed') - 0.3) / 0.8);
      place(juno, lerp(1.25, 1.05, g), lerp(-2.0, -1.95, g), faceTo(1.25, -2.0, 0.3, -2.2)); setFace(juno, 'determined');
      pose(juno, { armLx: -1.1 * g, armLz: 0.25 * g });
      pose(milo, { armLx: -1.0 * g, armLz: -0.2 * g });
      if (t < vs('grabbed') - 0.1) { camPos = lerpV(v3(-0.4, 2.4, -0.1), v3(-0.25, 2.4, -0.4), ease((t - sc.start) / 4)); look = v3(1.2, 2.25, -2.0); }
      else { camPos = lerpV(v3(0.7, 1.9, 2.4), v3(0.7, 1.8, 1.8), ease((t - vs('grabbed')) / 3)); look = v3(0.68, 1.5, -2.1); fov = 60; }
      break;
    }
    case 10: { // the Keeper is torn out
      dark = 1; fogRed = 1; open = 1; flicker = 1; shake = 0.4;
      place(milo, 0.3, -2.2, 0.9); setFace(milo, 'worried'); shadowOp = 0;
      place(juno, 1.05, -1.95, faceTo(1.25, -2.0, 0.3, -2.2)); setFace(juno, 'determined');
      const brace = { bodyX: -0.25 };
      pose(juno, { armLx: -1.1, armLz: 0.25, ...brace }); pose(milo, { armLx: -1.0, armLz: -0.2, ...brace });
      const k = clamp((t - sc.start - 0.2) / (vs('alone') - sc.start));
      const kz = lerp(-2.5, -4.4, ease(k));
      place(keeper, 0.3, kz, 0, lerp(0, 0.6, k)); keeper.visible = (k > 0.25 || Math.sin(t * 50) > 0);
      pose(keeper, { armLx: -1.6 + Math.sin(t * 11) * 0.4, armRx: -1.6 - Math.sin(t * 11) * 0.4, armLz: -0.3, armRz: 0.3 });
      if (t < vs('alone') - 0.1) { camPos = lerpV(v3(0.9, 2.7, 2.0), v3(0.8, 2.6, 1.2), ease(u * 1.5)); look = v3(0.4, 2.5, -3.5); }
      else { camPos = lerpV(v3(3.8, 2.7, -1.0), v3(3.5, 2.6, -1.4), ease((t - vs('alone')) / 3)); look = v3(0.3, 2.4, -4.0); fov = 56; }
      break;
    }
    case 11: { // the door shatters
      dark = 1; fogRed = 1; flicker = 1;
      place(milo, 0.3, -2.2, 0.9); place(juno, 1.05, -1.95, faceTo(1.25, -2.0, 0.3, -2.2)); setFace(milo, 'shock'); setFace(juno, 'shock');
      pose(juno, { armLx: -1.1, armLz: 0.25, bodyX: -0.2 }); pose(milo, { armLx: -1.0, armLz: -0.2, bodyX: -0.2 });
      const kp = ease((t - sc.start) / (vs('shattered') - sc.start));
      if (kp < 1) { place(keeper, 0.3, lerp(-4.4, -7.6, kp), 0, 0.6); pose(keeper, { armLx: -2.4, armRx: -2.4 }); }
      const tsh = vs('shattered') + 0.9;
      open = t < vs('shattered') ? 1 : (t < tsh ? 1 - ease((t - vs('shattered')) / 0.3) : 0);
      if (t >= tsh) { doorOn = 0; doorBreak = t - tsh; shake = clamp(1 - doorBreak / 0.8); flash = clamp(1 - doorBreak / 0.7); flashCol = '#ffffff'; }
      else shake = 0.4;
      camPos = lerpV(v3(0.6, 2.8, 1.8), v3(0.5, 2.7, 0.9), ease(u)); look = v3(0, 2.6, -5.6);
      break;
    }
    case 12: { // everyone returns
      doorOn = 0; doorBreak = 99;
      warm = ease((t - vs('returned')) / 2.5); dark = 1 - warm;
      place(milo, 0.3, -2.2, 0.9); place(juno, 1.05, -1.95, faceTo(1.05, -1.95, 0.3, -2.2));
      setFace(milo, 'smile'); setFace(juno, 'laugh');
      group.forEach((a, i) => {
        const tv = vs('returned') + 1.6 + i * 0.3; const [x, z] = SPOTS[i];
        if (t >= tv) { place(a, x, z, faceTo(x, z, 0.8, -2.0)); setFace(a, 'laugh'); cheer(a, i, 0.8); if (a.userData.P.tag) a.userData.P.tag.visible = true; puffAt(i, x, z, t - tv, 0xffd24a, true); }
      });
      if (t >= vs('friends') - 0.1) { const h = ease((t - vs('friends') + 0.1) / 0.6); const hp = { armLx: -1.35 * h, armRx: -1.35 * h, armLz: -0.55 * h, armRz: 0.55 * h };
        place(juno, lerp(1.05, 0.95, h), -2.0, faceTo(1.05, -1.95, 0.3, -2.2)); pose(milo, hp); pose(juno, hp); setFace(milo, 'sleep'); setFace(juno, 'sleep'); held.visible = false; }
      if (t < vs('twice') - 0.1) { camPos = lerpV(v3(0.9, 3.2, 2.4), v3(0.8, 3.0, 1.6), ease(u * 1.6)); look = v3(0.4, 1.6, -3.0); }
      else if (t < vs('friends') - 0.1) { camPos = v3(0.85, 2.35, 0.2); look = v3(0.5, 2.2, -2.1); }
      else { camPos = lerpV(v3(-2.6, 2.6, 0.5), v3(-2.3, 2.55, 0.1), ease((t - vs('friends')) / 3)); look = v3(0.65, 2.0, -2.05); fov = 54; }
      break;
    }
    case 13: { // never seen again... a blue door
      doorOn = 0; doorBreak = 99;
      if (t < vs('somewhere') - 0.3) {
        warm = 1; dark = 0;
        place(milo, 0.3, -2.2, 0.3); place(juno, 1.2, -2.2, -0.3); setFace(milo, 'laugh'); setFace(juno, 'laugh');
        pose(juno, { armLx: -0.4, armLz: 0.3 }); pose(milo, { armRx: -0.4, armRz: -0.3 });
        group.forEach((a, i) => { const [x, z] = SPOTS[i]; place(a, x, z, faceTo(x, z, 0.8, 1.5)); setFace(a, 'laugh'); cheer(a, i, 0.7); if (a.userData.P.tag) a.userData.P.tag.visible = true; });
        camPos = lerpV(v3(0.6, 2.6, 2.4), v3(0.6, 4.2, 3.6), ease((t - sc.start) / (vs('somewhere') - sc.start))); look = v3(0.3, 1.8, -3.2); fov = 56;
      } else {
        warm = 0; dark = 1; blueOn = 1; sign3.visible = false; held.visible = false;
        flash = clamp(1 - (t - vs('somewhere') + 0.3) / 0.4) * 0.8; flashCol = '#000000';
        blueOpen = ease((t - vs('blue') - 0.2) / 2.0) * 0.5;
        camPos = lerpV(v3(4.3, 2.3, -1.4), v3(4.9, 2.3, -3.0), ease((t - vs('somewhere')) / 6)); look = v3(5.6, 2.0, -6.1);
      }
      tint = clamp((t - (sc.end - 3.6)) / 0.6) * 0.6;
      break;
    }
  }
  wordsMesh.visible = false;
  // world state (part 4)
  doorParts.forEach(o => o.visible = doorOn > 0);
  debris.forEach(m => { if (doorBreak < 0 || doorBreak > 3) { m.visible = false; return; } const d = m.userData; m.visible = true;
    m.position.set(d.p.x + d.v.x * doorBreak, Math.max(0.2, d.p.y + d.v.y * doorBreak - 4.9 * doorBreak * doorBreak), d.p.z + d.v.z * doorBreak); m.rotation.set(d.s * doorBreak, d.s * doorBreak * 0.7, 0); });
  miloShadow.material.opacity = shadowOp;
  blueG.visible = blueOn > 0; bluePivot.rotation.y = -1.3 * blueOpen; blueLight.intensity = blueOn ? 10 + 30 * blueOpen : 0;
  // world state
  insideG.visible = inside;
  if (inside) { sign.position.set(-2.85, 4.9, -5.0); sign.rotation.set(0, 0.35, Math.PI); clockG.position.x = 4.3;
    minHand.rotation.z = t * 2.5; hourHand.rotation.z = t * 0.4;
    floaters.forEach(m => { const d = m.userData; m.position.set(d.x, d.y + Math.sin(t * d.sp + d.ph) * 0.4, d.z); m.rotation.set(t * d.sp * 0.5, t * d.sp * 0.3 + d.ph, 0); }); }
  drawRule2(rule2Draw); drawRule3(rule3Draw);
  crownLight.intensity = crownGlow * 8; crownGlowM.emissiveIntensity = 0.3 + crownGlow * 2.5;
  sign3Light.intensity = sign3.visible ? 6 * rule3Draw : 0;
  edgeGlow.material.opacity = clamp(edge);
  doorPivot.rotation.y = -1.35 * open;
  wordsMesh.visible = words > 0;
  const sk = shake * 0.05;
  doorShake.position.set(Math.sin(t * 90) * sk, 0, Math.cos(t * 70) * sk * 0.6);

  const fl = flick(t) * (flicker ? (1 - flicker * 0.35 * (Math.sin(t * 31) > 0.6 ? 1 : 0)) : 1);
  doorLight.intensity = 11 * fl;
  innerLight.intensity = open * 90 * fl;
  links.forEach(m => { const d = m.userData; m.visible = chains > 0; if (chainT < 0) { m.position.copy(d.base); m.rotation.copy(d.rot); } else { m.position.set(d.base.x + d.v.x * chainT, Math.max(0.05, d.base.y + d.v.y * chainT - 4.9 * chainT * chainT), d.base.z + d.v.z * chainT); m.rotation.set(d.rot.x + d.s * chainT, d.rot.y + d.s * chainT * 0.6, d.rot.z); } });
  lockG.visible = chains > 0; if (chainT < 0) lockG.position.set(0, 2.5, DOOR_Z + 0.42); else lockG.position.set(lockG.userData.v.x * chainT, Math.max(0.25, 2.5 + lockG.userData.v.y * chainT - 4.9 * chainT * chainT), DOOR_Z + 0.42 + lockG.userData.v.z * chainT);
  glowMat.color.setRGB(1.6, 0.08 + 0.04 * Math.sin(t * 9), 0.04);
  hemi.color.copy(inside ? HEMI_IN : HEMI_SKY);
  hemi.intensity = (inside ? 1.9 : 1.1) * fl; insideLight.intensity = inside ? 30 * fl : 0;
  moon.intensity = inside ? 0.5 : 1.2;
  lampL.intensity = lampR.intensity = (inside ? 0 : 5) * (0.9 + 0.1 * Math.sin(t * 13)) * (1 - dark) * (1 + warm);
  hemi.intensity *= (1 - 0.65 * dark) * (1 + 0.5 * warm); moon.intensity *= (1 - 0.75 * dark);
  if (warm > 0) hemi.color.copy(HEMI_SKY).lerp(WARM_SKY, warm);
  doorLight.intensity *= doorOn; innerLight.intensity *= doorOn;
  lampMeshes.forEach(l => l.visible = !inside);
  cubeLight.intensity = glass.visible ? 18 * fl : 0;
  const fogC = inside ? FOG_IN.clone() : FOG_BASE.clone().lerp(FOG_RED, fogRed * open * 0.8 * doorOn);
  if (warm > 0) fogC.copy(FOG_BASE).lerp(FOG_WARM, warm);
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
  if (sc.id === 1 && lt < 3.0) { hook = '<span class="part">PART 4</span><br>THE <em>FINALE</em>'; hookOp = clamp(lt / 0.25) * clamp((3.0 - lt) / 0.3); }
  setText('hook', hook, hookOp);
  const cap = (sc.id === 1 && lt < 3.0) ? null : TL.captions.find(c => t >= c.start && t < c.end + 0.12);
  const capEl = $('cap'); capEl.style.color = cap ? SPK_COLOR[cap.spk] : '#fff';
  setText('cap', cap ? cap.text : '', cap ? 1 : 0);
  let big = '', sub = '', bop = 0, bigColor = '#ffffff';
  if (sc.id === 13 && t >= sc.end - 3.6) { big = 'THE END'; sub = 'Follow for the<br>next story 👇'; bop = clamp((t - (sc.end - 3.6)) / 0.4); }
  setText('sys', sysMsg, sysMsg ? 1 : 0);
  const ge = $('glitch');
  if (glitch > 0) { const r = rng(Math.floor(t * 30) + 7); let bars = [];
    for (let i = 0; i < 9; i++) { const y = Math.floor(r() * 100), h = 1 + Math.floor(r() * 5); const c = ['rgba(255,0,60,.55)', 'rgba(0,255,220,.45)', 'rgba(255,255,255,.35)'][i % 3]; bars.push(`linear-gradient(transparent ${y}%, ${c} ${y}%, ${c} ${y + h}%, transparent ${y + h}%)`); }
    ge.style.background = bars.join(','); ge.style.opacity = glitch; ge.style.transform = `translateX(${(r() - 0.5) * 40 * glitch}px)`;
  } else ge.style.opacity = 0;
  $('big').style.color = bigColor;
  setText('big', big, bop); setText('sub', sub, bop);
  return true;
};
window.DURATION = TL.duration;
window.READY = true;
