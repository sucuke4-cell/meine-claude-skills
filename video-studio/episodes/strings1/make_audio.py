"""Kitewood soundtrack: warm/hope score, wind + storm, string 'pling' sfx, golden chime swell."""
import json, sys, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "shared"))
from music import render_music
SR = 48000
TL = json.load(open("timeline.json")); VO = TL["vo"]; S = {s["id"]: s for s in TL["scenes"]}
D = TL["duration"] + 0.3; n = int(D * SR); t = np.arange(n) / SR
rng = np.random.default_rng(9); vs = lambda k: VO[k]["start"]
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
mix = np.zeros(n)
def add(sig, at, g=1.0):
    i = int(at * SR); j = min(n, i + len(sig))
    if 0 <= i < n: mix[i:j] += sig[: j - i] * g
def tone(f, L, decay, harm=(1, 0.3, 0.1)):
    tt = np.arange(int(L * SR)) / SR
    return sum(a * np.sin(2 * np.pi * f * (k + 1) * tt) for k, a in enumerate(harm)) * np.exp(-tt * decay) * np.clip(tt / 0.003, 0, 1)
def pling(f=1320, g=1.0):  # plucked string appearing
    return (tone(f, 0.7, 6, (1, 0.5, 0.25, 0.12)) + tone(f * 1.5, 0.7, 9, (0.4,))) * g
def wind(a, b, g, lo=200, hi=900):
    i0, i1 = int(a * SR), int(b * SR); x = bp(rng.standard_normal(i1 - i0), lo, hi)
    env = 0.55 + 0.45 * np.sin(2 * np.pi * 0.23 * np.arange(i1 - i0) / SR + 1) ** 2
    ramp = np.clip(np.minimum(np.arange(i1 - i0), np.arange(i1 - i0)[::-1]) / (0.8 * SR), 0, 1)
    mix[i0:i1] += x * env * ramp * g
cues = [(0, "warm"), (S[3]["start"], "hope"), (S[4]["start"], "sad"), (S[5]["start"], "mystery"), (S[6]["start"], "sad"),
        (vs("nextday"), "warm"), (S[7]["start"], "hope"), (vs("except") - 0.2, "sad"), (S[9]["start"], "tension"),
        (vs("storm"), "action"), (S[10]["start"], "climax"), (S[11]["start"], "mystery"), (vs("looked"), "tension"),
        (vs("knew") - 0.1, "silence"), (vs("shot"), "hope"), (S[13]["start"], "warm"), (S[14]["start"], "hope"), (S[14]["end"] - 0.8, "silence")]
mix += render_music(cues, D) * 0.27
# soft breeze outside, strong wind in the storm
wind(0, S[4]["end"], 0.006); wind(S[7]["start"], S[8]["end"], 0.007)
wind(vs("wind"), S[10]["end"] + 0.5, 0.03, 150, 1200)
i0, i1 = int(vs("storm") * SR), int((S[10]["end"]) * SR); mix[i0:i1] += lp(rng.standard_normal(i1 - i0), 2200) * 0.02 * np.hanning(i1 - i0)  # rain
for tm in [vs("storm") + 0.2, vs("storm") + 2.4, vs("ran") + 0.5]:
    tt = np.arange(int(2.2 * SR)) / SR; add(lp(rng.standard_normal(len(tt)), 110) * np.exp(-tt * 1.6) * 4, tm, 0.12)
# kite flaps when they rip loose and when June catches them
for k in range(7): add(bp(rng.standard_normal(int(0.12 * SR)), 400, 2500) * np.hanning(int(0.12 * SR)), vs("storm") + 1.4 + k * 0.16, 0.05)
for k in range(8): add(pling(660 + 40 * k, 0.6), vs("ran") + 1.0 + k * 0.4, 0.05)
# strings appearing
add(pling(1320), vs("town") + 2.4, 0.08); add(pling(1760), vs("gold"), 0.08); add(pling(1480), vs("rule") + 2.3, 0.08)
add(pling(1980, 0.8), vs("leo"), 0.05)
# golden strings shooting: rising cascade
for i in range(17): add(pling(880 * 2 ** (i / 12), 0.9), vs("shot") + 0.2 + i * 0.09, 0.045)
tt = np.arange(int(2.0 * SR)) / SR; add(sum(np.sin(2 * np.pi * f * tt) for f in (523, 659, 784, 1047)) * np.clip(tt / 1.2, 0, 1) * np.exp(-np.maximum(tt - 1.2, 0) * 3) / 4, vs("allgold") - 0.4, 0.07)
# laughter-ish taunt hit
add(tone(220, 0.3, 12, (1, 0.6)), vs("nostring"), 0.04)
voice = np.zeros(n)
for key, v in VO.items():
    s, sr = sf.read(v["file"])
    if sr != SR: s = np.interp(np.arange(0, len(s), sr / SR), np.arange(len(s)), s)
    i = int(v["start"] * SR); j = min(n, i + len(s)); voice[i:j] += s[: j - i]
env = lp(np.abs(voice), 6); duck = 1 - np.clip(env * 5, 0, 0.45)
out = mix * duck + voice
out = np.tanh(out * 1.1); out *= 0.95 / np.max(np.abs(out)); out *= np.clip((D - t) / 0.5, 0, 1)
sf.write("audio/mix.wav", np.stack([out, out], 1).astype(np.float32), SR); print("ok", round(D, 1))
