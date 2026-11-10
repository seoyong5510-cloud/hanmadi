// Offline support: the app shell and lesson content are cached so lessons open without a network.
// (Speech recognition and the AI teacher still need a connection.)
const CACHE="hanmadi-app-v1";
const FILES=["./","index.html","styles.css","manifest.webmanifest","icon-192.png","icon-512.png",
 "content/a1.json","content/a2.json","content/a2p.json","content/b1.json","content/b2.json","content/c1.json",
 "src/main.js","src/core/util.js","src/core/levels.js","src/core/grade.js","src/core/store.js","src/core/content.js","src/core/srs.js","src/core/plan.js","src/core/placement.js",
 "src/speech/sr.js","src/speech/tts.js","src/speech/wav.js","src/speech/sfx.js","src/ai/relay.js",
 "src/ui/nav.js","src/ui/icons.js","src/ui/home.js","src/ui/session.js","src/ui/tutor.js","src/ui/pronui.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// Network first so updates show up at once; fall back to the cache when offline.
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{
    if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
    return r;
  }).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("index.html"))));
});
