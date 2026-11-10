// 한마디 영어 relay (Cloudflare Worker).
// Keeps the AI and speech keys on the server. The app calls this with a personal access code.
//
// Settings (Worker > Settings > Variables and Secrets):
//   APP_TOKEN            secret  personal access code typed into the app
//   LLM_PROVIDER         text    "anthropic" (default) or "openai" (any OpenAI-compatible API)
//   LLM_API_KEY          secret  key for the AI provider
//   LLM_MODEL            text    model id (default depends on provider)
//   LLM_BASE_URL         text    optional, for OpenAI-compatible providers
//   PRICE_IN, PRICE_OUT  text    optional, USD per 1M tokens, to report cost
//   AZURE_SPEECH_KEY     secret  optional: natural voice + pronunciation assessment
//   AZURE_SPEECH_REGION  text    e.g. "koreacentral"
//   TTS_VOICE            text    optional, default "en-US-JennyNeural"
//   ALLOW_ORIGIN         text    optional, comma-separated origins allowed to call (default "*")

const TAGS=["past-tense","tense","article","preposition","word-choice","word-order","plural","subject-verb","other"];
const LEVEL_RULES={
  A1:"The learner is an absolute beginner. Use at most 8 very common words per sentence, present tense, one sentence plus one very easy question. Never use idioms.",
  A2:"The learner is elementary. Use short, simple sentences (at most 12 words), common words, simple past and future. One or two sentences.",
  "A2+":"The learner is pre-intermediate. Use clear everyday sentences (at most 15 words). Ask for reasons with 'why' so they practice 'because'.",
  B1:"The learner is intermediate. Speak naturally but clearly, two or three sentences. Ask for opinions and experiences.",
  B2:"The learner is upper-intermediate. Speak at natural speed with common idioms. Challenge them with follow-up questions and ask them to justify their views.",
  C1:"The learner is advanced. Speak fully naturally with nuance. Push for precision, play devil's advocate politely, and ask them to rephrase vague statements."
};

class Fail extends Error{constructor(code,status,message){super(message||code);this.code=code;this.status=status;}}
const b64=s=>{const bytes=new TextEncoder().encode(s);let bin="";bytes.forEach(b=>{bin+=String.fromCharCode(b);});return btoa(bin);};
const xml=s=>String(s).replace(/[<>&'"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[c]));
const clip=(s,n)=>String(s==null?"":s).slice(0,n);

export function parseJson(text){
  const a=text.indexOf("{"),b=text.lastIndexOf("}");
  if(a<0||b<=a)throw new Fail("ai_bad_json",502,"model did not return JSON");
  try{return JSON.parse(text.slice(a,b+1));}catch(e){throw new Fail("ai_bad_json",502,"model returned invalid JSON");}
}

async function llmOnce(env,system,messages,maxTokens){
  if(!env.LLM_API_KEY)throw new Fail("llm_not_configured",503);
  const provider=(env.LLM_PROVIDER||"anthropic").toLowerCase();
  let r,j,text,usage;
  if(provider==="anthropic"){
    r=await fetch((env.LLM_BASE_URL||"https://api.anthropic.com")+"/v1/messages",{method:"POST",
      headers:{"content-type":"application/json","x-api-key":env.LLM_API_KEY,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({model:env.LLM_MODEL||"claude-haiku-5-5",max_tokens:maxTokens,system,messages})});
    j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Fail(r.status===429?"rate_limited":"ai_error",r.status===429?429:502,j.error&&j.error.message);
    text=(j.content||[]).filter(c=>c.type==="text").map(c=>c.text).join("");
    usage={in:(j.usage&&j.usage.input_tokens)||0,out:(j.usage&&j.usage.output_tokens)||0};
  }else{
    r=await fetch((env.LLM_BASE_URL||"https://api.openai.com/v1")+"/chat/completions",{method:"POST",
      headers:{"content-type":"application/json","authorization":"Bearer "+env.LLM_API_KEY},
      body:JSON.stringify({model:env.LLM_MODEL||"gpt-4o-mini",messages:[{role:"system",content:system}].concat(messages)})});
    j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Fail(r.status===429?"rate_limited":"ai_error",r.status===429?429:502,j.error&&j.error.message);
    text=(j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||"";
    usage={in:(j.usage&&j.usage.prompt_tokens)||0,out:(j.usage&&j.usage.completion_tokens)||0};
  }
  const pin=Number(env.PRICE_IN)||0,pout=Number(env.PRICE_OUT)||0;
  if(pin||pout)usage.usd=(usage.in*pin+usage.out*pout)/1e6;
  return {text,usage};
}
// One retry when the model answers with something that is not JSON.
async function llmJson(env,system,messages,maxTokens){
  const a=await llmOnce(env,system,messages,maxTokens);
  try{return {data:parseJson(a.text),usage:a.usage};}
  catch(e){
    const b=await llmOnce(env,system,messages.concat([{role:"assistant",content:a.text||"..."},{role:"user",content:"Return ONLY the JSON object, with no other text."}]),maxTokens);
    const usage={in:a.usage.in+b.usage.in,out:a.usage.out+b.usage.out};
    if(a.usage.usd!=null||b.usage.usd!=null)usage.usd=(a.usage.usd||0)+(b.usage.usd||0);
    return {data:parseJson(b.text),usage};
  }
}

const cleanFix=c=>{
  if(!c||typeof c!=="object"||!c.correct)return null;
  return {said:clip(c.said,300),correct:clip(c.correct,300),better:clip(c.better||c.correct,300),ko:clip(c.ko,300),why:clip(c.why,400),tag:TAGS.includes(c.tag)?c.tag:"other"};
};

export function tutorSystem(b){
  const cefr=LEVEL_RULES[b.cefr]?b.cefr:"A1";
  const mem=Array.isArray(b.memory)&&b.memory.length?b.memory.slice(0,8).map(m=>"- "+clip(m,160)).join("\n"):"- (none recorded yet)";
  return `You are a warm, patient English teacher talking with one Korean adult learner. This is a spoken conversation: your "reply" is read aloud by text-to-speech, so write plain spoken English with no lists, emojis, markdown or stage directions.

Learner level: CEFR ${cefr}. ${LEVEL_RULES[cefr]}

Scenario: ${clip(b.role||"Free conversation about the learner's day, family, work, hobbies and plans.",600)}

How you teach:
- Keep it natural and friendly, never like a test. Respond to what the learner MEANT, then usually end with ONE question so they keep talking. Stay inside the level rule above.
- If the learner's last message contains mistakes, choose only the ONE most important (two at most if closely related) and report it in "correction". Ignore capitalization, punctuation, filler words and obvious speech-recognition slips. Do not "correct" anything that is acceptable in casual spoken English. If you are not sure it is an error, do not correct it. If the message is fine, "correction" is null.
- Never repeat the correction inside "reply"; the app shows it separately.
- If the learner answers in Korean, says they do not know how to say something, or is clearly stuck, do not give the full sentence. Put a nudge in "hint" (a Korean explanation of what to say and an English sentence starter of two to four words) and keep "reply" to a short encouragement.
- Never invent grammar rules or facts. Explanations in "why" are in Korean, one or two short sentences, in polite 해요체.
- Things this learner often gets wrong (listen for them; when they get one right, you may briefly say so):
${mem}

Return ONLY a JSON object with exactly these keys:
{"reply": string, "reply_ko": string (natural Korean translation of reply), "correction": null or {"said": the learner's sentence, "correct": the minimally corrected sentence, "better": a more natural way a native speaker would say it (may equal correct), "ko": Korean meaning, "why": Korean explanation, "tag": one of ${JSON.stringify(TAGS)}}, "hint": null or {"ko": string, "starter": string}}`;
}

function history(b){
  const h=(Array.isArray(b.history)?b.history:[]).slice(-24).map(m=>({role:m.r==="a"?"assistant":"user",content:clip(m.t,600)})).filter(m=>m.content);
  while(h.length&&h[0].role!=="user")h.shift();
  // merge consecutive same-role messages (providers require alternation)
  const out=[];
  h.forEach(m=>{const last=out[out.length-1];if(last&&last.role===m.role)last.content+="\n"+m.content;else out.push(m);});
  return out;
}

async function turn(env,b){
  const msgs=history(b);
  if(b.hint)msgs.push({role:"user",content:"(The learner pressed the hint button: they do not know what to say next. Give only a hint for a good next sentence; keep reply to a few encouraging words.)"});
  else if(!msgs.length||b.start)msgs.unshift({role:"user",content:"(Begin the conversation: greet the learner in character and ask one easy opening question.)"});
  if(msgs[msgs.length-1].role!=="user")msgs.push({role:"user",content:"(Continue.)"});
  const {data,usage}=await llmJson(env,tutorSystem(b),msgs,700);
  const hint=data.hint&&typeof data.hint==="object"&&(data.hint.ko||data.hint.starter)?{ko:clip(data.hint.ko,300),starter:clip(data.hint.starter,120)}:null;
  if(!data.reply&&!hint)throw new Fail("ai_bad_json",502,"empty reply");
  return {reply:clip(data.reply,800),reply_ko:clip(data.reply_ko,800),correction:b.hint?null:cleanFix(data.correction),hint,usage};
}

async function report(env,b){
  const lines=(Array.isArray(b.history)?b.history:[]).slice(-60).map(m=>(m.r==="a"?"Teacher: ":"Learner: ")+clip(m.t,600)).join("\n");
  if(!lines)throw new Fail("bad_request",400,"empty history");
  const cefr=LEVEL_RULES[b.cefr]?b.cefr:"A1";
  const system=`You are an experienced English teacher writing a short after-class report for a Korean adult learner at CEFR ${cefr}. Base everything strictly on the transcript; never invent sentences the learner did not say. Ignore punctuation, capitalization and speech-recognition slips. All Korean is polite 해요체.
Return ONLY a JSON object:
{"summary_ko": two sentences on how the conversation went, "did_well": array of up to 3 short Korean strings, each quoting something specific the learner said well, "mistakes": array of up to 5 objects {"said","correct","better","ko","why","tag"} for the most useful real errors (tag is one of ${JSON.stringify(TAGS)}; empty array if there were none), "next_focus_ko": one Korean sentence on what to practice next, "level_estimate": one of "A1","A2","A2+","B1","B2","C1" for the learner's speaking in this conversation}`;
  const {data,usage}=await llmJson(env,system,[{role:"user",content:"Transcript:\n"+lines}],1200);
  return {summary_ko:clip(data.summary_ko,600),did_well:(Array.isArray(data.did_well)?data.did_well:[]).slice(0,3).map(s=>clip(s,200)),
    mistakes:(Array.isArray(data.mistakes)?data.mistakes:[]).map(cleanFix).filter(Boolean).slice(0,5),
    next_focus_ko:clip(data.next_focus_ko,300),level_estimate:LEVEL_RULES[data.level_estimate]?data.level_estimate:"",usage};
}

async function judge(env,b){
  if(!b.target||!b.said)throw new Fail("bad_request",400,"target and said are required");
  const system=`You check a spoken answer in an English-speaking app for Korean learners. The learner was asked to express a meaning; a model answer exists but any natural sentence with the same meaning is acceptable. The text comes from speech recognition, so ignore punctuation, capitalization and small recognition slips.
"ok" is true only if the learner's sentence expresses the same meaning in the situation AND is grammatical enough that a native speaker would understand it without effort. A different meaning, a missing key element, or broken grammar is not ok.
Return ONLY a JSON object: {"ok": boolean, "natural": boolean (sounds like something a native speaker would say), "fix": the corrected sentence if not ok or not natural, otherwise "", "why_ko": one short Korean sentence in 해요체 explaining the verdict}`;
  const user=`Meaning to express (Korean): ${clip(b.ko,300)}\nModel answer: ${clip(b.target,300)}\nLearner said: ${clip(b.said,300)}`;
  const {data,usage}=await llmJson(env,system,[{role:"user",content:user}],300);
  return {ok:data.ok===true,natural:data.natural===true,fix:clip(data.fix,300),why_ko:clip(data.why_ko,300),usage};
}

function speechCfg(env){
  if(!env.AZURE_SPEECH_KEY||!env.AZURE_SPEECH_REGION)throw new Fail("speech_not_configured",503);
  return {key:env.AZURE_SPEECH_KEY,region:String(env.AZURE_SPEECH_REGION).toLowerCase().replace(/\s/g,"")};
}
async function tts(env,b,cors){
  const s=speechCfg(env),text=clip(b.text,600).trim();
  if(!text)throw new Fail("bad_request",400,"text is required");
  const pct=Math.round((Math.max(0.5,Math.min(1.3,Number(b.rate)||1))-1)*100);
  const ssml=`<speak version='1.0' xml:lang='en-US'><voice name='${xml(env.TTS_VOICE||"en-US-JennyNeural")}'><prosody rate='${pct>=0?"+":""}${pct}%'>${xml(text)}</prosody></voice></speak>`;
  const r=await fetch(`https://${s.region}.tts.speech.microsoft.com/cognitiveservices/v1`,{method:"POST",
    headers:{"Ocp-Apim-Subscription-Key":s.key,"Content-Type":"application/ssml+xml","X-Microsoft-OutputFormat":"audio-24khz-48kbitrate-mono-mp3","User-Agent":"hanmadi"},body:ssml});
  if(!r.ok)throw new Fail(r.status===429?"rate_limited":"speech_error",r.status===429?429:502,"tts "+r.status);
  return new Response(r.body,{status:200,headers:Object.assign({},cors,{"content-type":"audio/mpeg","x-usage-chars":String(text.length),"access-control-expose-headers":"x-usage-chars","cache-control":"private, max-age=86400"})});
}
// Map Azure's pronunciation assessment JSON to the small shape the app uses.
// Only values the service actually returned are passed on; missing ones stay null.
export function mapPron(j){
  const n=(j.NBest&&j.NBest[0])||null;
  if(j.RecognitionStatus!=="Success"||!n)return {status:j.RecognitionStatus||"NoMatch",text:"",scores:null,words:[]};
  const pa=x=>x.PronunciationAssessment||x;
  const num=v=>typeof v==="number"&&isFinite(v)?Math.round(v):null;
  const top=pa(n);
  return {status:"Success",text:n.Display||n.Lexical||"",
    scores:{pron:num(top.PronScore),accuracy:num(top.AccuracyScore),fluency:num(top.FluencyScore),completeness:num(top.CompletenessScore),prosody:num(top.ProsodyScore)},
    words:(n.Words||[]).map(w=>{const p=pa(w);return {w:w.Word,score:num(p.AccuracyScore),error:p.ErrorType||"None",
      phonemes:(w.Phonemes||[]).map(ph=>({p:ph.Phoneme,score:num(pa(ph).AccuracyScore)}))};})};
}
async function pron(env,req,url){
  const s=speechCfg(env),ref=clip(url.searchParams.get("ref")||"",400).trim();
  if(!ref)throw new Fail("bad_request",400,"ref is required");
  const audio=await req.arrayBuffer();
  const seconds=Math.max(0,(audio.byteLength-44)/32000);
  if(seconds<0.3||seconds>30)throw new Fail("bad_audio",400,"audio must be 0.3-30 seconds of 16 kHz mono WAV");
  const params={ReferenceText:ref,GradingSystem:"HundredMark",Granularity:"Phoneme",Dimension:"Comprehensive",EnableMiscue:true,EnableProsodyAssessment:true};
  const r=await fetch(`https://${s.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`,{method:"POST",
    headers:{"Ocp-Apim-Subscription-Key":s.key,"Content-Type":"audio/wav; codecs=audio/pcm; samplerate=16000","Accept":"application/json","Pronunciation-Assessment":b64(JSON.stringify(params))},body:audio});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Fail(r.status===429?"rate_limited":"speech_error",r.status===429?429:502,"stt "+r.status);
  return Object.assign(mapPron(j),{usage:{seconds:Math.round(seconds*10)/10}});
}

export default {
  async fetch(req,env){
    env=env||{};
    const origin=req.headers.get("Origin")||"",allow=String(env.ALLOW_ORIGIN||"*");
    const okOrigin=allow==="*"||allow.split(",").map(s=>s.trim()).includes(origin);
    const cors={"access-control-allow-origin":allow==="*"?"*":(okOrigin?origin:"null"),"access-control-allow-headers":"content-type,x-app-token","access-control-allow-methods":"GET,POST,OPTIONS","access-control-max-age":"86400","vary":"Origin"};
    const json=(obj,status)=>new Response(JSON.stringify(obj),{status:status||200,headers:Object.assign({},cors,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"})});
    if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
    try{
      const url=new URL(req.url),path=url.pathname.replace(/\/+$/,"");
      if(!env.APP_TOKEN)throw new Fail("not_configured",500,"APP_TOKEN is not set on the server");
      if(req.headers.get("x-app-token")!==env.APP_TOKEN)throw new Fail("unauthorized",401);
      if(req.method==="GET"&&path==="/v1/health")
        return json({ok:true,llm:!!env.LLM_API_KEY,speech:!!(env.AZURE_SPEECH_KEY&&env.AZURE_SPEECH_REGION),provider:(env.LLM_PROVIDER||"anthropic").toLowerCase(),model:env.LLM_MODEL||""});
      if(req.method!=="POST")throw new Fail("not_found",404);
      if(path==="/v1/pron")return json(await pron(env,req,url));
      let body;
      try{body=await req.json();}catch(e){throw new Fail("bad_request",400,"JSON body required");}
      if(path==="/v1/turn")return json(await turn(env,body));
      if(path==="/v1/report")return json(await report(env,body));
      if(path==="/v1/judge")return json(await judge(env,body));
      if(path==="/v1/tts")return await tts(env,body,cors);
      throw new Fail("not_found",404);
    }catch(e){
      return json({error:e.code||"server_error",message:String(e&&e.message||e)},e.status||500);
    }
  }
};
