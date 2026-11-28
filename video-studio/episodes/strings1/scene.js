// "What If Every Friendship Was a String?" — Kitewood (windy hilltop town, kite festival, cliff over a valley).
import * as THREE from 'three';
import { makeAvatar, setFace, setTears, setBlush, pose, poseG, G, talkFace, walkPose } from '../../shared/avatars_round.js';
import { rng, clamp, lerp, ease, easeOut, v3, lerpV, faceTo, canvasTex, mat,
  setupRenderer, setupComposer, makeSky, sunGlowSprite, cloudField, ground, contactShadow, treeRound, treePine, building, rainField } from '../../shared/world_kit.js';
import { room, desk, shelf, rug, counter, fence, flowerBed, streetLamp, sign } from '../../shared/interior_kit.js';
import { makeKite, makeStringPool, bunting, tent, bannerArch, valley } from '../../shared/kite_kit.js';

const TL = await (await fetch('./timeline.json')).json();
const W = 1080, H = 1920, VO = TL.vo;
const vs = k => VO[k].start, ve = k => VO[k].start + VO[k].dur;

const renderer = setupRenderer(W, H);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 600); scene.add(camera);
const { composer, bloom } = setupComposer(renderer, scene, camera, W, H);
const fill = new THREE.PointLight(0xfff4ea, 1.35, 9, 1.4); camera.add(fill); fill.position.set(0.3, 0.4, 0);
const hemi = new THREE.HemisphereLight(0xd8ecff, 0x6a5a40, 1.15); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e4, 2.8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
const frontFill = new THREE.DirectionalLight(0xfff2e4, 0.0); scene.add(frontFill, frontFill.target);

// ================= KITEWOOD =================
const sky = makeSky(0x6ab8ff, 0xe8f6ff, 380); scene.add(sky);
const sunSprite = sunGlowSprite(0xfff2c8, 40); scene.add(sunSprite);
const clouds = cloudField(16, 220, 34, 11); scene.add(clouds);
const stormClouds = cloudField(22, 200, 26, 19); stormClouds.children.forEach(s => { s.material = s.material.clone(); s.material.color.setHex(0x3a404c); s.material.opacity = 0.97; }); scene.add(stormClouds);
const grass = ground(170, 80, 'grass', 0x63a84a, 0x468a38, 22); grass.position.set(0, 0, -6); scene.add(grass);
const vly = valley(-46, 8); scene.add(vly);
const roadTex = canvasTex(256, 512, (c) => { c.fillStyle = '#b8a88e'; c.fillRect(0, 0, 256, 512); const r = rng(2); for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(${90 + r() * 40 | 0},${80 + r() * 30 | 0},${60 + r() * 30 | 0},0.5)`; c.beginPath(); c.ellipse(r() * 256, r() * 512, 10 + r() * 16, 8 + r() * 10, 0, 0, 7); c.fill(); } c.strokeStyle = 'rgba(0,0,0,0.15)'; for (let i = 0; i < 60; i++) { c.beginPath(); c.ellipse(r() * 256, r() * 512, 12 + r() * 14, 9 + r() * 8, 0, 0, 7); c.stroke(); } });
roadTex.wrapT = THREE.RepeatWrapping; roadTex.repeat.set(1, 8);
const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 58), mat(0xffffff, { map: roadTex, roughness: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, 5); road.receiveShadow = true; scene.add(road);
const HOUSES = [
  { x: -8.5, z: 16, w: 5, h: 3.6, d: 5, wallColor: 0xffb0b8, roofColor: 0x3a5a9a, doorSide: 1, windowRows: 2, windowCols: 2, chimney: true, seed: 31, lit: 0 },
  { x: -8.2, z: 6, w: 5.4, h: 3.8, d: 5, wallColor: 0xa8e0d0, roofColor: 0xc04a3a, doorSide: -1, windowRows: 2, windowCols: 2, seed: 32, lit: 0 },
  { x: -8.4, z: -4, w: 5, h: 3.4, d: 4.8, wallColor: 0xfff0a0, roofColor: 0x6a4a9a, doorSide: 1, roofKind: 'gable', windowRows: 1, windowCols: 2, seed: 33, lit: 0 },
  { x: -8.5, z: -14, w: 5.6, h: 3.8, d: 5.2, wallColor: 0xf0d8b8, roofColor: 0x8a3a2a, doorSide: 1, windowRows: 2, windowCols: 2, chimney: true, seed: 34, lit: 0 },
  { x: 8.5, z: 16, w: 5.2, h: 3.6, d: 5, wallColor: 0xc8d0ff, roofColor: 0xd08a2a, doorSide: -1, windowRows: 2, windowCols: 2, seed: 35, lit: 0 },
  { x: 8.5, z: 6, w: 5.2, h: 3.5, d: 5, wallColor: 0xffd0a0, roofColor: 0x2a6a5a, doorSide: -1, windowRows: 2, windowCols: 2, seed: 36, lit: 0 },
  { x: 8.3, z: -4, w: 5, h: 3.8, d: 5, wallColor: 0xd8f0b0, roofColor: 0xb04a6a, doorSide: 1, roofKind: 'gable', windowRows: 2, windowCols: 2, seed: 37, lit: 0 },
  { x: 8.6, z: -14, w: 5.4, h: 3.6, d: 5, wallColor: 0xe0c8f0, roofColor: 0x3a4a6a, doorSide: -1, windowRows: 2, windowCols: 2, chimney: true, seed: 38, lit: 0 },
];
const houseG = HOUSES.map(o => { const g = building(o); g.position.set(o.x, 0, o.z); g.rotation.y = o.x < 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(g);
  const fb = flowerBed(2.2, o.seed); fb.position.set(o.x + (o.x < 0 ? 2.9 : -2.9), 0, o.z - (o.x < 0 ? 1 : -1) * o.doorSide * 1.4); fb.rotation.y = Math.PI / 2; scene.add(fb); return g; });
// door world positions (door faces the street)
const doorPos = o => { const lx = o.w * 0.22 * o.doorSide, lz = o.d / 2; return o.x < 0 ? v3(o.x + lz, 0, o.z - lx) : v3(o.x - lz, 0, o.z + lx); };
const LEO_DOOR = doorPos(HOUSES[5]), SHOP_DOOR = doorPos(HOUSES[3]), DOOR2 = doorPos(HOUSES[1]);
const shopSign = sign(["HAZEL'S KITES"], 3.0, 0.7, '#2a5aa8', '#ffe9a0', 'bold 120px Inter, Arial', '#ffd94a'); shopSign.position.set(-5.84, 3.0, -14); shopSign.rotation.y = Math.PI / 2; scene.add(shopSign);
// bunting across the street + trees, lamps
for (const z of [12, 1, -9]) scene.add(bunting(v3(-5.6, 3.6, z), v3(5.6, 3.6, z + 0.5), 0.7, z + 40));
{ const r = rng(5); [[-14, 18], [14, 20], [-13, 2], [13, 0], [-14, -10], [14, -12], [-16, 28], [16, 28], [-12, 30], [11, 31]].forEach(([x, z], i) => { const t = i % 3 ? treeRound(i * 5 + 2, 1.1 + r() * 0.3) : treePine(i * 5 + 3, 1.1); t.position.set(x, 0, z); scene.add(t); }); }
for (const z of [18, 8, -2, -12]) for (const sx of [-1, 1]) { const l = streetLamp(); l.position.set(sx * 4.6, 0, z); l.rotation.y = sx > 0 ? Math.PI : 0; scene.add(l); }
// windmill on the hill (town landmark)
const mill = new THREE.Group(); { const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 9, 10), mat(0xf4ead8)); tower.position.y = 4.5; tower.castShadow = true; mill.add(tower); const cap = new THREE.Mesh(new THREE.ConeGeometry(2.0, 2.2, 10), mat(0xc04a3a)); cap.position.y = 10.1; mill.add(cap);
  const blades = new THREE.Group(); for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.5, 0.08), mat(0xfff8ec)); b.position.y = 2.8; const arm = new THREE.Group(); arm.add(b); arm.rotation.z = i * Math.PI / 2; blades.add(arm); } blades.position.set(0, 8.6, 1.7); mill.add(blades); mill.userData.blades = blades; }
mill.position.set(17, 0, -30); mill.rotation.y = -0.6; scene.add(mill);
// festival field
const arch = bannerArch('KITEWOOD KITE FESTIVAL', 9); arch.position.set(0, 0, -23); scene.add(arch);
[[-10, -29, 0xff4a5a], [10, -30, 0x3ab0ff], [-11, -38, 0xffc93a], [11, -38, 0x6ad86a]].forEach(([x, z, c]) => { const t = tent(c, 3); t.position.set(x, 0, z); scene.add(t); });
scene.add(bunting(v3(-10, 3.4, -29), v3(10, 3.4, -30), 1.0, 7)); scene.add(bunting(v3(-11, 3.4, -38), v3(11, 3.4, -38), 1.0, 9));
const rain = rainField(900, 50, 18, 33); scene.add(rain);

// ================= KITE SHOP INTERIOR =================
const KS = 100;
const shop = room({ w: 9, d: 7, h: 3.8, wall: 0xf6e6c8, stripe: 0x5a8ab8, floor: 'wood', floorColor: 0x9a6a42, windowWall: 'left', windows: 2 }); shop.position.set(KS, 0, 0); scene.add(shop);
const bench = desk(0xa87a4e); bench.scale.set(2.2, 1, 1.4); bench.position.set(KS + 0.3, 0, 0.3); scene.add(bench);
const shopKites = []; for (let i = 0; i < 14; i++) { const k = makeKite(200 + i); const row = i % 7, col = Math.floor(i / 7); if (i < 10) { k.position.set(KS - 3.4 + row * 1.15, 2.7 - col * 1.2 + (row % 2) * 0.15, -3.4); } else { k.position.set(KS + 4.4, 2.6 - (i - 10) % 2 * 1.1, -2.2 + (i - 10) * 1.0); k.rotation.y = -Math.PI / 2; } k.scale.setScalar(0.9); scene.add(k); shopKites.push(k); }
const stack = new THREE.Group(); for (let i = 0; i < 6; i++) { const k = makeKite(300 + i); k.rotation.x = -Math.PI / 2; k.position.y = i * 0.03; k.scale.setScalar(0.85); stack.add(k); } stack.position.set(KS + 1.4, 0.98, 0.35); scene.add(stack);
const workKite = makeKite(77, [0xffc93a, 0xff4a5a]); scene.add(workKite);
const shelfK = shelf(); shelfK.position.set(KS - 3.6, 0, -3.1); scene.add(shelfK);
const shopRug = rug(0x3a7ad0); shopRug.position.set(KS, 0, 1.2); scene.add(shopRug);
const shopLamp = new THREE.PointLight(0xffe2b0, 0, 12, 1.4); shopLamp.position.set(KS, 3.3, 0); scene.add(shopLamp);

// ================= CHARACTERS =================
const KID = 0.85;
function beanie(av, color) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14, 0, 7, 0, 1.45), mat(color, { roughness: 0.95 })); b.position.y = 0.1; av.userData.P.head.add(b); const pom = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0xffffff, { roughness: 1 })); pom.position.y = 0.6; av.userData.P.head.add(pom); }
function shawl(av, color) { const s = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.12, 8, 18), mat(color, { roughness: 1 })); s.rotation.x = Math.PI / 2; s.position.y = 0.98; s.scale.set(1.05, 0.85, 1); av.userData.P.body.add(s); }
const june = makeAvatar({ seed: 801, skin: 0xffdbb5, hair: 0x9a3a1e, hairStyle: 'long', top: 0xf6c430, legs: 0x34486a, acc: 'none', scale: KID }); beanie(june, 0xd8323c);
const leo = makeAvatar({ seed: 802, skin: 0xc68642, hair: 0x111111, hairStyle: 'swoop', top: 0x2a7ad0, legs: 0x2a2a2a, acc: 'none', scale: KID * 1.05 });
const hazel = makeAvatar({ seed: 803, skin: 0xe8c49a, hair: 0xdcd8d0, hairStyle: 'bun', top: 0x8a4a6a, legs: 0x4a3a4a, acc: 'glasses', scale: 0.98 }); shawl(hazel, 0x5a8a5a);
const MAIN = [june, leo, hazel];
const TOPS = [0xe0503c, 0x3a8ad8, 0x4ab06a, 0xf0b030, 0x9a5ac8, 0xff7ab0, 0x2ab0b0, 0xf08a3a, 0x5a6a9a, 0xc8d84a, 0xd8404a, 0x4a7aa8, 0x8ac8ff, 0xb06a3a, 0x70d0a0, 0xe8e8f0];
const HAIRS_ = ['short', 'bun', 'spiky', 'curly', 'swoop', 'long', 'short', 'curly', 'bun', 'spiky', 'long', 'swoop', 'curly', 'short', 'bun', 'spiky'];
const ACCS = ['none', 'cap', 'none', 'glasses', 'headphones', 'bow', 'beanie', 'none', 'glasses', 'none', 'cap', 'none', 'bow', 'headphones', 'none', 'beanie'];
const SKINS_ = [0xffe0bd, 0x8d5524, 0xf1c27d, 0xc68642, 0xffcd94, 0xe0ac69];
const crowd = []; for (let i = 0; i < 16; i++) crowd.push(makeAvatar({ seed: 1400 + i * 29, top: TOPS[i], hairStyle: HAIRS_[i], acc: ACCS[i], skin: SKINS_[(i * 5) % 6], scale: KID * (0.94 + (i % 3) * 0.04) }));
const adults = []; for (let i = 0; i < 4; i++) adults.push(makeAvatar({ seed: 1700 + i * 31, scale: 1.05 }));
const ALL = [...MAIN, ...crowd, ...adults];
ALL.forEach(a => { scene.add(a); a.userData.cs = contactShadow(1.1); a.add(a.userData.cs); });
// one kite per kid (crowd 0..15, leo = 16)
const kites = []; for (let i = 0; i < 17; i++) { const k = makeKite(500 + i * 7); k.scale.setScalar(1.25); scene.add(k); kites.push(k); }
const leoKite = kites[16];
const brokenL = makeKite(516 + 0, [leoKite.userData.c1, leoKite.userData.c2]), brokenR = makeKite(516, [leoKite.userData.c1, leoKite.userData.c2]); [[brokenL, [0, 3, 2]], [brokenR, [0, 2, 1]]].forEach(([b, idx]) => { const g = b.userData.sail.geometry.clone(); g.setIndex(idx); b.userData.sail.geometry = g; b.children.forEach(c => { if (c !== b.userData.sail) c.visible = false; }); scene.add(b); });
const note = sign(['Fly high, Leo.', 'Love, J.'], 0.7, 0.45, '#fffaf0', '#3a2a1a', 'italic bold 120px Georgia, serif', null); scene.add(note);
const SPEAK = { J: june, L: leo, H: hazel, K: crowd[6] };
let T = 0;
const speaking = av => Object.values(VO).some(v => SPEAK[v.spk] === av && T >= v.start && T < v.start + v.dur - 0.05);

// ---- helpers ----
const strings = makeStringPool(scene, 110);
const kiteLines = makeStringPool(scene, 40);
function put(av, x, z, rotY, opt = {}) { av.visible = true; av.position.set(x, opt.y ?? 0, z); av.rotation.set(0, rotY, 0); av.userData.kneel = !!opt.kneel; if (opt.kneel) av.position.y = -0.42 * av.scale.y; av.userData.cs.visible = !opt.kneel; return av; }
function act(av, face, ...gest) { if (av.userData.kneel) gest.unshift({ legL: 1.45, legR: 1.45 }); poseG(av, T, ...gest); talkFace(av, T, speaking(av), face); }
const _v = new THREE.Vector3();
function hand(av, side = 'R') { av.updateMatrixWorld(true); const arm = av.userData.P[side === 'R' ? 'armR' : 'armL']; return arm.children[1].getWorldPosition(new THREE.Vector3()); }
let curScene = TL.scenes[0];
function cuts(t, list) { let s0 = curScene.start; for (const sh of list) { if (t < sh[0] || sh === list[list.length - 1]) { const u = clamp((t - s0) / Math.max(0.01, sh[0] - s0)); const [_, cA, cB, lA, lB, f] = sh; return { cam: lerpV(cA, cB || cA, ease(u)), look: lerpV(lA, lB || lA, ease(u)), fov: f || 50, i: list.indexOf(sh), u, s0 }; } s0 = sh[0]; } }
function headP(av) { return av.position.clone().add(v3(0, 2.41 * av.scale.y, 0)); }
function closeUp(av, o = {}) { const d = o.d ?? 3.3, ang = (o.ang ?? 0.3) + av.rotation.y, up = o.up ?? 0.12, h = headP(av); const dir = v3(Math.sin(ang), 0, Math.cos(ang));
  const look = h.clone().add(v3(0, o.ly ?? -0.45, 0)); return [h.clone().addScaledVector(dir, d * 1.07).add(v3(0, up, 0)), h.clone().addScaledVector(dir, d * 0.96).add(v3(0, up, 0)), look, look, o.fov ?? 42]; }
const CU = (until, av, o) => [until, ...closeUp(av, o)];
const rampV = (t, t0, t1, a, b) => lerp(a, b, ease((t - t0) / Math.max(0.01, t1 - t0)));
const prog = (t, t0, dur = 0.6) => easeOut((t - t0) / dur);
// friendship string between two avatars' wrists
function tie(a, b, o = {}) { strings.draw(hand(a, o.sa || 'R'), hand(b, o.sb || 'L'), { color: o.gold ? 0xffd24a : (o.color ?? 0xff7a9a), r: o.gold ? 0.04 : 0.03, sag: o.sag ?? 0.3, prog: o.prog ?? 1, glow: o.gold ? 1.6 : 1.15 }); }
// a kite flying above its owner
function flyKite(k, owner, t, i, opt = {}) { k.visible = true; const h = hand(owner); const base = v3(owner.position.x + (opt.dx ?? Math.sin(i * 2.3) * 2.5), opt.y ?? 9 + (i % 4) * 1.3, owner.position.z + (opt.dz ?? -4 - (i % 3) * 1.5));
  base.x += Math.sin(t * 0.7 + i) * 0.5; base.y += Math.sin(t * 1.1 + i * 2) * 0.3; k.position.copy(base); k.lookAt(owner.position.x, base.y - 2, owner.position.z + 6); k.userData.sway(t, 1);
  kiteLines.draw(h, base.clone().add(v3(0, -0.2, 0)), { color: 0xffffff, r: 0.008, sag: 0.8, glow: 1.0 }); }

// ---- moods ----
function setMood(name, fx, fz, side = -1) {
  scene.fog = null; renderer.domElement.style.filter = '';
  const inside = name === 'int';
  sky.visible = !inside; sunSprite.visible = name === 'day' || name === 'golden'; clouds.visible = name === 'day' || name === 'golden' || name === 'dawn'; stormClouds.visible = name === 'storm' || name === 'after';
  shopLamp.intensity = 0; shop.userData.winGlow.forEach(m => m.color.setHex(name === 'int' ? 0xffd8b8 : 0xdff2ff));
  if (name === 'day') { sky.userData.setColors(0x5ab0ff, 0xe8f6ff); hemi.color.setHex(0xd8ecff); hemi.groundColor.setHex(0x6a5a40); hemi.intensity = 1.15; sun.color.setHex(0xfff4e4); sun.intensity = 2.8; sun.position.set(fx + 14, 22, fz + 16); scene.fog = new THREE.FogExp2(0xd8ecff, 0.004); sunSprite.position.set(fx + 60, 50, fz - 140); }
  else if (name === 'dawn') { sky.userData.setColors(0x4a5a9a, 0xffb0a0); hemi.color.setHex(0xc8c0ff); hemi.groundColor.setHex(0x4a4050); hemi.intensity = 1.2; sun.color.setHex(0xffb0a0); sun.intensity = 1.4; sun.position.set(fx + 18, 6, fz - 10); scene.fog = new THREE.FogExp2(0xd0a8b8, 0.008); }
  else if (name === 'golden') { sky.userData.setColors(0xff9a5e, 0xffe2b0); hemi.color.setHex(0xffe0c0); hemi.groundColor.setHex(0x7a6050); hemi.intensity = 1.35; sun.color.setHex(0xffbe80); sun.intensity = 3.0; sun.position.set(fx - 16, 9, fz + 14); scene.fog = new THREE.FogExp2(0xffc890, 0.0035); sunSprite.position.set(fx - 50, 14, fz - 160); }
  else if (name === 'storm') { sky.userData.setColors(0x55607a, 0x8a94a8); hemi.color.setHex(0xc0cce0); hemi.groundColor.setHex(0x3a3a40); hemi.intensity = 1.3; sun.color.setHex(0xc8d4ec); sun.intensity = 2.4; sun.position.set(fx + 10, 20, fz + 12); scene.fog = new THREE.FogExp2(0x6a7488, 0.006); hemi.intensity = 2.2; }
  else if (name === 'after') { sky.userData.setColors(0x7a8ab0, 0xe8d0b0); hemi.color.setHex(0xe0e4f0); hemi.groundColor.setHex(0x5a5048); hemi.intensity = 1.35; sun.color.setHex(0xffd8b0); sun.intensity = 2.2; sun.position.set(fx - 22, 14, fz - 2); scene.fog = new THREE.FogExp2(0xc8c0c0, 0.005); }
  else if (name === 'int') { hemi.color.setHex(0xffffff); hemi.groundColor.setHex(0xa08a70); hemi.intensity = 1.3; sun.color.setHex(0xffd0a0); sun.intensity = 2.6; sun.position.set(fx + side * 16, 7, fz + 4); shopLamp.intensity = 8; }
  sun.target.position.set(fx, 0, fz);
}

// ---- DOM ----
const $ = id => document.getElementById(id);
function setText(id, html, op = 1) { const e = $(id); if (e.innerHTML !== html) e.innerHTML = html; e.style.opacity = op; }
const SPK_COLOR = { N: '#ffffff', J: '#ffe27a', L: '#9ed0ff', H: '#e6c2ff', K: '#ff9e9e' };

// crowd pairs standing around the street, tied with strings (the "web")
const PAIRS = [[0, 1, -2.6, 9, 0], [2, 3, 2.4, 7.5, 1], [4, 5, -3.0, 3, 0], [7, 8, 3.0, 1.2, 0], [9, 10, -2.4, -2.5, 1], [11, 12, 2.8, -4, 0], [13, 14, -1.8, 19, 0]];
function streetWeb(t, skip = [], webOn = true) {
  PAIRS.forEach(([a, b, x, z, gold], i) => { if (skip.includes(a) || skip.includes(b)) return; const A = crowd[a], B = crowd[b];
    put(A, x - 0.55, z, faceTo(x - 0.55, z, x + 0.55, z + 2.5)); put(B, x + 0.55, z, faceTo(x + 0.55, z, x - 0.55, z + 2.5));
    act(A, i % 2 ? 'laugh' : 'happy', { armRx: -0.45, armRz: -0.25 }); act(B, 'smile', { armLx: -0.45, armLz: 0.25 }); talkFace(A, t, Math.sin(t * 1.7 + i) > 0.3, 'smile');
    if (webOn) tie(A, B, { gold, sa: 'R', sb: 'L', sag: 0.15 }); });
  // long strings across the street between pairs (friends of friends)
  if (webOn) [[0, 3], [1, 4], [2, 7], [5, 9], [8, 11], [10, 13], [12, 14]].forEach(([a, b]) => { if (skip.includes(a) || skip.includes(b)) return; if (crowd[a].visible && crowd[b].visible) tie(crowd[a], crowd[b], { sa: 'L', sb: 'R', sag: 0.25, color: [0x7ac8ff, 0x9aff9a, 0xffb86a, 0xd8a0ff][(a + b) % 4] }); });
}

window.renderAt = function (t) {
  T = t; strings.reset(); kiteLines.reset();
  ALL.forEach(a => { a.visible = false; setTears(a, false, t); if (a.userData.P.blush) setBlush(a, false); });
  kites.forEach(k => k.visible = false); [brokenL, brokenR, note, workKite].forEach(o => o.visible = false); rain.visible = false;
  const sc = TL.scenes.find(s => t >= s.start && t < s.end) || TL.scenes[TL.scenes.length - 1]; curScene = sc;
  const lt = t - sc.start;
  let C = { cam: v3(0, 5, 20), look: v3(0, 2, 0), fov: 50 }, mood = 'day', fx = 0, fz = 0, side = -1, big = '', bop = 0, tint = 0, bloomS = 0.35;

  switch (sc.id) {
    case 1: { mood = 'day'; fx = 0; fz = 0; streetWeb(t);
      for (let i = 0; i < 6; i++) { const k = kites[i]; k.visible = true; k.position.set(-8 + i * 3.2, 13 + Math.sin(t + i) * 0.6, -26 - (i % 2) * 4); k.lookAt(0, 8, 10); k.userData.sway(t); }
      C = cuts(t, [[99, v3(5, 12, 26), v3(3.5, 9.5, 20), v3(0, 2, 2), v3(0, 3, -6), 54]]); break; }
    case 2: { mood = 'day'; fx = 0; fz = 6;
      const tHi = vs('town') + 2.4, tRule = vs('rule') + 2.3;
      streetWeb(t, [0, 1, 2, 3, 4, 5], true);
      // shot A: two kids meet & high-five -> string grows
      const A = crowd[0], B = crowd[1];
      const k = clamp((t - vs('town')) / 2.2); put(A, lerp(-1.5, -0.55, ease(k)), 9, faceTo(0, 9, 0.6, 12)); put(B, lerp(1.5, 0.55, ease(k)), 9, faceTo(0, 9, -0.6, 12));
      const five = t > tHi - 0.3 && t < tHi + 0.4; act(A, t > tHi ? 'laugh' : 'smile', k < 1 ? walkPose(t * 7, 0.5) : five ? { armRz: 2.2, armRx: -0.3 } : { armRx: -0.45, armRz: -0.25 }); act(B, t > tHi ? 'happy' : 'smile', k < 1 ? walkPose(t * 7 + 1, 0.5) : five ? { armLz: -2.2, armLx: -0.3 } : { armLx: -0.45, armLz: 0.25 });
      if (t > tHi) tie(A, B, { prog: prog(t, tHi, 0.5), sag: 0.15 });
      // shot B: best friends hug, gold string
      const Cg = crowd[2], D = crowd[3]; put(Cg, -0.45, 2.0, faceTo(-0.45, 2, 0.6, 5)); put(D, 0.45, 2.0, faceTo(0.45, 2, -0.6, 5)); act(Cg, 'happy', G.hug(0.6)); act(D, 'laugh', G.hug(0.6)); setBlush(Cg, true); tie(Cg, D, { gold: 1, sa: 'R', sb: 'L', sag: 0.1 });
      // shot C: boy waves, girl doesn't see -> nothing; she waves back -> string appears
      const E = crowd[4], F = crowd[5]; put(E, -0.9, -6, faceTo(-0.9, -6, 0.9, -3.5)); const turned = t > tRule - 0.4; put(F, 0.9, -6, turned ? faceTo(0.9, -6, -0.9, -3.5) : 1.3);
      act(E, turned ? 'laugh' : 'smile', G.wave(t)); act(F, turned ? 'happy' : 'smile', turned ? { armLz: -2.5, _wave: 0, headZ: -0.08 } : {});
      if (t > tRule) tie(E, F, { prog: prog(t, tRule, 0.6), sb: 'L', sag: 0.25, color: 0x7ac8ff });
      C = cuts(t, [
        [vs('gold') - 0.05, v3(0.2, 2.2, 13.0), v3(0.2, 2.1, 12.6), v3(0, 1.5, 9), null, 50],
        [vs('rule') - 0.05, v3(0.3, 2.1, 5.8), v3(0.25, 2.0, 5.4), v3(0, 1.5, 2.0), null, 46],
        [99, v3(0.2, 2.2, -1.8), v3(0.2, 2.1, -2.2), v3(0, 1.5, -6), null, 50]]); break; }
    case 3: { mood = 'day'; fx = 0; fz = 4;
      const lz = rampV(t, sc.start, sc.end, 7, 4.5); put(leo, 0, lz, faceTo(0, lz, 0.6, lz + 4)); act(leo, 'laugh', walkPose(t * 6, 0.4, { armRz: 0.5, armRx: -0.2 })); setBlush(leo, false);
      const R = 3.2; for (let i = 0; i < 12; i++) { const a = -2.4 + i * (4.8 / 11); const k = crowd[i]; const x = Math.sin(a) * R, z = lz - Math.cos(a) * R * 0.9; put(k, x, z, faceTo(x, z, 0, lz)); act(k, i % 2 ? 'happy' : 'laugh', i % 3 ? G.wave(t + i) : G.cheer(t + i)); tie(leo, k, { sa: 'R', sb: 'R', sag: 0.4, color: [0xff7a9a, 0x7ac8ff, 0x9aff9a, 0xffb86a, 0xd8a0ff][i % 5], gold: i === 3 }); }
      const r = rng(7); for (let i = 0; i < 35; i++) { const a = r() * 6.28; const far = v3(Math.sin(a) * (6 + r() * 10), 0.8 + r() * 3.5, lz + Math.cos(a) * (6 + r() * 10)); strings.draw(hand(leo), far, { color: [0xff7a9a, 0x7ac8ff, 0x9aff9a, 0xffb86a, 0xd8a0ff][i % 5], r: 0.016, sag: 0.6, glow: 1.1 }); }
      C = cuts(t, [[vs('everyone') - 0.05, v3(0, 2.8, lz + 5.4), v3(0, 2.6, lz + 4.8), v3(0, 1.7, lz), null, 56], CU(99, leo, { ang: 0.2, d: 3.4 })]); break; }
    case 4: { mood = 'day'; fx = 0; fz = 4;
      streetWeb(t, [6], true);
      const jz = rampV(t, sc.start, sc.end, 12, 6); put(june, -1.0, jz, faceTo(-1.0, jz, -0.4, jz - 4)); act(june, t > vs('smiled') ? 'smile' : 'sad', walkPose(t * 5, 0.35, t > vs('smiled') ? {} : { headX: 0.2 }));
      const K = crowd[6]; put(K, 1.4, jz - 3.0, faceTo(1.4, jz - 3, -1.0, jz)); act(K, t > ve('nostring') ? 'laugh' : 'laugh', t < ve('nostring') ? G.point() : G.laughBend(t));
      tie(K, crowd[7], { sa: 'L', sb: 'R', sag: 0.6 }); tie(K, crowd[4], { sa: 'L', sb: 'L', sag: 0.8, color: 0x9aff9a });
      C = cuts(t, [
        [vs('zero') - 0.05, v3(-0.4, 2.8, jz - 6.0), v3(-0.5, 2.6, jz - 5.6), v3(-1.0, 1.6, jz), null, 52],
        CU(vs('nostring') - 0.05, june, { ang: 0.2, d: 4.6, ly: -0.9, fov: 50 }),
        CU(vs('smiled') - 0.05, K, { ang: -0.2 }),
        CU(99, june, { ang: -0.25 })]); break; }
    case 5: { const tIn = vs('built') - 0.05, tOut = vs('nobody') - 0.05;
      if (t < tIn) { mood = 'dawn'; fx = -6; fz = -12;
        const k = clamp((t - sc.start) / (tIn - sc.start - 0.4)); put(june, lerp(-1.5, SHOP_DOOR.x + 0.15, k), lerp(-9, SHOP_DOOR.z, k), faceTo(-1.5, -9, SHOP_DOOR.x, SHOP_DOOR.z)); june.visible = k < 1; act(june, 'smile', walkPose(t * 7, 0.45, { bodyX: 0.1 }));
        C = cuts(t, [[tIn, v3(1.8, 2.6, -6.6), v3(1.4, 2.5, -7.4), v3(-4.6, 1.6, -12.4), null, 50]]); }
      else if (t < tOut) { mood = 'int'; fx = KS; fz = 0; side = -1;
        put(june, KS + 0.2, -0.7, 0.05); act(june, 'happy', { armLx: -1.2, armRx: -1.2, armLz: 0.3, armRz: -0.3, headX: 0.25 });
        workKite.visible = true; workKite.position.set(KS + 0.15, 1.12, 0.25); workKite.rotation.set(-1.25, 0, Math.sin(t * 3) * 0.1);
        C = cuts(t, [[tIn + 1.6, v3(KS + 0.6, 2.5, 2.8), v3(KS + 0.5, 2.4, 2.5), v3(KS + 0.2, 1.4, -0.2), null, 46], [tOut, v3(KS + 3.0, 2.8, 3.2), v3(KS + 2.7, 2.7, 3.0), v3(KS - 0.4, 1.9, -1.4), null, 58]]); }
      else { mood = 'dawn'; fx = 4; fz = 8;
        const D2 = DOOR2; const k = clamp((t - tOut) / 1.0); put(june, D2.x + 0.9 + k * 0.3, D2.z + 0.2, k < 0.6 ? -Math.PI / 2 : Math.PI / 2, { kneel: k < 0.6 }); act(june, 'smile', k < 0.6 ? G.give() : walkPose(t * 7, 0.5));
        const kk = kites[0]; kk.visible = true; kk.position.set(D2.x + 0.35, 0.25, D2.z + 0.2); kk.rotation.set(-1.3, Math.PI / 2, 0); kk.userData.sway(0, 0);
        C = cuts(t, [[99, v3(D2.x + 2.8, 1.8, D2.z - 2.4), v3(D2.x + 2.6, 1.7, D2.z - 2.2), v3(D2.x + 0.6, 0.8, D2.z + 0.1), null, 50]]); }
      break; }
    case 6: { const tNext = vs('nextday') + 0.6;
      if (t < tNext) { mood = 'day'; fx = 3; fz = 3;
        put(leo, 2.2, 2.2, faceTo(2.2, 2.2, 1.2, 5)); act(leo, t > vs('great') ? 'angry' : 'surprise', { armLx: -0.9, armRx: -0.9, armLz: -0.5, armRz: 0.5, headX: 0.15 });
        const hl = hand(leo, 'L'), hr = hand(leo, 'R'); brokenL.visible = brokenR.visible = true; brokenL.position.copy(hl).add(v3(-0.1, 0.15, 0.1)); brokenR.position.copy(hr).add(v3(0.1, 0.15, 0.1)); brokenL.rotation.set(0.2, 0.3, 0.6); brokenR.rotation.set(-0.2, -0.3, -0.7);
        streetWeb(t, [2, 3, 4, 5, 6, 7, 8], false);
        C = cuts(t, [[vs('great') - 0.05, v3(3.6, 2.3, 5.2), v3(3.4, 2.2, 4.8), v3(2.2, 1.6, 2.2), null, 48], CU(tNext, leo, { ang: -0.2 })]); }
      else { mood = 'day'; fx = 6; fz = 4;
        const D = LEO_DOOR; const k = clamp((t - tNext) / 0.8); put(leo, D.x - 0.9 - 0.4 * k, D.z, -Math.PI / 2 - 0.45); act(leo, t > tNext + 0.7 ? 'surprise' : 'smile', t > tNext + 1.2 ? G.handsHead() : {});
        leoKite.visible = true; leoKite.position.set(D.x - 2.1, 0.25, D.z - 0.3); leoKite.rotation.set(-1.3, -Math.PI / 2, 0); leoKite.userData.sway(0, 0);
        C = cuts(t, [[99, v3(D.x - 4.4, 2.0, D.z - 2.4), v3(D.x - 4.1, 1.9, D.z - 2.2), v3(D.x - 1.6, 1.2, D.z - 0.2), null, 52]]); }
      break; }
    case 7: case 8: { mood = 'day'; fx = 0; fz = -36;
      // kids across the field flying kites
      const SP = [[-6, -30], [-3, -28.5], [0.5, -29.5], [3.5, -28.5], [6.5, -30], [-7, -34], [-4, -33], [-1, -34.5], [2, -33], [5, -34], [7.5, -35], [-5.5, -38], [-2.5, -37.5], [1, -38.5], [4, -37.5], [6.5, -39.5]];
      SP.forEach(([x, z], i) => { const k = crowd[i]; put(k, x, z, faceTo(x, z, x * 0.3, z - 8) + Math.PI); act(k, i % 2 ? 'laugh' : 'happy', { armRx: -1.6, armRz: -0.2, headX: -0.35 }); flyKite(kites[i], k, t, i, { dz: -5 - (i % 3) * 2, y: 10 + (i % 4) * 1.4 }); });
      put(leo, 0, -31.5, Math.PI); act(leo, 'laugh', { armRx: -1.6, headX: -0.35 }); flyKite(leoKite, leo, t, 16, { dx: 0.5, dz: -6, y: 12 });
      put(june, -3.4, -43.6, faceTo(-3.4, -43.6, -2, -36)); put(hazel, -4.6, -43.0, faceTo(-4.6, -43, -2.6, -40));
      act(june, sc.id === 8 && t > vs('okay') ? 'warm' : 'sad', speaking(june) ? G.shrug() : G.sad()); act(hazel, 'worried', speaking(hazel) ? G.explain(t) : {});
      if (sc.id === 7) { hazel.visible = t > vs('except') ? true : false;
        C = cuts(t, [
          [vs('appeared') - 0.05, v3(-2, 3.0, -25.5), v3(-1.2, 5.0, -26.5), v3(0, 5, -36), v3(0, 8.5, -40), 58],
          [vs('except') - 0.05, v3(4.8, 1.8, -27.6), v3(4.6, 2.0, -27.9), v3(3.5, 4.0, -33), null, 52],
          [99, v3(-1.2, 2.4, -38.0), v3(-1.5, 2.3, -38.6), v3(-3.6, 1.6, -43.6), null, 48]]); }
      else C = cuts(t, [CU(vs('okay') - 0.05, hazel, { ang: 0.3 }), CU(99, june, { ang: -0.3 })]);
      break; }
    case 9: case 10: { mood = 'storm'; fx = 0; fz = -38; rain.visible = true; rain.userData.update(t, 0, -38); bloomS = 0.3;
      const tRip = vs('storm') + 1.4;
      const SP = [[-6, -30], [-3, -28.5], [0.5, -29.5], [3.5, -28.5], [6.5, -30], [-7, -34], [-4, -33], [-1, -34.5], [2, -33], [5, -34], [7.5, -35], [-5.5, -38], [-2.5, -37.5], [1, -38.5], [4, -37.5], [6.5, -39.5]];
      const ripped = t > tRip;
      SP.forEach(([x, z], i) => { const k = crowd[i]; put(k, x, z, faceTo(x, z, 0, -44) + (ripped ? 0 : 0)); act(k, ripped ? (i % 3 ? 'cry' : 'surprise') : 'worried', ripped ? (i % 2 ? G.handsHead() : G.sad()) : { armRx: -1.6, headX: -0.35 }); if (ripped && i % 3) setTears(k, true, t);
        const kt = kites[i];
        if (!ripped) flyKite(kt, k, t * 1.8, i, { dz: -5, y: 10 + (i % 4) * 1.2 });
        else { // loose kites tumble toward the cliff edge where June catches them
          const tc = vs('ran') + 1.0 + i * 0.22; const u = clamp((t - tRip) / Math.max(0.3, tc - tRip)); kt.visible = t < tc + 0.05 || sc.id === 10;
          const from = v3(x + Math.sin(i * 2.3) * 2.5, 11 + (i % 4), z - 6), to = v3(0.3, 2.6 + (i % 4) * 0.5, -45.2);
          if (t < tc) { kt.position.copy(from.clone().lerp(to, u)); kt.position.y += Math.sin(u * Math.PI) * 3 + Math.sin(t * 6 + i) * 0.4; kt.rotation.set(t * 3 + i, t * 2, t * 4 + i); }
          else { kt.position.set(0.3 + Math.sin(i * 1.7) * 1.6, 4.2 + (i % 5) * 0.55, -46.2 - (i % 3) * 0.6); kt.lookAt(0, 4, -30); kt.userData.sway(t * 2, 1.4); kiteLines.draw(hand(june, 'R'), kt.position.clone(), { color: 0xffffff, r: 0.008, sag: 0.2 }); }
        } });
      put(leo, 0, -31.5, Math.PI); act(leo, ripped ? 'surprise' : 'worried', ripped ? G.handsHead() : { armRx: -1.6, headX: -0.35 });
      if (!ripped) flyKite(leoKite, leo, t * 1.8, 16, { dx: 0.5, dz: -6, y: 12 });
      else { const tc = vs('ran') + 0.6; const u = clamp((t - tRip) / Math.max(0.3, tc - tRip)); if (t < tc) { leoKite.visible = true; leoKite.position.copy(v3(0.5, 12, -37.5).lerp(v3(0, 3, -45.2), u)); leoKite.rotation.set(t * 3, t * 2, t * 4); } else { leoKite.visible = true; leoKite.position.set(-0.6, 5.0, -46.6); leoKite.lookAt(0, 4, -30); leoKite.userData.sway(t * 2, 1.4); kiteLines.draw(hand(june, 'R'), leoKite.position.clone(), { color: 0xffffff, r: 0.008, sag: 0.2 }); } }
      put(hazel, -4.6, -43.0, faceTo(-4.6, -43, 0, -36)); act(hazel, 'surprise', G.handsHead());
      if (sc.id === 9) { put(june, -3.4, -43.6, faceTo(-3.4, -43.6, 0, -36)); act(june, 'surprise', {});
        C = cuts(t, [[vs('storm') - 0.05, v3(3, 2.6, -24), v3(2.6, 3.2, -25), v3(0, 6, -40), v3(0, 7, -42), 56],
          [tRip + 0.8, v3(-5.2, 2.2, -27.2), v3(-5.0, 2.4, -27.6), v3(-4.0, 6.0, -36), null, 50],
          [99, v3(0.9, 2.3, -36.4), v3(0.8, 2.25, -36.0), v3(0, 1.8, -31.5), null, 52]]); }
      else { const k = clamp((t - vs('ran')) / 1.0); const jx = lerp(-3.4, 0, ease(k)), jz = lerp(-43.6, -45.0, ease(k)); put(june, jx, jz, k < 1 ? faceTo(-3.4, -43.6, 0, -45) : 0);
        act(june, k < 1 ? 'angry' : 'worried', k < 1 ? walkPose(t * 10, 0.9, { bodyX: 0.2 }) : { armRz: 2.4 + Math.sin(t * 9) * 0.2, armRx: -0.4, armLz: -1.4, headX: -0.3 });
        C = cuts(t, [CU(vs('ran') - 0.05, june, { ang: 0.4, d: 3.2 }),
          [vs('ran') + 2.4, v3(2.6, 2.0, -40.5), v3(2.2, 2.2, -40.8), v3(jx, 2.6, jz - 1), null, 54],
          [99, v3(0.4, 1.7, -39.6), v3(0.4, 1.9, -40.4), v3(0, 3.8, -45.5), null, 56]]); }
      tint = 0.04; break; }
    case 11: case 12: case 13: case 14: {
      mood = sc.id === 11 ? 'after' : 'golden'; fx = 0; fz = -40; bloomS = sc.id >= 12 ? 0.55 : 0.38;
      const JZ = -45.0; put(june, 0, JZ, 0);
      // kids in a semicircle facing June, each holding their kite (11) / flying it again (13-14)
      const flying = sc.id >= 13;
      const kidsIdx = [...Array(16).keys()];
      kidsIdx.forEach((i) => { const row = i < 9 ? 0 : 1; const n = row ? 7 : 9; const j = row ? i - 9 : i; const a = (-1 + 2 * j / (n - 1)) * (row ? 1.1 : 1.25); const R = row ? 6.4 : 4.4;
        const x = Math.sin(a) * R, z = JZ + Math.cos(a) * R; const k = crowd[i]; put(k, x, z, faceTo(x, z, 0, JZ));
        if (!flying) { act(k, sc.id === 11 ? (T > vs('looked') + 0.6 ? 'surprise' : 'worried') : 'cry', { armLx: -1.0, armRx: -1.0, armLz: 0.3, armRz: -0.3, headX: sc.id === 11 ? 0.3 : 0 }); if (sc.id === 12) setTears(k, true, t + i);
          const kt = kites[i]; kt.visible = true; const hp = hand(k, 'R').lerp(hand(k, 'L'), 0.5); kt.position.copy(hp).add(v3(0, 0.25, 0)); kt.rotation.set(-0.9, faceTo(x, z, 0, JZ) + Math.PI, 0); kt.scale.setScalar(0.8); }
        else { act(k, i % 2 ? 'laugh' : 'happy', { armRx: -1.4, headX: -0.3 }); kites[i].scale.setScalar(1.25); flyKite(kites[i], k, t, i, { dx: Math.sin(a) * 3, dz: -4 - (i % 3) * 1.5 - (k.position.z - JZ), y: 8 + (i % 5) * 1.3 }); }
        // golden strings
        if (sc.id >= 12) { const t0 = vs('shot') + 0.2 + i * 0.09; if (t > t0) strings.draw(hand(k, 'R'), hand(june, i % 2 ? 'R' : 'L'), { color: 0xffd24a, r: 0.02, sag: 0.25, prog: prog(t, t0, 0.5), glow: 1.3 }); } });
      kites.forEach(k => { if (!flying) k.scale.setScalar(0.8); });
      // Leo in front with the note
      const lx = 1.7, lz = JZ + 2.0; put(leo, lx, lz, faceTo(lx, lz, 0, JZ) + (sc.id === 11 ? 0.9 : 0));
      if (sc.id === 11) { act(leo, t > vs('flyhigh') ? 'surprise' : 'worried', { armLx: -1.1, armRx: -1.1, armLz: 0.3, armRz: -0.3, headX: 0.3 });
        leoKite.visible = true; leoKite.scale.setScalar(0.8); const hp = hand(leo, 'R').lerp(hand(leo, 'L'), 0.5); leoKite.position.copy(hp).add(v3(0, -0.15, 0.05)); leoKite.rotation.set(-1.15, leo.rotation.y, 0);
        note.visible = !(t > vs('flyhigh') - 0.1 && t < vs('looked')); note.position.copy(leoKite.position).add(v3(0, 0.12, 0)); note.rotation.set(-1.15, leo.rotation.y, 0); note.scale.setScalar(1); note.translateZ(0.03); }
      else if (sc.id >= 12) { act(leo, sc.id === 13 ? 'happy' : 'cry', sc.id === 13 ? { armRx: -1.4, headX: -0.3 } : {}); if (sc.id === 12) setTears(leo, true, t); if (t > vs('shot') + 0.1) strings.draw(hand(leo, 'R'), hand(june, 'R'), { color: 0xffd24a, r: 0.032, sag: 0.15, prog: prog(t, vs('shot') + 0.1, 0.4), glow: 1.9 });
        if (sc.id >= 13) { leoKite.scale.setScalar(1.25); flyKite(leoKite, leo, t, 16, { dx: 1, dz: -6 - (leo.position.z - JZ), y: 12.5 }); } }
      put(hazel, -2.4, JZ + 1.2, faceTo(-2.4, JZ + 1.2, 0, JZ)); act(hazel, sc.id >= 12 ? 'warm' : 'smile', sc.id >= 13 ? { armRx: -0.5 } : {}); if (sc.id >= 12) strings.draw(hand(hazel, 'R'), hand(june, 'L'), { color: 0xffd24a, r: 0.03, sag: 0.3, prog: sc.id === 12 ? prog(t, vs('allgold'), 0.5) : 1, glow: 1.8 });
      // June
      const jFace = sc.id === 11 ? 'worried' : sc.id === 12 ? (t > vs('allgold') ? 'cry' : 'surprise') : 'laugh';
      act(june, jFace, sc.id === 12 && t > vs('allgold') ? { armLz: -0.5, armRz: 0.5, armLx: -0.5, armRx: -0.5 } : sc.id >= 13 ? G.cheer(t) : {}); if (sc.id === 12 && t > vs('allgold')) { setTears(june, true, t); setBlush(june, true); } if (sc.id >= 13) setBlush(june, true);
      if (sc.id === 11) C = cuts(t, [
        CU(vs('flyhigh') - 0.05, leo, { ang: -0.6, d: 3.0 }),
        CU(vs('looked') - 0.05, leo, { ang: -0.3, d: 4.0, ly: -0.8, fov: 48 }),
        [99, v3(0.8, 4.4, JZ - 1.4), v3(0.8, 4.6, JZ - 1.8), v3(0, 1.3, JZ + 5), null, 60]]);
      else if (sc.id === 12) C = cuts(t, [
        CU(vs('shot') - 0.05, june, { ang: 0, d: 3.2 }),
        [vs('allgold') - 0.05, v3(0, 8.0, JZ + 11), v3(0, 7.4, JZ + 10), v3(0, 1.0, JZ + 0.5), null, 56],
        CU(99, june, { ang: -0.3, d: 3.6, fov: 46 })]);
      else if (sc.id === 13) C = cuts(t, [
        [vs('nevertold') - 0.05, v3(3.5, 4.8, JZ + 9), v3(2.5, 7.0, JZ + 12), v3(0, 3.0, JZ), v3(0, 6.5, JZ - 4), 60],
        CU(99, june, { ang: -0.15, d: 3.6, fov: 46 })]);
      else { C = cuts(t, [[99, v3(0, 6.5, JZ + 10), v3(0, 8.0, JZ + 13), v3(0, 2.4, JZ), v3(0, 8.0, JZ - 6), 60]]);
        if (lt > 0.3) { big = "Who's your<br><span style=\"color:#ffd24a\">golden string?</span><br><span style=\"font-size:78px\">Tag them 💛</span>"; bop = clamp((lt - 0.3) / 0.35); } tint = 0.05; }
      break; }
  }
  setMood(mood, fx, fz, side);
  mill.userData.blades.rotation.z = t * (mood === 'storm' ? 2.5 : 0.6);
  clouds.position.x = (t * 0.4) % 30; stormClouds.position.x = (t * 2.0) % 30;
  frontFill.intensity = mood === 'int' ? 0.3 : mood === 'storm' ? 0.9 : 0.85; frontFill.position.copy(C.cam).add(v3(0, 3, 0)); frontFill.target.position.copy(C.look);
  if (camera.fov !== C.fov) { camera.fov = C.fov; camera.updateProjectionMatrix(); }
  camera.position.copy(C.cam); camera.lookAt(C.look);
  bloom.strength = bloomS;
  composer.render();
  $('tint').style.opacity = tint;
  let hook = '', hop = 0;
  if (sc.id === 1) { hook = '<span class="series">WHAT IF EVERY<br>FRIENDSHIP WAS A<br><span style="color:#ff8aa8">STRING?</span></span>'; hop = clamp(lt / 0.25) * clamp((sc.end - t) / 0.3); }
  setText('hook', hook, hop);
  const cap = (sc.id === 1 || (sc.id === 14 && lt > 0.3) || (sc.id === 11 && t > vs('flyhigh') - 0.1 && t < vs('looked') - 0.05)) ? null : TL.captions.find(c => t >= c.start && t < c.end + 0.05);
  const ce = $('cap');
  if (cap) { const k = clamp((t - cap.start) / 0.09); ce.style.transform = `scale(${1.18 - 0.18 * easeOut(k)})`; ce.style.color = SPK_COLOR[cap.spk];
    const txt = cap.text.replace(/(\d+|forty-seven|zero|golden|gold\.?|BOTH|June\.?|string\.?|strings\.?)/g, '<span style="color:#ffd94a">$1</span>'); setText('cap', txt, 1); }
  else setText('cap', '', 0);
  setText('big', big, bop);
  let nc = document.getElementById('notecard'); if (!nc) { nc = document.createElement('div'); nc.id = 'notecard'; nc.style.cssText = 'position:absolute;left:170px;right:170px;top:330px;height:520px;background:#fffaf0;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.55);transform:rotate(-4deg);display:flex;flex-direction:column;justify-content:center;align-items:center;font:italic 700 92px Georgia,serif;color:#3a2a1a;line-height:1.25;opacity:0'; nc.innerHTML = 'Fly high, Leo.<br><span style="font-size:80px">Love, J. 💛</span>'; document.body.appendChild(nc); }
  const nk = sc.id === 11 && t > vs('flyhigh') - 0.1 && t < vs('looked') - 0.05; nc.style.opacity = nk ? clamp((t - vs('flyhigh') + 0.1) / 0.2) : 0; nc.style.transform = `rotate(-4deg) scale(${nk ? 0.9 + 0.1 * easeOut((t - vs('flyhigh') + 0.1) / 0.3) : 1})`;
  return true;
};
window.DURATION = TL.duration; window.READY = true;
