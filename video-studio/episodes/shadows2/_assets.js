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
