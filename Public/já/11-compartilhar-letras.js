(function(){
var $=function(i){return document.getElementById(i)};
var SETS=['gozosos','luminosos','dolorosos','gloriosos'],
NOME={gozosos:'Gozoso',luminosos:'Luminoso',dolorosos:'Doloroso',gloriosos:'Glorioso'};
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim()}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function url0(){return location.origin+location.pathname}
function bloqueia(v){document.body.style.overflow=v?'hidden':''}

[].forEach.call(document.querySelectorAll('input[data-ver]'),function(c){c.addEventListener('change',function(){var i=$(c.dataset.ver);if(i)i.type=c.checked?'text':'password'})});

(function(){
var b=$('letras'),mais=$('fonte-mais'),menos=$('fonte-menos'),val=$('fonte-valor');if(!b||!mais||!menos||!val)return;
var alvos=[100,130,150,180];
function atual(){return parseInt(val.textContent,10)||100}
function rotulo(){b.title='Letras maiores (agora '+atual()+'%)';b.setAttribute('aria-label','Letras maiores. Tamanho atual '+atual()+'%')}
b.addEventListener('click',function(){
var p=atual(),prox=alvos.filter(function(a){return a>p})[0]||100,n=0;
while(atual()!==prox&&n++<14){var antes=atual();(prox>atual()?mais:menos).click();if(atual()===antes)break}
rotulo()});
rotulo();
})();

function compartilhar(texto){
var d={text:texto};
if(navigator.share){navigator.share(d).catch(function(){});return}
window.open('https://wa.me/?text='+encodeURIComponent(texto),'_blank','noopener');
}
(function(){
var b=$('ini-compartilhar');
if(b)b.addEventListener('click',function(){
var h=window.fmReza?window.fmReza.hoje:'gozosos',hj=$('hj'),s=hj&&hj.querySelector('small'),t=hj&&hj.querySelector('.ini-set');
var linhas=[(s?s.textContent+', rezamos os ':'Hoje rezamos os ')+(t?t.textContent:'Mistérios')+':'];
[].forEach.call(document.querySelectorAll('#'+h+' article'),function(a){var n=a.querySelector('b'),h3=a.querySelector('h3');if(n&&h3)linhas.push(n.textContent+' '+h3.textContent)});
linhas.push('','Reze conosco: '+url0()+'#'+h);
compartilhar('\uD83D\uDE4F '+linhas.join('\n'))});
SETS.forEach(function(id){[].forEach.call(document.querySelectorAll('#'+id+' article'),function(a){
var d=a.querySelector(':scope>div'),n=a.querySelector('b'),h3=a.querySelector('h3'),sm=a.querySelector('small');if(!d||!n||!h3)return;
var bt=el('button','ini-share-m','Compartilhar este mistério');bt.type='button';
bt.addEventListener('click',function(){compartilhar(n.textContent+' Mistério '+NOME[id]+': '+h3.textContent+(sm?'\n'+sm.textContent.trim():'')+'\n\nReze conosco: '+url0()+'#'+id)});
d.appendChild(bt)})});
})();

(function(){
var box=$('tutorial');if(!box)return;
var P=[
['O que é o terço?','<p>O Rosário, ou terço, é uma oração simples: você repete orações conhecidas enquanto <b>medita</b> em momentos da vida de Jesus e de Maria.</p><p>Não há pressa nem jeito errado de rezar. Leva cerca de 15 a 20 minutos.</p>'],
['Como começar','<p>Faça o <b>Sinal da Cruz</b> e reze as <b>orações iniciais</b>.</p><p>No site elas aparecem na ordem certa quando você toca em <b>Rezar agora</b>.</p>'],
['Cada mistério','<p>O terço tem <b>5 mistérios</b>. Em cada um:</p><p><b>1.</b> leia o mistério e medite um instante;<br><b>2.</b> reze 1 Pai-Nosso;<br><b>3.</b> reze 10 Ave-Marias;<br><b>4.</b> reze 1 Glória.</p>'],
['Conte as Ave-Marias','<p>Toque nas bolinhas de cada mistério para contar as 10 Ave-Marias, como as contas de um terço.</p><p>O site guarda onde você parou. Se fechar, toque em <b>Continuar de onde parei</b>.</p>'],
['Os mistérios mudam no dia','<p><b>Segunda e sábado:</b> Gozosos<br><b>Terça e sexta:</b> Dolorosos<br><b>Quarta e domingo:</b> Gloriosos<br><b>Quinta:</b> Luminosos</p><p>O site já abre o mistério de hoje.</p>'],
['Para terminar','<p>Depois do quinto mistério, reze a <b>Salve Rainha</b> e as orações finais.</p><p>Quer rezar em família ou no grupo? Use <b>Compartilhar</b> para convidar alguém.</p>']
],i=0,ultimo=null;
function pinta(){
$('tut-n').textContent='Passo '+(i+1)+' de '+P.length;$('tut-t').textContent=P[i][0];$('tut-c').innerHTML=P[i][1];
$('tut-volta').style.visibility=i?'visible':'hidden';$('tut-prox').textContent=i===P.length-1?'Rezar agora':'Próximo';
var d=$('tut-dots');d.textContent='';P.forEach(function(_,k){d.appendChild(el('i',k===i?'on':''))})}
function abre(){i=0;ultimo=document.activeElement;pinta();box.hidden=false;bloqueia(true);$('tut-prox').focus()}
function fecha(){box.hidden=true;bloqueia(false);if(ultimo&&ultimo.focus)ultimo.focus()}
$('tut-volta').addEventListener('click',function(){if(i>0){i--;pinta()}});
$('tut-prox').addEventListener('click',function(){if(i<P.length-1){i++;pinta();return}fecha();var r=$('ini-rezar');if(r)r.click()});
$('tut-x').addEventListener('click',fecha);
box.addEventListener('click',function(e){if(e.target===box)fecha()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!box.hidden)fecha()});
var g=$('ini-tutorial');if(g)g.addEventListener('click',abre);
})();

(function(){
var box=$('busca'),q=$('busca-q'),res=$('busca-res'),dica=$('busca-dica');if(!box||!q)return;
var idx=null,ultimo=null;
function limpaCl(e,tira){var c=e.cloneNode(true);[].forEach.call(c.querySelectorAll(tira),function(x){x.remove()});return c}
function construir(){
var it=[];
[].forEach.call(document.querySelectorAll('#menu details.menu-grupo'),function(g){
var s0=g.querySelector('summary');if(!s0||s0.textContent.trim().toUpperCase()!=='ORAÇÕES')return;
[].forEach.call(g.children,function(d){if(d.tagName!=='DETAILS'||d.classList.contains('explicacao-curta'))return;var s=d.querySelector('summary');if(!s)return;
var c=limpaCl(d,'summary');it.push({t:s.textContent.trim(),tipo:'Oração',html:c.innerHTML,n:norm(s.textContent),x:norm(c.textContent)})})});
['iniciais','finais'].forEach(function(id){[].forEach.call(document.querySelectorAll('#'+id+' article'),function(a){
var h=a.querySelector('h3'),d=a.querySelector(':scope>div');if(!h||!d)return;
var c=limpaCl(d,'h3,button,.cta,details,.grupo');it.push({t:h.textContent.trim(),tipo:id==='iniciais'?'Oração inicial do terço':'Oração final do terço',html:c.innerHTML,n:norm(h.textContent),x:norm(c.textContent)})})});
SETS.forEach(function(id){[].forEach.call(document.querySelectorAll('#'+id+' article'),function(a){
var h=a.querySelector('h3'),b=a.querySelector('b');if(!h)return;
it.push({t:h.textContent.trim(),tipo:(b?b.textContent+' ':'')+'Mistério '+NOME[id],n:norm(h.textContent),x:norm(a.textContent),ir:{set:id,art:a}})})});
[].forEach.call(document.querySelectorAll('#nov-todas li'),function(li){var a=li.querySelector('a');if(!a)return;
var t=a.textContent.replace('↗','').trim();it.push({t:t,tipo:'Novena',n:norm(t),x:li.dataset.busca||'',li:li})});
return it}
function pesquisa(txt){
var ts=norm(txt).split(' ').filter(Boolean);if(!ts.length)return [];
var out=[];idx.forEach(function(o){var ok=ts.every(function(t){return (o.n+' '+o.x).indexOf(t)>-1});if(!ok)return;
var sc=0;ts.forEach(function(t){if(o.n.indexOf(t)>-1)sc+=3;if(o.n.indexOf(t)===0)sc+=2});o.sc=sc;out.push(o)});
out.sort(function(a,b){return b.sc-a.sc||a.t.localeCompare(b.t,'pt-BR')});return out.slice(0,20)}
function desenha(){
res.textContent='';var v=q.value.trim();
if(!v){dica.hidden=false;dica.textContent='Ex.: Salve Rainha, Anunciação, Santa Rita';return}
var l=pesquisa(v);
if(!l.length){dica.hidden=false;dica.textContent='Nada encontrado para “'+v+'”. Tente outra palavra.';return}
dica.hidden=true;
l.forEach(function(o){var li=el('li');
if(o.li){var a=el('a','busca-item');a.href=o.li.querySelector('a').href;a.target='_blank';a.rel='noopener noreferrer';a.appendChild(el('b','',o.t+' ↗'));a.appendChild(el('small','',o.tipo));li.appendChild(a)}
else if(o.ir){var b=el('button','busca-item');b.type='button';b.appendChild(el('b','',o.t));b.appendChild(el('small','',o.tipo+' · tocar para abrir'));
b.addEventListener('click',function(){fecha();var r=window.fmReza;if(r)r.entra();if(window.abrirAba)window.abrirAba(o.ir.set);setTimeout(function(){o.ir.art.scrollIntoView({behavior:'smooth',block:'center'})},60)});li.appendChild(b)}
else{var b2=el('button','busca-item');b2.type='button';b2.setAttribute('aria-expanded','false');b2.appendChild(el('b','',o.t));b2.appendChild(el('small','',o.tipo+' · tocar para ler'));
var tx=el('div','busca-txt');tx.hidden=true;tx.innerHTML=o.html;
b2.addEventListener('click',function(){tx.hidden=!tx.hidden;b2.setAttribute('aria-expanded',tx.hidden?'false':'true')});li.appendChild(b2);li.appendChild(tx)}
res.appendChild(li)})}
function abre(){if(!idx)idx=construir();ultimo=document.activeElement;box.hidden=false;bloqueia(true);q.value='';desenha();q.focus()}
function fecha(){box.hidden=true;bloqueia(false);if(ultimo&&ultimo.focus)ultimo.focus()}
q.addEventListener('input',desenha);
$('busca-x').addEventListener('click',fecha);
box.addEventListener('click',function(e){if(e.target===box)fecha()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!box.hidden)fecha()});
var g=$('ini-buscar');if(g)g.addEventListener('click',abre);
})();

(function(){
var K='fm-novenas',lis=[].slice.call(document.querySelectorAll('#nov-todas li'));if(!lis.length)return;
var CFG={'novena-de-sao-jose':{a:'dia{n}'},'novena-a-nossa-senhora-aparecida':{a:'dia-{n}'},'rezemos-juntos-a-trezena-em-louvor-a-santo-antonio':{d:13},'santa-catarina-de-alexandria-oracao':{d:0}};
function ler(){try{return JSON.parse(localStorage.getItem(K)||'{}')||{}}catch(e){return {}}}
function grava(o){try{localStorage.setItem(K,JSON.stringify(o))}catch(e){}}
function ymd(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function entre(a,b){var x=a.split('-'),y=b.split('-');return Math.round((Date.UTC(+y[0],y[1]-1,+y[2])-Date.UTC(+x[0],x[1]-1,+x[2]))/864e5)}
function br(s){var p=s.split('-');return p[2]+'/'+p[1]}
function slugDe(h){return h.replace(/[?#].*$/,'').replace(/\/+$/,'').split('/').pop()}
function urlDia(base,slug,n){if(base.indexOf('bibliotecacatolica.com.br')<0)return base;var c=CFG[slug]||{};
if(c.a)return base+'#'+c.a.replace('{n}',n);return base+'#:~:text='+encodeURIComponent(n+'º dia')}
function estado(li){var D=+li.dataset.dias,st=ler()[li.dataset.slug];if(!D||!st)return null;var n=entre(st,ymd(new Date()))+1;return {n:n,D:D,ini:st}}
lis.forEach(function(li){var a=li.querySelector('a');if(!a)return;var slug=slugDe(a.href),c=CFG[slug]||{};
li.dataset.slug=slug;li.dataset.base=a.href;li.dataset.dias=c.d===undefined?9:c.d;if(!+li.dataset.dias)return;
li.appendChild(el('div','nov-ctl'))});
function pinta(li){var ctl=li.querySelector('.nov-ctl');if(!ctl)return;var a=li.querySelector('a'),base=li.dataset.base,slug=li.dataset.slug,e=estado(li);
ctl.textContent='';a.href=base;
function btn(t,f){var b=el('button','',t);b.type='button';b.addEventListener('click',f);ctl.appendChild(b);return b}
function para(){var o=ler();delete o[slug];grava(o);pinta(li);home()}
if(!e){btn('Iniciar novena',function(){ctl.textContent='';
var d=el('input');d.type='date';d.value=ymd(new Date());d.setAttribute('aria-label','Data de início da novena');ctl.appendChild(d);
btn('Começar',function(){if(!d.value)return;var o=ler();o[slug]=d.value;grava(o);pinta(li);home()});
btn('Cancelar',function(){pinta(li)})});return}
if(e.n<1){ctl.appendChild(document.createTextNode('Começa em '+(1-e.n)+(1-e.n===1?' dia':' dias')+' ('+br(e.ini)+'). '));btn('Cancelar',para);return}
if(e.n>e.D){ctl.appendChild(document.createTextNode('Novena concluída. Que Deus abençoe seus pedidos. '));btn('Reiniciar',function(){var o=ler();o[slug]=ymd(new Date());grava(o);pinta(li);home()});btn('Limpar',para);return}
a.href=urlDia(base,slug,e.n);
ctl.appendChild(el('span','nov-dia','Dia '+e.n+' de '+e.D));ctl.appendChild(document.createTextNode('desde '+br(e.ini)+' '));btn('Parar',para)}
function home(){var box=$('ini-novs');if(!box)return;box.textContent='';var n=0;
lis.forEach(function(li){if(n>=2)return;var e=estado(li);if(!e||e.n<1||e.n>e.D)return;n++;
var a=el('a');a.href=urlDia(li.dataset.base,li.dataset.slug,e.n);a.target='_blank';a.rel='noopener noreferrer';
a.appendChild(document.createTextNode(li.querySelector('a').textContent.replace('↗','').trim()+' · '));a.appendChild(el('b','','dia '+e.n+' de '+e.D));box.appendChild(a)});
box.hidden=!n}
function tudo(){lis.forEach(pinta);home()}
tudo();document.addEventListener('visibilitychange',function(){if(!document.hidden)tudo()});
})();
})();
