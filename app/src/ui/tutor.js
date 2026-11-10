// AI teacher: spoken conversation with corrections, hints, an after-class report,
// and mistakes that turn into review cards. Everything here needs the relay; nothing is faked.
import {P,save,addSay,addSecs} from "../core/store.js";
import {LV} from "../core/levels.js";
import {orderOf,lesson} from "../core/content.js";
import {gradeBest} from "../core/grade.js";
import {addMistakeCard} from "../core/srs.js";
import {weakList,tagName} from "../core/plan.js";
import {today,esc,uid} from "../core/util.js";
import {SR,listen,stop as stopSR,abort as abortSR,listening} from "../speech/sr.js";
import {speak,stopSpeak} from "../speech/tts.js";
import {sfx} from "../speech/sfx.js";
import {relayReady,llmReady,health,caps,call,errorKo} from "../ai/relay.js";
import {I} from "./icons.js";
import {app,chrome,$,$$,ui,register,show,enter,onLeave,tabsHtml,bindTabs} from "./nav.js";

const FREE=[
 {id:"free-day",title:"오늘 하루 이야기",role:"Free, friendly small talk about the learner's day: what they did, ate, and how they feel. Ask simple follow-up questions."},
 {id:"free-me",title:"나와 가족, 일 이야기",role:"A friendly chat getting to know the learner: their family, job, hometown and hobbies. Show interest and ask follow-up questions."},
 {id:"free-plan",title:"주말과 여행 계획",role:"A friendly chat about the learner's plans for the weekend or their next trip, and places they would like to visit."}
];
let C=null; // current conversation

/* ---------- topic list ---------- */
async function talkHome(){
  app.innerHTML='<h1 class="ptitle">회화</h1><div id="tk"></div>';
  chrome.innerHTML=tabsHtml();bindTabs();
  const box=$("#tk");
  if(!relayReady()){box.innerHTML=setupHtml("AI 선생님은 아직 연결되지 않았어요");return bindSetup();}
  if(!caps.checked){box.innerHTML='<p class="lead">연결을 확인하는 중…</p>';await health();if(ui.tab!=="talk"||ui.busy||!$("#tk"))return;}
  if(!caps.ok){box.innerHTML=setupHtml("AI 서버에 연결하지 못했어요",errorKo({code:caps.error}));return bindSetup();}
  if(!caps.llm){box.innerHTML=setupHtml("서버에 AI 키가 아직 없어요","서버 설정에 AI 키(LLM_API_KEY)를 넣으면 바로 쓸 수 있어요.");return bindSetup();}
  const ids=orderOf(P.level),done=ids.filter(id=>P.done[id]),rec=lesson(done[done.length-1]||ids[0]);
  const row=(key,title,sub,em)=>'<li><button type="button" class="row" data-topic="'+key+'"><span class="ic em">'+em+'</span><span class="tx"><b>'+esc(title)+'</b><small>'+esc(sub)+'</small></span>'+I.go+'</button></li>';
  box.innerHTML='<p class="lead" style="margin:-8px 0 8px">주제를 고르면 AI 선생님이 먼저 말을 걸어요. 틀려도 괜찮아요. 중요한 것만 한두 개 고쳐 드려요.</p>'
   +(rec?'<h2 class="sec">추천</h2><ul class="rows">'+row(rec.id,rec.topicKo,"최근 배운 수업 · 역할극",rec.e)+'</ul>':"")
   +'<h2 class="sec">자유 대화</h2><ul class="rows">'+FREE.map(f=>row(f.id,f.title,"정해진 답 없이 편하게","💬")).join("")+'</ul>'
   +'<h2 class="sec">'+LV[P.level].name+' 단계 상황</h2><ul class="rows">'+ids.map(id=>{const l=lesson(id);return row(l.id,l.topicKo,l.sub,l.e);}).join("")+'</ul>';
  $$("[data-topic]",box).forEach(b=>b.addEventListener("click",()=>startTalk({topic:b.dataset.topic})));
}
function setupHtml(title,detail){
  return '<p class="lead" style="margin-top:-8px">'+esc(title)+'</p>'+(detail?'<p class="note">'+esc(detail)+'</p>':"")
   +'<div class="ans"><p class="ko">AI 선생님과의 대화, 문법 교정, 대화 뒤 리포트는 실제 AI를 불러서 만들어요. 그러려면 내 전용 서버 주소와 접속 암호가 필요해요.</p><p class="why">연결 전에는 이 화면이 동작하는 척하지 않아요. 수업과 복습은 연결 없이도 쓸 수 있어요.</p></div>'
   +'<button type="button" class="cta dark" id="toset" style="margin-top:16px">설정에서 연결하기</button>';
}
const bindSetup=()=>$("#toset").addEventListener("click",()=>show("set"));

/* ---------- conversation ---------- */
function startTalk(arg){
  const key=arg.topic||arg.lesson,l=lesson(key),f=FREE.find(x=>x.id===key)||FREE[0];
  C={title:l?l.topicKo:f.title,role:l?l.role:f.role,history:[],items:[],t0:Date.now(),busy:false,state:"idle",turns:0,fixed:0,fixes:[],ended:false,auto:!!SR};
  enter("tutor");
  onLeave(()=>{if(C&&!C.ended){C.ended=true;addSecs((Date.now()-C.t0)/1000);save();}C=null;});
  drawTalk();
  askAi({start:true});
}
const memory=()=>weakList(P).slice(0,3).map(w=>w.name+" ("+w.tag+")").concat(Object.values(P.mistakes).slice(-5).map(m=>'said "'+m.said+'" instead of "'+m.en+'"'));
const STATE={idle:"눌러서 말하기",listening:"듣고 있어요 · 다 말하면 눌러요",thinking:"생각하는 중…",speaking:"말하는 중…"};
function setState(s){
  if(!C)return;
  C.state=s;
  const st=$("#tstate"),mic=$("#tmic");
  if(st)st.textContent=STATE[s];
  if(mic){mic.classList.toggle("on",s==="listening");mic.classList.toggle("wait",s==="thinking"||s==="speaking");mic.innerHTML=s==="speaking"?I.stop:I.mic;mic.setAttribute("aria-label",s==="speaking"?"말 끊고 내 차례로":STATE[s]);}
}
function drawTalk(){
  app.innerHTML='<header class="sbar"><button type="button" class="x" id="quit" aria-label="그만하기">'+I.x+'</button><p class="ttitle">'+esc(C.title)+'</p><button type="button" class="endb" id="end">끝내기</button></header><main class="ex"><ol class="chat" id="chat" aria-live="polite"></ol></main>';
  chrome.innerHTML='<div class="dock fixed" id="dock"><p class="heard" id="heard"></p><div class="trow">'
   +'<button type="button" class="side" id="hintb" aria-label="힌트">'+I.bulb+'<span>힌트</span></button>'
   +(SR?'<button type="button" class="micbtn" id="tmic">'+I.mic+'</button>':"")
   +'<button type="button" class="side" id="kbb" aria-label="글자로 쓰기">'+I.kb+'<span>글자</span></button></div>'
   +'<p class="mic-l" id="tstate"></p><form class="kf" id="kf"'+(SR?" hidden":"")+'><label class="sr" for="kin">영어로 입력</label><input id="kin" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="영어로 입력 (한국어로 물어봐도 돼요)"><button type="submit">보내기</button></form></div>';
  $("#quit").addEventListener("click",()=>show("talk"));
  $("#end").addEventListener("click",endTalk);
  $("#hintb").addEventListener("click",()=>{if(!C.busy)askAi({hint:true});});
  $("#kbb").addEventListener("click",()=>{const k=$("#kf");k.hidden=!k.hidden;if(!k.hidden)$("#kin").focus();pad();});
  $("#kf").addEventListener("submit",e=>{e.preventDefault();const t=$("#kin").value.trim();if(t&&!C.busy){$("#kin").value="";sendUser(t);}});
  const mic=$("#tmic");
  if(mic)mic.addEventListener("click",()=>{
    if(!C||C.busy&&C.state==="thinking")return;
    if(C.state==="speaking"){stopSpeak();return hear();}
    if(listening())return stopSR();
    hear();
  });
  setState("idle");pad();
}
const pad=()=>{const d=$("#dock"),e=$(".ex");if(d&&e)e.style.paddingBottom=(d.offsetHeight+24)+"px";};
function add(item){
  C.items.push(item);
  const chat=$("#chat");if(!chat)return null;
  const li=document.createElement("li");
  li.className="msg "+item.who;
  if(item.who==="ai"){
    li.innerHTML='<p class="m-en" lang="en">'+esc(item.en)+'</p>'+(item.ko?'<button type="button" class="txt sm" data-r>뜻 보기</button><p class="m-ko" hidden>'+esc(item.ko)+'</p>':"")+'<button type="button" class="aud sm" data-replay>'+I.spk+'다시 듣기</button>';
    const r=li.querySelector("[data-r]");
    if(r)r.addEventListener("click",()=>{r.nextElementSibling.hidden=false;r.hidden=true;});
    li.querySelector("[data-replay]").addEventListener("click",()=>{abortSR();speak(item.en);});
  }else if(item.who==="me"){
    li.innerHTML='<p class="m-en" lang="en">'+esc(item.en)+'</p>';
  }else if(item.who==="fix"){
    const c=item.c;
    li.innerHTML='<p class="fx-h">이렇게 고쳐 보세요 · '+esc(tagName(c.tag))+'</p>'
     +'<dl class="fx"><dt>내가 한 말</dt><dd lang="en" class="bad">'+esc(c.said)+'</dd><dt>올바른 문장</dt><dd lang="en" class="good">'+esc(c.correct)+'</dd>'
     +(c.better&&c.better!==c.correct?'<dt>더 자연스럽게</dt><dd lang="en">'+esc(c.better)+'</dd>':"")
     +'<dt>뜻</dt><dd>'+esc(c.ko)+'</dd><dt>이유</dt><dd>'+esc(c.why)+'</dd></dl>'
     +(SR?'<button type="button" class="aud sm" data-again>'+I.mic+'다시 말해 보기</button><span class="fx-r" aria-live="polite"></span>':"");
    const again=li.querySelector("[data-again]");
    if(again)again.addEventListener("click",()=>practice(c,li.querySelector(".fx-r")));
  }else if(item.who==="hint"){
    li.innerHTML='<p class="fx-h">힌트</p><p class="m-ko" style="margin:0">'+esc(item.h.ko)+'</p>'+(item.h.starter?'<p class="m-en" lang="en">'+esc(item.h.starter)+' …</p>':"");
  }else{
    li.innerHTML='<p class="m-ko" style="margin:0">'+esc(item.text)+'</p>'+(item.retry?'<button type="button" class="aud sm" data-retry>다시 시도</button>':"");
    const rb=li.querySelector("[data-retry]");
    if(rb)rb.addEventListener("click",()=>{li.remove();item.retry();});
  }
  chat.appendChild(li);
  li.scrollIntoView({block:"end",behavior:"smooth"});
  return li;
}
// Say the corrected sentence once more; checked against the corrected and the more natural form.
async function practice(c,out){
  if(!C||C.busy||listening())return;
  stopSpeak();out.textContent="듣고 있어요…";
  const r=await listen({long:c.correct.split(/\s+/).length>9});
  if(!out.isConnected)return;
  if(r.error){out.textContent=r.error==="silence"?"잘 안 들렸어요":"";return;}
  const g=gradeBest([c.correct,c.better].filter(Boolean),[r.text].concat(r.alts||[]));
  if(g.score>=0.8){out.textContent="좋아요, 이번엔 맞았어요";sfx("ok");addSay(1);save();}
  else{out.textContent="조금 달라요: "+r.text;sfx("miss");}
}
async function hear(){
  if(!C||C.busy||!SR)return;
  setState("listening");
  const heard=$("#heard");
  const r=await listen({long:true,onStart:()=>{if(!P.mic){P.mic=1;save();}},onPartial:t=>{if(heard)heard.textContent=t;}});
  if(!C||!$("#chat"))return;
  if(heard)heard.textContent="";
  setState("idle");
  if(r.error){
    if(r.error==="denied")add({who:"sys",text:"마이크가 꺼져 있어요. 휴대폰 설정에서 Chrome의 마이크 권한을 켜거나 '글자'를 눌러 입력해 주세요."});
    else if(r.error==="network")add({who:"sys",text:"음성 인식에 인터넷이 필요해요. 연결을 확인해 주세요."});
    return;
  }
  sendUser(r.text);
}
function sendUser(text){
  add({who:"me",en:text});
  C.history.push({r:"u",t:text});
  C.turns++;P.turns.n++;addSay(1);save();
  askAi({});
}
async function askAi(opt){
  if(!C||C.busy)return;
  const mine=C;
  C.busy=true;setState("thinking");
  try{
    const j=await call("/v1/turn",{cefr:LV[P.level].cefr,role:C.role,memory:memory(),history:C.history,start:!!opt.start,hint:!!opt.hint},40000);
    if(C!==mine)return;
    C.busy=false;
    if(j.correction&&!opt.hint){
      C.fixed++;P.turns.fixed++;C.fixes.push(j.correction);
      add({who:"fix",c:j.correction});
    }
    if(j.hint)add({who:"hint",h:j.hint});
    if(j.reply&&!(opt.hint&&j.hint)){
      C.history.push({r:"a",t:j.reply});
      add({who:"ai",en:j.reply,ko:j.reply_ko});
      setState("speaking");
      await speak(j.reply);
      if(C!==mine)return;
    }
    setState("idle");save();
    if(C.auto&&!opt.hint&&!listening()&&document.visibilityState==="visible"&&$("#kf").hidden)hear();
  }catch(e){
    if(C!==mine)return;
    C.busy=false;setState("idle");
    add({who:"sys",text:errorKo(e),retry:()=>askAi(opt)});
  }
}

/* ---------- after-class report ---------- */
async function endTalk(){
  if(!C||C.ended)return;
  const mine=C;
  abortSR();stopSpeak();
  C.ended=true;
  const secs=(Date.now()-C.t0)/1000;
  addSecs(secs);
  P.talks.push({d:today(),topic:C.title,turns:C.turns,fixed:C.fixed,secs:Math.round(secs)});
  if(P.talks.length>50)P.talks.shift();
  save();
  if(C.turns<1)return show("talk");
  app.innerHTML='<div class="fin"><h1>대화를 정리하는 중…</h1><p class="lead">선생님이 리포트를 쓰고 있어요.</p></div>';
  chrome.innerHTML="";
  let rep=null,err=null;
  try{rep=await call("/v1/report",{cefr:LV[P.level].cefr,history:C.history},60000);}catch(e){err=e;}
  if(C!==mine)return;
  // Mistakes come from the report when it worked, otherwise from the corrections given live.
  const fixes=(rep&&rep.mistakes&&rep.mistakes.length?rep.mistakes:C.fixes).slice(0,5);
  let added=0;
  fixes.forEach(c=>{
    if(!c.correct)return;
    const dup=Object.values(P.mistakes).some(m=>m.en.toLowerCase()===c.correct.toLowerCase());
    P.weak[c.tag]=(P.weak[c.tag]||0)+1;
    if(dup)return;
    const id=uid();
    P.mistakes[id]={said:c.said,en:c.correct,better:c.better||"",ko:c.ko,why:c.why,tag:c.tag,d:today()};
    addMistakeCard(P,id);added++;
  });
  const keys=Object.keys(P.mistakes);
  if(keys.length>200)keys.slice(0,keys.length-200).forEach(k=>{delete P.mistakes[k];delete P.cards["mx:"+k];});
  save();
  const mins=Math.max(1,Math.round(secs/60));
  app.innerHTML='<div class="fin"><p class="inst">대화 리포트 · '+esc(C.title)+'</p><h1>'+C.turns+'번 말했어요</h1>'
   +(rep?'<p class="lead">'+esc(rep.summary_ko)+'</p>':'<p class="note">리포트를 만들지 못했어요. '+esc(errorKo(err))+' 대화 중에 고친 문장은 그대로 저장했어요.</p>')
   +'<ul class="rows"><li><span>대화 시간</span><b>약 '+mins+'분</b></li><li><span>고칠 것이 없었던 문장</span><b>'+(C.turns-C.fixed)+' / '+C.turns+'</b></li>'
   +(rep&&rep.level_estimate?'<li><span>이번 대화의 말하기 수준</span><b>'+esc(rep.level_estimate)+'</b></li>':"")
   +'<li><span>복습에 추가한 문장</span><b>'+added+'개</b></li></ul>'
   +(rep&&rep.did_well.length?'<h2 class="sec">잘한 점</h2><ul class="bul">'+rep.did_well.map(s=>'<li>'+esc(s)+'</li>').join("")+'</ul>':"")
   +(fixes.length?'<h2 class="sec">고쳐 볼 문장</h2><ol class="chat">'+fixes.map(c=>'<li class="msg fix"><dl class="fx"><dt>내가 한 말</dt><dd lang="en" class="bad">'+esc(c.said)+'</dd><dt>올바른 문장</dt><dd lang="en" class="good">'+esc(c.correct)+'</dd>'+(c.better&&c.better!==c.correct?'<dt>더 자연스럽게</dt><dd lang="en">'+esc(c.better)+'</dd>':"")+'<dt>이유</dt><dd>'+esc(c.why)+'</dd></dl></li>').join("")+'</ol>':"")
   +(rep&&rep.next_focus_ko?'<h2 class="sec">다음에 연습할 것</h2><p class="lead" style="margin-top:4px">'+esc(rep.next_focus_ko)+'</p>':"")+'</div>';
  chrome.innerHTML='<div class="dock fixed"><button type="button" class="cta" id="home">홈으로</button></div>';
  sfx("done");
  $("#home").addEventListener("click",()=>show("today"));
  window.scrollTo(0,0);
}
register("talkHome",talkHome);
register("talk",startTalk);
