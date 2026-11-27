import * as THREE from 'three';
import {
  makeAvatar, setFace, setTears, setBlush, pose, idle, blinkFace, walkPose, place, v3 as av3,
} from './avatars_round.js';
import {
  rng, clamp, lerp, ease, easeOut, v3, lerpV, faceTo, canvasTex, mat,
  setupRenderer, setupComposer, makeSky, sunGlowSprite, cloudField,
  ground, water, contactShadow, treeRound, treePine, building, pier, lighthouse, boat, rainField,
} from './world_kit.js';

const TL = await (await fetch('./timeline.json')).json();
const W = 1080, H = 1920, VO = TL.vo;
const vs = k => VO[k].start, ve = k => VO[k].start + VO[k].dur;

const renderer = setupRenderer(W, H);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 400); scene.add(camera);
const { composer, bloom, vignette } = setupComposer(renderer, scene, camera, W, H);

const fill = new THREE.PointLight(0xfff0e0, 1.1, 12, 1.5); camera.add(fill); fill.position.set(0.3, 0.4, 0);
const hemi = new THREE.HemisphereLight(0xbcd8ff, 0x3a3a30, 1.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3dc, 2.2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 40, bottom: -40, near: 1, far: 160 }); sun.shadow.bias = -0.0004;
scene.add(sun, sun.target);
const moonFill = new THREE.DirectionalLight(0x8fb0ff, 0.0); scene.add(moonFill);

// ---------- sky ----------
const sky = makeSky(0x8fd0ff, 0xdff0ff); scene.add(sky);
const sunSprite = sunGlowSprite(0xfff2c8, 26); sunSprite.position.set(-30, 16, -40); scene.add(sunSprite);
const cloudsFair = cloudField(10, 90, 22, 3); scene.add(cloudsFair);
const cloudsStorm = cloudField(14, 70, 18, 9); cloudsStorm.children.forEach(s => s.material = s.material.clone());
cloudsStorm.children.forEach(s => { s.material.color.setHex(0x2a2f3a); s.material.opacity = 0.95; }); cloudsStorm.visible = false; scene.add(cloudsStorm);

// ---------- ground + sea ----------
const grassGround = ground(220, 140, 'grass', 0x3f6a3a, 0x2a4e28, 18); grassGround.position.set(0, 0, 40); scene.add(grassGround);
const sandGround = ground(60, 30, 'sand', 0xe8d4a0, 0xd0b878, 10); sandGround.position.set(0, -0.02, 10); scene.add(sandGround);
const sea = water(260, 220, 0x0d4760, 0x2aa0c8); sea.position.set(0, 0, -70); scene.add(sea);
const seaFloorRocks = new THREE.Group(); scene.add(seaFloorRocks);

// ---------- street + village houses ----------
const streetTex = canvasTex(256, 64, (c) => { c.fillStyle = '#8a8178'; c.fillRect(0, 0, 256, 64); c.strokeStyle = 'rgba(0,0,0,0.15)'; for (let i = 0; i < 10; i++) { c.beginPath(); c.moveTo(i * 26, 0); c.lineTo(i * 26 + 10, 64); c.stroke(); } });
streetTex.wrapS = THREE.RepeatWrapping; streetTex.repeat.set(10, 1);
const street = new THREE.Mesh(new THREE.PlaneGeometry(6, 70), mat(0xffffff, { map: streetTex, roughness: 0.95 })); street.rotation.x = -Math.PI / 2; street.position.set(0, 0.015, 12); street.receiveShadow = true; scene.add(street);

const HOUSES = [
  { x: -8.5, z: 5, w: 5.5, h: 3.6, d: 5, wallColor: 0xd8c2a0, roofColor: 0x7a3a2a, doorSide: 1, windowRows: 2, windowCols: 2, chimney: true, seed: 1 },
  { x: -8, z: 14, w: 5, h: 3.4, d: 4.6, wallColor: 0xc8d8dc, roofColor: 0x3a4a52, doorSide: -1, windowRows: 1, windowCols: 2, seed: 2 },
  { x: -7.5, z: 22, w: 6, h: 4.0, d: 5.4, wallColor: 0xe0dcc8, roofColor: 0x6a4a38, doorSide: 1, windowRows: 2, windowCols: 2, chimney: true, seed: 3 },
  { x: 8.5, z: 6, w: 5.2, h: 3.5, d: 5, wallColor: 0xe8cdb0, roofColor: 0x8a3a3a, doorSide: -1, windowRows: 2, windowCols: 2, seed: 4 },
  { x: 8, z: 15, w: 4.8, h: 3.3, d: 4.4, wallColor: 0xcfe0e4, roofColor: 0x4a5a60, doorSide: 1, roofKind: 'gable', windowRows: 1, windowCols: 2, seed: 5 },
  { x: 8.6, z: 24, w: 5.6, h: 3.8, d: 5.2, wallColor: 0xd2c6a8, roofColor: 0x5a3a28, doorSide: -1, windowRows: 2, windowCols: 2, chimney: true, seed: 6 },
];
const houseGroups = HOUSES.map(opt => { const g = building(opt); g.position.set(opt.x, 0, opt.z); g.rotation.y = opt.x < 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(g); return g; });
const allWinMats = houseGroups.flatMap(g => g.userData.windowMats);

// trees
const treeGroup = new THREE.Group(); scene.add(treeGroup);
{ const r = rng(21); for (let i = 0; i < 18; i++) { const side = r() > 0.5 ? 1 : -1; const x = side * (11 + r() * 8); const z = r() * 36 - 2; const t = r() > 0.4 ? treeRound(i * 7 + 1, 0.9 + r() * 0.5) : treePine(i * 7 + 2, 0.9 + r() * 0.5); t.position.set(x, 0, z); treeGroup.add(t); } }

// ---------- pier + lighthouse + boats ----------
const PIER_LEN = 22, PIER_Z0 = -1, PIER_ZEND = PIER_Z0 - PIER_LEN;
const pierMesh = pier(PIER_LEN, 2.4, 2.6); pierMesh.position.set(0, 0, (PIER_Z0 + PIER_ZEND) / 2); scene.add(pierMesh);
const rock = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 7, 2.2, 10), mat(0x6a655c, { roughness: 1, flatShading: true })); rock.position.set(0, 0.0, PIER_ZEND - 2); rock.receiveShadow = true; rock.castShadow = true; scene.add(rock);
const lh = lighthouse(12, 1.3, 0.8); lh.position.set(0, 1.0, PIER_ZEND - 2); scene.add(lh);
const lhDoor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.1), mat(0x3a2a1a)); lhDoor.position.set(0, 1.0 + 0.85, PIER_ZEND - 2 + 0.85); scene.add(lhDoor);
const doorLamp = new THREE.PointLight(0xffd9a0, 6, 11, 1.4); doorLamp.position.set(0.8, 2.6, PIER_ZEND - 2 + 1.0); scene.add(doorLamp);
// climb-glow windows up the shaft
const climbWins = []; for (let i = 0; i < 6; i++) { const yy = 1.0 + 1.2 + i * 1.55; const m = mat(0x332218, { emissive: 0xffcf8a, emissiveIntensity: 0 }); const win = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12), m); win.position.set(0.95, yy, PIER_ZEND - 2); win.rotation.y = Math.PI / 2; scene.add(win); climbWins.push(m); }

const dadBoat = boat(0x5a3a28); dadBoat.position.set(1.6, 0, -7); dadBoat.rotation.y = 0.15; scene.add(dadBoat);
const strayBoat = boat(0x4a4a46); strayBoat.position.set(0, -0.5, -60); strayBoat.visible = false; scene.add(strayBoat);
const dockedBoats = [boat(0x6a4a30), boat(0x3a5a4a)]; dockedBoats[0].position.set(-1.6, 0, -4); dockedBoats[0].rotation.y = -0.2; dockedBoats[1].position.set(1.7, 0, -11); dockedBoats[1].rotation.y = 0.3; dockedBoats.forEach(b => scene.add(b));

// rain
const rain = rainField(900, 55, 16, 77); scene.add(rain);
const stormLamp = new THREE.PointLight(0xdfe8ff, 0, 22, 1.3); scene.add(stormLamp);

// ---------- characters ----------
const nora = makeAvatar({ seed: 501, skin: 0xffe0bd, hair: 0x7a3a28, hairStyle: 'long', top: 0xe8a93a, legs: 0x3a5a7a, acc: 'none' });
const noraCoat = mat(0xffcc33, { roughness: 0.6 }); // worn as raincoat swap during storm
const dad = makeAvatar({ seed: 502, skin: 0xd9a06a, hair: 0x3a2a1a, hairStyle: 'short', top: 0x3a5a7a, legs: 0x2a3a42, acc: 'none' });
const granny = makeAvatar({ seed: 503, skin: 0xe8c49a, hair: 0xd8d4cc, hairStyle: 'bun', top: 0x8a5a7a, legs: 0x4a3a4a, acc: 'none' });
const stranger = makeAvatar({ seed: 504, skin: 0xc9ab85, hair: 0xd8d4cc, hairStyle: 'short', top: 0x6a6258, legs: 0x3a3a38, acc: 'none' });
scene.add(nora, dad, granny, stranger);
const ALL = [nora, dad, granny, stranger];
// simple beard add-ons
function addBeard(av, color = 0xd8d4cc) { const m = mat(color, { roughness: 0.95 }); const beard = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10, 0, 7, 1.4, 1.6), m); beard.scale.set(1, 1.1, 0.7); beard.position.set(0, -0.16, 0.3); av.userData.P.head.add(beard); }
addBeard(dad, 0x2a1f16); addBeard(stranger, 0xcfcac0);
// sailor caps
function addCap(av, color) { const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 16), mat(0x1a2a3a)); brim.position.y = 0.18; av.userData.P.head.add(brim); const top = new THREE.Mesh(new THREE.SphereGeometry(0.47, 16, 12, 0, 7, 0, 1.3), mat(color)); top.position.y = 0.1; av.userData.P.head.add(top); }
addCap(dad, 0x1a2a3a); addCap(stranger, 0x2a2a28);
const noraShadow = contactShadow(1.0); nora.add(noraShadow);
const dadShadow = contactShadow(1.0); dad.add(dadShadow);
const grannyShadow = contactShadow(1.0); granny.add(grannyShadow);
const strangerShadow = contactShadow(1.0); stranger.add(strangerShadow);

// ---------- moods ----------
function setMood(name, fx = 0, fz = 0) {
  if (name === 'day') { sky.userData.setColors(0x8fd0ff, 0xe8f6ff); hemi.color.setHex(0xbcd8ff); hemi.groundColor.setHex(0x3a3a30); hemi.intensity = 1.1; sun.color.setHex(0xfff3dc); sun.intensity = 2.3; moonFill.intensity = 0; cloudsFair.visible = true; cloudsStorm.visible = false; scene.fog = new THREE.FogExp2(0xbfe0f0, 0.006); scene.background = null; }
  else if (name === 'dusk') { sky.userData.setColors(0xff9a5a, 0x5a3a5a); hemi.color.setHex(0xffb080); hemi.groundColor.setHex(0x2a2238); hemi.intensity = 0.9; sun.color.setHex(0xff9a5a); sun.intensity = 1.8; moonFill.intensity = 0.15; cloudsFair.visible = true; cloudsStorm.visible = false; scene.fog = new THREE.FogExp2(0x5a3a4a, 0.009); }
  else if (name === 'night') { sky.userData.setColors(0x121c3a, 0x24355e); hemi.color.setHex(0x6a7ab0); hemi.groundColor.setHex(0x12121e); hemi.intensity = 0.95; sun.intensity = 0.08; sun.color.setHex(0x8fa0d0); moonFill.intensity = 0.85; cloudsFair.visible = false; cloudsStorm.visible = false; scene.fog = new THREE.FogExp2(0x16204a, 0.009); }
  else if (name === 'storm') { sky.userData.setColors(0x323a4a, 0x1e222c); hemi.color.setHex(0x5a6a80); hemi.groundColor.setHex(0x12121a); hemi.intensity = 1.15; sun.intensity = 0.4; sun.color.setHex(0xaab4c4); moonFill.intensity = 0.8; cloudsFair.visible = false; cloudsStorm.visible = true; scene.fog = new THREE.FogExp2(0x242a36, 0.016); }
  sunSprite.visible = (name === 'day' || name === 'dusk');
  sunSprite.position.set(fx - 30, name === 'dusk' ? 9 : 17, fz - 45);
  sun.position.set(fx + (name === 'dusk' ? -28 : 10), name === 'dusk' ? 10 : 18, fz + (name === 'dusk' ? -8 : 10));
  sun.target.position.set(fx, 1, fz);
}

// ---------- DOM ----------
const $ = id => document.getElementById(id);
function setText(id, html, op = 1) { const e = $(id); if (e.innerHTML !== html) e.innerHTML = html; e.style.opacity = op; }
const SPK_COLOR = { N: '#ffffff', D: '#9ec8ff', M: '#ffd0a0' };
const S = Object.fromEntries(TL.scenes.map(s => [s.id, s]));
const hideAll = () => ALL.forEach(a => { a.visible = false; pose(a); });

window.renderAt = function (t) {
  hideAll();
  const sc = TL.scenes.find(s => t >= s.start && t < s.end) || TL.scenes[TL.scenes.length - 1];
  const lt = t - sc.start, dur = sc.end - sc.start, u = clamp(lt / dur);
  let cam = v3(0, 6, 20), look = v3(0, 3, -10), fov = 48, mood = 'day', fx = 0, fz = -10;
  let big = '', sub = '', bop = 0, tint = 0, flashOp = 0, rainOn = 0, beamSpeed = 0, beamOn = 0, climb = -1, bloomStrength = 0.42;
  dockedBoats.forEach(b => b.visible = true); dadBoat.visible = false; strayBoat.visible = false;
  idle(nora, t); idle(dad, t); idle(granny, t); idle(stranger, t);

  switch (sc.id) {
    case 1: { mood = 'night'; fx = 0; fz = -24; beamOn = 1; beamSpeed = 0.35; climb = 1;
      cam = lerpV(v3(20, 9, 10), v3(16, 7.5, 2), ease(u)); look = v3(0, 7, -24); break; }
    case 2: { mood = 'day'; fx = 0; fz = -5; dadBoat.visible = true;
      place(nora, 2.8, -1.5, faceTo(2.8, -1.5, 1.6, -7)); nora.visible = true; blinkFace(nora, t, 'sad');
      place(dad, 1.6, -5.5, faceTo(1.6, -5.5, 2.8, -1.5)); dad.visible = true; setFace(dad, t > vs('back') ? 'smile' : 'warm');
      pose(dad, { armRx: -1.0 * clamp((t - vs('back')) / 1) });
      cam = lerpV(v3(5.2, 2.4, -2.2), v3(4.6, 2.2, -3.2), ease(u)); look = v3(1.8, 1.4, -6); fov = 52; break; }
    case 3: { mood = 'storm'; fx = 0; fz = -24; rainOn = 1; beamOn = 1; beamSpeed = 0.5;
      flashOp = (Math.sin(t * 2.3) > 0.93) ? 0.55 : 0;
      cam = lerpV(v3(14, 7, 6), v3(10, 6, 2), ease(u)); look = v3(0, 6, -24); break; }
    case 4: { mood = 'night'; fx = 0; fz = -24; climb = clamp(lt / dur); beamOn = 0.3;
      const enter = clamp(lt / 1.4);
      if (enter < 1) { place(nora, 1.0, -21.0 + enter * 0.6, Math.PI); nora.visible = true; setFace(nora, 'worried'); pose(nora, walkPose(t * 7, 0.5)); }
      cam = enter < 1 ? lerpV(v3(5.5, 2.0, -18), v3(4.0, 1.9, -19.5), ease(enter)) : lerpV(v3(5.5, 3.6, -18), v3(4.2, 9.8, -22), ease((lt - 1.4) / (dur - 1.4)));
      look = enter < 1 ? v3(0.6, 1.4, -24) : lerpV(v3(0, 4.0, -24), v3(0, 11.4, -25), ease((lt - 1.4) / (dur - 1.4))); fov = 50; break; }
    case 5: { mood = 'dusk'; fx = -8; fz = 14;
      place(granny, -2.1, 12.9, faceTo(-2.1, 12.9, -0.9, 13.3)); granny.visible = true; blinkFace(granny, t, 'worried');
      place(nora, -0.9, 13.3, faceTo(-0.9, 13.3, -2.1, 12.9)); nora.visible = true; setFace(nora, t > vs('notyet') ? 'sad' : 'worried'); pose(nora, { headX: t > vs('notyet') ? -0.15 : 0 });
      cam = lerpV(v3(-1.5, 2.0, 17.0), v3(-1.2, 1.95, 16.4), ease(u)); look = v3(-1.5, 1.65, 13.1); fov = 62; break; }
    case 6: { mood = 'night'; fx = 0; fz = -24; beamOn = 1; beamSpeed = 0.3; climb = 1;
      cam = lerpV(v3(15, 5.6, -14), v3(12, 4.8, -14), ease(u)); look = v3(0, 6, -40); fov = 50; break; }
    case 7: { mood = 'storm'; fx = 0; fz = -24; rainOn = 1; beamOn = 1; beamSpeed = 0.55;
      flashOp = (Math.sin(t * 2.6 + 1) > 0.9) ? 0.5 : 0;
      place(nora, 0.6, -24, Math.PI); nora.visible = true; setFace(nora, t > vs('sawit') ? 'surprise' : 'worried'); climb = 1;
      cam = t < vs('sawit') - 0.2 ? lerpV(v3(2.0, 10.6, -22), v3(1.6, 10.5, -23), ease(u * 2)) : lerpV(v3(2.0, 10.6, -26), v3(2.6, 10.5, -27), ease((t - vs('sawit')) / 2));
      look = t < vs('sawit') - 0.2 ? v3(0, 10.0, -30) : v3(0, 2, -58); fov = 50; break; }
    case 8: { mood = 'storm'; fx = 0; fz = -16; rainOn = 1; beamOn = 1; beamSpeed = 0.6;
      flashOp = (Math.sin(t * 2.8) > 0.9) ? 0.5 : 0;
      const k = clamp(lt / dur);
      const sz = lerp(-28, -5, ease(k));
      place(nora, 0.6, sz, Math.PI); nora.visible = true; setFace(nora, 'worried'); pose(nora, k < 1 ? walkPose(t * 9, 0.85, { bodyX: 0.15 }) : {});
      stormLamp.position.set(1.6, 2.6, sz + 1); stormLamp.intensity = 4.0;
      cam = v3(2.0, 2.0, sz + 3.2); look = v3(0.3, 1.6, sz - 2); fov = 54; break; }
    case 9: { mood = 'storm'; fx = 0; fz = -6; rainOn = 1; beamOn = 1; beamSpeed = 0.5; strayBoat.visible = true;
      flashOp = (Math.sin(t * 2.4 + 2) > 0.9) ? 0.5 : 0;
      const k = clamp((t - vs('boat') + 1.0) / 4.5);
      strayBoat.position.set(0.4, -0.3, lerp(-34, -5, ease(k))); strayBoat.rotation.z = Math.sin(t * 2) * 0.15; strayBoat.rotation.y = 0.1;
      stormLamp.position.set(1.6, 2.8, strayBoat.position.z + 1); stormLamp.intensity = 4.5;
      place(nora, 0.6, -2.5, Math.PI); nora.visible = true; setFace(nora, 'worried');
      if (t > vs('inside')) { place(stranger, 0.4, strayBoat.position.z, Math.PI); stranger.visible = true; setFace(stranger, 'worried'); stranger.scale.setScalar(0.92); pose(stranger, { bodyX: 0.3, headX: 0.2 }); }
      cam = lerpV(v3(3.6, 2.4, 2.2), v3(3.0, 2.2, 1.0), ease(u)); look = v3(0.4, 1.5, strayBoat.position.z - 1.0); fov = 52; break; }
    case 10: { mood = 'storm'; fx = 0; fz = -4; rainOn = 0.5; beamOn = 0.6; stormLamp.position.set(1.4, 2.6, -4.0); stormLamp.intensity = 4.5;
      place(nora, 0.6, -2.5, Math.PI); nora.visible = true; setFace(nora, 'surprise');
      place(stranger, 0.4, -4.2, faceTo(0.4, -4.2, 0.6, -2.5)); stranger.visible = true; setFace(stranger, 'warm'); stranger.scale.setScalar(0.92); pose(stranger, { armLx: -0.6, headX: 0.1 });
      cam = lerpV(v3(3.6, 2.2, -1.2), v3(3.0, 2.1, -1.8), ease(u)); look = v3(0.5, 1.7, -3.4); fov = 54; break; }
    case 11: { mood = 'storm'; fx = 0; fz = -4; rainOn = 0.3; beamOn = 0.5; stormLamp.position.set(1.4, 2.6, -4.0); stormLamp.intensity = 4.0;
      place(nora, 0.6, -2.5, Math.PI); nora.visible = true; setFace(nora, t > vs('stranger') ? 'sad' : 'surprise');
      place(stranger, 0.4, -4.2, faceTo(0.4, -4.2, 0.6, -2.5)); stranger.visible = true; setFace(stranger, 'warm'); stranger.scale.setScalar(0.92);
      cam = v3(3.8, 2.4, -1.0); look = v3(0.5, 1.75, -3.3); fov = 54; break; }
    case 12: { mood = 'storm'; fx = 0; fz = -4; rainOn = 0.2; beamOn = 0.4; stormLamp.position.set(1.4, 2.6, -4.0); stormLamp.intensity = 3.5;
      const hug = ease(lt / 1.2);
      place(nora, lerp(0.6, 0.35, hug), lerp(-2.5, -3.3, hug), faceTo(0.6, -2.5, 0.4, -4.2)); nora.visible = true; setFace(nora, 'warm'); setBlush(nora, true);
      place(stranger, 0.4, -4.2, faceTo(0.4, -4.2, 0.6, -2.5)); stranger.visible = true; setFace(stranger, 'cry'); setTears(stranger, true, t); stranger.scale.setScalar(0.92);
      pose(nora, { armLx: -1.3 * hug, armLz: -0.2 * hug }); pose(stranger, { armRx: -1.3 * hug, armRz: 0.2 * hug });
      cam = lerpV(v3(3.0, 2.5, 1.2), v3(2.4, 2.3, 0.2), ease(u)); look = v3(0.45, 1.9, -3.5); fov = 50; break; }
    case 13: { mood = 'night'; fx = 0; fz = -24; climb = clamp(lt / dur); beamOn = 0.3;
      cam = lerpV(v3(3.6, 3.0, -16.5), v3(2.8, 9.4, -19.5), ease(u)); look = lerpV(v3(0, 4.0, -24), v3(0, 11.3, -25), ease(u)); fov = 48; break; }
    case 14: { mood = 'night'; fx = 0; fz = -24; beamOn = 1; beamSpeed = 0.28; climb = 1;
      cam = lerpV(v3(18, 6, -8), v3(22, 7.5, -6), ease(u)); look = v3(0, 7.5, -24); fov = 44;
      tint = clamp((lt - (dur - 2.2)) / 0.6) * 0.3; break; }
    case 15: { mood = 'night'; fx = 0; fz = -24; beamOn = 1; beamSpeed = 0.22; climb = 1; bloomStrength = 0.55;
      cam = lerpV(v3(20, 7, -10), v3(16, 6, -4), ease(u)); look = v3(0, 7, -28); fov = 44;
      if (lt > 0.3) { big = 'Would you keep<br>the light burning<br><span style="font-size:70px">for a stranger?</span>'; bop = clamp((lt - 0.3) / 0.4); }
      tint = 0.08; break; }
  }
  setMood(mood, fx, fz);
  lh.userData.lamp.intensity = beamOn * (45 + 25 * Math.sin(t * 1.5));
  lh.userData.lampRoomM.emissiveIntensity = 1.2 + beamOn * 1.0;
  lh.userData.setBeamAngle(t * beamSpeed);
  rain.visible = rainOn > 0; if (rainOn) rain.userData.update(t, fx, fz - 6);
  sea.userData.update(t);
  allWinMats.forEach((m, i) => { m.emissiveIntensity = (mood === 'night' || mood === 'dusk' || mood === 'storm') ? (0.4 + 0.5 * Math.sin(t * 0.6 + i)) * (i % 3 === 0 ? 1 : 0.7) : 0; });
  climbWins.forEach((m, i) => { const prog = climb < 0 ? -1 : climb * climbWins.length; m.emissiveIntensity = (climb >= 0 && Math.abs(prog - i) < 1.4) ? 1.4 : (climb >= 1 ? 0.3 : 0); });

  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.position.copy(cam); camera.lookAt(look);
  bloom.strength = bloomStrength;
  composer.render();

  $('tint').style.opacity = tint; $('flash').style.background = '#dfe8ff'; $('flash').style.opacity = flashOp;
  let hook = '', hop = 0;
  if (sc.id === 1 && lt < 3.4) { hook = '<span class="series">THE LIGHTHOUSE<br>THAT WAITED</span>'; hop = clamp(lt / 0.3) * clamp((3.4 - lt) / 0.4); }
  setText('hook', hook, hop);
  const cap = (sc.id === 1 && lt < 3.4) || (sc.id === 15 && lt > 0.3) ? null : TL.captions.find(c => t >= c.start && t < c.end + 0.12);
  $('cap').style.color = cap ? SPK_COLOR[cap.spk] : '#fff'; setText('cap', cap ? cap.text : '', cap ? 1 : 0);
  setText('big', big, bop); setText('sub', sub, bop);
  return true;
};
window.DURATION = TL.duration; window.READY = true;
