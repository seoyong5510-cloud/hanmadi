// Short synthesized sound effects (no audio files).
import {P} from "../core/store.js";
let AC=null;
function note(f,at,dur,type,vol){
  const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+at;
  o.type=type||"sine";o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(vol||0.18,t+0.015);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+dur+0.02);
}
export function sfx(name){
  if(!P.snd)return;
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return;
    AC=AC||new C();
    if(AC.state==="suspended")AC.resume();
    if(name==="tap")note(520,0,0.06,"sine",0.08);
    else if(name==="miss")note(196,0,0.1,"sine",0.14);
    else if(name==="ok"){note(659,0,0.14,"triangle");note(988,0.1,0.26,"triangle");}
    else if(name==="perfect"){note(659,0,0.12,"triangle");note(831,0.09,0.12,"triangle");note(1319,0.18,0.34,"triangle");}
    else if(name==="no"){note(233,0,0.16,"sine",0.2);note(185,0.13,0.26,"sine",0.2);}
    else if(name==="done"){[523,659,784,1047].forEach((f,i)=>note(f,i*0.11,0.22,"triangle"));[523,659,784,1047].forEach(f=>note(f,0.5,0.7,"sine",0.1));}
  }catch(e){}
}

export function confetti(){
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches)return;
  const c=document.createElement("canvas");c.id="confetti";document.body.appendChild(c);
  const x=c.getContext("2d"),W=c.width=innerWidth,H=c.height=innerHeight;
  const cols=["#2f6bff","#ffcf33","#9db8ff"];
  const ps=[];for(let i=0;i<90;i++)ps.push({x:Math.random()*W,y:-20-Math.random()*H*0.5,vx:(Math.random()-0.5)*3,vy:3+Math.random()*4,s:5+Math.random()*6,r:Math.random()*6,vr:(Math.random()-0.5)*0.3,c:cols[i%cols.length]});
  const t0=performance.now();
  (function tick(now){
    x.clearRect(0,0,W,H);
    ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore();});
    if(now-t0<2600)requestAnimationFrame(tick);else c.remove();
  })(t0);
}

