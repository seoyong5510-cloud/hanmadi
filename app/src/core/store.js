// Learner data: one object kept on this device, with migration from the old app,
// validation of whatever is loaded, and export/import for backup.
import {today} from "./util.js";
import {LV} from "./levels.js";
export const KEY="hanmadi-v2";
export const OLD_KEY="hanmadi-progress";
export const P={};
const blank=()=>({v:2,level:"",done:{},days:{},secs:{},cards:{},mistakes:{},weak:{},pron:[],talks:[],usage:[],
  turns:{n:0,fixed:0},ai:{url:"",token:""},snd:true,tread:false,mic:0,goal:10,migrated:false});
const isObj=x=>x&&typeof x==="object"&&!Array.isArray(x);
const numMap=o=>{const r={};if(isObj(o))for(const k in o){const v=Number(o[k]);if(Number.isFinite(v)&&v>=0)r[k]=v;}return r;};
function cleanCards(o){
  const r={};
  if(isObj(o))for(const k in o){const c=o[k];if(c&&typeof c.due==="string"&&typeof c.lv==="number")r[k]={lv:Math.max(0,Math.min(6,Math.round(c.lv))),due:c.due,...(c.miss?{miss:Number(c.miss)||0}:{})};}
  return r;
}
// Accept anything, return a well-formed data object.
export function sanitize(o){
  const p=blank();
  if(!isObj(o))return p;
  p.level=LV[o.level]?o.level:"";
  if(isObj(o.done))for(const k in o.done)if(o.done[k])p.done[k]=true;
  p.days=numMap(o.days);p.secs=numMap(o.secs);p.weak=numMap(o.weak);
  p.cards=cleanCards(o.cards);
  if(isObj(o.mistakes))for(const k in o.mistakes){const m=o.mistakes[k];if(isObj(m)&&typeof m.en==="string"&&m.en)p.mistakes[k]={said:String(m.said||""),en:m.en,better:String(m.better||""),ko:String(m.ko||""),why:String(m.why||""),tag:String(m.tag||"other"),d:String(m.d||"")};}
  if(Array.isArray(o.pron))p.pron=o.pron.filter(x=>isObj(x)&&Number.isFinite(x.s)).slice(-300);
  if(Array.isArray(o.talks))p.talks=o.talks.filter(isObj).slice(-50);
  if(Array.isArray(o.usage))p.usage=o.usage.filter(isObj).slice(-3000);
  if(isObj(o.turns))p.turns={n:Number(o.turns.n)||0,fixed:Number(o.turns.fixed)||0};
  if(isObj(o.ai))p.ai={url:String(o.ai.url||"").replace(/\/+$/,""),token:String(o.ai.token||"")};
  p.snd=o.snd!==false;p.tread=o.tread===true;p.ears=Array.isArray(o.ears)?o.ears.slice(-30):[];p.wb=o.wb&&typeof o.wb==='object'?o.wb:{};p.mic=o.mic?1:0;
  p.goal=[5,10,20,30].includes(o.goal)?o.goal:10;
  p.migrated=!!o.migrated;
  return p;
}
// Old single-file app: levels were 1/2/3 and there was no time, mistake or AI data.
export function migrateOld(o){
  const p=blank();
  if(!isObj(o))return p;
  if(isObj(o.done))for(const k in o.done)if(o.done[k])p.done[k]=true;
  p.days=numMap(o.days);
  if(!Object.keys(p.days).length&&o.lastDay)p.days[String(o.lastDay)]=Number(o.count)||1;
  p.cards=cleanCards(o.cards);
  p.level={1:"a1",2:"a2",3:"b1"}[o.level]||"";
  if(!p.level&&(Object.keys(p.done).length||Object.keys(p.days).length))p.level="a1";
  p.snd=o.snd!==false;p.mic=o.mic?1:0;p.migrated=true;
  return p;
}
function assign(p){Object.keys(P).forEach(k=>delete P[k]);Object.assign(P,p);return P;}
export function load(storage=globalThis.localStorage){
  let p=null;
  try{const raw=storage.getItem(KEY);if(raw)p=sanitize(JSON.parse(raw));}catch(e){p=null;}
  if(!p){
    let old=null;
    try{old=JSON.parse(storage.getItem(OLD_KEY)||"null");}catch(e){old=null;}
    p=migrateOld(old);
  }
  return assign(p);
}
export function save(storage=globalThis.localStorage){
  try{storage.setItem(KEY,JSON.stringify(P));return true;}catch(e){return false;}
}
export function reset(){return assign(blank());}
export function exportData(){
  const copy=JSON.parse(JSON.stringify(P));
  copy.ai={url:copy.ai.url,token:""}; // never put the access code into a backup file
  return JSON.stringify({app:"hanmadi",version:2,exported:new Date().toISOString(),data:copy});
}
export function importData(text){
  const o=JSON.parse(text);
  if(!isObj(o)||o.app!=="hanmadi"||!isObj(o.data))throw new Error("not a hanmadi backup");
  const keep=P.ai;
  const p=sanitize(o.data);
  if(!p.ai.token&&keep&&keep.url===p.ai.url)p.ai.token=keep.token;
  return assign(p);
}
export const addSay=(n=1)=>{const t=today();P.days[t]=(P.days[t]||0)+n;};
export const addSecs=s=>{if(s>0&&s<4*3600){const t=today();P.secs[t]=(P.secs[t]||0)+Math.round(s);}};
