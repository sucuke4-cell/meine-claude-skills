// ===== In This Town - mixed compilation (prepended with helpers + avatars) =====
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd0ff);
scene.fog = new THREE.FogExp2(0x9fd0ff, 0.012);
const camera = new THREE.PerspectiveCamera(52, W / H, 0.05, 220); scene.add(camera);
const fill = new THREE.PointLight(0xffe8d8, 2, 8, 1.4); camera.add(fill); fill.position.set(0.3, 0.4, 0);
const hemi = new THREE.HemisphereLight(0xffffff, 0x404040, 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 30, bottom: -30, near: 1, far: 120 }); sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);

// ---------- town along the X axis ----------
const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 160), mat(0x3a6a34, { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(260, 5.2), mat(0x2b2d33, { roughness: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, 2.5); road.receiveShadow = true; scene.add(road);
const sidewalk = box(260, 0.15, 1.8, 0x9a9ca4); sidewalk.position.set(0, 0.075, -0.4); sidewalk.castShadow = false; scene.add(sidewalk);
for (let x = -120; x < 120; x += 4) { const d = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.14), new THREE.MeshBasicMaterial({ color: 0xd8d2a0 })); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.02, 2.5); scene.add(d); }
const winMats = [];
function house(x, color, roof, z = -6, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const b = box(5 * s, 4 * s, 5 * s, color); b.position.y = 2 * s; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(4 * s, 2.2 * s, 4), mat(roof)); r.position.y = 4 * s + 1.1 * s; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  const wm = mat(0x223344, { emissive: 0xffc870, emissiveIntensity: 0 }); winMats.push(wm);
  for (const [wx, wy] of [[-1.2 * s, 2.9 * s], [1.2 * s, 2.9 * s]]) { const w = box(0.9 * s, 0.9 * s, 0.08, wm); w.castShadow = false; w.position.set(wx, wy, 2.5 * s + 0.03); g.add(w); }
  const door = box(0.9 * s, 1.7 * s, 0.08, 0x4a2e1a); door.position.set(0, 0.85 * s, 2.5 * s + 0.03); g.add(door);
  return g;
}
const HC = [[-22, 0xc9a07a], [-15, 0x8fb07a], [-8, 0x9c6b8e], [8, 0x8a8fb0], [15, 0xc7b37a], [22, 0xb0807a], [30, 0x7a9cb0], [-30, 0xc0a060]];
HC.forEach(([x, c]) => house(x, c, 0x4a3a3a));
const lampMats = [], lampLights = [];
for (const x of [-18, -6, 6, 18]) {
  const pole = box(0.16, 4.6, 0.16, 0x2a2a30); pole.position.set(x, 2.3, -0.2); scene.add(pole);
  const lm = mat(0xfff0c0, { emissive: 0xffd080, emissiveIntensity: 0 }); lampMats.push(lm);
  const head = box(0.5, 0.25, 0.4, lm); head.castShadow = false; head.position.set(x + 0.8, 4.4, -0.2); scene.add(head);
  const arm = box(0.9, 0.1, 0.1, 0x2a2a30); arm.position.set(x + 0.4, 4.55, -0.2); scene.add(arm);
  const pl = new THREE.PointLight(0xffc880, 0, 12, 1.4); pl.position.set(x + 0.8, 4.1, 0); scene.add(pl); lampLights.push(pl);
}
// clock tower (far, for the finale)
const tower = new THREE.Group(); tower.position.set(0, 0, -16); scene.add(tower);
{ const b = box(3.4, 13, 3.4, 0x6a6a72); b.position.y = 6.5; tower.add(b);
  const top = new THREE.Mesh(new THREE.ConeGeometry(2.8, 3.2, 4), mat(0x3a3040)); top.position.y = 14.6; top.rotation.y = Math.PI / 4; tower.add(top); }
const clockTex = canvasTex(512, 512, (g) => { g.fillStyle = '#f2ead6'; g.beginPath(); g.arc(256, 256, 250, 0, Math.PI * 2); g.fill(); g.lineWidth = 24; g.strokeStyle = '#2a1a12'; g.stroke(); g.fillStyle = '#1a1a1a'; g.font = '900 60px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; g.fillText(['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][i - 1], 256 + Math.sin(a) * 180, 256 - Math.cos(a) * 180); } });
const clockFaceM = mat(0xffffff, { map: clockTex, emissive: 0xffe0a0, emissiveIntensity: 0.15 });
const clockMesh = new THREE.Mesh(new THREE.CircleGeometry(1.4, 48), clockFaceM); clockMesh.position.set(0, 10, 1.75); tower.add(clockMesh);
const hourH = new THREE.Group(), minH = new THREE.Group(); hourH.position.set(0, 10, 1.78); minH.position.set(0, 10, 1.8); tower.add(hourH, minH);
{ const a = box(0.12, 0.66, 0.03, 0x111111); a.position.y = 0.3; hourH.add(a); const b = box(0.08, 1.0, 0.03, 0x111111); b.position.y = 0.48; minH.add(b); }

// ---------- props ----------
// umbrella on a kid
function umbrella() { const g = new THREE.Group(); const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.5, 8), mat(0xe23b4a)); canopy.position.y = 1.3; g.add(canopy); const stick = box(0.05, 1.3, 0.05, 0x3a2a1a); stick.position.y = 0.65; g.add(stick); return g; }
// rain column (only on one person)
const rainG = new THREE.Group(); scene.add(rainG); const drops = [];
{ const r = rng(3); for (let i = 0; i < 70; i++) { const m = box(0.03, 0.28, 0.03, new THREE.MeshBasicMaterial({ color: 0x8fb8ff, transparent: true, opacity: 0.7, toneMapped: false })); m.userData = { x: (r() - 0.5) * 1.6, z: (r() - 0.5) * 1.6, y: r() * 5, sp: 6 + r() * 4 }; rainG.add(m); drops.push(m); } }
const puddle = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), new THREE.MeshBasicMaterial({ color: 0x3a5a8a, transparent: true, opacity: 0.6 })); puddle.rotation.x = -Math.PI / 2; puddle.position.y = 0.03; rainG.add(puddle);
const emptyClothes = box(0.9, 0.3, 0.6, 0xe23b4a); emptyClothes.position.y = 0.15; rainG.add(emptyClothes);
// market stall
const stall = new THREE.Group(); stall.position.set(-40, 0, -3); scene.add(stall);
{ const counter = box(3.4, 1.1, 1.2, 0x8a5a3a); counter.position.set(0, 0.55, 0); stall.add(counter); for (const sx of [-1, 1]) { const p = box(0.18, 2.6, 0.18, 0x6a4a2a); p.position.set(1.5 * sx, 1.3, -0.4); stall.add(p); } const roof = box(3.8, 0.2, 1.6, 0xd0402a); roof.position.set(0, 2.6, -0.4); stall.add(roof); for (let i = 0; i < 6; i++) { const s = box(0.6, 0.2, 0.2, [0x4aa0d0, 0xffd24a, 0xe25a8a, 0x5ad07a][i % 4]); s.position.set(-1.2 + i * 0.48, 1.2, 0.3); stall.add(s); } }
const doll = box(0.3, 0.5, 0.2, 0xff9ac0); doll.position.set(-40, 1.35, -2.6); scene.add(doll);
// birthday cake with candles
const cake = new THREE.Group(); cake.position.set(40, 0, -3); scene.add(cake);
const table = box(2.4, 1.0, 1.2, 0x6a4a2a); table.position.set(40, 0.5, -3); scene.add(table);
{ const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.5, 20), mat(0xf5d0a0)); base.position.y = 1.25; cake.add(base); const ic = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.12, 20), mat(0xe87a9a)); ic.position.y = 1.5; cake.add(ic); }
const candles = [];
for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const c = box(0.05, 0.3, 0.05, 0xffffff); c.position.set(40 + Math.cos(a) * 0.45, 1.75, -3 + Math.sin(a) * 0.45); const fl = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 8), new THREE.MeshBasicMaterial({ color: 0xffb030, toneMapped: false })); fl.position.y = 0.24; c.add(fl); scene.add(c); candles.push(c); }
// garden with eye-tomatoes
const garden = new THREE.Group(); garden.position.set(-55, 0, -4); scene.add(garden);
const tomatoes = [];
for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) { const plant = new THREE.Group(); plant.position.set(-3 + c * 1.1, 0, r * 1.2); garden.add(plant); const stem = box(0.12, 1.0, 0.12, 0x2a7a3a); stem.position.y = 0.5; plant.add(stem); const t = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), mat(0xd82a2a)); t.position.y = 1.0; plant.add(t); const em = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: 0 }); const pm = new THREE.MeshBasicMaterial({ color: 0x111111, toneMapped: false, transparent: true, opacity: 0 }); for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12), em); e.position.set(0.12 * sx, 1.05, 0.34); plant.add(e); const p = new THREE.Mesh(new THREE.CircleGeometry(0.04, 10), pm); p.position.set(0.12 * sx, 1.05, 0.35); plant.add(p); } tomatoes.push(em, pm); }
const tomatoEyes = tomatoes;
// spooky house + welcome mats
const spooky = house(55, 0x3a3540, 0x2a2430, -7, 1.1);
const mats = [];
const MATN = ['ORTIZ', 'CHEN', 'REYES', 'KOVAC', 'ABARA'];
for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: tagTex(MATN[i], '#cccccc'), transparent: true })); m.rotation.x = -Math.PI / 2; m.position.set(55 - 1.0 + i * 0.5, 0.04, -4.0 + i * 0.02); m.visible = false; scene.add(m); mats.push(m); }
// siren pole + Mom window
const siren = new THREE.Group(); siren.position.set(-6, 0, -14); scene.add(siren);
{ const p = box(0.2, 7, 0.2, 0x3a3a40); p.position.y = 3.5; siren.add(p); const h = box(0.8, 0.8, 0.8, 0x8a2a2a); h.position.y = 7; siren.add(h); }
const sirenLight = new THREE.PointLight(0xff2020, 0, 40, 1.4); sirenLight.position.set(-6, 7, 0); scene.add(sirenLight);
const momWinM = mat(0x223344, { emissive: 0xffc870, emissiveIntensity: 0 });
const momWin = box(1.4, 1.4, 0.1, momWinM); momWin.position.set(22, 2.9, -3.45); scene.add(momWin);

// ---------- characters ----------
const kid = makeAvatar({ skin: 0xe8b98a, hair: 0x5a3a1e, hairStyle: 'cap', top: 0x3a8a5a, stripe: 0xe8e8e8, legs: 0x4a4a52, shoes: 0xf0f0f0 });
const girl = makeAvatar({ skin: 0xf1c27d, hair: 0xd36a9a, hairStyle: 'pigtails', top: 0xe25a8a, legs: 0x3a3a4a, shoes: 0xffffff });
const boy2 = makeAvatar({ skin: 0x8d5524, hair: 0x111111, hairStyle: 'short', top: 0x2e86de, legs: 0x333333, shoes: 0x222222 });
const mom = makeAvatar({ skin: 0xe8b98a, hair: 0x5a3a1e, hairStyle: 'pigtails', top: 0x9a5ab0, legs: 0x2a2a3a, shoes: 0x222222 });
const dad = makeAvatar({ skin: 0xc68642, hair: 0x2a1b10, hairStyle: 'short', top: 0x4a6a40, legs: 0x3a3a3a, shoes: 0x222222 });
const keeper = makeAvatar({ skin: 0x070707, hair: 0x000000, hairStyle: 'short', top: 0x0b0b0b, legs: 0x060606, shoes: 0x000000 }); keeper.scale.setScalar(1.35);
keeper.traverse(o => { if (o.isMesh && o.material !== keeper.userData.P.faceM) o.material = new THREE.MeshBasicMaterial({ color: 0x050507 }); });
const shop = makeAvatar({ skin: 0xf1c27d, hair: 0x333333, hairStyle: 'short', top: 0x5a3a7a, legs: 0x2a2a2a, shoes: 0x111111 });
scene.add(kid, girl, boy2, mom, dad, keeper, shop);
const ALL = [kid, girl, boy2, mom, dad, keeper, shop];
const umb = umbrella(); kid.userData.P.armR.add(umb); umb.position.set(0, -0.6, 0.2); umb.rotation.z = 0.2;
// red glowing eyes helper (keeper)
const kEyeM = new THREE.MeshBasicMaterial({ color: 0xff2020, toneMapped: false });
for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.07), kEyeM); e.position.set(0.15 * sx, 0.02, 0.38); keeper.userData.P.head.add(e); }

// ---------- lighting presets ----------
function light(name, focusX) {
  const F = { day: [0x9fd0ff, 0xffffff, 2.6, 1.2, [10, 14, 10], 0, 0], dusk: [0xff9a66, 0xffb080, 2.0, 0.8, [-18, 8, 8], 0.3, 0.6], night: [0x0a0e1e, 0x9ab0ff, 0.8, 0.5, [-10, 22, 12], 1, 1] }[name];
  scene.background.setHex(F[0]); scene.fog.color.setHex(F[0]); scene.fog.density = name === 'night' ? 0.02 : 0.012;
  sun.color.setHex(F[1]); sun.intensity = F[2]; hemi.intensity = F[3]; sun.position.set(focusX + F[4][0], F[4][1], F[4][2]); sun.target.position.set(focusX, 1, -4);
  lampMats.forEach(m => m.emissiveIntensity = F[5] * 2.2); lampLights.forEach(l => l.intensity = F[5] * 16);
  winMats.forEach(m => m.emissiveIntensity = F[6] * 1.6); momWinM.emissiveIntensity = F[6] * 1.6;
}

// ---------- DOM ----------
const $ = id => document.getElementById(id);
function setText(id, html, op = 1) { const e = $(id); if (e.innerHTML !== html) e.innerHTML = html; e.style.opacity = op; }
const SPK_COLOR = { N: '#ffffff', K: '#8fe3a0', G: '#ff9ac0', M: '#ffb3c7', V: '#ff6b6b', B: '#9ec8ff' };
const S = Object.fromEntries(TL.scenes.map(s => [s.id, s]));
const put = (a, x, z, r, y = 0) => { a.position.set(x, y, z); a.rotation.set(0, r, 0); a.visible = true; };
const wk = (ph, amt = 0.5, ex = {}) => walkPose(ph, amt, ex);

window.renderAt = function (t) {
  ALL.forEach(a => { a.visible = false; a.position.y = 0; a.rotation.set(0, 0, 0); pose(a); });
  const sc = TL.scenes.find(s => t >= s.start && t < s.end) || TL.scenes[TL.scenes.length - 1];
  const lt = t - sc.start, dur = sc.end - sc.start, u = clamp(lt / dur);
  let camPos = v3(0, 3, 10), look = v3(0, 2, -4), fov = 52, mood = 'day', fx = 0;
  let flash = 0, flashCol = '#000', tint = 0, big = '', sub = '', bop = 0, shake = 0, flicker = 0;
  let rainOn = 0, emptyOn = 0, dollGone = 0, candlesN = 10, tomatoEye = 0, matsN = 0, sirenOn = 0, towerH = 12, cardGlow = 0;
  umb.visible = false; rainG.visible = false; doll.visible = true; emptyClothes.visible = false; mats.forEach(m => m.visible = false);
  tomatoEyes.forEach(m => m.opacity = 0);
  candles.forEach(c => c.visible = true); sirenLight.intensity = 0;
  setFace(kid, 'smile'); setFace(girl, 'smile'); setFace(boy2, 'smile'); setFace(mom, 'smile'); setFace(dad, 'smile'); setFace(shop, 'smile');
  setTower(towerH);

  switch (sc.id) {
    case 1: { // intro: street
      mood = 'dusk'; fx = 0;
      camPos = lerpV(v3(-6, 6, 16), v3(-3, 4.5, 12), ease(u)); look = v3(2, 3, -8);
      break;
    }
    case 2: { // umbrellas: sunny, kid with umbrella
      mood = 'day'; fx = 0;
      put(kid, 1, 1.5, Math.PI / 2 - 0.3); umb.visible = true; setFace(kid, 'smile'); pose(kid, wk(t * 5, 0.4));
      kid.position.x = -3 + lt * 0.7;
      camPos = v3(kid.position.x - 3.5, 2.2, 7.5); look = v3(kid.position.x + 1, 1.6, -3); fov = 55;
      break;
    }
    case 3: { // Lena forgot: rain on one person, then empty clothes
      mood = 'dusk'; fx = 1;
      const gone = t > vs('s1d') + 1.0;
      put(girl, 1, 1.5, Math.PI); setFace(girl, 'shock'); girl.visible = !gone;
      pose(girl, { armLx: -1.2, armRx: -1.2, headX: 0.3 });
      rainG.visible = true; rainG.position.set(1, 0, 1.5); rainOn = 1;
      emptyClothes.visible = gone; emptyClothes.position.set(1, 0, 1.5);
      camPos = lerpV(v3(4, 2.6, 6), v3(3.4, 2.4, 5), ease(u)); look = v3(1, 1.6, 1.5); flicker = 0.3;
      break;
    }
    case 4: { // market stall
      mood = 'day'; fx = -40;
      put(shop, -40, -1.4, 0); setFace(shop, 'smile'); pose(shop, { armLz: 0.2, armRz: -0.2 });
      put(girl, -40, 4.0, Math.PI, 0); setFace(girl, 'smile'); girl.position.z = 4.0;
      camPos = lerpV(v3(-44, 3.0, 4), v3(-43, 2.6, 2.5), ease(u)); look = v3(-40, 1.8, -2);
      break;
    }
    case 5: { // the trade: doll gone, girl fades
      mood = 'day'; fx = -40;
      const traded = t > vs('s2c') + 0.5;
      put(girl, -40, 1.6, Math.PI); setFace(girl, 'smile');
      if (t < vs('s2c') - 0.1) pose(girl, { armRx: -2.2, armRz: 0.3 });
      const fade = clamp((t - vs('s2d') - 1.5) / 1.5);
      setOp(girl, 1 - fade);
      put(shop, -40, -1.0, 0); setFace(shop, 'smirk'); pose(shop, { armRx: traded ? -1.2 : 0 });
      doll.visible = !traded; doll.position.set(-40, 1.35, -2.6);
      if (t < vs('s2d') - 0.1) { camPos = v3(-42.6, 2.3, 1.4); look = v3(-40, 2.0, -1.2); }
      else { camPos = lerpV(v3(-42.4, 2.4, 2.8), v3(-42.2, 2.4, 2.4), ease((t - vs('s2d')) / 4)); look = v3(-40, 1.8, -0.8); }
      break;
    }
    case 6: { // birthday cake
      mood = 'day'; fx = 40;
      put(boy2, 40, -0.4, Math.PI); setFace(boy2, 'laugh');
      camPos = lerpV(v3(43, 3.0, 2.0), v3(42.5, 2.6, 1.2), ease(u)); look = v3(40, 1.6, -3);
      break;
    }
    case 7: { // one candle
      mood = 'day'; fx = 40;
      candlesN = t > vs('s3c') ? 1 : 10;
      put(boy2, 40, -0.4, Math.PI); setFace(boy2, t < vs('s3d') ? 'worried' : 'shock');
      put(mom, 41.6, -0.6, faceTo(41.6, -0.6, 40, -0.4)); setFace(mom, 'worried');
      if (t < vs('s3d') - 0.1) { camPos = lerpV(v3(41.6, 2.2, 0.6), v3(41.2, 2.1, 0.2), ease(u)); look = v3(40, 1.7, -2.8); }
      else { camPos = v3(42.4, 2.3, -0.4); look = v3(40.4, 2.0, -1.0); }
      break;
    }
    case 8: { // garden
      mood = 'day'; fx = -55;
      put(boy2, -55, 3.0, Math.PI); setFace(boy2, 'smile'); pose(boy2, { armRx: -1.2 });
      camPos = lerpV(v3(-58, 3.4, 4), v3(-56.5, 3.0, 2.5), ease(u)); look = v3(-55, 1.0, -4);
      break;
    }
    case 9: { // the field watches
      mood = t < vs('s4d') ? 'day' : 'dusk'; fx = -55;
      const watch = t > vs('s4d') - 0.2;
      tomatoEye = watch ? clamp((t - vs('s4d') + 0.2) / 0.8) : 0;
      tomatoEyes.forEach(m => m.opacity = tomatoEye);
      put(boy2, -55, 4.2, Math.PI); setFace(boy2, watch ? 'shock' : 'worried');
      if (t < vs('s4d') - 0.1) { camPos = v3(-55, 5.5, 3); look = v3(-55, 0.8, -4); fov = 56; }
      else { camPos = lerpV(v3(-55, 1.2, -1.5), v3(-55, 1.3, -0.8), ease((t - vs('s4d')) / 3)); look = v3(-55, 1.0, -4.5); flicker = 0.3; }
      break;
    }
    case 10: { // the spooky house
      mood = 'dusk'; fx = 55;
      camPos = lerpV(v3(60, 4, 6), v3(58, 3.4, 4), ease(u)); look = v3(55, 3, -7);
      break;
    }
    case 11: { // welcome mats
      mood = 'night'; fx = 55; matsN = clamp((lt) / 3) * 5;
      mats.forEach((m, i) => m.visible = i < matsN);
      put(dad, 56.5, -0.5, faceTo(56.5, -0.5, 55, -4)); setFace(dad, 'worried'); dad.visible = t > vs('s5c');
      pose(dad, { armRx: -0.6 });
      flicker = 0.4;
      if (t < vs('s5d') - 0.1) { camPos = lerpV(v3(58, 2.6, 2), v3(57, 2.4, 0.5), ease(u * 1.5)); look = v3(55, 0.3, -4); }
      else { camPos = v3(53.4, 1.2, -1.2); look = v3(55.2, 0.2, -4.0); fov = 56; }
      break;
    }
    case 12: { // siren rule
      mood = 'night'; fx = -6; sirenOn = 1; flicker = 0.6;
      put(mom, -6, 1.5, Math.PI); setFace(mom, 'smile'); mom.visible = t > vs('s6b') - 0.3;
      pose(mom, { armLx: -1.0, headX: 0.1 });
      camPos = lerpV(v3(-2, 4.5, 6), v3(-3, 4, 4.5), ease(u)); look = v3(-6, 5, -10);
      break;
    }
    case 13: { // Mom at the window, unblinking
      mood = 'night'; fx = 22; sirenOn = 0.3;
      momWinM.emissiveIntensity = 2.2;
      put(mom, 22, -3.3, 0); setFace(mom, 'smile'); mom.visible = true; pose(mom, { armLz: 0.05, armRz: -0.05 });
      put(dad, 24, 1.5, faceTo(24, 1.5, 22, -3.3)); setFace(dad, t > vs('s6d') ? 'shock' : 'worried'); dad.visible = t > vs('s6c');
      flicker = 0.5;
      if (t < vs('s6d') - 0.1) { camPos = lerpV(v3(25, 2.6, 2.5), v3(24.5, 2.5, 1.5), ease(u)); look = v3(22, 2.9, -3.4); }
      else { camPos = lerpV(v3(23.4, 3.0, -1.6), v3(23.1, 3.0, -2.0), ease((t - vs('s6d')) / 4)); look = v3(22, 2.95, -3.4); fov = 50; }
      tint = clamp((t - (sc.end - 1.6)) / 0.5) * 0.4;
      break;
    }
    case 14: { // outro
      mood = 'night'; fx = 0;
      camPos = lerpV(v3(-4, 7, 14), v3(-2, 6, 11), ease(u)); look = v3(2, 4, -10);
      tint = 0.1;
      if (lt > 0.3) { big = '<span style="font-size:94px">WHICH RULE<br>WOULD YOU<br>BREAK?</span>'; sub = ''; bop = clamp((lt - 0.3) / 0.4); }
      break;
    }
  }

  // world state
  light(mood, fx);
  setTower(towerH);
  if (sc.id === 13 && t >= vs('s6c')) { towerH = 13; }
  // rain
  if (rainOn) drops.forEach(m => { const d = m.userData; let y = (d.y - t * d.sp) % 5; if (y < 0) y += 5; m.position.set(rainG.position.x + d.x, y, rainG.position.z + d.z); });
  sirenLight.intensity = sirenOn * (120 + 80 * Math.sin(t * 8));
  // candles
  candles.forEach((c, i) => { c.visible = i < candlesN; c.children[0].scale.y = 0.8 + 0.3 * Math.sin(t * 12 + i); });
  if (flicker) hemi.intensity *= (Math.sin(t * 29) > 0.75 ? 0.6 : 1);

  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  const cs = shake * 0.06; camera.position.copy(camPos).add(v3(Math.sin(t * 83) * cs, Math.sin(t * 61) * cs, 0)); camera.lookAt(look);
  renderer.render(scene, camera);

  // overlays
  $('flash').style.background = flashCol; $('flash').style.opacity = flash;
  $('tint').style.opacity = tint;
  let hook = '', hookOp = 0;
  if (sc.id === 1 && lt < 3.0) { hook = '<span class="series">IN THIS TOWN...</span>'; hookOp = clamp(lt / 0.3) * clamp((3.0 - lt) / 0.4); }
  setText('hook', hook, hookOp);
  const cap = (sc.id === 1 && lt < 3.0) ? null : TL.captions.find(c => t >= c.start && t < c.end + 0.12);
  const capEl = $('cap'); capEl.style.color = cap ? SPK_COLOR[cap.spk] : '#fff';
  setText('cap', cap ? cap.text : '', cap ? 1 : 0);
  $('big').style.color = '#ffffff'; setText('big', big, bop); setText('sub', sub, bop);
  setText('sys', '', 0);
  return true;
};
function setTower(h) { minH.rotation.z = 0; hourH.rotation.z = -((h % 12)) / 12 * Math.PI * 2; }
function setOp(av, o) { av.traverse(m => { if (m.isMesh && m.material && m.material !== av.userData.P.faceM) { m.material.transparent = o < 1; m.material.opacity = o; } }); }
window.DURATION = TL.duration;
window.READY = true;
