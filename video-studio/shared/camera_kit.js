// ===== Camera kit: named shot types with a clear emotional purpose (learned from a course preview) =====
// Each function returns { cam: Vector3, look: Vector3, fov } for a local progress u in 0..1 (and time t for shake).
// WIDE     – establish the world (high, far, slow drift)
// AERIAL   – reveal the scale (drone orbit/fly-over looking down)
// SLOWZOOM – build tension (very slow push-in on a face, almost static)
// TRACKING – smooth side follow (camera moves parallel to a walking/running subject)
// ACTION   – follow the escape (low, close, behind/front, handheld shake)
// STEADY   – let the emotion land (locked-off, no movement at all)
import * as THREE from 'three';
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = u => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };

// smooth pseudo-random handheld shake (sum of sines, deterministic per t)
export function shake(t, amt = 0.06) { return v3(Math.sin(t * 13.1) * 0.6 + Math.sin(t * 7.3 + 1) * 0.4, Math.sin(t * 11.7 + 2) * 0.5 + Math.sin(t * 5.1) * 0.5, Math.sin(t * 9.3 + 4) * 0.3).multiplyScalar(amt); }

export const SHOT = {
  wide(center, u, o = {}) { const d = o.dist ?? 30, h = o.height ?? 12, a = (o.angle ?? 0.3) + (o.drift ?? 0.08) * ease(u); return { cam: v3(center.x + Math.sin(a) * d, center.y + h, center.z + Math.cos(a) * d), look: center.clone().add(v3(0, o.lookUp ?? 2, 0)), fov: o.fov ?? 50 }; },
  aerial(center, u, o = {}) { const r = o.radius ?? 18, h = o.height ?? 22, a = (o.angle ?? 0) + (o.sweep ?? 0.9) * ease(u); return { cam: v3(center.x + Math.sin(a) * r, center.y + h - (o.descend ?? 4) * ease(u), center.z + Math.cos(a) * r), look: center.clone(), fov: o.fov ?? 55 }; },
  slowZoom(head, dir, u, o = {}) { const d0 = o.from ?? 4.2, d1 = o.to ?? 2.6; const d = d0 + (d1 - d0) * ease(u); return { cam: head.clone().addScaledVector(dir, d).add(v3(0, o.up ?? 0.15, 0)), look: head.clone().add(v3(0, o.ly ?? -0.3, 0)), fov: o.fov ?? 38 }; },
  tracking(subject, travelDir, u, o = {}) { const side = v3(-travelDir.z, 0, travelDir.x).normalize(); const p = subject.clone().addScaledVector(side, o.dist ?? 4.5).add(v3(0, o.height ?? 1.8, 0)).addScaledVector(travelDir, o.lead ?? 0.6); return { cam: p, look: subject.clone().add(v3(0, o.lookY ?? 1.4, 0)).addScaledVector(travelDir, o.lead ?? 0.6), fov: o.fov ?? 48 }; },
  action(subject, travelDir, t, o = {}) { const front = o.front ?? true; const p = subject.clone().addScaledVector(travelDir, (front ? 1 : -1) * (o.dist ?? 3.2)).add(v3(o.offX ?? 0.6, o.height ?? 1.2, 0)).add(shake(t, o.shake ?? 0.07)); return { cam: p, look: subject.clone().add(v3(0, o.lookY ?? 1.7, 0)).add(shake(t + 3, (o.shake ?? 0.07) * 0.5)), fov: o.fov ?? 56 }; },
  steady(cam, look, o = {}) { return { cam: cam.clone(), look: look.clone(), fov: o.fov ?? 45 }; },
};

// mood colour per beat (fog colour, hemi sky, hemi ground, key light colour)
export const MOOD_COLOR = {
  neonNight: { fog: 0x2a1450, sky: 0x8a6aff, ground: 0x1a0a2a, key: 0xc8a0ff },
  coldFog: { fog: 0x8a9ab0, sky: 0xd0e0f0, ground: 0x3a4250, key: 0xd8e4ff },
  danger: { fog: 0x4a0a2a, sky: 0xff6aa0, ground: 0x2a0a1a, key: 0xff7a9a },
  goldenEmotion: { fog: 0xffb880, sky: 0xffe0c0, ground: 0x6a4a30, key: 0xffc080 },
};

// dip-to-black / crossfade amount around a cut at time tc (use for time jumps and chapter changes)
export function dip(t, tc, half = 0.18) { const d = Math.abs(t - tc); return d > half ? 0 : 1 - d / half; }
