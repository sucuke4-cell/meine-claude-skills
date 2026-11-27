"""Generate voice-over clips with Kokoro and write timeline.json (scene + caption timing)."""
import json, re, sys
import soundfile as sf
from kokoro_onnx import Kokoro

V = sys.argv[1]  # voices dir
k = Kokoro(f"{V}/kokoro.onnx", f"{V}/voices.bin")
N, J = "am_onyx", "af_nicole"

# scene: (id, min_len, [(gap_before, voice, speed, text)], tail_pad)
SCENES = [
    (1, 2.6, [(0.35, N, 0.88, "This server had only one rule.")], 0.25),
    (2, 3.0, [(0.1, N, 0.80, "Never. Open. The red door.")], 0.45),
    (3, 3.0, [(0.1, N, 0.92, "Milo thought it was just a joke.")], 0.4),
    (4, 3.4, [(0.1, N, 0.92, "But nobody ever went near it. Not even the admins.")], 0.4),
    (5, 5.2, [(0.1, N, 0.85, "Then, at exactly midnight..."), (2.1, N, 0.85, "it knocked.")], 0.35),
    (6, 2.4, [(0.15, N, 0.82, "From the inside.")], 0.6),
    (7, 4.0, [(0.1, N, 0.92, "His best friend Juno whispered:"), (0.25, J, 0.78, "Don't. Answer. It.")], 0.4),
    (8, 3.0, [(0.1, N, 0.88, "Milo turned around for one second...")], 0.5),
    (9, 3.0, [(0.0, N, 0.84, "...and Juno was gone.")], 0.9),
    (10, 4.4, [(0.1, N, 0.88, "Then new words appeared on the door.")], 1.6),
    (11, 6.0, [(0.1, N, 0.82, "And slowly... the red door started to open.")], 2.4),
]

def chunks(text, n=4):
    w = text.replace("...", "…").split()
    return [" ".join(w[i:i + n]) for i in range(0, len(w), n)]

t, scenes, caps, vo = 0.0, [], [], []
for sid, min_len, segs, tail in SCENES:
    start, cur = t, t
    for gap, voice, speed, text in segs:
        cur += gap
        s, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
        f = f"audio/vo_{sid}_{len(vo)}.wav"
        sf.write(f, s, sr)
        d = len(s) / sr
        vo.append({"file": f, "start": round(cur, 3), "dur": round(d, 3)})
        parts = chunks(text)
        total = sum(len(p) for p in parts)
        c = cur
        for p in parts:
            pd = d * len(p) / total
            caps.append({"text": p, "start": round(c, 3), "end": round(c + pd, 3), "juno": voice == J})
            c += pd
        cur += d
    end = max(cur + tail, start + min_len)
    scenes.append({"id": sid, "start": round(start, 3), "end": round(end, 3)})
    t = end

# sound effects (seconds)
s5 = scenes[4]["start"]
knock0 = vo[4]["start"] + vo[4]["dur"] + 0.3
sfx = {
    "knocks": [round(knock0 + i * 0.55, 3) for i in range(3)],
    "bass": scenes[8]["start"] + 0.05,
    "creak": scenes[10]["start"] + 1.0,
    "end": round(t, 3),
}
json.dump({"scenes": scenes, "captions": caps, "vo": vo, "sfx": sfx, "duration": round(t, 3)},
          open("timeline.json", "w"), indent=1)
print(json.dumps(scenes), "\n", sfx)
