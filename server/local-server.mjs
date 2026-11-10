// 한마디 영어 - local AI server for your own PC.
// Runs the same relay as the cloud version, but talks to a local Ollama model, so there is no AI usage fee.
//   node local-server.mjs            (settings are read from local-config.json next to this file)
// It listens only on this computer (127.0.0.1) unless "host" in the config says otherwise, and every
// request must carry the access code, so nothing is open to the network without a code.
import http from "node:http";
import fs from "node:fs";
import crypto from "node:crypto";
import worker from "./worker.js";
const here=new URL(".",import.meta.url);
const cfgPath=new URL("local-config.json",here);
let cfg={};
try{cfg=JSON.parse(fs.readFileSync(cfgPath,"utf8"));}catch(e){}
if(!cfg.token){cfg.token=crypto.randomBytes(9).toString("base64url");}
cfg=Object.assign({port:8787,host:"127.0.0.1",model:"qwen3:8b",ollama:"http://127.0.0.1:11434",allowOrigin:"https://seoyong5510-cloud.github.io,http://localhost:8787,http://127.0.0.1:8787",users:{}},cfg);
fs.writeFileSync(cfgPath,JSON.stringify(cfg,null,2));
const env={APP_TOKEN:cfg.token,LLM_PROVIDER:"ollama",LLM_API_KEY:"local",LLM_MODEL:cfg.model,LLM_BASE_URL:cfg.ollama,ALLOW_ORIGIN:cfg.allowOrigin,
  USERS:cfg.users||{},AZURE_SPEECH_KEY:cfg.speechKey||"",AZURE_SPEECH_REGION:cfg.speechRegion||""};

async function ollamaState(){
  try{
    const r=await fetch(cfg.ollama+"/api/tags",{signal:AbortSignal.timeout(3000)});
    const j=await r.json();
    const names=(j.models||[]).map(m=>m.name);
    return {up:true,hasModel:names.includes(cfg.model)||names.includes(cfg.model+":latest"),names};
  }catch(e){return {up:false,hasModel:false,names:[]};}
}
const server=http.createServer(async(req,res)=>{
  try{
    const chunks=[];for await(const c of req)chunks.push(c);
    const body=Buffer.concat(chunks);
    const request=new Request("http://"+(req.headers.host||"localhost")+req.url,{method:req.method,headers:req.headers,body:["GET","HEAD","OPTIONS"].includes(req.method)?undefined:body});
    let r=await worker.fetch(request,env);
    // health also says whether the local AI program and the model are really there
    if(req.method==="GET"&&req.url.replace(/\/+$/,"")==="/v1/health"&&r.status===200){
      const j=await r.json(),st=await ollamaState();
      j.local=true;j.ollama=st.up;j.model_ready=st.hasModel;j.llm=st.up&&st.hasModel;
      if(!st.up)j.problem="ollama_down";else if(!st.hasModel)j.problem="model_missing";
      const h={};r.headers.forEach((v,k)=>{h[k]=v;});
      res.writeHead(200,h);return res.end(JSON.stringify(j));
    }
    const h={};r.headers.forEach((v,k)=>{h[k]=v;});
    // Chrome asks permission before a public https page may call this computer; say yes for allowed origins only (CORS still applies)
    if(req.headers["access-control-request-private-network"])h["access-control-allow-private-network"]="true";
    res.writeHead(r.status,h);res.end(Buffer.from(await r.arrayBuffer()));
  }catch(e){res.writeHead(500,{"content-type":"application/json"});res.end(JSON.stringify({error:"server_error",message:String(e&&e.message||e)}));}
});
server.listen(cfg.port,cfg.host,async()=>{
  const st=await ollamaState();
  console.log("한마디 AI 서버가 켜졌어요.");
  console.log("  앱 설정에 넣을 서버 주소: http://localhost:"+cfg.port);
  console.log("  접속 암호: "+cfg.token);
  console.log("  AI 모델: "+cfg.model+(st.up?(st.hasModel?"  (준비됨)":"  (아직 없음 → 다른 창에서: ollama pull "+cfg.model+")"):"  (Ollama 가 꺼져 있어요. Ollama 를 실행해 주세요)"));
  console.log("이 창을 닫으면 AI 서버가 꺼져요.");
});
server.on("error",e=>{console.log(e.code==="EADDRINUSE"?"이미 AI 서버가 켜져 있어요 (포트 "+cfg.port+").":"서버 오류: "+e.message);process.exitCode=1;});
