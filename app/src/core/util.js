// Small shared helpers. The clock is replaceable so date logic can be tested.
let clock=()=>new Date();
export const setClock=f=>{clock=f||(()=>new Date());};
export const now=()=>clock();
export const dayStr=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
export const today=()=>dayStr(now());
export const plusDays=n=>{const d=now();d.setDate(d.getDate()+n);return dayStr(d);};
export const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
