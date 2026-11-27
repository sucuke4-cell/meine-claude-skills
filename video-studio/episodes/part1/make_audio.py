"""Mix voice-over with synthesized horror ambience and sound effects -> audio/mix.wav"""
import json
import numpy as np
import soundfile as sf

SR = 48000
TL = json.load(open("timeline.json"))
D = TL["duration"] + 0.3
n = int(D * SR)
t = np.arange(n) / SR
rng = np.random.default_rng(3)
S = {s["id"]: s for s in TL["scenes"]}

def lowpass(x, a):  # one-pole
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y

def env(x0, x1, fade_in=1.0, fade_out=1.0):
    e = np.clip((t - x0) / fade_in, 0, 1) * np.clip((x1 - t) / fade_out, 0, 1)
    return e

# --- music (cinematic underscore) ---
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "shared"))
from music import render_music
stop = TL["sfx"]["bass"]
cues = [(0, "mystery"), (S[5]["start"], "tension"), (stop, "silence"), (S[10]["start"], "dread"), (S[11]["start"], "climax"), (D - 1.6, "silence")]
mix = render_music(cues, D) * 0.30

def add(sig, at, gain=1.0):
    i = int(at * SR); j = min(n, i + len(sig))
    if i < n: mix[i:j] += sig[: j - i] * gain

def knock():
    L = int(0.35 * SR); tt = np.arange(L) / SR
    body = np.sin(2 * np.pi * 95 * tt) * np.exp(-tt * 22) + 0.5 * np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 35)
    click = lowpass(rng.standard_normal(L), 0.25) * np.exp(-tt * 90) * 1.5
    return (body + click) * 0.9

def boom():
    L = int(2.2 * SR); tt = np.arange(L) / SR
    f = 30 + 60 * np.exp(-tt * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-tt * 1.6) + lowpass(rng.standard_normal(L), 0.05) * 3 * np.exp(-tt * 4)) * 0.9

def heartbeat():
    L = int(0.6 * SR); tt = np.arange(L) / SR
    b = lambda d: np.sin(2 * np.pi * 52 * (tt - d)) * np.exp(-np.clip(tt - d, 0, None) * 18) * (tt >= d)
    return (b(0) + 0.7 * b(0.18)) * 0.7

def creak(length=3.2):
    L = int(length * SR); tt = np.arange(L) / SR
    f = 160 + 120 * np.sin(2 * np.pi * 0.6 * tt) + 40 * np.sin(2 * np.pi * 7 * tt)
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    grit = (rng.random(L) < 0.02) * rng.standard_normal(L)
    am = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 11 * tt))
    s = lowpass(saw * am + grit * 0.6, 0.18)
    return s * np.clip(tt / 0.3, 0, 1) * np.clip((length - tt) / 0.6, 0, 1) * 0.55

def whoosh(length=2.5):
    L = int(length * SR); tt = np.arange(L) / SR
    return lowpass(rng.standard_normal(L), 0.06) * 2.0 * np.sin(np.pi * tt / length) ** 2 * 0.5

for k in TL["sfx"]["knocks"]:
    add(knock(), k, 1.0)
add(boom(), stop, 1.0)
hb_t = stop + 0.9
while hb_t < S[11]["start"] + 0.5:
    add(heartbeat(), hb_t, 0.9); hb_t += 0.85
add(creak(), TL["sfx"]["creak"], 1.0)
add(whoosh(), TL["sfx"]["creak"] + 1.2, 1.0)
# soft sting under "PART 2?"
add(boom() * 0.6, S[11]["end"] - 2.0, 1.0)

# --- voice ---
voice = np.zeros(n)
for v in TL["vo"]:
    s, sr = sf.read(v["file"])
    if sr != SR:
        idx = np.arange(0, len(s), sr / SR)
        s = np.interp(idx, np.arange(len(s)), s)
    i = int(v["start"] * SR); j = min(n, i + len(s))
    voice[i:j] += s[: j - i]
# duck bed under voice
vol = lowpass(np.abs(voice), 0.0008)
duck = 1 - np.clip(vol * 6, 0, 0.45)
out = mix * duck + voice * 1.0
out = np.tanh(out * 1.2); out *= 0.95 / np.max(np.abs(out))
fade = np.clip((D - t) / 0.4, 0, 1)
out *= fade
sf.write("audio/mix.wav", np.stack([out, out], 1).astype(np.float32), SR)
print("mix", D, "s, peak", float(np.max(np.abs(out))))
