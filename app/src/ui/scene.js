// "이럴 때 써요" — a short cartoon scene that plays the lesson's dialogue before the lesson starts,
// so the learner first sees WHEN the new sentences are used. Everything is drawn in SVG here
// (original characters and places), so every lesson gets a scene without extra image files.
import {esc} from "../core/util.js";
import {PROPS,planLine} from "./props.js";

const OL="#3b2a21"; // outline colour used for every shape (thick cartoon outline)
const sw=w=>' stroke="'+OL+'" stroke-width="'+(w||4)+'" stroke-linejoin="round" stroke-linecap="round"';

/* ---------- characters ---------- */
// species: bear rabbit cat dog fox pig panda   outfit: hoodie apron bowtie tie vest coat cap shirt headset
const SPECIES={
  bear:{fur:"#c98a55",light:"#f1d3ad"},
  rabbit:{fur:"#f4efe8",light:"#ffffff",inner:"#f7b9c4"},
  cat:{fur:"#f2a65a",light:"#fde3c4",inner:"#f7b9c4"},
  dog:{fur:"#e9d2a8",light:"#fff4e0",ear:"#a8774e"},
  fox:{fur:"#e9783a",light:"#fff6ea",inner:"#3b2a21"},
  pig:{fur:"#f7b8c0",light:"#fbd3d8",inner:"#e98d9b"},
  panda:{fur:"#fbfaf7",light:"#ffffff",ear:"#2c2a2b"}
};
function ears(sp,c){
  const f=c.fur;
  switch(sp){
    case "bear":return '<circle cx="36" cy="54" r="17" fill="'+f+'"'+sw()+'/><circle cx="124" cy="54" r="17" fill="'+f+'"'+sw()+'/><circle cx="36" cy="54" r="8" fill="'+c.light+'"/><circle cx="124" cy="54" r="8" fill="'+c.light+'"/>';
    case "rabbit":return '<g><ellipse cx="56" cy="26" rx="13" ry="34" fill="'+f+'" transform="rotate(-10 56 26)"'+sw()+'/><ellipse cx="56" cy="28" rx="6" ry="24" fill="'+c.inner+'" transform="rotate(-10 56 28)"/></g><g class="ear2"><ellipse cx="104" cy="26" rx="13" ry="34" fill="'+f+'" transform="rotate(12 104 26)"'+sw()+'/><ellipse cx="104" cy="28" rx="6" ry="24" fill="'+c.inner+'" transform="rotate(12 104 28)"/></g>';
    case "cat":return '<path d="M30 76 L38 30 L70 52 Z" fill="'+f+'"'+sw()+'/><path d="M130 76 L122 30 L90 52 Z" fill="'+f+'"'+sw()+'/><path d="M40 60 L42 42 L58 54 Z" fill="'+c.inner+'"/><path d="M120 60 L118 42 L102 54 Z" fill="'+c.inner+'"/>';
    case "fox":return '<path d="M28 80 L34 20 L74 52 Z" fill="'+f+'"'+sw()+'/><path d="M132 80 L126 20 L86 52 Z" fill="'+f+'"'+sw()+'/><path d="M38 60 L40 34 L60 52 Z" fill="'+c.inner+'"/><path d="M122 60 L120 34 L100 52 Z" fill="'+c.inner+'"/>';
    case "pig":return '<path d="M38 70 L40 36 L68 54 Z" fill="'+f+'"'+sw()+'/><path d="M122 70 L120 36 L92 54 Z" fill="'+f+'"'+sw()+'/><path d="M44 58 L46 44 L60 54 Z" fill="'+c.inner+'"/><path d="M116 58 L114 44 L100 54 Z" fill="'+c.inner+'"/>';
    case "panda":return '<circle cx="38" cy="56" r="17" fill="'+c.ear+'"'+sw()+'/><circle cx="122" cy="56" r="17" fill="'+c.ear+'"'+sw()+'/>';
    default:return "";
  }
}
function dogEars(c){return '<path d="M34 64 Q14 70 18 112 Q30 120 44 100 Z" fill="'+c.ear+'"'+sw()+'/><path d="M126 64 Q146 70 142 112 Q130 120 116 100 Z" fill="'+c.ear+'"'+sw()+'/>';}
function outfit(o,col){
  const shirt='<path d="M22 232 Q24 166 80 156 Q136 166 138 232 Z" fill="'+col+'"'+sw()+'/>';
  const neck='<path d="M64 158 Q80 172 96 158" fill="none"'+sw(3)+'/>';
  switch(o){
    case "hoodie":return shirt+'<path d="M52 160 Q80 186 108 160" fill="none"'+sw(3)+'/><path d="M70 176 L68 200 M90 176 L92 200"'+sw(3)+'/><circle cx="68" cy="202" r="3" fill="#fff"'+sw(2)+'/><circle cx="92" cy="202" r="3" fill="#fff"'+sw(2)+'/>';
    case "apron":return shirt+neck+'<path d="M50 178 L110 178 L114 232 L46 232 Z" fill="#fffaf2"'+sw(3)+'/><path d="M56 178 L64 160 M104 178 L96 160"'+sw(3)+'/><rect x="68" y="194" width="24" height="14" rx="3" fill="#f2c94c"'+sw(2)+'/>';
    case "bowtie":return '<path d="M22 232 Q24 166 80 156 Q136 166 138 232 Z" fill="#2f3137"'+sw()+'/><path d="M66 160 L80 232 L94 160 Z" fill="#fff"'+sw(3)+'/><path d="M68 164 L80 170 L92 164 L92 178 L80 172 L68 178 Z" fill="#d6453d"'+sw(3)+'/>';
    case "tie":return shirt+'<path d="M64 160 L80 176 L96 160" fill="#fff"'+sw(3)+'/><path d="M80 174 L72 186 L80 226 L88 186 Z" fill="'+(col==="#4a6fa5"?"#d6453d":"#2f5aa8")+'"'+sw(3)+'/>';
    case "vest":return '<path d="M22 232 Q24 166 80 156 Q136 166 138 232 Z" fill="#fff"'+sw()+'/><path d="M30 232 Q30 178 60 164 L80 200 L100 164 Q130 178 130 232 Z" fill="'+col+'"'+sw(3)+'/><path d="M74 166 L80 178 L86 166 Z" fill="#c7353a"'+sw(2)+'/><circle cx="80" cy="212" r="3" fill="#f2c94c"/>';
    case "coat":return '<path d="M22 232 Q24 166 80 156 Q136 166 138 232 Z" fill="#ffffff"'+sw()+'/><path d="M80 166 L80 232"'+sw(3)+'/><path d="M58 162 L80 196 L70 160 M102 162 L80 196 L90 160" fill="#eef4fb"'+sw(3)+'/><path d="M98 200 Q108 214 116 204" fill="none" stroke="#5b8cff" stroke-width="4" stroke-linecap="round"/><circle cx="116" cy="204" r="5" fill="#9fb4d6"'+sw(2)+'/>';
    case "headset":return shirt+neck;
    default:return shirt+neck;
  }
}
function hat(h,col){
  if(h==="cap")return '<path d="M30 64 Q80 6 130 64 Z" fill="'+col+'"'+sw()+'/><path d="M30 64 Q12 66 10 72 L70 70 Z" fill="'+col+'"'+sw(3)+'/><circle cx="80" cy="30" r="4" fill="#fff"/>';
  if(h==="beret")return '<path d="M34 58 Q50 18 110 30 Q136 40 128 58 Q80 48 34 58 Z" fill="'+col+'"'+sw()+'/><circle cx="96" cy="26" r="4" fill="'+col+'"'+sw(2)+'/>';
  if(h==="headset")return '<path d="M30 92 Q30 30 80 30 Q130 30 130 92" fill="none" stroke="#2f3137" stroke-width="7"/><rect x="20" y="82" width="16" height="26" rx="7" fill="#2f3137"/><rect x="124" y="82" width="16" height="26" rx="7" fill="#2f3137"/><path d="M28 104 Q36 130 62 128" fill="none" stroke="#2f3137" stroke-width="4"/><circle cx="64" cy="128" r="5" fill="#2f3137"/>';
  return "";
}
// One character, 160 x 232, looking toward `look` (-1 left, 1 right).
export function charSvg(ch){
  const sp=ch.sp||"bear",c=SPECIES[sp]||SPECIES.bear,look=ch.look||0,px=look*3;
  const head=sp==="dog"?dogEars(c):ears(sp,c);
  let face='<ellipse cx="80" cy="98" rx="54" ry="50" fill="'+c.fur+'"'+sw()+'/>';
  if(sp==="fox")face+='<path d="M28 106 Q50 140 80 144 Q110 140 132 106 Q110 120 80 118 Q50 120 28 106 Z" fill="'+c.light+'"/>';
  if(sp==="panda")face+='<ellipse cx="58" cy="92" rx="15" ry="18" fill="#2c2a2b" transform="rotate(-20 58 92)"/><ellipse cx="102" cy="92" rx="15" ry="18" fill="#2c2a2b" transform="rotate(20 102 92)"/>';
  const muz=sp==="pig"
    ?'<ellipse cx="80" cy="114" rx="20" ry="14" fill="'+c.inner+'"'+sw(3)+'/><ellipse cx="73" cy="114" rx="3.5" ry="5" fill="'+OL+'"/><ellipse cx="87" cy="114" rx="3.5" ry="5" fill="'+OL+'"/>'
    :'<ellipse cx="80" cy="116" rx="'+(sp==="rabbit"||sp==="cat"?16:24)+'" ry="'+(sp==="rabbit"||sp==="cat"?12:17)+'" fill="'+c.light+'"/><path d="M73 107 Q80 103 87 107 Q84 114 80 115 Q76 114 73 107 Z" fill="'+OL+'"/>';
  const eyeC=sp==="panda"?"#fff":OL;
  const eyes='<g class="ew"><g class="eyes"><ellipse cx="'+(60+px)+'" cy="92" rx="6.5" ry="8.5" fill="'+(sp==="panda"?"#2c2a2b":OL)+'"/><ellipse cx="'+(100+px)+'" cy="92" rx="6.5" ry="8.5" fill="'+(sp==="panda"?"#2c2a2b":OL)+'"/><circle cx="'+(62+px)+'" cy="89" r="2.6" fill="#fff"/><circle cx="'+(102+px)+'" cy="89" r="2.6" fill="#fff"/>'
    +(sp==="panda"?'<circle cx="'+(60+px)+'" cy="92" r="5" fill="none" stroke="'+eyeC+'" stroke-width="1.5" opacity=".5"/><circle cx="'+(100+px)+'" cy="92" r="5" fill="none" stroke="'+eyeC+'" stroke-width="1.5" opacity=".5"/>':"")+'</g></g>'
    +'<g class="eh"><path d="M'+(52+px)+' 94 Q'+(60+px)+' 82 '+(68+px)+' 94" fill="none"'+sw(4)+'/><path d="M'+(92+px)+' 94 Q'+(100+px)+' 82 '+(108+px)+' 94" fill="none"'+sw(4)+'/></g>';
  const brows=ch.glasses?'<g fill="none" stroke="'+OL+'" stroke-width="3"><circle cx="'+(60+px)+'" cy="92" r="14"/><circle cx="'+(100+px)+'" cy="92" r="14"/><path d="M'+(74+px)+' 92 L'+(86+px)+' 92"/></g>':"";
  const my=sp==="pig"?128:126;
  const mouth='<path class="m0" d="M70 '+my+' Q80 '+(my+9)+' 90 '+my+'" fill="none"'+sw(3.5)+'/>'
    +'<g class="m1"><path d="M68 '+(my-2)+' Q80 '+(my-1)+' 92 '+(my-2)+' Q90 '+(my+16)+' 80 '+(my+16)+' Q70 '+(my+16)+' 68 '+(my-2)+' Z" fill="#8e2f2f"'+sw(3)+'/><path d="M73 '+(my+10)+' Q80 '+(my+5)+' 87 '+(my+10)+' Q84 '+(my+15)+' 80 '+(my+15)+' Q76 '+(my+15)+' 73 '+(my+10)+' Z" fill="#f2828a"/></g>';
  const cheeks='<ellipse cx="44" cy="114" rx="9" ry="6" fill="#ff8f8f" opacity=".45"/><ellipse cx="116" cy="114" rx="9" ry="6" fill="#ff8f8f" opacity=".45"/>';
  const browL='<path class="brow bl" d="M'+(50+px)+' 74 Q'+(60+px)+' 68 '+(70+px)+' 74" fill="none"'+sw(3.5)+'/><path class="brow br" d="M'+(90+px)+' 74 Q'+(100+px)+' 68 '+(110+px)+' 74" fill="none"'+sw(3.5)+'/>';
  const extra='<ellipse class="m3" cx="80" cy="'+(my+5)+'" rx="7" ry="9" fill="#8e2f2f"'+sw(3)+'/><path class="m4" d="M71 '+(my+7)+' Q80 '+(my-1)+' 89 '+(my+7)+'" fill="none"'+sw(3.5)+'/>';
  const half='<ellipse class="m2" cx="80" cy="'+(my+4)+'" rx="8" ry="5.5" fill="#8e2f2f"'+sw(3)+'/>';
  const phone=ch.phone?'<g><rect x="'+(look>0?126:6)+'" y="80" width="22" height="40" rx="5" fill="#2f3137"'+sw(3)+'/><circle cx="'+(look>0?137:17)+'" cy="124" r="13" fill="'+c.fur+'"'+sw(3)+'/></g>':"";
  // arms hang from the shoulders; "af" is the arm on the side the character faces (toward the partner)
  const sleeve={bowtie:"#2f3137",vest:"#ffffff",coat:"#ffffff"}[ch.o]||ch.col||"#4a6fa5";
  const arm=(x,cls)=>'<g transform="translate('+x+' 170)"><g class="arm '+cls+'"><path d="M-12 0 L-11 50 Q0 58 11 50 L12 0 Q0 -8 -12 0 Z" fill="'+sleeve+'"'+sw(3.5)+'/>'
    +'<g transform="translate(0 60) scale(1.45)"><g class="item"></g></g>'
    +'<circle cx="0" cy="60" r="11" fill="'+c.fur+'"'+sw(3.5)+'/></g></g>';
  const arms=ch.phone?"":arm(look>=0?124:36,"af")+arm(look>=0?36:124,"ab");
  return '<g class="body"><g class="pose"><g class="breath">'+outfit(ch.o,ch.col||"#4a6fa5")
    +'<g class="hd"><g class="head">'+head+face+muz+cheeks+eyes+browL+brows+mouth+half+extra+hat(ch.hat,ch.hcol||ch.col||"#d6453d")+phone+'</g></g>'+arms+'</g></g></g>';
}
// What gets handed over when a line offers something but names no item.
const PLACE_PROP={cafe:"cup",restaurant:"menu",shop:"bag",hotel:"keycard",airport:"passport",station:"ticket",clinic:"medicine",
  bank:"cash",office:"doc",meeting:"chart",home:"photo",street:"map",park:"phone",taxi:"card"};
/* ---------- which gesture fits a line ---------- */
export function gestureFor(en,i){
  const t=en.trim(),q=/\?\s*$/.test(t);
  if(/^(hi|hello|hey|good (morning|afternoon|evening)|welcome|bye|goodbye|see you|nice to (meet|see))\b/i.test(t))return "wave";
  if(/\b(here (you go|you are|is|are|'s)|this is (your|for you)|take this|your (order|tickets?|(room )?key|receipt|change|card|passport|coffee|drink|food|bag|medicine))\b|^okay, (one|two)\b/i.test(t))return "give";
  if(/\b(thank|thanks|appreciate)\b/i.test(t))return "bow";
  if(/^(sorry|i'?m (so |really )?sorry|excuse me|i apologi[sz]e|pardon)/i.test(t))return "bow";
  if(/^(no\b|nope|not really|i don'?t|i can'?t|unfortunately|actually,? no)/i.test(t))return "no";
  if(/^(yes|yeah|yep|sure|of course|okay|ok|great|perfect|sounds (good|great)|absolutely|definitely|exactly|right)\b/i.test(t))return "yes";
  if(/\b(over there|this way|that way|turn (left|right)|go straight|on the (left|right)|next to|across from|this one|that one|look at)\b/i.test(t))return "point";
  if(/^(i think|i guess|maybe|perhaps|probably|i'?m not sure|hmm|well,|let me (think|see)|it depends)/i.test(t))return "think";
  if(/!/.test(t)&&!q)return "cheer";
  if(q)return i%2?"tilt":"ask";
  return i%2?"open":"explain";
}

/* ---------- places (400 x 300) ---------- */
const win=(x,y,w,h,sky)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="6" fill="'+(sky||"#bfe3f5")+'"'+sw(3)+'/><path d="M'+(x+w/2)+' '+y+' V'+(y+h)+' M'+x+' '+(y+h/2)+' H'+(x+w)+'"'+sw(3)+'/><g class="cloud"><ellipse cx="'+(x+w*0.3)+'" cy="'+(y+h*0.3)+'" rx="12" ry="6" fill="#fff" opacity=".9"/></g>';
const plant=(x,y)=>'<rect x="'+(x-12)+'" y="'+(y-22)+'" width="24" height="22" rx="4" fill="#d9884a"'+sw(3)+'/><path d="M'+x+' '+(y-22)+' Q'+(x-20)+' '+(y-50)+' '+(x-6)+' '+(y-58)+' Q'+(x+2)+' '+(y-40)+' '+x+' '+(y-22)+' Q'+(x+18)+' '+(y-54)+' '+(x+10)+' '+(y-60)+' Q'+(x-2)+' '+(y-44)+' '+x+' '+(y-22)+'" fill="#5fae6e"'+sw(3)+'/>';
const lamp=(x)=>'<path d="M'+x+' 0 V26"'+sw(3)+'/><path d="M'+(x-18)+' 44 Q'+x+' 18 '+(x+18)+' 44 Z" fill="#f2c94c"'+sw(3)+'/><ellipse class="glow" cx="'+x+'" cy="52" rx="26" ry="8" fill="#fff3b0" opacity=".5"/>';
const steam=(x,y)=>'<g class="steam"><path d="M'+x+' '+y+' q-6 -8 0 -16 q6 -8 0 -16" fill="none" stroke="#fff" stroke-width="3" opacity=".8" stroke-linecap="round"/></g>';
const counter=(top,col,front)=>'<rect x="-10" y="'+top+'" width="420" height="'+(310-top)+'" fill="'+col+'"'+sw()+'/><rect x="-10" y="'+top+'" width="420" height="12" fill="'+(front||"#f6e7d2")+'"'+sw()+'/>';
const PLACES={
  cafe:{wall:"#f5dfc0",floor:"#c98f5a",back:()=>'<rect x="20" y="40" width="150" height="70" rx="8" fill="#3d3a36"'+sw(3)+'/><text x="95" y="62" fill="#fff" font-size="13" text-anchor="middle" font-family="sans-serif" font-weight="700">MENU</text><path d="M40 76 H150 M40 90 H130 M40 100 H140" stroke="#cfc6b8" stroke-width="3"/>'+win(250,36,120,90)+lamp(200)+'<rect x="196" y="150" width="60" height="40" rx="6" fill="#8a8f98"'+sw(3)+'/><rect x="206" y="140" width="14" height="14" rx="3" fill="#fff"'+sw(2)+'/>',
    front:()=>counter(236,"#8b5a3c")+'<path d="M300 236 h22 v-22 h-22 z" fill="#fff"'+sw(3)+'/>'+steam(311,210)},
  restaurant:{wall:"#f3e1c7",floor:"#a8744c",back:()=>win(30,40,110,90,"#f8c98a")+win(260,40,110,90,"#f8c98a")+lamp(200)+'<rect x="170" y="70" width="60" height="44" rx="4" fill="#fff"'+sw(3)+'/><path d="M180 84 H220 M180 96 H210" stroke="#d6453d" stroke-width="3"/>',
    front:()=>'<rect x="-10" y="244" width="420" height="70" fill="#fffaf2"'+sw()+'/><path d="M-10 262 H410" stroke="#d6453d" stroke-width="4" stroke-dasharray="16 12"/><ellipse cx="200" cy="246" rx="30" ry="8" fill="#fff"'+sw(3)+'/><path d="M184 240 Q200 226 216 240" fill="#f2a65a"'+sw(2)+'/>'+steam(200,226)},
  shop:{wall:"#e9ecf6",floor:"#b8a58f",back:()=>'<path d="M20 60 H180 M220 60 H380"'+sw(3)+'/><g>'+["#d6453d","#2f6bff","#f2c94c","#5fae6e"].map((c,i)=>'<path d="M'+(36+i*36)+' 60 l-12 14 v40 h28 v-40 z" fill="'+c+'"'+sw(3)+'/>').join("")+["#9b59b6","#f2a65a","#2f3137","#d6453d"].map((c,i)=>'<path d="M'+(236+i*36)+' 60 l-12 14 v40 h28 v-40 z" fill="'+c+'"'+sw(3)+'/>').join("")+'</g><rect x="20" y="140" width="360" height="12" fill="#fff"'+sw(3)+'/>',
    front:()=>counter(240,"#d9c7a6")+'<rect x="290" y="216" width="50" height="24" rx="4" fill="#8a8f98"'+sw(3)+'/>'},
  hotel:{wall:"#e8e0d0",floor:"#8f6b4e",back:()=>'<rect x="140" y="30" width="120" height="40" rx="6" fill="#2f3137"'+sw(3)+'/><text x="200" y="56" fill="#f2c94c" font-size="15" text-anchor="middle" font-family="serif" font-weight="700">HOTEL</text><g fill="#c7a46a"'+sw(2)+'>'+[0,1,2,3].map(i=>'<rect x="'+(30+i*22)+'" y="90" width="16" height="22" rx="2"/>').join("")+'</g>'+plant(350,170)+lamp(320),
    front:()=>counter(236,"#5b3b2a","#c7a46a")+'<path d="M90 236 q14 -22 28 0" fill="#f2c94c"'+sw(3)+'/><circle cx="104" cy="216" r="3" fill="'+OL+'"/>'},
  airport:{wall:"#dfeaf3",floor:"#9aa7b4",back:()=>win(20,30,360,100,"#a8d8f0")+'<g class="plane"><path d="M60 70 l60 -6 l20 -14 l8 2 l-10 14 l30 -2 l8 -8 l6 2 l-4 10 l-112 12 z" fill="#fff"'+sw(2)+'/></g><rect x="150" y="140" width="100" height="26" rx="4" fill="#2f3137"'+sw(3)+'/><text x="200" y="158" fill="#7fe07f" font-size="11" text-anchor="middle" font-family="monospace">GATE 12  ON TIME</text>',
    front:()=>counter(236,"#5e6b7a","#c9d3dc")},
  station:{wall:"#e7e3d9",floor:"#9c948a",back:()=>'<rect x="40" y="34" width="320" height="34" rx="4" fill="#2f3137"'+sw(3)+'/><text x="200" y="57" fill="#f2c94c" font-size="13" text-anchor="middle" font-family="monospace">SEOUL 10:30   BUSAN 11:05</text><rect x="30" y="90" width="340" height="56" rx="10" fill="#d6453d"'+sw(3)+'/>'+[0,1,2,3,4].map(i=>'<rect x="'+(48+i*66)+'" y="100" width="44" height="26" rx="4" fill="#bfe3f5"'+sw(2)+'/>').join(""),
    front:()=>counter(240,"#6d7b88","#c9d3dc")+'<rect x="150" y="190" width="100" height="50" rx="6" fill="#bfe3f5" opacity=".55"'+sw(3)+'/>'},
  clinic:{wall:"#e6f2ee",floor:"#a7b8b2",back:()=>'<rect x="30" y="40" width="70" height="70" rx="8" fill="#fff"'+sw(3)+'/><path d="M65 56 V94 M46 75 H84" stroke="#3fae6e" stroke-width="12" stroke-linecap="round"/><g>'+[0,1,2].map(r=>'<path d="M250 '+(50+r*34)+' H370"'+sw(3)+'/>'+[0,1,2,3].map(i=>'<rect x="'+(256+i*28)+'" y="'+(30+r*34)+'" width="18" height="20" rx="3" fill="'+["#f2c94c","#fff","#5b8cff","#f7b9c4"][(i+r)%4]+'"'+sw(2)+'/>').join("")).join("")+'</g>',
    front:()=>counter(240,"#fff","#bfe0d4")+'<path d="M180 262 h40 M200 252 v20" stroke="#3fae6e" stroke-width="7" stroke-linecap="round"/>'},
  office:{wall:"#eef0f4",floor:"#8d97a6",back:()=>win(250,34,120,96)+'<rect x="30" y="50" width="80" height="60" rx="4" fill="#fff"'+sw(3)+'/><path d="M40 98 L58 80 L74 90 L100 62" fill="none" stroke="#2f6bff" stroke-width="4"/>'+plant(180,140)+'<circle cx="200" cy="40" r="16" fill="#fff"'+sw(3)+'/><path d="M200 32 V40 L206 44"'+sw(2)+'/>',
    front:()=>'<rect x="-10" y="244" width="420" height="70" fill="#d9c7a6"'+sw()+'/><rect x="60" y="214" width="56" height="34" rx="4" fill="#2f3137"'+sw(3)+'/><rect x="284" y="226" width="20" height="18" rx="3" fill="#fff"'+sw(3)+'/>'+steam(294,222)},
  meeting:{wall:"#e9ecf2",floor:"#7d8796",back:()=>'<rect x="110" y="30" width="180" height="104" rx="6" fill="#fff"'+sw(3)+'/><g class="bars">'+[40,64,52,82].map((h,i)=>'<rect x="'+(136+i*34)+'" y="'+(120-h)+'" width="22" height="'+h+'" rx="2" fill="'+(i===3?"#2f6bff":"#9fb4d6")+'"/>').join("")+'</g><path d="M130 120 H272"'+sw(2)+'/>'+plant(40,150)+plant(360,150),
    front:()=>'<path d="M-10 250 Q200 226 410 250 V310 H-10 Z" fill="#6b4a36"'+sw()+'/><rect x="186" y="232" width="28" height="16" rx="2" fill="#fff"'+sw(2)+'/>'},
  home:{wall:"#f6e6d6",floor:"#c49a6c",back:()=>win(40,40,110,90)+'<rect x="250" y="44" width="70" height="56" rx="4" fill="#fff"'+sw(3)+'/><circle cx="270" cy="66" r="9" fill="#f2c94c"/><path d="M256 92 L280 72 L300 88 L314 78" fill="none" stroke="#5fae6e" stroke-width="4"/>'+plant(360,170)+lamp(200),
    front:()=>'<path d="M-10 236 Q30 214 80 222 L320 222 Q370 214 410 236 V310 H-10 Z" fill="#e07a5f"'+sw()+'/><path d="M-10 250 H410" stroke="#c4644b" stroke-width="5"/>'},
  street:{sky:"#9fd6f2",wall:"#9fd6f2",floor:"#b5b0a6",back:()=>'<g class="cloud"><ellipse cx="80" cy="40" rx="30" ry="12" fill="#fff"/><ellipse cx="300" cy="30" rx="24" ry="10" fill="#fff"/></g>'+[["#f2a65a",20,70],["#e9ecf6",110,40],["#f7b9c4",210,80],["#c7e3c0",300,50]].map(b=>'<rect x="'+b[1]+'" y="'+b[2]+'" width="86" height="'+(200-b[2])+'" fill="'+b[0]+'"'+sw(3)+'/>'+[0,1].map(r=>'<rect x="'+(b[1]+14)+'" y="'+(b[2]+16+r*34)+'" width="22" height="20" fill="#bfe3f5"'+sw(2)+'/><rect x="'+(b[1]+50)+'" y="'+(b[2]+16+r*34)+'" width="22" height="20" fill="#bfe3f5"'+sw(2)+'/>').join("")).join("")+'<rect x="352" y="120" width="8" height="90" fill="#5e6b7a"'+sw(2)+'/><rect x="336" y="100" width="40" height="24" rx="4" fill="#3fae6e"'+sw(2)+'/><path d="M346 112 h18 m-6 -5 l6 5 l-6 5" stroke="#fff" stroke-width="3" fill="none"/>',
    front:()=>'<rect x="-10" y="250" width="420" height="60" fill="#8d8a84"'+sw()+'/><path d="M10 278 H60 M110 278 H160 M210 278 H260 M310 278 H360" stroke="#fff" stroke-width="5"/>'},
  park:{sky:"#a7dcf5",wall:"#a7dcf5",floor:"#8fca7a",back:()=>'<circle class="sun" cx="340" cy="44" r="22" fill="#ffd84a"'+sw(3)+'/><g class="cloud"><ellipse cx="90" cy="46" rx="34" ry="13" fill="#fff"/><ellipse cx="210" cy="30" rx="22" ry="9" fill="#fff"/></g><path d="M-10 170 Q100 120 200 160 Q300 120 410 170 V210 H-10 Z" fill="#7cbf6a"'+sw(3)+'/>'+[[50,150],[360,150]].map(t=>'<rect x="'+(t[0]-7)+'" y="'+(t[1])+'" width="14" height="50" fill="#9a6b45"'+sw(3)+'/><circle cx="'+t[0]+'" cy="'+(t[1]-14)+'" r="34" fill="#4f9a5c"'+sw(3)+'/>').join(""),
    front:()=>'<path d="M-10 252 Q200 238 410 252 V310 H-10 Z" fill="#6fb35e"'+sw()+'/><g fill="#fff">'+[30,120,250,330].map(x=>'<circle cx="'+x+'" cy="276" r="4"/><circle cx="'+(x+8)+'" cy="272" r="4"/>').join("")+'</g>'},
  taxi:{sky:"#9fd6f2",wall:"#9fd6f2",floor:"#555",back:()=>'<g class="road">'+[0,1,2,3].map(i=>'<rect x="'+(i*110)+'" y="60" width="70" height="140" fill="'+["#f2a65a","#e9ecf6","#f7b9c4","#c7e3c0"][i]+'"'+sw(3)+'/>').join("")+'</g>',
    front:()=>'<path d="M-10 120 Q200 96 410 120 L410 136 Q200 112 -10 136 Z" fill="#f2c94c"'+sw()+'/><rect x="-10" y="232" width="420" height="80" fill="#f2c94c"'+sw()+'/><rect x="196" y="120" width="8" height="112" fill="#f2c94c"'+sw(3)+'/><circle cx="96" cy="262" r="26" fill="none" stroke="#3b2a21" stroke-width="8"/><rect x="300" y="244" width="60" height="22" rx="4" fill="#2f3137"/><text x="330" y="260" fill="#7fe07f" font-size="13" text-anchor="middle" font-family="monospace">12,800</text>'},
  bank:{wall:"#ecebe4",floor:"#9c948a",back:()=>'<path d="M120 80 L200 36 L280 80 Z" fill="#fff"'+sw(3)+'/><rect x="132" y="80" width="136" height="12" fill="#fff"'+sw(3)+'/>'+[0,1,2,3].map(i=>'<rect x="'+(142+i*32)+'" y="92" width="12" height="50" fill="#fff"'+sw(2)+'/>').join("")+'<rect x="20" y="40" width="80" height="50" rx="4" fill="#2f3137"'+sw(3)+'/><text x="60" y="62" fill="#7fe07f" font-size="11" text-anchor="middle" font-family="monospace">USD 1,385</text><text x="60" y="78" fill="#7fe07f" font-size="11" text-anchor="middle" font-family="monospace">JPY 9.21</text>',
    front:()=>counter(240,"#7a6a58","#d9cbb3")+'<rect x="150" y="190" width="100" height="50" rx="6" fill="#bfe3f5" opacity=".5"'+sw(3)+'/>'}
};

/* ---------- which place and partner fits a lesson ---------- */
const RULES=[
  ["taxi",/택시|taxi/i],["airport",/공항|기내|입국|airport|airline|passport|flight/i],
  ["clinic",/약국|병원|진료|검진|pharmac|clinic|doctor/i],["hotel",/호텔|숙소|체크인|hotel/i],
  ["bank",/은행|환전|우체국|bank|post office/i],
  ["station",/기차|매표소|지하철|승강장|유실물|ticket|train|subway|station/i],
  ["cafe",/카페|café|cafe|coffee|barista/i],
  ["restaurant",/식사|점심 자리|식당|맛집|레스토랑|음식|주문|푸드코트|restaurant|waiter|server|menu/i],
  ["shop",/가게|매장|마트|시장|쇼핑|옷|shop|store|clerk|cashier/i],
  ["cafe",/모임|파티|party|meetup/i],
  ["meeting",/회의|발표|면접|임원|브리핑|회고|실적|경영진|협상|meeting|interview|present/i],
  ["office",/회사|동료|사무실|탕비실|직장|팀장|신입|팀원|업무|퇴근|coworker|colleague|office|manager/i],
  ["home",/집|부동산|요리|가족|방|가구|home|house|kitchen|room/i],
  ["street",/길|거리|동네|관광|안내|역에서|street|tourist|direction/i],
  ["park",/./]
];
// Each partner costume: [species, outfit, colour, hat, Korean label]
const CAST={
  cafe:["cat","apron","#3fae6e","beret","바리스타"],restaurant:["dog","bowtie","#2f3137","","직원"],
  shop:["rabbit","apron","#d6453d","","점원"],hotel:["fox","vest","#7a2e3a","","호텔 직원"],
  airport:["panda","vest","#2f5aa8","cap","직원"],station:["dog","vest","#2f5aa8","cap","역무원"],
  clinic:["rabbit","coat","#ffffff","","약사"],taxi:["dog","shirt","#5b8cff","cap","기사님"],
  bank:["fox","tie","#4a6fa5","","직원"],office:["panda","tie","#9fb4d6","","동료"],
  meeting:["fox","tie","#4a6fa5","","동료"],home:["rabbit","hoodie","#f2a65a","","친구"],
  street:["cat","hoodie","#9b59b6","","행인"],park:["rabbit","hoodie","#f2a65a","","친구"]
};
const SERVICE=/hotel|airport|station|clinic|bank|cafe|restaurant|shop|taxi/;
export const ME={sp:"bear",o:"hoodie",col:"#2f6bff"};
// Natural voices (recorded in advance into app/audio): the learner is always the same voice,
// the partner's voice follows their name, or is picked per lesson.
export const ME_VOICE="en-US-AndrewNeural";
const FEMALE=/^(Anna|Maria|Jenny|Sarah|Emma|Lisa|Kate|Amy|Mia|Sophie|Sophia|Emily|Grace|Julia|Rachel|Hannah|Olivia|Lucy|Linda|Susan|Karen|Jessica|Laura|Nina|Sara|Ellen|Amanda|Claire|Jane|Mary|Helen|Yuna|Jisoo|Sujin|Minji)$/;
const MALE=/^(Tom|Dan|Daniel|Marcus|Mike|Michael|John|James|David|Chris|Ben|Sam|Jack|Mark|Paul|Peter|Kevin|Brian|Ryan|Alex|Eric|Steve|Jason|Minsu|Jun|Hyun|Leo|Max|Nick|Tony|Ken|Joe|Matt)$/;
const FEM_V=["en-US-AvaNeural","en-US-EmmaNeural","en-US-JennyNeural","en-US-AriaNeural","en-GB-SoniaNeural","en-US-MichelleNeural"];
const MALE_V=["en-US-BrianNeural","en-US-ChristopherNeural","en-US-EricNeural","en-US-GuyNeural","en-GB-RyanNeural","en-US-RogerNeural"];
export function voiceOf(l){
  const sc=sceneFor(l),h=hashOf(l.id+"v"),n=sc.label;
  if(FEMALE.test(n))return FEM_V[h%FEM_V.length];
  if(MALE.test(n))return MALE_V[h%MALE_V.length];
  return h%2?FEM_V[(h>>2)%FEM_V.length]:MALE_V[(h>>2)%MALE_V.length];
}
// File name of a recorded line: a short hash of voice + text.
export function audioKey(voice,text){
  let h=2166136261;const s=voice+"|"+text;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  return h.toString(36);
}
const LBL=[[/interviewer|hiring manager/i,"면접관"],[/team member|junior|new hire/i,"팀원"],[/\bclients?\b|vendor|supplier|partner company/i,"거래처"],
  [/customer (support|service)|support agent|representative|operator/i,"상담원"],[/real estate|realtor/i,"중개인"],[/building manager|landlord/i,"관리인"],
  [/pharmacist/i,"약사"],[/doctor/i,"의사"],[/receptionist/i,"직원"],[/driver/i,"기사님"],[/\bfriends?\b/i,"친구"],[/neighbou?r/i,"이웃"],
  [/co-?worker|colleague/i,"동료"]];
const BOSS=/director|executive|vice president|head of|boss|team lead|your manager|department head/i;
const hashOf=id=>[...id].reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,7);
export function sceneFor(l){
  const role=(l.role||"").split(/\.\s/)[0],where=l.title+" "+l.sub,txt=[where,l.topicKo,role].join(" "),h=hashOf(l.id);
  const phone=/전화|통화|phone|call(?:ing|ed|s)?\b/i.test(where+" "+(l.topicKo||""));
  let place=(RULES.find(r=>r[1].test(where))||RULES.find(r=>r[1].test(txt)))[0];
  if(place==="park"&&/^[eftu]/.test(l.id))place="office";           // business levels default to the office
  else if(place==="park"&&!/날씨|공원|산책|야구|주말|연휴|여행|weather|park/i.test(txt))place=["park","cafe","home"][h%3];
  if(phone&&!SERVICE.test(place))place="office";
  if(/친구/.test(l.sub)&&/clinic|hotel|bank|station|airport/.test(place)&&!phone)place="cafe";
  const c=CAST[place]||CAST.park;
  const staff=/clerk|staff|worker|agent|officer|barista|waiter|waitress|server\b|driver|pharmacist|doctor|nurse|receptionist|teller|attendant|cashier|sales|host\b|guide|operator|representative|employee|landlord|realtor/i.test(role);
  const friendSub=/친구/.test(l.sub),mateSub=/동료|팀장|팀원|회사|사무실/.test(l.sub);
  const casual=friendSub||(!staff&&!mateSub&&/\bfriends?\b|neighbou?r|stranger|passenger|person|tourist|traveler|traveller|classmate|someone|local\b|guest/i.test(role));
  const m=role.match(/You are ([A-Z][a-z]+)\b/)||role.match(/\bnamed ([A-Z][a-z]+)/);
  let label;
  if(m&&!/^(A|An|The)$/.test(m[1]))label=m[1];
  else if(friendSub)label="친구";
  else if(/팀원/.test(l.sub))label="팀원";
  else if(/office|meeting/.test(place)&&BOSS.test(role)&&!/team member/i.test(role))label="상사";
  else{const x=LBL.find(r=>r[0].test(role));label=x?x[1]:casual?(place==="street"?"행인":"상대방"):mateSub?"동료":c[4];}
  const work=/office|meeting/.test(place)&&!casual;
  const sp=casual?["rabbit","cat","pig","dog","panda","fox"][h%6]:work?["panda","fox","dog","cat","rabbit"][h%5]:c[0];
  const them={sp,o:casual?"hoodie":c[1],col:casual?["#f2a65a","#9b59b6","#3fae6e","#d6453d","#e0a800"][(h>>3)%5]:work?["#9fb4d6","#4a6fa5","#c9b79c","#8fb8a8"][(h>>3)%4]:c[2],
    hat:casual?"":c[3],glasses:/^[eftu]/.test(l.id)&&!casual&&h%2===0};
  if(label==="상담원"){them.hat="headset";them.o="shirt";}
  if(/중개인|관리인|거래처|면접관/.test(label)){them.o="tie";them.hat="";}
  return {place,phone,them,label};
}

/* ---------- the stage ---------- */
// A thought bubble above a character's head; the thing they talk about appears inside it.
const bubble=(who,x,y)=>'<g class="bub b-'+who+'" transform="translate('+x+' '+y+')"><g class="bin"><circle cx="0" cy="34" r="30" fill="#fff"'+sw(3)+'/>'
  +'<circle cx="'+(who==="them"?-30:30)+'" cy="66" r="6" fill="#fff"'+sw(2.5)+'/><circle cx="'+(who==="them"?-40:40)+'" cy="78" r="3.5" fill="#fff"'+sw(2)+'/>'
  +'<g transform="translate(0 50) scale(1.15)"><g class="bslot"></g></g></g></g>';
function stage(sc){
  const P=PLACES[sc.place]||PLACES.park;
  const them=Object.assign({look:1,phone:sc.phone},sc.them),me=Object.assign({look:-1,phone:sc.phone},ME);
  if(sc.phone){
    const half=(pl,ch,side,x)=>{const Q=PLACES[pl];return '<svg viewBox="100 0 200 300" class="half" preserveAspectRatio="xMidYMid slice"><rect width="400" height="300" fill="'+Q.wall+'"/>'+Q.back()+'<rect y="214" width="400" height="90" fill="'+Q.floor+'"/><g class="chr c-'+side+'" style="--s:'+(side==="them"?1:-1)+'" transform="translate('+x+' 70) scale(1.0)">'+charSvg(ch)+'</g>'+Q.front()+bubble(side,side==="them"?240:160,40)+'</svg>';};
    return '<div class="stage phone">'+half(sc.place==="park"||sc.place==="street"?"home":sc.place,them,"them",120)+'<span class="ring" aria-hidden="true">📞</span>'+half("home",me,"me",120)+'</div>';
  }
  return '<div class="stage"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><g class="cam">'
    +'<rect width="400" height="300" fill="'+P.wall+'"/>'+P.back()+'<rect y="214" width="400" height="90" fill="'+P.floor+'"/>'
    +'<g class="chr c-them" style="--s:1" transform="translate(24 24)">'+charSvg(them)+'</g>'
    +'<g class="chr c-me" style="--s:-1" transform="translate(216 24)">'+charSvg(me)+'</g>'
    +'<g transform="translate(0 22)">'+P.front()+'</g>'+bubble("them",186,40)+bubble("me",214,40)+'</g></svg></div>';
}
// Lessons whose illustrated pictures exist (app/scenes/<lesson>_<line>.webp); filled from scenes.json.
export const PICS=new Set(),VIDS=new Set();
export async function loadPics(){
  try{(await (await fetch("scenes.json")).json()).forEach(id=>PICS.add(id));}catch(e){}
  try{(await (await fetch("clips.json")).json()).forEach(id=>VIDS.add(id));}catch(e){}
}
export function sceneHtml(l){
  const sc=sceneFor(l);
  return '<div class="scn" data-place="'+sc.place+'">'
    +'<div class="scn-top"><p class="scn-k">이럴 때 써요</p><p class="scn-t">'+esc(l.sub)+'</p></div>'
    +'<div class="stw">'+(VIDS.has(l.id)?'<div class="stage pics vids"><video class="pic on" muted playsinline preload="auto" poster="scenes/'+l.id+'_0.webp" src="clips/'+l.id+'_0.webm"></video><video class="pic" muted playsinline preload="auto"></video></div>'
     :PICS.has(l.id)?'<div class="stage pics"><img class="pic on" alt="" src="scenes/'+l.id+'_0.webp"><img class="pic" alt=""></div>':stage(sc))
    +'<span class="tag t-a">'+esc(sc.label)+'</span><span class="tag t-b">나</span></div>'
    +'<div class="scn-sub" aria-live="polite"><p class="scn-key" hidden>⭐ 오늘 배울 문장</p><p class="scn-en" lang="en">&nbsp;</p><p class="scn-ko">&nbsp;</p></div>'
    +'<ol class="scn-dots" aria-hidden="true"></ol></div>';
}
// The lines to play: partner lines and the learner's lesson sentences, in order.
export function sceneLines(l){
  const out=[];
  l.talk.forEach(t=>{
    if(t.them)out.push({who:"them",en:t.them,ko:t.ko});
    const p=l.ph[t.you];if(p)out.push({who:"me",en:p.en,ko:p.ko,key:true});
  });
  return out;
}
// Puts one line on stage: subtitle-independent pose, face, item in hand or thought bubble. Returns the action.
const KB=["kb1","kb2","kb3","kb4"];
function showClip(root,l,i){
  const vs=root.querySelectorAll("video.pic");
  const cur=root.querySelector("video.pic.on");
  let nx=cur;
  if(!(i===0&&cur&&(cur.getAttribute("src")||"").endsWith("_0.webm"))){
    nx=cur===vs[0]?vs[1]:vs[0];
    nx.poster="scenes/"+l.id+"_"+i+".webp";nx.src="clips/"+l.id+"_"+i+".webm";
  }
  return new Promise(res=>{
    let done=false;const go=()=>{if(done)return;done=true;
      nx.classList.add("on");if(cur&&cur!==nx){cur.classList.remove("on");setTimeout(()=>cur.pause(),700);}
      res();};
    try{nx.currentTime=0;}catch(e){}
    const p=nx.play();if(p&&p.catch)p.catch(()=>{});
    if(nx.readyState>=2)go();else{nx.onloadeddata=go;nx.onerror=go;setTimeout(go,1500);}
  });
}
function showPic(root,l,i){
  if(root.querySelector("video.pic"))return showClip(root,l,i);
  const imgs=root.querySelectorAll(".pic");if(!imgs.length)return Promise.resolve();
  const cur=root.querySelector(".pic.on"),nx=cur===imgs[0]?imgs[1]:imgs[0];
  if(i===0&&cur&&cur.getAttribute("src").endsWith("_0.webp")){cur.className="pic on "+KB[0];return Promise.resolve();}
  return new Promise(res=>{
    const done=()=>{nx.className="pic on "+KB[i%4];if(cur&&cur!==nx)cur.classList.remove("on");res();};
    nx.onload=done;nx.onerror=done;nx.src="scenes/"+l.id+"_"+i+".webp";
    setTimeout(res,2500);
  });
}
export function setLine(root,x,i){
  const scn=root.querySelector(".scn"),chr=w=>root.querySelectorAll(".chr.c-"+w);
  if(!root.querySelector(".chr"))return "";
  const pl=planLine(x.en,gestureFor(x.en,i)),g=pl.act,other=x.who==="me"?"them":"me";
  root.querySelectorAll(".chr").forEach(c=>{c.className.baseVal=c.className.baseVal.split(" ").filter(k=>!/^(g|f)-/.test(k)).join(" ");c.querySelectorAll(".item").forEach(e=>e.innerHTML="");});
  root.querySelectorAll(".bub").forEach(b=>b.classList.remove("on"));
  const item=pl.hand?(pl.prop||PLACE_PROP[scn.dataset.place]||""):g==="give"?PLACE_PROP[scn.dataset.place]||"":"";
  chr(x.who).forEach(c=>{
    c.classList.add("talk","g-"+g);if(pl.face)c.classList.add("f-"+pl.face);
    const slot=c.querySelector((g==="phone"?".ab":".af")+" .item");if(slot&&item)slot.innerHTML=PROPS[item]||"";
  });
  if(pl.prop&&!pl.hand){const b=root.querySelector(".b-"+x.who+" .bslot");if(b){b.innerHTML=PROPS[pl.prop]||"";b.closest(".bub").classList.add("on");}}
  chr(other).forEach(c=>{c.classList.add(g==="give"||g==="shake"?"g-take":"nod");if(pl.face==="happy")c.classList.add("f-happy");});
  return g;
}
// Plays the scene inside `root`. `speak(text)` resolves when the line has been said.
// `alive()` returns false once the screen is gone, which stops the loop.
export async function playScene(root,l,speak,alive,preload){
  preload=preload||(()=>{});
  const lines=sceneLines(l),wait=ms=>new Promise(r=>setTimeout(r,ms));
  const en=root.querySelector(".scn-en"),ko=root.querySelector(".scn-ko"),key=root.querySelector(".scn-key"),dots=root.querySelector(".scn-dots");
  const scn=root.querySelector(".scn"),chr=w=>root.querySelectorAll(".chr.c-"+w);
  dots.innerHTML=lines.map(()=>"<li></li>").join("");
  scn.classList.remove("live","f-them","f-me");void scn.offsetWidth;scn.classList.add("live");
  en.innerHTML="&nbsp;";ko.innerHTML="&nbsp;";key.hidden=true;
  await wait(900);
  for(let i=0;i<lines.length;i++){
    if(!alive())return false;
    const x=lines[i];
    scn.classList.toggle("f-them",x.who==="them");scn.classList.toggle("f-me",x.who==="me");
    dots.children[i].className="on";
    en.textContent=x.en;ko.textContent=x.ko;key.hidden=!x.key;
    en.classList.remove("pop");void en.offsetWidth;en.classList.add("pop");
    if(root.querySelector(".pics")){await showPic(root,l,i);if(lines[i+1]){if(VIDS.has(l.id))fetch("clips/"+l.id+"_"+(i+1)+".webm").catch(()=>{});else{const im=new Image();im.src="scenes/"+l.id+"_"+(i+1)+".webp";}}}
    const g=setLine(root,x,i);
    const t0=Date.now();
    if(lines[i+1])preload(lines[i+1].en,lines[i+1].who);
    await speak(x.en,x.who);
    const min=900+x.en.length*45;           // silent devices: still give time to read
    if(Date.now()-t0<min)await wait(min-(Date.now()-t0));
    root.querySelectorAll(".chr").forEach(c=>c.classList.remove("talk","nod"));
    setTimeout(()=>{root.querySelectorAll(".chr").forEach(c=>c.classList.remove("g-"+g,"g-take"));root.querySelectorAll(".bub").forEach(b=>b.classList.remove("on"));},x.key?900:450);
    await wait(x.key?1100:650);
  }
  if(!alive())return false;
  scn.classList.remove("f-them","f-me");
  return true;
}
