(function(){
var root=document.documentElement,trigger=document.getElementById('aparencia-btn'),panel=document.getElementById('painel-aparencia'),close=document.getElementById('aparencia-fechar'),menos=document.getElementById('fonte-menos'),mais=document.getElementById('fonte-mais'),valor=document.getElementById('fonte-valor');
var temas=['claro','escuro','azul','roxo','rosa'],escalas=[.8,.9,1,1.1,1.2,1.3,1.4,1.5,1.65,1.8];
function get(k,fallback){try{var v=localStorage.getItem(k);return v===null?fallback:v}catch(e){return fallback}}
function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function fechar(devolverFoco){panel.hidden=true;trigger.setAttribute('aria-expanded','false');if(devolverFoco)trigger.focus()}
function tema(v){if(temas.indexOf(v)<0)v='claro';root.dataset.tema=v;set('fm-t',v);document.querySelectorAll('[data-tema-opcao]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.temaOpcao===v?'true':'false')})}
var escala=parseFloat(get('fm-z','1')),indice=escalas.indexOf(escala);if(indice<0){indice=2;for(var i=0;i<escalas.length;i++){if(Math.abs(escalas[i]-escala)<Math.abs(escalas[indice]-escala))indice=i}}
function fonte(){escala=escalas[indice];root.style.fontSize=(escala*100)+'%';set('fm-z',String(escala));valor.textContent=Math.round(escala*100)+'%';menos.disabled=indice===0;mais.disabled=indice===escalas.length-1}
trigger.addEventListener('click',function(e){e.stopPropagation();var abrir=panel.hidden;panel.hidden=!abrir;trigger.setAttribute('aria-expanded',abrir?'true':'false');if(abrir&&e.detail===0)menos.focus()});
close.addEventListener('click',function(){fechar(true)});
document.querySelectorAll('[data-tema-opcao]').forEach(function(b){b.addEventListener('click',function(){tema(b.dataset.temaOpcao)})});
menos.addEventListener('click',function(){if(indice>0){indice--;fonte()}});mais.addEventListener('click',function(){if(indice<escalas.length-1){indice++;fonte()}});
document.addEventListener('click',function(e){if(!panel.hidden&&!panel.contains(e.target)&&!trigger.contains(e.target))fechar(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!panel.hidden)fechar(true)});
tema(temas.indexOf(root.dataset.tema)>-1?root.dataset.tema:get('fm-t','claro'));fonte();
})();
