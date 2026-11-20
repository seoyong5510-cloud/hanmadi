// Text → speech. Uses the natural neural voice through the relay when it is connected,
// otherwise the voice built into the phone.
import {speechReady,callBlob} from "../ai/relay.js";
import {LV} from "../core/levels.js";
import {P} from "../core/store.js";
export const DEVICE_TTS="speechSynthesis" in globalThis;
export const canSpeak=()=>DEVICE_TTS||speechReady();
const cache=new Map();
let audio=null,token=0;
if(DEVICE_TTS){try{speechSynthesis.getVoices();}catch(e){}}
export function stopSpeak(){
  token++;
  if(audio){try{audio.pause();}catch(e){}audio=null;}
  if(DEVICE_TTS){try{speechSynthesis.cancel();}catch(e){}}
}
const levelRate=()=>(LV[P.level]||LV.a1).mode.rate;
// Natural voices recorded in advance (app/audio). The index lists [file, learner-voice?, text].
let REC=null;
const recReady=fetch("audio-index.json").then(r=>r.ok?r.json():[]).then(rows=>{
  REC=new Map();
  rows.forEach(([k,me,t])=>{const e=REC.get(t)||{};e[me?"me":"them"]=k;REC.set(t,e);});
}).catch(()=>{REC=new Map();});
function recFor(text,who){
  const e=REC&&REC.get(text);if(!e)return "";
  return who==="them"?(e.them||e.me):(e.me||e.them);
}
// Warm the next line so there is no gap between speakers.
export function preload(text,who){
  recReady.then(()=>{const k=recFor(text,who);if(k)fetch("audio/"+k+".mp3").catch(()=>{});});
}
function playFile(url,mine,speed){
  return new Promise(res=>{
    const a=new Audio(url);audio=a;
    if(speed&&speed!==1){a.playbackRate=speed;a.preservesPitch=true;}
    let ok=false;
    a.onplaying=()=>{ok=true;};
    const done=()=>{if(audio===a)audio=null;res(ok);};
    a.onended=done;a.onpause=done;a.onerror=()=>{if(audio===a)audio=null;res(false);};
    a.play().catch(()=>res(false));
  });
}
// Resolves when speaking ends (or could not start).
export async function speak(text,rate,who){
  if(!text)return;
  stopSpeak();
  const mine=token,r=rate||levelRate();
  // 1) the recorded natural voice (already at a learner-friendly speed; "slow" plays it slower)
  if(!REC)await Promise.race([recReady,new Promise(x=>setTimeout(x,1500))]);
  if(mine!==token)return;
  const k=recFor(text,who);
  if(k){
    const played=await playFile("audio/"+k+".mp3",mine,rate&&rate<0.8?0.75:1);
    if(played||mine!==token)return;
  }
  if(speechReady()){
    try{
      const key=r.toFixed(2)+"|"+text;
      let url=cache.get(key);
      if(!url){
        const blob=await callBlob("/v1/tts",{text,rate:r});
        url=URL.createObjectURL(blob);
        if(cache.size>60){const k=cache.keys().next().value;URL.revokeObjectURL(cache.get(k));cache.delete(k);}
        cache.set(key,url);
      }
      if(mine!==token)return;
      const a=new Audio(url);audio=a;
      await new Promise(res=>{a.onended=res;a.onerror=res;a.onpause=res;a.play().catch(res);});
      if(audio===a)audio=null;
      return;
    }catch(e){/* fall back to the device voice */}
  }
  if(!DEVICE_TTS||mine!==token)return;
  await new Promise(res=>{
    try{
      const u=new SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=r;
      u.onend=res;u.onerror=res;
      speechSynthesis.speak(u);
      setTimeout(res,Math.max(4000,text.length*140));
    }catch(e){res();}
  });
}

// The teacher's Korean explanation, read aloud with the phone's own Korean voice. English words inside
// quotes or Latin letters are read by an English voice so they are not mangled. Resolves when done.
export async function speakKo(text){
  if(!text||!DEVICE_TTS)return;
  stopSpeak();
  const mine=token;
  const parts=String(text).split(/([A-Za-z][A-Za-z0-9' ,.?!~+\/-]*[A-Za-z?.!])/).map(s=>s.trim()).filter(Boolean);
  for(const part of parts){
    if(mine!==token)return;
    const en=/^[A-Za-z]/.test(part);
    await new Promise(res=>{
      try{
        const u=new SpeechSynthesisUtterance(en?part.replace(/[~+\/]/g," "):part);
        u.lang=en?"en-US":"ko-KR";u.rate=en?0.9:1;
        u.onend=res;u.onerror=res;
        speechSynthesis.speak(u);
        setTimeout(res,Math.max(4000,part.length*(en?140:260)));
      }catch(e){res();}
    });
  }
}
