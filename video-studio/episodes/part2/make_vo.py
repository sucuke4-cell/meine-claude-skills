"""Part 2 voice-over: generate clips and timeline.json."""
import json, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

V = sys.argv[1]
k = Kokoro(f"{V}/kokoro.onnx", f"{V}/voices.bin")
# speaker -> (voice, speed, pitch factor >1 = deeper/slower)
SPK = {"N": ("am_onyx", 0.9, 1.0), "M": ("am_puck", 1.0, 1.0), "J": ("af_nicole", 0.85, 1.0),
       "A": ("bm_george", 0.88, 1.0), "K": ("am_onyx", 0.8, 1.22), "AK": ("bm_george", 0.8, 1.18)}

# (scene id, min length, [(gap, speaker, key, text)], tail)
SCENES = [
    (1, 3.6, [(0.3, "N", "recap1", "Last time... Juno vanished."), (0.15, "N", "recap2", "And the red door opened.")], 0.3),
    (2, 2.8, [(0.1, "N", "ran", "Everyone in the lobby ran.")], 0.7),
    (3, 4.5, [(0.1, "N", "except", "Everyone... except Milo."), (0.35, "M", "notleaving", "I'm not leaving without her.")], 0.5),
    (4, 6.0, [(0.2, "A", "stop", "Stop. Nobody who goes in there... ever comes back."),
              (0.3, "M", "why", "Then why does the door even exist?"),
              (0.5, "N", "noanswer", "The admin didn't answer.")], 0.4),
    (5, 3.6, [(0.1, "N", "stepped", "So Milo stepped into the red light.")], 1.3),
    (6, 5.5, [(0.3, "N", "same", "It was the same lobby. Same floor. Same door."),
              (0.3, "N", "wrong", "But everything... was wrong.")], 0.8),
    (7, 7.0, [(0.1, "N", "tags", "On the floor lay dozens of name tags."),
              (0.2, "N", "years", "Players who had vanished... years ago."),
              (0.3, "N", "newest", "And the newest one said...")], 1.5),
    (8, 6.0, [(0.2, "J", "overhere", "Milo! Over here!"),
              (0.3, "N", "trapped", "Juno was trapped inside a block of red glass."),
              (0.3, "J", "shouldnt", "You shouldn't have come!")], 0.4),
    (9, 8.0, [(0.2, "N", "fog", "Then something stepped out of the fog."),
              (0.6, "K", "rule", "Every time the door opens... someone must stay."),
              (0.4, "K", "choose", "One of you leaves. One of you stays. Forever.")], 0.6),
    (10, 6.5, [(0.2, "J", "dont", "Milo, don't..."),
               (0.3, "M", "letgo", "Let her go. I'll stay."),
               (0.4, "N", "hesitate", "He didn't even hesitate.")], 1.8),
    (11, 5.5, [(0.4, "N", "woke", "Juno woke up in the lobby."),
               (0.3, "N", "gone", "The door was closed. And Milo... was gone.")], 0.8),
    (12, 4.5, [(0.1, "N", "newrule", "But on the sign, someone had scratched a new rule.")], 2.6),
    (13, 6.0, [(0.9, "AK", "welcome", "Welcome back, Juno.")], 3.4),
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
