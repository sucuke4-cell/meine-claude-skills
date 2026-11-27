"""Shadows Part 3 voice-over: generate clips and timeline.json."""
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
    (1, 5.5, [(0.3, "N", "again", "Theo had a shadow again."), (0.5, "N", "nothis", "But it wasn't his.")], 0.8),
    (2, 12.0, [(0.3, "N", "followed", "It followed him everywhere. Always... one second too late."),
               (0.5, "N", "whispered", "And at night... it whispered."),
               (0.5, "F", "works", "Your shadow works for me now. Forever.")], 0.6),
    (3, 8.0, [(0.3, "F", "clockout", "And tonight at nine, I clock out..."),
              (0.3, "F", "takingyou", "and this time, I'm taking you with me.")], 1.0),
    (4, 14.0, [(0.3, "T", "please", "Mom, please. You saw the black sun."),
               (0.6, "MO", "believe", "I believe you. What do we do?"),
               (0.4, "T", "timeclock", "The factory has a time clock. Every shadow has a card."),
               (0.3, "T", "punch", "If I punch my card... my shadow has to come back to me.")], 0.6),
    (5, 9.0, [(0.3, "N", "slipped", "At nine o'clock, they slipped into the factory."),
              (0.5, "N", "door", "And behind the time clock... was a door.")], 0.8),
    (6, 10.0, [(0.3, "N", "hooks", "Inside, hundreds of shadows hung from hooks. Like coats."),
               (0.6, "T", "there", "There! That's mine!")], 1.0),
    (7, 9.0, [(0.3, "N", "stoodup", "But the shadow under Theo's feet... stood up."),
              (0.4, "F", "nobody", "Nobody leaves the night shift.")], 1.6),
    (8, 8.0, [(0.3, "MO", "letgo", "Let go of my son!"),
              (0.4, "N", "hate", "Shadows hate one thing. Light... from the front.")], 1.0),
    (9, 6.0, [(0.3, "N", "punched", "Theo grabbed his card... and punched it.")], 1.8),
    (10, 11.0, [(0.3, "N", "woke", "His shadow woke up. And ran home."),
                (0.6, "T", "back", "You're back. For real this time."),
                (0.4, "N", "waved", "And his shadow waved.")], 1.0),
    (11, 14.0, [(0.3, "N", "lasthook", "But on the last hook... hung one more shadow."),
                (0.3, "N", "tag", "Its name tag said... Mara."),
                (0.4, "T", "mom", "Mom... that's your name."),
                (0.6, "N", "whose", "Then whose shadow... is following you?")], 4.4),
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
