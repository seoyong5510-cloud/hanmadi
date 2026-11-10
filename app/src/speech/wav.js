// Microphone recording to 16 kHz mono WAV, the format the pronunciation service requires.
export function resample(f32,from,to){
  if(from===to)return f32;
  const n=Math.floor(f32.length*to/from),out=new Float32Array(n),ratio=from/to;
  for(let i=0;i<n;i++){
    const x=i*ratio,i0=Math.floor(x),i1=Math.min(i0+1,f32.length-1),f=x-i0;
    out[i]=f32[i0]*(1-f)+f32[i1]*f;
  }
  return out;
}
export function encodeWav(samples,rate){
  const buf=new ArrayBuffer(44+samples.length*2),v=new DataView(buf);
  const str=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
  str(0,"RIFF");v.setUint32(4,36+samples.length*2,true);str(8,"WAVE");str(12,"fmt ");
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
  str(36,"data");v.setUint32(40,samples.length*2,true);
  for(let i=0;i<samples.length;i++){const s=Math.max(-1,Math.min(1,samples[i]));v.setInt16(44+i*2,s<0?s*0x8000:s*0x7fff,true);}
  return buf;
}
export const canRecord=()=>!!(globalThis.navigator&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&(globalThis.AudioContext||globalThis.webkitAudioContext));
// Returns {stop(): Promise<{blob, seconds, url}>, cancel()}.
export async function startRecording(maxSeconds=28){
  const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true}});
  const AC=globalThis.AudioContext||globalThis.webkitAudioContext,ctx=new AC();
  const src=ctx.createMediaStreamSource(stream),proc=ctx.createScriptProcessor(4096,1,1),mute=ctx.createGain();
  const chunks=[];let total=0,done=false,timer=null,onAuto=null;
  mute.gain.value=0;
  proc.onaudioprocess=e=>{if(done)return;const d=e.inputBuffer.getChannelData(0);chunks.push(new Float32Array(d));total+=d.length;};
  src.connect(proc);proc.connect(mute);mute.connect(ctx.destination);
  const close=()=>{done=true;clearTimeout(timer);try{proc.disconnect();src.disconnect();}catch(e){}stream.getTracks().forEach(t=>t.stop());try{ctx.close();}catch(e){}};
  const finish=()=>{
    const rate=ctx.sampleRate;close();
    const all=new Float32Array(total);let o=0;chunks.forEach(c=>{all.set(c,o);o+=c.length;});
    const blob=new Blob([encodeWav(resample(all,rate,16000),16000)],{type:"audio/wav"});
    return {blob,seconds:total/rate,url:URL.createObjectURL(blob)};
  };
  let result=null;
  const stop=async()=>{if(!result)result=finish();return result;};
  timer=setTimeout(()=>{stop().then(r=>onAuto&&onAuto(r));},maxSeconds*1000);
  return {stop,cancel:close,set onauto(f){onAuto=f;}};
}
