(function(){
var ab=[].slice.call(document.querySelectorAll('[role=tab]')),
ps=ab.map(function(t){return document.getElementById(t.dataset.s)}),
dia={0:'gloriosos',1:'gozosos',2:'dolorosos',3:'gloriosos',4:'luminosos',5:'dolorosos',6:'gozosos'},
hoje=dia[new Date().getDay()];
function abrir(id,foco){
ab.forEach(function(t,i){var on=t.dataset.s===id;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;ps[i].hidden=!on;if(on&&foco)t.focus()});
}
ab.forEach(function(t,i){
if(t.dataset.s===hoje)t.setAttribute('data-hoje','');
t.addEventListener('click',function(){abrir(t.dataset.s)});
t.addEventListener('keydown',function(e){
var k=e.key,n=k==='ArrowRight'?i+1:k==='ArrowLeft'?i-1:k==='Home'?0:k==='End'?ab.length-1:null;
if(n===null)return;e.preventDefault();abrir(ab[(n+ab.length)%ab.length].dataset.s,true);
});
});
var h=location.hash.slice(1),ok=ab.some(function(t){return t.dataset.s===h});
abrir(ok?h:hoje);window.abrirAba=abrir;window.abaHoje=hoje;
if(ok)document.getElementById(h).scrollIntoView();
})();
