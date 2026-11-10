import test from "node:test";
import assert from "node:assert/strict";
import {QUIZ,shouldStop,place} from "../app/src/core/placement.js";
const run=answers=>{const c={1:0,2:0,3:0,4:0};let i=0;for(;;){if(answers(QUIZ[i]))c[QUIZ[i].tier]++;i++;if(shouldStop(i,c))break;}return {level:place(c),asked:i};};
test("twelve questions, three per tier, three options, first option is the answer",()=>{
  assert.equal(QUIZ.length,12);
  for(const t of [1,2,3,4])assert.equal(QUIZ.filter(q=>q.tier===t).length,3);
  for(const q of QUIZ){assert.equal(q.o.length,3);assert.equal(new Set(q.o).size,3);}
});
test("placement outcomes",()=>{
  assert.deepEqual(run(()=>false),{level:"a1",asked:3});
  assert.deepEqual(run(q=>q.tier===1),{level:"a1",asked:6});
  assert.deepEqual(run(q=>q.tier<=2),{level:"a2p",asked:9});
  assert.deepEqual(run(q=>q.tier<=3),{level:"b1",asked:12});
  assert.deepEqual(run(()=>true),{level:"b2",asked:12});
  let n=0;assert.equal(run(q=>q.tier===1||(q.tier===2&&n++<2)).level,"a2");
});
test("the test never places anyone in C1 (it is chosen by hand)",()=>{
  assert.notEqual(run(()=>true).level,"c1");
});
