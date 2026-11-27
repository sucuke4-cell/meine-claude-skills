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
