const C="metis-oren-v4.3.0";
const ASSETS=["./","./index.html","./google-sync.js","./oren-theme.css","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(a=>Promise.all(a.filter(k=>k.startsWith('metis-oren-')&&k!==C).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);if(u.origin!==self.location.origin)return;
 if(u.pathname.startsWith('/api/'))return;
 if(e.request.mode==='navigate'){
   e.respondWith(fetch(e.request).then(r=>r).catch(()=>caches.match('./index.html')));
   return;
 }
 e.respondWith(fetch(e.request).then(r=>{
   if(r.ok){const copy=r.clone();caches.open(C).then(cache=>cache.put(e.request,copy));}
   return r;
 }).catch(()=>caches.match(e.request)));
});
