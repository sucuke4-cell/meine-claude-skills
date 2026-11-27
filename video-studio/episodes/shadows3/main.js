// ===== Shadow Shift – Part 3 (main scene; helpers + avatars are prepended by build_scene.py) =====
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
{ const hd = box(2.2, 3.4, 0.1, 0x0a0a12); hd.position.set(-2.5, 1.7, -8.75); facG.add(hd); const hg = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.2), new THREE.MeshBasicMaterial({ color: 0x4a5cff, transparent: true, opacity: 0.35, toneMapped: false })); hg.position.set(-2.5, 1.7, -8.68); facG.add(hg); }
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

// ---------- Part 2 assets ----------
// drawings on the left wall of Theo's room
const drawTex = canvasTex(1024, 768, () => {});
function drawDrawings(sunK, fillK, peopleK, nineK) {
  const g = drawTex.userData.canvas.getContext('2d'); g.clearRect(0, 0, 1024, 768);
  g.strokeStyle = 'rgba(10,10,14,0.95)'; g.fillStyle = 'rgba(10,10,14,0.95)'; g.lineWidth = 16; g.lineCap = 'round';
  if (sunK > 0) { g.beginPath(); g.arc(300, 250, 150, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sunK); g.stroke();
    for (let i = 0; i < 12 * sunK; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.moveTo(300 + Math.cos(a) * 180, 250 + Math.sin(a) * 180); g.lineTo(300 + Math.cos(a) * 230, 250 + Math.sin(a) * 230); g.stroke(); } }
  if (fillK > 0) { g.save(); g.beginPath(); g.arc(300, 250, 150, 0, Math.PI * 2); g.clip(); g.fillRect(150, 400 - 300 * fillK, 300, 300 * fillK); g.restore(); }
  for (let p = 0; p < 4; p++) { const k = clamp(peopleK * 4 - p); if (k <= 0) continue; const x = 560 + p * 110, y = 470;
    g.globalAlpha = 1 - 0.7 * clamp(peopleK * 1.5 - 0.5); g.setLineDash(peopleK > 0.6 ? [14, 14] : []);
    g.beginPath(); g.arc(x, y - 90, 28, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(x, y - 62); g.lineTo(x, y + 30); g.moveTo(x - 40, y - 30); g.lineTo(x + 40, y - 30); g.moveTo(x, y + 30); g.lineTo(x - 30, y + 100); g.moveTo(x, y + 30); g.lineTo(x + 30, y + 100); g.stroke();
    g.setLineDash([]); g.globalAlpha = 1; }
  if (nineK > 0) { g.save(); g.beginPath(); g.rect(0, 560, 200 + 700 * nineK, 200); g.clip(); g.font = '900 150px Inter'; g.textAlign = 'center'; g.fillText('TONIGHT 9:00', 512, 690); g.restore(); }
  drawTex.needsUpdate = true;
}
const drawings = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.25), new THREE.MeshBasicMaterial({ map: drawTex, transparent: true, depthWrite: false }));
drawings.position.set(-3.88, 2.5, -1.1); drawings.rotation.y = Math.PI / 2; roomG.add(drawings);

// Mom's shadow (flat against the wall, smiles)
const momShadow = makeShadow({ skin: 0, hair: 0, hairStyle: 'pigtails', top: 0, legs: 0, shoes: 0 });
const smileM = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: 0 });
{ const head = momShadow.userData.av.userData.P.head;
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.06), smileM); e.position.set(0.15 * sx, 0.08, 0.38); head.add(e); }
  const sm = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 6, 20, Math.PI), smileM); sm.position.set(0, -0.1, 0.38); sm.rotation.z = Math.PI; head.add(sm); }
// foreman's eyes can open/close
const foremanEyes = []; foreman.userData.av.userData.P.head.children.forEach(c => { if (c.geometry && c.geometry.type === 'PlaneGeometry') foremanEyes.push(c); });

// the black sun
const blackSun = new THREE.Group(); blackSun.position.set(26, 2, -14); scene.add(blackSun);
const bsMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true });
blackSun.add(new THREE.Mesh(new THREE.SphereGeometry(4, 40, 24), bsMat));
const haloTex = canvasTex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 60, 128, 128, 128); gr.addColorStop(0, 'rgba(170,60,255,0.9)'); gr.addColorStop(0.55, 'rgba(120,30,200,0.35)'); gr.addColorStop(1, 'rgba(60,0,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, toneMapped: false, fog: false })); halo.scale.set(13, 13, 1); halo.position.z = -0.5; blackSun.add(halo);
const sunBits = []; { const r = rng(61); for (let i = 0; i < 40; i++) { const m = box(0.6 + r() * 0.8, 0.6 + r() * 0.8, 0.6 + r() * 0.8, bsMat); m.castShadow = false; m.userData = { d: v3(r() - 0.5, r() - 0.3, r() - 0.5).normalize(), sp: 4 + r() * 8, s: (r() - 0.5) * 8 }; m.visible = false; scene.add(m); sunBits.push(m); } }

// the lever at the clock tower
const leverBox = box(0.9, 1.2, 0.3, 0x3a3a40); leverBox.position.set(0.9, 1.5, 1.72); tower.add(leverBox);
const leverPivot = new THREE.Group(); leverPivot.position.set(0.9, 1.5, 1.92); tower.add(leverPivot);
{ const stick = box(0.1, 0.7, 0.1, 0x999999); stick.position.y = 0.32; leverPivot.add(stick); const knob = box(0.2, 0.2, 0.2, 0xcc2222); knob.position.y = 0.7; leverPivot.add(knob); }

// fading people (whole avatar transparency)
function setOpacity(av, o) { av.traverse(m => { if (m.isMesh && m.material && m.material !== shadowMat) { m.material.transparent = o < 1 || m.material === av.userData.P.faceM; if (m.material !== av.userData.P.faceM) m.material.opacity = o; } }); }

// ---------- Part 3 assets ----------
// the hall of hanging shadows (at z = -100)
const HALL = v3(0, 0, -100);
const hallG = new THREE.Group(); hallG.position.copy(HALL); scene.add(hallG);
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), mat(0x7a7a82, { roughness: 1 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; hallG.add(fl);
  const bw = box(24, 9, 0.3, 0xa8a8b0); bw.position.set(0, 4.5, -9); hallG.add(bw);
  for (const sx of [-1, 1]) { const sw = box(0.3, 9, 20, 0xa8a8b0); sw.position.set(10 * sx, 4.5, -1); hallG.add(sw); }
  for (const z of [3, -1, -5]) { const bar = box(17, 0.14, 0.14, 0x77777f); bar.position.set(0, 3.7, z); hallG.add(bar);
    for (const x of [-7.5, 7.5]) { const st = box(0.16, 3.7, 0.16, 0x55555c); st.position.set(x, 1.85, z); hallG.add(st); } } }
const hallLight = new THREE.PointLight(0xc8d0ff, 0, 30, 1.1); hallLight.position.set(0, 7.5, -1); hallG.add(hallLight);
const HOOK_X = [-6.5, -4.2, -1.9, 0.4, 2.7, 5.0, 6.8];
const hangers = [];
const STY = ['short', 'cap', 'pigtails', 'short', 'cap', 'short', 'pigtails'];
for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
  if (r === 0 && c === 4) continue;           // Theo's hook
  if (r === 2 && c === 0) continue;           // Mara's hook
  const h = makeShadow({ skin: 0, hair: 0, hairStyle: STY[(r * 7 + c) % 7], top: 0, legs: 0, shoes: 0 });
  h.userData.hook = v3(HOOK_X[c], 0, [3, -1, -5][r]); h.userData.ph = r * 1.7 + c; hangers.push(h);
}
const THEO_HOOK = v3(HOOK_X[4], 0, 3), MARA_HOOK = v3(HOOK_X[0], 0, -5);
const dustyMat = new THREE.MeshBasicMaterial({ color: 0x3a3a44, transparent: true, opacity: 0.85 });
const maraShadow = makeShadow({ skin: 0, hair: 0, hairStyle: 'pigtails', top: 0, legs: 0, shoes: 0 });
maraShadow.userData.av.traverse(o => { if (o.isMesh && o.material === shadowMat) o.material = dustyMat; });
const maraTag = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.34), new THREE.MeshBasicMaterial({ map: tagTex('MARA', '#f0e6c8'), transparent: true, toneMapped: false }));
maraTag.position.set(HALL.x + MARA_HOOK.x, 3.25, HALL.z + MARA_HOOK.z + 0.2); scene.add(maraTag);
function hang(h, p, t, k = 0) { // k: 0 hanging limp, 1 awake
  h.visible = true; h.position.set(HALL.x + p.x, 0.35 + 0.05 * Math.sin(t * 1.3 + (h.userData.ph || 0)), HALL.z + p.z); h.rotation.set(0, 0, 0.04 * Math.sin(t * 0.9 + (h.userData.ph || 0)));
  const a = h.userData.av; a.rotation.set(0, 0, 0); const s = a.scale.x; a.scale.set(s, s, s);
  pose(a, { headX: 0.7 * (1 - k), armLz: 0.08, armRz: -0.08, legL: 0.05, legR: -0.05, bodyX: 0.1 * (1 - k) });
}
// time clock + card rack (on the right wall, near the entrance)
const tcG = new THREE.Group(); tcG.position.set(HALL.x + 9.8, 0, HALL.z + 6.5); tcG.rotation.y = -Math.PI / 2; scene.add(tcG);
{ const body = box(1.0, 1.3, 0.5, 0x8a7a5a); body.position.set(0, 1.6, 0.25); tcG.add(body);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), mat(0xf2ead6, { map: clockTex })); face.position.set(0, 1.85, 0.51); tcG.add(face);
  const slot = box(0.5, 0.06, 0.1, 0x111111); slot.position.set(0, 1.25, 0.52); tcG.add(slot);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const cd = box(0.22, 0.34, 0.03, 0xe8e0c8); cd.castShadow = false; cd.position.set(-1.9 + c * 0.28, 1.2 + r * 0.42, 0.05); tcG.add(cd); } }
const theoCard = box(0.22, 0.34, 0.03, mat(0xffd84a, { emissive: 0x664400 })); theoCard.castShadow = false; scene.add(theoCard);
// Mom's flashlight
const flash = new THREE.SpotLight(0xfff2cc, 0, 22, 0.32, 0.4, 1.0); scene.add(flash, flash.target);
const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
const beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 7, 24, 1, true), beamMat); scene.add(beam);
const torch = box(0.14, 0.14, 0.4, 0x333333); mom.userData.P.armR.add(torch); torch.position.set(0, -0.9, 0.2);
function aimFlash(on, target) {
  flash.intensity = on ? 160 : 0; beam.visible = on; torch.visible = on;
  if (!on) return;
  mom.updateMatrixWorld(true); const p = torch.getWorldPosition(new THREE.Vector3());
  flash.position.copy(p); flash.target.position.copy(target);
  const dir = target.clone().sub(p).normalize();
  beam.position.copy(p).addScaledVector(dir, 3.5); beam.quaternion.setFromUnitVectors(v3(0, -1, 0), dir);
}

// ---------- DOM ----------
const $ = id => document.getElementById(id);
function setText(id, html, op = 1) { const e = $(id); if (e.innerHTML !== html) e.innerHTML = html; e.style.opacity = op; }
const SPK_COLOR = { N: '#ffffff', T: '#8fe3a0', MO: '#ffb3c7', F: '#c9c9ff' };
const S = Object.fromEntries(TL.scenes.map(s => [s.id, s]));
const ALL = [theo, mom, ...town];
const SHADOWS = [...townShadows, theoShadow, ...workers, foreman, momShadow];
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
  let moonBoost = 0, dK = [0, 0, 0, 0], smileOp = 0, sunY = -6, lampsOut = 0, lampBoost = 0, leverK = 0, crackT = -1, foremanEyeOp = 1;
  ALL.forEach(a => setOpacity(a, 1)); momShadow.visible = false;
  setFace(theo, 'smile'); setFace(mom, 'smile'); town.forEach(a => setFace(a, 'smile'));
  [theo, mom, ...town].forEach(a => pose(a));
  const theoHand = theo.userData.P.armR.children[1];

  bigSun.visible = false; sunCage.visible = false; hallLight.intensity = 0; aimFlash(false); theoCard.visible = false; maraTag.visible = false;
  hangers.forEach(h => h.visible = false); maraShadow.visible = false;
  const H = (x, y, z) => v3(HALL.x + x, y, HALL.z + z);
  const inHall = sc.id >= 6;
  if (inHall) { hallLight.intensity = 70; moonBoost = 1; hangers.forEach(h => hang(h, h.userData.hook, t)); hang(maraShadow, MARA_HOOK, t); maraTag.visible = true; }
  switch (sc.id) {
    case 1: { // the top-hat shadow
      tod = 'night'; lampBoost = 0.25;
      place(theo, 2.3, -4.4, faceTo(2.3, -4.4, 1.5, -5.3)); setFace(theo, 'worried'); setCast(theo, false); pose(theo, { headX: 0.5 });
      placeShadow(foreman, 2.3, -4.4, Math.PI * 0.75, 0); foremanEyeOp = 1;
      camPos = lerpV(v3(1.3, 6.0, 0.4), v3(1.1, 5.4, -0.4), ease(u)); look = v3(0.7, 0, -2.6); fov = 50;
      break;
    }
    case 2: { // one second too late / whispers at night
      if (t < vs('whispered') - 0.2) {
        tod = 'morning'; focus = v3(-2, 0, 3);
        const px = tt => -7 + (tt - sc.start) * 0.9;
        place(theo, px(t), 3.0, Math.PI / 2); setCast(theo, false); setFace(theo, 'worried'); pose(theo, walkPose(t * 6, 0.45));
        placeShadow(foreman, px(t - 1.0) + 0.3, 2.7, 1.07, 0, (t - 1.0) * 6, 0.45); foremanEyeOp = 0;
        camPos = v3(px(t) - 1.2, 1.9, 7.6); look = v3(px(t) - 0.6, 0.4, 2.6); fov = 56;
      } else {
        tod = 'night'; roomLight = 0.15; wallK = 1; dK = [1, 1, 1, 1];
        place(theo, ROOM.x - 2.6, ROOM.z + 0.2, 0, 0.75); theo.rotation.x = -Math.PI / 2; setCast(theo, false); setFace(theo, 'worried');
        placeShadow(foreman, ROOM.x - 1.2, ROOM.z - 2.78, 0, 1); foreman.userData.av.scale.z = 0.18; foremanEyeOp = 1;
        camPos = lerpV(v3(ROOM.x - 0.4, 2.6, ROOM.z + 3.6), v3(ROOM.x - 0.6, 2.7, ROOM.z + 2.9), ease((t - vs('whispered')) / 5)); look = v3(ROOM.x - 1.6, 2.2, ROOM.z - 2.6);
      }
      break;
    }
    case 3: { // I'm taking you with me
      tod = 'night'; roomLight = 0.15; wallK = 1; dK = [1, 1, 1, 1]; flicker = 0.4;
      const sit = ease((t - vs('takingyou') - 0.3) / 0.8);
      place(theo, ROOM.x - 2.6, ROOM.z + 0.2, 0, lerp(0.75, 0.6, sit)); theo.rotation.x = lerp(-Math.PI / 2, 0, sit); setCast(theo, false); setFace(theo, 'shock');
      placeShadow(foreman, ROOM.x - 1.2, ROOM.z - 2.78, 0, 1); foreman.userData.av.scale.z = 0.18; foremanEyeOp = 1;
      const fs = foreman.userData.av; fs.scale.setScalar(1.5 + 0.4 * ease((t - vs('takingyou')) / 2)); fs.scale.z = 0.18;
      if (t < vs('takingyou') - 0.1) { camPos = lerpV(v3(ROOM.x - 0.6, 3.6, ROOM.z + 1.0), v3(ROOM.x - 0.8, 3.7, ROOM.z + 0.3), ease(u * 2)); look = v3(ROOM.x - 1.2, 3.8, ROOM.z - 2.7); }
      else { camPos = v3(ROOM.x - 0.2, 2.3, ROOM.z + 3.0); look = v3(ROOM.x - 1.8, 1.8, ROOM.z - 0.8); }
      break;
    }
    case 4: { // Mom believes him
      tod = 'night'; roomLight = 0.7; wallK = 1; dK = [1, 1, 1, 1];
      place(theo, ROOM.x - 0.6, ROOM.z + 1.2, faceTo(-0.6, 1.2, 1.4, 1.8)); setCast(theo, false); setFace(theo, t < vs('timeclock') ? 'worried' : 'determined');
      place(mom, ROOM.x + 1.4, ROOM.z + 1.8, faceTo(1.4, 1.8, -0.6, 1.2)); setCast(mom, false); setFace(mom, t < vs('believe') ? 'worried' : 'determined');
      placeShadow(foreman, ROOM.x - 0.6, ROOM.z + 1.2, Math.PI * 0.8, 0); foremanEyeOp = 0;
      if (t < vs('believe') - 0.1) { camPos = v3(ROOM.x + 0.6, 2.3, ROOM.z + 3.6); look = v3(ROOM.x - 0.6, 2.2, ROOM.z + 1.2); }
      else if (t < vs('timeclock') - 0.1) { camPos = v3(ROOM.x - 0.2, 2.3, ROOM.z + 3.2); look = v3(ROOM.x + 1.4, 2.2, ROOM.z + 1.8); }
      else { camPos = lerpV(v3(ROOM.x + 0.4, 2.5, ROOM.z + 4.6), v3(ROOM.x + 0.4, 2.4, ROOM.z + 4.0), ease((t - vs('timeclock')) / 6)); look = v3(ROOM.x + 0.4, 1.9, ROOM.z + 1.5); }
      break;
    }
    case 5: { // into the factory
      tod = 'night'; moonBoost = 1;
      if (t < vs('door') - 0.2) {
        focus = v3(22, 0, -8);
        const k = ease((t - sc.start) / 4.2);
        place(theo, lerp(18, 25.0, k), -6.6, Math.PI / 2 - 0.3); setCast(theo, true); setFace(theo, 'worried'); pose(theo, walkPose(t * 5, 0.35, { bodyX: 0.3 }));
        place(mom, lerp(16.8, 23.8, k), -6.2, Math.PI / 2 - 0.3); setFace(mom, 'worried'); pose(mom, walkPose(t * 5 + 1, 0.35, { armRx: -1.4 }));
        aimFlash(true, v3(26, 1.6, -8.4));
        camPos = v3(lerp(14, 19, k), 2.4, -1.6); look = v3(lerp(20, 25, k), 1.8, -7.2);
      } else {
        focus = FAC.clone();
        const k = ease((t - vs('door')) / 3.5);
        place(theo, FAC.x + 0.6, FAC.z + lerp(4, 0, k), Math.PI); setCast(theo, false); pose(theo, walkPose(t * 5, 0.3));
        place(mom, FAC.x - 0.6, FAC.z + lerp(4.6, 0.6, k), Math.PI); pose(mom, { ...walkPose(t * 5 + 1, 0.3), armRx: -1.4 });
        aimFlash(true, v3(FAC.x - 2.5, 1.8, FAC.z - 8.7));
        camPos = lerpV(v3(FAC.x + 1.8, 2.6, FAC.z + 9.0), v3(FAC.x + 1.2, 2.4, FAC.z + 6.5), k); look = v3(FAC.x - 1.2, 2.0, FAC.z - 8.7);
      }
      break;
    }
    case 6: { // the hall of hanging shadows
      tod = 'night'; focus = HALL.clone();
      hang(theoShadow, THEO_HOOK, t);
      const k = ease((t - sc.start) / 3.0);
      place(theo, HALL.x + 1.2, HALL.z + lerp(9.5, 6.0, k), Math.PI); setCast(theo, false); setFace(theo, t < vs('there') ? 'shock' : 'determined');
      if (t >= vs('there') - 0.2) { theo.rotation.y = faceTo(1.2, 6.0, THEO_HOOK.x, THEO_HOOK.z); pose(theo, { armRx: -1.6, armRz: 0.2 }); } else pose(theo, k < 1 ? walkPose(t * 5, 0.3) : {});
      place(mom, HALL.x - 0.4, HALL.z + lerp(10, 6.6, k), Math.PI); setFace(mom, 'shock'); pose(mom, { armRx: -1.4 });
      aimFlash(true, H(lerp(-4, 2.7, ease((t - vs('hooks')) / 5)), 2.0, 3.0));
      if (t < vs('there') - 0.2) { camPos = lerpV(v3(HALL.x + 0.4, 3.0, HALL.z + 12.5), v3(HALL.x + 0.2, 3.2, HALL.z + 10.0), ease(u * 1.5)); look = H(0, 2.2, -1); fov = 56; }
      else { camPos = v3(HALL.x + 3.6, 2.6, HALL.z + 7.6); look = H(2.7, 2.4, 3.0); }
      break;
    }
    case 7: { // the top-hat shadow stands up and drags Theo
      tod = 'night'; focus = HALL.clone(); hang(theoShadow, THEO_HOOK, t);
      const up = ease((t - vs('stoodup') - 0.8) / 1.2);
      const dr = ease((t - vs('nobody') - 0.2) / 2.4);
      const tz = lerp(5.2, 8.6, dr);
      place(theo, HALL.x + 2.0, HALL.z + tz, Math.PI); setCast(theo, false); setFace(theo, 'shock');
      pose(theo, dr > 0 ? { armLx: -1.6, armRx: -1.6, bodyX: -0.35, legL: -0.3, legR: -0.3 } : { armRx: -1.0 });
      placeShadow(foreman, HALL.x + 2.0, HALL.z + tz + 0.9 * up + 0.01, Math.PI, up); foremanEyeOp = 1;
      if (up >= 1) pose(foreman.userData.av, { armLx: -1.2, armRx: -1.2 });
      place(mom, HALL.x - 0.6, HALL.z + 6.8, faceTo(-0.6, 6.8, 2.0, tz)); setFace(mom, 'shock'); pose(mom, { armRx: -0.5 });
      shake = dr > 0 && dr < 1 ? 0.3 : 0;
      if (t < vs('nobody') - 0.1) { camPos = lerpV(v3(HALL.x + 6.8, 3.0, HALL.z + 2.6), v3(HALL.x + 6.4, 3.2, HALL.z + 3.2), ease(u * 1.5)); look = H(2.0, 2.4, 6.2); fov = 58; }
      else { camPos = lerpV(v3(HALL.x + 7.2, 3.4, HALL.z + 4.2), v3(HALL.x + 7.2, 3.4, HALL.z + 6.8), dr); look = H(2.0, 2.4, tz + 0.4); fov = 58; }
      break;
    }
    case 8: { // the flashlight
      tod = 'night'; focus = HALL.clone(); hang(theoShadow, THEO_HOOK, t);
      const fl = ease((t - sc.start - 0.3) / 0.6);
      const back = ease((t - vs('hate')) / 2.5);
      place(theo, HALL.x + 2.0, HALL.z + 8.6, Math.PI); setCast(theo, false); setFace(theo, 'shock'); pose(theo, { bodyX: 0.2 });
      placeShadow(foreman, HALL.x + 2.0 + back * 4, HALL.z + 9.5 + back * 2.5, Math.PI, 1);
      const fa = foreman.userData.av; fa.scale.setScalar(1.5 - 0.5 * fl); pose(fa, { armLx: -2.4, armRx: -2.4, armLz: -0.5, armRz: 0.5, bodyX: -0.3 });
      foremanEyeOp = 1;
      place(mom, HALL.x - 0.6, HALL.z + 6.8, faceTo(-0.6, 6.8, 2.0, 9.5)); setFace(mom, 'determined'); pose(mom, { armRx: -1.5 });
      aimFlash(fl > 0, H(2.0 + back * 4, 2.6, 9.5 + back * 2.5));
      if (t < vs('hate') - 0.1) { camPos = v3(HALL.x - 1.8, 2.4, HALL.z + 5.0); look = H(0.6, 2.2, 8.2); }
      else { camPos = lerpV(v3(HALL.x + 0.2, 2.0, HALL.z + 5.0), v3(HALL.x + 0.6, 2.2, HALL.z + 5.6), ease((t - vs('hate')) / 3)); look = H(2.6 + back * 3, 2.6, 9.6 + back * 2); }
      break;
    }
    case 9: { // punch the card
      tod = 'night'; focus = HALL.clone(); hang(theoShadow, THEO_HOOK, t);
      const run = ease((t - sc.start) / 1.6);
      place(theo, HALL.x + lerp(2.0, 8.9, run), HALL.z + lerp(8.6, 6.2, run), run < 1 ? faceTo(2.0, 8.6, 8.9, 6.2) : Math.PI / 2); setCast(theo, false); setFace(theo, 'determined');
      pose(theo, run < 1 ? walkPose(t * 14, 0.9) : { armRx: -1.4 });
      place(mom, HALL.x - 0.6, HALL.z + 6.8, faceTo(-0.6, 6.8, 8.9, 6.2)); setFace(mom, 'worried'); pose(mom, { armRx: -1.3 });
      aimFlash(true, H(9.5, 1.6, 6.5));
      theoCard.visible = true;
      const ck = ease((t - vs('punched') - 0.6) / 1.0);
      theoCard.position.set(HALL.x + 9.75 - 0.6 * (1 - ck), lerp(2.05, 1.32, ck), HALL.z + lerp(4.6, 6.5, ck)); theoCard.rotation.set(0, -Math.PI / 2, 0);
      const tp = vs('punched') + 1.7;
      if (t >= tp) { flash = clamp(1 - (t - tp) / 0.5) * 0.6; flashCol = '#fff6d0'; shake = clamp(0.6 - (t - tp)); }
      camPos = lerpV(v3(HALL.x + 5.2, 2.6, HALL.z + 10.0), v3(HALL.x + 5.8, 2.4, HALL.z + 9.4), ease(u)); look = H(9.4, 1.7, 6.3);
      break;
    }
    case 10: { // his real shadow comes home
      tod = 'night'; focus = HALL.clone();
      const wake = ease((t - sc.start - 0.2) / 0.6), runK = clamp((t - sc.start - 1.0) / 2.2);
      place(theo, HALL.x + 8.6, HALL.z + 6.2, -Math.PI / 2); setCast(theo, false); setFace(theo, t > vs('back') - 0.2 ? 'laugh' : 'shock');
      place(mom, HALL.x - 0.6, HALL.z + 6.8, faceTo(-0.6, 6.8, 6.0, 5.0)); setFace(mom, 'smile'); pose(mom, { armRx: -1.3 });
      aimFlash(true, H(7.0, 0.4, 6.0));
      if (runK <= 0) hang(theoShadow, THEO_HOOK, t, wake);
      else if (runK < 1) { const x = lerp(THEO_HOOK.x, 7.4, runK), z = lerp(THEO_HOOK.z, 6.2, runK); placeShadow(theoShadow, HALL.x + x, HALL.z + z, faceTo(THEO_HOOK.x, THEO_HOOK.z, 7.4, 6.2), 1, t * 14, 0.9); }
      else { const lie = ease((t - sc.start - 3.2) / 0.6); placeShadow(theoShadow, HALL.x + 8.3, HALL.z + 6.2, Math.PI / 2, 1 - lie); }
      if (t > vs('waved') - 0.1) { pose(theoShadow.userData.av, { armRx: -2.7, armRz: 0.3 + Math.sin(t * 10) * 0.3 }); pose(theo, { armRx: -2.7, armRz: 0.3 + Math.sin(t * 10) * 0.3 }); }
      if (t < vs('back') - 0.2) { camPos = lerpV(v3(HALL.x + 5.2, 3.0, HALL.z + 9.8), v3(HALL.x + 5.0, 3.2, HALL.z + 9.4), ease(u)); look = H(5.0, 1.4, 4.6); fov = 56; }
      else if (t < vs('waved') - 0.2) { camPos = v3(HALL.x + 6.4, 2.3, HALL.z + 6.4); look = H(8.6, 2.2, 6.2); }
      else { camPos = lerpV(v3(HALL.x + 6.6, 5.4, HALL.z + 7.4), v3(HALL.x + 6.8, 5.0, HALL.z + 7.0), ease((t - vs('waved')) / 3)); look = H(8.2, 0, 6.2); fov = 52; }
      break;
    }
    case 11: { // Mara's hook
      tod = 'night'; focus = HALL.clone();
      placeShadow(theoShadow, HALL.x + 8.3, HALL.z + 6.2, Math.PI / 2, 0);
      place(theo, HALL.x + 8.6, HALL.z + 6.2, faceTo(8.6, 6.2, -0.6, 6.8)); setCast(theo, false); setFace(theo, t < vs('mom') ? 'worried' : 'shock');
      place(mom, HALL.x - 0.6, HALL.z + 6.8, faceTo(-0.6, 6.8, MARA_HOOK.x, MARA_HOOK.z)); setFace(mom, t < vs('tag') + 1 ? 'worried' : 'shock'); pose(mom, { armRx: -1.4 });
      aimFlash(true, H(MARA_HOOK.x, 2.0, MARA_HOOK.z));
      if (t < vs('mom') - 0.2) { camPos = lerpV(v3(HALL.x - 3.4, 2.8, HALL.z - 0.2), v3(HALL.x - 4.8, 2.9, HALL.z - 1.8), ease((t - sc.start) / 6)); look = H(MARA_HOOK.x, 2.4, MARA_HOOK.z); }
      else if (t < vs('whose') - 0.2) { camPos = v3(HALL.x - 2.2, 2.3, HALL.z + 4.4); look = H(-0.6, 2.2, 6.8); }
      else {
        placeShadow(momShadow, HALL.x - 2.4, HALL.z + 8.4, Math.PI, 1); const ms = momShadow.userData.av; ms.scale.z = 0.14; momShadow.position.y = 0.02;
        smileOp = clamp((t - vs('whose') - 1.6) / 0.6);
        camPos = lerpV(v3(HALL.x - 0.4, 2.4, HALL.z + 4.0), v3(HALL.x - 0.5, 2.5, HALL.z + 4.6), ease((t - vs('whose')) / 4)); look = H(-1.5, 2.5, 7.6);
      }
      tint = clamp((t - (sc.end - 3.0)) / 0.6) * 0.55;
      if (t >= sc.end - 3.0) { big = 'PART 4?'; bigColor = '#ffffff'; sub = 'Whose shadow is<br>following <span style="color:#ffb3c7">Mom</span>? 👇'; bop = clamp((t - (sc.end - 3.0)) / 0.3); }
      break;
    }
  }

  // world state
  setTOD(tod, focus);
  setTowerTime(towerH, towerM);
  drawDrawings(...dK); smileM.opacity = smileOp;
  if (moonBoost) { hemi.intensity *= 2.2; sun.intensity *= 1.8; }
  foremanEyes.forEach(e => { e.material.transparent = true; e.material.opacity = foremanEyeOp; });
  blackSun.position.y = sunY; blackSun.visible = sunY > -5 && crackT < 0.4;
  if (crackT >= 0) { const s2 = Math.max(0.01, 1 - crackT * 2.5); blackSun.scale.setScalar(s2); } else blackSun.scale.setScalar(1);
  sunBits.forEach(m => { if (crackT < 0.2 || crackT > 4) { m.visible = false; return; } const d = m.userData, c = crackT - 0.2; m.visible = true; m.position.set(26 + d.d.x * d.sp * c, sunY + d.d.y * d.sp * c - 2 * c * c, -14 + d.d.z * d.sp * c); m.rotation.set(d.s * c, d.s * c, 0); });
  leverPivot.rotation.x = 1.2 * leverK - 0.6;
  lampMats.forEach((m, i) => { const on = i >= lampsOut; m.emissiveIntensity *= on ? 1 + lampBoost * 6 : 0; });
  lampLights.forEach((l, i) => { const on = i >= lampsOut; l.intensity *= on ? 1 + lampBoost * 8 : 0; });
  if (lampBoost > 0) { hemi.intensity += lampBoost * 3; hemi.color.lerp(new THREE.Color(0xfff6e0), lampBoost); windowMats.forEach(m => m.emissiveIntensity *= 1 + lampBoost * 3); }
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
  if (sc.id === 1) { hook = '<span class="series">SHADOW SHIFT · PART 3</span>'; hookOp = clamp(lt / 0.3); }
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
