"""Procedural cinematic underscore (no samples, no hiss).

render_music(cues, duration) -> mono float array at SR.
cues: list of (start_seconds, mood). Moods:
  mystery, tension, action, sad, otherworld, dread, climax, silence
"""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
BPM = 84
BEAT = 60 / BPM

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)

def piano(f, dur=2.5, vel=1.0):
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros_like(t)
    for k in range(1, 7):
        fk = f * k * (1 + 0.0004 * k * k)
        if fk > 9000: break
        s += np.sin(2 * np.pi * fk * t) / k ** 1.4 * np.exp(-t * (1.2 + 0.9 * k))
    return s * np.clip(t / 0.004, 0, 1) * vel

def musicbox(f, dur=1.8, vel=1.0):
    t = np.arange(int(dur * SR)) / SR
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 4.02 * t) * np.exp(-t * 6)
    return s * np.exp(-t * 2.6) * np.clip(t / 0.002, 0, 1) * vel

def strings(notes, dur, attack=1.0, release=1.0, bright=1600):
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros_like(t)
    for m in notes:
        for det in (-0.18, 0.0, 0.18):
            f = hz(m) * (1 + det / 100)
            vib = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * t + m)
            ph = 2 * np.pi * f * np.cumsum(vib) / SR
            for k in range(1, 9):  # band-limited saw
                if f * k > 8000: break
                s += np.sin(k * ph) / k
    s = lp(s, bright) / (len(notes) * 3)
    env = np.clip(t / attack, 0, 1) * np.clip((dur - t) / release, 0, 1)
    return s * env

def sub(f, dur=0.5, vel=1.0):
    t = np.arange(int(dur * SR)) / SR
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 7) * np.clip(t / 0.01, 0, 1) * vel

def tom(vel=1.0, f0=130, f1=55):
    t = np.arange(int(0.7 * SR)) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * vel

def tick(vel=1.0):
    t = np.arange(int(0.05 * SR)) / SR
    return (np.sin(2 * np.pi * 1450 * t) + 0.5 * np.sin(2 * np.pi * 2210 * t)) * np.exp(-t * 120) * vel

def braam(root, dur):
    s = strings([root - 12, root - 5, root], dur, attack=0.25, release=1.2, bright=700) * 2.2
    return s

PROG = {  # (chord tones as midi), one chord per bar
    'minor': [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],      # Am F C G
    'sad':   [[53, 57, 60], [48, 52, 55], [57, 60, 64], [55, 59, 62]],      # F C Am G
    'other': [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]],      # Dm Bb Gm A
    'dread': [[57, 60, 63], [56, 59, 62], [57, 60, 63], [53, 56, 59]],      # Adim-ish clusters
}
OSTINATO = [0, 2, 1, 2, 0, 2, 1, 2]  # indexes into chord, eighth notes
MB_MEL = [81, 84, 88, 87, 84, 81, 80, 76]

def render_section(mood, a, b, out, rng):
    bar = 4 * BEAT
    bar0 = int(np.floor(a / bar))
    tb = bar0 * bar
    while tb < b:
        ci = int(round(tb / bar)) % 4
        prog = PROG['sad' if mood == 'sad' else 'other' if mood == 'otherworld' else 'dread' if mood in ('dread', 'climax') else 'minor']
        ch = prog[ci]
        def put(sig, at, g):
            if at < a - 0.01 or at >= b: return
            i = int(at * SR); j = min(len(out), i + len(sig))
            if i < len(out): out[i:j] += sig[: j - i] * g
        # pad / strings for the bar (clipped to section by the window later)
        if mood != 'silence':
            st = strings([m - 12 for m in ch] + [ch[0]], bar + 1.2, attack=0.6, release=1.0, bright=1100 if mood in ('sad', 'mystery') else 1500)
            put(st, max(tb, a), {'mystery': 0.22, 'tension': 0.25, 'action': 0.25, 'sad': 0.30, 'otherworld': 0.22, 'dread': 0.26, 'climax': 0.30}[mood])
        for k in range(8):  # eighth-note grid
            t8 = tb + k * BEAT / 2
            if mood in ('mystery', 'tension', 'action', 'climax'):
                m = ch[OSTINATO[k]] + (12 if mood != 'mystery' else 0)
                put(piano(hz(m), 1.6, 0.9 if k % 2 == 0 else 0.6), t8, {'mystery': 0.07, 'tension': 0.08, 'action': 0.09, 'climax': 0.08}[mood])
            if mood == 'sad' and k in (0, 3, 4, 6):
                put(piano(hz(ch[[0, 1, 2, 1][[0, 3, 4, 6].index(k)]] + 12), 3.0, 0.9), t8, 0.10)
            if mood == 'otherworld' and k % 2 == 0:
                put(musicbox(hz(MB_MEL[(int(tb / bar) * 4 + k // 2) % 8]), 1.8), t8, 0.06)
            if mood in ('tension', 'action', 'climax') and k % 2 == 1:
                put(tick(), t8, 0.025 if mood == 'tension' else 0.035)
        for k in range(4):  # beats
            tq = tb + k * BEAT
            if mood in ('mystery', 'tension', 'dread', 'otherworld'):
                if k in (0, 2) or mood == 'tension':
                    put(sub(hz(ch[0] - 24), 0.6, 1.0), tq, 0.35 if mood != 'mystery' else 0.25)
            if mood in ('action', 'climax'):
                put(sub(hz(ch[0] - 24), 0.4, 1.0), tq, 0.4); put(sub(hz(ch[0] - 24), 0.3), tq + BEAT / 2, 0.25)
            if mood == 'climax' and k in (0, 2, 3):
                put(tom(1.0, 140 if k else 110, 55), tq, 0.35)
            if mood == 'action' and k == 0:
                put(tom(0.8), tq, 0.3)
        if mood in ('dread', 'climax') and ci % 2 == 0:
            put(braam(ch[0] - 12, bar * 2), tb, 0.35 if mood == 'climax' else 0.25)
        tb += bar

def reverb(x, secs=2.4, mix=0.25):
    rng = np.random.default_rng(1)
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.2)
    ir = lp(ir, 3500); ir /= np.sqrt(np.sum(ir ** 2))
    wet = fftconvolve(x, ir)[: len(x)]
    return x * (1 - mix) + wet * mix

def render_music(cues, duration, fade=0.6):
    n = int(duration * SR)
    out = np.zeros(n)
    rng = np.random.default_rng(2)
    cues = sorted(cues) + [(duration, 'silence')]
    t = np.arange(n) / SR
    for (a, mood), (b, _) in zip(cues[:-1], cues[1:]):
        if mood == 'silence' or b <= a: continue
        sec = np.zeros(n)
        render_section(mood, a, b + fade, sec, rng)
        w = np.clip((t - a) / fade + 1, 0, 1) * np.clip((b + fade - t) / fade, 0, 1)
        out += sec * w
    out = reverb(out)
    return out / (np.max(np.abs(out)) + 1e-9)
