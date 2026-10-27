(function(){
var NOMES=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
var NOUN=['domingos','segundas-feiras','terças-feiras','quartas-feiras','quintas-feiras','sextas-feiras','sábados'];
var FRASE=['aos domingos','às segundas-feiras','às terças-feiras','às quartas-feiras','às quintas-feiras','às sextas-feiras','aos sábados'];
var sec=document.getElementById('painel-admin'),sel=document.getElementById('pa-dia'),st=document.getElementById('pa-st');
function valido(d){return typeof d==='number'&&d>=0&&d<=6&&Math.floor(d)===d}
function aplicaDia(d){
  if(!valido(d))return;
  window.fmDiaEsp=d;
  try{localStorage.setItem('fm-dia-esp',String(d))}catch(e){}
  sel.value=String(d);
  document.querySelectorAll('.dia-esp-n').forEach(function(e){e.textContent=NOUN[d]});
  document.querySelectorAll('.dia-esp-f').forEach(function(e){e.textContent=FRASE[d]});
}
try{var c=parseInt(localStorage.getItem('fm-dia-esp'),10);if(valido(c))aplicaDia(c)}catch(e){}
fetch('/api/config',{cache:'no-store'})
  .then(function(r){return r.ok?r.json():null})
  .then(function(j){if(j)aplicaDia(j.dia_terco_especial)})
  .catch(function(){});
fetch('/api/admin/config',{cache:'no-store',credentials:'same-origin'})
  .then(function(r){return r.ok?r.json():null})
  .then(function(j){if(!j)return;sec.hidden=false;aplicaDia(j.dia_terco_especial)})
  .catch(function(){});
document.getElementById('pa-form').addEventListener('submit',function(e){
  e.preventDefault();
  var d=parseInt(sel.value,10);
  st.textContent='Salvando…';
  fetch('/api/admin/config',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({dia_terco_especial:d})})
    .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
    .then(function(x){
      if(x.ok){aplicaDia(d);st.textContent='Salvo: '+NOMES[d]+' é o dia dos pontos para todos.'}
      else st.textContent=x.j.erro||'Não foi possível salvar.';
    })
    .catch(function(){st.textContent='Sem conexão com o servidor.'});
});
})();
