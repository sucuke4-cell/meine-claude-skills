// ===== HUD kit: game-style 2D overlays on top of the 3D canvas (learned from studying viral "In This Town" shorts) =====
// Use: import { initHUD, popWord, meter, stamp, targetCard, speedLines } from '../../shared/hud_kit.js';
// initHUD() once; then call the setters every frame with the current time. Everything is plain HTML/CSS (sharp text, cheap).
// All positions are in the 1080x1920 frame; keep things inside the TikTok safe zone x 90–990, y 120–1600.

const FONT_URL = '/node_modules/@fontsource/lilita-one/files/lilita-one-latin-400-normal.woff2'; // OFL licence, free for commercial use
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = u => 1 - Math.pow(1 - clamp(u), 3);
const el = {};

export function initHUD() {
  const css = document.createElement('style');
  css.textContent = `
  @font-face { font-family: 'Lilita'; src: url(${FONT_URL}) format('woff2'); }
  .hud { position: absolute; pointer-events: none; font-family: 'Lilita', 'Inter', sans-serif; }
  #hudWord { left: 60px; right: 60px; top: 1130px; text-align: center; font-size: 118px; color: #fff35c;
    -webkit-text-stroke: 18px #000; paint-order: stroke fill; letter-spacing: 1px; transform-origin: 50% 60%;
    text-shadow: 0 10px 0 rgba(0,0,0,.55); }
  .meter { padding: 14px 34px 14px 22px; border-radius: 60px; background: linear-gradient(#f4fff6, #c9f7d6); border: 7px solid #2bd46b;
    color: #fff; font-size: 84px; -webkit-text-stroke: 11px #1a7a3a; paint-order: stroke fill; display: flex; gap: 14px; align-items: center;
    box-shadow: 0 8px 0 rgba(0,0,0,.25); transform-origin: 30% 100%; }
  .meter::after { content: ''; position: absolute; left: 50px; bottom: -34px; border: 18px solid transparent; border-top: 22px solid var(--c, #2bd46b); }
  .meter .ico { font-size: 76px; -webkit-text-stroke: 0; }
  #hudStamp { left: 70px; right: 70px; top: 760px; text-align: center; color: #fff; font-size: 128px; line-height: .98;
    -webkit-text-stroke: 16px #8a0010; paint-order: stroke fill; text-shadow: 0 0 40px rgba(255,40,60,.85); }
  #hudStamp small { display: block; font-size: 60px; color: #ffd6da; -webkit-text-stroke: 9px #8a0010; margin-top: 10px; }
  #hudTarget { left: 0; right: 0; top: 230px; text-align: center; color: #ff3b5c; font-size: 96px; -webkit-text-stroke: 4px #3a0010; paint-order: stroke fill;
    text-shadow: 0 0 30px rgba(255,40,90,.9); }
  #hudTarget small { display: block; font-size: 44px; color: #fff; letter-spacing: 6px; text-shadow: none; -webkit-text-stroke: 0; }
  #hudTarget .ring { width: 300px; height: 300px; margin: 40px auto 0; border: 12px solid #ff3b5c; border-radius: 50%; position: relative;
    box-shadow: 0 0 40px rgba(255,40,90,.8), inset 0 0 40px rgba(255,40,90,.6); }
  #hudTarget .ring::before, #hudTarget .ring::after { content: ''; position: absolute; background: #ff3b5c; }
  #hudTarget .ring::before { left: 50%; top: -60px; bottom: -60px; width: 12px; margin-left: -6px; }
  #hudTarget .ring::after { top: 50%; left: -60px; right: -60px; height: 12px; margin-top: -6px; }
  #hudLines { left: 0; top: 0; width: 1080px; height: 1920px; }`;
  document.head.appendChild(css);
  const add = (id, cls = '') => { const d = document.createElement(cls === 'canvas' ? 'canvas' : 'div'); d.id = id; d.className = 'hud ' + (cls === 'canvas' ? '' : cls); d.style.opacity = 0; document.body.appendChild(d); return d; };
  el.lines = add('hudLines', 'canvas'); el.lines.width = 1080; el.lines.height = 1920;
  el.stamp = add('hudStamp'); el.target = add('hudTarget'); el.word = add('hudWord');
  el.meters = {};
}

// ONE word at a time, pops in (scale 1.25 → 1) at its start. hl = colour for a highlighted word (rule word, money, colour names).
export function popWord(word, t0, t, hl) {
  const w = el.word; if (!word) { w.style.opacity = 0; return; }
  const k = easeOut((t - t0) / 0.1); w.style.opacity = 1; w.style.transform = `scale(${1.25 - 0.25 * k}) rotate(${(1 - k) * -3}deg)`;
  w.style.color = hl || '#fff35c'; if (w.textContent !== word) w.textContent = word;
}

// speech-bubble style stat meter that floats over a character's head ("♥ 100%", "⚡ 3%", "$ 1,000").
// pos = {x,y} screen px (project the head with camera, see story-video-studio), show = 0..1 fade/scale.
export function meter(id, icon, text, pos, show = 1, color = '#2bd46b') {
  let m = el.meters[id];
  if (!m) { m = document.createElement('div'); m.className = 'hud meter'; m.innerHTML = '<span class="ico"></span><span class="val"></span>'; document.body.appendChild(m); el.meters[id] = m; }
  m.style.opacity = clamp(show); m.style.left = pos.x + 'px'; m.style.top = pos.y + 'px';
  m.style.transform = `translate(-30%,-100%) scale(${0.6 + 0.4 * easeOut(show)})`; m.style.borderColor = color; m.style.setProperty('--c', color);
  m.querySelector('.ico').textContent = icon; m.querySelector('.ico').style.color = color; m.querySelector('.val').style.webkitTextStroke = '11px ' + color; m.querySelector('.val').textContent = text;
}

// big red title stamp for a twist / chapter ("THE FIRST INFECTED"), slams in from 1.6x.
export function stamp(title, sub, t0, t, dur = 1.6) {
  const s = el.stamp, u = (t - t0); if (!title || u < 0 || u > dur) { s.style.opacity = 0; return; }
  const k = easeOut(u / 0.15); s.style.opacity = Math.min(1, (dur - u) / 0.2);
  s.style.transform = `scale(${1.6 - 0.6 * k})`; s.innerHTML = title + (sub ? `<small>${sub}</small>` : '');
}

// game-show target card ("THE HUNT" / "CONTESTANT") with a pulsing crosshair ring.
export function targetCard(title, sub, show, t) {
  const c = el.target; c.style.opacity = clamp(show); if (show <= 0) return;
  if (!c.dataset.t || c.dataset.t !== title + sub) { c.innerHTML = `${title}<small>${sub}</small><div class="ring"></div>`; c.dataset.t = title + sub; }
  c.querySelector('.ring').style.transform = `scale(${1 + 0.06 * Math.sin(t * 8)})`;
}

// anime speed lines around a point (shock, anger, sudden realisation). amt 0..1.
export function speedLines(cx, cy, amt, t, color = 'rgba(255,255,255,0.85)') {
  const c = el.lines, g = c.getContext('2d'); g.clearRect(0, 0, 1080, 1920); c.style.opacity = amt > 0 ? 1 : 0; if (amt <= 0) return;
  g.fillStyle = color; const n = 46, frame = Math.floor(t * 12);
  for (let i = 0; i < n; i++) {
    const r1 = ((i * 7919 + frame * 104729) % 1000) / 1000; const a = (i / n) * Math.PI * 2 + r1 * 0.12;
    const inner = 330 + r1 * 160, outer = 1400, wdt = (0.006 + r1 * 0.01) * amt;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    g.lineTo(cx + Math.cos(a - wdt) * outer, cy + Math.sin(a - wdt) * outer); g.lineTo(cx + Math.cos(a + wdt) * outer, cy + Math.sin(a + wdt) * outer); g.fill();
  }
}

// project a 3D point to frame pixels (for meters over heads)
export function toScreen(v, camera) { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * 1080, y: (1 - p.y) / 2 * 1920, behind: p.z > 1 }; }
