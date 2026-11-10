// Tab screens (today, lessons, stats, settings) and first-launch screens (welcome, level test).
import {P,save,exportData,importData} from "../core/store.js";
export const VERSION="2026.11.10-5";
import {LEVELS,LV,levelIndex} from "../core/levels.js";
import {unitsOf,orderOf,lesson,reviewed} from "../core/content.js";
import {plan,stats,nextLesson} from "../core/plan.js";
import {streak,ensureCards} from "../core/srs.js";
import {QUIZ,shouldStop,place} from "../core/placement.js";
import {today,dayStr,now,shuffle,esc} from "../core/util.js";
import {SR} from "../speech/sr.js";
import {speak,stopSpeak,canSpeak} from "../speech/tts.js";
import {sfx} from "../speech/sfx.js";
import {relayReady,health,caps,usageSummary,errorKo} from "../ai/relay.js";
import {I,art} from "./icons.js";
import {app,chrome,$,$$,ui,register,show,open,enter,tabsHtml,bindTabs} from "./nav.js";

const DN=["일","월","화","수","목","금","토"];
const lvName=()=>(LV[P.level]||LV.a1).name;
const bindSay=root=>$$("[data-say]",root).forEach(b=>b.addEventListener("click",()=>speak(b.dataset.say,+b.dataset.rate||0)));

function root(){
  if(!SR&&!ui.gateSeen)return viewGate();
  if(!P.level)return viewWelcome();
  if(!ui.browse)ui.browse=P.level;
  ({today:viewToday,lessons:viewLessons,talk:()=>open("talkHome"),stats:viewStats,set:viewSettings})[ui.tab]();
  bindTabs();
  $$("[data-lesson]").forEach(b=>b.addEventListener("click",()=>open("lesson",b.dataset.lesson)));
  $$("[data-review]").forEach(b=>b.addEventListener("click",()=>open("review")));
  $$("[data-setlv]").forEach(b=>b.addEventListener("click",()=>setLevel(b.dataset.setlv)));
  $$("[data-goto]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.goto)));
  bindSay(app);
}
function setLevel(v){P.level=v;ui.browse=v;save();show(ui.tab==="set"?"set":"today");}

/* ---------- today ---------- */
function viewToday(){
  const d=now(),pl=plan(P),st=streak(P),did=!!P.days[today()];
  const mon=new Date(d);mon.setDate(d.getDate()-((d.getDay()+6)%7));
  let week="";
  for(let k=0;k<7;k++){
    const x=new Date(mon);x.setDate(mon.getDate()+k);
    const ds=dayStr(x);
    week+='<li class="'+(P.days[ds]?"did ":"")+(ds===today()?"now":"")+'"><i>'+I.chk+'</i>'+DN[x.getDay()]+'</li>';
  }
  const hero=pl.pct>=100?"오늘 목표를 채웠어요":st>1?st+"일째 이어가고 있어요":did?"좋아요, 조금만 더 해 봐요":pl.due?"배운 문장부터 다시 꺼내 봐요":"오늘 네 문장만 말해 봐요";
  const nl=pl.next,up=LEVELS[levelIndex(P.level)+1];
  let rows='<li><button type="button" class="row'+(pl.due?"":" off")+'" '+(pl.due?"data-review":"disabled")+'><span class="ic'+(pl.due?"":" done")+'">'+(pl.due?pl.due:I.chk)+'</span><span class="tx"><b>복습</b><small>'+(pl.due?"잊기 전에 다시 말해 볼 문장·단어 "+pl.due+"개":"지금 복습할 것이 없어요")+'</small></span>'+(pl.due?I.go:"")+'</button></li>';
  rows+=nl?'<li><button type="button" class="row" data-lesson="'+nl.id+'">'+art(nl.id,"th")+'<span class="tx"><b>'+esc(nl.title)+'</b><small>새 수업 · '+esc(nl.sub)+'</small></span>'+I.go+'</button></li>'
    :up&&orderOf(up.id).length?'<li><button type="button" class="row" data-setlv="'+up.id+'"><span class="ic">'+I.go+'</span><span class="tx"><b>'+up.name+' 단계로 올라가기</b><small>이 단계 수업을 모두 마쳤어요</small></span>'+I.go+'</button></li>'
    :'<li><div class="row off"><span class="ic done">'+I.chk+'</span><span class="tx"><b>모든 수업 완료</b><small>복습과 AI 회화로 내 것으로 만들어요</small></span></div></li>';
  rows+='<li><button type="button" class="row" data-goto="talk"><span class="ic">'+I.chat+'</span><span class="tx"><b>AI 선생님과 회화</b><small>'+(relayReady()?(pl.talkLesson?"추천 주제 · "+esc(pl.talkLesson.topicKo):"자유 대화"):"연결하면 쓸 수 있어요")+'</small></span>'+I.go+'</button></li>';
  const s=pl.sentence,w=pl.word;
  app.innerHTML='<p class="date">'+(d.getMonth()+1)+'월 '+d.getDate()+'일 '+DN[d.getDay()]+'요일 · '+lvName()+' 단계</p><h1 class="hero">'+hero+'</h1>'
   +'<div class="goal" role="img" aria-label="오늘 목표 '+pl.said+' / '+pl.goal+' 문장"><div class="goalbar"><i style="width:'+pl.pct+'%"></i></div><span>오늘 말한 문장 <b>'+pl.said+'</b> / '+pl.goal+'</span></div>'
   +'<ol class="week" aria-label="이번 주 연습한 날">'+week+'</ol>'
   +(nl&&!pl.due?'<button type="button" class="feat" data-lesson="'+nl.id+'">'+art(nl.id)+'<span class="feat-t"><small>다음 수업</small><b>'+esc(nl.title)+'</b><span>'+esc(nl.goal)+'</span></span></button>':"")
   +'<h2 class="sec">오늘의 학습</h2><ul class="rows">'+rows+'</ul>'
   +(s?'<h2 class="sec">오늘의 문장</h2><div class="quote"><p class="q-en" lang="en">'+esc(s.en)+'</p><p class="q-ko">'+esc(s.ko)+'</p>'+(canSpeak()?'<button type="button" class="aud" data-say="'+esc(s.en)+'">'+I.spk+'듣기</button>':"")+'</div>':"")
   +(w?'<h2 class="sec">오늘의 단어</h2><div class="quote wordq"><span class="pic sm" aria-hidden="true">'+w.e+'</span><div><p class="q-en" lang="en">'+esc(w.w)+'</p><p class="q-ko">'+esc(w.ko)+(w.ex?' · <span lang="en">'+esc(w.ex)+'</span>':"")+'</p></div></div>':"")
   +(pl.weak?'<h2 class="sec">요즘 자주 틀리는 것</h2><div class="quote"><p class="q-en">'+esc(pl.weak.name)+'</p><p class="q-ko">AI 회화에서 '+pl.weak.n+'번 고쳤어요. 복습에 자동으로 넣어 두었어요.</p></div>':"")
   +(SR?"":'<p class="note">이 브라우저에서는 마이크를 쓸 수 없어 글자로 입력해요. 크롬 앱에서 열면 소리 내어 연습할 수 있어요.</p>');
  const act=pl.due?'<button type="button" class="cta" data-review>복습 시작하기</button>':nl?'<button type="button" class="cta" data-lesson="'+nl.id+'">수업 시작하기</button>':'<button type="button" class="cta" data-goto="talk">AI 선생님과 대화하기</button>';
  chrome.innerHTML='<div class="cta-wrap fixed">'+act+'</div>'+tabsHtml();
}

/* ---------- lessons ---------- */
function viewLessons(){
  const nl=nextLesson(P),b=ui.browse;
  let h='<h1 class="ptitle">수업</h1><div class="seg scroll">'+LEVELS.map(lv=>'<button type="button" data-seg="'+lv.id+'" class="'+(b===lv.id?"on":"")+'" aria-pressed="'+(b===lv.id)+'">'+lv.name+(lv.id===P.level?" ·내 단계":"")+'</button>').join("")+'</div>';
  h+='<p class="note" style="margin:-10px 0 20px">'+LV[b].cefr+' · '+LV[b].desc+(b!==P.level?" 다른 단계 수업도 해 볼 수 있어요. 연습 방식은 내 단계("+lvName()+") 그대로예요.":"")+'</p>';
  unitsOf(b).forEach(u=>{
    h+='<h2 class="unit">'+esc(u.name)+'</h2><ul class="rows">'+u.ids.map(id=>{
      const l=lesson(id),dn=P.done[id];
      return '<li><button type="button" class="row" data-lesson="'+id+'">'+art(id,"th")+'<span class="tx"><b>'+esc(l.title)+'</b><small>'+esc(l.grammar.point)+' · '+esc(l.sub)+'</small></span>'+(nl&&nl.id===id?'<span class="chip">다음 수업</span>':dn?'<span class="dn">'+I.chk+'</span>':I.go)+'</button></li>';
    }).join("")+'</ul>';
  });
  if(!reviewed(b))h+='<p class="note">이 단계의 수업 내용은 AI가 작성하고 AI가 교차 검토했어요. 영어교육 전문가의 검수는 아직 받지 않았어요.</p>';
  app.innerHTML=h;chrome.innerHTML=tabsHtml();
  $$("[data-seg]").forEach(x=>x.addEventListener("click",()=>{ui.browse=x.dataset.seg;show();}));
}

/* ---------- stats ---------- */
function viewStats(){
  const s=stats(P);
  if(!s.learned&&!s.days){
    app.innerHTML='<h1 class="ptitle">기록</h1><p class="lead">첫 수업을 마치면 여기에 기록이 쌓여요.</p>';
    chrome.innerHTML=tabsHtml();return;
  }
  const mx=Math.max(1,...s.week.map(x=>x.said));
  const na='<span class="na">아직 없음</span>';
  const cell=(v,l)=>'<div><b>'+v+'</b><span>'+l+'</span></div>';
  app.innerHTML='<h1 class="ptitle">기록</h1><div class="big"><b>'+s.streak+'</b><span>일 연속</span></div>'
   +'<div class="three">'+cell(s.minutes+"분","총 학습 시간")+cell(s.days+"일","학습한 날")+cell(s.mine,"내 것이 된 표현")+'</div>'
   +'<div class="three" style="border-top:0">'+cell(s.vocab+" / "+s.vocabSeen,"익힌 단어")+cell(s.grammar==null?na:s.grammar+"%","문법 정확도")+cell(s.pronLast==null?na:s.pronLast+"점","최근 발음 점수")+'</div>'
   +'<p class="note" style="margin-top:10px">문법 정확도는 AI 회화에서 고칠 것이 없었던 문장의 비율이에요(5문장 이상 말한 뒤 표시). 발음 점수는 발음 평가를 받은 문장에만 기록돼요.'
   +(s.pronTrend!=null?" 최근 발음 점수는 이전보다 "+(s.pronTrend>=0?s.pronTrend+"점 올랐어요.":Math.abs(s.pronTrend)+"점 내려갔어요."):"")+'</p>'
   +'<h2 class="sec">최근 7일 동안 말한 횟수</h2><ol class="bars">'+s.week.map(x=>'<li class="'+(x.now?"now":"")+'"><span>'+x.said+'</span><span class="col" style="height:'+Math.round(x.said/mx*100)+'%"></span><span>'+DN[x.day]+'</span></li>').join("")+'</ol>'
   +'<h2 class="sec">단계별 진도</h2><ul class="lvbars">'+s.levels.map(l=>'<li><span>'+l.name+'</span><div class="goalbar"><i style="width:'+(l.total?Math.round(l.done/l.total*100):0)+'%"></i></div><span>'+l.done+' / '+l.total+'</span></li>').join("")+'</ul>'
   +'<h2 class="sec">취약한 부분</h2>'+(s.weak.length?'<ul class="rows">'+s.weak.slice(0,5).map(w=>'<li><div class="row"><span class="tx"><b>'+esc(w.name)+'</b><small>AI 회화에서 '+w.n+'번 고쳤어요</small></span></div></li>').join("")+'</ul>':'<p class="note" style="margin-top:6px">AI 회화를 하면 자주 틀리는 부분이 여기에 모여요.</p>')
   +'<p class="note">기록은 이 휴대폰에만 저장돼요. 설정에서 백업 파일로 내보낼 수 있어요.</p>';
  chrome.innerHTML=tabsHtml();
}

/* ---------- settings ---------- */
function viewSettings(){
  const m=usageSummary(today().slice(0,7));
  const status=!relayReady()?"연결 안 됨":!caps.checked?"확인 중…":!caps.ok?"연결 실패 · "+errorKo({code:caps.error}):"연결됨";
  app.innerHTML='<h1 class="ptitle">설정</h1><h2 class="sec" style="margin-top:0">내 단계</h2><ul class="rows">'
   +LEVELS.map(lv=>'<li><button type="button" class="row" data-setlv="'+lv.id+'" aria-pressed="'+(P.level===lv.id)+'"><span class="tx"><b>'+lv.name+' <span class="cefr">'+lv.cefr+'</span></b><small>'+lv.desc+'</small></span>'+(P.level===lv.id?'<span class="dn">'+I.chk+'</span>':"")+'</button></li>').join("")+'</ul>'
   +'<p class="note" style="margin-top:8px">단계를 바꿔도 기록과 복습은 그대로예요. 새 수업과 연습 방식만 그 단계로 바뀌어요.</p>'
   +'<button type="button" class="setrow" id="retest"><span>내 단계 다시 찾기</span>'+I.go+'</button>'
   +'<div class="setrow" style="margin-top:0"><span>하루 목표</span><span class="seg mini">'+[5,10,20,30].map(n=>'<button type="button" data-goal="'+n+'" class="'+(P.goal===n?"on":"")+'">'+n+'</button>').join("")+'</span></div>'
   +'<button type="button" class="setrow" id="snd" style="margin-top:0" role="switch" aria-checked="'+(!!P.snd)+'"><span>효과음</span><span class="sw'+(P.snd?" on":"")+'"></span></button>'
   +'<h2 class="sec">AI 연결</h2><p class="note" style="margin-top:0">AI 선생님, 자연스러운 음성, 발음 평가는 내 전용 서버를 거쳐 동작해요. 서버 주소와 접속 암호를 넣어 주세요. 상태: <b id="aistat">'+esc(status)+'</b>'
   +(caps.ok?'<br>AI 대화 '+(caps.llm?"사용 가능"+(caps.model?" ("+esc(caps.model)+")":""):"키 없음")+' · 음성·발음 평가 '+(caps.speech?"사용 가능":"키 없음")+(caps.user?'<br>'+esc(caps.user)+' 님 전용 연결'+(caps.daily?' · 하루 AI '+caps.daily+'회까지':''):""):"")+'</p>'
   +'<form class="aiform" id="aiform"><label for="aiurl">서버 주소</label><input id="aiurl" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://….workers.dev" value="'+esc(P.ai.url)+'">'
   +'<label for="aitoken">접속 암호</label><input id="aitoken" type="password" autocomplete="off" value="'+esc(P.ai.token)+'"><button type="submit" class="cta dark">저장하고 연결 확인</button></form>'
   +'<h2 class="sec">이번 달 AI 사용량</h2><div class="three">'+'<div><b>'+m.turns+'</b><span>대화 턴</span></div><div><b>'+(m.tokensIn+m.tokensOut).toLocaleString()+'</b><span>토큰</span></div><div><b>'+m.pronSeconds+'초</b><span>발음 평가</span></div></div>'
   +'<p class="note" style="margin-top:8px">음성 합성 '+m.ttsChars.toLocaleString()+'자 · 뜻 확인 '+m.judges+'회'+(m.usd?' · 추정 비용 $'+m.usd:" · 비용은 서버에 단가를 넣으면 표시돼요")+'</p>'
   +'<h2 class="sec">백업</h2><button type="button" class="setrow" id="exp" style="margin-top:0"><span>기록을 파일로 내보내기</span>'+I.go+'</button>'
   +'<label class="setrow" style="margin-top:0" for="imp"><span>백업 파일에서 가져오기</span>'+I.go+'</label><input id="imp" type="file" accept="application/json,.json" class="sr"><p class="note" id="bkmsg" hidden></p>'
   +'<button type="button" class="setrow" id="share"><span>친구에게 앱 보내기</span>'+I.go+'</button><p class="note" id="sharemsg" hidden></p>'
   +'<a class="setrow" style="margin-top:0" href="../"><span>예전 버전 열기</span>'+I.go+'</a>'
   +'<button type="button" class="setrow" id="upd" style="margin-top:0"><span>최신 버전으로 새로 받기</span>'+I.go+'</button><p class="note">버전 '+VERSION+'</p>';
  chrome.innerHTML=tabsHtml();
  $("#retest").addEventListener("click",startTest);
  $("#snd").addEventListener("click",()=>{P.snd=!P.snd;save();show();});
  $$("[data-goal]").forEach(b=>b.addEventListener("click",()=>{P.goal=+b.dataset.goal;save();show();}));
  $("#upd").addEventListener("click",async()=>{
    // Throw away saved app files (not the learning record) and load everything again.
    try{if("caches" in window)await Promise.all((await caches.keys()).map(k=>caches.delete(k)));
      if("serviceWorker" in navigator)await Promise.all((await navigator.serviceWorker.getRegistrations()).map(r=>r.unregister()));}catch(e){}
    location.replace(location.pathname+"?u="+Date.now());
  });
  $("#aiform").addEventListener("submit",async e=>{
    e.preventDefault();
    P.ai={url:$("#aiurl").value.trim().replace(/\/+$/,""),token:$("#aitoken").value.trim()};save();
    $("#aistat").textContent="확인 중…";
    if(relayReady())await health();
    if(ui.tab==="set"&&!ui.busy)show();
  });
  $("#exp").addEventListener("click",()=>{
    const msg=$("#bkmsg");
    try{
      const a=document.createElement("a"),url=URL.createObjectURL(new Blob([exportData()],{type:"application/json"}));
      a.href=url;a.download="hanmadi-backup-"+today()+".json";document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),5000);
      msg.textContent="백업 파일을 내려받았어요. 접속 암호는 파일에 넣지 않아요.";
    }catch(err){msg.textContent="내보내지 못했어요. 다시 시도해 주세요.";}
    msg.hidden=false;
  });
  $("#imp").addEventListener("change",async e=>{
    const f=e.target.files&&e.target.files[0],msg=$("#bkmsg");
    if(!f)return;
    try{importData(await f.text());ensureCards(P);save();show();}
    catch(err){msg.textContent="한마디 영어 백업 파일이 아니에요. 기록은 바뀌지 않았어요.";msg.hidden=false;}
  });
  $("#share").addEventListener("click",async()=>{
    const url=location.origin+location.pathname,msg=$("#sharemsg");
    try{
      if(navigator.share){await navigator.share({title:"한마디 영어",text:"하루 5분 영어 말하기 연습 앱이에요.",url});return;}
      await navigator.clipboard.writeText(url);msg.textContent="주소를 복사했어요. 메시지에 붙여 넣어 보내 주세요.";
    }catch(err){if(err&&err.name==="AbortError")return;msg.textContent="이 주소를 보내 주세요: "+url;}
    msg.hidden=false;
  });
}

/* ---------- first launch ---------- */
function viewGate(){
  const android=/Android/i.test(navigator.userAgent);
  app.innerHTML='<div class="fin"><img class="appicon" src="icon-192.png" alt=""><h1>크롬에서 열어야 말하기 연습을 할 수 있어요</h1><p class="lead">지금 브라우저에서는 마이크로 말하기가 안 돼요. '+(android?"아래 버튼으로 크롬에서 다시 열어 주세요.":"크롬 브라우저에서 이 주소를 열어 주세요.")+'</p></div>';
  chrome.innerHTML='<div class="dock fixed">'+(android?'<a class="cta" href="intent://'+location.host+location.pathname+'#Intent;scheme=https;package=com.android.chrome;end">크롬으로 열기</a>':"")+'<button type="button" class="txt" id="skipgate">글자로 입력하며 연습하기</button></div>';
  $("#skipgate").addEventListener("click",()=>{ui.gateSeen=true;show();});
}
function viewWelcome(){
  app.innerHTML='<div class="fin"><img class="appicon" src="icon-192.png" alt=""><h1>하루 5분, 영어로 직접 말해 봐요</h1><p class="lead">한마디 영어는 듣고 소리 내어 말하는 연습이에요. 먼저 문제 몇 개(1~2분)로 내 단계를 찾아 드려요.</p><p class="note">말하기 연습 때 마이크를 한 번 허용해 주세요. 가입 없이 쓰고, 기록은 이 휴대폰에만 남아요.</p></div>';
  chrome.innerHTML='<div class="dock fixed"><button type="button" class="cta" id="go">내 단계 찾기</button><button type="button" class="txt" id="pick">테스트 없이 단계 고르기</button></div>';
  $("#go").addEventListener("click",startTest);
  $("#pick").addEventListener("click",viewPick);
}
function viewPick(){
  app.innerHTML='<h1 class="ptitle" style="margin-top:32px">단계를 골라 주세요</h1><ul class="rows">'+LEVELS.map(lv=>'<li><button type="button" class="row" data-setlv="'+lv.id+'"><span class="tx"><b>'+lv.name+' <span class="cefr">'+lv.cefr+'</span></b><small>'+lv.desc+'</small></span>'+I.go+'</button></li>').join("")+'</ul><p class="note">단계는 설정에서 언제든 바꿀 수 있어요.</p>';
  chrome.innerHTML="";
  $$("[data-setlv]",app).forEach(b=>b.addEventListener("click",()=>{ui.tab="today";setLevel(b.dataset.setlv);}));
  window.scrollTo(0,0);
}
let T=null;
function startTest(){T={i:0,c:{1:0,2:0,3:0,4:0},n:0};enter("test");viewTest();}
function viewTest(){
  const it=QUIZ[T.i],au=it.audio&&canSpeak(),ko=/[가-힣]/.test(it.q);
  app.innerHTML='<header class="sbar"><button type="button" class="x" id="quit" aria-label="그만하기">'+I.x+'</button><div class="prog" role="progressbar" aria-label="테스트 진행" aria-valuemin="0" aria-valuemax="'+QUIZ.length+'" aria-valuenow="'+T.i+'"><i style="width:'+Math.round(T.i/QUIZ.length*100)+'%"></i></div><span class="count">'+(T.i+1)+'번</span></header>'
   +'<main class="ex"><p class="inst">'+it.k+'</p>'
   +(au?'<button type="button" class="bigplay" data-say="'+esc(it.q)+'" data-rate="1" aria-label="다시 듣기">'+I.spkL+'</button>':'<h1 class="'+(ko?"koq":"frame")+'"'+(ko?"":' lang="en"')+'>'+esc(it.q)+'</h1>')
   +'<div class="opts" style="margin-top:28px">'+shuffle(it.o).map(o=>'<button type="button" class="opt">'+esc(o)+'</button>').join("")+'</div>'
   +'<button type="button" class="txt idk" id="idk">잘 모르겠어요</button>'
   +(T.i===0?'<p class="note" style="text-align:center">틀려도 괜찮아요. 모르면 \'잘 모르겠어요\'를 눌러요. 많이 틀리면 일찍 끝나요.</p>':"")+'</main>';
  chrome.innerHTML="";
  window.scrollTo(0,0);
  bindSay(app);
  $("#quit").addEventListener("click",()=>{T=null;show();});
  const pick=ok=>{
    if(ok)T.c[it.tier]++;
    T.n++;T.i++;sfx("tap");stopSpeak();
    if(shouldStop(T.i,T.c))viewResult();else viewTest();
  };
  $$(".opt",app).forEach(b=>b.addEventListener("click",()=>pick(b.textContent===it.o[0])));
  $("#idk").addEventListener("click",()=>pick(false));
  if(au)speak(it.q,1);
}
function viewResult(){
  const c=T.c,lv=place(c),right=c[1]+c[2]+c[3]+c[4],n=T.n;
  T=null;
  app.innerHTML='<div class="fin"><p class="inst">내 단계 찾기 결과</p><h1>'+LV[lv].name+'부터 시작하면 좋아요</h1><p class="lead">'+LV[lv].cefr+' · '+LV[lv].desc+'</p><ul class="rows"><li><span>맞힌 문제</span><b>'+right+' / '+n+'</b></li></ul><p class="note">이 테스트는 듣기와 고르기라서 말하기 실력을 정확히 재지는 못해요. 해 보고 쉽거나 어려우면 설정에서 바꿔 주세요.</p></div>';
  chrome.innerHTML='<div class="dock fixed"><button type="button" class="cta" id="go">'+LV[lv].name+' 단계로 시작하기</button><button type="button" class="txt" id="pick">다른 단계 고르기</button></div>';
  sfx("done");
  $("#go").addEventListener("click",()=>{ui.tab="today";setLevel(lv);});
  $("#pick").addEventListener("click",viewPick);
}
register("root",root);
