(function(){
var el=document.getElementById('contador'),n=document.getElementById('contador-n');
if(!el||!n||!window.fetch)return;
var d=new Date(),hoje=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(),ja=false;
try{ja=localStorage.getItem('fm-visita')===hoje}catch(e){}
fetch('/api/visitas',{method:ja?'GET':'POST',cache:'no-store',credentials:'omit'})
.then(function(r){return r.ok?r.json():null})
.then(function(j){
if(!j||typeof j.total!=='number')return;
n.textContent=j.total.toLocaleString('pt-BR');el.hidden=false;
if(!ja){try{localStorage.setItem('fm-visita',hoje)}catch(e){}}})
.catch(function(){});
})();
