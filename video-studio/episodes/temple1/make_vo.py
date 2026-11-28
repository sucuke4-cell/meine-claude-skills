"""The Temple of Whispering Eyes — block style mystery. Narrator: high male (am_adam +6 st by resampling)."""
import json, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly
from kokoro_onnx import Kokoro
V = sys.argv[1]
k = Kokoro(f"{V}/kokoro.onnx", f"{V}/voices.bin")
# speaker: (voice, speed, pitch-mode, lang). pitch-mode: ('rs', num, den) = resample up; float = old interp pitch
SPK = {"N": ("am_adam", 0.82, ("rs", 1000, 1414), "en-us"), "Z": ("af_sky", 1.0, 1.12, "en-us"), "C": ("bm_fable", 1.0, 1.0, "en-gb"),
       "G": ("am_onyx", 0.9, 1.0, "en-us"), "E": ("bf_isabella", 0.9, 0.92, "en-gb")}
SCENES = [
 (1, 4.5, [(0.2,"N","hook","Every night, the stone face in the jungle opened its eyes."),
           (0.2,"N","gone","And every morning... someone was gone.")],0.3),
 (2, 9.0, [(0.2,"N","tenyears","Ten years ago, Zuri's grandpa walked into that temple."),
           (0.2,"N","never","He never came back."),
           (0.2,"N","map","All he left behind was a map, with three words on it."),
           (0.25,"N","trust","Trust the eyes.")],0.4),
 (3, 5.0, [(0.2,"E","nobody","Nobody who goes in there comes back, child."),
           (0.3,"Z","first","Then I'll be the first.")],0.4),
 (4, 4.5, [(0.2,"N","sunrise","So at sunrise, Zuri took his lantern, and walked into the jungle.")],0.4),
 (5, 8.0, [(0.2,"C","lost","Lost, little explorer? I'm Mister Crane, from the city museum."),
           (0.2,"C","help","I only want to help you find your grandpa."),
           (0.3,"N","blinked","Behind him, a stone head blinked. Red.")],0.5),
 (6, 5.0, [(0.2,"N","bigger","The temple was bigger than anything she had ever seen."),
           (0.2,"N","watching","And its eyes were watching.")],0.4),
 (7, 7.0, [(0.2,"N","puzzle","Inside, the floor was a puzzle. One wrong step, and the stones fell away."),
           (0.25,"Z","tiles","Grandpa's map! Only step on the tiles with an eye!")],0.4),
 (8, 10.0, [(0.2,"N","hall","Then they reached a hall full of stone eyes."),
            (0.2,"N","crane_lie","When Crane said he was a museum guide... every eye glowed red."),
            (0.2,"N","zuri_true","When Zuri said she missed her grandpa... they glowed green."),
            (0.25,"Z","know","They know when we lie.")],0.4),
 (9, 7.0, [(0.2,"N","gold","At the very end, there was a room filled with gold."),
           (0.2,"N","crystal","And in the middle, frozen inside a crystal..."),
           (0.2,"Z","grandpa","Grandpa!")],0.5),
 (10, 8.0, [(0.2,"N","carving","Then Zuri saw the carving on the wall."),
            (0.2,"N","kept","The temple kept everyone who came for its treasure."),
            (0.25,"N","toogold","Ten years ago, her grandpa had come for the gold too.")],0.5),
 (11, 7.5, [(0.2,"C","mine","Finally. It's all mine!"),
            (0.2,"N","grabbed","Crane grabbed the gold. Every eye in the temple turned red."),
            (0.25,"N","stone","And Crane turned to stone.")],0.6),
 (12, 7.0, [(0.2,"N","hand","Zuri put her hand on the crystal."),
            (0.3,"Z","dontwant","I don't want the gold. I just want my grandpa back."),
            (0.3,"N","green","Every eye turned green.")],0.6),
 (13, 7.5, [(0.2,"N","melted","The crystal melted."),
            (0.4,"G","grown","Zuri? You've grown so much."),
            (0.3,"N","hugged","She hugged him, and didn't let go.")],0.8),
 (14, 7.0, [(0.2,"N","walked","They walked out of the jungle as the sun came up. With no gold at all."),
            (0.3,"N","treasures","Because some treasures, you can't carry out.")],1.0),
 (15, 4.8, [(0.3,"N","question","Would you take the gold... or the truth?")],3.0),
]
def polish(s, sr):
    s = sosfilt(butter(2, 90, 'high', fs=sr, output='sos'), s)
    s = s + 0.5 * sosfilt(butter(2, [2500, 6000], 'band', fs=sr, output='sos'), s)
    env = np.abs(s); g = np.where(env > 0.25, 0.25 / np.maximum(env, 1e-6), 1.0) ** 0.4
    return s * g
def chunks(text, n=2):
    w = text.replace("...", "…").split(); out = []; i = 0
    while i < len(w):
        take = 1 if len(w[i]) > 7 or i + 1 >= len(w) or len(w[i + 1]) > 7 else n
        out.append(" ".join(w[i:i + take])); i += take
    return out
t, scenes, caps, vo = 0.0, [], [], {}
for sid, ml, segs, tail in SCENES:
    start, cur = t, t
    for gap, spk, key, text in segs:
        voice, speed, pitch, lang = SPK[spk]; cur += gap
        s, sr = k.create(text, voice=voice, speed=speed, lang=lang)
        a = np.where(np.abs(s) > 0.01)[0]; s = s[max(0, a[0] - 600): a[-1] + 2400] if len(a) else s
        if isinstance(pitch, tuple): s = resample_poly(s, pitch[1], pitch[2])
        elif pitch != 1.0: s = np.interp(np.arange(0, len(s), pitch), np.arange(len(s)), s)
        if spk == "N": s = polish(s, sr)
        f = f"audio/{key}.wav"; sf.write(f, s, sr); d = len(s) / sr
        vo[key] = {"file": f, "start": round(cur, 3), "dur": round(d, 3), "spk": spk, "scene": sid, "text": text}
        parts = chunks(text); tot = sum(len(p) + 2 for p in parts); c = cur
        for p in parts:
            pd = d * (len(p) + 2) / tot; caps.append({"text": p, "start": round(c, 3), "end": round(c + pd, 3), "spk": spk}); c += pd
        cur += d
    end = max(cur + tail, start + ml); scenes.append({"id": sid, "start": round(start, 3), "end": round(end, 3)}); t = end
json.dump({"scenes": scenes, "captions": caps, "vo": vo, "duration": round(t, 3)}, open("timeline.json", "w"), indent=1)
for s in scenes: print(s)
print("total", round(t, 1))
