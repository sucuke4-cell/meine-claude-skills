"""One-off helper: turns the Part 3 scene.js (copied here) into Part 4. Kept for reference."""
import pathlib

p = pathlib.Path('scene.js'); s = p.read_text()

# collect the door frame meshes so the whole door can disappear
s = s.replace("const frameM = mat(0x2a1a12);", "const frameM = mat(0x2a1a12);\nconst doorFrames = [];")
s = s.replace("const f = box(w, h, 0.5, frameM); f.position.set(x, y, DOOR_Z - 0.05); scene.add(f);",
              "const f = box(w, h, 0.5, frameM); f.position.set(x, y, DOOR_Z - 0.05); scene.add(f); doorFrames.push(f);")

ASSETS = r'''
// ---------- Part 4 assets ----------
const doorParts = [doorPivot, glow, ring, ...doorFrames];
// Milo's shadow: it has the Keeper's shape
const shadowTex = canvasTex(256, 512, (g) => {
  const rects = [[78, 18, 100, 100], [56, 118, 144, 175], [14, 122, 42, 250], [200, 122, 42, 250], [66, 290, 54, 210], [136, 290, 54, 210]];
  g.shadowColor = '#ff2020'; g.shadowBlur = 18; g.fillStyle = 'rgba(70,0,0,0.9)'; rects.forEach(r => g.fillRect(...r));
  g.shadowBlur = 0; g.fillStyle = 'rgba(5,0,0,0.95)'; rects.forEach(([x, y, w, h]) => g.fillRect(x + 6, y + 6, w - 12, h - 12));
  g.fillStyle = 'rgba(255,30,30,1)'; g.fillRect(100, 58, 22, 12); g.fillRect(134, 58, 22, 12);
});
const miloShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0, toneMapped: false }));
miloShadow.rotation.x = -Math.PI / 2; miloShadow.position.set(0, 0.03, -2.9); milo.add(miloShadow);
// puffs for vanishing / returning players
const puffPool = []; { const r = rng(31);
  for (let k = 0; k < 10; k++) { const arr = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, toneMapped: false }));
      m.userData = { x: (r() - 0.5) * 0.9, y: 0.3 + r() * 2.2, z: (r() - 0.5) * 0.7, vy: 0.6 + r() * 1.2, vx: (r() - 0.5) * 0.6, s: r() * 6 };
      m.visible = false; scene.add(m); arr.push(m);
    } puffPool.push(arr); } }
function puffAt(k, x, z, age, color, inward = false) {
  if (age > 1.3) return;
  puffPool[k].forEach(m => { const d = m.userData; const a = inward ? 1.3 - age : age; m.visible = true; m.material.color.setHex(color);
    m.position.set(x + d.x + d.vx * a, d.y + d.vy * a, z + d.z); m.rotation.set(a * d.s, a * d.s, 0); m.material.opacity = clamp(1 - age / 1.3); });
}
// door debris
const debris = []; { const r = rng(41);
  for (let i = 0; i < 34; i++) {
    const m = box(0.4 + r() * 0.4, 0.4 + r() * 0.6, 0.18, i % 3 ? slabM : frameM);
    m.userData = { p: v3((r() - 0.5) * 3.2, 0.3 + r() * 4.8, DOOR_Z), v: v3((r() - 0.5) * 6, 1 + r() * 5, 3 + r() * 6), s: (r() - 0.5) * 12 };
    m.visible = false; scene.add(m); debris.push(m);
  } }
// the blue door (final scene)
const blueG = new THREE.Group(); blueG.position.set(5.6, 0, -6.12); scene.add(blueG);
const blueSlabM = mat(0x2a6bff, { emissive: 0x0a2a88, emissiveIntensity: 1.2, roughness: 0.5 });
{ for (const [x, y, w, h] of [[-0.95, 1.45, 0.25, 3.0], [0.95, 1.45, 0.25, 3.0], [0, 3.0, 2.15, 0.25]]) { const f = box(w, h, 0.35, 0x1a1a2a); f.position.set(x, y, -0.05); blueG.add(f); }
  const bglow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.9), new THREE.MeshBasicMaterial({ color: 0x40a0ff, toneMapped: false })); bglow.position.set(0, 1.45, -0.1); blueG.add(bglow); }
const bluePivot = new THREE.Group(); bluePivot.position.set(-0.85, 0, 0.02); blueG.add(bluePivot);
{ const bs = box(1.7, 2.9, 0.14, blueSlabM); bs.position.set(0.85, 1.45, 0); bluePivot.add(bs);
  const bk = box(0.14, 0.14, 0.14, gold); bk.position.set(1.5, 1.35, 0.12); bluePivot.add(bk); }
const blueLight = new THREE.PointLight(0x4aa8ff, 0, 9, 1.4); blueLight.position.set(5.6, 2.0, -5.2); scene.add(blueLight);
const WARM_SKY = new THREE.Color(0xffd9b0), FOG_WARM = new THREE.Color(0x3b3350);

'''
s = s.replace("// ---------- DOM ----------", ASSETS + "// ---------- DOM ----------")
s = s.replace("  admin.userData.P.crown.visible = true;", "  admin.userData.P.crown.visible = true; blueG.visible = false; miloShadow.material.opacity = 0;\n  debris.forEach(d => d.visible = false); puffPool.forEach(a => a.forEach(m => m.visible = false));")

a = s.index("  // lobby crowd (5 regular players)"); b = s.index("  // world state")
s = s[:a] + pathlib.Path('_switch.js').read_text() + s[b:]
s = s.replace("  let rule2Draw = 1, rule3Draw = 0,", "  let doorOn = 1, doorBreak = -1, dark = 0, warm = 0, glitch = 0, shadowOp = 0, blueOn = 0, blueOpen = 0;\n  let rule2Draw = 1, rule3Draw = 0,")

WORLD = r'''  // world state (part 4)
  doorParts.forEach(o => o.visible = doorOn > 0);
  debris.forEach(m => { if (doorBreak < 0 || doorBreak > 3) { m.visible = false; return; } const d = m.userData; m.visible = true;
    m.position.set(d.p.x + d.v.x * doorBreak, Math.max(0.2, d.p.y + d.v.y * doorBreak - 4.9 * doorBreak * doorBreak), d.p.z + d.v.z * doorBreak); m.rotation.set(d.s * doorBreak, d.s * doorBreak * 0.7, 0); });
  miloShadow.material.opacity = shadowOp;
  blueG.visible = blueOn > 0; bluePivot.rotation.y = -1.3 * blueOpen; blueLight.intensity = blueOn ? 10 + 30 * blueOpen : 0;
'''
s = s.replace("  // world state\n", WORLD + "  // world state\n", 1)

# lights: darkness and warm ending
s = s.replace("  lampL.intensity = lampR.intensity = (inside ? 0 : 5) * (0.9 + 0.1 * Math.sin(t * 13));",
              "  lampL.intensity = lampR.intensity = (inside ? 0 : 5) * (0.9 + 0.1 * Math.sin(t * 13)) * (1 - dark) * (1 + warm);\n  hemi.intensity *= (1 - 0.65 * dark) * (1 + 0.5 * warm); moon.intensity *= (1 - 0.75 * dark);\n  if (warm > 0) hemi.color.copy(HEMI_SKY).lerp(WARM_SKY, warm);\n  doorLight.intensity *= doorOn; innerLight.intensity *= doorOn;")
s = s.replace("  scene.fog.color.copy(fogC);", "  if (warm > 0) fogC.copy(FOG_BASE).lerp(FOG_WARM, warm);\n  scene.fog.color.copy(fogC);")
s = s.replace("const fogC = inside ? FOG_IN : FOG_BASE.clone().lerp(FOG_RED, fogRed * open * 0.8);",
              "const fogC = inside ? FOG_IN.clone() : FOG_BASE.clone().lerp(FOG_RED, fogRed * open * 0.8 * doorOn);")

a = s.index("  let hook = '', hookOp = 0;"); b = s.index("  $('big').style.color = bigColor;")
OVER = r'''  let hook = '', hookOp = 0;
  if (sc.id === 1 && lt < 3.0) { hook = '<span class="part">PART 4</span><br>THE <em>FINALE</em>'; hookOp = clamp(lt / 0.25) * clamp((3.0 - lt) / 0.3); }
  setText('hook', hook, hookOp);
  const cap = (sc.id === 1 && lt < 3.0) ? null : TL.captions.find(c => t >= c.start && t < c.end + 0.12);
  const capEl = $('cap'); capEl.style.color = cap ? SPK_COLOR[cap.spk] : '#fff';
  setText('cap', cap ? cap.text : '', cap ? 1 : 0);
  let big = '', sub = '', bop = 0, bigColor = '#ffffff';
  if (sc.id === 13 && t >= sc.end - 3.6) { big = 'THE END'; sub = 'Follow for the<br>next story 👇'; bop = clamp((t - (sc.end - 3.6)) / 0.4); }
  setText('sys', sysMsg, sysMsg ? 1 : 0);
  const ge = $('glitch');
  if (glitch > 0) { const r = rng(Math.floor(t * 30) + 7); let bars = [];
    for (let i = 0; i < 9; i++) { const y = Math.floor(r() * 100), h = 1 + Math.floor(r() * 5); const c = ['rgba(255,0,60,.55)', 'rgba(0,255,220,.45)', 'rgba(255,255,255,.35)'][i % 3]; bars.push(`linear-gradient(transparent ${y}%, ${c} ${y}%, ${c} ${y + h}%, transparent ${y + h}%)`); }
    ge.style.background = bars.join(','); ge.style.opacity = glitch; ge.style.transform = `translateX(${(r() - 0.5) * 40 * glitch}px)`;
  } else ge.style.opacity = 0;
'''
s = s[:a] + OVER + s[b:]
p.write_text(s)
print('patched')
