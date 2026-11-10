// Client for the personal relay server. The relay holds the AI and speech keys;
// this app only knows the relay's address and a personal access code.
import {P,save} from "../core/store.js";
import {today} from "../core/util.js";
export let caps={checked:false,ok:false,llm:false,speech:false,provider:"",model:"",error:""};
export const relayReady=()=>!!(P.ai&&P.ai.url&&P.ai.token);
export const llmReady=()=>relayReady()&&caps.ok&&caps.llm;
export const speechReady=()=>relayReady()&&caps.ok&&caps.speech;
export class RelayError extends Error{constructor(code,message){super(message||code);this.code=code;}}
export const errorKo=e=>{
  const c=e&&e.code||"";
  if(c==="no_relay")return "AI 연결이 아직 설정되지 않았어요.";
  if(c==="network"||c==="timeout")return "인터넷 연결을 확인하고 다시 시도해 주세요.";
  if(c==="unauthorized")return "접속 암호가 맞지 않아요. 설정에서 확인해 주세요.";
  if(c==="llm_not_configured")return "서버에 AI 키가 아직 등록되지 않았어요.";
  if(c==="speech_not_configured")return "서버에 음성 서비스 키가 아직 등록되지 않았어요.";
  if(c==="daily_limit")return "오늘 쓸 수 있는 AI 횟수를 다 썼어요. 내일 다시 쓸 수 있어요. 수업과 복습은 계속할 수 있어요.";
  if(c==="rate_limited")return "요청이 너무 많아요. 잠시 뒤 다시 시도해 주세요.";
  if(c==="bad_audio")return "녹음이 너무 짧거나 길어요. 다시 녹음해 주세요.";
  return "AI 서버에서 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.";
};
async function raw(path,init,timeout){
  if(!relayReady())throw new RelayError("no_relay");
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout||30000);
  let r;
  try{
    r=await fetch(P.ai.url+path,Object.assign({},init,{signal:ctrl.signal,headers:Object.assign({"x-app-token":P.ai.token},init&&init.headers)}));
  }catch(e){
    throw new RelayError(e&&e.name==="AbortError"?"timeout":"network");
  }finally{clearTimeout(timer);}
  if(!r.ok){
    let j={};try{j=await r.json();}catch(e){}
    throw new RelayError(j.error||(r.status===401?"unauthorized":r.status===429?"rate_limited":"server_error"),j.message);
  }
  return r;
}
export function logUsage(kind,u){
  if(!u)return;
  P.usage.push({d:today(),k:kind,i:u.in||0,o:u.out||0,s:Math.round((u.seconds||0)*10)/10,c:u.chars||0,usd:u.usd||0});
  if(P.usage.length>3000)P.usage.splice(0,P.usage.length-3000);
  save();
}
export async function health(){
  try{
    const r=await raw("/v1/health",{method:"GET"},10000),j=await r.json();
    caps={checked:true,ok:true,llm:!!j.llm,speech:!!j.speech,provider:j.provider||"",model:j.model||"",user:j.user||"",daily:j.daily||0,error:""};
  }catch(e){
    caps={checked:true,ok:false,llm:false,speech:false,provider:"",model:"",error:e.code||"network"};
  }
  return caps;
}
export async function call(path,body,timeout){
  const r=await raw(path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)},timeout);
  const j=await r.json();
  logUsage(path.replace("/v1/",""),j.usage);
  return j;
}
export async function callBlob(path,body){
  const r=await raw(path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)},20000);
  logUsage(path.replace("/v1/",""),{chars:Number(r.headers.get("x-usage-chars"))||0});
  return await r.blob();
}
export async function postAudio(path,blob){
  const r=await raw(path,{method:"POST",headers:{"content-type":"audio/wav"},body:blob},30000);
  const j=await r.json();
  logUsage("pron",j.usage);
  return j;
}
export function usageSummary(prefix){
  const rows=P.usage.filter(u=>u.d.startsWith(prefix));
  const sum=(k,f)=>rows.filter(u=>!k||u.k===k).reduce((a,u)=>a+(f(u)||0),0);
  return {turns:rows.filter(u=>u.k==="turn").length,reports:rows.filter(u=>u.k==="report").length,judges:rows.filter(u=>u.k==="judge").length,
    tokensIn:sum("",u=>u.i),tokensOut:sum("",u=>u.o),pronSeconds:Math.round(sum("pron",u=>u.s)),ttsChars:sum("tts",u=>u.c),usd:Math.round(sum("",u=>u.usd)*10000)/10000};
}
