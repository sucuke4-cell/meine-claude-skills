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
ts_ = ve("letgo") + 0.35
cues = [(0, "tension"), (S[2]["start"], "action"), (S[3]["start"], "sad"), (S[4]["start"], "tension"),
        (S[5]["end"] - 0.1, "silence"), (S[6]["start"] + 0.6, "otherworld"), (vs("fog"), "dread"),
        (S[10]["start"], "climax"), (ts_, "silence"), (S[11]["start"] + 1.0, "sad"),
        (S[12]["end"] - 1.0, "dread"), (S[13]["end"] - 1.0, "silence")]
mix += render_music(cues, D) * 0.30
growl = np.sin(2 * np.pi * 41 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * t)) * win(vs("fog"), S[10]["end"], 2.5, 0.3) * 0.10
mix += growl

# ---------------- sound effects ----------------
add(sweep(1.6, 200, 900, 0.05), S[1]["start"])                          # recap shimmer
for k in range(16):                                                     # running footsteps
    add(thump(85 + (k % 2) * 15, 0.18), S[2]["start"] + 0.3 + k * 0.16 + (k % 3) * 0.02, 0.5 * (1 - k / 18))
add(tone(hz(91), 1.0, 5, (1, 0.5, 0.2)), ve("noanswer") - 0.25, 0.08)   # red-eye glint
add(sweep(2.4, 80, 600, 0.12), S[5]["end"] - 2.4)                         # rising into the light
add(boom(2.6, 30, 110, 0.9), S[5]["end"] - 0.05)
add(boom(2.0, 28, 70, 0.8), ve("newest") + 0.25)                         # JUNO reveal
add(tone(hz(80), 2.0, 2.5, (1, 0.3, 0.1)), ve("newest") + 0.25, 0.05); add(tone(hz(81), 2.0, 2.5), ve("newest") + 0.25, 0.04)
for k in range(9):                                                      # Juno knocking on glass
    add(tone(2300 + 200 * (k % 3), 0.25, 30, (1, 0.2)), vs("overhere") + 0.1 + k * 0.42, 0.06)
add(boom(3.0, 25, 60, 0.6), vs("fog") + 0.3)                              # Keeper appears
ts = ve("letgo") + 0.35                                                 # glass shatter
for k in range(70):
    f = 2000 + rng.random() * 5000
    add(tone(f, 0.5, 14 + rng.random() * 20, (1, 0.2)), ts + rng.random() ** 2 * 0.9, 0.05)
add(boom(2.4, 30, 120, 1.0), ts)
add(rumble(1.6, 0.6) * np.hanning(int(1.6 * SR)), ts + 0.2)
add(sweep(1.4, 150, 1200, 0.1), ts + 0.4)
add(boom(2.0, 30, 80, 0.6), S[11]["start"])                              # back in the lobby
for k in range(10):                                                     # scratching rule #2 (soft, filtered)
    L = 0.22; s = bp(rng.standard_normal(int(L * SR)), 900, 2200) * np.hanning(int(L * SR)) * 0.5
    add(s, vs("newrule") + 1.0 + k * 0.32, 0.25)
add(boom(3.0, 26, 100, 1.0), vs("welcome") - 0.15)                        # twist sting
for m in (62, 63, 68): add(tone(hz(m + 12), 3.0, 1.2, (1, 0.3)), vs("welcome") - 0.15, 0.05)
add(boom(2.5, 30, 70, 0.5), S[13]["end"] - 2.9)                            # PART 3?

# ---------------- voice ----------------
voice = np.zeros(n)
for key, v in VO.items():
    s, sr = sf.read(v["file"])
    if sr != SR: s = np.interp(np.arange(0, len(s), sr / SR), np.arange(len(s)), s)
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
