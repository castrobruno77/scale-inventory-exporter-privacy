const API='https://ubtojlrfxoxbuvgajeos.supabase.co/functions/v1/tradeup-public';
const $=id=>document.getElementById(id);
const ERROR_MESSAGES={
  QUERY_TOO_LONG:'A busca é longa demais. Use um termo mais curto.',
  REQUEST_URI_TOO_LONG:'A solicitação não pôde ser processada porque o endereço ficou longo demais.',
  RATE_LIMITED:'Muitas consultas em pouco tempo. Tente novamente em instantes.',
  ORIGIN_NOT_ALLOWED:'Este ambiente não está autorizado a consultar o catálogo.'
};
let lastItems=[];
const clean=n=>String(n||'').replace(/^StatTrak™\s+/,'').replace(/^Souvenir\s+/,'');
function fmt(v){return v===null||v===undefined||v===''?'N/D':String(v)}
function setState(text,error=false){const b=$('stateBox');b.textContent=text;b.className='state-box'+(error?' error':'')}
function art(item){
  if(item.image_url)return '<img src="'+item.image_url+'" alt="'+clean(item.skin_name)+'" loading="lazy">';
  return '<span class="skin-meta">imagem N/D</span>';
}
function render(items){
  lastItems=items;
  $('results').innerHTML=items.map((x,i)=>'<button class="skin-card" type="button" data-index="'+i+'">'+art(x)+'<h3>'+clean(x.skin_name)+'</h3><div class="skin-meta">'+fmt(x.collection)+' · '+fmt(x.rarity)+'</div><div class="skin-meta">float '+fmt(x.float_min)+'–'+fmt(x.float_max)+'</div></button>').join('');
  document.querySelectorAll('[data-index]').forEach(btn=>btn.onclick=()=>openHub(lastItems[Number(btn.dataset.index)]));
}
function openHub(x){
  $('skinHub').hidden=false;
  $('hubArt').innerHTML=art(x);
  $('hubName').textContent=clean(x.skin_name)||'N/D';
  $('hubCollection').textContent=fmt(x.collection);
  $('hubRarity').textContent=fmt(x.rarity);
  $('hubFloatMin').textContent=fmt(x.float_min);
  $('hubFloatMax').textContent=fmt(x.float_max);
  $('skinHub').scrollIntoView({behavior:'smooth',block:'start'});
}
async function search(){
  const q=$('skinSearch').value.trim();
  $('skinHub').hidden=true;
  if(q.length<2){render([]);setState('Digite ao menos 2 caracteres para buscar.',true);return}
  $('searchBtn').disabled=true;$('searchBtn').textContent='Buscando…';setState('Consultando catálogo autorizado…');
  try{
    const r=await fetch(API+'?q='+encodeURIComponent(q)+'&limit=18&ui=1');
    const d=await r.json().catch(()=>({status:'ERROR',error:'INVALID_RESPONSE'}));
    if(!r.ok||d.status==='ERROR'){
      const code=d.error||('HTTP_'+r.status);
      render([]);setState((ERROR_MESSAGES[code]||'Não foi possível consultar o catálogo.')+' · '+code,true);return;
    }
    const items=Array.isArray(d.items)?d.items:[];
    render(items);
    setState(items.length?items.length+' resultado(s) do catálogo real. Selecione uma skin para abrir o hub preview.':'Nenhuma skin encontrada para esta busca.');
  }catch(e){render([]);setState('Falha de conexão ao consultar o catálogo. · NETWORK_ERROR',true)}
  finally{$('searchBtn').disabled=false;$('searchBtn').textContent='Buscar'}
}
$('searchBtn').onclick=search;
$('skinSearch').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
