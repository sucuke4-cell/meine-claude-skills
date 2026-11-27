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
cues = [(0, "mystery"), (vs("strikes"), "tension"), (S[3]["start"], "sad"), (S[5]["start"] + 0.3, "silence"),
        (vs("didnt"), "dread"), (S[6]["start"], "tension"), (vs("fade"), "dread"), (S[7]["start"], "sad"),
        (vs("thatnight"), "tension"), (S[8]["start"], "otherworld"), (vs("watching"), "silence"), (vs("ran"), "action"),
        (S[10]["start"], "dread"), (S[11]["start"], "silence"), (vs("midnight") + 0.3, "dread"), (S[11]["end"] - 0.8, "silence")]
mix += render_music(cues, D) * 0.30
growl = 0
mix += growl

# ---------------- sound effects ----------------
def bell(f=196.0, L=3.5):
    tt = np.arange(int(L * SR)) / SR
    return sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt * d) for r, a, d in ((0.5, 0.6, 0.8), (1, 1, 1.2), (1.19, 0.5, 1.6), (1.56, 0.35, 2.2), (2.0, 0.3, 2.6), (2.74, 0.2, 3.5)))
def clang(f):
    tt = np.arange(int(0.5 * SR)) / SR
    return sum(np.sin(2 * np.pi * f * r * tt) * a for r, a in ((1, 1), (2.4, 0.5), (3.9, 0.3))) * np.exp(-tt * 12)
for k in range(9): add(bell(), vs("strikes") + 0.2 + k * 0.75, 0.10)                 # nine o'clock
for i in range(4): add(sweep(1.2, 120, 500, 0.05), vs("peels") - 0.2 + i * 0.25)      # shadows peel off
for i in range(4): add(sweep(1.0, 500, 140, 0.04), S[3]["start"] + 0.4 + i * 0.4 + 1.6) # shadows return
add(sweep(1.4, 300, 1400, 0.04), vs("goodnight") - 0.2)                                  # tender shimmer
add(boom(2.4, 28, 90, 0.8), vs("didnt") - 0.1)                                          # no shadow sting
add(lp(rng.standard_normal(int(0.7 * SR)), 1200) * np.hanning(int(0.7 * SR)) * 0.15, vs("noone") + 1.0)  # curtain
for k in range(6): add(tone(1800 + 300 * k, 0.6, 6, (1, 0.3)), vs("fade") + 1.2 + k * 0.3, 0.025)  # fading shimmer
for k in range(16): add(thump(80, 0.18), vs("thatnight") + 0.6 + k * 0.45, 0.25)         # sneaking steps
hm = S[8]["start"] + 0.3
while hm < vs("watching"): add(clang(420 + 60 * (int(hm * 3) % 3)), hm, 0.05); hm += 0.48  # hammering
add(boom(2.0, 30, 80, 0.7), vs("watching") - 0.1)
for k in range(14): add(thump(90, 0.18), vs("ran") + 0.1 + k * 0.17, 0.4)               # running
add(sweep(2.2, 90, 170, 0.08), S[10]["start"] + 0.2)                                     # closet creak
hb = vs("inside")
while hb < vs("wrote"): add(tone(52, 0.5, 18, (1,)), hb, 0.3); add(tone(52, 0.5, 18, (1,)), hb + 0.18, 0.22); hb += 0.85
for k in range(10):
    Lw = 0.22; sw = bp(rng.standard_normal(int(Lw * SR)), 700, 1800) * np.hanning(int(Lw * SR)) * 0.4
    add(sw, vs("wrote") + 2.2 + k * 0.32, 0.25)                                          # writing on the wall
add(boom(2.6, 26, 100, 0.9), vs("wrote") + 5.5)
for k in range(9): add(bell(185.0), vs("again") - 0.2 + k * 0.7, 0.10)                   # nine... at midnight
add(boom(2.6, 26, 90, 0.8), S[11]["end"] - 3.2)

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
    if v["spk"] in ("K", "AK", "F"):  # dark echo
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
