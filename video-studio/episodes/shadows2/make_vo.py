"""Shadows Part 2 voice-over: generate clips and timeline.json."""
import json, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

V = sys.argv[1]
k = Kokoro(f"{V}/kokoro.onnx", f"{V}/voices.bin")
# speaker -> (voice, speed, pitch factor >1 = deeper/slower)
SPK = {"N": ("am_onyx", 0.9, 1.0), "T": ("am_liam", 1.0, 1.0), "MO": ("af_sarah", 0.92, 1.0), "F": ("am_fenrir", 0.85, 1.15)}

# (scene id, min length, [(gap, speaker, key, text)], tail)
SCENES = [
    (1, 6.0, [(0.3, "N", "recap", "Theo's shadow had come back... with a warning."),
              (0.3, "N", "lied", "They lied. It's not a sunrise.")], 0.6),
    (2, 15.0, [(0.3, "N", "drew", "It couldn't speak. So it drew."),
               (1.6, "T", "blacksun", "A black sun?"),
               (0.4, "N", "never", "When the black sun rises... the shadows never have to go back."),
               (0.4, "N", "fades", "And everyone in town... fades. Forever."),
               (1.2, "T", "tonight", "Tonight?")], 1.2),
    (3, 12.0, [(0.3, "T", "mom", "Mom! You have to see this!"),
               (0.4, "MO", "drawing", "Theo, it's just a drawing. Go to sleep."),
               (0.5, "N", "turned", "But behind her... her shadow turned its head."),
               (0.5, "N", "smiled", "And slowly... it smiled.")], 1.2),
    (4, 9.0, [(0.3, "N", "struck", "At nine o'clock, the tower struck."),
              (0.6, "N", "rose", "And something black rose over the old factory.")], 1.4),
    (5, 9.0, [(0.3, "N", "died", "The street lights died. One by one."),
              (0.4, "MO", "hands", "Theo... I can't feel my hands."),
              (0.3, "T", "holdon", "Hold on, Mom!")], 0.8),
    (6, 8.0, [(0.3, "T", "wired", "Every lamp in this town is wired to the clock tower."),
              (0.3, "T", "nowhere", "If they all turn on at once... the shadows have nowhere to hide!")], 0.6),
    (7, 9.0, [(0.4, "F", "going", "Going somewhere, Theo?"),
              (0.4, "N", "jumped", "Theo's shadow jumped at the Foreman."),
              (0.3, "T", "now", "Now!")], 0.5),
    (8, 7.0, [(0.3, "N", "lever", "Theo pulled the lever."),
              (0.5, "N", "light", "And for one second... the whole town turned to light.")], 1.0),
    (9, 7.0, [(0.3, "N", "cracked", "The black sun cracked. And every shadow... was pulled back home.")], 1.4),
    (10, 12.0, [(0.3, "N", "feel", "Mom could feel her hands again."),
                (0.4, "T", "didit", "We did it..."),
                (0.5, "N", "down", "Theo looked down. He had a shadow again."),
                (0.4, "T", "back", "You're back!")], 1.0),
    (11, 9.0, [(0.6, "N", "tophat", "But Theo's shadow... was wearing a top hat.")], 4.6),
]

def chunks(text, n=4):
    w = text.replace("...", "…").split()
    return [" ".join(w[i:i + n]) for i in range(0, len(w), n)]

t, scenes, caps, vo = 0.0, [], [], {}
for sid, min_len, segs, tail in SCENES:
    start, cur = t, t
    for gap, spk, key, text in segs:
        voice, speed, pitch = SPK[spk]
        cur += gap
        s, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
        if pitch != 1.0:  # deeper + slower
            s = np.interp(np.arange(0, len(s), 1 / pitch), np.arange(len(s)), s)
        f = f"audio/{key}.wav"; sf.write(f, s, sr)
        d = len(s) / sr
        vo[key] = {"file": f, "start": round(cur, 3), "dur": round(d, 3), "spk": spk, "scene": sid}
        parts = chunks(text); total = sum(len(p) for p in parts); c = cur
        for p in parts:
            pd = d * len(p) / total
            caps.append({"text": p, "start": round(c, 3), "end": round(c + pd, 3), "spk": spk})
            c += pd
        cur += d
    end = max(cur + tail, start + min_len)
    scenes.append({"id": sid, "start": round(start, 3), "end": round(end, 3)})
    t = end

json.dump({"scenes": scenes, "captions": caps, "vo": vo, "duration": round(t, 3)}, open("timeline.json", "w"), indent=1)
for s in scenes: print(s)
print("total", round(t, 1))
