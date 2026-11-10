import test from "node:test";
import assert from "node:assert/strict";
import {memStorage,loadAll} from "./helpers.mjs";
import {P,load,save,KEY,OLD_KEY,exportData,importData,sanitize,reset} from "../app/src/core/store.js";
import {setClock,today,plusDays} from "../app/src/core/util.js";
import {addCards,grow,dueKeys,streak,ensureCards,INT} from "../app/src/core/srs.js";
import {lesson,cardData} from "../app/src/core/content.js";
import {plan,stats,nextLesson} from "../app/src/core/plan.js";
loadAll();
const at=iso=>setClock(()=>new Date(iso));
test("first launch starts empty with no level",()=>{
  load(memStorage());
  assert.equal(P.level,"");assert.deepEqual(P.done,{});assert.equal(P.migrated,false);
});
test("old app data is migrated without touching the old record",()=>{
  const old={done:{l1:true},days:{"2026-11-10":15},cards:{"l1:0":{lv:1,due:"2026-11-12"},"l1:w0":{lv:0,due:"2026-11-10"},"bad":null},snd:false,level:1};
  const st=memStorage({[OLD_KEY]:JSON.stringify(old)});
  load(st);
  assert.equal(P.level,"a1");assert.equal(P.done.l1,true);assert.equal(P.days["2026-11-10"],15);
  assert.deepEqual(P.cards["l1:0"],{lv:1,due:"2026-11-12"});assert.equal(P.cards.bad,undefined);
  assert.equal(P.snd,false);assert.equal(P.migrated,true);
  save(st);
  assert.equal(st.getItem(OLD_KEY),JSON.stringify(old),"old record untouched");
  assert.ok(st.getItem(KEY));
});
test("old data without a level but with progress lands in A1; levels 2 and 3 map to A2 and B1",()=>{
  load(memStorage({[OLD_KEY]:JSON.stringify({done:{l1:true}})}));assert.equal(P.level,"a1");
  load(memStorage({[OLD_KEY]:JSON.stringify({level:2})}));assert.equal(P.level,"a2");
  load(memStorage({[OLD_KEY]:JSON.stringify({level:3})}));assert.equal(P.level,"b1");
});
test("saved data survives a restart",()=>{
  const st=memStorage();load(st);
  P.level="a2";P.done.b1=true;P.days["2026-11-10"]=7;P.mistakes.x1={said:"I go yesterday",en:"I went yesterday",ko:"어제 갔어요",why:"과거",tag:"past-tense"};
  save(st);load(st);
  assert.equal(P.level,"a2");assert.equal(P.done.b1,true);assert.equal(P.mistakes.x1.en,"I went yesterday");
});
test("corrupt or hostile saved data cannot break loading",()=>{
  for(const raw of ["{","null","[]",'{"cards":{"a":null,"b":{"lv":"x"}},"level":"zz","days":"no","usage":5}']){
    load(memStorage({[KEY]:raw}));
    assert.equal(typeof P.cards,"object");assert.equal(P.level,"");assert.ok(Array.isArray(P.usage));
  }
});
test("backup export and import round-trips and never contains the access code",()=>{
  load(memStorage());P.level="b1";P.done.c1=true;P.ai={url:"https://x.example",token:"secret"};
  const text=exportData();
  assert.ok(!text.includes("secret"));
  reset();importData(text);
  assert.equal(P.level,"b1");assert.equal(P.done.c1,true);assert.equal(P.ai.token,"");
  assert.throws(()=>importData('{"app":"other"}'));
});
test("spaced repetition steps",()=>{
  at("2026-11-10T09:00:00");load(memStorage());P.level="a1";
  addCards(P,lesson("l3"),plusDays(1));
  assert.equal(Object.keys(P.cards).length,4+3+5);
  assert.equal(dueKeys(P).length,0);
  at("2026-11-11T09:00:00");
  assert.equal(dueKeys(P).length,12);
  grow(P,"l3:0",1);assert.equal(P.cards["l3:0"].lv,1);assert.equal(P.cards["l3:0"].due,"2026-11-13");
  grow(P,"l3:0",0);assert.equal(P.cards["l3:0"].lv,1,"retry keeps the step");
  grow(P,"l3:0",-2);assert.equal(P.cards["l3:0"].lv,0);assert.equal(P.cards["l3:0"].miss,1);assert.equal(P.cards["l3:0"].due,"2026-11-12");
  for(let i=0;i<20;i++)grow(P,"l3:1",1);
  assert.equal(P.cards["l3:1"].lv,INT.length-1);
});
test("overdue cards come first",()=>{
  at("2026-11-20T09:00:00");load(memStorage());
  P.cards={"l1:0":{lv:0,due:"2026-11-19"},"l1:1":{lv:0,due:"2026-11-01"},"l1:2":{lv:0,due:"2026-12-01"}};
  assert.deepEqual(dueKeys(P),["l1:1","l1:0"]);
});
test("streak counts consecutive days and survives until the next day ends",()=>{
  load(memStorage());P.days={"2026-11-08":3,"2026-11-09":5,"2026-11-10":1};
  at("2026-11-10T23:00:00");assert.equal(streak(P),3);
  at("2026-11-11T08:00:00");assert.equal(streak(P),3,"not yet broken today");
  at("2026-11-12T08:00:00");assert.equal(streak(P),0);
});
test("mistakes from AI conversations become review cards",()=>{
  at("2026-11-10T09:00:00");load(memStorage());
  P.mistakes.m1={said:"I go there yesterday",en:"I went there yesterday.",better:"I went there yesterday.",ko:"어제 거기 갔어요.",why:"어제 일은 과거형을 써요.",tag:"past-tense",d:"2026-11-10"};
  P.cards["mx:m1"]={lv:0,due:"2026-11-10"};
  const c=cardData("mx:m1");assert.equal(c.en,"I went there yesterday.");assert.equal(c.mx,true);
  assert.deepEqual(dueKeys(P),["mx:m1"]);
  delete P.mistakes.m1;assert.deepEqual(dueKeys(P),[]);
});
test("ensureCards adds cards for lessons finished in the old app",()=>{
  at("2026-11-10T09:00:00");load(memStorage());P.done.l1=true;
  ensureCards(P);assert.equal(Object.keys(P.cards).length,12);
});
test("today's plan and stats",()=>{
  at("2026-11-10T09:00:00");load(memStorage());P.level="a1";
  let pl=plan(P);
  assert.equal(pl.next.id,"l1");assert.equal(pl.due,0);assert.equal(pl.pct,0);assert.ok(pl.sentence&&pl.word);
  P.done.l1=true;addCards(P,lesson("l1"),"2026-11-10");P.days["2026-11-10"]=5;P.secs["2026-11-10"]=300;P.weak={article:3,"past-tense":1};
  pl=plan(P);
  assert.equal(pl.next.id,"p02");assert.equal(pl.due,12);assert.equal(pl.pct,50);assert.equal(pl.weak.tag,"article");assert.equal(pl.talkLesson.id,"l1");
  assert.equal(nextLesson(P).id,"l2");
  const s=stats(P);
  assert.equal(s.minutes,5);assert.equal(s.days,1);assert.equal(s.streak,1);assert.equal(s.learned,12);assert.equal(s.grammar,null);assert.equal(s.pronLast,null);
  assert.equal(s.levels.find(l=>l.id==="a1").done,1);assert.equal(s.week.length,7);
});
