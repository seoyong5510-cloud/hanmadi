// Spaced repetition: each card has a step (lv) and the next day it is due.
import {today,plusDays,now,dayStr} from "./util.js";
import {cardData,lesson} from "./content.js";
export const INT=[1,2,4,7,15,30,60];
export function addCards(P,l,due){
  const add=k=>{if(!P.cards[k])P.cards[k]={lv:0,due};};
  l.ph.forEach((p,i)=>add(l.id+":"+i));
  l.pat.items.forEach((p,i)=>add(l.id+":p"+i));
  l.words.forEach((p,i)=>add(l.id+":w"+i));
}
// d = +1 first try, 0 passed after a retry, -2 needed a hint or was skipped.
export function grow(P,k,d){
  const c=P.cards[k];if(!c)return;
  c.lv=Math.max(0,Math.min(c.lv+d,INT.length-1));
  if(d<0)c.miss=(c.miss||0)+1;
  c.due=plusDays(INT[c.lv]);
}
export function dueKeys(P){
  const t=today();
  return Object.keys(P.cards).filter(k=>P.cards[k].due<=t&&cardData(k))
    .sort((a,b)=>P.cards[a].due<P.cards[b].due?-1:P.cards[a].due>P.cards[b].due?1:0);
}
export function streak(P){
  const d=now();
  if(!P.days[dayStr(d)])d.setDate(d.getDate()-1);
  let n=0;
  while(P.days[dayStr(d)]){n++;d.setDate(d.getDate()-1);}
  return n;
}
// Lessons finished in the old app may lack cards that were added later.
export function ensureCards(P){
  Object.keys(P.done).forEach(id=>{const l=lesson(id);if(l)addCards(P,l,today());});
}
export function addMistakeCard(P,id){P.cards["mx:"+id]={lv:0,due:plusDays(1)};}
