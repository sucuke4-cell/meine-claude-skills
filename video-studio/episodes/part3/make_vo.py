"""Part 3 voice-over: generate clips and timeline.json."""
import json, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

V = sys.argv[1]
k = Kokoro(f"{V}/kokoro.onnx", f"{V}/voices.bin")
# speaker -> (voice, speed, pitch factor >1 = deeper/slower)
SPK = {"N": ("am_onyx", 0.9, 1.0), "M": ("am_puck", 1.0, 1.0), "MF": ("am_puck", 1.0, 1.0), "J": ("af_nicole", 0.85, 1.0),
       "A": ("bm_george", 0.88, 1.0), "K": ("am_onyx", 0.8, 1.22), "AK": ("bm_george", 0.8, 1.18), "P": ("am_echo", 1.05, 1.0)}

# (scene id, min length, [(gap, speaker, key, text)], tail)
SCENES = [
    (1, 5.0, [(0.3, "N", "recap", "Last time... Milo stayed behind the red door. And the admin said..."),
              (0.2, "AK", "welcome", "Welcome back, Juno.")], 0.4),
    (2, 4.0, [(0.1, "N", "ran", "Juno ran."), (0.3, "N", "smiled", "But the admin didn't chase her. He just... smiled.")], 0.5),
    (3, 6.0, [(0.1, "N", "locked", "She ran back to the red door. But now... it was chained shut."),
              (0.3, "J", "hear", "Milo! Can you hear me?")], 0.6),
    (4, 6.0, [(0.5, "MF", "crown", "Juno! The admin's crown... it's the key! It opens the door!"),
              (0.4, "N", "gone", "Then his voice was gone.")], 0.5),
    (5, 9.0, [(0.2, "J", "took", "He took Milo. He took all of them."),
              (0.3, "J", "help", "They're not gone. They're trapped. And I need your help."),
              (0.4, "N", "forward", "One by one... the other players stepped forward.")], 0.6),
    (6, 9.0, [(0.1, "N", "plan", "The plan was simple."),
              (0.2, "P", "hey", "Hey, admin! Over here!"),
              (0.3, "N", "distract", "While everyone distracted him..."),
              (0.2, "N", "grab", "Juno grabbed the crown.")], 0.6),
    (7, 7.0, [(0.3, "N", "changed", "And without his crown... the admin changed."),
              (0.9, "K", "shouldnot", "You should not have done that.")], 0.6),
    (8, 6.5, [(0.1, "N", "pressed", "Juno pressed the crown against the door."),
              (1.2, "N", "shattered", "The chains shattered.")], 1.6),
    (9, 8.0, [(0.2, "N", "stepped", "And out of the red light... stepped Milo."),
              (0.3, "M", "cameback", "Juno! You came back!"),
              (0.3, "J", "never", "I'd never leave you behind.")], 1.4),
    (10, 6.0, [(0.2, "N", "alone", "And he wasn't alone."),
               (0.3, "N", "free", "Every player who had ever vanished... was free.")], 1.0),
    (11, 9.0, [(0.3, "K", "muststay", "Someone... must... stay!"),
               (0.3, "J", "notthis", "Not this time."),
               (0.4, "N", "pushed", "Together, they pushed the Keeper through the door.")], 1.6),
    (12, 7.0, [(0.3, "N", "slammed", "The door slammed shut. And on a new sign... a new rule appeared.")], 3.0),
    (13, 9.0, [(0.3, "N", "okay", "Everything was finally okay."),
               (2.4, "N", "orwas", "Or... was it?")], 4.2),
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
