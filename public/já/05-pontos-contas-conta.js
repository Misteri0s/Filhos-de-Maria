(function(){
var R=document.documentElement,$=function(i){return document.getElementById(i)},
S={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var intro=$('intro');
if(intro){var im=intro.querySelector('img'),lg=document.querySelector('header img.logo');if(im&&lg)im.src=lg.src;
intro.addEventListener('click',function(){intro.classList.add('fim')});setTimeout(function(){intro.classList.add('fim')},2800)}
var av=$('aviso'),tav=null;
function aviso(t,ms){av.textContent=t;av.classList.add('on');clearTimeout(tav);tav=setTimeout(function(){av.classList.remove('on')},ms||2400)}
var CORES={padrao:['Padrão',0,''],perola:['Pérola',30,'radial-gradient(circle at 35% 30%,#fff,#e8e4dc 55%,#c9c1b2)'],madeira:['Madeira',50,'radial-gradient(circle at 35% 30%,#d9a56e,#9a6234 60%,#6b3f1d)'],ebano:['Ébano',70,'radial-gradient(circle at 35% 30%,#8a8a8a,#2b2b2b 55%,#050505)'],cristal:['Cristal',90,'radial-gradient(circle at 35% 30%,#fff,#bfe6ff 55%,#6fb9ee)'],rosa:['Rosa',110,'radial-gradient(circle at 35% 30%,#fff,#f6c6d4 55%,#d98aa6)'],prata:['Prata',130,'radial-gradient(circle at 35% 30%,#fff,#d9dde2 55%,#8c949e)'],turquesa:['Turquesa',150,'radial-gradient(circle at 35% 30%,#e6fffb,#5fd6c9 55%,#1f8f86)'],ambar:['Âmbar',170,'radial-gradient(circle at 35% 30%,#ffe9b0,#f0a82e 55%,#a35f0a)'],coral:['Coral',190,'radial-gradient(circle at 35% 30%,#ffe3dc,#f48a77 55%,#c0432f)'],esmeralda:['Esmeralda',210,'radial-gradient(circle at 35% 30%,#d9ffe8,#3fbf7b 55%,#12683b)'],ametista:['Ametista',230,'radial-gradient(circle at 35% 30%,#f1e4ff,#a77bdc 55%,#5d3a96)'],ouro:['Ouro',250,'radial-gradient(circle at 35% 30%,#fff3b0,#e0b84f 55%,#a77c1d)'],rubi:['Rubi',270,'radial-gradient(circle at 35% 30%,#ffd6dc,#d6304a 55%,#7a0f23)'],safira:['Safira',290,'radial-gradient(circle at 35% 30%,#d3e5ff,#4d7fd1 55%,#1b3a8a)']},
FORMAS={circulo:['●','Círculo',''],arredondada:['■','Arredondada',''],oval:['⬭','Oval','ellipse(50% 38% at 50% 50%)'],losango:['◆','Losango','polygon(50% 0,100% 50%,50% 100%,0 50%)'],coracao:['♥','Coração','polygon(50% 90%,10% 50%,5% 30%,15% 12%,32% 8%,50% 25%,68% 8%,85% 12%,95% 30%,90% 50%)'],estrela:['★','Estrela','polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)'],cruz:['✚','Cruz','polygon(35% 0,65% 0,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0 65%,0 35%,35% 35%)'],hexagono:['⬡','Hexágono','polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)'],flor:['✿','Flor','polygon(50% 0,62% 25%,88% 12%,75% 38%,100% 50%,75% 62%,88% 88%,62% 75%,50% 100%,38% 75%,12% 88%,25% 62%,0 50%,25% 38%,12% 12%,38% 25%)'],triangulo:['▲','Triângulo','polygon(50% 0,100% 100%,0 100%)'],pentagono:['⬟','Pentágono','polygon(50% 0,98% 35%,80% 100%,20% 100%,2% 35%)'],octogono:['⯃','Octógono','polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)'],gota:['♦','Gota','polygon(50% 0,88% 40%,92% 58%,82% 80%,65% 95%,50% 100%,35% 95%,18% 80%,8% 58%,12% 40%)'],sol:['✹','Sol','polygon(50% 0,60% 25%,82% 8%,75% 35%,100% 40%,78% 55%,95% 78%,68% 72%,58% 100%,45% 76%,20% 92%,27% 65%,0 52%,24% 40%,12% 14%,40% 27%)']},
TEXTURAS={lisa:['Lisa',0],perolada:['Perolada',10],listrada:['Listrada',10],pontilhada:['Pontilhada',10],marmorizada:['Marmorizada',10],brilhante:['Brilhante',10],trancada:['Trançada',10]};
function lerP(){try{var o=JSON.parse(S.get('fm-p'));if(o&&typeof o.p==='number'&&o.own&&CONTAS_OK(o)){if(!FORMAS[o.fo])o.fo='circulo';if(!o.b)o.b=[];if(!o.t)o.t={};if(!o.tox)o.tox=['lisa'];if(!TEXTURAS[o.tx]||o.tox.indexOf(o.tx)<0)o.tx='lisa';return o}}catch(e){}return{p:0,own:['padrao'],sel:'padrao',fo:'circulo',tx:'lisa',tox:['lisa'],d:'',t:{},b:[]}}
function CONTAS_OK(o){return !!CORES[o.sel]}
var P=lerP();
function salvaP(ns){S.set('fm-p',JSON.stringify(P));if(!ns&&window.fmAgenda)window.fmAgenda()}
function usaConta(){if(P.sel==='padrao'){delete R.dataset.contas;R.style.removeProperty('--conta');R.style.removeProperty('--conta-base')}else{R.dataset.contas=P.sel;R.style.setProperty('--conta',CORES[P.sel][2]);var c=CORES[P.sel][2].match(/#[0-9a-f]{6}(?!.*#[0-9a-f]{6})/i);R.style.setProperty('--conta-base',c?c[0]:'var(--glow)')}}
function usaTextura(){if(!TEXTURAS[P.tx]||P.tox.indexOf(P.tx)<0)P.tx='lisa';if(P.tx==='lisa')delete R.dataset.textura;else R.dataset.textura=P.tx}
function usaForma(){var pol=FORMAS[P.fo][2];if(P.fo==='circulo'){delete R.dataset.forma;R.style.removeProperty('--forma')}else{R.dataset.forma=P.fo;if(pol)R.style.setProperty('--forma',pol);else R.style.removeProperty('--forma')}}
function est(cor,fo){var g=CORES[cor][2],s=fo==='circulo'?'border-radius:50%;':fo==='arredondada'?'border-radius:30%;':'border-radius:0;clip-path:'+FORMAS[fo][2]+';';
if(g)s+='background:'+g+';border-color:transparent;';else if(fo!=='circulo')s+='background:var(--glow);border-color:transparent;';return s}
function desenhaLoja(){var h='<p class="pts">Pontos: <b>'+P.p+'</b></p><p class="rot">Forma das contas (grátis)</p><div>';
Object.keys(FORMAS).forEach(function(k){h+='<button type="button" class="chip" data-loja="forma" data-v="'+k+'" aria-pressed="'+(P.fo===k)+'">'+FORMAS[k][0]+' '+FORMAS[k][1]+'</button>'});
h+='</div><p class="rot">Texturas extras (10 pontos cada; Lisa é grátis)</p><div class="texturas">';
Object.keys(TEXTURAS).forEach(function(k){var t=TEXTURAS[k],tem=P.tox.indexOf(k)>-1,em=P.tx===k;h+='<button type="button" class="chip textura-op" data-loja="'+(tem?'textura-usar':'textura-comprar')+'" data-v="'+k+'" aria-pressed="'+(tem&&em)+'"'+(!tem&&P.p<t[1]?' disabled':'')+'><i class="textura-amostra textura-'+k+'"></i> '+t[0]+(tem?(em?' · Em uso':' · Usar'):' · '+t[1]+' pontos')+'</button>'});
h+='</div><p class="rot">Cor das contas (conquiste com pontos)</p><div class="cores">';
Object.keys(CORES).forEach(function(k){var c=CORES[k],tem=P.own.indexOf(k)>-1,em=P.sel===k,st=est(k,P.fo);
h+='<div class="cor"><span class="amostra"><i style="'+st+'"></i><i style="'+st+'"></i><i style="'+st+'"></i></span><span class="nm">'+c[0]+'</span>'+(tem?'<button type="button" class="chip" data-loja="usar" data-v="'+k+'" aria-pressed="'+em+'">'+(em?'Em uso':'Usar')+'</button>':'<button type="button" class="chip" data-loja="comprar" data-v="'+k+'"'+(P.p<c[1]?' disabled':'')+'>'+c[1]+' pontos</button>')+'</div>'});
$('loja').innerHTML=h+'</div>'}
$('loja').addEventListener('click',function(e){var b=e.target.closest('[data-loja]');if(!b)return;var k=b.dataset.v,a=b.dataset.loja;
if(a==='forma'){P.fo=k}else if(a==='textura-usar'){P.tx=k}else if(a==='textura-comprar'){var pt=TEXTURAS[k][1];if(P.p<pt||P.tox.indexOf(k)>-1)return;P.p-=pt;P.tox.push(k);P.tx=k;aviso('Textura '+TEXTURAS[k][0].toLowerCase()+' conquistada')}else{if(a==='comprar'){var pr=CORES[k][1];if(P.p<pr||P.own.indexOf(k)>-1)return;P.p-=pr;P.own.push(k);aviso('Contas '+CORES[k][0].toLowerCase()+' conquistadas')}P.sel=k}
salvaP();usaConta();usaForma();usaTextura();desenhaLoja()});
function dia(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
var NOMES={gozosos:'Gozosos',luminosos:'Luminosos',dolorosos:'Dolorosos',gloriosos:'Gloriosos'};
function flutua(a,t){var b=a&&a.querySelector('.cta');if(!b)return;var r=b.getBoundingClientRect(),m=document.createElement('span');m.className='mais';m.textContent=t;m.style.left=Math.max(8,r.right-44)+'px';m.style.top=(r.top+6)+'px';document.body.appendChild(m);setTimeout(function(){m.remove()},1000)}
window.fmTap=function(k,n,a){var set=k.split(':')[0],sab=new Date().getDay()===(window.fmDiaEsp??6),hs=window.abaHoje,agora=Date.now();
if(P.d!==dia()){P.d=dia();P.t={};P.b=[]}
P.t=P.t||{};P.b=P.b||[];
if(!sab&&set!==hs){if(n===1)aviso('Hoje os pontos valem só para os Mistérios '+NOMES[hs]+'. Você pode rezar este sem pontos.',3400);return}
if(n<=(P.t[k]||0))return;
if(agora-(P.l||0)<4000){if(agora-(P.w||0)>3000){P.w=agora;aviso('Reze com calma: 1 ponto a cada 4 segundos, no mínimo.',2600)}return}
P.l=agora;P.t[k]=n;var g=1,msg='+1 ponto';
if(n===10){g=10;msg='+10 pontos: dezena completa';
var feitas=Object.keys(P.t).filter(function(x){return x.indexOf(set+':')===0&&P.t[x]>=10}).length;
if(feitas===5&&P.b.indexOf('t:'+set)<0){P.b.push('t:'+set);g+=5;msg='+'+g+' pontos: terço completo'}
var tot=Object.keys(P.t).filter(function(x){return P.t[x]>=10}).length;
if(sab&&tot>=20&&P.b.indexOf('r')<0){P.b.push('r');g+=10;msg='+'+g+' pontos: rosário completo'}}
P.p+=g;salvaP();desenhaLoja();if(msg.indexOf('terço')>-1||msg.indexOf('rosário')>-1)aviso(msg,2800);else flutua(a,'+'+g)};
window.fmUndo=function(k,oldN,newN){if(P.d!==dia())return;P.t=P.t||{};P.b=P.b||[];if((P.t[k]||0)!==oldN)return;var set=k.split(':')[0],retirar=oldN===10?10:1;P.p=Math.max(0,P.p-retirar);P.t[k]=newN;var feitas=Object.keys(P.t).filter(function(x){return x.indexOf(set+':')===0&&P.t[x]>=10}).length;if(feitas<5&&P.b.indexOf('t:'+set)>-1){P.b.splice(P.b.indexOf('t:'+set),1);P.p=Math.max(0,P.p-5);retirar+=5}var tot=Object.keys(P.t).filter(function(x){return P.t[x]>=10}).length;if(tot<20&&P.b.indexOf('r')>-1){P.b.splice(P.b.indexOf('r'),1);P.p=Math.max(0,P.p-10);retirar+=10}salvaP();desenhaLoja();aviso('Contagem corrigida'+(retirar?' · '+retirar+' ponto(s) devolvido(s)':''),1800)};
usaConta();usaForma();usaTextura();desenhaLoja();
var ct={u:null,tmr:null},stt=$('ct-st');
function msg(t){stt.textContent=t||''}
function off(){msg('Contas indisponíveis neste endereço no momento.')}
function api(m,u,c){return fetch('/api/'+u,{method:m,credentials:'same-origin',headers:{'Content-Type':'application/json'},body:c?JSON.stringify(c):undefined}).then(function(r){if((r.headers.get('content-type')||'').indexOf('json')<0)throw new Error('off');return r.json().then(function(j){j._s=r.status;return j})})}
function dadosLocais(){return{v:1,p:P}}
function funde(a){if(!a||!a.p||typeof a.p.p!=='number')return false;var b=a.p,base=b.p>P.p?b:P,r=JSON.parse(JSON.stringify(base)),own=(P.own||[]).concat(b.own||[]).filter(function(x,i,l){return CORES[x]&&l.indexOf(x)===i});
r.own=own.length?own:['padrao'];r.p=Math.max(P.p,b.p);if(!CORES[r.sel]||r.own.indexOf(r.sel)<0)r.sel='padrao';if(!FORMAS[r.fo])r.fo='circulo';var tox=(P.tox||['lisa']).concat(b.tox||[]).filter(function(x,i,l){return TEXTURAS[x]&&l.indexOf(x)===i});r.tox=tox.length?tox:['lisa'];if(!TEXTURAS[r.tx]||r.tox.indexOf(r.tx)<0)r.tx='lisa';r.t=r.t||{};r.b=r.b||[];P=r;salvaP(true);
usaConta();usaForma();usaTextura();desenhaLoja();return true}
function ctUI(){$('ct-fora').hidden=!!ct.u;$('ct-dentro').hidden=!ct.u;$('ct-nome').textContent=ct.u||''}
function agenda(){if(!ct.u)return;clearTimeout(ct.tmr);ct.tmr=setTimeout(envia,3000)}
function envia(){if(!ct.u)return Promise.resolve();return api('PUT','progresso',{dados:dadosLocais()}).then(function(j){if(j._s===401){ct.u=null;ctUI();msg('Sua sessão expirou. Entre de novo.')}}).catch(function(){})}
function copia(x,ok){function f(){var a=document.createElement('textarea');a.value=x;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy');aviso(ok)}catch(e){aviso('Não foi possível copiar')}a.remove()}
if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(x).then(function(){aviso(ok)},f);else f()}
$('ct-f1').addEventListener('submit',function(e){e.preventDefault();var u=$('ct-u').value.trim().toLowerCase(),s=$('ct-p1').value;
if(s.length<8){msg('A senha precisa ter pelo menos 8 caracteres.');return}
if(s.toLowerCase()===u){msg('A senha não pode ser igual ao usuário.');return}
msg('Criando a conta...');
api('POST','registrar',{usuario:u,senha:s}).then(function(j){if(j._s!==201){msg(j.erro||'Não foi possível criar a conta.');return}
ct.u=j.usuario;$('ct-p1').value='';
if(j.senha){$('ct-senha').textContent=j.senha;$('ct-nova').hidden=false;msg('Conta criada. Guarde a senha abaixo.')}
else msg('Conta criada. Lembre-se da sua senha: não há como recuperá-la.');
ctUI();envia()}).catch(off)});
$('ct-f2').addEventListener('submit',function(e){e.preventDefault();msg('Entrando...');
api('POST','entrar',{usuario:$('ct-u2').value,senha:$('ct-s').value}).then(function(j){if(j._s!==200){msg(j.erro||'Não foi possível entrar.');return}ct.u=j.usuario;$('ct-s').value='';ctUI();msg('Conectado.');if(j.dados)funde(j.dados);envia()}).catch(off)});
$('ct-cop').onclick=function(){copia($('ct-senha').textContent,'Senha copiada')};
$('ct-ok').onclick=function(){$('ct-nova').hidden=true;$('ct-senha').textContent=''};
$('ct-salva').onclick=function(){envia().then(function(){msg('Progresso salvo.')})};
$('ct-nsen').onclick=function(){var f=$('ct-f3');f.hidden=!f.hidden;if(!f.hidden)$('ct-np').focus()};
$('ct-f3').addEventListener('submit',function(e){e.preventDefault();var s=$('ct-np').value;
if(s.length<8){msg('A senha precisa ter pelo menos 8 caracteres.');return}
msg('Salvando...');
api('POST','nova-senha',{senha:s}).then(function(j){
if(j.senha){$('ct-senha').textContent=j.senha;$('ct-nova').hidden=false;msg('O servidor ainda gera a senha sozinho. Guarde a senha abaixo.')}
else if(j.ok){msg('Senha alterada.')}
else{msg(j.erro||'Não foi possível alterar a senha.');return}
$('ct-np').value='';$('ct-f3').hidden=true}).catch(off)});
$('ct-sair').onclick=function(){api('POST','sair',{}).then(function(){ct.u=null;ctUI();msg('Você saiu. Seus dados continuam neste aparelho.')}).catch(off)};
$('ct-exc').onclick=function(){var s=prompt('Para excluir a conta, digite a sua senha:');if(!s)return;api('DELETE','conta',{senha:s}).then(function(j){if(j.ok){ct.u=null;ctUI();msg('Conta excluída. Os dados continuam neste aparelho.')}else msg(j.erro||'Não foi possível excluir.')}).catch(off)};
api('GET','eu').then(function(j){var ok=j._s===200;if(ok){ct.u=j.usuario;ctUI();if(j.dados)funde(j.dados)}if(window.fmSessao)window.fmSessao(ok)}).catch(function(){if(window.fmSessao)window.fmSessao(false)});
function pascoa(y){var a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mes=Math.floor((h+l-7*m+114)/31),dd=((h+l-7*m+114)%31)+1;return new Date(y,mes-1,dd,12)}
function somaD(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n,12)}
function batismo(y){var e=new Date(y,0,2,12);while(e.getDay()!==0)e=somaD(e,1);return e.getDate()>=7?somaD(e,1):somaD(e,7)}
function tempo(h){var y=h.getFullYear(),t=new Date(y,h.getMonth(),h.getDate(),12),P0=pascoa(y),cin=somaD(P0,-46),qs=somaD(P0,-3),pe=somaD(P0,49),nat=new Date(y,11,25,12),adv=somaD(nat,-(nat.getDay()||7)-21);
if(t>=nat)return['Tempo do Natal','#c9a24b'];if(t>=adv)return['Tempo do Advento','#8a63c4'];if(t<=batismo(y))return['Tempo do Natal','#c9a24b'];if(t<cin)return['Tempo Comum','#3f9a62'];if(t<qs)return['Tempo da Quaresma','#8a63c4'];if(t<P0)return['Tríduo Pascal','#b83b3b'];if(t<=pe)return['Tempo Pascal','#c9a24b'];return['Tempo Comum','#3f9a62']}
window.fmTempo=tempo;
(function(){var r=tempo(new Date()),el=$('tempo'),i=document.createElement('i');i.style.background=r[1];el.appendChild(i);el.appendChild(document.createTextNode(r[0]))})();
addEventListener('beforeprint',function(){document.querySelectorAll('details.rec').forEach(function(d){d.dataset.ab=d.open?'1':'';d.open=true})});
addEventListener('afterprint',function(){document.querySelectorAll('details.rec').forEach(function(d){d.open=d.dataset.ab==='1'})});
window.fmAgenda=agenda;
var mn=$('menu'),fd=$('fundo'),hb=$('hb'),ult=null;
function abreMenu(){ult=document.activeElement;mn.hidden=false;fd.hidden=false;document.body.style.overflow='hidden';mn.focus()}
function fechaMenu(){if(mn.hidden)return;mn.hidden=true;fd.hidden=true;document.body.style.overflow='';if(ult&&ult.focus)ult.focus()}
mn.querySelectorAll('[data-ir]').forEach(function(b){b.addEventListener('click',function(){var t=$(b.dataset.ir);if(t){t.scrollIntoView({behavior:'smooth',block:'start'});var d=t.nextElementSibling;while(d&&d.tagName!=='DETAILS'&&d.tagName!=='H3')d=d.nextElementSibling;if(b.dataset.ir==='m-ex'&&d&&d.tagName==='DETAILS')d.open=true}})});
hb.addEventListener('click',abreMenu);$('mx').addEventListener('click',fechaMenu);fd.addEventListener('click',fechaMenu);
mn.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(){fechaMenu();var o=$('opcionais');if(o){var d=o.querySelector('details');if(d)d.open=true}})});
document.addEventListener('keydown',function(e){if(e.key==='Escape')fechaMenu()});
var EX=$('exame');
(function(){var g=null;$('exame-dados').textContent.split('\n').forEach(function(l){l=l.trim();if(!l)return;
if(l.charAt(0)==='#'){g=document.createElement('details');var s=document.createElement('summary');s.textContent=l.slice(1).trim();g.appendChild(s);EX.appendChild(g)}
else if(g){var lb=document.createElement('label'),i=document.createElement('input');lb.className='q';i.type='checkbox';lb.appendChild(i);lb.appendChild(document.createTextNode(' '+l));g.appendChild(lb)}})})();
function compila(){var t='EXAME DE CONSCIÊNCIA\nData: '+new Date().toLocaleDateString('pt-BR')+'\n(Documento pessoal. Apague depois da confissão.)\n',m='';
EX.querySelectorAll('details').forEach(function(d){var it=[].slice.call(d.querySelectorAll('input:checked')).map(function(i){return '- '+i.parentNode.textContent.trim()});if(it.length)m+='\n['+d.querySelector('summary').textContent+']\n'+it.join('\n')+'\n'});
if(m)t+='\nITENS MARCADOS'+m;var o=$('pec').value.trim();if(o)t+='\nPECADOS E OBSERVAÇÕES\n'+o+'\n';return t}
$('ex-c').addEventListener('click',function(){var t=compila();
function ok(){aviso('Texto copiado')}
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,function(){fallback(t)})}else fallback(t);
function fallback(x){var a=document.createElement('textarea');a.value=x;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(e){aviso('Não foi possível copiar')}a.remove()}});
$('ex-b').addEventListener('click',function(){var u=URL.createObjectURL(new Blob([compila()],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download='exame-de-consciencia.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000);aviso('Arquivo exportado')});
$('ex-l').addEventListener('click',function(){EX.querySelectorAll('input').forEach(function(i){i.checked=false});$('pec').value='';aviso('Exame limpo')});

})();
