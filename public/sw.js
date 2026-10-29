const CACHE='janus-oren-static-v4';
const STATIC=['/olympos-structure.mjs','/olympos-spaces.mjs','/janus.html','/connections.html','/connections.mjs','/oren-projects.mjs','/oren-shell.mjs','/diagnostic.html','/diagnostic.mjs','/manifest.webmanifest','/icons/janus-v1-192.png','/icons/janus-v1-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('janus-oren-static-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||req.mode==='no-cors')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname==='/argos-feed.html')return;
 if(!STATIC.includes(url.pathname)&&url.pathname!=='/'&&url.pathname!=='/index.html')return;
 event.respondWith(fetch(req).then(response=>{
   if(response.ok&&new URL(response.url).origin===self.location.origin&&STATIC.includes(url.pathname)){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(url.pathname,copy)));}
   return response;
 }).catch(async()=>await caches.match(req)||await caches.match('/janus.html')||Response.error()));
});
