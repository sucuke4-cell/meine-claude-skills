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
tg = vs("grab") + 0.5; tx = vs("changed") + 2.3; tb = vs("shattered") - 0.2
tpush = vs("pushed") + 0.6; tslam = tpush + 2.6
cues = [(0, "dread"), (S[2]["start"], "action"), (S[3]["start"], "tension"), (S[4]["start"], "otherworld"),
        (S[5]["start"], "sad"), (vs("forward"), "tension"), (S[6]["start"], "action"), (tg, "silence"),
        (tx - 0.2, "dread"), (S[8]["start"], "climax"), (tb, "silence"), (S[9]["start"] + 0.8, "sad"),
        (S[11]["start"], "dread"), (tpush, "climax"), (tslam, "silence"), (S[12]["start"] + 2.0, "mystery"),
        (vs("okay") + 3.0, "silence"), (ve("orwas") + 0.4, "dread"), (S[13]["end"] - 0.8, "silence")]
mix += render_music(cues, D) * 0.30
growl = np.sin(2 * np.pi * 41 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * t)) * (win(tx, S[8]["start"], 0.5, 1.0) + win(S[11]["start"], tslam, 1.0, 0.2)) * 0.10
mix += growl

# ---------------- sound effects ----------------
def clink(f):
    tt = np.arange(int(0.6 * SR)) / SR
    return sum(np.sin(2 * np.pi * f * r * tt) * a for r, a in ((1, 1), (2.76, 0.5), (5.4, 0.25))) * np.exp(-tt * 9)
add(boom(3.0, 26, 100, 0.8), vs("welcome") - 0.15)                        # recap sting
for m in (62, 63, 68): add(tone(hz(m + 12), 2.5, 1.4, (1, 0.3)), vs("welcome") - 0.15, 0.04)
for k in range(14): add(thump(85 + (k % 2) * 15, 0.18), S[2]["start"] + 0.2 + k * 0.17, 0.45)     # Juno runs
for k in range(12): add(thump(85 + (k % 2) * 15, 0.18), S[3]["start"] + 0.2 + k * 0.2, 0.4)      # runs back
for k in range(6): add(thump(60, 0.35), vs("hear") - 1.0 + k * 0.45, 0.8); add(clink(700 + 90 * k), vs("hear") - 1.0 + k * 0.45, 0.25)  # bangs on chained door
add(sweep(1.2, 300, 1400, 0.05), tg - 0.3); add(tone(hz(88), 1.6, 3, (1, 0.6, 0.3)), tg, 0.07)  # crown grab chime
add(boom(3.0, 24, 120, 1.0), tx); add(rumble(1.2, 0.5) * np.hanning(int(1.2 * SR)), tx)          # transformation
tp = vs("pressed") + 2.0
add(sweep(tb - tp, 200, 1800, 0.08), tp)                                                         # crown charging
for k in range(40): add(clink(600 + rng.random() * 1800), tb + rng.random() ** 2 * 0.8, 0.05)    # chains break
add(boom(2.4, 30, 120, 1.0), tb)
for k in range(10): add(thump(80, 0.2), vs("alone") + 0.3 + k * 0.3, 0.3)                       # freed players walking
add(boom(3.0, 25, 60, 0.6), vs("muststay") - 0.2)
add(rumble(2.4, 0.5) * np.hanning(int(2.4 * SR)), tpush)                                          # push
add(boom(2.6, 28, 130, 1.1), tslam)                                                              # door slam
add(sweep(1.6, 400, 2000, 0.05), S[12]["start"] + 2.4)                                           # rule #3 shimmer
for k in range(6): add(tone(1046.5 * (1.5 if k % 2 else 1), 0.12, 20, (1, 0.2)), vs("okay") + 3.2 + k * 0.18, 0.05)  # server beeps
add(boom(2.4, 28, 90, 0.9), ve("orwas") + 0.5)                                                   # red eyes sting
for m in (61, 62, 67): add(tone(hz(m + 12), 2.0, 2, (1, 0.3)), ve("orwas") + 0.5, 0.04)

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
