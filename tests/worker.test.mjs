import test from "node:test";
import assert from "node:assert/strict";
import worker,{parseJson,mapPron,tutorSystem} from "../server/worker.js";
import {encodeWav,resample} from "../app/src/speech/wav.js";
const realFetch=globalThis.fetch;
const env={APP_TOKEN:"code",LLM_API_KEY:"k",LLM_PROVIDER:"anthropic",PRICE_IN:"1",PRICE_OUT:"5",AZURE_SPEECH_KEY:"s",AZURE_SPEECH_REGION:"koreacentral"};
const post=(path,body,headers={})=>worker.fetch(new Request("https://relay.test"+path,{method:"POST",headers:Object.assign({"content-type":"application/json","x-app-token":"code"},headers),body:typeof body==="string"||body instanceof ArrayBuffer?body:JSON.stringify(body)}),env);
const anthropic=(text,usage={input_tokens:100,output_tokens:20})=>new Response(JSON.stringify({content:[{type:"text",text}],usage}),{status:200});
let calls=[];
function mock(handler){calls=[];globalThis.fetch=async(url,init)=>{calls.push({url:String(url),init});return handler(String(url),init);};}
test.afterEach(()=>{globalThis.fetch=realFetch;});

test("rejects a wrong or missing access code, and never calls the AI",async()=>{
  mock(()=>{throw new Error("must not be called");});
  const r=await worker.fetch(new Request("https://relay.test/v1/turn",{method:"POST",body:"{}"}),env);
  assert.equal(r.status,401);assert.equal((await r.json()).error,"unauthorized");
  assert.equal(calls.length,0);
});
test("health reports what is configured without exposing keys",async()=>{
  const r=await worker.fetch(new Request("https://relay.test/v1/health",{headers:{"x-app-token":"code"}}),env);
  const j=await r.json();
  assert.deepEqual([j.ok,j.llm,j.speech,j.provider],[true,true,true,"anthropic"]);
  assert.ok(!JSON.stringify(j).includes('"k"'));
  const j2=await (await worker.fetch(new Request("https://relay.test/v1/health",{headers:{"x-app-token":"code"}}),{APP_TOKEN:"code"})).json();
  assert.deepEqual([j2.llm,j2.speech],[false,false]);
});
test("CORS preflight is answered",async()=>{
  const r=await worker.fetch(new Request("https://relay.test/v1/turn",{method:"OPTIONS",headers:{Origin:"https://a.example"}}),env);
  assert.equal(r.status,204);assert.equal(r.headers.get("access-control-allow-origin"),"*");
});
test("tutor turn: sends level rules, memory and history; returns reply, correction and cost",async()=>{
  mock(()=>anthropic('Sure! {"reply":"Nice! What did you eat?","reply_ko":"좋네요! 뭐 먹었어요?","correction":{"said":"I go to cafe yesterday","correct":"I went to a cafe yesterday.","better":"I went to a cafe yesterday.","ko":"어제 카페에 갔어요.","why":"어제 일은 과거형 went를 써요.","tag":"past-tense"},"hint":null}'));
  const r=await post("/v1/turn",{cefr:"A2",role:"You are a friend.",memory:["article: a/the missing"],history:[{r:"a",t:"Hi! What did you do yesterday?"},{r:"u",t:"I go to cafe yesterday"}]});
  const j=await r.json();
  assert.equal(r.status,200);assert.equal(j.reply,"Nice! What did you eat?");assert.equal(j.correction.tag,"past-tense");assert.equal(j.hint,null);
  assert.deepEqual(j.usage,{in:100,out:20,usd:(100*1+20*5)/1e6});
  const sent=JSON.parse(calls[0].init.body);
  assert.equal(calls[0].init.headers["x-api-key"],"k");
  assert.match(sent.system,/CEFR A2/);assert.match(sent.system,/article: a\/the missing/);assert.match(sent.system,/You are a friend\./);
  assert.equal(sent.messages[0].role,"user","history must start with a user turn");
  assert.equal(sent.messages.at(-1).content,"I go to cafe yesterday");
});
test("tutor turn: opening line, hint request, unknown tag, and JSON retry",async()=>{
  mock(()=>anthropic('{"reply":"Hi! How are you?","reply_ko":"안녕하세요!","correction":null,"hint":null}'));
  let j=await (await post("/v1/turn",{cefr:"A1",start:true,history:[]})).json();
  assert.equal(j.reply,"Hi! How are you?");
  assert.match(JSON.parse(calls[0].init.body).messages[0].content,/Begin the conversation/);
  mock(()=>anthropic('{"reply":"You can do it!","reply_ko":"할 수 있어요!","correction":{"said":"x","correct":"y","tag":"weird"},"hint":{"ko":"주말에 한 일을 말해 보세요.","starter":"I went to"}}'));
  j=await (await post("/v1/turn",{cefr:"A1",hint:true,history:[{r:"a",t:"What did you do?"}]})).json();
  assert.equal(j.hint.starter,"I went to");assert.equal(j.correction,null,"no correction on a hint request");
  let n=0;
  mock(()=>anthropic(n++===0?"I cannot answer in JSON, sorry":'{"reply":"OK","reply_ko":"네","correction":{"said":"a","correct":"b","tag":"weird"},"hint":null}'));
  j=await (await post("/v1/turn",{cefr:"B1",history:[{r:"u",t:"hello"}]})).json();
  assert.equal(j.reply,"OK");assert.equal(j.correction.tag,"other");assert.equal(calls.length,2);assert.equal(j.usage.in,200);
});
test("AI failures are reported as errors, not as fake replies",async()=>{
  mock(()=>new Response(JSON.stringify({error:{message:"overloaded"}}),{status:529}));
  let r=await post("/v1/turn",{cefr:"A1",history:[{r:"u",t:"hi"}]});
  assert.equal(r.status,502);assert.equal((await r.json()).error,"ai_error");
  mock(()=>new Response("{}",{status:429}));
  r=await post("/v1/turn",{cefr:"A1",history:[{r:"u",t:"hi"}]});
  assert.equal(r.status,429);
  mock(()=>anthropic("still not json"));
  r=await post("/v1/turn",{cefr:"A1",history:[{r:"u",t:"hi"}]});
  assert.equal((await r.json()).error,"ai_bad_json");
  const r2=await worker.fetch(new Request("https://relay.test/v1/turn",{method:"POST",headers:{"x-app-token":"code","content-type":"application/json"},body:"{}"}),{APP_TOKEN:"code"});
  assert.equal((await r2.json()).error,"llm_not_configured");
});
test("OpenAI-compatible provider",async()=>{
  mock(()=>new Response(JSON.stringify({choices:[{message:{content:'{"ok":true,"natural":true,"fix":"","why_ko":"뜻이 같아요."}'}}],usage:{prompt_tokens:50,completion_tokens:10}}),{status:200}));
  const r=await worker.fetch(new Request("https://relay.test/v1/judge",{method:"POST",headers:{"x-app-token":"code","content-type":"application/json"},body:JSON.stringify({target:"Check, please.",ko:"계산서 주세요.",said:"could I get the bill"})}),{APP_TOKEN:"code",LLM_API_KEY:"o",LLM_PROVIDER:"openai",LLM_MODEL:"m1",LLM_BASE_URL:"https://llm.test/v1"});
  const j=await r.json();
  assert.equal(j.ok,true);assert.equal(calls[0].url,"https://llm.test/v1/chat/completions");
  assert.equal(calls[0].init.headers.authorization,"Bearer o");assert.equal(JSON.parse(calls[0].init.body).model,"m1");
});
test("report keeps at most five cleaned mistakes",async()=>{
  const m={said:"a",correct:"b",better:"b",ko:"ㄱ",why:"ㄴ",tag:"article"};
  mock(()=>anthropic(JSON.stringify({summary_ko:"잘했어요.",did_well:["1","2","3","4"],mistakes:[m,m,m,m,m,m,{said:"x"}],next_focus_ko:"관사",level_estimate:"A2"})));
  const j=await (await post("/v1/report",{cefr:"A2",history:[{r:"a",t:"Hi"},{r:"u",t:"hello"}]})).json();
  assert.equal(j.mistakes.length,5);assert.equal(j.did_well.length,3);assert.equal(j.level_estimate,"A2");
  assert.equal((await post("/v1/report",{history:[]})).status,400);
});
test("pronunciation: forwards WAV with the assessment header and maps only real scores",async()=>{
  const azure={RecognitionStatus:"Success",NBest:[{Display:"Good morning.",PronScore:84.4,AccuracyScore:100,FluencyScore:74,CompletenessScore:100,
    Words:[{Word:"Good",AccuracyScore:100,ErrorType:"None",Phonemes:[{Phoneme:"g",AccuracyScore:100},{Phoneme:"uh",AccuracyScore:98.2}]},{Word:"morning",AccuracyScore:61.7,ErrorType:"Mispronunciation"}]}]};
  mock(()=>new Response(JSON.stringify(azure),{status:200}));
  const wav=encodeWav(new Float32Array(16000),16000);
  const r=await post("/v1/pron?ref="+encodeURIComponent("Good morning."),wav,{"content-type":"audio/wav"});
  const j=await r.json();
  assert.equal(r.status,200);
  assert.deepEqual(j.scores,{pron:84,accuracy:100,fluency:74,completeness:100,prosody:null},"prosody was not returned, so it stays null");
  assert.deepEqual(j.words[1],{w:"morning",score:62,error:"Mispronunciation",phonemes:[]});
  assert.equal(j.words[0].phonemes[1].score,98);assert.equal(j.usage.seconds,1);
  assert.match(calls[0].url,/koreacentral\.stt\.speech\.microsoft\.com.*language=en-US&format=detailed/);
  const hdr=JSON.parse(Buffer.from(calls[0].init.headers["Pronunciation-Assessment"],"base64").toString("utf8"));
  assert.equal(hdr.ReferenceText,"Good morning.");assert.equal(hdr.Granularity,"Phoneme");
  assert.equal(calls[0].init.headers["Ocp-Apim-Subscription-Key"],"s");
});
test("pronunciation: rejects audio that is too short or too long, and no-match is not scored",async()=>{
  mock(()=>{throw new Error("must not be called");});
  assert.equal((await post("/v1/pron?ref=Hi",encodeWav(new Float32Array(1000),16000),{"content-type":"audio/wav"})).status,400);
  assert.equal((await post("/v1/pron?ref=Hi",encodeWav(new Float32Array(16000*31),16000),{"content-type":"audio/wav"})).status,400);
  assert.deepEqual(mapPron({RecognitionStatus:"NoMatch"}),{status:"NoMatch",text:"",scores:null,words:[]});
  const nested=mapPron({RecognitionStatus:"Success",NBest:[{Lexical:"hi",PronunciationAssessment:{PronScore:90,AccuracyScore:91,FluencyScore:92,CompletenessScore:100,ProsodyScore:77.6},Words:[{Word:"hi",PronunciationAssessment:{AccuracyScore:91,ErrorType:"None"}}]}]});
  assert.equal(nested.scores.prosody,78);assert.equal(nested.words[0].score,91);
});
test("natural voice: builds SSML with rate and escapes text",async()=>{
  mock(()=>new Response(new Uint8Array([1,2,3]),{status:200}));
  const r=await post("/v1/tts",{text:"Tom & Jerry's <show>",rate:0.6});
  assert.equal(r.headers.get("content-type"),"audio/mpeg");assert.equal(r.headers.get("x-usage-chars"),"20");
  assert.match(calls[0].init.body,/rate='-40%'/);assert.match(calls[0].init.body,/Tom &amp; Jerry&apos;s &lt;show&gt;/);
  const r2=await worker.fetch(new Request("https://relay.test/v1/tts",{method:"POST",headers:{"x-app-token":"code","content-type":"application/json"},body:'{"text":"hi"}'}),{APP_TOKEN:"code"});
  assert.equal((await r2.json()).error,"speech_not_configured");
});
test("helpers",()=>{
  assert.deepEqual(parseJson('noise {"a":1} tail'),{a:1});
  assert.throws(()=>parseJson("nothing"));
  assert.match(tutorSystem({cefr:"zz"}),/CEFR A1/);
  assert.equal(resample(new Float32Array(48000),48000,16000).length,16000);
  const w=new DataView(encodeWav(new Float32Array([0,1,-1]),16000));
  assert.equal(w.byteLength,50);assert.equal(w.getUint32(24,true),16000);assert.equal(w.getInt16(46,true),32767);assert.equal(w.getInt16(48,true),-32768);
});

test("each person uses only their own keys and code; the owner's keys are never used for them",async()=>{
  const env2=Object.assign({},env,{USERS:JSON.stringify({"minsu-code":{name:"민수",llm_key:"friend-key",llm_provider:"openai",llm_base_url:"https://friend.example/v1",llm_model:"m"},"nokey-code":{name:"지수"},"shared-code":{name:"아내",share:true}})});
  const call=(token,path="/v1/judge")=>worker.fetch(new Request("https://relay.test"+path,{method:path==="/v1/health"?"GET":"POST",headers:{"content-type":"application/json","x-app-token":token},body:path==="/v1/health"?undefined:JSON.stringify({target:"a",said:"a",ko:"가"})}),env2);
  mock(url=>url.includes("friend.example")?new Response(JSON.stringify({choices:[{message:{content:'{"ok":true,"natural":true,"fix":"","why_ko":"좋아요."}'}}],usage:{prompt_tokens:1,completion_tokens:1}}),{status:200}):anthropic('{"ok":true,"natural":true,"fix":"","why_ko":"좋아요."}'));
  assert.equal((await call("minsu-code")).status,200);
  assert.ok(calls[0].url.startsWith("https://friend.example/v1"));
  assert.equal(calls[0].init.headers.authorization||calls[0].init.headers.Authorization,"Bearer friend-key");
  assert.ok(!JSON.stringify(calls[0].init.headers).includes('"k"'));
  const h=await (await call("minsu-code","/v1/health")).json();
  assert.deepEqual([h.user,h.llm,h.speech],["민수",true,false]);
  // a person with no keys of their own gets nothing from the owner
  calls=[];
  const r=await call("nokey-code");
  assert.equal(r.status,503);assert.equal((await r.json()).error,"llm_not_configured");assert.equal(calls.length,0);
  // explicit sharing uses the owner's keys
  assert.equal((await call("shared-code")).status,200);
  assert.ok(calls[0].url.includes("api.anthropic.com"));
  // unknown codes and object-prototype names are rejected
  assert.equal((await call("someone-else")).status,401);
  assert.equal((await call("constructor")).status,401);
  assert.equal((await call("code")).status,200);
});
test("daily cap per person is enforced when usage storage is bound, and does not affect others",async()=>{
  const store=new Map(),USAGE={get:async k=>store.get(k)||null,put:async(k,v)=>{store.set(k,v);}};
  const env2=Object.assign({},env,{USAGE,USERS:JSON.stringify({"a-code":{name:"A",share:true,daily:2},"b-code":{name:"B",share:true,daily:2}})});
  const call=token=>worker.fetch(new Request("https://relay.test/v1/judge",{method:"POST",headers:{"content-type":"application/json","x-app-token":token},body:JSON.stringify({target:"a",said:"a",ko:"가"})}),env2);
  mock(()=>anthropic('{"ok":true,"natural":true,"fix":"","why_ko":"좋아요."}'));
  assert.equal((await call("a-code")).status,200);
  assert.equal((await call("a-code")).status,200);
  const r=await call("a-code");
  assert.equal(r.status,429);assert.equal((await r.json()).error,"daily_limit");
  assert.equal(calls.length,2);
  assert.equal((await call("b-code")).status,200);
  assert.equal((await call("code")).status,200);
});
