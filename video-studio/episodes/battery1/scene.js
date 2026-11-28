// "What If Your Energy Was Visible?" — Maple Hill. Fast cuts, bright warm light, interiors.
import * as THREE from 'three';
import { makeAvatar, setFace, setTears, setBlush, pose, poseG, G, talkFace, blinkFace, walkPose } from '../../shared/avatars_round.js';
import { rng, clamp, lerp, ease, easeOut, v3, lerpV, faceTo, canvasTex, mat,
  setupRenderer, setupComposer, makeSky, sunGlowSprite, cloudField, ground, contactShadow, treeRound, treePine, building } from '../../shared/world_kit.js';
import { room, desk, chair, chalkboard, wallClock, poster, longTable, tray, cookie, locker, bed, nightLamp, rug, shelf, counter, fridge,
  busStop, schoolBuilding, fence, flowerBed, streetLamp, makeBattery, energyStream, sign } from '../../shared/interior_kit.js';

const TL = await (await fetch('./timeline.json')).json();
const W = 1080, H = 1920, VO = TL.vo;
const vs = k => VO[k].start, ve = k => VO[k].start + VO[k].dur;
const P = new URLSearchParams(location.search);

const renderer = setupRenderer(W, H);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 400); scene.add(camera);
const { composer, bloom, vignette, gtao, bokeh } = setupComposer(renderer, scene, camera, W, H, { ao: Number(P.get('ao') ?? 0), dof: P.get('dof') === '1' });

const fill = new THREE.PointLight(0xfff4ea, 1.35, 9, 1.4); camera.add(fill); fill.position.set(0.3, 0.4, 0);
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x6a5a40, 1.15); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d6, 2.8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 120 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);

// ================= TOWN: Maple Hill =================
const sky = makeSky(0x7cc4ff, 0xe6f4ff); scene.add(sky);
const sunSprite = sunGlowSprite(0xfff2c8, 26); scene.add(sunSprite);
const clouds = cloudField(12, 110, 26, 7); scene.add(clouds);
const grass = ground(160, 160, 'grass', 0x5a9a44, 0x3f7a32, 20); grass.position.set(0, 0, -5); scene.add(grass);
const roadTex = canvasTex(256, 512, (c) => { c.fillStyle = '#6e6a66'; c.fillRect(0, 0, 256, 512); const r = rng(2); for (let i = 0; i < 1500; i++) { c.fillStyle = `rgba(0,0,0,${r() * 0.12})`; c.fillRect(r() * 256, r() * 512, 2, 2); } c.fillStyle = '#f4e9a8'; for (let y = 0; y < 512; y += 128) c.fillRect(122, y, 12, 70); });
roadTex.wrapT = THREE.RepeatWrapping; roadTex.repeat.set(1, 6);
const road = new THREE.Mesh(new THREE.PlaneGeometry(6, 70), mat(0xffffff, { map: roadTex, roughness: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.015, -1); road.receiveShadow = true; scene.add(road);
const walkTex = canvasTex(128, 128, (c) => { c.fillStyle = '#c9c2b6'; c.fillRect(0, 0, 128, 128); c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 2; c.strokeRect(0, 0, 128, 128); });
walkTex.wrapS = walkTex.wrapT = THREE.RepeatWrapping; walkTex.repeat.set(1, 35);
for (const sx of [-4, 4]) { const sw = new THREE.Mesh(new THREE.BoxGeometry(2, 0.12, 70), mat(0xffffff, { map: walkTex, roughness: 0.9 })); sw.position.set(sx, 0.06, -1); sw.receiveShadow = true; scene.add(sw); }
const plaza = new THREE.Mesh(new THREE.BoxGeometry(18, 0.1, 6), mat(0xffffff, { map: walkTex, roughness: 0.9 })); plaza.position.set(0, 0.05, -34); plaza.receiveShadow = true; scene.add(plaza);
const HOUSES = [
  { x: -8.5, z: 5, w: 5.5, h: 3.6, d: 5, wallColor: 0xf2d6a8, roofColor: 0x9a4a32, doorSide: 1, windowRows: 2, windowCols: 2, chimney: true, seed: 11, lit: 0 },
  { x: -8, z: 14, w: 5, h: 3.4, d: 4.6, wallColor: 0xb8dce8, roofColor: 0x3a5a7a, doorSide: -1, windowRows: 1, windowCols: 2, seed: 12, lit: 0 },
  { x: -8.2, z: -5, w: 6, h: 4.0, d: 5.4, wallColor: 0xf6eedc, roofColor: 0x5a7a4a, doorSide: 1, windowRows: 2, windowCols: 2, seed: 13, lit: 0 },
  { x: 8.5, z: 6, w: 5.2, h: 3.5, d: 5, wallColor: 0xf6c6c0, roofColor: 0x7a3a4a, doorSide: -1, windowRows: 2, windowCols: 2, seed: 14, lit: 0 },
  { x: 8, z: 15, w: 4.8, h: 3.3, d: 4.4, wallColor: 0xfff0b0, roofColor: 0x9a5a2a, doorSide: 1, roofKind: 'gable', windowRows: 1, windowCols: 2, seed: 15, lit: 0 },
  { x: 8.6, z: -5, w: 5.6, h: 3.8, d: 5.2, wallColor: 0xd8e8c8, roofColor: 0x4a4a5a, doorSide: -1, windowRows: 2, windowCols: 2, chimney: true, seed: 16, lit: 0 },
  { x: -8.4, z: 24, w: 5, h: 3.6, d: 5, wallColor: 0xe8d0f0, roofColor: 0x5a3a6a, doorSide: 1, windowRows: 2, windowCols: 2, seed: 17, lit: 0 },
  { x: 8.4, z: 24, w: 5.4, h: 3.6, d: 5, wallColor: 0xc8e0f8, roofColor: 0x2a4a6a, doorSide: -1, windowRows: 2, windowCols: 2, seed: 18, lit: 0 },
];
HOUSES.forEach(o => { const g = building(o); g.position.set(o.x, 0, o.z); g.rotation.y = o.x < 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(g);
  const f = fence(5); f.position.set(o.x + (o.x < 0 ? 3.4 : -3.4), 0, o.z); f.rotation.y = Math.PI / 2; scene.add(f);
  const fb = flowerBed(2.2, o.seed); fb.position.set(o.x + (o.x < 0 ? 2.9 : -2.9), 0, o.z + (o.doorSide * (o.x < 0 ? -1 : 1)) * 1.6); fb.rotation.y = Math.PI / 2; scene.add(fb); });
const school = schoolBuilding('MAPLE HILL SCHOOL'); school.position.set(0, 0, -42); scene.add(school);
{ const r = rng(31); const spots = [[-5.5, 30], [5.8, 30], [-13, 0], [13, 1], [-13, 18], [13, 19], [-12, -14], [12, -14], [-6.2, -24], [6.4, -26], [-14, -28], [14, -30], [-16, 10], [16, 10], [-18, -6], [18, -8], [-4.6, -18], [-10, 30], [10, 32]];
  spots.forEach(([x, z], i) => { const t = (i % 3 === 2) ? treePine(i * 9 + 3, 1.0 + r() * 0.3) : treeRound(i * 9 + 1, 1.0 + r() * 0.35); t.position.set(x, 0, z); scene.add(t); }); }
for (const z of [-20, -8, 4, 16]) for (const sx of [-1, 1]) { const l = streetLamp(); l.position.set(sx * 5.2, 0, z); l.rotation.y = sx > 0 ? Math.PI : 0; scene.add(l); }
const bus = busStop(); bus.position.set(5.6, 0.1, -12); bus.rotation.y = -Math.PI / 2; scene.add(bus);
// props
const iceCream = new THREE.Group(); { const cone = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 12), mat(0xd8a050)); cone.rotation.x = Math.PI; iceCream.add(cone); const sc = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), mat(0xff9ac0)); sc.position.y = 0.17; iceCream.add(sc); } scene.add(iceCream);
const splat = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), mat(0xff9ac0)); splat.rotation.x = -Math.PI / 2; scene.add(splat);
const books = new THREE.Group(); [0xd94a4a, 0x3a7ad0, 0xf0b030].forEach((c, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.3), mat(c)); b.castShadow = true; b.userData.i = i; books.add(b); }); scene.add(books);
// snow flashback overlay
const snowGround = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat(0xf4f8ff, { roughness: 1 })); snowGround.rotation.x = -Math.PI / 2; snowGround.position.set(0, 0.14, 10); scene.add(snowGround);
const snow = new THREE.Group(); { const flake = canvasTex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }); const m = new THREE.SpriteMaterial({ map: flake, color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false }); const r = rng(5); for (let i = 0; i < 420; i++) { const s = new THREE.Sprite(m); s.scale.setScalar(0.07 + r() * 0.06); s.userData = { x: (r() - 0.5) * 12, z: (r() - 0.5) * 8 - 2, y: r() * 7, sp: 0.6 + r() * 0.6 }; snow.add(s); } } scene.add(snow);

// ================= INTERIORS =================
const CL = 100, CF = 200, HM = 300, BR = 400;
const roomLights = [];
function addRoomLight(x, y, z, k = 1) { const l = new THREE.PointLight(0xfff1dc, 0, 16, 1.4); l.position.set(x, y, z); l.userData.k = k; scene.add(l); roomLights.push(l); return l; }
// --- classroom ---
const classroom = room({ w: 12, d: 10, h: 4.2, wall: 0xf4e8d0, stripe: 0x6f9fc8, floor: 'wood', floorColor: 0xb8875a, windowWall: 'left', windows: 3 }); classroom.position.set(CL, 0, 0); scene.add(classroom);
const board = chalkboard(['Today: Energy + Kindness', 'Rule #1: be kind :)', '2 + 2 = 4'], 5.2, 2.0); board.position.set(CL, 2.3, -4.96); scene.add(board);
const clk = wallClock(); clk.position.set(CL + 4.2, 3.4, -4.96); scene.add(clk);
[[0xf0b030, 'READ!'], [0x3aa05a, 'SHARE'], [0xe06aa0, 'BE KIND']].forEach(([c, t], i) => { const p = poster(c, t, 1.1, 1.4); p.position.set(CL + 5.97, 2.4, -3 + i * 2.4); p.rotation.y = -Math.PI / 2; scene.add(p); });
const tDesk = desk(0x8a5a3a); tDesk.scale.set(1.5, 1, 1.2); tDesk.position.set(CL + 3.2, 0, -3.4); scene.add(tDesk);
const SEAT = (col, row) => ({ x: CL + [-3.6, -1.2, 1.2, 3.6][col], z: [-1.0, 1.2, 3.4][row] });
for (let col = 0; col < 4; col++) for (let row = 0; row < 3; row++) { const s = SEAT(col, row); const d = desk(0xc89a62 + col * 3 + row); d.position.set(s.x, 0, s.z - 0.62); scene.add(d); const ch = chair([0x3a7ad0, 0xd94a4a, 0x3aa05a, 0xf0b030][(col + row) % 4]); ch.position.set(s.x, 0, s.z + 0.05); ch.rotation.y = Math.PI; scene.add(ch); }
const shelfC = shelf(); shelfC.position.set(CL - 4.6, 0, -4.7); scene.add(shelfC);
addRoomLight(CL - 2, 3.8, -1); addRoomLight(CL + 2.5, 3.8, 2);
// --- cafeteria ---
const cafe = room({ w: 14, d: 12, h: 4.4, wall: 0xf8f0e0, stripe: 0xe08a4a, floor: 'tile', windowWall: 'right', windows: 3 }); cafe.position.set(CF, 0, 0); scene.add(cafe);
const TABLES = [[CF - 3.6, -2.6], [CF - 3.6, 2.2], [CF + 3.4, -2.6], [CF + 3.4, 2.4]];
TABLES.forEach(([x, z]) => { const t = longTable(5); t.position.set(x, 0, z); scene.add(t); });
const serve = counter(7); serve.position.set(CF - 1, 0, -5.55); scene.add(serve);
const menu = sign(['LUNCH', 'Pizza · Salad · Cookies'], 3.6, 1.2, '#2a4a6a', '#fff8e0', 'bold 110px Inter, Arial'); menu.position.set(CF - 1, 2.8, -5.97); scene.add(menu);
const traysAll = []; [[CF - 4.6, -2.6], [CF - 2.6, -2.6], [CF - 4.2, 2.2], [CF - 2.4, 2.2], [CF + 2.2, -2.6], [CF + 4.4, -2.6], [CF + 4.2, 2.4]].forEach(([x, z], i) => { for (const sz of [-0.32, 0.32]) { const t = tray(i * 2 + (sz > 0)); t.position.set(x, 0.96, z + sz); t.rotation.y = sz > 0 ? Math.PI : 0; scene.add(t); traysAll.push(t); } });
const ivyTray = tray(99); ivyTray.position.set(CF + 3.0, 0.96, 2.72); ivyTray.rotation.y = Math.PI; scene.add(ivyTray);
const theCookie = cookie(); scene.add(theCookie);
addRoomLight(CF - 3, 4.0, 0); addRoomLight(CF + 3, 4.0, 0);
// --- Eli's home (kitchen/living) ---
const home = room({ w: 9, d: 7, h: 3.8, wall: 0xf2e2c4, stripe: 0xa87a56, floor: 'wood', floorColor: 0x9a6a42, windowWall: 'left', windows: 2 }); home.position.set(HM, 0, 0); scene.add(home);
const kc = counter(3.2); kc.position.set(HM - 1.2, 0, -3.1); scene.add(kc); const fr = fridge(); fr.position.set(HM + 1.2, 0, -3.1); scene.add(fr);
const hr = rug(0xc8704a); hr.position.set(HM, 0, 0.6); scene.add(hr);
const homeDoor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.1, 1.0), mat(0x6a4028)); homeDoor.position.set(HM + 4.45, 1.05, 1.6); scene.add(homeDoor);
const photo = sign(['♥'], 0.6, 0.5, '#fff6e0', '#d04a4a', 'bold 300px Inter, Arial', '#8a5a3a'); photo.position.set(HM - 0.2, 2.2, -3.47); scene.add(photo);
addRoomLight(HM, 3.4, 0);
// --- Eli's bedroom ---
const bedroom = room({ w: 6, d: 6, h: 3.4, wall: 0xc8d8ea, stripe: 0x4a6a9a, floor: 'wood', floorColor: 0x8a6040, windowWall: 'left', windows: 1 }); bedroom.position.set(BR, 0, 0); scene.add(bedroom);
const theBed = bed(0x4a7ad0); theBed.scale.setScalar(1.15); theBed.position.set(BR + 0.8, 0, -1.3); scene.add(theBed);
const lamp = nightLamp(); lamp.position.set(BR + 2.2, 0, -2.4); scene.add(lamp);
const sh2 = shelf(); sh2.position.set(BR - 2.3, 0, -2.75); scene.add(sh2);
const pst = poster(0x3a3a7a, '★', 0.9, 1.1); pst.position.set(BR + 2.97, 2.1, 0.4); pst.rotation.y = -Math.PI / 2; scene.add(pst);
const br2 = rug(0x5a6ab0); br2.position.set(BR - 0.6, 0, 1.2); scene.add(br2);
const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), mat(0x4a7ad0, { roughness: 0.95 })); blanket.position.set(BR + 0.8, 1.05, -0.55); blanket.castShadow = true; scene.add(blanket);
addRoomLight(BR, 3.0, 0, 0.6);

// ================= CHARACTERS =================
const KID = 0.85, ADULT = 1.05;
function backpack(av, color) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.7, 0.3), mat(color, { roughness: 0.7 })); b.position.set(0, 0.55, -0.45); b.castShadow = true; av.userData.P.body.add(b); for (const sx of [-0.2, 0.2]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.6, 0.06), mat(0x222222)); s.position.set(sx, 0.62, 0.0); s.scale.z = 1; } }
function tie(av, color) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.05), mat(color)); t.position.set(0, 0.62, 0.36); av.userData.P.body.add(t); }
const eli = makeAvatar({ seed: 701, skin: 0xf1c27d, hair: 0x3a2414, hairStyle: 'curly', top: 0xe8a72c, legs: 0x34486a, acc: 'none', scale: KID }); backpack(eli, 0x2f7d6a);
const ivy = makeAvatar({ seed: 702, skin: 0x8d5524, hair: 0x141010, hairStyle: 'long', top: 0xb07ad0, legs: 0x3a2a4a, acc: 'none', scale: KID });
const brock = makeAvatar({ seed: 703, skin: 0xffe0bd, hair: 0xf0c040, hairStyle: 'spiky', top: 0xd23c3c, legs: 0x2a2a3a, acc: 'none', scale: KID * 1.06 });
const hale = makeAvatar({ seed: 704, skin: 0xc68642, hair: 0x9a9a9a, hairStyle: 'short', top: 0x4a6a8a, legs: 0x2a2a2a, acc: 'glasses', scale: ADULT }); tie(hale, 0xc0392b);
const mom = makeAvatar({ seed: 705, skin: 0xf1c27d, hair: 0x5a3a1e, hairStyle: 'bun', top: 0x4aa88a, legs: 0x4aa88a, acc: 'none', scale: ADULT });
const girl = makeAvatar({ seed: 706, skin: 0xffcd94, hair: 0xe8731c, hairStyle: 'bun', top: 0xff8ab0, legs: 0x6a4a8a, acc: 'bow', scale: 0.68 });
const bookKid = makeAvatar({ seed: 707, skin: 0xe0ac69, hair: 0x111111, hairStyle: 'short', top: 0x2aa0a0, legs: 0x3a3a42, acc: 'glasses', scale: KID });
const MAIN = [eli, ivy, brock, hale, mom, girl, bookKid];
const crowd = []; for (let i = 0; i < 14; i++) crowd.push(makeAvatar({ seed: 900 + i * 13, scale: KID * (0.94 + (i % 3) * 0.04) }));
const adults = []; for (let i = 0; i < 6; i++) adults.push(makeAvatar({ seed: 1200 + i * 17, scale: ADULT }));
const ALL = [...MAIN, ...crowd, ...adults];
ALL.forEach(a => { scene.add(a); a.userData.cs = contactShadow(1.1); a.add(a.userData.cs); a.userData.bat = makeBattery(); scene.add(a.userData.bat); a.userData.level = 100; });
const SPEAK = { E: eli, I: ivy, B: brock, T: hale, M: mom };
const speaking = av => Object.values(VO).some(v => SPEAK[v.spk] === av && T >= v.start && T < v.start + v.dur - 0.05);
let T = 0;

// ---- popups (+20% / -1%) ----
const popups = []; const popCache = new Map();
function popTex(txt, col) { const k = txt + col; if (popCache.has(k)) return popCache.get(k); const t = canvasTex(256, 128, (g) => { g.font = '900 84px Inter, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 14; g.strokeStyle = '#000'; g.strokeText(txt, 128, 64); g.fillStyle = col; g.fillText(txt, 128, 64); }); popCache.set(k, t); return t; }
for (let i = 0; i < 4; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false })); s.renderOrder = 10; s.scale.set(1.0, 0.5, 1); scene.add(s); popups.push(s); }
let popN = 0;
const popQ = [];
function popup(av, txt, col, t0) { popQ.push([av, txt, col, t0]); }
function popupDraw(av, txt, col, t0) { const k = (T - t0) / 1.4; if (k < 0 || k > 1) return; const s = popups[popN++]; s.material.map = popTex(txt, col); s.visible = true; const bp = av.userData.bat.position; s.position.set(bp.x + 0.75 * av.scale.x, bp.y + 0.1 + k * 0.6, bp.z); s.material.opacity = k < 0.75 ? 1 : (1 - k) / 0.25; s.scale.set(1.0 * (1 + 0.25 * (1 - easeOut(k * 4))), 0.5 * (1 + 0.25 * (1 - easeOut(k * 4))), 1); }
const streams = []; for (let i = 0; i < 14; i++) { const s = energyStream(26); scene.add(s); streams.push(s); }
let streamN = 0;
function stream(from, to, amt = 1, arc = 0.6) { const s = streams[streamN++]; s.visible = true; s.userData.update(T, from, to, amt, arc); }
const chest = (av, dy = 1.4) => av.position.clone().add(v3(0, dy * av.scale.y, 0));

// ---- helpers ----
function put(av, x, z, rotY, opt = {}) {
  av.visible = true; av.position.set(x, opt.y ?? 0, z); av.rotation.set(0, rotY, 0); av.userData.lying = false; av.userData.sit = false; av.userData.kneel = !!opt.kneel;
  if (opt.sit) { av.position.y = (opt.seat ?? 0.56) - 0.95 * av.scale.y; av.userData.sit = true; }
  if (opt.kneel) { av.position.y = -0.42 * av.scale.y; av.userData.kneel = true; }
  if (opt.lie) { av.position.y = 0.35 * av.scale.y + (opt.y ?? 0); av.rotation.set(-Math.PI / 2 * (opt.lieK ?? 1), rotY, 0, 'YXZ'); av.userData.lying = (opt.lieK ?? 1) > 0.5; }
  av.userData.cs.visible = !opt.sit && !opt.kneel && !opt.lie;
  av.userData.level = opt.bat ?? av.userData.level; av.userData.showBat = opt.showBat ?? true; av.userData.dead = !!opt.dead; av.userData.blink = opt.blink ?? 1;
  return av;
}
function act(av, face, ...gest) { if (av.userData.sit) gest.unshift(G.sit()); if (av.userData.kneel) gest.unshift({ legL: 1.45, legR: 1.45 }); poseG(av, T, ...gest); talkFace(av, T, speaking(av), face); }
function cuts(t, list) { let s0 = curScene.start; for (const sh of list) { if (t < sh[0] || sh === list[list.length - 1]) { const u = clamp((t - s0) / Math.max(0.01, sh[0] - s0)); const [_, cA, cB, lA, lB, f, solo] = sh; return { cam: lerpV(cA, cB || cA, ease(u)), look: lerpV(lA, lB || lA, ease(u)), fov: f || 50, i: list.indexOf(sh), u, s0, solo }; } s0 = sh[0]; } }
// close-up that always frames head + battery: camera in front of the avatar (ang = yaw offset), slow push-in
function headP(av) { return av.position.clone().add(v3(0, 2.41 * av.scale.y, 0)); }
function closeUp(av, o = {}) { const d = o.d ?? 3.1, ang = (o.ang ?? 0.3) + av.rotation.y, up = o.up ?? 0.12, h = headP(av); const dir = v3(Math.sin(ang), 0, Math.cos(ang));
  const look = h.clone().add(v3(0, o.ly ?? -0.2, 0)); return [h.clone().addScaledVector(dir, d * 1.07).add(v3(0, up, 0)), h.clone().addScaledVector(dir, d * 0.96).add(v3(0, up, 0)), look, look, o.fov ?? 40, o.solo === false ? null : [av, ...(o.keep || [])]]; }
const CU = (until, av, o) => [until, ...closeUp(av, o)];
const rampV = (t, t0, t1, a, b) => lerp(a, b, ease((t - t0) / Math.max(0.01, t1 - t0)));

// ---- moods ----
function setMood(name, fx, fz, side = -1) {
  scene.fog = null; renderer.domElement.style.filter = '';
  sky.visible = clouds.visible = sunSprite.visible = !name.startsWith('int');
  snowGround.visible = snow.visible = name === 'snow';
  roomLights.forEach(l => l.intensity = 0); lamp.userData.light.intensity = 0; lamp.userData.shadeM.emissiveIntensity = 0;
  const winCol = name === 'intNight' ? 0x24346a : name === 'intGold' ? 0xffd8a0 : 0xdff2ff;
  [classroom, cafe, home, bedroom].forEach(r => r.userData.winGlow.forEach(m => m.color.setHex(winCol)));
  if (name === 'day') { sky.userData.setColors(0x6ab8ff, 0xe8f6ff); hemi.color.setHex(0xd8ecff); hemi.groundColor.setHex(0x6a5a40); hemi.intensity = 1.15; sun.color.setHex(0xfff4e4); sun.intensity = 2.8; sun.position.set(fx + 14, 22, fz + 16); scene.fog = new THREE.FogExp2(0xd8ecff, 0.006); sunSprite.position.set(fx + 40, 34, fz - 70); }
  else if (name === 'golden') { sky.userData.setColors(0xff9a5e, 0xffe2b0); hemi.color.setHex(0xffe0c0); hemi.groundColor.setHex(0x7a6050); hemi.intensity = 1.35; sun.color.setHex(0xffbe80); sun.intensity = 3.0; sun.position.set(fx - 16, 8, fz + 14); scene.fog = new THREE.FogExp2(0xffc890, 0.005); sunSprite.position.set(fx - 34, 10, fz - 60); }
  else if (name === 'snow') { sky.userData.setColors(0xb8c8dc, 0xe8eef6); hemi.color.setHex(0xe8f0ff); hemi.groundColor.setHex(0xb0b8c8); hemi.intensity = 1.3; sun.color.setHex(0xe0e8ff); sun.intensity = 1.2; sun.position.set(fx + 10, 20, fz + 10); scene.fog = new THREE.FogExp2(0xe4ecf6, 0.04); renderer.domElement.style.filter = 'sepia(0.35) saturate(0.85) brightness(1.05)'; }
  else if (name === 'int' || name === 'intGold') { hemi.color.setHex(0xffffff); hemi.groundColor.setHex(0xa08a70); hemi.intensity = 1.35; sun.color.setHex(name === 'intGold' ? 0xffcf96 : 0xfff6ea); sun.intensity = 3.6; sun.position.set(fx + side * 16, 9, fz + 5); roomLights.forEach(l => { l.intensity = 10 * l.userData.k; l.color.setHex(0xfff8f0); }); }
  else if (name === 'intNight') { hemi.color.setHex(0x9aaae8); hemi.groundColor.setHex(0x4a4260); hemi.intensity = 1.45; sun.color.setHex(0xa8bcff); sun.intensity = 2.0; sun.position.set(fx + side * 14, 8, fz + 3); lamp.userData.light.intensity = 5; lamp.userData.shadeM.emissiveIntensity = 1.6; }
  sun.target.position.set(fx, 0, fz);
}

// ---- DOM ----
const $ = id => document.getElementById(id);
function setText(id, html, op = 1) { const e = $(id); if (e.innerHTML !== html) e.innerHTML = html; e.style.opacity = op; }
const SPK_COLOR = { N: '#ffffff', E: '#ffe27a', I: '#e6c2ff', B: '#ff9e9e', T: '#a9d4ff', M: '#9ef0cf' };
let curScene = TL.scenes[0];

// crowd placement helpers
const CLASS_SEATS = [[0, 0], [2, 0], [3, 0], [3, 1], [0, 2], [1, 2], [3, 2]];
function classKids(face = 'smile', extra = {}, laugh = false) { CLASS_SEATS.forEach(([c, r], i) => { const s = SEAT(c, r); const k = crowd[i]; put(k, s.x, s.z, Math.PI, { sit: true, bat: 82 + (i * 7) % 18 }); act(k, laugh ? 'laugh' : face, laugh ? G.laughBend(T + i) : (extra[i] || {})); }); }

window.renderAt = function (t) {
  T = t; popN = 0; streamN = 0; popQ.length = 0;
  ALL.forEach(a => { a.visible = false; a.scale.setScalar(a.userData.P.scale); setTears(a, false, t); if (a.userData.P.blush) setBlush(a, false); a.userData.kneel = false; });
  popups.forEach(p => p.visible = false); streams.forEach(s => s.visible = false);
  iceCream.visible = splat.visible = books.visible = theCookie.visible = false; blanket.visible = false;
  const sc = TL.scenes.find(s => t >= s.start && t < s.end) || TL.scenes[TL.scenes.length - 1]; curScene = sc;
  const lt = t - sc.start;
  let batOnly = null; let C = { cam: v3(0, 5, 20), look: v3(0, 2, 0), fov: 50 }, mood = 'day', fx = 0, fz = 0, side = -1, big = '', bop = 0, tint = 0, bloomS = 0.32, focus = 5;

  switch (sc.id) {
    case 1: { mood = 'day'; fx = 0; fz = -18;
      for (let i = 0; i < 8; i++) { const k = crowd[i]; const z = -6 - ((t * 1.3 + i * 2.6) % 20); const x = (i % 2 ? 1.3 : -1.3) + (i % 4 > 1 ? 0.5 : 0); put(k, x, z, Math.PI, { bat: 100 }); act(k, 'smile', walkPose(t * 7 + i, 0.55)); }
      C = cuts(t, [[9, v3(7, 13, 6), v3(4.5, 9.5, -2), v3(0, 2, -26), v3(0, 2.5, -30), 55]]); break; }
    case 2: { mood = 'day'; fx = 0; fz = 4;
      // townsfolk walking both ways on sidewalks
      if (t < vs('charge')) adults.forEach((a, i) => { if (i === 5) return; const dir = i % 2 ? 1 : -1; const z = dir > 0 ? -14 + ((t * 1.2 + i * 6) % 30) : 16 - ((t * 1.2 + i * 6) % 30); put(a, dir > 0 ? 4 : -4, z, dir > 0 ? 0 : Math.PI, { bat: 60 + i * 7 }); act(a, 'smile', walkPose(t * 6.5 + i, 0.5)); });
      // hug on the porch (sleep/hugs charge)
      put(mom, 6.0, 3.6, faceTo(6, 3.6, 5.2, 4.4), { bat: 90 }); put(crowd[9], 5.2, 4.4, faceTo(5.2, 4.4, 6, 3.6), { bat: rampV(t, vs('charge') + 1.0, vs('charge') + 2.2, 45, 92) });
      const hk = clamp((t - vs('charge') - 0.8) / 0.5); act(mom, 'warm', G.hug(hk)); act(crowd[9], 'happy', G.hug(hk));
      // bad day: a man drops his ice cream
      const man = adults[5]; put(man, -2.2, 9.2, Math.PI * 0.85, { bat: rampV(t, vs('charge') + 2.0, vs('charge') + 2.9, 74, 31) });
      const drop = clamp((t - (vs('charge') + 1.8)) / 0.45);
      act(man, drop > 0 ? 'sad' : 'smile', drop > 0.9 ? G.sad() : { armRx: -0.9 });
      iceCream.visible = drop < 1; splat.visible = drop >= 1;
      const hand = v3(-2.2 - 0.3, 1.55, 9.2 - 0.35); iceCream.position.copy(hand); iceCream.position.y = lerp(1.55, 0.1, drop * drop); iceCream.rotation.z = drop * 2.5; splat.position.set(-2.5, 0.13, 8.85);
      C = cuts(t, [
        [vs('town') + 2.0, v3(0.5, 9, 26), v3(0.2, 7, 20), v3(0, 1.5, 4), v3(0, 1.5, 2), 54],
        [vs('charge'), v3(1.2, 2.5, -1.5), v3(1.0, 2.4, -0.8), v3(-4, 2.3, 6), null, 50],
        [vs('charge') + 1.9, v3(2.2, 2.3, 6.4), v3(2.5, 2.2, 6.0), v3(5.6, 2.2, 4.0), null, 50],
        CU(99, man, { d: 3.4, ang: 0.2 })]); break; }
    case 3: { mood = 'day'; fx = 0; fz = -28;
      for (let i = 0; i < 8; i++) { const k = crowd[i]; const z = -20 - ((t * 1.4 + i * 1.9) % 13); put(k, (i % 2 ? 1.6 : -1.4) + (i % 3) * 0.4, z, Math.PI, { bat: 100 }); act(k, 'happy', walkPose(t * 7 + i, 0.55)); }
      const ez = rampV(t, sc.start, sc.end, -14, -19); put(eli, 0.2, ez, Math.PI, { bat: 3, blink: Math.sin(t * 7) > -0.3 ? 1 : 0.55 }); act(eli, 'sad', walkPose(t * 4.5, 0.32, { headX: 0.18 }));
      C = cuts(t, [
        [vs('notEli') - 0.05, v3(3.5, 3.4, -12), v3(2.8, 3.0, -14), v3(0, 2.6, -30), null, 54],
        [vs('three') - 0.05, v3(0.5, 1.9, ez - 3.4), v3(0.4, 1.9, ez - 3.0), v3(0.2, 1.75, ez), null, 46],
        [99, v3(0.9, 1.2, ez - 2.6), v3(0.6, 1.5, ez - 1.9), v3(0.2, 2.6, ez), v3(0.2, 2.7, ez), 44]]); break; }
    case 4: case 5: { mood = 'int'; fx = CL; fz = 0; side = -1;
      const laughing = sc.id === 4 && t > vs('laughed') && t < vs('smiled') + 0.8;
      classKids('smile', {}, laughing);
      const es = SEAT(1, 1); put(eli, es.x, es.z, Math.PI, { sit: true, bat: 3 });
      const bs = SEAT(2, 2); put(brock, bs.x, bs.z - 0.1, faceTo(bs.x, bs.z, es.x, es.z), { bat: 100 });
      put(hale, CL + 1.6, -3.7, 0, { bat: 70 });
      if (sc.id === 4) { act(brock, t > vs('laughed') ? 'laugh' : 'smile', t < vs('laughed') ? G.point() : G.laughBend(t)); act(eli, t > vs('smiled') + 1.0 ? 'sad' : 'smile', t > vs('smiled') + 1.0 ? G.sad() : {}); act(hale, 'worried');
        C = cuts(t, [
          CU(vs('laughed') - 0.05, brock, { ang: 0.1 }),
          [vs('smiled') - 0.05, v3(CL + 4.6, 3.4, -4.3), v3(CL + 4.2, 3.2, -4.0), v3(CL - 1, 1.3, 1.8), null, 62],
          CU(99, eli, { ang: 0.15 })]); }
      else { act(brock, 'smile', G.crossArms()); act(hale, 'worried', G.explain(t)); act(eli, 'smile', speaking(eli) ? { headZ: 0.1 } : {});
        C = cuts(t, [
          CU(vs('fine') - 0.1, hale, { ang: -0.25, d: 3.3 }),
          CU(99, eli, { ang: -0.15 })]); }
      break; }
    case 6: case 7: case 8: { mood = 'int'; fx = CF; fz = 0; side = 1;
      // background tables
      const CS = [[CF - 4.4, -1.65, Math.PI], [CF - 2.8, -1.65, Math.PI], [CF - 4.0, -3.55, 0], [CF - 2.4, -3.55, 0], [CF - 4.2, 3.15, Math.PI], [CF - 2.6, 1.25, 0], [CF + 2.2, -1.65, Math.PI], [CF + 4.4, -1.65, Math.PI], [CF + 3.4, -3.55, 0], [CF - 3.4, 1.25, 0]];
      CS.forEach(([x, z, r], i) => { const k = crowd[i]; put(k, x, z, r, { sit: true, bat: 80 + (i * 9) % 20 }); act(k, ['laugh', 'smile', 'happy'][i % 3], { headY: Math.sin(t * 2 + i) * 0.3, armRx: -0.5 + Math.sin(t * 3 + i) * 0.2 }); talkFace(k, t, Math.sin(t * 1.3 + i * 2) > 0.2, 'smile'); });
      const ivX = CF + 3.0, ivZ = 3.45;
      let ivyBat = sc.id === 6 ? rampV(t, vs('dropping'), vs('dropping') + 1.6, 41, 24) : sc.id === 7 ? (t < vs('jumped') ? 24 : rampV(t, vs('jumped'), vs('jumped') + 0.7, 24, 60)) : 60;
      put(ivy, ivX, ivZ, Math.PI, { sit: true, seat: 0.56, bat: ivyBat });
      ivyTray.visible = true;
      if (sc.id === 6) { act(ivy, 'sad', G.sad());
        C = cuts(t, [
          [vs('dropping') - 0.05, v3(CF - 2.0, 3.5, 5.6), v3(CF - 1.6, 3.3, 5.4), v3(CF + 2.6, 1.3, 2.0), null, 60],
          CU(99, ivy, { ang: 0.2 })]); }
      else {
        const walk = sc.id === 7 ? clamp((t - sc.start) / 1.4) : 1;
        const ex = lerp(CF + 0.6, ivX - 1.0, ease(walk)), ez = lerp(5.0, ivZ + 0.55, ease(walk));
        const eliBat = sc.id === 7 ? (t < vs('two') + 0.3 ? 3 : 2) : 2;
        put(eli, ex, ez, walk < 1 ? faceTo(CF + 0.6, 5.0, ivX - 1.0, ivZ) : faceTo(ex, ez, ivX + 0.5, ivZ - 2.6), { bat: eliBat });
        const giveK = sc.id === 7 ? clamp((t - (vs('cookie') + 1.2)) / 0.6) : 1;
        act(eli, 'smile', walk < 1 ? walkPose(t * 7, 0.5, { armRx: -0.8 }) : (giveK < 1 ? G.give() : (sc.id === 8 && speaking(eli) ? G.shrug() : {})));
        theCookie.visible = true;
        const handP = v3(ex + 0.35, 1.05, ez - 0.25); const tableP = v3(ivX - 0.35, 0.995, ivZ - 0.75);
        theCookie.position.copy(walk < 1 ? handP : lerpV(handP, tableP, ease(giveK)));
        if (sc.id === 7) { act(ivy, t > vs('jumped') ? 'happy' : 'sad', t > vs('jumped') ? {} : G.sad()); if (t > vs('jumped')) setBlush(ivy, true);
          popup(ivy, '+36%', '#5dff8f', vs('jumped')); popup(eli, '-1%', '#ff6a5a', vs('two') + 0.3);
          C = cuts(t, [
            [vs('cookie') + 1.3, v3(CF + 5.4, 2.6, 7.2), v3(CF + 5.0, 2.5, 7.0), v3(CF + 1.6, 1.7, 4.2), v3(ivX - 0.6, 1.6, ivZ), 52],
            CU(vs('jumped') - 0.05, ivy, { ang: -0.45, d: 3.6, fov: 46, keep: [eli] }),
            CU(vs('two') - 0.05, ivy, { ang: 0.25 }),
            CU(99, eli, { ang: 0.5 })]); }
        else { act(ivy, speaking(ivy) ? 'surprise' : 'smile', speaking(ivy) ? G.point() : {});
          C = cuts(t, [
            CU(vs('does') - 0.05, ivy, { ang: 0.25 }),
            CU(99, eli, { ang: 0.5 })]); }
      }
      break; }
    case 9: { mood = 'day'; fx = 0; fz = -18;
      const tA = vs('books') - 0.05, tB = vs('busstop') - 0.05;
      if (t < tA) { // Ivy watching from behind a tree in the school yard
        put(ivy, -3.6, -16.4, faceTo(-3.6, -16.4, 0, -22), { bat: 62 }); act(ivy, 'worried', { headZ: 0.2, bodyZ: 0.12 });
        const ez = rampV(t, sc.start, tA, -20, -23.5); put(eli, 0.4, ez, Math.PI * 0.85, { bat: 3 }); act(eli, 'smile', walkPose(t * 6, 0.45));
        C = cuts(t, [[tA, v3(-4.4, 2.3, -13.0), v3(-4.3, 2.2, -13.5), v3(-1.2, 1.5, -21.8), null, 50]]);
      } else if (t < tB) { // book kid
        const k = clamp((t - tA) / (tB - tA));
        put(bookKid, 1.5, -22, faceTo(1.5, -22, 0.6, -22.6), { bat: rampV(t, tA + 2.0, tA + 2.6, 40, 60) });
        put(eli, 0.6, -22.6, faceTo(0.6, -22.6, 1.5, -22), { bat: t > tA + 2.6 ? 2 : 3, kneel: k < 0.55 });
        act(bookKid, k < 0.5 ? 'worried' : 'happy', k < 0.5 ? G.handsHead() : G.wave(t)); act(eli, 'smile', k < 0.55 ? G.give() : G.give());
        books.visible = true; books.children.forEach((b, i) => { const held = k > 0.35; b.position.set(held ? 1.25 : 0.9 + i * 0.3, held ? 1.35 + i * 0.075 : 0.05, held ? -22.2 : -22.3 + i * 0.25); b.rotation.y = held ? 0 : i * 0.7; });
        popup(bookKid, '+20%', '#5dff8f', tA + 2.0); popup(eli, '-1%', '#ff6a5a', tA + 2.6);
        C = cuts(t, [[tA + 1.6, v3(-1.8, 2.4, -17.6), v3(-1.6, 2.3, -17.9), v3(1.05, 1.0, -22.3), null, 46], [tB, v3(-0.6, 2.2, -19.2), v3(-0.4, 2.3, -19.5), v3(1.0, 2.0, -22.3), null, 52]]);
      } else { // little girl at the bus stop
        const k = clamp((t - tB) / (sc.end - tB));
        put(girl, 5.9, -12.3, -Math.PI / 2, { sit: true, seat: 0.66, bat: rampV(t, tB + 2.2, tB + 2.9, 12, 55) });
        put(eli, 4.3, -13.4, faceTo(4.3, -13.4, 5.9, -12.3), { bat: t > tB + 2.9 ? 2 : 3 });
        const laughing = t > tB + 2.0; act(girl, laughing ? 'laugh' : 'cry', laughing ? G.laughBend(t) : G.sad()); setTears(girl, !laughing, t);
        act(eli, t > tB + 0.9 ? 'laugh' : 'worried', t > tB + 0.9 ? { ...G.handsHead(), headZ: Math.sin(t * 8) * 0.25 } : {});
        popup(girl, '+43%', '#5dff8f', tB + 2.2); popup(eli, '-1%', '#ff6a5a', tB + 2.9);
        C = cuts(t, [[tB + 1.9, v3(2.4, 1.7, -11.0), v3(2.6, 1.65, -11.2), v3(5.4, 1.2, -12.6), null, 50], [99, v3(4.9, 2.0, -8.4), v3(4.9, 1.9, -8.9), v3(5.0, 1.5, -12.6), null, 54]]);
      }
      break; }
    case 10: { const tB = vs('shift') - 0.05;
      if (t < tB) { mood = 'golden'; fx = 0; fz = 4;
        const k = clamp((t - sc.start) / (tB - sc.start)); put(eli, lerp(-1.0, -5.2, k), lerp(8.0, 4.0, k), faceTo(-1, 8, -5.2, 4), { bat: 3 }); act(eli, 'smile', walkPose(t * 6, 0.45));
        put(ivy, 2.2, 12.5, faceTo(2.2, 12.5, -4, 4.5), { bat: 62 }); act(ivy, 'worried', { headZ: -0.15 });
        C = cuts(t, [[tB, v3(4.4, 2.6, 16.4), v3(4.1, 2.5, 15.8), v3(-3.0, 1.5, 5.0), null, 50]]);
      } else { mood = 'intGold'; fx = HM; fz = 0; side = -1;
        const hugT = vs('hugged'); const hk = clamp((t - hugT) / 0.6);
        const mx = HM + 2.6, mz = 1.4;
        const ek = clamp((t - (vs('welcome') - 0.2)) / 1.3);
        const ex = lerp(HM - 1.6, mx - 1.0, ease(ek)), ez = lerp(-0.8, mz - 0.1, ease(ek));
        put(mom, mx, mz, hk > 0 ? faceTo(mx, mz, ex, ez) : faceTo(mx, mz, ex, ez + 2.4), { bat: rampV(t, hugT + 0.5, hugT + 2.2, 4, 55) });
        put(eli, ex, ez, hk > 0 || ek < 0.95 ? faceTo(ex, ez, mx, mz) : faceTo(ex, ez, mx, mz + 2.4), { bat: t > hugT + 1.8 ? 1 : 3 });
        act(mom, hk > 0 ? 'warm' : 'sad', hk > 0 ? G.hug(hk) : { ...G.sad(), bodyX: 0.18 }); act(eli, hk > 0 ? 'warm' : 'smile', ek < 1 && ek > 0 ? walkPose(t * 7, 0.5) : G.hug(hk));
        if (hk > 0.5) stream(chest(eli, 1.45), chest(mom, 1.5), clamp((t - hugT - 0.4) / 0.6) * (t < hugT + 2.4 ? 1 : 0), 0.4);
        popup(mom, '+51%', '#5dff8f', hugT + 1.4); popup(eli, '-2%', '#ff6a5a', hugT + 1.8);
        C = cuts(t, [
          CU(vs('welcome') - 0.05, mom, { ang: 0.35, d: 3.9, up: -0.1, ly: -0.15, fov: 44 }),
          [hugT - 0.05, v3(HM + 1.5, 2.6, 5.8), v3(HM + 1.7, 2.55, 5.5), v3(HM + 1.9, 1.9, 0.8), null, 56],
          [99, v3(mx - 0.4, 2.6, mz + 4.4), v3(mx - 0.4, 2.5, mz + 4.0), v3(mx - 0.5, 2.3, mz), null, 52]]);
      }
      break; }
    case 11: { mood = 'intNight'; fx = BR; fz = 0; side = -1; bloomS = 0.42;
      blanket.visible = true;
      const ex = BR + 0.8, ez = 0.15;
      put(eli, ex, ez, 0, { lie: true, y: 0.83, bat: 1, blink: (t % 1.0) < 0.55 ? 1 : 0.25 });
      act(eli, t > vs('never') + 1.2 ? 'sad' : 'worried', { headY: 0.0 });
      eli.userData.batPos = v3(ex + 0.55, 1.95, -2.35);
      C = cuts(t, [
        [vs('never') - 0.05, v3(BR + 0.2, 2.5, 0.7), v3(BR + 0.25, 2.4, 0.5), v3(ex, 1.15, -1.9), null, 52],
        [vs('never') + 1.6, v3(ex, 2.75, -0.5), v3(ex, 2.6, -0.65), v3(ex, 1.15, -1.95), null, 48],
        [99, v3(ex + 2.0, 2.1, -0.6), v3(ex + 1.8, 2.05, -0.8), v3(ex + 0.55, 1.95, -2.35), null, 40]]); break; }
    case 12: case 13: case 14: case 15: case 16: {
      const flash = sc.id === 14 && t > vs('remember') - 0.05 && t < vs('giveback') - 0.1;
      if (flash) { mood = 'snow'; fx = 1; fz = 10;
        const k = clamp((t - vs('remember')) / 2.8);
        put(brock, 1.0, 10, Math.PI / 2, { lie: k < 0.45, lieK: k < 0.45 ? 1 : 0, bat: 18 });
        if (k >= 0.45) { put(brock, 1.0 + 0.9, 10, faceTo(1.9, 10, 0.4, 10.4), { bat: 18 + (k - 0.45) * 40 }); }
        act(brock, k < 0.45 ? 'cry' : 'surprise', k < 0.45 ? {} : { armRx: -1.0 }); if (k < 0.45) setTears(brock, true, t);
        put(eli, 0.4, 10.6, faceTo(0.4, 10.6, 1.6, 10), { bat: 3 }); act(eli, 'smile', G.give());
        snow.children.forEach(s => { const u = s.userData; let y = (u.y - t * u.sp) % 7; if (y < 0) y += 7; s.position.set(1 + u.x + Math.sin(t + u.z) * 0.2, y, 10 + u.z); });
        C = cuts(t, [[99, v3(4.6, 2.7, 14.8), v3(4.3, 2.5, 14.3), v3(1.0, 1.0, 10.2), null, 50]]);
        break;
      }
      mood = 'int'; fx = CL; fz = 0; side = -1;
      const fx0 = CL, footZ = -1.9; // Eli lies at the front of the class, head toward the board
      const fallT = vs('eli') - 0.35;
      // kids: in seats (12-13), standing up shocked (12 end), gathering (14-16)
      const gather = sc.id >= 14;
      const RING = [[-1.05, -3.0, 'k'], [1.05, -3.0, 'k'], [-1.1, -2.2, 'k'], [1.1, -2.3, 'k'], [-1.9, -3.8, 's'], [1.9, -3.7, 's'], [-2.0, -2.2, 's'], [1.8, -1.9, 's']];
      if (!gather) { CLASS_SEATS.forEach(([c, r], i) => { const s = SEAT(c, r); const k = crowd[i]; const stood = sc.id === 13 || (sc.id === 12 && t > fallT + 0.3);
          put(k, s.x, s.z, Math.PI, { sit: !stood, bat: 82 + (i * 7) % 18 }); act(k, sc.id === 13 ? (t > vs('gave') ? 'sad' : 'worried') : stood ? 'surprise' : 'smile', stood ? (sc.id === 13 ? G.sad() : G.handsHead()) : {}); });
        const ivs = SEAT(0, 1); put(ivy, ivs.x, ivs.z, Math.PI * 0.85, { sit: sc.id === 12 && t < fallT + 0.3, bat: 66 });
        act(ivy, sc.id === 13 ? (t > vs('gave') ? 'cry' : 'angry') : t > fallT ? 'surprise' : 'smile', sc.id === 13 ? G.explain(t) : {}); if (sc.id === 13 && t > vs('gave')) setTears(ivy, true, t);
        const bs = SEAT(2, 2); put(brock, bs.x, bs.z, Math.PI, { sit: sc.id === 12 && t < fallT + 0.3, bat: 100 }); act(brock, sc.id === 13 ? 'sad' : t > fallT ? 'surprise' : 'smile', sc.id === 13 ? G.sad() : {});
      } else { RING.forEach(([dx, dz, kind], i) => { const k = crowd[i]; const x = fx0 + dx, z = dz;
          put(k, x, z, faceTo(x, z, fx0, -3.0), { kneel: kind === 'k', bat: sc.id >= 15 ? rampV(t, vs('onebyone') + i * 0.3, vs('flowed') + 1.2, 92, 74) : 92 });
          act(k, sc.id === 16 ? 'happy' : 'sad', sc.id === 15 && t > vs('onebyone') + i * 0.3 ? G.handShoulder() : sc.id === 16 && t > vs('feels') ? G.cheer(t + i) : G.sad());
          if (sc.id === 15 && t > vs('onebyone') + i * 0.3) stream(chest(k, kind === 'k' ? 1.0 : 1.4), v3(fx0, 0.6, -3.0), clamp((t - vs('onebyone') - i * 0.3) / 0.6), 0.5); });
        put(ivy, fx0 - 0.9, -3.8, faceTo(fx0 - 0.9, -3.8, fx0, -3.2), { kneel: true, bat: sc.id >= 15 ? rampV(t, vs('onebyone'), vs('flowed') + 1, 66, 52) : 66 });
        act(ivy, sc.id === 16 ? 'happy' : 'cry', sc.id === 15 ? G.handShoulder() : {}); if (sc.id === 14) setTears(ivy, true, t);
        if (sc.id === 15) stream(chest(ivy, 1.0), v3(fx0, 0.6, -3.2), clamp((t - vs('onebyone')) / 0.5), 0.4);
      }
      put(hale, CL + 1.6, gather ? -4.4 : -3.6, gather ? faceTo(CL + 1.6, -4.4, CL, -3) : (sc.id === 12 && t < vs('zero') ? -0.6 : faceTo(CL + 1.6, -3.6, CL, -2.6)), { bat: 70 });
      act(hale, t > fallT ? (sc.id === 16 ? 'happy' : 'surprise') : 'smile', t > fallT && sc.id === 12 ? G.handsHead() : {});
      // Eli
      let eliBat = sc.id === 12 ? (t < vs('zero') + 0.5 ? 1 : 0) : sc.id <= 14 ? 0 : sc.id === 15 ? rampV(t, vs('onebyone') + 0.8, sc.end, 0, 40) : rampV(t, vs('hundred') - 0.3, vs('hundred') + 1.4, 40, 100);
      const dead = eliBat < 0.5;
      if (sc.id === 12 && t < fallT) { put(eli, fx0, footZ, 0, { bat: eliBat, dead, blink: (t % 0.6) < 0.35 ? 1 : 0.3 }); act(eli, t > vs('zero') ? 'worried' : 'smile', t < vs('zero') ? { armRz: 2.4, armRx: -0.2, headZ: 0.1 } : { bodyZ: Math.sin(t * 6) * 0.08, headX: 0.15 }); }
      else if (sc.id === 12) { const k = easeOut((t - fallT) / 0.45); put(eli, fx0, footZ, 0, { lie: true, lieK: k, bat: 0, dead: true }); act(eli, 'blink', {}); eli.userData.lying = true; }
      else if (sc.id === 16 && t > vs('feels') - 0.4) { put(eli, fx0, -2.9, 0, { bat: 100 }); act(eli, 'cry', G.cheer(t)); setTears(eli, true, t); setBlush(eli, true); }
      else { put(eli, fx0, footZ, 0, { lie: true, bat: eliBat, dead }); act(eli, sc.id === 16 && t > vs('opened') + 0.3 ? 'surprise' : 'blink', {}); }
      if (eli.userData.lying) eli.userData.batPos = v3(fx0, 1.6, -3.0);
      if (sc.id >= 15) batOnly = [eli, brock, ivy];
      // shots
      if (sc.id === 12) C = cuts(t, [
        [vs('zero') - 0.05, v3(CL + 0.4, 2.1, 1.2), v3(CL + 0.3, 2.0, 0.6), v3(CL, 1.8, -2.4), null, 50],
        [fallT, v3(CL + 0.3, 2.6, -0.2), v3(CL + 0.25, 2.65, -0.45), v3(CL, 2.7, footZ), null, 42],
        [99, v3(CL - 1.8, 3.8, -4.6), v3(CL - 1.7, 3.6, -4.5), v3(CL, 0.4, -2.5), null, 58]]);
      else if (sc.id === 13) { const ivs = SEAT(0, 1); C = cuts(t, [
        CU(vs('laughed2') + 1.6, ivy, { ang: 0.2 }),
        [vs('gave') - 0.05, v3(CL - 3.8, 3.2, -4.3), v3(CL - 3.5, 3.0, -4.0), v3(CL + 1.5, 1.6, 2.2), null, 60],
        CU(99, ivy, { ang: -0.1, d: 2.8 })]); }
      else if (sc.id === 14) { put(brock, fx0 + 2.3, -0.9, faceTo(fx0 + 2.3, -0.9, fx0 + 1.4, 0.8), { bat: 100 }); act(brock, t > vs('giveback') ? 'angry' : 'worried', t > vs('giveback') ? G.point() : { headX: -0.45 });
        C = cuts(t, [
          CU(vs('remember') - 0.05, brock, { d: 3.0, up: -0.9, ly: 0.35, fov: 46 }),
          CU(99, brock, { ang: 0.1 })]); }
      else if (sc.id === 15) { put(brock, fx0 + 0.9, -3.8, faceTo(fx0 + 0.9, -3.8, fx0, -3.2), { kneel: true, bat: rampV(t, vs('onebyone') + 0.4, vs('flowed') + 1, 100, 80) }); act(brock, 'sad', t > vs('onebyone') + 0.4 ? G.handShoulder() : {});
        if (t > vs('onebyone') + 0.4) stream(chest(brock, 1.0), v3(fx0, 0.6, -3.3), clamp((t - vs('onebyone') - 0.4) / 0.5), 0.4);
        C = cuts(t, [
          [vs('onebyone') + 1.6, v3(fx0 + 1.2, 5.6, 1.2), v3(fx0 + 1.0, 5.3, 0.9), v3(fx0, 0.4, -3.2), null, 56],
          [vs('flowed') - 0.05, v3(fx0 - 0.4, 1.9, -1.9), v3(fx0 - 0.3, 1.85, -2.1), v3(fx0 + 0.9, 1.45, -3.8), null, 46, [brock]],
          [99, v3(fx0 - 0.3, 5.2, 0.4), v3(fx0 - 0.2, 5.6, 0.8), v3(fx0, 0.4, -3.0), null, 52]]); }
      else { put(brock, fx0 + 0.9, -3.8, faceTo(fx0 + 0.9, -3.8, fx0, -3.2), { kneel: t < vs('feels') - 0.4, bat: 80 }); act(brock, 'happy', t > vs('feels') - 0.4 ? G.cheer(t) : {});
        if (t > vs('feels') - 0.4) { ivy.userData.kneel = false; put(ivy, fx0 - 1.0, -3.4, faceTo(fx0 - 1, -3.4, fx0, -2.9), { bat: 52 }); act(ivy, 'cry', G.hug(0.5)); setTears(ivy, true, t); }
        bloomS = t > vs('hundred') ? 0.5 : 0.32;
        C = cuts(t, [
          [vs('first') - 0.05, v3(fx0 + 0.15, 1.75, -3.55), v3(fx0 + 0.12, 1.6, -3.65), v3(fx0, 0.35, -4.0), null, 44],
          [vs('feels') - 0.4, v3(fx0, 3.4, -1.0), v3(fx0, 3.2, -1.3), v3(fx0, 1.25, -3.3), null, 48],
          CU(99, eli, { ang: 0.1, d: 3.4 })]); }
      break; }
    case 17: case 18: { mood = 'golden'; fx = 0; fz = -26; bloomS = 0.45;
      const G0 = [[0, -26.2, eli, 100], [-0.95, -26.0, ivy, 88], [0.95, -26.0, brock, 90]];
      G0.forEach(([x, z, a, b]) => put(a, x, z, 0, { bat: b }));
      act(eli, 'laugh', { armLz: -0.9, armRz: 0.9, armLx: -0.4, armRx: -0.4 }); act(ivy, 'happy', { armRz: 0.6 }); act(brock, 'laugh', { armLz: -0.6 }); setBlush(eli, true);
      for (let i = 0; i < 8; i++) { const k = crowd[i]; const a = (i / 7 - 0.5) * 2.6; put(k, Math.sin(a) * 2.4, -27.4 + Math.cos(a) * 0.3 - (i % 2) * 0.6, 0, { bat: 80 + (i * 3) % 18 }); act(k, ['happy', 'laugh', 'smile'][i % 3], i % 2 ? G.cheer(t + i) : G.wave(t + i)); }
      if (sc.id === 17) C = cuts(t, [
        [vs('shared') - 0.05, v3(0.4, 2.0, -19.5), v3(0.3, 1.9, -20.4), v3(0, 1.8, -26.5), null, 54],
        CU(99, eli, { ang: -0.2, d: 3.6, fov: 44 })]);
      else { C = cuts(t, [[99, v3(0, 2.4, -18.5), v3(0, 7.5, -12), v3(0, 2.2, -27), v3(0, 6.5, -40), 56]]);
        if (lt > 0.3) { big = 'Who would you<br>give <span style="color:#7dffa8">your energy</span><br>to?'; bop = clamp((lt - 0.3) / 0.35); } tint = 0.06; }
      break; }
  }
  setMood(mood, fx, fz, side);
  // batteries
  const only = C.solo || batOnly; ALL.forEach(a => { const b = a.userData.bat; b.visible = a.visible && a.userData.showBat !== false && (!only || only.includes(a)); if (!b.visible) return;
    if (a.userData.lying && a.userData.batPos) b.position.copy(a.userData.batPos);
    else b.position.set(a.position.x, a.position.y + 3.35 * a.scale.y + (a.userData.sit ? 0.0 : 0), a.position.z);
    b.scale.set(1.15 * a.scale.x / 0.85 * 0.85, 0.54 * a.scale.x / 0.85 * 0.85, 1);
    b.userData.set(a.userData.level, a.userData.dead, a.userData.blink ?? 1); a.userData.batPos = null; });
  popQ.forEach(q => popupDraw(...q));
  // window flags + clouds drift
  clouds.position.x = (t * 0.25) % 20; school.userData.flag.rotation.y = Math.sin(t * 3) * 0.15;
  if (camera.fov !== C.fov) { camera.fov = C.fov; camera.updateProjectionMatrix(); }
  camera.position.copy(C.cam); camera.lookAt(C.look);
  if (bokeh) { bokeh.uniforms.focus.value = C.cam.distanceTo(C.look); }
  bloom.strength = bloomS;
  composer.render();
  // overlays
  $('tint').style.opacity = tint;
  let hook = '', hop = 0;
  if (sc.id === 1) { hook = '<span class="series">WHAT IF YOUR ENERGY<br>WAS <span style="color:#7dffa8">VISIBLE?</span></span>'; hop = clamp(lt / 0.25) * clamp((sc.end - t) / 0.3); }
  setText('hook', hook, hop);
  const cap = (sc.id === 1 || (sc.id === 18 && lt > 0.3)) ? null : TL.captions.find(c => t >= c.start && t < c.end + 0.05);
  const ce = $('cap');
  if (cap) { const k = clamp((t - cap.start) / 0.09); ce.style.transform = `scale(${1.18 - 0.18 * easeOut(k)})`; ce.style.color = SPK_COLOR[cap.spk];
    const txt = cap.text.replace(/(\d+%?|percent|zero|hundred)/gi, '<span style="color:#ffd94a">$1</span>'); setText('cap', txt, 1); }
  else setText('cap', '', 0);
  setText('big', big, bop);
  return true;
};
window.DURATION = TL.duration; window.READY = true;
