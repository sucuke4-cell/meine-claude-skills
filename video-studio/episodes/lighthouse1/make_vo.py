"""The Lighthouse That Waited - emotional story voice-over (fast narrator)."""
import json, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
V = sys.argv[1]
k = Kokoro(f"{V}/kokoro.onnx", f"{V}/voices.bin")
SPK = {"N": ("am_onyx", 1.05, 1.0), "D": ("bm_george", 0.95, 1.0), "M": ("af_sarah", 0.98, 1.0)}
SCENES = [
 (1, 4.0, [(0.3,"N","hook","Every night, a girl climbed a lighthouse to wait for a boat that never came.")],0.5),
 (2, 7.0, [(0.3,"N","dad","Nora's father was a fisherman. The best in the village."),
           (0.4,"D","back","One more catch, and I'll be back before dark, Nora.")],0.7),
 (3, 6.5, [(0.3,"N","storm","But that night, the sky turned black."),
           (0.4,"N","didnt","And his boat never came back.")],1.0),
 (4, 7.0, [(0.3,"N","everynight","So every night since, Nora climbed the lighthouse stairs."),
           (0.4,"N","lit","And lit the lamp herself.")],0.7),
 (5, 6.5, [(0.4,"M","years","It's been three years, Nora. You have to let it rest."),
           (0.4,"N","notyet","But Nora shook her head. Not yet.")],1.0),
 (6, 7.5, [(0.3,"N","everybeam","Because every beam of light swept the water."),
           (0.4,"N","searching","Still searching. Still hoping.")],0.8),
 (7, 7.0, [(0.3,"N","onenight","Then, one stormy night, exactly like that one..."),
           (0.4,"N","sawit","she saw it. A small light, far out on the water.")],0.9),
 (8, 6.0, [(0.3,"N","ran","Nora ran down every single step."),
           (0.4,"N","intostorm","Out into the storm, onto the pier.")],0.8),
 (9, 7.5, [(0.3,"N","boat","A tiny boat, battered by the waves, drifting in."),
           (0.5,"N","inside","And inside it... an old fisherman, half frozen.")],1.0),
 (10, 6.0, [(0.5,"D","nora","...Nora? Is that really you?")],1.4),
 (11, 7.0, [(0.3,"N","notdad","It wasn't her father."),
            (0.4,"N","stranger","A stranger. Lost at sea for weeks, following her light home.")],1.0),
 (12, 7.0, [(0.3,"N","hugged","She hugged him anyway. Because that's what the light was for."),
            (0.4,"N","bringing","Bringing somebody's father home.")],1.2),
 (13, 7.0, [(0.3,"N","nextnight","The next night, Nora climbed the stairs again."),
            (0.5,"N","still","Still lighting the lamp. Still searching.")],1.0),
 (14, 7.5, [(0.3,"N","because","Because somewhere out there, someone's family was still waiting."),
            (0.5,"N","alwaysbe","And that light would always be burning.")],2.4),
 (15, 6.0, [(0.3,"N","out","Would you keep the light burning for a stranger?")],4.0),
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
