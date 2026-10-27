(function(){
var R=document.documentElement,K='fm-fam',VAL=['padrao','elegante','classica','moderna','facil'],
bs=[].slice.call(document.querySelectorAll('[data-fam]'));
if(!bs.length)return;
function aplica(v,grava){
if(v==='padrao')delete R.dataset.fam;else R.dataset.fam=v;
bs.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.fam===v))});
if(grava){try{localStorage.setItem(K,v)}catch(e){}}}
var atual='padrao';try{var s=localStorage.getItem(K);if(VAL.indexOf(s)>-1)atual=s}catch(e){}
aplica(atual,false);
bs.forEach(function(b){b.addEventListener('click',function(){aplica(b.dataset.fam,true)})});
})();
