// Service worker: guarda o site para funcionar offline.
// Ao mudar qualquer arquivo do site, aumente a versão abaixo (fm-v9 -> fm-v10 ...).
const V='fm-v9';
const ARQUIVOS=['./','index.html','icon-192.png',
  'CSS/fontes.css','CSS/estilo.css','CSS/estilo-extra.css',
  'js/inicio-tema.js','js/inicio-familia.js',
  'js/03-abas-misterios.js','js/04-contador-do-terco.js','js/05-pontos-contas-conta.js',
  'js/06-busca-e-acesso.js','js/07-meditacoes.js','js/08-aparencia.js','js/09-modo-reza.js',
  'js/10-contador-visitas.js','js/11-compartilhar-letras.js','js/12-navegacao-modo-guiado.js',
  'js/13-familia-visual.js','js/14-admin.js'];

// Instalação: um arquivo faltando não impede o resto de ser guardado.
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V)
    .then(c=>Promise.all(ARQUIVOS.map(a=>c.add(a).catch(()=>{}))))
    .then(()=>self.skipWaiting()));
});

// Ativação: apaga versões antigas do cache.
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x))))
    .then(()=>self.clients.claim()));
});

function guardar(r,res){
  if(res&&(res.ok||res.type==='opaque')){caches.open(V).then(c=>c.put(r,res.clone()))}
  return res;
}

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  const fonte=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  if(u.origin===location.origin){
    // Rede primeiro; se falhar, usa o cache. Nunca responde com vazio:
    // se não houver nada guardado, devolve erro de rede normal.
    e.respondWith(fetch(r).then(res=>guardar(r,res))
      .catch(()=>caches.match(r).then(m=>m||caches.match('./')).then(m=>m||Response.error())));
  }else if(fonte){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>guardar(r,res))));
  }
});
