"""In This Town - mixed compilation voice-over (6 original micro-stories)."""
import json, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
V = sys.argv[1]
k = Kokoro(f"{V}/kokoro.onnx", f"{V}/voices.bin")
SPK = {"N": ("am_onyx", 0.9, 1.0), "K": ("am_liam", 1.0, 1.0), "G": ("af_nicole", 0.92, 1.0),
       "M": ("af_sarah", 0.92, 1.0), "V": ("am_fenrir", 0.82, 1.14), "B": ("bm_george", 0.88, 1.0)}
SCENES = [
 (1, 3.6, [(0.3,"N","intro","Six rules. One town. Break one, and the town breaks you.")],0.6),
 # 1: umbrellas
 (2, 8.0, [(0.2,"N","s1a","In this town, you carry an umbrella. Even when the sun is out."),
           (0.4,"N","s1b","Because the rain here... only falls on one person at a time.")],0.6),
 (3, 7.5, [(0.3,"N","s1c","Lena forgot hers once."),
           (0.5,"N","s1d","By the time she got home... there was nothing left to dry.")],1.3),
 # 2: the market of trades
 (4, 8.0, [(0.2,"N","s2a","In this town, the market will trade you anything."),
           (0.4,"N","s2b","A toy. A memory. A name. The shopkeeper only smiles.")],0.6),
 (5, 8.0, [(0.3,"G","s2c","I'll trade my name for that doll."),
           (0.5,"N","s2d","She got the doll. Now no one remembers she was ever here.")],1.3),
 # 3: birthday candles
 (6, 8.0, [(0.2,"N","s3a","In this town, your cake doesn't count the years you've lived."),
           (0.4,"N","s3b","It counts the years you have left.")],0.6),
 (7, 7.5, [(0.3,"N","s3c","Noah turned ten. His cake had one candle."),
           (0.5,"K","s3d","Mom... why is there only one?")],1.3),
 # 4: the garden
 (8, 8.0, [(0.2,"N","s4a","In this town, you can plant anything. But it never grows what you planted."),
           (0.4,"N","s4b","It grows... what you're afraid of.")],0.6),
 (9, 7.5, [(0.3,"N","s4c","A boy planted tomatoes to prove he wasn't scared."),
           (0.5,"N","s4d","The next morning, the whole field was watching him.")],1.3),
 # 5: the empty house
 (10, 8.0, [(0.2,"N","s5a","In this town, there's one house nobody walks past twice."),
            (0.4,"N","s5b","Last week... a new family moved in.")],0.6),
 (11, 8.0, [(0.3,"N","s5c","Every night, another welcome mat appears at the door."),
            (0.5,"B","s5d","We didn't buy those."),
            (0.3,"N","s5e","Each one has a different family's name.")],1.3),
 # 6 finale: the siren
 (12, 8.5, [(0.2,"N","s6a","And the last rule. When the siren rings, you hide. You do not look."),
            (0.4,"M","s6b","It's just the wind, sweetheart.")],0.6),
 (13, 10.0, [(0.3,"N","s6c","But the siren rang three days ago."),
             (0.5,"N","s6d","And Mom... has been smiling at the window ever since."),
             (0.4,"N","s6e","She hasn't blinked once.")],1.8),
 (14, 6.5, [(0.3,"N","out","Six rules. Which one would you break first?")],4.4),
]
def chunks(text,n=4):
    w=text.replace("...","…").split(); return [" ".join(w[i:i+n]) for i in range(0,len(w),n)]
t,scenes,caps,vo=0.0,[],[],{}
for sid,ml,segs,tail in SCENES:
    start,cur=t,t
    for gap,spk,key,text in segs:
        voice,speed,pitch=SPK[spk]; cur+=gap
        s,sr=k.create(text,voice=voice,speed=speed,lang="en-us")
        if pitch!=1.0: s=np.interp(np.arange(0,len(s),1/pitch),np.arange(len(s)),s)
        f=f"audio/{key}.wav"; sf.write(f,s,sr); d=len(s)/sr
        vo[key]={"file":f,"start":round(cur,3),"dur":round(d,3),"spk":spk,"scene":sid}
        parts=chunks(text); tot=sum(len(p) for p in parts); c=cur
        for p in parts:
            pd=d*len(p)/tot; caps.append({"text":p,"start":round(c,3),"end":round(c+pd,3),"spk":spk}); c+=pd
        cur+=d
    end=max(cur+tail,start+ml); scenes.append({"id":sid,"start":round(start,3),"end":round(end,3)}); t=end
json.dump({"scenes":scenes,"captions":caps,"vo":vo,"duration":round(t,3)},open("timeline.json","w"),indent=1)
for s in scenes: print(s)
print("total",round(t,1))
