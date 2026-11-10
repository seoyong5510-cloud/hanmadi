// Screen switching shared by every view.
import {abort as abortSR} from "../speech/sr.js";
import {stopSpeak} from "../speech/tts.js";
import {save} from "../core/store.js";
import {I} from "./icons.js";
export const app=document.querySelector("#app");
export const chrome=document.querySelector("#chrome");
export const $=(s,r)=>(r||document).querySelector(s);
export const $$=(s,r)=>Array.from((r||document).querySelectorAll(s));
export const ui={tab:"today",browse:"",busy:"",gateSeen:false};
const views={};
export const register=(name,fn)=>{views[name]=fn;};
let cleanup=[];
// Things to stop when the current screen goes away (recording, timers…).
export const onLeave=f=>{cleanup.push(f);};
export function leave(){
  cleanup.splice(0).forEach(f=>{try{f();}catch(e){}});
  abortSR();stopSpeak();
  const c=document.getElementById("confetti");if(c)c.remove();
}
export function show(tab){
  if(tab)ui.tab=tab;
  leave();ui.busy="";
  views.root();
  window.scrollTo(0,0);
}
export function open(name,arg){leave();views[name](arg);window.scrollTo(0,0);}
// Entering a full-screen activity: the phone's back button returns to the tabs.
export function enter(kind){ui.busy=kind;try{history.pushState({s:1},"");}catch(e){}}
window.addEventListener("popstate",()=>{if(ui.busy){save();show();}});
export function tabsHtml(){
  const t=[["today","오늘",I.home],["lessons","수업",I.book],["talk","회화",I.chat],["stats","기록",I.chart],["set","설정",I.gear]];
  return '<nav class="tabs fixed" aria-label="메뉴">'+t.map(x=>'<button type="button" data-tab="'+x[0]+'" class="'+(ui.tab===x[0]?"on":"")+'"'+(ui.tab===x[0]?' aria-current="page"':"")+'>'+x[2]+x[1]+'</button>').join("")+'</nav>';
}
export function bindTabs(){
  $$("[data-tab]",chrome).forEach(b=>b.addEventListener("click",()=>show(b.dataset.tab)));
}
export const fit=()=>{const d=$("#dock"),e=$(".ex");if(d&&e)e.style.paddingBottom=(d.offsetHeight+24)+"px";};
