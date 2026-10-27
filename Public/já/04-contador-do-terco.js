(function(){
var R=document.documentElement,$=function(i){return document.getElementById(i)},
S={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var N={gozosos:'Gozosos',luminosos:'Luminosos',dolorosos:'Dolorosos',gloriosos:'Gloriosos'},
D=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'],
hj=$('hj'),id=window.abaHoje||'gozosos';
hj.textContent='Hoje, '+D[new Date().getDay()]+': Mistérios '+N[id];hj.href='#'+id;
hj.addEventListener('click',function(e){e.preventDefault();if(window.abrirAba)window.abrirAba(id);document.querySelector('.abas').scrollIntoView({behavior:'smooth'})});
var wl=null,tela=S.get('fm-w')!=='0',tl=$('tl');
function pedirTela(){if(!tela||wl||!navigator.wakeLock||document.visibilityState!=='visible')return;navigator.wakeLock.request('screen').then(function(l){wl=l;l.addEventListener('release',function(){wl=null})}).catch(function(){})}
document.addEventListener('visibilitychange',pedirTela);addEventListener('pointerdown',pedirTela,{passive:true});
if(!navigator.wakeLock)tl.hidden=true;
tl.setAttribute('aria-pressed',tela);
tl.onclick=function(){tela=!tela;S.set('fm-w',tela?'1':'0');tl.setAttribute('aria-pressed',tela);if(tela)pedirTela();else if(wl){wl.release();wl=null}};
var fala=window.speechSynthesis,falando=null,cont=new Map(),ui=new Map(),
SING={gozosos:'Gozoso',luminosos:'Luminoso',dolorosos:'Doloroso',gloriosos:'Glorioso'};
function TXT(n){return n===0?'Toque a cada Ave-Maria rezada':n<10?n+' de 10 Ave-Marias':'10 Ave-Marias. Agora o Glória e o “Ó meu Jesus”. Toque para zerar.'}
function pintaUm(b,n){b.querySelectorAll('span').forEach(function(s,k){s.classList.toggle('on',k<n)});b.querySelector('em').textContent=TXT(n);b.setAttribute('aria-label','Contador de Ave-Marias. '+TXT(n))}
function pinta(a){var n=cont.get(a)||0;ui.set(a,(ui.get(a)||[]).filter(function(b){return !b.dataset.tmp||document.body.contains(b)}));ui.get(a).forEach(function(b){pintaUm(b,n)})}
function contador(a,tmp){var grupo=document.createElement('div');grupo.className='controles-conta';var volta=document.createElement('button');volta.type='button';volta.className='conta-seta';volta.textContent='←';volta.title='Voltar uma conta';volta.setAttribute('aria-label','Voltar uma Ave-Maria');var b=document.createElement('button');b.type='button';b.className='cta';b.innerHTML=new Array(11).join('<span></span>')+'<em></em>';if(tmp)b.dataset.tmp='1';var avanca=document.createElement('button');avanca.type='button';avanca.className='conta-seta';avanca.textContent='→';avanca.title='Avançar uma conta';avanca.setAttribute('aria-label','Avançar uma Ave-Maria');grupo.appendChild(volta);grupo.appendChild(b);grupo.appendChild(avanca);
function proxima(reinicia){var n=cont.get(a)||0;if(n>=10){if(!reinicia)return;n=0}else n++;cont.set(a,n);pinta(a);salva(a);if(navigator.vibrate)navigator.vibrate(n===10?[20,40,20]:12)}
b.addEventListener('click',function(){proxima(true)});avanca.addEventListener('click',function(){proxima(false)});volta.addEventListener('click',function(){var n=cont.get(a)||0;if(n<=0)return;var novo=n-1;cont.set(a,novo);if(window.fmUndo)window.fmUndo(chave(a),n,novo);pinta(a);salva(a,true);if(navigator.vibrate)navigator.vibrate(8)});
if(!ui.has(a))ui.set(a,[]);ui.get(a).push(b);pintaUm(b,cont.get(a)||0);return grupo}
function parar(){if(fala)fala.cancel();if(falando){falando.setAttribute('aria-pressed','false');falando.lastChild.textContent='Ouvir meditação';falando=null}}
var vozes=[];
function carregaVozes(){vozes=fala?fala.getVoices():[]}
if(fala){carregaVozes();if(fala.addEventListener)fala.addEventListener('voiceschanged',carregaVozes)}
function vozPt(){var pt=vozes.filter(function(x){return /^pt([-_]|$)/i.test(x.lang)});return pt.filter(function(x){return /pt[-_]BR/i.test(x.lang)})[0]||pt[0]||null}
function ouvir(b,t){if(falando===b){parar();return}parar();carregaVozes();var v=vozPt();
if(vozes.length&&!v){b.dataset.d='Este aparelho não tem voz em português. Instale a voz “Português (Brasil)” nas configurações de voz do celular e tente de novo.';mostra(b);return}
var u=new SpeechSynthesisUtterance(t);u.lang='pt-BR';u.rate=.92;if(v){u.voice=v;u.lang=v.lang}
u.onend=u.onerror=function(){if(falando===b){b.setAttribute('aria-pressed','false');b.lastChild.textContent='Ouvir meditação';falando=null}};
falando=b;b.setAttribute('aria-pressed','true');b.lastChild.textContent='Parar';fala.speak(u)}
function vozBtn(f){var b=document.createElement('button');b.type='button';b.className='ouvir';b.setAttribute('aria-pressed','false');
b.setAttribute('aria-label','Ouvir esta meditação');b.innerHTML='<svg aria-hidden="true"><use href="#i-voz"/></svg><span>Ouvir meditação</span>';b.addEventListener('click',function(){ouvir(b,f())});return b}
function texto(a){return a.querySelector('h3').textContent+'. '+a.querySelector('p').textContent}
[].slice.call(document.querySelectorAll('[role=tabpanel] article')).forEach(function(a){var d=a.querySelector('div');if(fala)d.appendChild(vozBtn(function(){return texto(a)}));d.appendChild(contador(a))});
document.querySelector('.abas').addEventListener('click',parar);
function artigos(sel){return [].slice.call(document.querySelectorAll(sel+' article'))}
var ti=$('int');if(ti){ti.value=S.get('fm-int')||'';ti.addEventListener('input',function(){S.set('fm-int',ti.value)})}
var gcal=$('gcal'),ics=$('ics'),hora=$('hora'),blob=null;
function p2(x){return(x<10?'0':'')+x}
function loc(x){return x.getFullYear()+p2(x.getMonth()+1)+p2(x.getDate())+'T'+p2(x.getHours())+p2(x.getMinutes())+'00'}
function lembrete(){var h=(hora.value||'19:00').split(':'),d=new Date();d.setHours(+h[0],+h[1],0,0);if(d<new Date())d.setDate(d.getDate()+1);
var e=new Date(d.getTime()+20*60000),u=location.origin+location.pathname,tit='Rezar o Santo Rosário',des='Abra o site para ver os mistérios do dia: '+u,
L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Filhos de Maria//PT','BEGIN:VEVENT','UID:rosario-'+loc(d)+'@filhosdemaria','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z','DTSTART:'+loc(d),'DTEND:'+loc(e),'RRULE:FREQ=DAILY','SUMMARY:'+tit,'DESCRIPTION:'+des,'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+tit,'TRIGGER:PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'];
if(blob)URL.revokeObjectURL(blob);blob=URL.createObjectURL(new Blob([L.join('\r\n')],{type:'text/calendar'}));ics.href=blob;
gcal.href='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(tit)+'&details='+encodeURIComponent(des)+'&dates='+loc(d)+'/'+loc(e)+'&recur='+encodeURIComponent('RRULE:FREQ=DAILY')}
if(hora){hora.addEventListener('input',lembrete);lembrete()}
var ip=null,ins=$('ins');
addEventListener('beforeinstallprompt',function(e){e.preventDefault();ip=e;ins.hidden=false});
ins.onclick=function(){if(ip){ip.prompt();ip=null;ins.hidden=true}};
addEventListener('appinstalled',function(){ins.hidden=true});
if('serviceWorker' in navigator)addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
var KC='fm-c',cl=$('cont');
function chave(a){var sc=a.closest('section');return sc.id+':'+artigos('#'+sc.id).indexOf(a)}
function lerC(){try{var o=JSON.parse(S.get(KC));if(o&&Date.now()-o.t<43200000)return o}catch(e){}return{t:Date.now(),u:null,v:{}}}
function salva(a,semPontuar){var o=lerC(),n=cont.get(a)||0;o.t=Date.now();o.u=chave(a);o.v[o.u]=n;S.set(KC,JSON.stringify(o));mostraCont(o);if(!semPontuar&&n>0&&window.fmTap)window.fmTap(o.u,n,a)}
function mostraCont(o){if(!o.u){cl.hidden=true;return}var p=o.u.split(':'),lista=artigos('#'+p[0]),i=+p[1],n=o.v[o.u]||0;
if(n>=10){if(i+1>=lista.length){cl.hidden=true;return}i++;n=0}
var a=lista[i];cl.textContent='Continuar de onde parou: '+(i+1)+'º Mistério '+SING[p[0]]+(n?' ('+n+' de 10)':'');cl.hidden=false;
cl.onclick=function(e){e.preventDefault();window.abrirAba(p[0]);a.scrollIntoView({behavior:'smooth',block:'center'});a.classList.add('hl');setTimeout(function(){a.classList.remove('hl')},2400)}}
(function(){var o=lerC();Object.keys(o.v).forEach(function(k){var p=k.split(':'),a=artigos('#'+p[0])[+p[1]];if(a){cont.set(a,o.v[k]);pinta(a)}});mostraCont(o)})();
var MAR=[[1,1,'Santa Maria, Mãe de Deus'],[2,11,'Nossa Senhora de Lourdes'],[3,25,'Anunciação do Senhor'],[5,13,'Nossa Senhora de Fátima'],[5,31,'Visitação de Nossa Senhora'],[7,16,'Nossa Senhora do Carmo'],[8,15,'Assunção de Nossa Senhora'],[8,22,'Nossa Senhora Rainha'],[9,8,'Natividade de Nossa Senhora'],[9,15,'Nossa Senhora das Dores'],[10,7,'Nossa Senhora do Rosário'],[10,12,'Nossa Senhora Aparecida'],[11,21,'Apresentação de Nossa Senhora'],[12,8,'Imaculada Conceição'],[12,12,'Nossa Senhora de Guadalupe']];
(function(){var h=new Date(),t=new Date(h.getTime()+864e5),r=[];
MAR.forEach(function(m){if(m[0]===h.getMonth()+1&&m[1]===h.getDate())r.push('Hoje: '+m[2]);else if(m[0]===t.getMonth()+1&&m[1]===t.getDate())r.push('Amanhã: '+m[2])});
if(!r.length&&h.getMonth()===9)r.push('Outubro, mês do Santo Rosário');
$('mar').textContent=r.join(' | ');
$('evg').href='https://www.vaticannews.va/pt/palavra-do-dia/'+h.getFullYear()+'/'+p2(h.getMonth()+1)+'/'+p2(h.getDate())+'.html'})();
var bol=document.createElement('div');bol.id='bolha';bol.setAttribute('role','tooltip');bol.hidden=true;document.body.appendChild(bol);
function mostra(el){if(!bol.hidden&&bol._el===el){bol.hidden=true;return}bol._el=el;bol.textContent=el.dataset.d;bol.hidden=false;
var r=el.getBoundingClientRect(),w=bol.offsetWidth;bol.style.top=(r.bottom+scrollY+8)+'px';bol.style.left=Math.max(12,Math.min(r.left+scrollX,scrollX+innerWidth-w-12))+'px'}
document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('.termo');if(t)mostra(t);else bol.hidden=true});
document.addEventListener('keydown',function(e){if(e.key==='Escape')bol.hidden=true;else if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('termo')){e.preventDefault();mostra(e.target)}});
addEventListener('scroll',function(){bol.hidden=true},{passive:true});
var TIT={'Sinal da Cruz':'Gesto com que começamos a oração, em nome da Santíssima Trindade.','Intenções':'Os pedidos e as pessoas pelas quais oferecemos este Rosário.','Oferecimento':'Oração de abertura que une o nosso Rosário à Igreja e a Maria.','Creio':'O Credo: resumo da fé cristã, rezado no início.','Pai-Nosso':'A oração que o próprio Jesus ensinou aos discípulos.','Ave-Maria':'Saudação do anjo e de Isabel a Maria, com um pedido final de proteção.','Glória ao Pai':'Louvor à Santíssima Trindade, rezado ao fim de cada dezena.','Eterno Pai':'Oferecimento a Deus Pai pela Igreja e pela conversão dos homens.','Agradecimento':'Oração em que agradecemos a Nossa Senhora as graças recebidas.','Salve Rainha':'Antiga oração de louvor e súplica a Nossa Senhora, rezada ao fim do Rosário.','Santo Anjo':'Oração de confiança no anjo da guarda.','São Bento':'Oração da Cruz Sagrada, pedindo proteção contra o mal.','São Miguel':'Oração pedindo a proteção de São Miguel Arcanjo contra o mal.','Oração de Santa Gertrudes':'Oferecimento pelas almas do Purgatório, atribuído a Santa Gertrudes.','Bênção de Santa Clara':'Bênção em que pedimos a proteção e a paz de Deus.','Bênção de Nossa Senhora':'Bênção final em que pedimos a proteção de Maria e uma boa morte.'};
try{document.querySelectorAll('#iniciais article h3,#finais article h3').forEach(function(h){var t=h.textContent;Object.keys(TIT).some(function(k){if(t.indexOf(k)===0){h.className='termo';h.tabIndex=0;h.setAttribute('role','button');h.dataset.d=TIT[k];return true}})});
[['dezena','Cada grupo de 1 Pai-Nosso, 10 Ave-Marias e 1 Glória.'],['terço','Oração rezada com contas, que ajudam a contar as Ave-Marias.'],['contemplação','Meditar a cena com o coração, como quem a vê acontecer.'],['Ó meu Jesus','Pequena oração pedida em Fátima, rezada ao fim de cada dezena.']].forEach(function(x){
var ach=false;document.querySelectorAll('.guia,.comorezar p,.comorezar li').forEach(function(r){if(ach)return;var w=document.createTreeWalker(r,NodeFilter.SHOW_TEXT),n,re=new RegExp('(^|[^\\p{L}])('+x[0]+')(?![\\p{L}])','u');
while(n=w.nextNode()){var m=re.exec(n.nodeValue);if(m){var sp=document.createElement('span'),dp=n.splitText(m.index+m[1].length);sp.className='termo';sp.tabIndex=0;sp.setAttribute('role','button');sp.dataset.d=x[1];sp.textContent=m[2];dp.nodeValue=dp.nodeValue.slice(m[2].length);n.parentNode.insertBefore(sp,dp);ach=true;break}}})})}catch(e){}
var y=0,bar=$('barra');addEventListener('scroll',function(){var c=scrollY;bar.classList.toggle('off',c>y&&c>240);y=c},{passive:true});
})();
