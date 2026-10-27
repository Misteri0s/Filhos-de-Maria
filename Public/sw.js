// Service worker: guarda o site para funcionar offline.
// IMPORTANTE: ao mudar qualquer arquivo do site, aumente a versão abaixo (fm-v8 -> fm-v9 ...).
// Assim os visitantes recebem a versão nova em vez da guardada.
const V='fm-v8';
const ARQUIVOS=['./','index.html','icon-192.png',
  'css/fontes.css','css/estilo.css','css/estilo-extra.css',
  'js/inicio-tema.js','js/inicio-familia.js',
  'js/03-abas-misterios.js','js/04-contador-do-terco.js','js/05-pontos-contas-conta.js',
  'js/06-busca-e-acesso.js','js/07-meditacoes.js','js/08-aparencia.js','js/09-modo-reza.js',
  'js/10-contador-visitas.js','js/11-compartilhar-letras.js','js/12-navegacao-modo-guiado.js',
  'js/13-familia-visual.js','js/14-admin.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(ARQUIVOS)).then(()=>self.skipWaiting()))});
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
