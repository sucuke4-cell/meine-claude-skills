"""Part 4 voice-over: generate clips and timeline.json."""
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
    (1, 6.0, [(0.3, "N", "final", "This is the final part."),
              (0.3, "N", "recap", "Milo was back. The Keeper was locked away. And then... the server restarted.")], 0.4),
    (2, 7.0, [(0.6, "N", "loaded", "When everything loaded again..."),
              (0.2, "N", "doorgone", "the red door was gone."),
              (0.3, "P", "over", "It's over! We're free!")], 0.8),
    (3, 8.0, [(0.2, "J", "okay", "Milo? Are you okay?"),
              (0.3, "M", "fine", "I'm fine. Never better."),
              (0.5, "N", "shadow", "But his shadow... didn't look like Milo.")], 1.0),
    (4, 9.0, [(0.2, "N", "lights", "That night, the lights went out."),
              (0.5, "N", "onebyone", "One by one... the players disappeared.")], 3.6),
    (5, 8.0, [(0.2, "J", "getout", "Milo! We have to get out of here!"),
              (0.3, "N", "didnt", "But Milo didn't move."),
              (0.6, "K", "really", "Did you really think... you could lock me away?")], 0.6),
    (6, 9.0, [(0.3, "K", "took", "When the door closed... I took the last one who walked out."),
              (0.4, "K", "chose", "Someone must stay. And I chose him.")], 1.6),
    (7, 10.0, [(0.2, "J", "inthere", "No... Milo. I know you're still in there."),
               (0.4, "N", "saw", "Then Juno saw it."),
               (0.2, "N", "jacket", "In Milo's hand... was her yellow jacket."),
               (0.4, "J", "carried", "You carried that into the dark... for me.")], 0.6),
    (8, 5.0, [(0.3, "M", "run", "Juno... run! I can't... hold him!")], 0.8),
    (9, 8.0, [(0.3, "J", "rule3", "No. Rule number three."),
              (0.3, "J", "neverleave", "I never leave a friend behind."),
              (0.3, "N", "grabbed", "She grabbed his hand... and didn't let go.")], 0.6),
    (10, 8.0, [(0.2, "K", "nostay", "No! Someone must... stay!"),
               (0.4, "N", "alone", "But the rule only works... if you are alone.")], 0.8),
    (11, 7.0, [(0.2, "N", "ripped", "The shadow was ripped out of Milo..."),
               (0.5, "N", "shattered", "and the red door shattered. Forever.")], 2.0),
    (12, 11.0, [(0.6, "N", "returned", "The lights came back. And one by one... every player returned."),
                (0.4, "M", "twice", "You came back for me. Twice."),
                (0.3, "J", "friends", "That's what friends do.")], 1.2),
    (13, 11.0, [(0.3, "N", "neverseen", "The red door was never seen again."),
                (1.0, "N", "somewhere", "But somewhere... in another server..."),
                (0.4, "N", "blue", "a blue door just appeared.")], 4.6),
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
