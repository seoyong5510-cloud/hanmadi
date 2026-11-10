// What to study today, where the learner is weak, and the numbers for the stats screen.
import {today,dayStr,now} from "./util.js";
import {LEVELS} from "./levels.js";
import {orderOf,lesson,cardData,allLessons,levelOfLesson} from "./content.js";
import {dueKeys,streak} from "./srs.js";
export const TAGS={"past-tense":"과거형","tense":"시제","article":"관사 (a · the)","preposition":"전치사","word-choice":"단어 선택",
  "word-order":"어순","plural":"복수형","subject-verb":"주어와 동사 맞추기","pronunciation":"발음","other":"기타"};
export const tagName=t=>TAGS[t]||TAGS.other;
export const nextLesson=P=>lesson(orderOf(P.level).find(id=>!P.done[id]))||null;
export function weakList(P){
  return Object.entries(P.weak||{}).filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]).map(([tag,n])=>({tag,name:tagName(tag),n}));
}
export function hardCards(P,max=5){
  return Object.keys(P.cards).filter(k=>(P.cards[k].miss||0)>=2&&cardData(k)).sort((a,b)=>P.cards[b].miss-P.cards[a].miss).slice(0,max);
}
export function plan(P){
  const due=dueKeys(P),nl=nextLesson(P),said=P.days[today()]||0;
  const lastDone=orderOf(P.level).filter(id=>P.done[id]).pop();
  const talkLesson=lesson(lastDone)||nl;
  let sentence=null,word=null;
  const sk=due.find(k=>{const c=cardData(k);return c&&c.en;});
  if(sk)sentence=cardData(sk);else if(nl)sentence=nl.ph[0];
  const wk=due.find(k=>k.includes(":w"));
  if(wk)word=cardData(wk);else if(nl)word=nl.words[0]||null;
  return {due:due.length,next:nl,goal:P.goal,said,pct:Math.min(100,Math.round(said/P.goal*100)),sentence,word,talkLesson,weak:weakList(P)[0]||null};
}
export function stats(P){
  const keys=Object.keys(P.cards).filter(cardData);
  const words=keys.filter(k=>k.includes(":w"));
  const secs=Object.values(P.secs||{}).reduce((a,b)=>a+b,0);
  const week=[];
  for(let k=6;k>=0;k--){const x=now();x.setDate(x.getDate()-k);const ds=dayStr(x);week.push({day:x.getDay(),said:P.days[ds]||0,now:k===0});}
  const levels=LEVELS.map(lv=>{const ids=orderOf(lv.id);return {id:lv.id,name:lv.name,total:ids.length,done:ids.filter(id=>P.done[id]).length};});
  const pr=(P.pron||[]).slice(-10).map(x=>x.s);
  const half=Math.floor(pr.length/2);
  const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):null;
  return {
    minutes:Math.round(secs/60),days:Object.keys(P.days).length,streak:streak(P),
    learned:keys.length,mine:keys.filter(k=>P.cards[k].lv>=4).length,
    vocab:words.filter(k=>P.cards[k].lv>=2).length,vocabSeen:words.length,
    grammar:P.turns&&P.turns.n>=5?Math.round((1-P.turns.fixed/P.turns.n)*100):null,turns:P.turns?P.turns.n:0,
    pronLast:pr.length?Math.round(pr[pr.length-1]):null,pronCount:(P.pron||[]).length,
    pronTrend:pr.length>=4?avg(pr.slice(half))-avg(pr.slice(0,half)):null,
    week,levels,weak:weakList(P),talks:(P.talks||[]).length
  };
}
