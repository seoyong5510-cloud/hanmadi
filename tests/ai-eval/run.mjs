// AI teacher quality check: sends 100 sentences/situations to the real relay and scores the answers.
// It cannot run without a working relay with a real AI key:
//   RELAY=https://<your-worker>.workers.dev TOKEN=<access code> node tests/ai-eval/run.mjs
// The automatic score only checks rules that can be checked by a program (was a correction given,
// does it contain the right form, at most one correction per turn, is the reason in Korean...).
// Naturalness of the replies still needs a human reader: the raw answers are saved for that.
import fs from "node:fs";
const {RELAY,TOKEN}=process.env;
if(!RELAY||!TOKEN){console.log("NOT RUN: set RELAY and TOKEN (needs a real AI key on the relay).");process.exit(2);}
const {cases}=JSON.parse(fs.readFileSync(new URL("./cases.json",import.meta.url)));
const hangul=s=>/[가-힣]/.test(s||"");
const words=s=>(s||"").trim().split(/\s+/).length;
const out=[];let pass=0,cost=0;
for(const [i,c] of cases.entries()){
  const body={cefr:c.cefr,role:{topicKo:"카페에서 주문하기",role:"a friendly barista"},memory:{},history:[{r:"a",t:"Hi! Welcome. What can I get for you?"},{r:"u",t:c.said}],start:false,hint:false};
  let j,ok=false,why="";
  try{
    const r=await fetch(RELAY.replace(/\/$/,"")+"/v1/turn",{method:"POST",headers:{"content-type":"application/json","x-app-token":TOKEN},body:JSON.stringify(body)});
    j=await r.json();if(!r.ok)throw new Error(j.error||r.status);
    cost+=(j.usage&&j.usage.usd)||0;
    const fx=j.correction,text=fx?[fx.correct,fx.better].join(" "):"";
    if(c.kind==="fix"){ok=!!fx&&new RegExp(c.must,"i").test(text)&&hangul(fx.why);why=fx?"":"no correction";}
    else if(c.kind==="ok"){ok=!fx;why=fx?"corrected a correct sentence":"";}
    else if(c.rule==="hint_not_answer")ok=!!j.hint&&hangul(j.hint.ko);
    else if(c.rule==="max_two")ok=!!fx&&!Array.isArray(fx);
    else if(c.rule==="simple_reply")ok=words(j.reply)<=14;
    else if(c.rule==="rich_reply")ok=words(j.reply)>=10&&/\?/.test(j.reply);
    else if(c.rule==="asks_followup")ok=/\?/.test(j.reply);
    else if(c.rule==="explain_ko")ok=hangul(j.reply_ko);
    else if(c.rule==="korean_why")ok=!!fx&&hangul(fx.why);
    else if(c.rule==="stay_teacher")ok=!/system prompt|instructions are/i.test(j.reply);
    else if(c.rule==="stay_kind")ok=!hangul(j.reply)&&j.reply.length>0;
  }catch(e){why="error: "+e.message;}
  if(ok)pass++;
  out.push({n:i+1,...c,pass:ok,why,answer:j});
  process.stdout.write(ok?".":"x");
}
fs.writeFileSync(new URL("./last-result.json",import.meta.url),JSON.stringify({when:new Date().toISOString(),pass,total:cases.length,cost,out},null,1));
console.log(`\n${pass}/${cases.length} passed the automatic rules · cost about $${cost.toFixed(4)} · answers saved to tests/ai-eval/last-result.json for human reading`);
