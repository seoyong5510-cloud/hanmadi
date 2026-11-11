// End-to-end test in a real (headless) Chromium.
// The app talks to the REAL relay code (server/worker.js) running locally; only the outside
// providers (AI model, speech service) are replaced by canned responses, and the browser's
// speech recognition/voice are stubbed. So this proves the app and relay work together,
// not the quality of a real AI model or real pronunciation scoring.
// Run: node tests/e2e/run.mjs   (needs playwright; set PW to its folder if not installed here)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import worker from "../../server/worker.js";
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PW||"playwright");
const ROOT=path.resolve(new URL("../../app",import.meta.url).pathname);
const SHOTS=process.env.SHOTS||"/tmp/hanmadi-shots";fs.mkdirSync(SHOTS,{recursive:true});
const MIME={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".json":"application/json",".png":"image/png",".webmanifest":"application/manifest+json"};

/* ---- canned providers ---- */
const state={failAi:false,aiCalls:0,pronCalls:0,ttsCalls:0,prosody:false};
const realFetch=globalThis.fetch;
globalThis.fetch=async(url,init)=>{
  url=String(url);
  if(url.includes("api.anthropic.com")){
    state.aiCalls++;
    if(state.failAi)return new Response(JSON.stringify({error:{message:"overloaded"}}),{status:529});
    const b=JSON.parse(init.body),sys=b.system,last=b.messages[b.messages.length-1].content;
    let out;
    if(sys.includes("after-class report"))out={summary_ko:"카페 주문 대화를 끝까지 이어 갔어요. 과거형만 조금 더 연습하면 좋아요.",did_well:["\"Can I get a coffee, please?\"를 자연스럽게 말했어요."],mistakes:[{said:"I go to cafe yesterday",correct:"I went to a cafe yesterday.",better:"I went to a cafe yesterday.",ko:"어제 카페에 갔어요.",why:"어제 일은 과거형 went를 써요.",tag:"past-tense"}],next_focus_ko:"과거형 동사를 연습해 봐요.",level_estimate:"A2"};
    else if(sys.includes("You check a spoken answer"))out={ok:/bill/i.test(last),natural:true,fix:"",why_ko:/bill/i.test(last)?"bill도 계산서라는 뜻이라 같은 말이에요.":"뜻이 달라요."};
    else if(last.includes("Begin the conversation"))out={reply:"Hi! Welcome. What can I get for you?",reply_ko:"안녕하세요! 무엇을 드릴까요?",correction:null,hint:null};
    else if(last.includes("hint button"))out={reply:"You can do it!",reply_ko:"할 수 있어요!",correction:null,hint:{ko:"마시고 싶은 음료를 주문해 보세요.",starter:"Can I get"}};
    else if(/I go to cafe/.test(last))out={reply:"Oh nice! What did you drink?",reply_ko:"오 좋네요! 뭐 마셨어요?",correction:{said:"I go to cafe yesterday",correct:"I went to a cafe yesterday.",better:"I went to a cafe yesterday.",ko:"어제 카페에 갔어요.",why:"어제 일은 과거형 went를 써요.",tag:"past-tense"},hint:null};
    else out={reply:"Sure. Hot or iced?",reply_ko:"네. 따뜻한 거요, 차가운 거요?",correction:null,hint:null};
    return new Response(JSON.stringify({content:[{type:"text",text:JSON.stringify(out)}],usage:{input_tokens:400,output_tokens:60}}),{status:200});
  }
  if(url.includes(".stt.speech.microsoft.com")){
    state.pronCalls++;
    const top={Display:"Can I get a coffee, please?",PronScore:82.3,AccuracyScore:85,FluencyScore:78,CompletenessScore:100};
    if(state.prosody)top.ProsodyScore=71;
    return new Response(JSON.stringify({RecognitionStatus:"Success",Duration:"20000000",NBest:[Object.assign(top,{Words:[
      {Word:"Can",AccuracyScore:95,ErrorType:"None",Phonemes:[{Phoneme:"k",AccuracyScore:97},{Phoneme:"ae",AccuracyScore:93}]},{Word:"I",AccuracyScore:98,ErrorType:"None"},{Word:"get",AccuracyScore:90,ErrorType:"None"},
      {Word:"a",AccuracyScore:88,ErrorType:"None"},{Word:"coffee",AccuracyScore:52,ErrorType:"Mispronunciation",Phonemes:[{Phoneme:"k",AccuracyScore:90},{Phoneme:"f",AccuracyScore:31}]},{Word:"please",AccuracyScore:70,ErrorType:"None"}]})]}),{status:200});
  }
  if(url.includes(".tts.speech.microsoft.com")){state.ttsCalls++;return new Response(new Uint8Array(64),{status:200});}
  return realFetch(url,init);
};
const ENV={APP_TOKEN:"my-code",LLM_API_KEY:"k",LLM_PROVIDER:"anthropic",LLM_MODEL:"test-model",AZURE_SPEECH_KEY:"s",AZURE_SPEECH_REGION:"koreacentral",PRICE_IN:"1",PRICE_OUT:"5"};

const site=http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split("?")[0]);if(p.endsWith("/"))p+="index.html";
  const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)){res.writeHead(404);return res.end("nf");}
  res.writeHead(200,{"content-type":MIME[path.extname(f)]||"application/octet-stream"});res.end(fs.readFileSync(f));
}).listen(8123);
const relay=http.createServer(async(req,res)=>{
  const chunks=[];for await(const c of req)chunks.push(c);
  const body=Buffer.concat(chunks);
  const r=await worker.fetch(new Request("http://localhost:8124"+req.url,{method:req.method,headers:req.headers,body:["GET","HEAD","OPTIONS"].includes(req.method)?undefined:body}),ENV);
  const h={};r.headers.forEach((v,k)=>{h[k]=v;});
  res.writeHead(r.status,h);res.end(Buffer.from(await r.arrayBuffer()));
}).listen(8124);

/* ---- browser ---- */
const results=[];let failed=0;
const ok=(name,cond,detail)=>{results.push((cond?"PASS ":"FAIL ")+name+(cond||!detail?"":" :: "+detail));if(!cond)failed++;};
const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:["--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream","--autoplay-policy=no-user-gesture-required"]});
const STUBS=()=>{
  window.__say=[];window.__spoken=[];
  class FakeSR{
    start(){setTimeout(()=>{
      this.onstart&&this.onstart();
      const t=typeof window.__next==="function"?window.__next():window.__say.shift();
      if(t==null){this.onerror&&this.onerror({error:"no-speech"});}
      else{const res=[{transcript:t,confidence:0.93}];res.isFinal=true;this.onresult&&this.onresult({resultIndex:0,results:[res]});}
      this.onend&&this.onend();
    },15);}
    stop(){}
    abort(){this.onerror&&this.onerror({error:"aborted"});this.onend&&this.onend();}
  }
  window.SpeechRecognition=FakeSR;window.webkitSpeechRecognition=FakeSR;
  window.SpeechSynthesisUtterance=function(t){this.text=t;};
  Object.defineProperty(window,"speechSynthesis",{value:{getVoices:()=>[],cancel(){},speak(u){window.__spoken.push(u.text);setTimeout(()=>u.onend&&u.onend(),5);}},configurable:true});
  // make relay audio "play" instantly
  HTMLMediaElement.prototype.play=function(){setTimeout(()=>{this.onended&&this.onended();},5);return Promise.resolve();};
};
async function newPage(viewport,seed){
  const ctx=await browser.newContext({viewport,permissions:["microphone"]});
  const page=await ctx.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  page.on("console",m=>{if(m.type()==="error"&&!/favicon|manifest|pretendard|Failed to load resource/.test(m.text()))errors.push(m.text());});
  await page.addInitScript(STUBS);
  if(seed)await page.addInitScript(s=>{if(!sessionStorage.getItem("seeded")){for(const k in s)localStorage.setItem(k,s[k]);sessionStorage.setItem("seeded","1");}},seed);
  await page.goto("http://localhost:8123/?e2e=1");
  await page.waitForFunction(()=>window.__t&&window.__t.lesson("l1")&&document.querySelector("#app").children.length);
  return {page,errors,ctx};
}
const txt=(page,sel)=>page.evaluate(s=>{const e=document.querySelector(s);return e?e.innerText:"";},sel);
const overflow=page=>page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
// Drive one whole session by answering every exercise. mode: "good" or "badfirst".
async function driveSession(page,mode){
  return await page.evaluate(async mode=>{
    const sleep=ms=>new Promise(r=>setTimeout(r,ms)),q=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
    const seen=[];let guard=0,missed={};
    const findWord=ko=>{for(const l of window.__t.all()){const w=l.words.find(w=>w.ko===ko);if(w)return w.w;}return null;};
    const findKo=en=>{for(const l of window.__t.all()){const t=l.talk.find(t=>t.them===en);if(t)return t.ko;}return null;};
    while(guard++<400){
      await sleep(25);
      if(q("#home"))return {done:true,seen};
      const nx=q("#nx");if(nx){nx.click();continue;}
      const inst=(q(".inst")||{}).innerText||"",key=inst+"|"+((q(".koq")||q(".en")||q(".frame")||{}).innerText||"");
      if(q("#dock .fb")&&!q("#re"))continue;
      if(all("#app .opt").length){
        seen.push("choice");
        const play=q(".bigplay");
        const findQ=t=>{for(const l of window.__t.all()){const x=l.listen&&l.listen.qs.find(x=>x.q===t);if(x)return x.o[0];}return null;};
        const want=play?findKo(play.dataset.say):(findQ(q(".koq").innerText)||findWord(q(".koq").innerText));
        const opts=all("#app .opt").filter(o=>!o.disabled);
        if(mode==="badfirst"&&!missed[key]){missed[key]=1;const w=opts.find(o=>o.textContent!==want);if(w){w.click();continue;}}
        let r=opts.find(o=>o.textContent===want);
        if(!r&&!play){const ko=q(".koq").innerText;const ws=[];for(const l of window.__t.all())for(const w of l.words)if(w.ko===ko)ws.push(w.w);r=opts.find(o=>ws.includes(o.textContent));}
        if(!r)return {stuck:"no correct option for "+key,seen};
        r.click();continue;
      }
      if(q("#built")&&!q("#dock .fb")){
        seen.push("build");
        const all2=()=>[...document.querySelectorAll("#dock .wtile")].filter(b=>!b.disabled);
        if(mode==="badfirst"&&!missed[key]){missed[key]=1;all2()[0].click();await sleep(10);}
        let g2=0;
        while(!q("#dock .fb")&&g2++<200){for(const b of all2()){b.click();if(b.disabled)break;}await sleep(5);}
        if(!q("#dock .fb"))return {stuck:"build "+key,seen};
        continue;
      }
      if(all(".slot").length&&!q("#dock .fb")){
        seen.push("spell");
        let w=findWord(q(".koq").innerText);{const ko=q(".koq").innerText,n=all(".slot").length;const c=[];for(const l of window.__t.all())for(const x of l.words)if(x.ko===ko)c.push(x.w);w=c.find(x=>x.length===n)||w;}if(!w)return {stuck:"word not found "+key,seen};
        const kin=q("#kin");
        if(kin){if(mode==="badfirst"&&!missed[key]){missed[key]=1;kin.value="zzz";q("#kf").requestSubmit();await sleep(10);}kin.value=w;q("#kf").requestSubmit();continue;}
        for(const ch of w){const t=all("#dock .tile").find(b=>!b.disabled&&b.textContent===ch);if(!t)return {stuck:"tile "+ch+" for "+w,seen};t.click();}
        continue;
      }
      const mic=q("#mic"),re=q("#re");
      if(re){re.click();continue;}
      if(mic){
        seen.push("speak");
        const frame=q("h1.frame"),ans=q("#ans .en"),en=q("h1.en");
        let target=ans?ans.innerText:en?en.innerText:frame?frame.innerText.replace(/\s+/g," ").replace(/ ([,.?!])/g,"$1").replace(/  +/g," "):"";
        if(frame&&!ans)target=window.__frame();
        if(mode==="badfirst"&&!missed[key]){missed[key]=1;window.__next=()=>"banana banana";}
        else window.__next=()=>target;
        mic.click();await sleep(60);continue;
      }
    }
    return {stuck:"guard",seen,html:(q("#app")||{}).innerText.slice(0,200)+" || "+(q("#dock")||{}).innerText};
  },mode);
}

try{
  /* 1. first launch, level test */
  let {page,errors}=await newPage({width:390,height:844});
  ok("first launch shows welcome, not a level",(await txt(page,".fin h1")).includes("하루 5분"));
  await page.screenshot({path:SHOTS+"/01-welcome.png"});
  await page.click("#go");
  let asked=0;
  for(;;){
    if(await page.$(".fin .rows"))break;
    const want=await page.evaluate(async()=>{const m=await import("/src/core/placement.js");const n=+document.querySelector(".count").innerText.replace("번","")-1;return m.QUIZ[n].o[0];});
    if(asked===0)await page.screenshot({path:SHOTS+"/02-level-test.png"});
    await page.locator(".opt",{hasText:want}).first().click();asked++;
  }
  ok("level test: all correct asks 12 and recommends 중상급",asked===12&&(await txt(page,".fin h1")).includes("중상급"),asked+" "+await txt(page,".fin h1"));
  await page.click("#go");
  ok("level saved after the test",await page.evaluate(()=>window.__t.P.level)==="b2");
  ok("no horizontal overflow on today (390px)",await overflow(page)<=0);
  await page.screenshot({path:SHOTS+"/03-today-new.png"});
  ok("no page errors (first launch)",errors.length===0,errors.join(" | "));
  await page.context().close();

  /* 2. migration from the old app */
  const OLD={done:{l1:true},days:{"2026-11-10":15},cards:{"l1:0":{lv:1,due:"2026-11-09"},"l1:1":{lv:0,due:"2026-11-09"}},snd:false,level:1,mic:1};
  ({page,errors}=await newPage({width:390,height:844},{"hanmadi-progress":JSON.stringify(OLD)}));
  const mig=await page.evaluate(()=>({level:window.__t.P.level,done:window.__t.P.done,days:window.__t.P.days,cards:Object.keys(window.__t.P.cards).length,old:localStorage.getItem("hanmadi-progress"),v2:!!localStorage.getItem("hanmadi-v2")}));
  ok("old progress migrated (level, lessons, days)",mig.level==="a1"&&mig.done.l1===true&&mig.days["2026-11-10"]===15,JSON.stringify(mig));
  ok("old record left untouched and new record written",mig.old===JSON.stringify(OLD)&&mig.v2);
  ok("cards for the finished lesson completed (12)",mig.cards===12,String(mig.cards));
  ok("today shows 입문 단계 and a next lesson",(await txt(page,".date")).includes("입문")&&!!(await page.$('.rows [data-lesson]')));
  await page.screenshot({path:SHOTS+"/04-today-migrated.png"});

  /* 3. a full lesson at A1 with a wrong first try everywhere */
  await page.evaluate(()=>window.__t.show("lessons"));await page.click('[data-lesson="l2"]');
  ok("lesson opens with the teacher card and today's goal",!!(await page.$("img.tch"))&&(await txt(page,".tbub")).includes("자기소개"));
  await page.screenshot({path:SHOTS+"/05-lesson-intro.png"});
  await page.click("#nx");await page.waitForFunction(()=>!!document.querySelector(".tpoint"));
  ok("second teacher card explains the key point and the pattern",(await txt(page,".tcard")).includes("I like")&&(await page.$$(".tbub")).length===2);
  await page.screenshot({path:SHOTS+"/05a-teacher-point.png"});
  await page.click("#nx");await page.waitForSelector(".tlist");
  ok("third teacher card previews the four sentences",(await page.$$(".tlist li")).length===4);
  await page.screenshot({path:SHOTS+"/05a2-teacher-list.png"});
  await page.click("#nx");await page.waitForSelector("h1.en");
  ok("study screen explains the grammar of the sentence",(await txt(page,".gram")).includes("from")&&(await txt(page,".gram")).includes("전치사"),await txt(page,".gram"));
  await page.screenshot({path:SHOTS+"/05b-grammar.png"});
  await page.evaluate(()=>{window.__next=()=>"I'm from Korea";});await page.click("#mic");await page.waitForSelector("#nx");await page.click("#nx");await page.waitForSelector(".fadeline");
  ok("right after learning, the sentence is repeated with half the words hidden",(await page.$$(".fadeline .gap")).length>=1&&(await txt(page,".fadeline")).includes("I'm"));
  await page.screenshot({path:SHOTS+"/05c-fade.png"});
  await page.evaluate(()=>{window.__frame=()=>"I like fishing";});
  let r=await driveSession(page,"badfirst");
  ok("A1 lesson completes with wrong-then-right answers",r.done===true,JSON.stringify(r).slice(0,300));
  ok("lesson used choice, spelling and speaking exercises",["choice","spell","speak","build"].every(k=>r.seen.includes(k)));
  await page.screenshot({path:SHOTS+"/06-lesson-done.png"});
  ok("each new sentence is spoken many times in one lesson (repeat, half-hidden, recall, role-play, final round)",r.seen.filter(k=>k==="speak").length>=30,String(r.seen.filter(k=>k==="speak").length));
  let st=await page.evaluate(()=>{const P=window.__t.P;return {done:P.done.l2,cards:Object.keys(P.cards).length,secs:Object.values(P.secs).reduce((a,b)=>a+b,0),said:Object.values(P.days).reduce((a,b)=>a+b,0)};});
  ok("lesson recorded: done, 24 cards, spoken count grew, time tracked",st.done===true&&st.cards===24&&st.said>15&&st.secs>=1,JSON.stringify(st));
  await page.click("#home");

  /* 3b. sound-pair ear training */
  await page.click("[data-ears]");await page.waitForSelector(".bigplay");
  let pairs=0;
  for(let g=0;g<40&&!(await page.$(".fin"));g++){
    if(await page.$("#nx")){await page.click("#nx");await page.waitForTimeout(30);continue;}
    const want=await page.evaluate(()=>document.querySelector(".bigplay").dataset.say);
    await page.locator(".opt",{hasText:new RegExp("^"+want+"$")}).click();pairs++;await page.waitForSelector("#nx");
  }
  ok("ear training: ten sound pairs, then a result",pairs===10&&(await txt(page,".fin")).includes("10 / 10"),pairs+" "+(await txt(page,".fin")).slice(0,80));
  await page.click("#home");

  /* 3c. vocabulary section */
  await page.click("[data-words]");await page.waitForSelector("#wq");
  ok("vocabulary lists the lesson words with search",(await page.$$("[data-w]")).length>=100);
  await page.fill("#wq","family");await page.waitForFunction(()=>document.querySelectorAll("[data-w]").length<10);
  await page.click('[data-w="family"]');await page.waitForSelector("#star");
  ok("word card shows the word and its meaning",(await txt(page,".wcard")).includes("family")&&(await txt(page,".wmean")).includes("가족"));
  await page.screenshot({path:SHOTS+"/60-word-card.png"});
  await page.click("#star");await page.waitForFunction(()=>document.querySelector("#star").innerText.includes("담음"));
  ok("word saved to my word book",await page.evaluate(()=>window.__t.P.wb.family===1));
  await page.click("#back");await page.waitForSelector("#wq");await page.fill("#wq","");
  await page.screenshot({path:SHOTS+"/61-words.png"});
  await page.click("#wquiz");
  r=await driveSession(page,"good");
  ok("word quiz runs to the end",r.done===true,JSON.stringify(r).slice(0,200));
  await page.evaluate(()=>window.__t.show("today"));

  /* 4. persistence across a restart */
  await page.reload();await page.waitForFunction(()=>window.__t&&document.querySelector(".tabs"));
  ok("progress survives closing and reopening",await page.evaluate(()=>window.__t.P.done.l2===true&&Object.keys(window.__t.P.cards).length===24));

  /* 5. alternatives and meaning check */
  await page.evaluate(()=>{const P=window.__t.P;P.done.l5=true;const t=new Date().toISOString().slice(0,10);P.cards={"l5:3":{lv:0,due:"2000-01-01"}};window.__t.save();window.__t.show("today");});
  await page.click("[data-review]");
  await page.evaluate(()=>{window.__next=()=>"Can I have the check please";});
  await page.click("#mic");await page.waitForSelector("#dock .fb");
  ok("another natural way to say it is accepted (listed alternative)",/정확해요|통해요/.test(await txt(page,".fb-t")),await txt(page,"#dock"));
  ok("relay was not needed for a listed alternative",state.aiCalls===0);
  await page.click("#nx");await page.waitForSelector("#home");await page.click("#home");

  /* 6. connect the relay in settings */
  await page.click('[data-tab="talk"]');
  ok("without a connection the AI teacher says so and does not pretend",(await txt(page,"#app")).includes("아직 연결되지 않았어요")&&!(await page.$(".chat")));
  await page.screenshot({path:SHOTS+"/07-talk-not-connected.png"});
  await page.click("#toset");
  await page.fill("#aiurl","http://localhost:8124/");await page.fill("#aitoken","wrong-code");await page.click("#aiform button");
  await page.waitForFunction(()=>/연결 실패/.test(document.querySelector("#aistat").innerText));
  ok("wrong access code is reported",(await txt(page,"#aistat")).includes("암호"));
  await page.fill("#aitoken","my-code");await page.click("#aiform button");
  await page.waitForFunction(()=>document.querySelector("#aistat").innerText==="연결됨");
  ok("relay connected; AI and speech reported available",(await txt(page,"#app")).includes("AI 대화 사용 가능")&&(await txt(page,"#app")).includes("음성·발음 평가 사용 가능"));
  await page.screenshot({path:SHOTS+"/08-settings-connected.png",fullPage:true});

  /* 7. meaning check through the relay */
  await page.evaluate(()=>{const P=window.__t.P;P.cards={"l5:3":{lv:0,due:"2000-01-01"}};window.__t.save();window.__t.show("today");});
  await page.click("[data-review]");
  await page.evaluate(()=>{window.__next=()=>"could I get the bill";});
  await page.click("#mic");await page.waitForSelector("#dock .fb");
  ok("a paraphrase outside the list is accepted after the AI meaning check",(await txt(page,".fb-t")).includes("뜻이 통해요"),await txt(page,"#dock"));
  await page.screenshot({path:SHOTS+"/09-meaning-accepted.png"});
  await page.click("#nx");await page.waitForSelector("#home");await page.click("#home");
  await page.evaluate(()=>{const P=window.__t.P;P.cards={"l5:3":{lv:2,due:"2000-01-01"}};window.__t.save();window.__t.show("today");});
  await page.click("[data-review]");
  await page.evaluate(()=>{window.__next=()=>"where is the bathroom";});
  await page.click("#mic");await page.waitForSelector("#dock .fb");
  ok("a different meaning is still marked wrong",(await txt(page,".fb-t")).includes("조금만 더요"));

  /* 8. pronunciation assessment from the feedback panel */
  ok("pronunciation button offered when the speech service is connected",!!(await page.$("#pron")));
  await page.click("#pron");await page.waitForSelector("#prec");
  await page.click("#prec");await page.waitForTimeout(900);await page.click("#prec");
  await page.waitForFunction(()=>!!document.querySelector(".pscore"),null,{timeout:15000});
  const pr=await txt(page,"#dock");
  ok("pronunciation result shows the service's scores",pr.includes("82")&&pr.includes("85")&&pr.includes("78"),pr.slice(0,200));
  ok("a score the service did not return is shown as 평가 불가, not invented",pr.includes("평가 불가"));
  await page.locator(".pw",{hasText:"coffee"}).click();
  ok("word detail shows per-sound scores",(await txt(page,"#pdet")).includes("/f/ 31"),await txt(page,"#pdet"));
  await page.screenshot({path:SHOTS+"/10-pronunciation.png"});
  ok("pronunciation score saved for later comparison",await page.evaluate(()=>window.__t.P.pron.length===1&&window.__t.P.pron[0].s===82));
  await page.click("#pback");await page.click("#quit");

  /* 9. AI conversation */
  await page.click('[data-tab="talk"]');await page.waitForSelector("[data-topic]");
  await page.screenshot({path:SHOTS+"/11-talk-topics.png"});
  await page.evaluate(()=>{window.__next=null;window.__say=[];});
  await page.click('[data-topic="l3"]');
  await page.waitForSelector(".msg.ai");
  ok("AI opens the conversation and its line is spoken",(await txt(page,".msg.ai .m-en")).includes("What can I get for you")&&state.ttsCalls>0);
  await page.waitForFunction(()=>document.querySelector("#tstate").innerText==="눌러서 말하기");
  await page.evaluate(()=>{window.__say=["I go to cafe yesterday"];});
  await page.click("#tmic");
  await page.waitForSelector(".msg.fix");
  const fx=await txt(page,".msg.fix");
  ok("correction card has said / correct / meaning / reason",["내가 한 말","올바른 문장","뜻","이유","I went to a cafe yesterday.","과거형"].every(s=>fx.includes(s)),fx);
  ok("conversation keeps going after the correction",(await page.$$(".msg.ai")).length===2);
  await page.waitForFunction(()=>document.querySelector("#tstate").innerText==="눌러서 말하기");
  await page.waitForTimeout(700);await page.screenshot({path:SHOTS+"/12-talk-correction.png"});
  await page.evaluate(()=>{window.__say=["I went to a cafe yesterday"];});
  await page.click("[data-again]");
  await page.waitForFunction(()=>/맞았어요/.test(document.querySelector(".fx-r").innerText));
  ok("saying the corrected sentence again is checked",true);
  await page.click("#hintb");await page.waitForSelector(".msg.hint");
  ok("hint gives a Korean nudge and a sentence starter, not the answer",(await txt(page,".msg.hint")).includes("Can I get")&&(await txt(page,".msg.hint")).includes("주문"));
  await page.click("#kbb");await page.fill("#kin","Can I get a latte please");await page.click("#kf button");
  await page.waitForFunction(()=>document.querySelectorAll(".msg.ai").length===3);
  ok("typing works as a fallback to speaking",true);
  state.failAi=true;
  await page.fill("#kin","Iced please");await page.click("#kf button");
  await page.waitForSelector(".msg.sys");
  ok("AI failure shows an error with retry instead of a made-up reply",(await txt(page,".msg.sys")).includes("문제가 생겼어요")&&!!(await page.$("[data-retry]"))&&(await page.$$(".msg.ai")).length===3);
  state.failAi=false;
  await page.click("[data-retry]");
  await page.waitForFunction(()=>document.querySelectorAll(".msg.ai").length===4);
  ok("retry recovers the conversation",true);
  await page.waitForFunction(()=>document.querySelector("#tstate").innerText!=="말하는 중…");
  await page.click("#end");
  await page.waitForSelector(".fin .rows");
  const rep=await txt(page,"#app");
  ok("report: summary, what went well, sentence to fix, next focus",["끝까지 이어 갔어요","잘한 점","고쳐 볼 문장","다음에 연습할 것","A2"].every(s=>rep.includes(s)),rep.slice(0,300));
  await page.waitForTimeout(700);await page.screenshot({path:SHOTS+"/13-talk-report.png"});
  const mem=await page.evaluate(()=>{const P=window.__t.P,ms=Object.values(P.mistakes);return {m:ms.length,en:ms[0]&&ms[0].en,card:Object.keys(P.cards).filter(k=>k.startsWith("mx:")).length,weak:P.weak["past-tense"],turns:P.turns,talks:P.talks.length,usage:P.usage.map(u=>u.k)};});
  ok("mistake remembered, added to review, and counted as a weak point",mem.m===1&&mem.en==="I went to a cafe yesterday."&&mem.card===1&&mem.weak===1,JSON.stringify(mem));
  ok("turns, conversation and AI usage are recorded",mem.turns.n===3&&mem.turns.fixed===1&&mem.talks===1&&mem.usage.includes("turn")&&mem.usage.includes("report")&&mem.usage.includes("judge")&&mem.usage.includes("pron")&&mem.usage.includes("tts"),JSON.stringify(mem));
  await page.click("#home");
  ok("weak point appears on today",(await txt(page,"#app")).includes("과거형"));

  /* 10. the remembered mistake comes back in review, and memory is sent to the AI */
  await page.evaluate(()=>{const P=window.__t.P;Object.keys(P.cards).forEach(k=>{P.cards[k].due=k.startsWith("mx:")?"2000-01-01":"2999-01-01";});window.__t.save();window.__t.show("today");});
  await page.click("[data-review]");
  ok("review asks for the corrected sentence",(await txt(page,".inst")).includes("전에 고친 문장")&&(await txt(page,".koq")).includes("어제 카페에 갔어요"));
  await page.evaluate(()=>{window.__next=()=>"I went to a cafe yesterday";});
  await page.click("#mic");await page.waitForSelector("#nx");await page.click("#nx");await page.waitForSelector("#home");await page.click("#home");

  /* 11. stats and settings */
  await page.click('[data-tab="stats"]');
  const stx=await txt(page,"#app");
  ok("stats show time, days, pronunciation score and weak points",["총 학습 시간","학습한 날","82점","과거형","단계별 진도"].every(s=>stx.includes(s)),stx.slice(0,200));
  ok("grammar accuracy is not shown until there is enough data",stx.includes("아직 없음"));
  await page.screenshot({path:SHOTS+"/14-stats.png",fullPage:true});
  ok("no horizontal overflow on stats",await overflow(page)<=0);
  await page.click('[data-tab="lessons"]');
  await page.click('[data-seg="c1"]');
  ok("all six levels are browsable; C1 lists lessons and the not-yet-reviewed notice",(await page.$$(".seg button")).length===6&&(await page.$$("[data-lesson]")).length>=6&&(await txt(page,"#app")).includes("전문가의 검수는 아직"));
  await page.screenshot({path:SHOTS+"/15-lessons-c1.png",fullPage:true});
  ok("no page errors (main flow)",errors.length===0,errors.join(" | "));

  /* 12. backup export/import */
  const backup=await page.evaluate(async()=>{const m=await import("/src/core/store.js");return m.exportData();});
  ok("backup contains progress but not the access code",backup.includes('"l2":true')&&!backup.includes("my-code"));
  await page.context().close();

  /* 13. one lesson at each remaining level (level-specific behaviour) */
  for(const [lv,id,frame] of [["a1","m7",""],["a1","p28",""],["a1","p44",""],["a2","q33",""],["a2p","r17",""],["b2","t02",""],["c1","u05",""],["a2","b1","Are you free this Saturday"],["a2p","d1",""],["b1","c1",""],["b2","e1",""],["c1","f1",""]]){
    ({page,errors}=await newPage({width:390,height:844},{"hanmadi-v2":JSON.stringify({v:2,level:lv,snd:false,mic:1})}));
    await page.evaluate(([id])=>{
      const l=window.__t.lesson(id);
      window.__frame=()=>l.pat.frame.replace("___","something really nice");
      window.__t.show("lessons");
    },[id]);
    await page.click('[data-lesson="'+id+'"]');
    r=await driveSession(page,lv==="b1"?"badfirst":"good");
    ok(lv+" lesson "+id+" completes",r.done===true,JSON.stringify(r).slice(0,400));
    ok(lv+" no page errors",errors.length===0,errors.join(" | "));
    await page.context().close();
  }

  /* 14. desktop width */
  ({page,errors}=await newPage({width:1280,height:800},{"hanmadi-v2":JSON.stringify({v:2,level:"a2",snd:false,mic:1,done:{b1:true},days:{"2026-11-10":4}})}));
  ok("desktop: content is centered in a readable column without overflow",await overflow(page)<=0&&await page.evaluate(()=>document.querySelector("#app").getBoundingClientRect().width<=480));
  await page.screenshot({path:SHOTS+"/16-desktop.png"});
  await page.context().close();

  /* 15. no speech recognition (in-app browsers): gate, then typing */
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  page=await ctx.newPage();
  await page.addInitScript(()=>{delete window.SpeechRecognition;delete window.webkitSpeechRecognition;localStorage.setItem("hanmadi-v2",JSON.stringify({v:2,level:"a1"}));});
  await page.goto("http://localhost:8123/?e2e=1");await page.waitForFunction(()=>window.__t&&window.__t.lesson("l1")&&document.querySelector("#app").children.length);
  const hasSR=await page.evaluate(()=>!!(window.SpeechRecognition||window.webkitSpeechRecognition));
  if(!hasSR){
    ok("browser without speech recognition is told to open Chrome",(await txt(page,".fin h1")).includes("크롬에서 열어야"));
    await page.click("#skipgate");
    ok("typing mode still reaches the app",!!(await page.$(".tabs")));
  }else results.push("SKIP no-speech-recognition gate (this Chromium has the API)");
  await ctx.close();
}catch(e){
  ok("test run crashed",false,String(e&&e.stack||e).slice(0,600));
}
await browser.close();site.close();relay.close();
console.log(results.join("\n"));
console.log(`\n${results.filter(r=>r.startsWith("PASS")).length} passed, ${failed} failed · relay calls: AI ${state.aiCalls}, pronunciation ${state.pronCalls}, voice ${state.ttsCalls}`);
process.exit(failed?1:0);
