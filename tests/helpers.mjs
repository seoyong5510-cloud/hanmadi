import fs from "node:fs";
import {LEVELS} from "../app/src/core/levels.js";
import {initContent} from "../app/src/core/content.js";
export function loadAll(){
  const out={};
  LEVELS.forEach(l=>{out[l.id]=JSON.parse(fs.readFileSync(new URL(`../app/content/${l.id}.json`,import.meta.url),"utf8"));});
  initContent(out);
  return out;
}
export function memStorage(init={}){
  const m=new Map(Object.entries(init));
  return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{m.set(k,String(v));},removeItem:k=>{m.delete(k);},_m:m};
}
