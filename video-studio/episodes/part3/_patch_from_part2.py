"""One-off helper: turns the Part 2 scene.js (copied here) into Part 3. Kept for reference."""
import pathlib, re

p = pathlib.Path('scene.js'); s = p.read_text()

# 1) crown becomes its own group (so it can be taken off)
s = s.replace("""    const base = box(0.82, 0.16, 0.82, 0xf1c40f); base.position.y = 0.45; head.add(base);
    for (const [x, z] of [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32], [0, 0.32]]) {
      const sp = box(0.16, 0.24, 0.16, mat(0xf1c40f, { metalness: 0.7, roughness: 0.3 })); sp.position.set(x, 0.62, z); head.add(sp);
    }""", """    const cg = makeCrown(); head.add(cg); P.crown = cg;""")

ASSETS = r'''
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

'''
s = s.replace("// ---------- DOM ----------", ASSETS + "// ---------- DOM ----------")
s = s.replace("const SPK_COLOR = { N: '#ffffff', M: '#8fd8ff', J: '#ffd23f', A: '#f1c40f', K: '#ff4545', AK: '#ff4545' };",
              "const SPK_COLOR = { N: '#ffffff', M: '#8fd8ff', MF: '#8fd8ff', J: '#ffd23f', A: '#f1c40f', K: '#ff4545', AK: '#ff4545', P: '#9be37a' };")
s = s.replace("""  held.visible = false;
  for (const a of [milo, juno, admin, keeper]) if (a.userData.P.tag) a.userData.P.tag.visible = false;""",
"""  held.visible = false; heldCrown.visible = false; doorCrown.visible = false; sign3.visible = false;
  vanished.forEach(v => v.visible = false);
  for (const a of [milo, juno, admin, keeper]) if (a.userData.P.tag) a.userData.P.tag.visible = false;
  admin.userData.P.crown.visible = true;""")

a = s.index("  switch (sc.id) {"); b = s.index("  // world state")
SWITCH = pathlib.Path('_switch.js').read_text()
s = s[:a] + SWITCH + s[b:]

a = s.index("  let hook = '', hookOp = 0;"); b = s.index("  $('big').style.color = bigColor;")
OVER = r'''  let hook = '', hookOp = 0;
  if (sc.id === 1 && lt < 3.0) { hook = '<span class="part">PART 3</span><br>Will Juno<br>save <span style="color:#8fd8ff">Milo</span>?'; hookOp = clamp(lt / 0.25) * clamp((3.0 - lt) / 0.3); }
  setText('hook', hook, hookOp);
  const cap = (sc.id === 1 && lt < 3.0) ? null : TL.captions.find(c => t >= c.start && t < c.end + 0.12);
  const capEl = $('cap'); capEl.style.color = cap ? SPK_COLOR[cap.spk] : '#fff';
  setText('cap', cap ? cap.text : '', cap ? 1 : 0);
  let big = '', sub = '', bop = 0, bigColor = '#ff2a2a';
  if (sc.id === 12 && rule3Draw >= 1) { big = '<span style="font-size:92px">RULE #3</span><br><span style="font-size:104px">NEVER LEAVE<br>A FRIEND BEHIND</span>'; bigColor = '#7dffa8'; bop = clamp((t - (sc.end - 1.9)) / 0.25); }
  if (sc.id === 13 && t >= sc.end - 3.0) { big = 'PART 4?'; sub = 'Is <span style="color:#8fd8ff">Milo</span> really<br>still Milo? 👇'; bop = clamp((t - (sc.end - 3.0)) / 0.3); }
  setText('sys', sysMsg, sysMsg ? 1 : 0);
'''
s = s[:a] + OVER + s[b:]
s = s.replace("  drawRule2(rule2Draw);\n", "  drawRule2(rule2Draw); drawRule3(rule3Draw);\n  crownLight.intensity = crownGlow * 8; crownGlowM.emissiveIntensity = 0.3 + crownGlow * 2.5;\n  sign3Light.intensity = sign3.visible ? 6 * rule3Draw : 0;\n  edgeGlow.material.opacity = clamp(edge);\n")
s = s.replace("  let rule2Draw = 0;\n", "  let rule2Draw = 1, rule3Draw = 0, crownGlow = 0, edge = 0, sysMsg = '', chains = 1, chainT = -1;\n")
s = s.replace("  innerLight.intensity = open * 90 * fl;", "  innerLight.intensity = open * 90 * fl;\n  links.forEach(m => { const d = m.userData; m.visible = chains > 0; if (chainT < 0) { m.position.copy(d.base); m.rotation.copy(d.rot); } else { m.position.set(d.base.x + d.v.x * chainT, Math.max(0.05, d.base.y + d.v.y * chainT - 4.9 * chainT * chainT), d.base.z + d.v.z * chainT); m.rotation.set(d.rot.x + d.s * chainT, d.rot.y + d.s * chainT * 0.6, d.rot.z); } });\n  lockG.visible = chains > 0; if (chainT < 0) lockG.position.set(0, 2.5, DOOR_Z + 0.42); else lockG.position.set(lockG.userData.v.x * chainT, Math.max(0.25, 2.5 + lockG.userData.v.y * chainT - 4.9 * chainT * chainT), DOOR_Z + 0.42 + lockG.userData.v.z * chainT);")
p.write_text(s)
print('patched')
