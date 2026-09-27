const API='https://ubtojlrfxoxbuvgajeos.supabase.co/functions/v1/tradeup-public';
const $=id=>document.getElementById(id);
const ERROR_MESSAGES={
  QUERY_TOO_LONG:'A busca é longa demais. Use um termo mais curto.',
  REQUEST_URI_TOO_LONG:'A solicitação não pôde ser processada porque o endereço ficou longo demais.',
  RATE_LIMITED:'Muitas consultas em pouco tempo. Tente novamente em instantes.',
  ORIGIN_NOT_ALLOWED:'Este ambiente não está autorizado a consultar o catálogo.'
};
const clean=n=>String(n||'').replace(/^StatTrak™\s+/,'').replace(/^Souvenir\s+/,'');
const fmt=v=>v===null||v===undefined||v===''?'N/D':String(v);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const entityHref=x=>'skin/?key='+encodeURIComponent(x.market_key||x.skin_name||'');
function setState(text,error=false){const b=$('stateBox');b.textContent=text;b.className='state-box'+(error?' error':'')}
function art(item){
  if(item.image_url)return '<img src="'+esc(item.image_url)+'" alt="'+esc(clean(item.skin_name))+'" loading="lazy">';
  return '<span class="skin-meta">imagem N/D</span>';
}
function render(items){
  $('results').innerHTML=items.map(x=>'<a class="skin-card skin-link" href="'+entityHref(x)+'">'+art(x)+'<h3>'+esc(clean(x.skin_name))+'</h3><div class="skin-meta">'+esc(fmt(x.collection))+' · '+esc(fmt(x.rarity))+'</div><div class="skin-meta">float '+esc(fmt(x.float_min))+'–'+esc(fmt(x.float_max))+'</div><span class="card-action">Abrir página da skin →</span></a>').join('');
}
async function search(){
  const q=$('skinSearch').value.trim();
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
    setState(items.length?items.length+' resultado(s) do catálogo real. Abra uma skin para ver sua página de entidade.':'Nenhuma skin encontrada para esta busca.');
  }catch(e){render([]);setState('Falha de conexão ao consultar o catálogo. · NETWORK_ERROR',true)}
  finally{$('searchBtn').disabled=false;$('searchBtn').textContent='Buscar'}
}
$('searchBtn').onclick=search;
$('skinSearch').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
