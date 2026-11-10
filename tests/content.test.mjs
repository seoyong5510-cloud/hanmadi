import test from "node:test";
import assert from "node:assert/strict";
import {loadAll} from "./helpers.mjs";
import {LEVELS} from "../app/src/core/levels.js";
import {allLessons,orderOf,unitsOf,lesson,reviewed} from "../app/src/core/content.js";
const norm=s=>s.toLowerCase().replace(/[^a-z' ]/g,"").replace(/\s+/g," ").trim();
const data=loadAll();
test("six levels, each with lessons",()=>{
  assert.equal(LEVELS.length,6);
  for(const lv of LEVELS){assert.ok(orderOf(lv.id).length>=6,lv.id);assert.ok(unitsOf(lv.id).length>=2,lv.id);}
  assert.ok(allLessons().length>=90,String(allLessons().length));
  assert.equal(orderOf("a1").length,50);assert.equal(orderOf("a2").length,40);
});
test("lesson ids are unique across levels",()=>{
  const ids=LEVELS.flatMap(lv=>orderOf(lv.id));
  assert.equal(new Set(ids).size,ids.length);
});
test("every lesson has the full teaching data",()=>{
  for(const l of allLessons()){
    const T=l.id;
    for(const k of ["title","sub","e","goal","role","topicKo"])assert.ok(l[k],`${T}.${k}`);
    assert.ok(l.grammar&&l.grammar.point&&l.grammar.note,`${T}.grammar`);
    assert.equal(l.ph.length,4,T);
    for(const p of l.ph){
      assert.ok(p.en&&p.ko&&p.note,`${T} sentence fields`);
      assert.ok(p.gram&&p.gram.length>=15&&/[가-힣]/.test(p.gram),`${T} grammar explanation for "${p.en}"`);
      assert.ok(p.alt.length>=1,`${T}: "${p.en}" needs an alternative`);
      for(const a of p.alt)assert.notEqual(norm(a),norm(p.en),`${T}: alt equals original`);
      assert.ok(!/[0-9]/.test(p.en),`${T}: digits in "${p.en}"`);
    }
    assert.equal((l.pat.frame.match(/___/g)||[]).length,1,`${T} frame`);
    assert.equal(l.pat.items.length,3,T);
    for(const it of l.pat.items)assert.equal(norm(it.en),norm(l.pat.frame.replace("___",it.w)),`${T}: ${it.en}`);
    assert.equal(l.talk.map(t=>t.you).sort().join(""),"0123",`${T} talk`);
    for(const t of l.talk)assert.ok(typeof t.them==="string"&&t.ko,`${T} talk turn`);
    assert.equal(l.words.length,5,T);
    for(const w of l.words){assert.match(w.w,/^[a-z]{2,12}$/,`${T} word ${w.w}`);assert.ok(w.ko&&w.e,`${T} word ${w.w}`);}
    assert.equal(new Set(l.words.map(w=>w.w)).size,5,`${T} duplicate word in lesson`);
  }
});
test("ids used by the old app still exist (saved progress keeps working)",()=>{
  for(const id of ["l1","l2","l3","l4","l5","l6","l7","l8","l9","l10","b1","b6","c1","c6"])assert.ok(lesson(id),id);
});
test("content is honestly marked as not yet reviewed by a human expert",()=>{
  for(const lv of LEVELS){assert.equal(data[lv.id].reviewed,false);assert.equal(reviewed(lv.id),false);}
});
