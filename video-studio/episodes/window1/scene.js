import * as THREE from 'three';
import { makeAvatar, setFace, setTears, setBlush, pose, idle, blinkFace, walkPose, place, v3, lerpV, ease, easeOut, clamp, lerp, rng, faceTo, canvasTex, mat } from './avatars_round.js';

const TL = await (await fetch('./timeline.json')).json();
const W = 1080, H = 1920, VO = TL.vo;
const vs = k => VO[k].start, ve = k => VO[k].start + VO[k].dur;
const box = (w, h, d, m) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m.isMaterial ? m : mat(m)); me.castShadow = true; me.receiveShadow = true; return me; };

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9aa0a8); scene.fog = new THREE.FogExp2(0x9aa0a8, 0.012);
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 400); scene.add(camera);
const fill = new THREE.PointLight(0xffffff, 1.5, 7, 1.4); camera.add(fill); fill.position.set(0.3, 0.4, 0);
const hemi = new THREE.HemisphereLight(0xffffff, 0x707070, 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 }); sun.shadow.bias = -0.0005; scene.add(sun, sun.target);

// ===== Jonah's room + alley (x=0) =====
const roomG = new THREE.Group(); scene.add(roomG);
const grey = c => mat(c, { roughness: 0.9 });
{ const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), grey(0x8a8276)); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; roomG.add(fl);
  const back = box(10, 6, 0.3, grey(0x9a9690)); back.position.set(0, 3, -3); roomG.add(back);
  const left = box(0.3, 6, 10, grey(0x8e8a84)); left.position.set(-4, 3, 2); roomG.add(left);
  const right = box(0.3, 6, 10, grey(0x8e8a84)); right.position.set(4, 3, 2); roomG.add(right);
  const bed = box(2.2, 0.5, 3.0, grey(0x7a8490)); bed.position.set(-2.6, 0.25, 0); roomG.add(bed);
  const pillow = box(1.3, 0.22, 0.7, grey(0xb0b4b8)); pillow.position.set(-2.6, 0.6, -1.0); roomG.add(pillow); }
// window hole in back wall + glass + alley wall behind
const winFrame = box(2.6, 2.4, 0.35, grey(0x6a6660)); winFrame.position.set(0.6, 2.6, -2.9); roomG.add(winFrame);
const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.0), new THREE.MeshBasicMaterial({ color: 0xcfe0ea, transparent: true, opacity: 0.25, toneMapped: false })); winGlass.position.set(0.6, 2.6, -2.72); roomG.add(winGlass);
const alleyWall = box(14, 14, 0.4, grey(0x8f8b82)); alleyWall.position.set(1, 7, -8); scene.add(alleyWall);
// Ivy's window across the alley (with a changeable chalk drawing)
const chalkTex = canvasTex(512, 460, () => {});
function drawChalk(kind, k = 1) {
  const g = chalkTex.userData.canvas.getContext('2d'), w = 512, hh = 460;
  g.clearRect(0, 0, w, hh); g.fillStyle = '#20303a'; g.fillRect(0, 0, w, hh);
  g.strokeStyle = 'rgba(255,255,255,0.92)'; g.fillStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
  g.save(); g.beginPath(); g.rect(0, 0, w * clamp(k), hh); g.clip();
  if (kind === 'ocean') { g.beginPath(); g.arc(380, 120, 55, 0, 7); g.stroke(); for (let r = 0; r < 4; r++) { g.beginPath(); for (let x = 20; x < 500; x += 20) g[x === 20 ? 'moveTo' : 'lineTo'](x, 260 + r * 45 + Math.sin(x / 30) * 14); g.stroke(); } }
  else if (kind === 'arrow') { g.lineWidth = 12; g.beginPath(); g.moveTo(120, 230); g.lineTo(400, 230); g.lineTo(340, 175); g.moveTo(400, 230); g.lineTo(340, 285); g.stroke(); g.font = '900 54px Inter'; g.textAlign = 'center'; g.fillText('NOW IT\'S', 256, 360); g.fillText('YOUR TURN', 256, 420); }
  g.restore(); chalkTex.needsUpdate = true;
}
drawChalk('ocean', 0);
const ivyFrame = box(2.4, 2.2, 0.3, grey(0x6a6660)); ivyFrame.position.set(1, 6, -7.78); scene.add(ivyFrame);
const ivyWin = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.8), new THREE.MeshBasicMaterial({ map: chalkTex, toneMapped: false })); ivyWin.position.set(1, 6, -7.6); scene.add(ivyWin);
const ivyGlow = new THREE.PointLight(0xfff0d0, 0, 10, 1.4); ivyGlow.position.set(1, 6, -6.5); scene.add(ivyGlow);

// ===== vignette locations =====
function skyDome(x, top, bot) { const geo = new THREE.SphereGeometry(80, 24, 16); const m = new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { top: { value: new THREE.Color(top) }, bot: { value: new THREE.Color(bot) } }, vertexShader: 'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: 'varying float h;uniform vec3 top;uniform vec3 bot;void main(){gl_FragColor=vec4(mix(bot,top,clamp(h*0.5+0.5,0.,1.)),1.);}' }); const d = new THREE.Mesh(geo, m); d.position.set(x, 0, 0); return d; }
// ocean (x=-60)
const ocean = new THREE.Group(); ocean.position.set(-60, 0, 0); scene.add(ocean);
ocean.add(skyDome(0, 0x9fd8ff, 0xffe0b0));
{ const sand = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), mat(0xf0dca8)); sand.rotation.x = -Math.PI / 2; sand.position.z = 8; sand.receiveShadow = true; ocean.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), mat(0x2aa0d8, { roughness: 0.4 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.05, -18); ocean.add(sea);
  const psun = new THREE.Mesh(new THREE.CircleGeometry(4, 32), new THREE.MeshBasicMaterial({ color: 0xffe89a, toneMapped: false })); psun.position.set(-8, 10, -40); ocean.add(psun); }
const whale = new THREE.Group(); whale.position.set(6, 1.2, -16); ocean.add(whale);
{ const body = new THREE.Mesh(new THREE.SphereGeometry(2.2, 20, 14), mat(0x3a5a7a)); body.scale.set(1.8, 1, 1); whale.add(body); const tail = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.6, 8), mat(0x3a5a7a)); tail.position.set(-3.6, 0.6, 0); tail.rotation.z = -1; whale.add(tail); }
// forest (x=-90)
const forest = new THREE.Group(); forest.position.set(-90, 0, 0); scene.add(forest);
forest.add(skyDome(0, 0x1a2a4a, 0x3a5a4a));
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat(0x1f3a24)); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; forest.add(gr);
  const r = rng(7); for (let i = 0; i < 24; i++) { const x = (r() - 0.5) * 36, z = -4 - r() * 26; const tr = box(0.6, 3, 0.6, mat(0x3a2a1a)); tr.position.set(x, 1.5, z); forest.add(tr); for (let j = 0; j < 3; j++) { const cone = new THREE.Mesh(new THREE.ConeGeometry(2 - j * 0.4, 1.8, 10), mat(0x24512e)); cone.position.set(x, 3 + j * 1.1, z); cone.castShadow = true; forest.add(cone); } } }
const fireflies = []; { const r = rng(9); for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe060, toneMapped: false })); m.userData = { x: (r() - 0.5) * 30, y: 1 + r() * 4, z: -2 - r() * 22, ph: r() * 6, sp: 0.4 + r() }; forest.add(m); fireflies.push(m); } }
// city night (x=-120)
const city = new THREE.Group(); city.position.set(-120, 0, 0); scene.add(city);
city.add(skyDome(0, 0x0a0e24, 0x241a3a));
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat(0x15151c)); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; city.add(gr);
  const r = rng(11); for (let i = 0; i < 26; i++) { const x = (r() - 0.5) * 40, z = -6 - r() * 30, h = 4 + r() * 16; const col = [0x2a2a3a, 0x33334a, 0x222230][i % 3]; const b = box(2.4 + r() * 1.5, h, 2.4 + r(), mat(col)); b.position.set(x, h / 2, z); city.add(b); const wt = canvasTex(32, 128, (g) => { g.fillStyle = '#15151c'; g.fillRect(0, 0, 32, 128); for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 4; xx++) if (Math.random() > 0.5) { g.fillStyle = ['#ffd060', '#ffe8a0', '#a0c0ff'][Math.random() * 3 | 0]; g.fillRect(xx * 8 + 1, yy * 8 + 1, 5, 5); } }); const face = new THREE.Mesh(new THREE.PlaneGeometry(2.3, h * 0.95), new THREE.MeshBasicMaterial({ map: wt, toneMapped: false })); face.position.set(x, h / 2, z + (1.2 + r() * 0.5)); city.add(face); }
  const stars = []; for (let i = 0; i < 80; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); s.position.set((r() - 0.5) * 70, 12 + r() * 25, -30 - r() * 20); city.add(s); } }
// mountains (x=-150)
const mnt = new THREE.Group(); mnt.position.set(-150, 0, 0); scene.add(mnt);
mnt.add(skyDome(0, 0x8fc0ff, 0xe8f4ff));
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), mat(0xf2f6ff)); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; mnt.add(gr);
  for (const [x, z, s] of [[-12, -24, 10], [2, -30, 14], [16, -22, 9], [-4, -18, 7]]) { const m = new THREE.Mesh(new THREE.ConeGeometry(s, s * 1.5, 6), mat(0xcdd8ea)); m.position.set(x, s * 0.75, z); const cap = new THREE.Mesh(new THREE.ConeGeometry(s * 0.4, s * 0.6, 6), mat(0xffffff)); cap.position.set(x, s * 1.2, z); mnt.add(m, cap); } }
const snow = []; { const r = rng(13); for (let i = 0; i < 60; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); m.userData = { x: (r() - 0.5) * 30, z: -2 - r() * 20, y: r() * 10, sp: 1 + r() }; mnt.add(m); snow.push(m); } }
// outside street (x=30) + door
const street = new THREE.Group(); street.position.set(30, 0, 0); scene.add(street);
street.add(skyDome(0, 0x8fd0ff, 0xffe8c0));
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat(0x4a7a3a)); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; street.add(gr);
  const path = box(3, 0.05, 20, mat(0xbfae8a)); path.position.set(0, 0.03, 4); street.add(path);
  const bldg = box(8, 7, 6, mat(0xb86a5a)); bldg.position.set(0, 3.5, -6); street.add(bldg);
  for (const [x, c] of [[-9, 0x7aa0c0], [9, 0x9ac07a], [-16, 0xc0a060]]) { const h = box(6, 5, 6, mat(c)); h.position.set(x, 2.5, -7); street.add(h); const rf = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2, 4), mat(0x4a3a3a)); rf.position.set(x, 6, -7); rf.rotation.y = Math.PI / 4; street.add(rf); }
  for (const tx of [-16, -9, 9, 16]) { const t = box(0.6, 2.2, 0.6, mat(0x5a3a2a)); t.position.set(tx, 1.1, 6); street.add(t); const c = new THREE.Mesh(new THREE.SphereGeometry(1.6, 14, 12), mat(0x3a7a3a)); c.position.set(tx, 3.4, 6); c.castShadow = true; street.add(c); } }
const doorPivot = new THREE.Group(); doorPivot.position.set(27.2, 0, -3.0); scene.add(doorPivot);
{ const fr = box(1.6, 2.6, 0.3, mat(0x6a4a2a)); fr.position.set(30 - 27.2, 1.3, 0); doorPivot.parent && 0; }
const doorFrame = box(1.7, 2.7, 0.35, mat(0x5a3a1a)); doorFrame.position.set(30, 1.35, -3.0); scene.add(doorFrame);
const door = new THREE.Group(); door.position.set(29.2, 0, -2.85); scene.add(door); { const d = box(1.5, 2.5, 0.1, mat(0x8a5a2a)); d.position.set(0.75, 1.25, 0); door.add(d); }
// beach end (x=60)
const beach = new THREE.Group(); beach.position.set(60, 0, 0); scene.add(beach);
beach.add(skyDome(0, 0xffb060, 0xff8a5a));
{ const sand = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), mat(0xf0cf90)); sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; beach.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), mat(0xe08a5a, { roughness: 0.4 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.05, -22); beach.add(sea);
  const psun = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshBasicMaterial({ color: 0xfff0b0, toneMapped: false })); psun.position.set(0, 7, -42); beach.add(psun); }
const sandTex = canvasTex(512, 256, () => {});
function drawSand(k) { const g = sandTex.userData.canvas.getContext('2d'); g.clearRect(0, 0, 512, 256); g.strokeStyle = 'rgba(120,90,50,0.9)'; g.lineWidth = 10; g.lineCap = 'round'; g.font = '900 70px Inter'; g.fillStyle = 'rgba(120,90,50,0.9)'; g.textAlign = 'center'; g.save(); g.beginPath(); g.rect(0, 0, 512 * clamp(k), 256); g.clip(); g.fillText('WISH YOU', 256, 110); g.fillText('WERE HERE', 256, 200); g.restore(); sandTex.needsUpdate = true; }
drawSand(0);
const sandWrite = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ map: sandTex, transparent: true })); sandWrite.rotation.x = -Math.PI / 2; sandWrite.position.set(60, 0.06, 2); scene.add(sandWrite);

// ===== characters =====
const jonah = makeAvatar({ seed: 101, skin: 0xf1c27d, hair: 0x2a2a2a, hairStyle: 'short', top: 0x4a7a8a, legs: 0x3a3a42, acc: 'none' });
const ivy = makeAvatar({ seed: 202, skin: 0xffe0bd, hair: 0xe0453a, hairStyle: 'long', top: 0xf0a030, legs: 0x3a3a4a, acc: 'none' });
scene.add(jonah, ivy); jonah.visible = ivy.visible = false;

// ===== grey filter via desaturated lights for town scenes =====
function setMood(name) {
  if (name === 'grey') { scene.background.setHex(0x9aa0a8); scene.fog.color.setHex(0x9aa0a8); scene.fog.density = 0.014; hemi.color.setHex(0xbfc4c8); hemi.groundColor.setHex(0x707070); hemi.intensity = 1.0; sun.color.setHex(0xdfe2e6); sun.intensity = 1.6; sun.position.set(6, 12, 6); sun.target.position.set(0, 1, 0); ivyGlow.intensity = 0; }
  else if (name === 'warm') { scene.background.setHex(0xffe0b8); scene.fog.color.setHex(0xffe0b8); scene.fog.density = 0.01; hemi.color.setHex(0xfff2e0); hemi.intensity = 1.2; sun.color.setHex(0xfff0d0); sun.intensity = 2.2; ivyGlow.intensity = 30; }
  else { scene.fog.density = 0.006; hemi.color.setHex(0xffffff); hemi.intensity = 1.1; sun.color.setHex(0xfff4e0); sun.intensity = 2.2; }
}
function sunAt(fx, fz) { sun.position.set(fx + 8, 16, fz + 10); sun.target.position.set(fx, 1, fz); }

const $ = id => document.getElementById(id);
function setText(id, html, op = 1) { const e = $(id); if (e.innerHTML !== html) e.innerHTML = html; e.style.opacity = op; }
const SPK_COLOR = { N: '#ffffff', J: '#9ed0ff', I: '#ffd070' };
const S = Object.fromEntries(TL.scenes.map(s => [s.id, s]));

window.renderAt = function (t) {
  jonah.visible = ivy.visible = false;
  const sc = TL.scenes.find(s => t >= s.start && t < s.end) || TL.scenes[TL.scenes.length - 1];
  const lt = t - sc.start, dur = sc.end - sc.start, u = clamp(lt / dur);
  let cam = v3(0, 3, 8), look = v3(0, 2.5, -4), fov = 50, mood = 'grey', big = '', sub = '', bop = 0, tint = 0;
  idle(jonah, t); idle(ivy, t);

  switch (sc.id) {
    case 1: { mood = 'grey'; cam = lerpV(v3(5, 4, 6), v3(4, 3.4, 4.5), ease(u)); look = v3(0.6, 2.6, -2.9); drawChalk('ocean', 0); break; }
    case 2: { mood = 'grey';
      place(jonah, -0.4, -1.4, 0); jonah.visible = true; blinkFace(jonah, t, 'sad'); pose(jonah, { headX: -0.1, armLz: 0.1, armRz: -0.1 });
      cam = t < vs('window') ? lerpV(v3(2.4, 2.4, 2.0), v3(2.0, 2.3, 1.4), ease(u * 2)) : lerpV(v3(0.2, 2.6, 1.2), v3(0.3, 2.6, 0.6), ease((t - vs('window')) / 3));
      look = t < vs('window') ? v3(-0.4, 1.9, -1.4) : v3(0.6, 2.6, -2.9); break; }
    case 3: { mood = 'grey'; drawChalk('ocean', 0);
      place(jonah, -0.4, -1.0, Math.PI); jonah.visible = true; blinkFace(jonah, t, t > vs('hi') ? 'surprise' : 'worried');
      const app = clamp((t - vs('hi') + 0.3) / 0.6);
      ivyWin.visible = true; place(ivy, 1, -6.4, 0, 5.0); ivy.visible = t > vs('moved') + 0.6; setFace(ivy, 'happy'); setBlush(ivy, true); ivy.scale.setScalar(1);
      pose(ivy, { armRx: -2.2 * app, armRz: 0.3, headZ: 0.1 });
      cam = lerpV(v3(0.4, 3.0, 1.6), v3(0.5, 3.2, 1.0), ease(u)); look = v3(1, 5.4, -7); fov = 46; break; }
    case 4: { mood = 'warm'; drawChalk('ocean', clamp((t - vs('chalk')) / 2.5));
      place(ivy, 1, -6.4, 0, 5.0); ivy.visible = true; setFace(ivy, 'happy'); setBlush(ivy, true);
      pose(ivy, { armRx: -1.9 + Math.sin(t * 7) * 0.3, armRz: Math.sin(t * 5) * 0.2 });
      cam = lerpV(v3(0.2, 5.6, 0.4), v3(0.4, 5.6, -0.6), ease(u)); look = v3(1, 5.6, -7); fov = 42; break; }
    case 5: { mood = 'color'; sunAt(-60, -16);
      place(jonah, -61, 4, 0.5); jonah.visible = true; blinkFace(jonah, t, 'happy'); setBlush(jonah, true);
      place(ivy, -59, 4, -0.5); ivy.visible = true; setFace(ivy, 'laugh');
      if (t > vs('whoa')) { setFace(jonah, 'surprise'); pose(jonah, { armLx: -1.6, armRx: -1.6, headX: -0.2 }); }
      whale.position.y = 1.2 + Math.sin(t * 1.5) * 0.8;
      cam = lerpV(v3(-60, 3.0, 9), v3(-60, 2.6, 7), ease(u)); look = v3(-60, 2, -14); fov = 54; break; }
    case 6: { mood = 'color';
      if (t < vs('city')) { sunAt(-90, -12); // forest
        place(jonah, -91, 2.5, 0.4); jonah.visible = true; blinkFace(jonah, t, 'happy');
        place(ivy, -89, 2.5, -0.4); ivy.visible = true; setFace(ivy, 'happy');
        cam = lerpV(v3(-90, 2.6, 7), v3(-90, 2.8, 5.5), ease(u * 1.6)); look = v3(-90, 2.4, -8); fov = 56;
      } else { sunAt(-120, 20); scene.background.setHex(0x0a0e24); // city
        place(jonah, -121, 2.5, 0.4); jonah.visible = true; blinkFace(jonah, t, 'happy');
        place(ivy, -119, 2.5, -0.4); ivy.visible = true; setFace(ivy, 'happy'); pose(ivy, { armRx: -1.5, headX: -0.2 }); pose(jonah, { headX: -0.25 });
        cam = lerpV(v3(-120, 3.2, 8), v3(-120, 3.6, 6.5), ease((t - vs('city')) / 3)); look = v3(-120, 7, -12); fov = 54;
      } break; }
    case 7: { mood = 'color'; sunAt(-150, -20);
      place(jonah, -151, 2.5, 0.4); jonah.visible = true; blinkFace(jonah, t, 'happy');
      place(ivy, -149, 2.5, -0.2); ivy.visible = true; setFace(ivy, 'laugh'); pose(ivy, { armLx: -2.5 + Math.sin(t * 6) * 0.3, armRx: -2.5 });
      pose(jonah, { armRx: -1.2 * Math.max(0, Math.sin(t * 5)) });
      cam = lerpV(v3(-150, 3.0, 8), v3(-150, 3.2, 6), ease(u)); look = v3(-150, 4, -18); fov = 56; break; }
    case 8: { mood = 'warm'; drawChalk('ocean', 1);
      place(jonah, -0.4, -1.0, Math.PI); jonah.visible = true; blinkFace(jonah, t, 'warm'); setBlush(jonah, true); pose(jonah, { armRx: -1.4, armRz: 0.2 });
      place(ivy, 1, -6.4, 0, 5.0); ivy.visible = true; setFace(ivy, 'warm'); setBlush(ivy, true); pose(ivy, { armLx: -1.4, armLz: -0.2 });
      cam = lerpV(v3(3.0, 4.2, 2.2), v3(2.6, 4.0, 1.4), ease(u)); look = v3(0.4, 4.2, -5); fov = 50; break; }
    case 9: { mood = 'grey'; drawChalk('ocean', 0); ivyWin.visible = true;
      place(jonah, -0.4, -1.0, Math.PI); jonah.visible = true; blinkFace(jonah, t, 'worried'); pose(jonah, { armLz: 0.1, armRz: -0.1, headX: 0.05 });
      cam = lerpV(v3(0.6, 2.9, 1.2), v3(0.5, 2.9, 0.4), ease(u)); look = v3(1, 5.6, -7.6); fov = 44; break; }
    case 10: { mood = 'grey'; drawChalk(t > vs('onelast') ? 'arrow' : 'ocean', t > vs('onelast') ? clamp((t - vs('onelast')) / 1.5) : 0);
      place(jonah, -0.4, -1.0, Math.PI); jonah.visible = true; blinkFace(jonah, t, 'sad');
      cam = lerpV(v3(0.8, 3.0, 1.0), v3(0.6, 3.0, 0.2), ease(u)); look = v3(1, 5.7, -7.6); fov = 42; break; }
    case 11: { mood = 'grey'; drawChalk('arrow', 1);
      place(jonah, -0.4, -1.0, Math.PI); jonah.visible = true; blinkFace(jonah, t, t > vs('yourturn') ? 'surprise' : 'sad');
      cam = lerpV(v3(0.3, 5.9, 0.0), v3(0.5, 5.85, -0.8), ease(u)); look = v3(1, 5.9, -7.6); fov = 40; break; }
    case 12: { mood = 'grey'; drawChalk('arrow', 1);
      place(jonah, 0.6, -2.0, Math.PI); jonah.visible = true; setFace(jonah, 'cry'); setTears(jonah, true, t);
      pose(jonah, { armLx: -2.3, armLz: -0.2, headX: 0.1, bodyX: 0.1 });
      cam = lerpV(v3(2.2, 3.0, 0.8), v3(1.9, 2.9, 0.2), ease(u)); look = v3(0.6, 2.6, -2.2); fov = 46; break; }
    case 13: { mood = t < vs('opened') ? 'grey' : 'warm';
      if (t < vs('opened')) { place(jonah, 0.6, -1.6, Math.PI); jonah.visible = true; blinkFace(jonah, t, 'worried'); pose(jonah, { armRx: -0.6 });
        cam = lerpV(v3(2.4, 2.6, 1.6), v3(2.0, 2.5, 1.0), ease(u * 1.5)); look = v3(0.6, 2.2, -2.2); }
      else { sunAt(30, -3); const op = ease((t - vs('opened')) / 1.2); door.rotation.y = -1.4 * op;
        place(jonah, 29.0, -0.2, 0); jonah.visible = true; setFace(jonah, 'surprise'); pose(jonah, { armLx: -0.3, armRx: -0.3, headX: -0.1 });
        cam = lerpV(v3(32.5, 2.6, 2.5), v3(32.8, 2.6, 1.6), ease((t - vs('opened')) / 2)); look = v3(29.6, 1.5, -2.6); fov = 54; }
      break; }
    case 14: { mood = 'color'; sunAt(30, -4);
      const wkk = clamp((t - vs('stepped')) / 3);
      place(jonah, 30.2, lerp(-2.4, 7.5, ease(wkk)), 0); jonah.visible = true; setFace(jonah, wkk > 0.3 ? 'happy' : 'surprise'); setBlush(jonah, true);
      if (wkk > 0.1 && wkk < 1) pose(jonah, walkPose(t * 7, 0.5));
      cam = lerpV(v3(30.2, 2.6, 11), v3(30.2, 2.8, 10), ease(u)); look = v3(30.2, 1.6, 0); fov = 56; break; }
    case 15: { mood = 'color'; sunAt(60, -20); scene.background.setHex(0xffb060);
      drawSand(clamp((t - vs('wrote')) / 2.0));
      place(jonah, 62.4, 2.0, -Math.PI/2 - 0.2); jonah.visible = true; blinkFace(jonah, t, t > vs('wish') ? 'warm' : 'smile'); setBlush(jonah, true);
      pose(jonah, { bodyX: 0.5, armLx: -1.2, headX: 0.35 });
      cam = lerpV(v3(60.2, 5.6, 8.2), v3(60.2, 5.0, 7.0), ease(u)); look = v3(60.2, 0.2, 1.8); fov = 56;
      tint = clamp((t - (sc.end - 2.0)) / 0.6) * 0.3; break; }
    case 16: { mood = 'color'; sunAt(60, -20); scene.background.setHex(0xff9a66);
      cam = lerpV(v3(62, 6, 10), v3(61, 7, 13), ease(u)); look = v3(60, 3, -6);
      if (lt > 0.3) { big = '<span style="font-size:92px">Who gave YOUR<br>world color?</span><br><br><span style="font-size:58px">Tag them 👇</span>'; sub = ''; bop = clamp((lt - 0.3) / 0.4); }
      tint = 0.12; break; }
  }
  setMood(mood);
  fireflies.forEach(m => { const d = m.userData; m.position.set(d.x, d.y + Math.sin(t * d.sp + d.ph) * 0.6, d.z); m.material.opacity = 0.5 + 0.5 * Math.sin(t * 3 + d.ph); });
  snow.forEach(m => { const d = m.userData; let y = (d.y - t * d.sp) % 10; if (y < 0) y += 10; m.position.set(d.x + Math.sin(t + d.z) * 0.5, y, d.z); });
  whale.rotation.z = Math.sin(t * 0.8) * 0.1;

  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.position.copy(cam); camera.lookAt(look); renderer.render(scene, camera);

  $('tint').style.opacity = tint; $('flash').style.opacity = 0;
  let hook = '', hop = 0;
  if (sc.id === 1 && lt < 3.2) { hook = '<span class="series">THE WINDOW SHE DREW</span>'; hop = clamp(lt / 0.3) * clamp((3.2 - lt) / 0.4); }
  setText('hook', hook, hop);
  const cap = (sc.id === 1 && lt < 3.2) ? null : TL.captions.find(c => t >= c.start && t < c.end + 0.12);
  $('cap').style.color = cap ? SPK_COLOR[cap.spk] : '#fff'; setText('cap', cap ? cap.text : '', cap ? 1 : 0);
  $('big').style.color = '#ffffff'; setText('big', big, bop); setText('sub', sub, bop); setText('sys', '', 0);
  return true;
};
window.DURATION = TL.duration; window.READY = true;
