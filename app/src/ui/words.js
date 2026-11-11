// Vocabulary section: every lesson word as a card (meanings, example, similar/opposite words, origin or
// usage tip), a personal word book, search, and a quick quiz. Cards live in content/words.json.
import {P,save} from "../core/store.js";
import {allLessons,levelOfLesson} from "../core/content.js";
import {LEVELS} from "../core/levels.js";
import {esc} from "../core/util.js";
import {speak,canSpeak} from "../speech/tts.js";
import {app,chrome,$,$$,ui,register,open,show,enter} from "./nav.js";
import {I} from "./icons.js";

let CARDS=null,LIST=null;
const st={f:"all",q:""};
async function loadCards(){
  if(CARDS)return;
  try{const r=await fetch("content/words.json");CARDS=r.ok?await r.json():{};}catch(e){CARDS={};}
  LIST=[];const seen=new Set();
  allLessons().forEach(l=>l.words.forEach(w=>{if(!seen.has(w.w)){seen.add(w.w);LIST.push({w:w.w,ko:w.ko,e:w.e,lv:levelOfLesson(l.id),lesson:l.id});}}));
}
const learned=()=>new Set(LIST.filter(x=>P.done[x.lesson]).map(x=>x.w));
const starred=w=>!!(P.wb&&P.wb[w]);
const KIND={origin:"어원",family:"단어 가족",usage:"쓰임"};

function filtered(){
  const q=st.q.trim().toLowerCase(),lr=learned();
  return LIST.filter(x=>(st.f==="all"||(st.f==="star"?starred(x.w):st.f==="done"?lr.has(x.w):x.lv===st.f))
    &&(!q||x.w.includes(q)||x.ko.includes(q)));
}
function listHtml(){
  const rows=filtered();
  if(!rows.length)return '<p class="note" style="margin-top:24px">'+(st.f==="star"?"아직 담은 단어가 없어요. 단어를 눌러 ☆를 켜 보세요.":"찾는 단어가 없어요.")+'</p>';
  return '<ul class="rows wl">'+rows.slice(0,150).map(x=>'<li><button type="button" class="row" data-w="'+esc(x.w)+'"><span class="ic em">'+x.e+'</span><span class="tx"><b lang="en">'+esc(x.w)+'</b><small>'+esc(x.ko)+'</small></span><span class="star'+(starred(x.w)?" on":"")+'">'+(starred(x.w)?"★":"☆")+'</span></button></li>').join("")+'</ul>'
    +(rows.length>150?'<p class="note">'+(rows.length-150)+'개 더 있어요. 검색하거나 단계를 골라 보세요.</p>':"");
}
async function wordsHome(){
  enter("words");
  chrome.innerHTML="";
  app.innerHTML='<div class="pad"><p class="note">단어를 불러오는 중…</p></div>';
  await loadCards();
  if(ui.busy!=="words")return;
  const lr=learned(),nStar=Object.keys(P.wb||{}).length;
  const chip=(k,t)=>'<button type="button" data-f="'+k+'" class="'+(st.f===k?"on":"")+'">'+t+'</button>';
  app.innerHTML='<header class="sbar"><button type="button" class="x" id="quit" aria-label="닫기">'+I.x+'</button><div class="thead"><p class="ttitle"><small>수업에 나온 단어 '+LIST.length+'개</small>단어</p></div></header>'
   +'<div class="wstat"><div><b>'+lr.size+'</b><span>익힌 단어</span></div><div><b>'+nStar+'</b><span>내 단어장</span></div><div><b>'+LIST.length+'</b><span>전체</span></div></div>'
   +'<input type="search" id="wq" class="wq" placeholder="영어나 한국어로 찾기" value="'+esc(st.q)+'" autocomplete="off" autocapitalize="off">'
   +'<div class="seg wseg">'+chip("all","전체")+chip("star","내 단어장")+chip("done","익힌 단어")+LEVELS.map(l=>chip(l.id,l.name)).join("")+'</div>'
   +'<button type="button" class="cta dark" id="wquiz" style="margin-top:14px">이 목록으로 단어 퀴즈</button>'
   +'<div id="wlist">'+listHtml()+'</div>';
  const bind=()=>$$("[data-w]").forEach(b=>b.addEventListener("click",()=>open("word",b.dataset.w)));
  bind();
  $("#quit").addEventListener("click",()=>show("today"));
  $("#wq").addEventListener("input",e=>{st.q=e.target.value;$("#wlist").innerHTML=listHtml();bind();});
  $$("[data-f]").forEach(b=>b.addEventListener("click",()=>{st.f=b.dataset.f;open("words");}));
  $("#wquiz").addEventListener("click",()=>{const rows=filtered();if(rows.length<3){$("#wquiz").textContent="단어가 3개 이상 있어야 해요";return;}open("wordquiz",rows);});
}
async function wordCard(w){
  enter("word");
  await loadCards();
  const base=LIST.find(x=>x.w===w);if(!base)return open("words");
  const c=CARDS[w]||null,tts=canSpeak();
  const chips=(t,a)=>a&&a.length?'<div class="wrow"><small>'+t+'</small><p>'+a.map(x=>'<span class="chip" lang="en">'+esc(x)+'</span>').join("")+'</p></div>':"";
  chrome.innerHTML="";
  app.innerHTML='<header class="sbar"><button type="button" class="x" id="back" aria-label="뒤로">'+I.x+'</button><div class="thead"></div><button type="button" class="starbtn'+(starred(w)?" on":"")+'" id="star" aria-pressed="'+starred(w)+'">'+(starred(w)?"★ 담음":"☆ 내 단어장에 담기")+'</button></header>'
   +'<div class="wcard"><p class="wemo" aria-hidden="true">'+base.e+'</p><h1 class="en" lang="en">'+esc(w)+'</h1>'
   +(c?'<p class="say">'+esc(c.say)+' · '+esc(c.pos)+'</p>':"")
   +(tts?'<button type="button" class="aud" id="wsay">'+I.spk+'발음 듣기</button>':"")
   +'<ol class="wmean">'+(c?c.ko:[base.ko]).map(k=>'<li>'+esc(k)+'</li>').join("")+'</ol>'
   +(c?'<div class="wex"><small>예문</small><p lang="en"><b>'+esc(c.ex.en)+'</b></p><p class="sub">'+esc(c.ex.ko)+'</p>'+(tts?'<button type="button" class="aud sm" id="exsay">'+I.spk+'예문 듣기</button>':"")+'</div>'
     +chips("비슷한 말",c.syn)+chips("반대말",c.ant)
     +'<div class="gram"><b>'+(KIND[c.kind]||"기억하기")+'</b><p>'+esc(c.tip)+'</p></div>'
     :'<p class="note">이 단어의 자세한 설명은 준비 중이에요.</p>')
   +'</div>';
  $("#back").addEventListener("click",()=>open("words"));
  $("#star").addEventListener("click",()=>{P.wb=P.wb||{};if(P.wb[w])delete P.wb[w];else P.wb[w]=1;save();open("word",w);});
  if(tts){$("#wsay").addEventListener("click",()=>speak(w,0.85));const b=$("#exsay");if(b)b.addEventListener("click",()=>speak(c.ex.en));}
}
register("words",wordsHome);
register("word",wordCard);
