"""Battery story soundtrack: warm/hopeful score, school ambience, battery sfx (chimes up, blips down)."""
import json, sys, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "shared"))
from music import render_music
SR = 48000
TL = json.load(open("timeline.json")); VO = TL["vo"]; S = {s["id"]: s for s in TL["scenes"]}
D = TL["duration"] + 0.3; n = int(D * SR); t = np.arange(n) / SR
rng = np.random.default_rng(7)
vs = lambda k: VO[k]["start"]
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
mix = np.zeros(n)
def add(sig, at, g=1.0):
    i = int(at * SR); j = min(n, i + len(sig))
    if 0 <= i < n: mix[i:j] += sig[: j - i] * g
def tone(f, L, decay, harm=(1, 0.3, 0.1)):
    tt = np.arange(int(L * SR)) / SR
    return sum(a * np.sin(2 * np.pi * f * (k + 1) * tt) for k, a in enumerate(harm)) * np.exp(-tt * decay) * np.clip(tt / 0.003, 0, 1)
def chimeUp(g=1.0):  # battery charging: rising arpeggio
    out = np.zeros(int(1.0 * SR))
    for i, m in enumerate([72, 76, 79, 84]):
        s = tone(440 * 2 ** ((m - 69) / 12), 0.6, 7, (1, 0.25)); j = int(i * 0.08 * SR); out[j:j + len(s)] += s[: len(out) - j]
    return out * g
def blipDown(g=1.0):  # battery draining: falling two-tone blip
    out = np.zeros(int(0.5 * SR))
    for i, f in enumerate([620, 410]):
        s = tone(f, 0.22, 16, (1, 0.5, 0.2)); j = int(i * 0.11 * SR); out[j:j + len(s)] += s
    return out * g
def thud(g=1.0):
    tt = np.arange(int(0.6 * SR)) / SR; f = 50 + 70 * np.exp(-tt * 20)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7) * g
def whoosh(L=0.35, g=1.0):
    x = bp(rng.standard_normal(int(L * SR)), 300, 1800); e = np.sin(np.linspace(0, np.pi, len(x))) ** 2
    return x * e * g
def heartbeat(g=1.0):
    out = np.zeros(int(0.9 * SR)); out[:int(0.5 * SR)] += thud(1)[:int(0.5 * SR)]; j = int(0.22 * SR); out[j:j + int(0.5 * SR)] += thud(0.7)[:int(0.5 * SR)]
    return lp(out, 200) * g
# ---- music ----
cues = [(0, "mystery"), (S[2]["start"], "warm"), (S[3]["start"] + 2.6, "sad"), (S[4]["start"], "tension"), (S[5]["start"], "sad"),
        (S[6]["start"], "sad"), (vs("cookie"), "warm"), (S[9]["start"], "warm"), (S[10]["start"] + 2.2, "sad"),
        (S[11]["start"], "sad"), (S[12]["start"], "tension"), (vs("zero") - 0.1, "silence"), (vs("eli") + 0.6, "sad"),
        (S[14]["start"] + 2.0, "sad"), (vs("giveback"), "hope"), (S[16]["start"], "silence"), (vs("first") - 0.2, "hope"),
        (S[17]["start"], "warm"), (S[18]["start"], "hope"), (S[18]["end"] - 0.8, "silence")]
mix += render_music(cues, D) * 0.28
# ---- ambience: classroom/cafeteria murmur (soft band-passed, very low) & birds outside ----
def bed(a, b, lo, hi, g):
    i0, i1 = int(a * SR), int(b * SR); x = bp(rng.standard_normal(i1 - i0), lo, hi)
    env = 0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * np.arange(i1 - i0) / SR) ** 2
    mix[i0:i1] += x * env * g * np.clip(np.minimum(np.arange(i1 - i0), np.arange(i1 - i0)[::-1]) / (0.3 * SR), 0, 1)
bed(S[6]["start"], S[8]["end"], 250, 900, 0.012)   # cafeteria chatter
bed(S[4]["start"], S[5]["end"], 250, 800, 0.006)
for a, b in [(0, S[3]["end"]), (S[9]["start"], S[9]["end"]), (S[17]["start"], S[18]["end"])]:
    k = a + 0.5
    while k < b - 0.5:
        for j in range(rng.integers(2, 4)): add(tone(2600 + rng.random() * 900, 0.08, 40, (1,)), k + j * 0.09, 0.02)
        k += 1.4 + rng.random() * 1.6
# ---- battery sfx ----
for k, ofs in [("jumped", 0.0), ("hugged", 1.4)]: add(chimeUp(), vs(k) + ofs, 0.10)
add(chimeUp(), vs("books") + 2.0, 0.08); add(chimeUp(), vs("busstop") + 2.2, 0.08)
for tm in [vs("two") + 0.3, vs("books") + 2.6, vs("busstop") + 2.9, vs("hugged") + 1.8]: add(blipDown(), tm, 0.09)
add(blipDown(), vs("three") + 0.2, 0.07)
# low battery warning beeps in bedroom
for k in range(4): add(tone(880, 0.12, 25, (1, 0.2)), vs("blinked") + 0.6 + k * 1.0, 0.05)
# battery dies: long falling tone + thud of the fall
tt = np.arange(int(1.2 * SR)) / SR; f = 700 * np.exp(-tt * 1.6) + 120
add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.5) * np.clip(tt / 0.01, 0, 1), vs("zero") + 0.2, 0.08)
add(thud(), vs("eli") - 0.3, 0.35)
# heartbeat while energy flows back, getting stronger
for k in range(6): add(heartbeat(0.5 + k * 0.1), vs("onebyone") + 0.6 + k * 1.05, 0.4)
# big charge-up when he hits 100
tt = np.arange(int(1.6 * SR)) / SR; f = 220 * 2 ** (tt * 2.2)
add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.clip(tt / 1.4, 0, 1) ** 2 * np.exp(-np.maximum(tt - 1.4, 0) * 20), vs("hundred") - 0.3, 0.05)
add(chimeUp(), vs("hundred") + 1.1, 0.14)
# whooshes on some cuts
for k in ["lunch", "watching", "followed", "morning", "brock", "never2"]: add(whoosh(), vs(k) - 0.25, 0.05)
# ---- voices ----
voice = np.zeros(n)
for key, v in VO.items():
    s, sr = sf.read(v["file"])
    if sr != SR: s = np.interp(np.arange(0, len(s), sr / SR), np.arange(len(s)), s)
    if v["scene"] == 14 and key == "remember":
        pass
    i = int(v["start"] * SR); j = min(n, i + len(s)); voice[i:j] += s[: j - i]
env = lp(np.abs(voice), 6); duck = 1 - np.clip(env * 5, 0, 0.45)
out = mix * duck + voice
out = np.tanh(out * 1.1); out *= 0.95 / np.max(np.abs(out)); out *= np.clip((D - t) / 0.5, 0, 1)
sf.write("audio/mix.wav", np.stack([out, out], 1).astype(np.float32), SR)
print("ok", round(D, 1))
