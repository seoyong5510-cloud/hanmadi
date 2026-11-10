// Pronunciation assessment panel. Scores come from the speech service through the relay.
// Anything the service did not return is shown as "평가 불가", never estimated.
import {P,save} from "../core/store.js";
import {today,esc} from "../core/util.js";
import {startRecording,canRecord} from "../speech/wav.js";
import {speak,stopSpeak} from "../speech/tts.js";
import {abort as abortSR} from "../speech/sr.js";
import {postAudio,errorKo} from "../ai/relay.js";
import {sfx} from "../speech/sfx.js";
import {I} from "./icons.js";
import {$,$$,onLeave,fit} from "./nav.js";

const band=s=>s==null?"na":s>=80?"hi":s>=60?"mid":"lo";
const ERR={Mispronunciation:"발음이 달랐어요",Omission:"빠뜨렸어요",Insertion:"없는 단어를 넣었어요",UnexpectedBreak:"어색하게 끊겼어요",MissingBreak:"쉬어야 할 곳에서 안 쉬었어요",Monotone:"억양이 단조로웠어요"};
let rec=null;
function stopRec(){if(rec){try{rec.cancel();}catch(e){}rec=null;}}

// ref = the sentence to read. onRetry = go back to normal speaking. onNext = continue (optional).
export function openPron(ref,onRetry,onNext){
  const dock=$("#dock");
  if(!dock||!canRecord())return;
  abortSR();stopSpeak();
  onLeave(stopRec);
  const prev=(P.pron||[]).filter(x=>x.ref===ref).pop();
  const idle=msg=>{
    dock.className="dock fixed";
    dock.innerHTML='<div class="fb"><p class="fb-t">발음 평가</p><p class="words" lang="en">'+esc(ref)+'</p><p class="sub" id="pmsg">'+esc(msg||"버튼을 누르고 이 문장을 소리 내어 읽어 주세요. 다 읽으면 다시 눌러요.")+'</p>'
     +'<button type="button" class="micbtn" id="prec" style="justify-self:center" aria-label="녹음 시작">'+I.mic+'</button>'
     +'<button type="button" class="txt" id="pback" style="justify-self:center">돌아가기</button></div>';
    $("#prec").addEventListener("click",record);
    $("#pback").addEventListener("click",()=>{stopRec();onRetry();});
    fit();
  };
  async function record(){
    const btn=$("#prec"),msg=$("#pmsg");
    if(rec){const r=rec;rec=null;return analyze(await r.stop());}
    try{rec=await startRecording(28);}
    catch(e){msg.textContent="마이크를 허용해야 발음을 평가할 수 있어요.";return;}
    rec.onauto=r=>{if(rec){rec=null;analyze(r);}};
    btn.classList.add("on");btn.innerHTML=I.stop;btn.setAttribute("aria-label","녹음 끝내기");
    msg.textContent="녹음 중이에요. 다 읽으면 버튼을 눌러요.";
  }
  async function analyze(r){
    if(!$("#dock"))return;
    if(r.seconds<0.4)return idle("너무 짧게 녹음됐어요. 다시 해 볼까요?");
    dock.innerHTML='<div class="fb"><p class="fb-t">발음을 분석하는 중…</p><p class="words" lang="en">'+esc(ref)+'</p></div>';
    fit();
    let j;
    try{j=await postAudio("/v1/pron?ref="+encodeURIComponent(ref),r.blob);}
    catch(e){URL.revokeObjectURL(r.url);return idle(errorKo(e));}
    if(!$("#dock"))return;
    if(j.status!=="Success"||!j.scores)return idle("말소리를 알아듣지 못했어요. 조금 더 크게 다시 읽어 주세요.");
    result(j,r.url);
  }
  function result(j,url){
    const s=j.scores,total=s.pron!=null?s.pron:s.accuracy;
    P.pron.push({d:today(),s:total,ref});
    if(P.pron.length>300)P.pron.shift();
    save();
    sfx(total>=80?"perfect":"ok");
    const cell=(v,l)=>'<div><b class="'+band(v)+'">'+(v==null?"평가 불가":v)+'</b><span>'+l+'</span></div>';
    const words=j.words.filter(w=>w.error!=="Insertion");
    dock.className="dock fixed";
    dock.innerHTML='<div class="fb"><p class="fb-t">발음 점수 <span class="pscore '+band(total)+'">'+total+'</span>'
     +(prev?'<span class="sub" style="font-weight:500"> · 지난번 '+Math.round(prev.s)+'점'+(total>prev.s?" → "+(total-Math.round(prev.s))+"점 올랐어요":"")+'</span>':"")+'</p>'
     +'<p class="words" lang="en">'+words.map((w,i)=>'<button type="button" class="pw '+(w.error==="Omission"?"lo":band(w.score))+'" data-w="'+i+'">'+esc(w.w)+'</button>').join(" ")+'</p>'
     +'<p class="sub" id="pdet">색이 다른 단어를 누르면 소리별 점수가 보여요.</p>'
     +'<div class="three pthree">'+cell(s.accuracy,"정확도")+cell(s.fluency,"유창성")+cell(s.completeness,"완성도")+cell(s.prosody,"억양·리듬")+'</div>'
     +'<p class="sub">강세(어느 음절을 세게 읽는지)는 이 평가 서비스가 따로 점수를 주지 않아 평가 불가예요.</p>'
     +'<div class="auds" style="margin:4px 0"><button type="button" class="aud" id="pmine">'+I.spk+'내 녹음</button><button type="button" class="aud" id="pmodel">'+I.spk+'본보기</button></div>'
     +'<button type="button" class="cta dark" id="pagain">다시 녹음하기</button>'
     +(onNext?'<button type="button" class="txt" id="pnext" style="justify-self:center">다음으로</button>':'<button type="button" class="txt" id="pback" style="justify-self:center">돌아가기</button>')+'</div>';
    $$(".pw",dock).forEach(b=>b.addEventListener("click",()=>{
      const w=words[+b.dataset.w],det=$("#pdet");
      const ph=w.phonemes.filter(p=>p.score!=null);
      det.textContent=w.w+" · "+(w.error!=="None"&&ERR[w.error]?ERR[w.error]+" · ":"")+(w.score==null?"단어 점수 평가 불가":w.score+"점")
        +(ph.length?" · 소리별: "+ph.map(p=>"/"+p.p+"/ "+p.score).join(", "):" · 소리별 점수는 제공되지 않았어요");
      speak(w.w,0.8);
    }));
    let au=null;
    $("#pmine").addEventListener("click",()=>{stopSpeak();if(au)au.pause();au=new Audio(url);au.play().catch(()=>{});});
    $("#pmodel").addEventListener("click",()=>{if(au)au.pause();speak(ref);});
    $("#pagain").addEventListener("click",()=>{if(au)au.pause();URL.revokeObjectURL(url);idle();});
    const nb=$("#pnext"),bb=$("#pback");
    if(nb)nb.addEventListener("click",()=>{if(au)au.pause();URL.revokeObjectURL(url);onNext();});
    if(bb)bb.addEventListener("click",()=>{if(au)au.pause();URL.revokeObjectURL(url);onRetry();});
    fit();
  }
  idle();
}
