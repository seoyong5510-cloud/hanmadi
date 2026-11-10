import test from "node:test";
import assert from "node:assert/strict";
import {grade,gradeBest,gradeFrame,tipsFor} from "../app/src/core/grade.js";
import {loadAll} from "./helpers.mjs";
import {allLessons,levelOfLesson} from "../app/src/core/content.js";
import {LV} from "../app/src/core/levels.js";

test("exact, case and punctuation",()=>{
  assert.equal(grade("Nice to meet you.","nice to meet you").score,1);
  assert.equal(grade("Check, please.","CHECK PLEASE!").score,1);
});
test("contractions match their expanded forms both ways",()=>{
  for(const [t,s] of [["I'm good, thank you.","I am good thank you"],["I don't understand.","I do not understand"],["I'll take it.","I will take it"],
    ["I'll take it.","Ill take it"],["Let's meet at the station.","lets meet at the station"],["I'd take the offer.","I would take the offer"],
    ["I've had a sore throat since yesterday.","Ive had a sore throat since yesterday"],["It's hot today.","its hot today"],["What time is checkout?","what time is check out"],
    ["Can I have the Wi-Fi password?","can I have the WiFi password"],["A table for three, please.","a table for 3 please"]])
    assert.equal(grade(t,s).score,1,`${t} | ${s}`);
});
test("'s after a noun is handled by gradeBest",()=>{
  assert.equal(gradeBest(["My name is Kim."],["My name's Kim"]).score,1);
  assert.equal(gradeBest(["Dinner's on me to make up for it."],["dinner is on me to make up for it"]).score,1);
});
test("a missing or added 'not' never passes",()=>{
  assert.ok(grade("I don't understand.","I do understand").score<=0.5);
  assert.ok(grade("I'm from Korea.","I am not from Korea").score<=0.5);
  assert.ok(grade("I like soccer.","I don't like soccer").score<=0.5);
});
test("wrong sentence fails, partial sentence is partial",()=>{
  assert.equal(grade("Hello.","nice meet you").score,0);
  const g=grade("Where is the subway station?","where is subway");
  assert.ok(g.score>0.5&&g.score<0.7);
  assert.deepEqual(g.words.map(w=>w.hit),[true,true,false,true,false]);
});
test("alternatives are accepted and the matched target is reported",()=>{
  const g=gradeBest(["Check, please.","Can I have the check, please?"],["can I have the check please"]);
  assert.equal(g.score,1);assert.equal(g.target,"Can I have the check, please?");
});
test("recognition alternatives are tried",()=>{
  assert.equal(gradeBest(["I live in Seoul."],["I live in soul","I live in Seoul"]).score,1);
});
test("frame grading needs the frame and at least one extra word",()=>{
  assert.equal(gradeFrame("I like ___.",["I like fishing"]).ok,true);
  assert.equal(gradeFrame("I like ___.",["I like"]).ok,false);
  assert.equal(gradeFrame("Can I get ___, please?",["hello there"]).ok,false);
});
test("pronunciation tips pick sounds Koreans confuse",()=>{
  assert.deepEqual(tipsFor(["Thank","you"],2).map(t=>t.k),["th"]);
  assert.equal(tipsFor(["Hi"],2).length,0);
});
test("every lesson sentence and every alternative is accepted when read correctly",()=>{
  loadAll();
  let n=0;
  for(const l of allLessons()){
    const pass=LV[levelOfLesson(l.id)].mode.pass;
    for(const p of l.ph){
      for(const s of [p.en,...p.alt]){n++;assert.ok(gradeBest([p.en,...p.alt],[s]).score>=pass,`${l.id}: ${s}`);}
      // fully expanded speech-recognition style reading
      const plain=p.en.toLowerCase().replace(/[.,!?]/g,"");
      assert.ok(gradeBest([p.en,...p.alt],[plain]).score>=pass,`${l.id}: ${plain}`);
    }
    for(const it of l.pat.items){n++;assert.equal(gradeBest([it.en],[it.en]).score,1);}
  }
  assert.ok(n>500,"checked "+n);
});
