"""What If Your Energy Was Visible? - Maple Hill. Fast narrator, 2-word captions."""
import json, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
V = sys.argv[1]
k = Kokoro(f"{V}/kokoro.onnx", f"{V}/voices.bin")
# speaker: (voice, speed, pitch)
SPK = {"N": ("am_onyx", 1.08, 1.0), "E": ("am_echo", 1.0, 1.12), "I": ("af_sky", 1.02, 1.08),
       "B": ("am_michael", 1.04, 1.1), "T": ("bm_lewis", 1.0, 1.0), "M": ("af_bella", 0.98, 1.0)}
SCENES = [
 (1, 3.8, [(0.2,"N","hook","What if everyone could see how much energy you had left?")],0.3),
 (2, 6.0, [(0.2,"N","town","In the town of Maple Hill, every person had a battery floating above their head."),
           (0.25,"N","charge","Sleep charged it. Hugs charged it. Bad days drained it.")],0.3),
 (3, 6.0, [(0.2,"N","most","Most kids walked into school at a hundred percent."),
           (0.2,"N","notEli","But not Eli."),
           (0.2,"N","three","Eli's battery was always at three percent.")],0.4),
 (4, 6.0, [(0.2,"B","careful","Careful, everyone! Low Battery Eli might shut down!"),
           (0.2,"N","laughed","The whole class laughed."),
           (0.2,"N","smiled","Eli just smiled, and looked down at his desk.")],0.4),
 (5, 5.0, [(0.2,"T","sleep","Eli, are you sleeping enough at home?"),
           (0.25,"E","fine","I'm fine, Mister Hale. Really.")],0.4),
 (6, 6.0, [(0.2,"N","lunch","At lunch, a new girl named Ivy sat all alone."),
           (0.2,"N","dropping","Her battery was dropping fast.")],0.3),
 (7, 7.0, [(0.2,"E","cookie","Hey. You can have my cookie. First days are the worst."),
           (0.25,"N","jumped","Ivy's battery jumped to sixty percent."),
           (0.2,"N","two","And Eli's dropped to two.")],0.4),
 (8, 4.5, [(0.2,"I","wait","Wait... did your battery just go down?"),
           (0.25,"E","does","Ha. It does that sometimes.")],0.4),
 (9, 9.0, [(0.2,"N","watching","After that, Ivy started watching him."),
           (0.2,"N","books","When a kid dropped his books, Eli helped. Plus twenty for the kid. Minus one for Eli."),
           (0.25,"N","busstop","When a little girl cried at the bus stop, he made her laugh. Minus one again.")],0.4),
 (10, 9.0, [(0.2,"N","followed","So one day, Ivy followed him home."),
            (0.2,"N","shift","His mom had just finished a double shift. Her battery was almost empty."),
            (0.25,"E","welcome","Welcome home, Mom."),
            (0.2,"N","hugged","He hugged her. And all his energy flowed into her.")],0.4),
 (11, 7.0, [(0.3,"N","blinked","That night, Eli's battery blinked at one percent."),
            (0.3,"N","never","He never charged himself. Not once. He gave it all away.")],0.7),
 (12, 6.0, [(0.2,"N","morning","The next morning, in the middle of class..."),
            (0.3,"N","zero","Eli's battery hit zero."),
            (0.2,"T","eli","Eli!")],0.6),
 (13, 8.0, [(0.3,"I","laughed2","You all laughed at him. But every one of you has his energy inside you."),
            (0.3,"I","gave","He gave it to you. Every single day.")],0.5),
 (14, 7.0, [(0.2,"N","brock","Brock looked up at his own battery."),
            (0.2,"N","remember","And remembered who helped him up, when he fell last winter."),
            (0.25,"B","giveback","Then let's give it back.")],0.4),
 (15, 7.0, [(0.2,"N","onebyone","One by one, every kid put a hand on Eli's shoulder."),
            (0.3,"N","flowed","And the energy flowed back.")],1.0),
 (16, 8.5, [(0.2,"N","opened","Eli's eyes opened."),
            (0.25,"N","first","And for the first time in his life..."),
            (0.25,"N","hundred","his battery said one hundred percent."),
            (0.4,"E","feels","Is this... what it feels like?")],0.8),
 (17, 6.5, [(0.3,"N","never2","Because energy was never meant to be kept."),
            (0.3,"N","shared","It was meant to be shared.")],1.2),
 (18, 5.0, [(0.3,"N","who","Who would you give your energy to?")],3.2),
]
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
        voice, speed, pitch = SPK[spk]; cur += gap
        s, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
        if pitch != 1.0: s = np.interp(np.arange(0, len(s), pitch), np.arange(len(s)), s)
        # trim leading/trailing silence for tighter pacing
        a = np.where(np.abs(s) > 0.01)[0]; s = s[max(0, a[0] - 600): a[-1] + 2400] if len(a) else s
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
