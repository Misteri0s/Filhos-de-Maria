(function(){
var $=function(i){return document.getElementById(i)},box=$('guiado');if(!box)return;
var NOME={gozosos:'Gozoso',luminosos:'Luminoso',dolorosos:'Doloroso',gloriosos:'Glorioso'},
passos=[],i=0,lock=null,ultimo=null,retomou=false;
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e}
function limpo(a){var d=a.querySelector(':scope>div')||a,c=d.cloneNode(true);
[].forEach.call(c.querySelectorAll('h3,button,.cta,.grupo,details,textarea,small,.conta-seta'),function(x){x.remove()});return c.innerHTML.trim()}
function art(sec,re){return [].filter.call(document.querySelectorAll('#'+sec+' article'),function(a){var h=a.querySelector('h3');return h&&re.test(h.textContent.trim())})[0]}
function titulo(a){var h=a.querySelector('h3');return h?h.textContent.replace(/\s*\([^)]*\)\s*$/,'').trim():''}
function contas(a){var c=a&&a.querySelector('.cta');return c?c.querySelectorAll('span.on').length:0}
function monta(){
passos=[];var set=(window.fmReza&&window.fmReza.hoje)||'gozosos',nm=NOME[set];
var pai=art('iniciais',/^Pai-Nosso/i),ave=art('iniciais',/^Ave-Maria/i),glo=art('iniciais',/^Gl[óo]ria/i);
[].forEach.call(document.querySelectorAll('#iniciais article'),function(a){var h=a.querySelector('h3');if(!h)return;
if(a.querySelector('textarea')){var ta=a.querySelector('textarea'),v=(ta.value||'').trim();
passos.push({sec:'Orações iniciais',tipo:'Intenções',t:'Suas intenções',html:v?'<p>'+v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</p>':'<p>Ofereça este terço pelas suas intenções e pelas de quem você ama.</p>'});return}
passos.push({sec:'Orações iniciais',tipo:'Oração',t:titulo(a),html:limpo(a),nota:/\(([^)]*vez[^)]*)\)/i.test(h.textContent)?'Rezar '+h.textContent.match(/\(([^)]*)\)/)[1]:''})});
var arts=[].slice.call(document.querySelectorAll('#'+set+' article'));
arts.forEach(function(a,k){var n=k+1,h=a.querySelector('h3'),sm=a.querySelector('small'),b=a.querySelector('b'),sec=n+'º Mistério '+nm+' · '+n+' de '+arts.length;
passos.push({sec:sec,m:n,tipo:(b?b.textContent+' ':'')+'Mistério '+nm,t:h?h.textContent.trim():'',ref:sm?sm.textContent.trim():'',html:limpo(a),art:a,kind:'misterio'});
if(pai)passos.push({sec:sec,m:n,tipo:'Oração',t:'Pai-Nosso',html:limpo(pai)});
passos.push({sec:sec,m:n,tipo:'Ave-Marias',t:'Dez Ave-Marias',html:ave?limpo(ave):'',art:a,kind:'conta'});
if(glo)passos.push({sec:sec,m:n,tipo:'Oração',t:'Glória',html:limpo(glo)})});
[].forEach.call(document.querySelectorAll('#finais article'),function(a){var h=a.querySelector('h3');if(!h)return;
passos.push({sec:'Orações finais',tipo:'Oração',t:titulo(a),html:limpo(a),nota:/\(([^)]*vez[^)]*)\)/i.test(h.textContent)?'Rezar '+h.textContent.match(/\(([^)]*)\)/)[1]:''})});
passos.push({sec:'Orações finais',tipo:'Fim',t:'Terço concluído',html:'<p>Que Nossa Senhora leve suas orações a Jesus.</p><p>Você pode fechar, compartilhar com alguém ou voltar a rezar quando quiser.</p>',fim:true})}
function inicio(){var primeiro=null,soma=0;
passos.forEach(function(p,k){if(p.kind==='conta'){var n=contas(p.art);soma+=n;if(primeiro===null&&n<10)primeiro=n>0?k:k-2}});
retomou=false;if(soma>0&&primeiro!==null&&primeiro>0){retomou=true;return primeiro}return 0}
function vib(p){try{if(navigator.vibrate)navigator.vibrate(p)}catch(e){}}
function pinta(){
var p=passos[i],card=$('gd-card');card.textContent='';
$('gd-info').textContent='';$('gd-info').appendChild(el('b','',p.sec));$('gd-info').appendChild(document.createTextNode('Passo '+(i+1)+' de '+passos.length));
$('gd-prog').style.width=Math.round((i+1)/passos.length*100)+'%';
card.appendChild(el('p','gd-tipo',p.tipo));card.appendChild(el('h2','',p.t));
if(p.ref)card.appendChild(el('p','gd-ref',p.ref));
if(p.kind==='conta'){
var n=contas(p.art),an=el('div','gd-anel'),bt=el('button');bt.type='button';bt.setAttribute('aria-label','Contar uma Ave-Maria');
bt.appendChild(el('b','',String(n)));bt.appendChild(el('span','','de 10'));bt.disabled=n>=10;an.style.setProperty('--g',(Math.min(n,10)*36)+'deg');
bt.addEventListener('click',function(){var c=p.art.querySelector('.cta');if(!c||contas(p.art)>=10)return;c.click();var m=contas(p.art);vib(m>=10?[60,50,60]:25);pinta()});
an.appendChild(bt);card.appendChild(an);
card.appendChild(el('p','gd-aviso',n>=10?'Dezena completa. Toque em Próxima.':'Toque no círculo a cada Ave-Maria rezada.'));
if(p.html){var q=el('div','gd-pq gd-txt');q.innerHTML=p.html;card.appendChild(q)}
}else{var t=el('div','gd-txt');t.innerHTML=p.html;card.appendChild(t);if(p.nota)card.appendChild(el('p','gd-aviso',p.nota+'.'))}
if(i===0&&retomou){}
if(retomou&&i===inicio_pos){var a=el('p','gd-aviso','Retomando de onde você parou. ');var r=el('button','','Recomeçar do início');r.type='button';r.addEventListener('click',function(){retomou=false;i=0;pinta()});a.appendChild(r);card.appendChild(a)}
var foco=card.querySelector('.gd-anel button');try{(foco&&!foco.disabled?foco:$('gd-prox')).focus({preventScroll:true})}catch(e){}
$('gd-ant').disabled=i===0;$('gd-prox').textContent=p.fim?'Concluir':'Próxima';
$('gd-card').parentNode.scrollTop=0}
var inicio_pos=0;
function proxima(){if(passos[i].fim){fecha();return}if(i<passos.length-1){i++;pinta()}}
function anterior(){if(i>0){i--;pinta()}}
async function acorda(){try{if(navigator.wakeLock&&!lock){lock=await navigator.wakeLock.request('screen');lock.addEventListener('release',function(){lock=null})}}catch(e){}}
function solta(){try{if(lock)lock.release()}catch(e){}lock=null}
function abre(){monta();i=inicio();inicio_pos=i;ultimo=document.activeElement;box.hidden=false;document.body.style.overflow='hidden';pinta();acorda()}
function fecha(){box.hidden=true;document.body.style.overflow='';solta();if(ultimo&&ultimo.focus)ultimo.focus()}
$('gd-prox').addEventListener('click',proxima);$('gd-ant').addEventListener('click',anterior);$('gd-x').addEventListener('click',fecha);
document.addEventListener('keydown',function(e){if(box.hidden)return;
if(e.key==='Escape'){fecha();return}
if(e.key==='ArrowRight'){e.preventDefault();proxima()}
else if(e.key==='ArrowLeft'){e.preventDefault();anterior()}
});
document.addEventListener('visibilitychange',function(){if(!box.hidden&&!document.hidden)acorda()});
var g=$('abrir-guiado');if(g)g.addEventListener('click',function(){var mx=$('mx');if(mx)mx.click();setTimeout(abre,150)});
window.fmGuiado={abre:abre};
})();
