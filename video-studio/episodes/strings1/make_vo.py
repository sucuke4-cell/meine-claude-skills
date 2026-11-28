"""What If Every Friendship Was a String? - Kitewood. Narrator af_jessica (bright, fast), 1-2 word captions."""
import json, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt
from kokoro_onnx import Kokoro
V = sys.argv[1]
k = Kokoro(f"{V}/kokoro.onnx", f"{V}/voices.bin")
# speaker: (voice, speed, pitch, lang)
SPK = {"N": ("af_jessica", 1.08, 1.0, "en-us"), "J": ("af_sky", 1.0, 1.1, "en-us"), "L": ("am_puck", 1.02, 1.12, "en-us"),
       "H": ("bf_isabella", 0.94, 0.93, "en-gb"), "K": ("am_eric", 1.05, 1.16, "en-us")}
SCENES = [
 (1, 3.4, [(0.2,"N","hook","What if every friendship was a string you could see?")],0.3),
 (2, 8.0, [(0.2,"N","town","In the town of Kitewood, the second you became friends with someone, a string tied your wrists together."),
           (0.2,"N","gold","Best friends glowed gold."),
           (0.25,"N","rule","But there was one rule. A string only appeared if BOTH of you knew.")],0.3),
 (3, 4.5, [(0.2,"N","leo","Leo had forty-seven strings."),
           (0.2,"N","everyone","Everyone wanted to be tied to Leo.")],0.3),
 (4, 6.0, [(0.2,"N","june","And then, there was June."),
           (0.2,"N","zero","Zero strings."),
           (0.2,"K","nostring","Look! It's No-String June!"),
           (0.2,"N","smiled","June just smiled, and kept walking.")],0.4),
 (5, 8.0, [(0.2,"N","morning","Every morning, before the sun came up, June snuck into Mrs. Hazel's old kite shop."),
           (0.2,"N","built","And built kites. Dozens of them."),
           (0.25,"N","nobody","Nobody knew who they were for.")],0.4),
 (6, 8.0, [(0.2,"N","snapped","The week before the Kite Festival, Leo's kite snapped in half."),
           (0.2,"L","great","Great. Now I'm the only one without a kite."),
           (0.25,"N","nextday","But the next morning, it was on his doorstep. Fixed. Better than new.")],0.4),
 (7, 7.0, [(0.2,"N","festival","Festival day. Every kid in Kitewood had a beautiful kite."),
           (0.2,"N","appeared","Kites that had just... appeared at their doors one day."),
           (0.25,"N","except","Every kid, except one.")],0.4),
 (8, 6.0, [(0.2,"H","again","You gave every single kite away again, didn't you?"),
           (0.3,"J","okay","It's okay. They don't need to know it was me.")],0.5),
 (9, 6.0, [(0.2,"N","wind","Then the wind changed."),
           (0.2,"N","storm","A storm slammed into the hill, and every kite ripped loose!")],0.4),
 (10, 7.0, [(0.2,"N","froze","Everyone froze. Except June."),
            (0.2,"N","ran","She ran to the edge of the cliff, and caught them. One after another.")],0.5),
 (11, 9.0, [(0.3,"L","written","Wait. There's something written inside my kite."),
            (0.3,"L","flyhigh","Fly high, Leo. Love, J."),
            (0.3,"N","looked","Every kid looked inside their kite. Every single one said the same thing.")],0.4),
 (12, 8.0, [(0.3,"N","knew","And the moment they knew..."),
            (0.3,"N","shot","strings shot out from every kid on that hill."),
            (0.3,"N","allgold","Gold. All of them. Tied to June.")],0.8),
 (13, 7.5, [(0.3,"N","girl","The girl with zero strings, was tied to the whole town."),
            (0.3,"N","nevertold","She just never told anyone.")],1.2),
 (14, 4.8, [(0.3,"N","tag","Who's your golden string? Tag them.")],3.0),
]
def polish(s, sr):  # bright presence + gentle compression (matches the reference narrator)
    s = s + 0.6 * sosfilt(butter(2, [2500, 6000], 'band', fs=sr, output='sos'), s)
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
        if pitch != 1.0: s = np.interp(np.arange(0, len(s), pitch), np.arange(len(s)), s)
        a = np.where(np.abs(s) > 0.01)[0]; s = s[max(0, a[0] - 600): a[-1] + 2400] if len(a) else s
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
