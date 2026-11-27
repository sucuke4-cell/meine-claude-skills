"""Shadows Part 1 voice-over: generate clips and timeline.json."""
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
    (1, 4.0, [(0.3, "N", "hook", "In this town... your shadow clocks out at nine P.M.")], 0.6),
    (2, 9.0, [(0.2, "N", "strikes", "Every night, when the clock tower strikes nine..."),
              (0.3, "N", "peels", "every shadow peels off the ground..."),
              (0.3, "N", "factory", "and walks to the old factory. For the night shift.")], 1.0),
    (3, 6.0, [(0.3, "N", "sunrise", "At sunrise, they come back."),
              (0.3, "N", "nobody", "Nobody knows what they do there. Nobody asks.")], 0.6),
    (4, 8.0, [(0.2, "N", "theo", "Theo was twelve. He had watched it every night of his life."),
              (0.5, "T", "goodnight", "Goodnight, shadow."),
              (0.3, "N", "waved", "And every night... his shadow waved back.")], 0.8),
    (5, 6.0, [(0.5, "N", "onemorning", "But one morning..."),
              (0.4, "N", "didnt", "Theo's shadow didn't come back.")], 1.2),
    (6, 10.0, [(0.2, "MO", "where", "Theo... where is your shadow?"),
               (0.3, "MO", "noone", "Nobody can know. Do you understand me? Nobody."),
               (0.4, "N", "fade", "Because in this town... people without a shadow... start to fade.")], 1.2),
    (7, 9.0, [(0.3, "T", "find", "Then I'm going to find it."),
              (0.4, "N", "thatnight", "That night, at nine... Theo did the one thing nobody ever does."),
              (0.3, "N", "followed", "He followed the shadows.")], 1.0),
    (8, 12.0, [(0.3, "N", "building", "Inside the old factory... the shadows were building something."),
               (0.5, "F", "short", "We're one short tonight."),
               (0.3, "F", "finished", "Without him... it won't be finished by morning."),
               (0.4, "N", "sunrise2", "It was a sunrise. The shadows were building... the sunrise.")], 0.8),
    (9, 6.0, [(0.3, "F", "watching", "Wait. Someone's watching."),
              (0.2, "N", "ran", "Theo ran.")], 1.4),
    (10, 13.0, [(0.3, "N", "closet", "Back home, his closet door was open."),
                (0.4, "N", "inside", "And inside... shaking... was his own shadow."),
                (0.4, "T", "you", "...You?"),
                (0.6, "N", "wrote", "It pressed a finger to its lips. And wrote on the wall...")], 2.8),
    (11, 9.0, [(0.3, "N", "again", "Outside, the clock tower started striking nine. Again."),
               (0.4, "N", "midnight", "But it was only midnight.")], 3.4),
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
