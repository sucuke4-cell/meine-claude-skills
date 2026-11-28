// "The Temple of Whispering Eyes" — block-style mystery. Jungle village Verdant Hollow, temple, tile hall, eye hall, treasure room.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeBlockAvatar, setBlockFace, poseBlock, talkBlock, walkBlock, petrify } from '../../shared/avatars_block.js';
import { rng, clamp, lerp, ease, easeOut, v3, lerpV, faceTo, canvasTex, mat,
  setupRenderer, setupComposer, makeSky, cloudField, ground, water, contactShadow } from '../../shared/world_kit.js';

const TL = await (await fetch('./timeline.json')).json();
const W = 1080, H = 1920, VO = TL.vo;
const vs = k => VO[k].start, ve = k => VO[k].start + VO[k].dur;

const renderer = setupRenderer(W, H);
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.2;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 500); scene.add(camera);
const { composer, bloom } = setupComposer(renderer, scene, camera, W, H);
const hemi = new THREE.HemisphereLight(0xd8ecff, 0x40503a, 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 2.4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 120 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02; scene.add(sun, sun.target);
const frontFill = new THREE.DirectionalLight(0xfff2e4, 0.8); scene.add(frontFill, frontFill.target);

// ---------- shared materials / textures ----------
const stoneTex = canvasTex(256, 256, (g) => { g.fillStyle = '#7d8a76'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(20,35,25,0.5)'; g.lineWidth = 3; for (let y = 0; y < 256; y += 42) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); for (let x = (y / 42) % 2 ? 30 : 0; x < 256; x += 60) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 42); g.stroke(); } } const r = rng(3); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '40,90,40' : '20,20,20'},${r() * 0.3})`; g.fillRect(r() * 256, r() * 256, 4, 4); } });
stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
const stoneM = (rep = 2) => { const t = stoneTex.clone(); t.needsUpdate = true; t.repeat.set(rep, rep); return mat(0xffffff, { map: t, roughness: 0.95 }); };
const EYE = new THREE.MeshBasicMaterial({ color: 0xffb040, toneMapped: false }); // all temple eyes share this: amber / red / green
const goldM = mat(0xe8b830, { metalness: 0.9, roughness: 0.25 });
const leafCols = [0x2e7a3a, 0x3a8a44, 0x24682e, 0x4a9a4a];
function stoneHead(sc = 1) { const g = new THREE.Group(); const h = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.7, 1.2), stoneM(1)); h.castShadow = true; g.add(h); for (const s of [-1, 1]) { const sock = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.1), mat(0x2a3028)); sock.position.set(0.38 * s, 0.25, 0.6); g.add(sock); const e = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), EYE); e.scale.set(1.4, 0.8, 0.5); e.position.set(0.38 * s, 0.25, 0.64); g.add(e); } const brow = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 0.2), stoneM(1)); brow.position.set(0, 0.5, 0.62); g.add(brow); const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.1), mat(0x2a3028)); mouth.position.set(0, -0.4, 0.6); g.add(mouth); g.scale.setScalar(sc); return g; }
function jungleTree(seed, s = 1) { const r = rng(seed); const g = new THREE.Group(); const h = 6 + r() * 4; const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * s, 0.4 * s, h * s, 8), mat(0x5a4028, { roughness: 1 })); tr.position.y = h * s / 2; tr.castShadow = true; g.add(tr); for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry((1.4 + r() * 1.2) * s, 1), mat(leafCols[i % 4], { flatShading: true, roughness: 0.9 })); f.position.set((r() - 0.5) * 2.4 * s, h * s + (r() - 0.3) * 1.6 * s, (r() - 0.5) * 2.4 * s); f.castShadow = true; g.add(f); } for (let i = 0; i < 4; i++) { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3 + r() * 3, 4), mat(0x2e6a2a)); v.position.set((r() - 0.5) * 2 * s, h * s - 2, (r() - 0.5) * 2 * s); g.add(v); } return g; }
function fern(seed) { const r = rng(seed); const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 4), mat(leafCols[i % 4], { flatShading: true })); c.position.set((r() - 0.5) * 0.6, 0.6, (r() - 0.5) * 0.6); c.rotation.set((r() - 0.5) * 0.8, r() * 3, (r() - 0.5) * 0.8); g.add(c); } return g; }

// ================= VERDANT HOLLOW (village, origin) =================
const sky = makeSky(0x7ac8e8, 0xe8f4e0, 380); scene.add(sky);
const clouds = cloudField(10, 160, 30, 5); scene.add(clouds);
const grass = ground(140, 140, 'grass', 0x4a8a3a, 0x356a2a, 18); grass.position.set(0, 0, 0); scene.add(grass);
const river = water(140, 9, 0x2a6a5a, 0x5ab8a0); river.position.set(0, 0.05, -8); scene.add(river);
const pathT = canvasTex(128, 512, (g) => { g.fillStyle = '#8a6a44'; g.fillRect(0, 0, 128, 512); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(60,40,20,${Math.random() * 0.3})`; g.fillRect(Math.random() * 128, Math.random() * 512, 4, 4); } }); pathT.wrapT = THREE.RepeatWrapping; pathT.repeat.set(1, 4);
const path = new THREE.Mesh(new THREE.PlaneGeometry(3, 26), mat(0xffffff, { map: pathT })); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.03, 8); path.receiveShadow = true; scene.add(path);
const bridge = new THREE.Group(); for (let i = 0; i < 18; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.45), mat(0x8a6a44)); p.position.set(0, 0.6, -3.4 - i * 0.5); p.castShadow = true; bridge.add(p); } for (const s of [-1, 1]) { const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 9.5, 6), mat(0xc8b088)); rope.rotation.x = Math.PI / 2; rope.position.set(1.3 * s, 1.5, -7.6); bridge.add(rope); } scene.add(bridge);
function hut(x, z, ry, wall, seed) { const g = new THREE.Group(); const r = rng(seed); for (const px of [-1.4, 1.4]) for (const pz of [-1.2, 1.2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.6, 6), mat(0x5a4028)); p.position.set(px, 0.8, pz); g.add(p); }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 3.2), mat(0x8a6a44)); deck.position.y = 1.6; deck.receiveShadow = true; g.add(deck);
  const plankT = canvasTex(128, 128, (c) => { c.fillStyle = '#' + wall.toString(16).padStart(6, '0'); c.fillRect(0, 0, 128, 128); c.strokeStyle = 'rgba(0,0,0,0.2)'; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(i * 16, 0); c.lineTo(i * 16, 128); c.stroke(); } });
  const room = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.2, 2.6), mat(0xffffff, { map: plankT })); room.position.y = 2.8; room.castShadow = true; g.add(room);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.05), mat(0x2a1a0a)); door.position.set(0.5, 2.45, 1.31); g.add(door);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.05), mat(0xffd080, { emissive: 0xffa040, emissiveIntensity: 0 })); win.position.set(-0.7, 2.9, 1.31); g.add(win); g.userData.win = win.material;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.8, 4), mat(0xc8a860, { flatShading: true, roughness: 1 })); roof.rotation.y = Math.PI / 4; roof.position.y = 4.8; roof.castShadow = true; g.add(roof);
  const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.1), mat(0x6a4a2a)); ladder.position.set(0.5, 0.8, 1.8); ladder.rotation.x = -0.3; g.add(ladder);
  g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); return g; }
const huts = [hut(-4.2, 4, 0.5, 0xb88a5a, 1), hut(4.4, 6, -0.6, 0xa07a4a, 2), hut(-5, 12, 0.7, 0xc89a6a, 3), hut(5, 14, -0.5, 0xb07a52, 4)];
{ const r = rng(12); for (let i = 0; i < 26; i++) { const x = (r() < 0.5 ? -1 : 1) * (9 + r() * 25), z = -2 + r() * 40; const t = jungleTree(i + 40, 0.9 + r() * 0.4); t.position.set(x, 0, z); scene.add(t); } for (let i = 0; i < 30; i++) { const f = fern(i); f.position.set((r() - 0.5) * 18, 0, 2 + r() * 20); if (Math.abs(f.position.x) > 2) scene.add(f); } }
const canoe = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.2, 3, 8, 1, false, 0, Math.PI), mat(0x6a4028)); canoe.rotation.set(0, 0, Math.PI / 2); canoe.rotation.y = 0.3; canoe.position.set(4, 0.25, -6); scene.add(canoe);
const lostHat = new THREE.Group(); { const m = mat(0x9a8a6a, { roughness: 0.9 }); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.05, 24), m); lostHat.add(brim); const crown = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 10, 0, 7, 0, 1.3), m); crown.position.y = 0.0; lostHat.add(crown); } scene.add(lostHat);

// ================= JUNGLE + TEMPLE (x = 100) =================
const JX = 100;
const jGround = ground(80, 120, 'grass', 0x3a6a2e, 0x2a5222, 16); jGround.position.set(JX, 0.01, -30); scene.add(jGround);
const jPath = new THREE.Mesh(new THREE.PlaneGeometry(3, 50), mat(0xffffff, { map: pathT })); jPath.rotation.x = -Math.PI / 2; jPath.position.set(JX, 0.03, -20); scene.add(jPath);
{ const r = rng(77); for (let i = 0; i < 40; i++) { const side = r() < 0.5 ? -1 : 1; const t = jungleTree(i + 100, 1 + r() * 0.5); t.position.set(JX + side * (4 + r() * 18), 0, 4 - r() * 50); scene.add(t); } for (let i = 0; i < 50; i++) { const f = fern(i + 300); f.position.set(JX + (r() < 0.5 ? -1 : 1) * (1.8 + r() * 8), 0, 4 - r() * 44); scene.add(f); } }
const guardHead = stoneHead(0.7); guardHead.position.set(JX + 2.6, 1.3, -12.5); guardHead.rotation.y = -0.4; scene.add(guardHead); const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.0), stoneM(1)); pedestal.position.set(JX + 2.6, 0.45, -12.5); scene.add(pedestal);
const TZ = -46; const temple = new THREE.Group();
[[22, 4, 18], [17, 4, 14], [12, 4, 10], [8, 5, 7]].forEach(([w, h, d], i) => { const t = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stoneM(w / 4)); t.position.y = [2, 6, 10, 14.5][i]; t.castShadow = t.receiveShadow = true; temple.add(t); });
const stairs = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 14), stoneM(2)); stairs.rotation.x = -0.75; stairs.position.set(0, 4.6, 9.6); temple.add(stairs);
const face = stoneHead(3.2); face.position.set(0, 14.6, 3.6); temple.add(face);
const door = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.6, 0.3), mat(0x050806)); door.position.set(0, 1.8, 9.05); temple.add(door);
const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.6, 0.6), stoneM(1)); doorFrame.position.set(0, 3.9, 9.1); temple.add(doorFrame);
{ const r = rng(5); for (let i = 0; i < 160; i++) { const v = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 + r() * 0.35, 0), mat(leafCols[i % 4], { flatShading: true })); const tier = r() * 3 | 0; const ww = [22, 17, 12][tier]; v.position.set((r() - 0.5) * ww, [3.5, 7.5, 11.5][tier] + r() * 1.2, [9.1, 7.1, 5.1][tier]); temple.add(v); } }
temple.position.set(JX, 0, TZ); scene.add(temple);
const torchL = []; for (const s of [-1, 1]) { const t = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 6), mat(0x3a2a1a)); pole.position.y = 1.1; t.add(pole); const fl = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 8), new THREE.MeshBasicMaterial({ color: 0xffa030, toneMapped: false })); fl.position.y = 2.5; t.add(fl); const l = new THREE.PointLight(0xff9a40, 0, 9, 1.6); l.position.y = 2.6; t.add(l); torchL.push(l); t.position.set(JX + 3 * s, 0, TZ + 11); scene.add(t); }
const fireflies = new THREE.Group(); { const tx = canvasTex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,180,1)'); gr.addColorStop(1, 'rgba(180,255,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }); const m = new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }); const r = rng(8); for (let i = 0; i < 70; i++) { const s = new THREE.Sprite(m); s.userData = { x: (r() - 0.5) * 16, y: 0.5 + r() * 4, z: -r() * 40, p: r() * 6 }; s.scale.setScalar(0.25); fireflies.add(s); } } scene.add(fireflies);

// ================= TEMPLE INTERIORS =================
function hall(cx, w, d, h) { const g = new THREE.Group(); const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), stoneM(w / 3)); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const walls = [[w, h, 0, h / 2, -d / 2, 0], [d, h, -w / 2, h / 2, 0, Math.PI / 2], [d, h, w / 2, h / 2, 0, -Math.PI / 2], [w, h, 0, h / 2, d / 2, Math.PI]];
  walls.forEach(([ww, hh, x, y, z, ry]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), stoneM(ww / 3)); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), stoneM(w / 3)); ceil.rotation.x = Math.PI / 2; ceil.position.y = h; g.add(ceil);
  g.position.set(cx, 0, 0); scene.add(g); return g; }
function wallTorch(x, y, z, ry) { const t = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), mat(0x3a2a1a)); t.add(b); const fl = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0xffa030, toneMapped: false })); fl.position.y = 0.45; t.add(fl); const l = new THREE.PointLight(0xff9a40, 6, 10, 1.7); l.position.set(0, 0.5, 0.4); t.add(l); t.position.set(x, y, z); t.rotation.y = ry; scene.add(t); return l; }
// tile hall (x = 200)
const TH = 200; hall(TH, 10, 22, 7);
const tileT = canvasTex(128, 128, (g) => { g.fillStyle = '#8a8a7a'; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 6; g.strokeRect(3, 3, 122, 122); });
const eyeTileT = canvasTex(128, 128, (g) => { g.fillStyle = '#8a8a7a'; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 6; g.strokeRect(3, 3, 122, 122); g.strokeStyle = '#2a2a20'; g.lineWidth = 7; g.beginPath(); g.ellipse(64, 64, 40, 22, 0, 0, 7); g.stroke(); g.fillStyle = '#2a2a20'; g.beginPath(); g.arc(64, 64, 12, 0, 7); g.fill(); });
const tiles = []; const SAFE = new Set(); [[3, 0], [2, 1], [2, 2], [3, 3], [4, 4], [4, 5], [3, 6], [2, 7], [3, 8], [3, 9]].forEach(([c, r]) => SAFE.add(c + ',' + r));
for (let c = 0; c < 7; c++) for (let r = 0; r < 10; r++) { const safe = SAFE.has(c + ',' + r); const t = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.3, 1.15), mat(0xffffff, { map: safe ? eyeTileT : tileT, roughness: 0.9 })); t.position.set(TH - 3.6 + c * 1.2, 0.15, 6 - r * 1.2); t.receiveShadow = true; t.castShadow = true; t.userData = { c, r, safe }; scene.add(t); tiles.push(t); }
const tilePos = (c, r) => v3(TH - 3.6 + c * 1.2, 0.3, 6 - r * 1.2);
const fallTile = tiles.find(t => t.userData.c === 4 && t.userData.r === 1);
wallTorch(TH - 4.8, 3, -4, Math.PI / 2); wallTorch(TH + 4.8, 3, 2, -Math.PI / 2); wallTorch(TH - 4.8, 3, 6, Math.PI / 2); wallTorch(TH + 4.8, 3, -6, -Math.PI / 2);
// eye hall (x = 300): walls of stone heads
const EH = 300; hall(EH, 12, 16, 9);
for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) { for (const side of [-1, 1]) { const h = stoneHead(0.8); h.position.set(EH + side * 5.6, 1.6 + row * 2.4, -6 + i * 2.4); h.rotation.y = -side * Math.PI / 2; scene.add(h); } const hb = stoneHead(0.8); hb.position.set(EH - 5 + i * 2, 1.6 + row * 2.4, -7.6); scene.add(hb); }
const ehLight = new THREE.PointLight(0xffb040, 0, 24, 1.2); ehLight.position.set(EH, 6, 0); scene.add(ehLight);
wallTorch(EH - 3, 2.6, 7.8, Math.PI); wallTorch(EH + 3, 2.6, 7.8, Math.PI);
// treasure room (x = 400)
const TR = 400; hall(TR, 14, 16, 9);
const goldPiles = new THREE.Group(); { const r = rng(9); for (let p = 0; p < 7; p++) { const cx = TR + (p % 2 ? 1 : -1) * (2.5 + r() * 3), cz = -5 + (p / 7) * 9 + r(); const mound = new THREE.Mesh(new THREE.SphereGeometry(1.2 + r() * 0.6, 16, 10, 0, 7, 0, Math.PI / 2), goldM); mound.scale.y = 0.6; mound.position.set(cx, 0, cz); goldPiles.add(mound); for (let i = 0; i < 30; i++) { const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12), goldM); coin.position.set(cx + (r() - 0.5) * 2.4, r() * 0.8, cz + (r() - 0.5) * 2.4); coin.rotation.set(r() * 3, r() * 3, r() * 3); goldPiles.add(coin); } const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), mat([0xff3a5a, 0x3ad8a8, 0x5a8aff][p % 3], { emissive: [0x6a0a1a, 0x0a5a3a, 0x0a2a6a][p % 3], emissiveIntensity: 0.6, roughness: 0.1 })); gem.position.set(cx, 0.9, cz); goldPiles.add(gem); }
  for (let i = 0; i < 3; i++) { const chest = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.8), mat(0x6a4020)); b.position.y = 0.35; chest.add(b); const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12, 1, false, 0, Math.PI), mat(0x6a4020)); lid.rotation.z = Math.PI / 2; lid.position.y = 0.7; chest.add(lid); const band = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.1, 0.85), goldM); band.position.y = 0.55; chest.add(band); chest.position.set(TR - 4 + i * 4, 0, -6.5); goldPiles.add(chest); } }
scene.add(goldPiles);
const grabGold = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 10, 0, 7, 0, Math.PI / 2), goldM); grabGold.scale.y = 0.6; grabGold.position.set(TR + 2.6, 0, 1.4); scene.add(grabGold);
const crystalM = new THREE.MeshStandardMaterial({ color: 0x8ae8ff, transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.1, emissive: 0x2a8aa8, emissiveIntensity: 0.6, flatShading: true, depthWrite: false });
const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 0), crystalM); crystal.scale.set(0.9, 1.5, 0.9); crystal.position.set(TR, 1.75, -1.5); crystal.renderOrder = 3; scene.add(crystal);
const crystalLight = new THREE.PointLight(0x6ae0ff, 6, 10, 1.6); crystalLight.position.set(TR, 2.2, -0.2); scene.add(crystalLight);
const muralT = canvasTex(1024, 512, (g, w, h) => { g.fillStyle = '#6a6a58'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a2a20'; g.lineWidth = 10; g.strokeRect(20, 20, w - 40, h - 40); g.fillStyle = '#d8b040';
  const fig = (x, y, c) => { g.fillStyle = c; g.fillRect(x - 18, y - 110, 36, 36); g.fillRect(x - 28, y - 70, 56, 70); g.fillRect(x - 24, y, 18, 60); g.fillRect(x + 6, y, 18, 60); };
  fig(170, 330, '#2a2a20'); g.fillStyle = '#d8b040'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(260 + i * 14, 380 - (i % 3) * 14, 12, 0, 7); g.fill(); } g.fillStyle = '#2a2a20'; g.font = 'bold 90px serif'; g.fillText('→', 410, 320);
  g.strokeStyle = '#8ad8e8'; g.lineWidth = 8; g.beginPath(); g.moveTo(620, 120); g.lineTo(700, 200); g.lineTo(700, 400); g.lineTo(620, 460); g.lineTo(540, 400); g.lineTo(540, 200); g.closePath(); g.stroke(); fig(620, 360, '#2a2a20');
  g.fillStyle = '#2a2a20'; g.font = 'bold 90px serif'; g.fillText('×', 790, 320); g.strokeStyle = '#2a2a20'; g.lineWidth = 10; g.beginPath(); g.ellipse(900, 260, 60, 34, 0, 0, 7); g.stroke(); g.fillStyle = '#c03030'; g.beginPath(); g.arc(900, 260, 18, 0, 7); g.fill(); });
const mural = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), mat(0xffffff, { map: muralT, roughness: 0.9, emissive: 0xffffff, emissiveMap: muralT, emissiveIntensity: 0.45 })); mural.position.set(TR, 4.2, -7.95); scene.add(mural);
const trTorches = [wallTorch(TR - 6.8, 3, -3, Math.PI / 2), wallTorch(TR + 6.8, 3, -3, -Math.PI / 2), wallTorch(TR - 6.8, 3, 4, Math.PI / 2), wallTorch(TR + 6.8, 3, 4, -Math.PI / 2)];

// ================= CHARACTERS =================
const zuri = makeBlockAvatar({ seed: 1, scale: 0.48, skin: 0x8d5524, shirt: 'safari', color: 0xc8b48a, sleeve: 0xc8b48a, cuff: 0xb0a070, pants: 0x6a5a3a, shoes: 0x5a3a1e, boots: true, hair: { style: 'ponytail', color: 0x1a1010 }, hat: 'explorer', hatColor: 0xd8c49a, satchel: 0x7a4a2a, prop: 'lantern', face: { lashes: true } });
const crane = makeBlockAvatar({ seed: 2, scale: 0.6, skin: 0xf2d2b4, shirt: 'suit', color: 0xf0ece4, tie: 0xc0392b, button: 0xd8b040, pants: 0xf0ece4, shoes: 0x6a4020, hair: { style: 'slick', color: 0x1a1a1a }, glasses: 'round', face: { mustache: 0x1a1a1a } });
const grandpa = makeBlockAvatar({ seed: 3, scale: 0.6, skin: 0x6b4226, shirt: 'safari', color: 0xa89a7a, sleeve: 0xa89a7a, pants: 0x5a4a32, shoes: 0x4a3020, boots: true, hair: { style: 'slick', color: 0xe8e4dc }, hat: 'explorer', hatColor: 0x9a8a6a, face: { beard: 0xe8e4dc, mustache: 0xe8e4dc } });
const elder = makeBlockAvatar({ seed: 4, scale: 0.58, skin: 0x6b4226, shirt: 'tee', color: 0xc86a2a, stripe: 0xf0c040, sleeve: 0xc86a2a, pants: 0x7a3a1a, shoes: 0x3a2a1a, hair: { style: 'long', color: 0xd8d4cc }, pearls: true, face: { lashes: true } });
const villagers = [0x3a8ac8, 0x6ab04a, 0xd8a030, 0xb04a6a].map((c, i) => makeBlockAvatar({ seed: 10 + i, scale: i % 2 ? 0.5 : 0.58, skin: [0x8d5524, 0xc68642, 0x6b4226, 0xe0ac69][i], shirt: 'tee', color: c, stripe: i % 2 ? 0xffffff : null, pants: [0x3a3a3a, 0x5a4a32, 0x2a3a5a, 0x4a3a2a][i], hair: { style: ['bun', 'swoop', 'curly', 'long'][i], color: 0x1a1010 } }));
const ALL = [zuri, crane, grandpa, elder, ...villagers];
ALL.forEach(a => { scene.add(a); a.userData.cs = contactShadow(1.7 / a.scale.x); a.add(a.userData.cs); });
const zuriLamp = []; zuri.traverse(o => { if (o.isPointLight) zuriLamp.push(o); });
const SPEAK = { Z: zuri, C: crane, G: grandpa, E: elder };
let T = 0; const speaking = av => Object.values(VO).some(v => SPEAK[v.spk] === av && T >= v.start && T < v.start + v.dur - 0.05);

// ---------- helpers ----------
let curScene = TL.scenes[0];
function put(av, x, z, ry, y = 0) { av.visible = true; av.position.set(x, y, z); av.rotation.set(0, ry, 0); return av; }
function act(av, face, p = {}) { poseBlock(av, { bodyZ: Math.sin(T * 0.8 + av.userData.P.o.seed) * 0.02, headY: Math.sin(T * 0.5 + av.userData.P.o.seed) * 0.06, ...p }); talkBlock(av, T, speaking(av), face); }
function cuts(t, list) { let s0 = curScene.start; for (const sh of list) { if (t < sh[0] || sh === list[list.length - 1]) { const u = clamp((t - s0) / Math.max(0.01, sh[0] - s0)); const [_, cA, cB, lA, lB, f] = sh; return { cam: lerpV(cA, cB || cA, ease(u)), look: lerpV(lA, lB || lA, ease(u)), fov: f || 50 }; } s0 = sh[0]; } }
const headP = av => av.position.clone().add(v3(0, 4.6 * av.scale.y, 0));
function CU(until, av, o = {}) { const d = (o.d ?? 5.2) * av.scale.x, ang = (o.ang ?? 0.25) + av.rotation.y, h = headP(av); const dir = v3(Math.sin(ang), 0, Math.cos(ang)); const look = h.clone().add(v3(0, (o.ly ?? -0.9) * av.scale.x, 0)); const up = (o.up ?? 0.2) * av.scale.x; return [until, h.clone().addScaledVector(dir, d * 1.07).add(v3(0, up, 0)), h.clone().addScaledVector(dir, d * 0.96).add(v3(0, up, 0)), look, look, o.fov ?? 40]; }
const rampV = (t, t0, t1, a, b) => lerp(a, b, ease((t - t0) / Math.max(0.01, t1 - t0)));
function setEyes(c, bright = 1) { EYE.color.setHex(c).multiplyScalar(bright); }

// ---------- moods ----------
function setMood(name, fx, fz) {
  scene.fog = null; renderer.domElement.style.filter = ''; sky.visible = clouds.visible = !['temple', 'flash'].includes(name);
  torchL.forEach(l => l.intensity = 0); huts.forEach(h => h.userData.win.emissiveIntensity = 0);
  if (name === 'day') { sky.userData.setColors(0x7ac8e8, 0xe8f4e0); hemi.color.setHex(0xe0f0ff); hemi.groundColor.setHex(0x40503a); hemi.intensity = 1.2; sun.color.setHex(0xfff0d8); sun.intensity = 2.6; sun.position.set(fx + 12, 22, fz + 14); scene.fog = new THREE.FogExp2(0xc8e0c8, 0.012); }
  else if (name === 'jungle') { sky.userData.setColors(0x8ad0c0, 0xd8f0c8); hemi.color.setHex(0xd0f0d8); hemi.groundColor.setHex(0x2a4a2a); hemi.intensity = 1.25; sun.color.setHex(0xfff0c8); sun.intensity = 2.0; sun.position.set(fx + 8, 24, fz + 10); scene.fog = new THREE.FogExp2(0x8ab89a, 0.022); }
  else if (name === 'dusk') { sky.userData.setColors(0x5a4a8a, 0xffa070); hemi.color.setHex(0xffc8a0); hemi.groundColor.setHex(0x3a2a3a); hemi.intensity = 1.1; sun.color.setHex(0xffa060); sun.intensity = 1.8; sun.position.set(fx - 16, 8, fz + 10); scene.fog = new THREE.FogExp2(0x8a6a7a, 0.012); huts.forEach(h => h.userData.win.emissiveIntensity = 1.4); }
  else if (name === 'night') { sky.userData.setColors(0x0a1430, 0x1a3a4a); hemi.color.setHex(0x7a9ad8); hemi.groundColor.setHex(0x101a14); hemi.intensity = 1.0; sun.color.setHex(0x8aa0e0); sun.intensity = 0.9; sun.position.set(fx + 10, 20, fz + 14); scene.fog = new THREE.FogExp2(0x0e1e28, 0.02); torchL.forEach(l => l.intensity = 9); }
  else if (name === 'dawn') { sky.userData.setColors(0x5a7ac8, 0xffc0a0); hemi.color.setHex(0xffd8c8); hemi.groundColor.setHex(0x3a4030); hemi.intensity = 1.25; sun.color.setHex(0xffb080); sun.intensity = 2.2; sun.position.set(fx - 14, 9, fz + 16); scene.fog = new THREE.FogExp2(0xd8b0a0, 0.014); }
  else if (name === 'golden') { sky.userData.setColors(0xff9a5e, 0xffe0b0); hemi.color.setHex(0xffe0c0); hemi.groundColor.setHex(0x5a4a30); hemi.intensity = 1.35; sun.color.setHex(0xffc080); sun.intensity = 3.0; sun.position.set(fx - 10, 10, fz + 18); scene.fog = new THREE.FogExp2(0xffc890, 0.008); }
  else if (name === 'temple') { hemi.color.setHex(0xc8b8a0); hemi.groundColor.setHex(0x2a2a20); hemi.intensity = 0.95; sun.intensity = 0; scene.fog = new THREE.FogExp2(0x1a1810, 0.03); }
  sun.target.position.set(fx, 0, fz);
}
const $ = id => document.getElementById(id);
function setText(id, html, op = 1) { const e = $(id); if (e.innerHTML !== html) e.innerHTML = html; e.style.opacity = op; }
const SPK_COLOR = { N: '#ffffff', Z: '#ffe27a', C: '#ff9e9e', G: '#9ed0ff', E: '#e6c2ff' };
// map overlay card
const mapCard = document.createElement('canvas'); mapCard.width = 760; mapCard.height = 560; mapCard.style.cssText = 'position:absolute;left:160px;top:420px;width:760px;height:560px;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.6);opacity:0;transform:rotate(-3deg)'; document.body.appendChild(mapCard);
{ const g = mapCard.getContext('2d'); g.fillStyle = '#e8d4a0'; g.fillRect(0, 0, 760, 560); for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(120,80,30,${Math.random() * 0.12})`; g.fillRect(Math.random() * 760, Math.random() * 560, 3, 3); }
  g.strokeStyle = '#4a8ab0'; g.lineWidth = 16; g.beginPath(); g.moveTo(0, 420); g.bezierCurveTo(200, 380, 300, 470, 760, 400); g.stroke();
  g.fillStyle = '#3a6a2a'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(60 + Math.random() * 640, 60 + Math.random() * 280, 14, 0, 7); g.fill(); }
  g.strokeStyle = '#8a2a1a'; g.setLineDash([14, 12]); g.lineWidth = 7; g.beginPath(); g.moveTo(140, 480); g.bezierCurveTo(260, 360, 420, 300, 560, 170); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#6a6a58'; g.beginPath(); g.moveTo(520, 190); g.lineTo(600, 190); g.lineTo(585, 140); g.lineTo(535, 140); g.fill(); g.strokeStyle = '#2a2a20'; g.lineWidth = 5; g.beginPath(); g.ellipse(560, 120, 30, 16, 0, 0, 7); g.stroke(); g.fillStyle = '#c03030'; g.beginPath(); g.arc(560, 120, 7, 0, 7); g.fill();
  g.fillStyle = '#3a2210'; g.font = 'italic bold 64px Georgia, serif'; g.textAlign = 'center'; g.fillText('Trust the eyes.', 380, 280); g.font = 'italic 34px Georgia, serif'; g.fillText('— B.', 560, 330); }

const muralCard = document.createElement('canvas'); muralCard.width = 1024; muralCard.height = 512; muralCard.style.cssText = 'position:absolute;left:40px;top:520px;width:1000px;height:500px;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.7);opacity:0'; document.body.appendChild(muralCard); muralCard.getContext('2d').drawImage(muralT.userData.canvas, 0, 0);
window.renderAt = function (t) {
  T = t; ALL.forEach(a => { a.visible = false; petrify(a, 0); });
  lostHat.visible = false; crystal.visible = true; grabGold.visible = true; crystal.scale.set(0.9, 1.5, 0.9); crystalM.opacity = 0.45; crystalLight.intensity = 6;
  const sc = TL.scenes.find(s => t >= s.start && t < s.end) || TL.scenes[TL.scenes.length - 1]; curScene = sc; const lt = t - sc.start;
  let C = { cam: v3(0, 4, 12), look: v3(0, 2, 0), fov: 50 }, mood = 'day', fx = 0, fz = 0, big = '', bop = 0, tint = 0, bloomS = 0.35, eye = [0xffb040, 1], showMap = 0, flash = false;
  zuriLamp.forEach(l => l.intensity = 3);
  switch (sc.id) {
    case 1: { if (t < vs('gone') - 0.05) { mood = 'night'; fx = JX; fz = TZ; eye = [0xffb040, clamp((t - 0.6) / 0.8) * 1.4];
        C = cuts(t, [[99, v3(JX, 8, TZ + 36), v3(JX, 12, TZ + 26), v3(JX, 11, TZ), v3(JX, 15.2, TZ), 46]]); }
      else { mood = 'dawn'; fx = JX; fz = TZ + 10; lostHat.visible = true; lostHat.position.set(JX + 0.6, 0.05, TZ + 12.5); lostHat.rotation.set(0.2, 0.5, 0.15);
        C = cuts(t, [[99, v3(JX + 2.4, 1.6, TZ + 15.5), v3(JX + 2.0, 1.4, TZ + 15.0), v3(JX + 0.6, 0.3, TZ + 12.5), v3(JX + 0.5, 1.8, TZ + 9), 46]]); }
      break; }
    case 2: { const tMap = vs('map') - 0.05;
      if (t < tMap) { mood = 'dawn'; fx = JX; fz = TZ + 8; flash = true; const k = clamp((t - sc.start) / (tMap - sc.start)); put(grandpa, JX + 0.3, lerp(TZ + 15, TZ + 9.6, k), Math.PI); act(grandpa, 'stern', walkBlock(t * 5, 0.5)); grandpa.visible = t < vs('never') + 0.3;
        C = cuts(t, [[vs('never') - 0.05, v3(JX + 3.5, 3.6, TZ + 25), v3(JX + 3.0, 3.6, TZ + 23.5), v3(JX, 3.0, TZ + 9), null, 50], [99, v3(JX + 2.5, 3.0, TZ + 21), v3(JX + 2.0, 3.4, TZ + 20), v3(JX, 2.8, TZ + 9), null, 48]]); }
      else { mood = 'dusk'; fx = -2; fz = 4; put(zuri, -3.0, 6.0, 0.4); act(zuri, 'sad', { armLx: -1.1, armRx: -1.1, armLz: 0.3, armRz: -0.3, headX: 0.25 });
        if (t > vs('trust') - 0.1) showMap = clamp((t - vs('trust') + 0.1) / 0.25);
        C = cuts(t, [CU(99, zuri, { ang: 0.3, d: 6.6, ly: -0.7 })]); }
      break; }
    case 3: { mood = 'day'; fx = 0; fz = 6; put(elder, -1.0, 7.0, faceTo(-1, 7, 0.6, 5.6) + 0.6); put(zuri, 0.8, 5.6, faceTo(0.8, 5.6, -1, 7) - 0.6);
      act(elder, 'sad', speaking(elder) ? { armRx: -0.8, armRz: -0.2 } : {}); act(zuri, t > vs('first') ? 'stern' : 'surprise', t > vs('first') ? { armLz: -0.3, armRz: 0.3 } : {});
      villagers.forEach((v, i) => { put(v, -3 + i * 2, 10 + (i % 2), Math.PI * 0.9 + (i - 1.5) * 0.2); act(v, 'sad'); });
      C = cuts(t, [CU(vs('first') - 0.05, elder, { ang: 0.4, d: 5.8 }), CU(99, zuri, { ang: -0.35, d: 6.4 })]); break; }
    case 4: { mood = 'dawn'; fx = 0; fz = -6; const k = clamp(lt / (sc.end - sc.start)); put(zuri, 0, lerp(-2, -11, k), Math.PI); act(zuri, 'smile', walkBlock(t * 6, 0.5, { armRx: -0.6 }));
      C = cuts(t, [[99, v3(3.2, 2.6, 2.2), v3(2.4, 3.6, 3.2), v3(0, 1.4, -6), v3(0, 2.0, -11), 52]]); break; }
    case 5: { mood = 'jungle'; fx = JX; fz = -12; const zx = JX - 0.6, zz = -10.4; put(zuri, zx, zz, 0.55); put(crane, JX + 1.0, -12.2, -0.5);
      act(zuri, 'surprise'); act(crane, 'smug', speaking(crane) ? { armRx: -0.7, armRz: -0.3, armLx: -0.3 } : {});
      if (t > vs('blinked') + 0.5) eye = [0xff2020, 1.6 * (Math.sin((t - vs('blinked')) * 8) > -0.3 ? 1 : 0.2)]; else eye = [0x403020, 0.3];
      C = cuts(t, [CU(vs('help') - 0.05, crane, { ang: 0.3 }), [vs('blinked') - 0.05, v3(JX + 0.4, 2.4, -6.4), v3(JX + 0.3, 2.3, -6.9), v3(JX + 0.2, 1.4, -11.4), null, 52], [99, v3(JX + 4.4, 2.0, -9.2), v3(JX + 4.1, 1.9, -9.8), v3(JX + 2.6, 1.5, -12.5), null, 44]]); break; }
    case 6: { mood = 'jungle'; fx = JX; fz = TZ + 10; put(zuri, JX - 0.5, TZ + 17, Math.PI); put(crane, JX + 0.8, TZ + 17.6, Math.PI); act(zuri, 'surprise', { headX: -0.3 }); act(crane, 'smug', { headX: -0.3 }); eye = [0xffb040, 1.3];
      C = cuts(t, [[vs('watching') - 0.05, v3(JX + 2.2, 3.6, TZ + 23), v3(JX + 2.0, 6.0, TZ + 25), v3(JX, 6, TZ + 10), v3(JX, 10, TZ), 56], [99, v3(JX, 14.2, TZ + 15), v3(JX, 14.4, TZ + 13.5), v3(JX, 14.9, TZ + 3.6), null, 44]]); break; }
    case 7: { mood = 'temple'; fx = TH; fz = 0; zuriLamp.forEach(l => l.intensity = 5); const path = [[3, 0], [2, 1], [2, 2], [3, 3]]; const k = clamp((t - sc.start - 0.5) / 4.0) * (path.length - 1); const i0 = Math.floor(k), f = k - i0; const p0 = tilePos(...path[Math.min(i0, path.length - 1)]), p1 = tilePos(...path[Math.min(i0 + 1, path.length - 1)]);
      const zp = p0.clone().lerp(p1, ease(f)); put(zuri, zp.x, zp.z, Math.PI, 0.3 + Math.abs(Math.sin(f * Math.PI)) * 0.25); act(zuri, speaking(zuri) ? 'surprise' : 'stern', speaking(zuri) ? { armRx: -1.3, armLz: -0.2 } : walkBlock(t * 4, 0.3));
      put(crane, TH + 0.0, 8.2, Math.PI); act(crane, 'surprise');
      const tf = vs('puzzle') + 2.4; fallTile.position.y = t > tf ? 0.15 - (t - tf) * (t - tf) * 9 : 0.15; fallTile.rotation.x = t > tf ? (t - tf) * 2 : 0;
      C = cuts(t, [[vs('tiles') - 0.05, v3(TH + 2.2, 4.4, -3.5), v3(TH + 1.8, 4.0, -3.0), v3(TH + 0.2, 0.6, 3.8), null, 54], CU(99, zuri, { ang: 0.4, d: 6.4 })]); break; }
    case 8: { mood = 'temple'; fx = EH; fz = 0; put(zuri, EH - 0.9, 1.0, 0.45); put(crane, EH + 0.8, 0.4, -0.45);
      const red = t > vs('crane_lie') + 1.2 && t < vs('zuri_true'), green = t > vs('zuri_true') + 1.2;
      eye = red ? [0xff2020, 1.6] : green ? [0x30ff70, 1.6] : [0xffb040, 1.0]; ehLight.color.setHex(red ? 0xff3030 : green ? 0x40ff80 : 0xffb040); ehLight.intensity = red || green ? 22 : 8;
      act(crane, red ? 'surprise' : 'smug', speaking(crane) ? { armRx: -0.7 } : {}); act(zuri, green ? 'sad' : red ? 'surprise' : 'stern', {});
      C = cuts(t, [[vs('crane_lie') - 0.05, v3(EH + 0.2, 2.4, 7), v3(EH + 0.2, 3.0, 6), v3(EH, 2.6, -4), null, 58], CU(vs('zuri_true') - 0.05, crane, { ang: -0.15 }), [vs('know') - 0.05, v3(EH + 1.4, 3.0, 5.6), v3(EH + 1.2, 2.9, 5.2), v3(EH - 0.6, 2.0, 0.4), null, 56], CU(99, zuri, { ang: 0.15, d: 6.2 })]); break; }
    case 9: case 10: case 11: case 12: case 13: {
      mood = 'temple'; fx = TR; fz = 0; bloomS = 0.45;
      put(grandpa, TR, -1.5, 0); const gk = sc.id === 13 ? clamp((t - vs('melted') - 0.2) / 1.2) : 0; act(grandpa, sc.id === 13 && gk > 0.9 ? 'smile' : 'sad', sc.id === 13 && t > vs('hugged') ? { armLx: -1.3, armRx: -1.3, armLz: -0.3, armRz: 0.3 } : { headX: 0.1 });
      if (sc.id === 13) { crystal.scale.set(0.9 * (1 - gk), 1.5 * (1 - gk), 0.9 * (1 - gk)); crystalM.opacity = 0.45 * (1 - gk); crystalLight.intensity = 6 * (1 - gk) + 2; }
      // Zuri
      if (sc.id === 9) { const k = clamp((t - vs('crystal')) / 1.3); put(zuri, TR - 0.5, lerp(5, 1.0, ease(k)), Math.PI + 0.1 + 0.6 * ease(k)); act(zuri, t > vs('grandpa') - 0.2 ? 'surprise' : 'surprise', k > 0 && k < 1 ? walkBlock(t * 9, 0.8) : {}); }
      else if (sc.id === 13 && t > vs('hugged') - 0.1) { put(zuri, TR - 0.15, -0.75, Math.PI); act(zuri, 'smile', { armLx: -1.3, armRx: -1.3, armLz: -0.3, armRz: 0.3 }); }
      else { put(zuri, TR - 0.6, 0.6, Math.PI + 0.65); act(zuri, sc.id === 12 ? 'sad' : sc.id === 13 ? 'surprise' : sc.id === 11 ? 'surprise' : 'stern', sc.id === 12 && t > vs('hand') ? { armRx: -1.4, armRz: -0.1 } : {}); }
      // Crane
      const tGrab = sc.id === 11 ? vs('grabbed') + 0.4 : 0; const stoneK = sc.id === 11 ? clamp((t - vs('stone') + 0.1) / 1.0) : sc.id >= 12 ? 1 : 0;
      if (sc.id >= 10) { put(crane, TR + 1.7, 1.5, sc.id === 10 ? Math.PI - 0.3 : faceTo(TR + 1.7, 1.5, TR + 2.6, 1.4)); act(crane, sc.id === 11 ? (stoneK > 0 ? 'surprise' : 'grin') : 'smug', sc.id === 11 && t > tGrab ? { armRx: -1.0, armLx: -1.0, bodyX: 0.25 } : sc.id >= 12 ? { armRx: -1.0, armLx: -1.0, bodyX: 0.25 } : {}); petrify(crane, stoneK); }
      if (sc.id === 9) put(crane, TR + 1.8, 4.5, Math.PI), act(crane, 'surprise');
      eye = sc.id === 11 && t > vs('grabbed') + 1.0 ? [0xff2020, 1.6] : sc.id === 12 && t > vs('green') - 0.1 ? [0x30ff70, 1.6] : sc.id === 13 ? [0x30ff70, 1.2] : [0xffb040, 0.8];
      const ec = eye[0] === 0xff2020 ? 0xff3030 : eye[0] === 0x30ff70 ? 0x40ff80 : 0xffb040; trTorches.forEach(l => { l.color.setHex(ec); l.intensity = eye[0] === 0xffb040 ? 7 : 14; });
      if (sc.id === 9) C = cuts(t, [[vs('crystal') - 0.05, v3(TR + 0.4, 5.2, 7.5), v3(TR, 4.0, 6.5), v3(TR, 1.2, -2), null, 58], [vs('grandpa') - 0.05, v3(TR + 0.3, 2.9, 2.2), v3(TR + 0.3, 2.8, 1.8), v3(TR, 2.6, -1.5), null, 44], [99, v3(TR - 2.7, 2.2, -0.8), v3(TR - 2.5, 2.15, -0.7), v3(TR - 0.6, 1.95, 0.8), null, 44]]);
      else if (sc.id === 10) { flash = t > vs('toogold') - 0.05; if (flash) { put(grandpa, TR + 2.2, 1.6, faceTo(TR + 2.2, 1.6, TR + 2.6, 1.4) + 0.3); act(grandpa, 'grin', { armRx: -1.0, armLx: -1.0, bodyX: 0.2 }); crystal.visible = false; put(zuri, TR - 50, 0, 0); zuri.visible = false; crane.visible = false; }
        C = cuts(t, [[vs('kept') - 0.05, v3(TR, 4.2, -3.2), v3(TR, 4.2, -3.8), v3(TR, 4.2, -8), null, 50], [vs('toogold') - 0.05, v3(TR - 2.6, 3.0, 4.0), v3(TR - 2.3, 2.8, 3.6), v3(TR, 1.6, -1.5), null, 52], [99, v3(TR + 4.6, 2.6, -0.8), v3(TR + 4.4, 2.5, -0.6), v3(TR + 2.3, 2.0, 1.4), null, 48]]); }
      else if (sc.id === 11) C = cuts(t, [CU(vs('grabbed') + 1.0, crane, { ang: -0.5 }), [vs('stone') - 0.05, v3(TR, 6.5, 8), v3(TR, 6.0, 7.2), v3(TR, 2, -2), null, 60], [99, v3(TR + 6.0, 3.0, 3.4), v3(TR + 5.7, 2.9, 3.2), v3(TR + 1.9, 1.7, 1.5), null, 46]]);
      else if (sc.id === 12) C = cuts(t, [[vs('dontwant') - 0.05, v3(TR - 2.9, 2.6, -1.4), v3(TR - 2.7, 2.5, -1.3), v3(TR - 0.4, 1.9, 0.0), null, 48], [vs('green') - 0.05, v3(TR - 2.6, 2.2, -0.8), v3(TR - 2.45, 2.15, -0.7), v3(TR - 0.6, 1.95, 0.6), null, 42], [99, v3(TR, 6.0, 8), v3(TR, 5.5, 7.5), v3(TR, 2.6, -3), null, 62]]);
      else C = cuts(t, [[vs('grown') - 0.05, v3(TR + 1.2, 3.2, 5), v3(TR + 1.0, 3.0, 4.5), v3(TR, 1.9, -1.2), null, 52], [vs('hugged') - 0.05, v3(TR + 1.6, 3.3, 1.9), v3(TR + 1.5, 3.2, 1.7), v3(TR, 2.6, -1.5), null, 42], [99, v3(TR - 7.2, 3.2, 1.2), v3(TR - 6.8, 3.15, 1.0), v3(TR - 0.1, 2.0, -1.1), null, 40]]);
      break; }
    case 14: case 15: { mood = 'golden'; fx = JX; fz = TZ + 12; eye = [0x30ff70, 0.8];
      const k = clamp(lt / 6); put(zuri, JX - 0.5, lerp(TZ + 10, TZ + 17, k), 0); put(grandpa, JX + 0.6, lerp(TZ + 10, TZ + 17, k), 0); act(zuri, 'smile', sc.id === 14 ? walkBlock(t * 6, 0.4) : {}); act(grandpa, 'smile', sc.id === 14 ? walkBlock(t * 5, 0.4, { armLx: -0.4 }) : {});
      if (sc.id === 14) C = cuts(t, [[vs('treasures') - 0.05, v3(JX + 0.2, 2.4, TZ + 23), v3(JX + 0.2, 2.6, TZ + 22), v3(JX, 2.0, TZ + 14), null, 50], [99, v3(JX + 2.5, 2.6, TZ + 24), v3(JX + 3.5, 8.0, TZ + 30), v3(JX, 3.0, TZ + 14), v3(JX, 10, TZ), 56]]);
      else { C = cuts(t, [[99, v3(JX + 3.5, 8.0, TZ + 30), v3(JX + 3.0, 10, TZ + 34), v3(JX, 10, TZ), v3(JX, 12, TZ - 10), 56]]); if (lt > 0.3) { big = 'Would you take<br><span style="color:#ffd24a">the gold</span>…<br>or <span style="color:#7dffa8">the truth?</span>'; bop = clamp((lt - 0.3) / 0.35); } tint = 0.05; }
      break; }
  }
  setMood(mood, fx, fz); setEyes(eye[0], eye[1]);
  river.userData.update(t); clouds.position.x = (t * 0.3) % 20;
  fireflies.visible = mood === 'jungle' || mood === 'night' || mood === 'dawn'; fireflies.children.forEach(s => { const u = s.userData; s.position.set(JX + u.x + Math.sin(t * 0.7 + u.p) * 0.6, u.y + Math.sin(t * 1.3 + u.p) * 0.3, u.z); });
  frontFill.intensity = mood === 'temple' ? 0.8 : 1.0; frontFill.position.copy(C.cam).add(v3(0, 3, 0)); frontFill.target.position.copy(C.look);
  if (camera.fov !== C.fov) { camera.fov = C.fov; camera.updateProjectionMatrix(); }
  camera.position.copy(C.cam); camera.lookAt(C.look); bloom.strength = bloomS; composer.render();
  const tn = $('tint'); if (flash) { tn.style.background = '#8a5a24'; tn.style.mixBlendMode = 'color'; tn.style.opacity = 0.75; } else { tn.style.background = '#000'; tn.style.mixBlendMode = 'normal'; tn.style.opacity = tint; } mapCard.style.opacity = showMap;
  const showMural = sc.id === 10 && t > vs('carving') + 0.4 && t < vs('toogold') - 0.05 ? 1 : 0; muralCard.style.opacity = showMural;
  let hook = '', hop = 0; if (sc.id === 1) { hook = '<span class="series">THE TEMPLE OF<br><span style="color:#ffb040">WHISPERING EYES</span></span>'; hop = clamp(lt / 0.25) * clamp((vs('gone') - 0.1 - t) / 0.3); }
  setText('hook', hook, hop);
  const cap = (sc.id === 15 && lt > 0.3) || showMap > 0.5 ? null : TL.captions.find(c => t >= c.start && t < c.end + 0.05);
  const ce = $('cap');
  if (cap) { const k = clamp((t - cap.start) / 0.09); ce.style.transform = `scale(${1.18 - 0.18 * easeOut(k)})`; ce.style.color = SPK_COLOR[cap.spk]; const txt = cap.text.replace(/(red\.?|Red\.?|green\.?|gold\.?|eyes\.?|truth\??|stone\.?|Grandpa!?)/g, m => `<span style="color:${/red/i.test(m) ? '#ff5a5a' : /green|truth/.test(m) ? '#7dffa8' : '#ffd94a'}">${m}</span>`); setText('cap', txt, 1); }
  else setText('cap', '', 0);
  setText('big', big, bop); return true;
};
window.DURATION = TL.duration; window.READY = true;
