"""Temple soundtrack: mystery/tension score, jungle night ambience, stone rumbles, eye-glow chimes, crystal melt."""
import json, sys, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "shared"))
from music import render_music
SR = 48000
TL = json.load(open("timeline.json")); VO = TL["vo"]; S = {s["id"]: s for s in TL["scenes"]}
D = TL["duration"] + 0.3; n = int(D * SR); t = np.arange(n) / SR
rng = np.random.default_rng(11); vs = lambda k: VO[k]["start"]
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
mix = np.zeros(n)
def add(sig, at, g=1.0):
    i = int(at * SR); j = min(n, i + len(sig))
    if 0 <= i < n: mix[i:j] += sig[: j - i] * g
def tone(f, L, decay, harm=(1, 0.3, 0.1)):
    tt = np.arange(int(L * SR)) / SR
    return sum(a * np.sin(2 * np.pi * f * (k + 1) * tt) for k, a in enumerate(harm)) * np.exp(-tt * decay) * np.clip(tt / 0.003, 0, 1)
def rumble(L, g=1.0):
    x = lp(rng.standard_normal(int(L * SR)), 90) * 5; e = np.sin(np.linspace(0, np.pi, len(x))); return x * e * g
def chord(fs, L, g=1.0):
    tt = np.arange(int(L * SR)) / SR; return sum(np.sin(2 * np.pi * f * tt) for f in fs) / len(fs) * np.clip(tt / 0.3, 0, 1) * np.exp(-np.maximum(tt - L * 0.6, 0) * 4) * g
cues = [(0, "mystery"), (S[2]["start"], "sad"), (S[3]["start"], "mystery"), (S[4]["start"], "warm"), (S[5]["start"], "mystery"),
        (vs("blinked"), "tension"), (S[6]["start"], "dread"), (S[7]["start"], "tension"), (S[8]["start"], "mystery"), (vs("crane_lie"), "tension"),
        (S[9]["start"], "otherworld"), (S[10]["start"], "dread"), (S[11]["start"], "climax"), (vs("stone") + 1.2, "silence"),
        (S[12]["start"], "sad"), (vs("green") - 0.1, "hope"), (S[14]["start"], "warm"), (S[15]["start"], "hope"), (S[15]["end"] - 0.8, "silence")]
mix += render_music(cues, D) * 0.27
# jungle ambience: insects (soft high band, pulsing) and a few birds, outside scenes only
for a, b in [(0, S[1]["end"]), (S[4]["start"], S[6]["end"]), (S[14]["start"], S[15]["end"])]:
    i0, i1 = int(a * SR), int(b * SR); x = bp(rng.standard_normal(i1 - i0), 3500, 6000)
    env = 0.5 + 0.5 * np.sin(2 * np.pi * 7 * np.arange(i1 - i0) / SR) ** 2; ramp = np.clip(np.minimum(np.arange(i1 - i0), np.arange(i1 - i0)[::-1]) / (0.6 * SR), 0, 1)
    mix[i0:i1] += x * env * ramp * 0.004
    k = a + 0.7
    while k < b - 0.5:
        add(tone(1800 + rng.random() * 1400, 0.12, 30, (1,)), k, 0.02); add(tone(1600 + rng.random() * 1200, 0.1, 30, (1,)), k + 0.13, 0.015); k += 1.6 + rng.random() * 2
# temple interior: low room tone
i0, i1 = int(S[7]["start"] * SR), int(S[13]["end"] * SR); mix[i0:i1] += lp(rng.standard_normal(i1 - i0), 160) * 0.05
# eyes opening / glowing
for k in ["hook", "watching"]: add(chord([220, 277, 330], 2.0, 0.6), vs(k) + 0.4, 0.06)
add(chord([110, 117], 1.4, 1), vs("blinked") + 0.5, 0.08)
add(chord([110, 117, 165], 2.2, 1), vs("crane_lie") + 1.1, 0.08)
add(chord([523, 659, 784], 2.0, 1), vs("zuri_true") + 1.1, 0.07)
add(chord([110, 117, 165], 2.5, 1), vs("grabbed") + 1.0, 0.09)
add(chord([523, 659, 784, 1047], 3.0, 1), vs("green") - 0.1, 0.08)
# falling tile + stone rumbles
add(rumble(1.2, 1), vs("puzzle") + 2.4, 0.12); add(tone(90, 0.5, 8, (1, 0.5)), vs("puzzle") + 3.2, 0.2)
add(rumble(2.4, 1.2), vs("stone"), 0.14)
for i in range(6): add(tone(300 - i * 30, 0.15, 25, (1, 0.6, 0.3)), vs("stone") + i * 0.16, 0.05)
# crystal melt shimmer
for i in range(14): add(tone(1200 + i * 90, 0.5, 6, (1, 0.3)), vs("melted") + i * 0.07, 0.03)
# map rustle on "Trust the eyes."
add(bp(rng.standard_normal(int(0.4 * SR)), 1500, 5000) * np.hanning(int(0.4 * SR)), vs("trust") - 0.2, 0.04)
voice = np.zeros(n)
for key, v in VO.items():
    s, sr = sf.read(v["file"])
    if sr != SR: s = np.interp(np.arange(0, len(s), sr / SR), np.arange(len(s)), s)
    i = int(v["start"] * SR); j = min(n, i + len(s)); voice[i:j] += s[: j - i]
env = lp(np.abs(voice), 6); duck = 1 - np.clip(env * 5, 0, 0.45)
out = mix * duck + voice
out = np.tanh(out * 1.1); out *= 0.95 / np.max(np.abs(out)); out *= np.clip((D - t) / 0.5, 0, 1)
sf.write("audio/mix.wav", np.stack([out, out], 1).astype(np.float32), SR); print("ok", round(D, 1))
