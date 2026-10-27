(function(){
var $=function(i){return document.getElementById(i)},box=$('inicio');
if(!box)return;
var R=document.documentElement,
SETS=['gozosos','luminosos','dolorosos','gloriosos'],
hoje=SETS.indexOf(window.abaHoje)>-1?window.abaHoje:'gozosos',
cl=$('cont'),ib=$('ini-cont');
function suave(){return window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}
box.dataset.set=hoje;
var hj=$('hj');
if(hj){var p=hj.textContent.split(': ');if(p.length===2){hj.textContent='';var a=document.createElement('small'),b=document.createElement('span');a.textContent=p[0];b.className='ini-set';b.textContent=p[1];hj.appendChild(a);hj.appendChild(b)}}
function entra(empurra){if(R.dataset.reza==='1')return;R.dataset.reza='1';if(empurra!==false){try{history.pushState({fmReza:1},'')}catch(e){}}}
function sai(){delete R.dataset.reza;scrollTo(0,0)}window.fmReza={entra:entra,sai:sai,hoje:hoje};
addEventListener('popstate',function(){var no=!!(history.state&&history.state.fmReza);if(R.dataset.reza==='1'&&!no)sai();else if(R.dataset.reza!=='1'&&no)entra(false)});
[].forEach.call(document.querySelectorAll('.ini-voltar'),function(v){v.addEventListener('click',function(){if(history.state&&history.state.fmReza)history.back();else sai()})});
var h=location.hash.slice(1);
if(SETS.indexOf(h)>-1){entra(false);var alvo=$(h);if(alvo)alvo.scrollIntoView()}
$('ini-rezar').addEventListener('click',function(){
entra();if(window.abrirAba)window.abrirAba(hoje);
var ini=$('iniciais'),d=ini&&ini.querySelector('details.rec');if(d)d.open=true;
(document.querySelector('.ini-voltar')||ini).scrollIntoView({behavior:suave(),block:'start'})});
if(hj)hj.addEventListener('click',function(){entra();var ab=document.querySelector('.abas');if(ab)ab.scrollIntoView({behavior:suave()})});
function sincCont(){
var ver=!!cl&&!cl.hidden&&cl.textContent.trim()!=='';ib.hidden=!ver;if(!ver)return;
$('ini-cont-sub').textContent=cl.textContent.replace(/^[^:]*:\s*/,'').replace(/\s*\((\d+) de 10\)/,' · $1 de 10 Ave-Marias')}
ib.addEventListener('click',function(){entra();if(cl)cl.click()});
var pts=$('ini-pts');
function pontos(){var b=document.querySelector('#loja .pts b'),n=b?b.textContent:'0';
$('ini-pts-n').textContent=n;$('ini-pts-u').textContent=n==='1'?'ponto':'pontos';
pts.setAttribute('aria-label',n+(n==='1'?' ponto':' pontos')+'. Abrir a lojinha de contas')}
function abreMenu(){var hb=$('hb');if(hb)hb.click()}
function abreDet(d){if(!d)return;d.open=true;setTimeout(function(){var s=d.querySelector('summary');(s||d).scrollIntoView({block:'start'})},60)}
pts.addEventListener('click',function(e){e.stopPropagation();var pn=$('painel-aparencia'),bt=$('aparencia-btn');if(pn&&pn.hidden&&bt)bt.click();abreDet(document.querySelector('#painel-aparencia details.menu-shop'))});
[].forEach.call(box.querySelectorAll('[data-menu]'),function(t){t.addEventListener('click',function(){
abreMenu();var nome=t.dataset.menu;
abreDet([].filter.call(document.querySelectorAll('#menu details.menu-grupo'),function(d){var s=d.querySelector('summary');return s&&s.textContent.trim().toUpperCase()===nome})[0])})});
var raf=0;
function atualiza(){pontos();sincCont()}
function agenda(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;atualiza()})}
if(window.MutationObserver){var mo=new MutationObserver(agenda);
var lj=$('loja');if(lj)mo.observe(lj,{childList:true,subtree:true});
if(cl)mo.observe(cl,{attributes:true,attributeFilter:['hidden'],childList:true,characterData:true,subtree:true})}
var shop=document.querySelector('#painel-aparencia details.menu-shop');if(shop)shop.addEventListener('click',function(e){e.stopPropagation()});
document.addEventListener('visibilitychange',agenda);
atualiza();
})();
