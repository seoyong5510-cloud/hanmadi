// Matching what the learner said against one or more acceptable sentences.
// Works on the speech-recognition transcript only: it checks words, not pronunciation.
const FIX={"i'm":"i am","im":"i am","i'll":"i will","it's":"it is","its":"it is","don't":"do not","dont":"do not","how's":"how is",
  "1":"one","2":"two","3":"three","4":"four","5":"five","ok":"okay","thankyou":"thank you","thanks":"thank you",
  "ive":"i have","lets":"let us","thats":"that is","doesnt":"does not","didnt":"did not","wont":"will not","cant":"can not","id":"i would","ill":"i will","whats":"what is","isnt":"is not","youre":"you are","checkout":"check out","wi-fi":"wifi","restroom":"rest room","okey":"okay"};
const CONTR={"won't":"will not","can't":"can not","let's":"let us","cannot":"can not","gonna":"going to","wanna":"want to","gotta":"got to"};
function toks(w){
  w=w.toLowerCase().replace(/[’‘`]/g,"'").replace(/[^a-z0-9'-]/g,"").replace(/^[-']+|[-']+$/g,"");
  if(!w)return [];
  if(FIX[w])return FIX[w].split(" ");
  if(CONTR[w])return CONTR[w].split(" ");
  let m;
  if((m=w.match(/^(.+)n't$/)))return [m[1],"not"];
  if((m=w.match(/^(.+)'(m|re|ll|ve|d)$/)))return [m[1],{m:"am",re:"are",ll:"will",ve:"have",d:"would"}[m[2]]];
  if((m=w.match(/^(it|that|what|how|there|here|he|she|where|who|when)'s$/)))return [m[1],"is"];
  w=w.replace(/['-]/g,"");
  return (FIX[w]||w).split(" ");
}

export {toks};
export function grade(target,said){
  const ow=target.split(/\s+/).filter(Boolean),t=[],owner=[];
  ow.forEach((w,i)=>toks(w).forEach(k=>{t.push(k);owner.push(i);}));
  const s=said.split(/\s+/).flatMap(toks);
  const m=t.length,n=s.length,dp=[];
  for(let i=0;i<=m;i++)dp.push(new Array(n+1).fill(0));
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)
    dp[i][j]=t[i-1]===s[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
  const hit=new Array(m).fill(false);
  let i=m,j=n;
  while(i>0&&j>0){
    if(t[i-1]===s[j-1]){hit[i-1]=true;i--;j--;}
    else if(dp[i-1][j]>=dp[i][j-1])i--;else j--;
  }
  const words=ow.map((w,idx)=>({text:w,hit:owner.every((o,k)=>o!==idx||hit[k])}));
  let score=m?dp[m][n]/m:0;
  // A missing or added "not" flips the meaning, so it can never pass.
  if(t.includes("not")!==s.includes("not"))score=Math.min(score,0.5);
  return {score,words,said:n,need:m};
}
const expandS=x=>x.replace(/(\w)['’]s\b/g,"$1 is");
// Best match over every acceptable target and every recognition alternative.
export function gradeBest(targets,saids){
  let best=null;
  for(const tg of targets){
    for(const sd of saids){
      for(const [a,b] of [[tg,sd],[expandS(tg),sd],[tg,expandS(sd)]]){
        const g=grade(a,b);
        // Higher score wins; on a tie, the target closest in length to what was said.
        const extra=Math.abs(g.said-g.need);
        if(!best||g.score>best.score+1e-9||(Math.abs(g.score-best.score)<1e-9&&extra<best.extra))best=Object.assign(g,{target:tg,heard:sd,extra});
      }
    }
  }
  return best;
}
// Free production: the fixed part of a frame must be there, plus at least one more word.
export function gradeFrame(frame,saids){
  const g=gradeBest([frame.replace("___"," ")],saids);
  return Object.assign(g,{ok:g.score>=0.8&&g.said-g.need>=1});
}
export const TIPS=[
 [/th/,"th","혀끝을 윗니 아래에 살짝 물고 바람을 내요."],
 [/f|ph/,"f","윗니를 아랫입술에 살짝 대고 바람 소리를 내요. 입술을 붙이는 'ㅍ'가 아니에요."],
 [/v/,"v","f와 같은 입 모양에서 목을 울려요. 'ㅂ'가 아니에요."],
 [/r/,"r","혀끝이 입천장에 닿지 않게 뒤로 살짝 말아요."],
 [/l/,"l","혀끝을 윗니 바로 뒤에 꾹 대요."]
];
export function tipsFor(words,max){
  const out=[];
  TIPS.forEach(t=>{
    if(out.length>=max)return;
    const w=words.map(x=>x.toLowerCase().replace(/[^a-z'-]/g,"")).find(x=>t[0].test(x));
    if(w)out.push({k:t[1],w:w,t:t[2]});
  });
  return out;
}
