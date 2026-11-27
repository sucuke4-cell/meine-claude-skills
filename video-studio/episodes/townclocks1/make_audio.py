"""Part 2 soundtrack: soft tonal pads (no hiss), music-box melody, sfx, voice with echo for the Keeper."""
import json
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
TL = json.load(open("timeline.json"))
VO = TL["vo"]; S = {s["id"]: s for s in TL["scenes"]}
D = TL["duration"] + 0.3
n = int(D * SR); t = np.arange(n) / SR
rng = np.random.default_rng(4)
vs = lambda k: VO[k]["start"]; ve = lambda k: VO[k]["start"] + VO[k]["dur"]

def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def win(a, b, fi=1.5, fo=1.5): return np.clip((t - a) / fi, 0, 1) * np.clip((b - t) / fo, 0, 1)
def hz(m): return 440 * 2 ** ((m - 69) / 12)

def pad(notes, a, b, gain, fi=2.0, fo=2.0, bright=0.25):
    out = np.zeros(n)
    for m in notes:
        f = hz(m)
        for det in (-0.12, 0.12):
            ph = 2 * np.pi * f * (1 + det / 100) * t
            out += np.sin(ph) + bright * np.sin(2 * ph) + bright * 0.4 * np.sin(3 * ph)
    lfo = 0.8 + 0.2 * np.sin(2 * np.pi * 0.13 * t)
    return out / (len(notes) * 2) * lfo * win(a, b, fi, fo) * gain

mix = np.zeros(n)
def add(sig, at, g=1.0):
    i = int(at * SR); j = min(n, i + len(sig))
    if 0 <= i < n: mix[i:j] += sig[: j - i] * g

def tone(f, L, decay, harm=(1, 0.3, 0.1)):
    tt = np.arange(int(L * SR)) / SR
    s = sum(a * np.sin(2 * np.pi * f * (k + 1) * tt) for k, a in enumerate(harm))
    return s * np.exp(-tt * decay) * np.clip(tt / 0.004, 0, 1)

def boom(L=2.4, f0=32, f1=90, g=1.0):
    tt = np.arange(int(L * SR)) / SR
    f = f0 + (f1 - f0) * np.exp(-tt * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.5) * g

def thump(f=70, L=0.25):
    tt = np.arange(int(L * SR)) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 28)

def rumble(L, g=1.0):  # very low, no hiss
    return lp(rng.standard_normal(int(L * SR)), 120) * 4 * g

def sweep(L, f0, f1, g=1.0):
    tt = np.arange(int(L * SR)) / SR
    f = f0 * (f1 / f0) ** (tt / L)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (tt / L) ** 2 * g

# ---------------- music (cinematic underscore) ----------------
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "shared"))
from music import render_music
cues = [(0, "mystery"), (S[2]["start"], "sad"), (vs("s1c"), "dread"), (S[4]["start"], "mystery"),
        (vs("s2d"), "dread"), (S[6]["start"], "sad"), (vs("s3c"), "dread"), (S[8]["start"], "tension"),
        (vs("s4d"), "dread"), (S[10]["start"], "mystery"), (vs("s5c"), "dread"), (S[12]["start"], "tension"),
        (vs("s6d"), "dread"), (S[14]["start"], "climax"), (S[14]["end"] - 0.8, "silence")]
mix += render_music(cues, D) * 0.30

# ---------------- sound effects ----------------
for s_ in TL["scenes"][1:]:
    add(boom(2.2, 28, 90, 0.5), s_["start"])
for key in ["s1d", "s2d", "s3d", "s4d", "s5e", "s6e"]:
    if key in VO: add(boom(2.4, 26, 95, 0.9), VO[key]["start"] - 0.1)
rs, re_ = S[3]["start"], S[3]["end"]; i0, i1 = int(rs*SR), int(re_*SR)
mix[i0:i1] += lp(rng.standard_normal(i1-i0), 1600) * 0.08 * np.hanning(i1-i0)
for k in range(9): add(tone(196*2**(k/12), 0.5, 4, (1,0.3)), vs("s6d") + k*0.18, 0.05)
add(boom(2.6, 24, 110, 1.0), S[14]["start"])

# ---------------- voice ----------------
voice = np.zeros(n)
for key, v in VO.items():
    s, sr = sf.read(v["file"])
    if sr != SR: s = np.interp(np.arange(0, len(s), sr / SR), np.arange(len(s)), s)
    if False:  # Milo's voice through the door
        s = lp(s, 900) * 1.4
        e = np.zeros(len(s) + int(0.5 * SR)); e[:len(s)] += s
        for d, g in ((0.09, 0.4), (0.19, 0.25)):
            i = int(d * SR); e[i:i + len(s)] += s * g
        s = e
    if v["spk"] == "V":  # eerie echo
        s = lp(s, 3500)
        e = np.zeros(len(s) + int(0.6 * SR)); e[:len(s)] += s
        for d, g in ((0.11, 0.45), (0.23, 0.3), (0.37, 0.18)):
            i = int(d * SR); e[i:i + len(s)] += s * g
        s = e
    i = int(v["start"] * SR); j = min(n, i + len(s)); voice[i:j] += s[: j - i]
env = lp(np.abs(voice), 6)
duck = 1 - np.clip(env * 5, 0, 0.5)
out = mix * duck + voice
out = np.tanh(out * 1.1); out *= 0.95 / np.max(np.abs(out))
out *= np.clip((D - t) / 0.5, 0, 1)
sf.write("audio/mix.wav", np.stack([out, out], 1).astype(np.float32), SR)
print("ok", round(D, 1))
