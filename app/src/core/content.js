// Lesson content: loaded from JSON files per level and indexed by lesson id.
import {LEVELS} from "./levels.js";
import {P} from "./store.js";
let BY={},UNITS={},LEVEL_OF={},META={},GRAM=null;
export function initContent(byLevel){
  BY={};UNITS={};LEVEL_OF={};META={};GRAM=null;
  LEVELS.forEach(lv=>{
    const d=byLevel[lv.id]||{units:[]};
    META[lv.id]={reviewed:!!d.reviewed};
    UNITS[lv.id]=d.units.map(u=>({name:u.name,ids:u.lessons.map(l=>l.id)}));
    d.units.forEach(u=>u.lessons.forEach(l=>{
      l.words=(l.words||[]).map(w=>Array.isArray(w)?{w:w[0],ko:w[1],e:w[2],ex:w[3]||""}:w);
      l.ph.forEach(p=>{p.alt=p.alt||[];});
      BY[l.id]=l;LEVEL_OF[l.id]=lv.id;
    }));
  });
}
export async function loadContent(base="content/"){
  const out={};
  await Promise.all(LEVELS.map(async lv=>{
    const r=await fetch(base+lv.id+".json");
    if(!r.ok)throw new Error("content "+lv.id+" "+r.status);
    out[lv.id]=await r.json();
  }));
  initContent(out);
}
export const lesson=id=>BY[id]||null;
// Grammar explanation for a lesson sentence, looked up by its English text ("" when there is none).
export function gramFor(en){
  if(!GRAM){GRAM={};Object.values(BY).forEach(l=>l.ph.forEach(p=>{if(p.gram)GRAM[p.en]=p.gram;}));}
  return GRAM[en]||"";
}
export const unitsOf=lv=>UNITS[lv]||[];
export const orderOf=lv=>unitsOf(lv).flatMap(u=>u.ids);
export const levelOfLesson=id=>LEVEL_OF[id]||"a1";
export const allLessons=()=>Object.values(BY);
export const reviewed=lv=>!!(META[lv]&&META[lv].reviewed);
// A review card key is "<lesson>:<n>" (sentence), "<lesson>:p<n>" (pattern sentence),
// "<lesson>:w<n>" (word) or "mx:<id>" (a mistake from an AI conversation).
export function cardData(k){
  const a=k.split(":");
  if(a[0]==="mx"){const m=P.mistakes&&P.mistakes[a[1]];return m?{en:m.en,ko:m.ko,alt:m.better&&m.better!==m.en?[m.better]:[],note:m.why,mx:true}:null;}
  const l=BY[a[0]];
  if(!l||!a[1])return null;
  if(a[1][0]==="w")return l.words[+a[1].slice(1)]||null;
  if(a[1][0]==="p")return l.pat.items[+a[1].slice(1)]||null;
  return l.ph[+a[1]]||null;
}
export const cardLevel=k=>k.startsWith("mx:")?(P.level||"a1"):levelOfLesson(k.split(":")[0]);
