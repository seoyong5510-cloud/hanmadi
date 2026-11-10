// Lesson and review sessions: a queue of exercises shown one screen at a time.
import {P,save,addSay,addSecs} from "../core/store.js";
import {LV} from "../core/levels.js";
import {lesson,cardData,cardLevel} from "../core/content.js";
import {gradeBest,gradeFrame,tipsFor} from "../core/grade.js";
import {grow,addCards,dueKeys,streak} from "../core/srs.js";
import {today,plusDays,shuffle,esc} from "../core/util.js";
import {SR,listen,stop as stopSR,abort as abortSR,listening} from "../speech/sr.js";
import {speak,stopSpeak,canSpeak} from "../speech/tts.js";
import {canRecord,startRecording} from "../speech/wav.js";
import {sfx,confetti} from "../speech/sfx.js";
import {llmReady,speechReady,call} from "../ai/relay.js";
import {I} from "./icons.js";
import {app,chrome,$,$$,register,show,open,enter,onLeave,fit} from "./nav.js";
import {openPron} from "./pronui.js";

let S=null;
const M=()=>(LV[P.level]||LV.a1).mode;
const targetsOf=ex=>[ex.en].concat((ex.p&&ex.p.alt)||[]);
function passFor(ex){
  if(ex.card)return LV[cardLevel(ex.card)].mode.pass;
  return ex.t==="learn"?Math.min(M().pass,0.75):M().pass;
}

/* ---------- building a session ---------- */
function startLesson(id){
  const l=lesson(id),q=[],ws=shuffle(l.words).slice(0,2),tts=canSpeak();
  const picQ=wd=>({t:"pic",wd,ans:wd.w,fbA:wd.e+" "+wd.w,fbB:wd.ko,spk:wd.w,
    opts:shuffle([wd.w].concat(shuffle(l.words.filter(x=>x!==wd)).slice(0,2).map(x=>x.w)))});
  q.push({t:"intro",l});
  l.ph.forEach(p=>q.push({t:"learn",p,en:p.en}));
  ws.forEach(wd=>q.push(picQ(wd)));
  if(tts){
    const th=l.talk.filter(t=>t.them);
    if(th.length>=3){
      const tk=shuffle(th)[0];
      q.push({t:"listen",say:tk.them,ans:tk.ko,fbA:tk.them,fbB:tk.ko,opts:shuffle([tk.ko].concat(shuffle(th.filter(x=>x!==tk)).slice(0,2).map(x=>x.ko)))});
    }
  }
  shuffle(l.ph).forEach(p=>q.push({t:"recall",p,en:p.en}));
  ws.forEach(wd=>q.push({t:"spell",wd,hard:M().spell!=="tiles"}));
  q.push({t:"frame",l});
  l.pat.items.forEach(p=>q.push({t:"pat",p,en:p.en,l}));
  q.push({t:"free",l});
  // mix in two older sentences so earlier lessons are not forgotten
  Object.keys(P.cards).filter(k=>k.split(":")[0]!==id&&!k.includes(":w")&&cardData(k))
    .sort((a,b)=>P.cards[a].due<P.cards[b].due?-1:P.cards[a].due>P.cards[b].due?1:0).slice(0,2)
    .forEach(k=>{const p=cardData(k);q.push({t:"recall",p,en:p.en,card:k,old:true});});
  l.talk.forEach(tk=>q.push({t:"talk",tk,p:l.ph[tk.you],en:l.ph[tk.you].en,l}));
  begin({kind:"lesson",id,q});
}
function startReview(){
  const q=shuffle(dueKeys(P).slice(0,12)).map(k=>{
    const p=cardData(k),c=P.cards[k];
    if(p.w&&!p.en)return {t:"spell",wd:p,card:k,hard:M().spell!=="tiles"};
    return (canSpeak()&&c.lv>=2&&c.lv<=3)?{t:"echo",p,en:p.en,card:k}:{t:"recall",p,en:p.en,card:k};
  });
  if(!q.length)return show();
  begin({kind:"review",q});
}
function begin(s){
  S=Object.assign(s,{i:0,said:0,t0:Date.now()});
  enter("session");
  onLeave(endClock);
  showEx();
}
// Count study time once, whichever way the session ends.
function endClock(){
  if(S&&S.t0){addSecs((Date.now()-S.t0)/1000);S.t0=0;save();}
}

/* ---------- pieces of markup ---------- */
const auds=en=>canSpeak()?'<div class="auds"><button type="button" class="aud" data-say="'+esc(en)+'" data-rate="0">'+I.spk+'듣기</button><button type="button" class="aud" data-say="'+esc(en)+'" data-rate="0.65">천천히</button></div>':"";
const hidden=(p,label,withKo)=>'<button type="button" class="txt hintb" id="hint">'+(label||"힌트 보기")+'</button><div class="ans" id="ans" hidden><p class="en" lang="en">'+esc(p.en)+'</p>'+(M().say&&p.say?'<p class="say">'+esc(p.say)+'</p>':"")+(withKo?'<p class="ko">'+esc(p.ko)+'</p>':"")+(p.note?'<p class="why">'+esc(p.note)+'</p>':"")+auds(p.en)+'</div>';
const picH=e=>e?'<div class="pic" aria-hidden="true">'+e+'</div>':"";
const playB=en=>'<button type="button" class="bigplay" data-say="'+esc(en)+'" data-rate="0" aria-label="다시 듣기">'+I.spkL+'</button>';
const optsH=(ex,en)=>'<div class="opts" style="margin-top:24px">'+ex.opts.map(o=>'<button type="button" class="opt"'+(en?' lang="en"':"")+'>'+esc(o)+'</button>').join("")+'</div>';
function tipsHtml(en){
  const t=tipsFor(en.split(/\s+/),2);
  return t.length?'<ul class="tips" aria-label="발음 팁">'+t.map(x=>'<li><b lang="en">'+x.k+'</b><span><span lang="en">'+esc(x.w)+'</span> · '+x.t+'</span></li>').join("")+'</ul>':"";
}
const frameH=l=>esc(l.pat.frame).replace("___","<u>&nbsp;</u>");

/* ---------- one exercise ---------- */
function showEx(){
  abortSR();stopSpeak();stopRec();
  const ex=S.q[S.i],p=ex.p;
  S.first=true;S.hint=false;S.fails=0;
  let m="",auto="";
  if(ex.t==="intro"){
    const l=ex.l;
    m='<p class="inst">이번 수업</p>'+picH(l.e)+'<h1 class="koq">'+esc(l.title)+'</h1><p class="lead">'+esc(l.goal)+'</p>'
     +'<div class="ans"><p class="why" style="margin:0"><b>'+esc(l.grammar.point)+'</b></p><p class="ko">'+esc(l.grammar.note)+'</p></div>';
  }else if(ex.t==="learn"){
    if(M().blind&&canSpeak())m='<p class="inst">먼저 듣고, 들은 대로 말해요</p>'+playB(p.en)+hidden(p,"문장 보기",true);
    else m='<p class="inst">듣고 따라 말해요</p>'+picH(p.e)+'<h1 class="en" lang="en">'+esc(p.en)+'</h1>'+(M().say&&p.say?'<p class="say">'+esc(p.say)+'</p>':"")+'<p class="ko">'+esc(p.ko)+'</p>'+(p.note?'<p class="why">'+esc(p.note)+'</p>':"")+auds(p.en)+tipsHtml(p.en);
    auto=p.en;
  }else if(ex.t==="pic"){
    m='<p class="inst">뜻에 맞는 영어 단어를 골라요</p>'+picH(ex.wd.e)+'<h1 class="koq">'+esc(ex.wd.ko)+'</h1>'+optsH(ex,true);
  }else if(ex.t==="spell"){
    m='<p class="inst">글자를 순서대로 눌러 단어를 써요</p>'+picH(ex.wd.e)+'<h1 class="koq">'+esc(ex.wd.ko)+'</h1>'
     +'<div class="slots" lang="en">'+ex.wd.w.split("").map(()=>'<span class="slot"></span>').join("")+'</div>';
  }else if(ex.t==="listen"){
    m='<p class="inst">잘 듣고 뜻을 골라요</p>'+playB(ex.say)+optsH(ex,false);
    auto=ex.say;
  }else if(ex.t==="echo"){
    m='<p class="inst">듣고 그대로 말해요</p>'+playB(p.en)+hidden(p,"문장 보기",true);
    auto=p.en;
  }else if(ex.t==="recall"){
    m='<p class="inst">'+(ex.old?"지난 수업 문장이에요. 기억나는 대로 말해요":p.mx?"전에 고친 문장이에요. 바르게 말해 봐요":S.kind==="review"?"기억나는 대로 영어로 말해요":"이번엔 안 보고 영어로 말해요")+'</p>'+picH(p.e)+'<h1 class="koq">'+esc(p.ko)+'</h1>'+hidden(p);
  }else if(ex.t==="frame"){
    m='<p class="inst">단어만 바꾸면 새 문장이 돼요</p><h1 class="frame" lang="en">'+frameH(ex.l)+'</h1><ul class="swap">'
     +ex.l.pat.items.map(x=>'<li><b lang="en">'+esc(x.w)+'</b><span>'+esc(x.wk)+'</span></li>').join("")+'</ul>'+(ex.l.pat.note?'<p class="note">'+esc(ex.l.pat.note)+'</p>':"");
  }else if(ex.t==="pat"){
    m='<p class="inst">빈칸에 넣어 말해요</p><h1 class="koq">'+esc(p.ko)+'</h1><p class="say" lang="en">'+frameH(ex.l)+'</p><span class="word">'+esc(p.wk)+' = '+esc(p.w)+'</span>'+hidden(p);
  }else if(ex.t==="free"){
    m='<p class="inst">이번엔 내 이야기로 빈칸을 채워 말해요</p><h1 class="frame" lang="en">'+frameH(ex.l)+'</h1><p class="lead">배운 단어가 아니어도 괜찮아요. 떠오르는 말을 넣어 보세요.</p>';
  }else{
    const tk=ex.tk,open=M().say;
    m='<p class="inst">'+esc(ex.l.sub)+'</p>'
     +(tk.them?'<div class="them"><p class="t-en" lang="en">'+esc(tk.them)+'</p>'+(open?'<p class="t-ko">'+esc(tk.ko)+'</p>':'<button type="button" class="txt" data-reveal>뜻 보기</button><p class="t-ko" hidden>'+esc(tk.ko)+'</p>')+'</div>'+auds(tk.them):'<p class="narr">'+esc(tk.ko)+'</p>')
     +(open?'<div class="reply"><small>이 뜻으로 대답해요</small><h1 class="koq">'+esc(p.ko)+'</h1>'+hidden(p)+'</div>'
           :'<div class="reply"><small>알맞게 대답해요</small><button type="button" class="txt" data-reveal>무슨 말을 할지 보기</button><h1 class="koq" hidden>'+esc(p.ko)+'</h1>'+hidden(p,"영어 문장 보기")+'</div>');
    auto=tk.them;
  }
  app.innerHTML='<header class="sbar"><button type="button" class="x" id="quit" aria-label="그만하기">'+I.x+'</button><div class="prog" role="progressbar" aria-label="수업 진행" aria-valuemin="0" aria-valuemax="'+S.q.length+'" aria-valuenow="'+S.i+'"><i style="width:'+Math.round(S.i/S.q.length*100)+'%"></i></div></header><main class="ex">'+m+'</main>';
  chrome.innerHTML='<div class="dock fixed" id="dock"></div>';
  window.scrollTo(0,0);
  $("#quit").addEventListener("click",()=>{save();show();});
  bindAud(app);
  $$("[data-reveal]",app).forEach(b=>b.addEventListener("click",()=>{b.nextElementSibling.hidden=false;b.hidden=true;}));
  const hb=$("#hint");
  if(hb)hb.addEventListener("click",()=>{S.hint=true;reveal();});
  if(ex.t==="listen"||ex.t==="pic")bindChoice(ex);
  else if(ex.t==="spell")dockSpell(ex);
  else if(ex.t==="frame"||ex.t==="intro"){
    $("#dock").innerHTML='<button type="button" class="cta" id="nx">'+(ex.t==="intro"?"시작하기":"말해 볼게요")+'</button>';
    $("#nx").addEventListener("click",next);
  }else dockMic(ex);
  fit();
  if(auto)speak(auto);
}
function bindAud(root){$$("[data-say]",root).forEach(b=>b.addEventListener("click",()=>{abortSR();speak(b.dataset.say,+b.dataset.rate||0);}));}
function reveal(){const a=$("#ans"),h=$("#hint");if(a){a.hidden=false;if(!a.dataset.b){a.dataset.b="1";bindAud(a);}}if(h)h.hidden=true;fit();}
function next(){
  S.i++;
  if(S.i>=S.q.length)finish();else showEx();
}
function bindChoice(ex){
  const dock=$("#dock");
  $$(".opt",app).forEach(b=>b.addEventListener("click",()=>{
    if(b.textContent===ex.ans){
      $$(".opt",app).forEach(o=>{o.disabled=true;});
      b.classList.add("ok");sfx("ok");
      dock.className="dock fixed ok";
      dock.innerHTML='<div class="fb" role="status"><p class="fb-t">맞아요</p><p class="words" lang="en">'+esc(ex.fbA)+'</p><p class="sub">'+esc(ex.fbB)+'</p><button type="button" class="cta" id="nx">다음</button></div>';
      $("#nx").addEventListener("click",next);
      if(ex.spk)speak(ex.spk,0.85);
      fit();
    }else{b.classList.add("no");b.disabled=true;sfx("no");}
  }));
}
function dockSpell(ex){
  const w=ex.wd.w,dock=$("#dock"),slots=$$(".slot",app);
  let pos=0,miss=0,shown=false;
  const done=()=>{
    slots.forEach((sl,i)=>{sl.textContent=w[i];sl.classList.add("on");});
    if(ex.card)grow(P,ex.card,shown?-2:miss===0?1:0);
    save();sfx(miss?"ok":"perfect");speak(w,0.85);
    dock.className="dock fixed ok";
    dock.innerHTML='<div class="fb" role="status"><p class="fb-t">'+(miss?"완성했어요":"한 번에 썼어요")+'</p><p class="words" lang="en">'+esc(ex.wd.e+" "+w)+'</p><p class="sub">'+esc(ex.wd.ko)+(ex.wd.ex?' · <span lang="en">'+esc(ex.wd.ex)+'</span>':"")+'</p><button type="button" class="cta" id="nx">다음</button></div>';
    $("#nx").addEventListener("click",next);
    fit();
  };
  dock.className="dock fixed";
  if(M().spell==="type"){
    $(".inst",app).textContent="단어를 직접 써요";
    dock.innerHTML='<p class="heard" id="heard" aria-live="polite"></p><form class="kf" id="kf"><label class="sr" for="kin">영어 단어 입력</label><input id="kin" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="영어 단어"><button type="submit">확인</button></form>';
    const kin=$("#kin"),heard=$("#heard");
    $("#kf").addEventListener("submit",e=>{
      e.preventDefault();
      const v=kin.value.trim().toLowerCase();
      if(!v)return;
      if(v===w)return done();
      miss++;sfx("miss");
      kin.classList.remove("bad");void kin.offsetWidth;kin.classList.add("bad");
      if(miss>=3){shown=true;heard.textContent="정답: "+w+" · 보고 한 번 써 보세요";}
      else heard.textContent=miss===2?"힌트: "+w.slice(0,Math.max(1,Math.ceil(w.length/2)))+"…":"철자가 달라요. 다시 써 보세요.";
      fit();
    });
    return;
  }
  let letters=w.split("");
  if(ex.hard)letters=letters.concat(shuffle("aeioustrnl".split("").filter(c=>!w.includes(c))).slice(0,2));
  let sh=shuffle(letters);
  if(sh.join("")===w&&w.length>1)sh=sh.reverse();
  dock.innerHTML='<div class="tiles" lang="en">'+sh.map(c=>'<button type="button" class="tile">'+c+'</button>').join("")+'</div>';
  $$(".tile",dock).forEach(b=>b.addEventListener("click",()=>{
    if(b.textContent!==w[pos]){
      miss++;b.classList.remove("bad");void b.offsetWidth;b.classList.add("bad");sfx("miss");
      setTimeout(()=>b.classList.remove("bad"),350);
      return;
    }
    slots[pos].textContent=w[pos];slots[pos].classList.add("on");b.disabled=true;pos++;sfx("tap");
    if(pos===w.length)done();
  }));
}

/* ---------- speaking ---------- */
function dockMic(ex){
  const dock=$("#dock"),long=ex.en?ex.en.split(/\s+/).length>9:true;
  dock.className="dock fixed";
  dock.innerHTML='<p class="heard" id="heard" aria-live="polite"></p>'
   +(SR?'<button type="button" class="micbtn" id="mic" aria-label="눌러서 말하기">'+I.mic+'</button><p class="mic-l" id="micl">눌러서 말하기</p><button type="button" class="txt" id="kb">글자로 쓰기</button>':"")
   +'<form class="kf" id="kf"'+(SR?" hidden":"")+'><label class="sr" for="kin">영어로 입력</label><input id="kin" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="영어로 입력"><button type="submit">확인</button></form>';
  const heard=$("#heard"),kf=$("#kf"),kin=$("#kin");
  kf.addEventListener("submit",e=>{e.preventDefault();const t=kin.value.trim();if(t)answer(ex,t,[],0);});
  fit();
  if(!SR)return;
  const mic=$("#mic"),micl=$("#micl");
  $("#kb").addEventListener("click",()=>{kf.hidden=false;$("#kb").hidden=true;kin.focus();fit();});
  const setOn=on=>{mic.classList.toggle("on",on);mic.setAttribute("aria-label",on?"듣는 중, 누르면 멈춰요":"눌러서 말하기");micl.textContent=on?(long?"듣고 있어요 · 다 말하면 눌러요":"듣고 있어요"):"눌러서 말하기";};
  mic.addEventListener("click",async()=>{
    if(listening())return stopSR();
    stopRec();stopSpeak();
    heard.textContent=P.mic?"":"'마이크 허용' 창이 뜨면 '허용'을 눌러 주세요.";
    const r=await listen({long,onStart:()=>{setOn(true);if(!P.mic){P.mic=1;save();heard.textContent="";}},onPartial:t=>{heard.textContent=t;}});
    if(!mic.isConnected)return;
    setOn(false);
    if(r.error==="aborted")return;
    if(r.error==="denied"){heard.textContent="마이크가 꺼져 있어요. 휴대폰 설정 > 앱 > Chrome > 권한에서 마이크를 허용하거나, 아래 '글자로 쓰기'를 눌러 주세요.";return fit();}
    if(r.error==="network"){heard.textContent="음성 인식에는 인터넷이 필요해요. 연결을 확인하거나 '글자로 쓰기'를 눌러 주세요.";return fit();}
    if(r.error){heard.textContent=r.error==="silence"?"잘 안 들렸어요. 한 번 더 눌러 말해 주세요.":"마이크를 켤 수 없어요. '글자로 쓰기'를 눌러 주세요.";return;}
    answer(ex,r.text,r.alts,r.conf);
  });
}
async function answer(ex,text,alts,conf){
  const dock=$("#dock"),isFree=ex.t==="free",saids=[text].concat(alts||[]);
  const g=isFree?gradeFrame(ex.l.pat.frame,saids):gradeBest(targetsOf(ex),saids);
  if(g.heard!==text)conf=Math.min(conf||0,0.6);
  let ok=isFree?g.ok:g.score>=passFor(ex),judged=null;
  // Same meaning said another way: ask the AI before calling it wrong.
  if(!ok&&!isFree&&llmReady()&&text.split(/\s+/).length>=2){
    dock.className="dock fixed";
    dock.innerHTML='<p class="heard">'+esc(text)+'</p><p class="mic-l">뜻이 통하는지 확인하는 중…</p>';
    fit();
    try{judged=await call("/v1/judge",{target:ex.en,ko:ex.p.ko,said:text},15000);}catch(e){judged=null;}
    if(!$("#dock")||S.q[S.i]!==ex)return;
    if(judged&&judged.ok)ok=true;
  }
  const marks=g.words.map(w=>'<span class="w '+(w.hit?"hit":"miss")+'">'+esc(w.text)+'</span>').join(" ");
  const clear=conf>0?'<p class="sub">'+(conf>=0.9?"음성 인식이 또렷하게 알아들었어요":conf>=0.75?"음성 인식이 잘 알아들었어요":"음성 인식이 조금 흐리게 들었어요. 천천히 또박또박 말해 봐요")+'</p>':"";
  const tool=speechReady()&&canRecord()?'<button type="button" class="txt" id="pron">발음 평가 받기</button>':canRecord()?'<button type="button" class="txt" id="cmp">내 발음 들어 보기</button>':"";
  const model=isFree?g.heard:(g.target||ex.en);
  if(ok){
    const viaAi=!!(judged&&judged.ok),perfect=!isFree&&!viaAi&&g.score===1&&g.said-g.need<2;
    S.said++;addSay(1);
    if(ex.card)grow(P,ex.card,S.hint?-2:S.first?1:0);
    save();
    sfx(perfect?"perfect":"ok");
    try{navigator.vibrate&&navigator.vibrate(20);}catch(e){}
    reveal();
    dock.className="dock fixed ok";
    dock.innerHTML='<div class="fb" role="status"><p class="fb-t">'+(isFree?"좋아요, 내 문장이에요":viaAi?"뜻이 통해요":perfect?"정확해요":"좋아요, 통해요")+'</p>'
     +(viaAi?'<p class="words" lang="en">'+esc(text)+'</p><p class="sub">'+esc(judged.why_ko)+(judged.fix?' 더 자연스럽게: <span lang="en">'+esc(judged.fix)+'</span>':"")+'</p><p class="sub">교재 표현: <span lang="en">'+esc(ex.en)+'</span></p>'
            :'<p class="words" lang="en">'+(isFree?esc(g.heard):marks)+'</p>'+clear)
     +'<button type="button" class="cta" id="nx">다음</button>'+tool+'</div>';
    $("#nx").addEventListener("click",next);
  }else{
    S.first=false;S.fails++;sfx("no");
    try{navigator.vibrate&&navigator.vibrate([30,40,30]);}catch(e){}
    reveal();
    const title=isFree?(g.score>=0.8?"빈칸에 들어갈 말도 넣어 주세요":"문장 틀을 살려서 말해 봐요"):"조금만 더요";
    dock.className="dock fixed no";
    dock.innerHTML='<div class="fb" role="status"><p class="fb-t">'+title+'</p><p class="words" lang="en">'+marks+'</p><p class="sub">내가 한 말: '+esc(text)+'</p>'
     +(judged&&judged.why_ko?'<p class="tip">'+esc(judged.why_ko)+'</p>':"")
     +(isFree?"":tipsFor(g.words.filter(w=>!w.hit).map(w=>w.text),1).map(x=>'<p class="tip"><b lang="en">'+esc(x.w)+'</b>의 '+x.k.toUpperCase()+' 소리: '+x.t+'</p>').join(""))
     +'<button type="button" class="cta dark" id="re">다시 말하기</button>'+tool
     +(S.fails>=2?'<button type="button" class="txt" id="skip">건너뛰기</button>':"")+'</div>';
    $("#re").addEventListener("click",()=>dockMic(ex));
    const sk=$("#skip");
    if(sk)sk.addEventListener("click",()=>{if(ex.card){grow(P,ex.card,-2);save();}next();});
  }
  const pb=$("#pron"),cb=$("#cmp");
  if(pb)pb.addEventListener("click",()=>openPron(model,()=>dockMic(ex),ok?next:null));
  if(cb)cb.addEventListener("click",()=>compare(model,cb));
  fit();
}

/* ---------- record and play back (no scoring) ---------- */
let rec=null;
function stopRec(){if(rec){try{rec.cancel();}catch(e){}rec=null;}}
async function compare(en,btn){
  if(rec)return;
  abortSR();stopSpeak();
  btn.disabled=true;btn.textContent="녹음 중… 지금 말하세요";
  try{rec=await startRecording(Math.min(8,2+en.split(" ").length*0.6));}
  catch(e){btn.disabled=false;btn.textContent="마이크를 허용해야 녹음할 수 있어요";return;}
  const mine=rec;
  mine.onauto=async r=>{
    if(rec===mine)rec=null;
    if(!btn.isConnected)return;
    btn.textContent="내 목소리 재생 중";
    const a=new Audio(r.url);
    await new Promise(res=>{a.onended=res;a.onerror=res;a.play().catch(res);});
    URL.revokeObjectURL(r.url);
    if(!btn.isConnected)return;
    btn.textContent="본보기 발음 재생 중";
    await speak(en);
    if(btn.isConnected){btn.textContent="다시 들어 보기";btn.disabled=false;}
  };
}

function finish(){
  let extra="",note="";
  if(!P.days[today()])addSay(1); // a session with no spoken sentence still counts as a study day
  if(S.kind==="lesson"){
    const l=lesson(S.id);
    P.done[l.id]=true;addCards(P,l,plusDays(1));
    extra='<li><span>내일 복습할 문장·단어</span><b>'+(l.ph.length+l.pat.items.length+l.words.length)+'개</b></li>';
    const standalone=window.matchMedia&&matchMedia("(display-mode:standalone)").matches;
    if(Object.keys(P.done).length===1)note='<p class="note">'+(standalone?"":"홈 화면에 추가하면 내일도 바로 열 수 있어요. 크롬 오른쪽 위 ⋮ > '홈 화면에 추가'를 눌러요.<br>")+'기록은 이 휴대폰에만 저장돼요. 설정에서 백업 파일로 내보낼 수 있어요.</p>';
  }
  const mins=Math.max(1,Math.round((Date.now()-(S.t0||Date.now()))/60000));
  endClock();save();
  const title=S.kind==="lesson"?esc(lesson(S.id).title)+" 수업을 마쳤어요":"복습을 마쳤어요";
  const talk=S.kind==="lesson"&&llmReady()?'<button type="button" class="txt" id="talk">이 주제로 AI 선생님과 대화하기</button>':"";
  const id=S.id;
  app.innerHTML='<div class="fin"><h1>'+title+'</h1><ul class="rows"><li><span>방금 영어로 말한 횟수</span><b>'+S.said+'번</b></li><li><span>걸린 시간</span><b>약 '+mins+'분</b></li><li><span>연속 학습</span><b>'+streak(P)+'일</b></li>'+extra+'</ul>'+note+'</div>';
  chrome.innerHTML='<div class="dock fixed"><button type="button" class="cta" id="home">홈으로</button>'+talk+'</div>';
  sfx("done");confetti();
  $("#home").addEventListener("click",()=>show("today"));
  const tb=$("#talk");
  if(tb)tb.addEventListener("click",()=>open("talk",{lesson:id}));
  S=null;
}
register("lesson",startLesson);
register("review",startReview);
