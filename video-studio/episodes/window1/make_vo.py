"""The Window She Drew - emotional story voice-over (fast narrator)."""
import json, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
V = sys.argv[1]
k = Kokoro(f"{V}/kokoro.onnx", f"{V}/voices.bin")
SPK = {"N": ("am_onyx", 1.06, 1.0), "J": ("am_liam", 1.0, 1.0), "I": ("af_nicole", 0.98, 1.0)}
SCENES = [
 (1, 4.0, [(0.3,"N","hook","In a grey little town, there was a boy who never left his room.")],0.5),
 (2, 6.5, [(0.2,"N","sick","Jonah was sick. The world outside felt too big."),
           (0.3,"N","window","So he watched all of it... through one small window.")],0.8),
 (3, 6.0, [(0.3,"N","moved","Then one morning, a new girl moved in across the alley."),
           (0.4,"I","hi","Hi! I'm Ivy!")],0.6),
 (4, 7.0, [(0.3,"N","chalk","Every day, Ivy drew on her window with chalk."),
           (0.4,"I","ocean","Today... we're going to the ocean.")],0.7),
 (5, 6.0, [(0.3,"N","waves","And suddenly, Jonah could hear the waves."),
           (0.4,"J","whoa","Whoa... is that a whale?")],0.8),
 (6, 7.5, [(0.3,"N","everywhere","After that, Ivy took him everywhere."),
           (0.3,"N","forest","A forest full of fireflies."),
           (0.3,"N","city","A city that never slept.")],0.6),
 (7, 6.0, [(0.3,"N","mountains","Snow on mountains he could almost feel."),
           (0.4,"N","summer","For one whole summer, they travelled the world.")],0.8),
 (8, 5.5, [(0.3,"N","leaving","Without ever leaving home.")],1.2),
 (9, 7.0, [(0.3,"N","empty","Then one morning... Ivy's window was empty."),
           (0.5,"N","next","And the next day. And the next.")],1.0),
 (10, 7.5, [(0.3,"N","gone","Her family had moved away in the night."),
            (0.4,"N","onelast","But on her window... was one last drawing.")],0.8),
 (11, 7.0, [(0.3,"N","arrow","An arrow. Pointing out. And three words."),
            (0.6,"I","yourturn","Now it's your turn.")],1.2),
 (12, 6.5, [(0.3,"N","cried","Jonah pressed his hand to the glass. And for a long time... he just cried.")],1.0),
 (13, 7.0, [(0.3,"N","firsttime","Then, for the first time in years..."),
            (0.5,"N","opened","Jonah opened his door.")],1.0),
 (14, 7.5, [(0.3,"N","stepped","He stepped outside. And the whole world was waiting."),
            (0.4,"N","real","He went to see every place she gave him. For real.")],0.9),
 (15, 8.0, [(0.3,"N","beach","And on a beach, far from that little grey town..."),
            (0.5,"N","wrote","he wrote four words in the sand."),
            (0.5,"J","wish","Wish you were here.")],2.0),
 (16, 6.0, [(0.3,"N","out","Who gave YOUR world color? Tag them.")],4.0),
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
