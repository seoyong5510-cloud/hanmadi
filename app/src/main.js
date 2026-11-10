// App start-up: load saved data and lesson content, then show the first screen.
import {P,load,save} from "./core/store.js";
import {loadContent} from "./core/content.js";
import {ensureCards} from "./core/srs.js";
import {relayReady,health} from "./ai/relay.js";
import {sfx} from "./speech/sfx.js";
import {app,chrome,$,ui,show} from "./ui/nav.js";
import "./ui/home.js";
import "./ui/session.js";
import "./ui/tutor.js";

async function boot(){
  load();
  try{await loadContent();}
  catch(e){
    app.innerHTML='<div class="fin"><h1>수업 내용을 불러오지 못했어요</h1><p class="lead">인터넷 연결을 확인하고 다시 열어 주세요.</p></div>';
    chrome.innerHTML='<div class="dock fixed"><button type="button" class="cta" id="again">다시 시도</button></div>';
    $("#again").addEventListener("click",()=>location.reload());
    return;
  }
  ensureCards(P);save();
  show();
  if(relayReady())health().then(()=>{if(!ui.busy&&(ui.tab==="set"||ui.tab==="talk"||ui.tab==="today"))show();});
}
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest(".cta,.row,.tabs button,.aud,.setrow,.seg button,.side"))sfx("tap");});
// Coming back the next morning: refresh what is due today.
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!ui.busy&&P.level&&$(".tabs"))show();});
// Test hook (only with ?e2e in the address): lets the automated browser test read and seed state.
const E2E=new URLSearchParams(location.search).has("e2e");
if(E2E)window.__t={P,save,load,show,ui,lesson:(await import("./core/content.js")).lesson,all:(await import("./core/content.js")).allLessons,cardData:(await import("./core/content.js")).cardData,health};
if(!E2E&&"serviceWorker" in navigator){
  // When a new version takes over, reload once (only from a tab screen, never in the middle of a lesson)
  // so the screen is not left running old files.
  const had=!!navigator.serviceWorker.controller;
  let reloaded=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{if(had&&!reloaded&&!ui.busy){reloaded=true;location.reload();}});
  navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(r=>{r.update().catch(()=>{});document.addEventListener("visibilitychange",()=>{if(!document.hidden)r.update().catch(()=>{});});}).catch(()=>{});
}
boot();
