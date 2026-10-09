const V='fm-v7';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(['./','index.html','icon-192.png'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
function guardar(r,res){if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  const fonte=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  if(u.origin===location.origin){
    e.respondWith(fetch(r).then(res=>guardar(r,res)).catch(()=>caches.match(r).then(m=>m||caches.match('./'))));
  }else if(fonte){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>guardar(r,res))));
  }
});
