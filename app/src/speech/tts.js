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
// Resolves when speaking ends (or could not start).
export async function speak(text,rate){
  if(!text)return;
  stopSpeak();
  const mine=token,r=rate||levelRate();
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
