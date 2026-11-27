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
tr = vs("recap") + 3.3; ta = vs("took") + 1.2; tsh = vs("shattered") + 0.9
cues = [(0, "sad"), (tr, "silence"), (S[2]["start"] + 0.6, "mystery"), (vs("over"), "action"), (S[3]["start"], "mystery"),
        (vs("shadow"), "dread"), (S[4]["start"], "silence"), (vs("onebyone"), "dread"), (S[5]["start"], "tension"),
        (vs("really") - 0.4, "dread"), (ta, "climax"), (S[7]["start"], "sad"), (S[8]["start"], "action"),
        (S[9]["start"], "sad"), (S[10]["start"], "climax"), (tsh, "silence"), (S[12]["start"] + 0.5, "sad"),
        (vs("somewhere") - 0.3, "silence"), (vs("blue") - 0.2, "mystery"), (S[13]["end"] - 0.8, "silence")]
mix += render_music(cues, D) * 0.30
growl = np.sin(2 * np.pi * 41 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * t)) * (win(vs("really"), S[7]["start"], 0.8, 1.0) + win(S[10]["start"], tsh, 0.5, 0.1)) * 0.10
mix += growl

# ---------------- sound effects ----------------
def clink(f):
    tt = np.arange(int(0.6 * SR)) / SR
    return sum(np.sin(2 * np.pi * f * r * tt) * a for r, a in ((1, 1), (2.76, 0.5), (5.4, 0.25))) * np.exp(-tt * 9)
def glitchsnd(L):
    tt = np.arange(int(L * SR)) / SR
    f = 200 + 900 * (np.floor(tt * 25) % 5) / 5
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.25 * lp(np.ones_like(tt), 50)
for k in range(5): add(tone(1046.5 * (1.5 if k % 2 else 1), 0.12, 20, (1, 0.2)), tr + k * 0.18, 0.05)    # server beeps
add(lp(glitchsnd(1.6), 2500), tr + 0.9, 0.12)
add(boom(2.4, 30, 100, 0.8), S[2]["start"])                                                           # reload
for k in range(5): add(boom(0.5, 60, 120, 0.25), vs("lights") + 0.4 + k * 0.45)                     # lights click off
for i in range(10): add(sweep(0.6, 900, 200, 0.06), vs("onebyone") + 0.7 + i * 0.42)                 # players vanish
hb = vs("onebyone")
while hb < S[5]["start"] + 0.5: add(tone(52, 0.5, 18, (1,)), hb, 0.35); add(tone(52, 0.5, 18, (1,)), hb + 0.18, 0.25); hb += 0.8
add(boom(2.6, 25, 90, 0.9), vs("really") - 0.4)                                                       # red eyes
add(lp(glitchsnd(0.8), 2500), ta, 0.12); add(boom(3.0, 24, 110, 1.0), ta + 0.8)                       # door returns
add(sweep(1.6, 300, 1500, 0.05), vs("saw"))                                                           # jacket moment
add(rumble(3.0, 0.4) * np.hanning(int(3.0 * SR)), S[10]["start"])                                      # tearing out
add(boom(2.4, 28, 120, 1.0), vs("ripped") + 0.3)
add(boom(2.6, 28, 130, 1.2), tsh)                                                                      # door shatters
for k in range(50): add(clink(300 + rng.random() * 1500), tsh + rng.random() ** 2 * 1.0, 0.04)
for i in range(10): add(sweep(0.8, 300, 1400, 0.05), vs("returned") + 1.6 + i * 0.3)                  # players return
add(boom(2.0, 30, 70, 0.5), vs("somewhere") - 0.3)
add(sweep(2.0, 500, 2500, 0.05), vs("blue"))                                                           # blue door shimmer
for m in (72, 76, 79, 84): add(tone(hz(m), 2.5, 1.5, (1, 0.3)), S[13]["end"] - 3.6, 0.04)             # THE END chord

# ---------------- voice ----------------
voice = np.zeros(n)
for key, v in VO.items():
    s, sr = sf.read(v["file"])
    if sr != SR: s = np.interp(np.arange(0, len(s), sr / SR), np.arange(len(s)), s)
    if v["spk"] == "MF":  # Milo's voice through the door
        s = lp(s, 900) * 1.4
        e = np.zeros(len(s) + int(0.5 * SR)); e[:len(s)] += s
        for d, g in ((0.09, 0.4), (0.19, 0.25)):
            i = int(d * SR); e[i:i + len(s)] += s * g
        s = e
    if v["spk"] in ("K", "AK"):  # dark echo
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
