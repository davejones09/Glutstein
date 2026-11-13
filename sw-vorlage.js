/* Offline-Speicher der Web-App. Wird von build.py erzeugt, nicht von Hand bearbeiten (Vorlage: sw-vorlage.js). */
const VERSION='glutstein-/*VERSION*/';
const DATEIEN=/*DATEIEN*/;
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>Promise.all(DATEIEN.map(f=>c.add(new Request(f,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION&&k.startsWith('glutstein-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const url=new URL(r.url);
  /* Schriften von Google: aus dem Speicher, im Hintergrund auffrischen. */
  if(url.origin!==location.origin){
    if(!/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;
    e.respondWith(caches.open(VERSION).then(c=>c.match(r).then(hit=>{ const net=fetch(r).then(res=>{ c.put(r,res.clone()); return res; }).catch(()=>hit); return hit||net; })));
    return;
  }
  /* Musik wird mit Byte-Bereichen angefragt: dann das Netz nehmen, offline die ganze Datei aus dem Speicher. */
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>{
    if(hit&&!r.headers.get('range')) return hit;
    return fetch(r).catch(()=>hit||caches.match(url.pathname.endsWith('/')?'index.html':r,{ignoreSearch:true}));
  }));
});
