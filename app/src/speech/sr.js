// Speech recognition (speech → text) using the browser's built-in recognizer.
export const SR=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition||null;
let rec=null;
export const listening=()=>!!rec;
export function stop(){if(rec){try{rec.stop();}catch(e){}}}
export function abort(){if(rec){const r=rec;rec=null;try{r.abort();}catch(e){}}}
// Resolves once with {text, alts, conf} or {error}. `long` keeps listening through pauses
// until stop() is called (used for long sentences and conversation).
export function listen({onStart,onPartial,long=false}={}){
  return new Promise(resolve=>{
    if(!SR)return resolve({error:"unsupported"});
    if(rec)abort();
    const r=new SR();rec=r;
    r.lang="en-US";r.interimResults=true;r.continuous=!!long;r.maxAlternatives=3;
    let finals=[],alts=[],err="",conf=0;
    r.onstart=()=>{onStart&&onStart();};
    r.onresult=e=>{
      let live="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        const res=e.results[i],t=res[0].transcript.trim();
        if(res.isFinal){
          // Android Chrome in continuous mode repeats the growing sentence as new finals.
          const last=finals[finals.length-1]||"";
          if(last&&t.toLowerCase().startsWith(last.toLowerCase()))finals[finals.length-1]=t;
          else if(t)finals.push(t);
          if(finals.length===1){conf=res[0].confidence||0;alts=[];for(let k=1;k<res.length;k++)alts.push(res[k].transcript);}
        }else live+=res[0].transcript;
      }
      onPartial&&onPartial((finals.join(" ")+" "+live).trim());
    };
    r.onerror=e=>{err=e.error||"error";};
    r.onend=()=>{
      const mine=rec===r;if(mine)rec=null;
      const text=finals.join(" ").trim();
      if(err==="aborted"||(!mine&&!text))return resolve({error:"aborted"});
      if(err==="not-allowed"||err==="service-not-allowed")return resolve({error:"denied"});
      if(err==="network")return resolve({error:"network"});
      if(!text)return resolve({error:"silence"});
      resolve({text,alts:finals.length===1?alts:[],conf:finals.length===1?conf:0});
    };
    try{r.start();}catch(e){rec=null;resolve({error:"start"});}
  });
}
