const API='https://ubtojlrfxoxbuvgajeos.supabase.co/functions/v1/tradeup-public';
const PAGE_SIZE=24;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=v=>v===null||v===undefined||v===''?'N/D':String(v);
const ERROR_MESSAGES={QUERY_TOO_LONG:'A busca é longa demais. Use um termo mais curto.',REQUEST_URI_TOO_LONG:'Este endereço ficou longo demais para ser processado.',RATE_LIMITED:'Muitas consultas em pouco tempo. Tente novamente em instantes.',ORIGIN_NOT_ALLOWED:'Este ambiente não está autorizado a consultar o catálogo.',INVALID_STATTRAK_FILTER:'O filtro StatTrak não pôde ser aplicado.'};
const state={q:'',collection:'',rarity:'',hasStattrak:'',hasConsumer:'',sort:'default',items:[],loading:false,hasMore:false,nextOffset:null,controller:null,seq:0};
function rarityMark(rarity,size='dense'){const r=fmt(rarity);return '<span class="rarity-mark '+size+'" data-rarity="'+esc(r)+'"><span>'+esc(r)+'</span></span>';}
function collectionIdentity(name,size='standard'){const c=fmt(name);return '<span class="collection-identity '+size+'" title="'+esc(c)+'"><span class="collection-plate" aria-hidden="true">S</span><span class="collection-name">'+esc(c)+'</span></span>';}
function boolLabel(v){return v===true?'Sim':v===false?'Não':'N/D';}
function freshness(v){if(v===null||v===undefined||v==='')return 'N/D';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString('pt-BR');}
function currentUrl(){const p=new URLSearchParams();if(state.q)p.set('q',state.q);if(state.collection)p.set('collection',state.collection);if(state.rarity)p.set('rarity',state.rarity);if(state.hasStattrak!=='')p.set('has_stattrak',state.hasStattrak);if(state.hasConsumer!=='')p.set('has_consumer_grade',state.hasConsumer);if(state.sort!=='default')p.set('sort',state.sort);if(state.items.length>PAGE_SIZE)p.set('loaded',String(state.items.length));return location.pathname+(p.toString()?'?'+p.toString():'');}
function hubHref(x){const name=x.collection_name||x.collection_key||'';return 'collection/?collection='+encodeURIComponent(name)+'&from='+encodeURIComponent(currentUrl());}
function syncUrl(){history.replaceState(null,'',currentUrl());}
function buildParams(offset=0){const p=new URLSearchParams();p.set('entity','collection');if(state.q)p.set('q',state.q);if(state.collection)p.set('collection',state.collection);if(state.rarity)p.set('rarity',state.rarity);if(state.hasStattrak!=='')p.set('has_stattrak',state.hasStattrak);if(state.hasConsumer!=='')p.set('has_consumer_grade',state.hasConsumer);p.set('limit',String(PAGE_SIZE));p.set('offset',String(offset));p.set('sort',state.sort);return p;}
function setState(title,detail='',error=false){const b=$('stateBox');b.hidden=false;b.className='state-box'+(error?' error':'');b.innerHTML='<strong>'+esc(title)+'</strong>'+(detail?'<span>'+esc(detail)+'</span>':'');}
function render(items){state.items=items;$('results').innerHTML=items.map(x=>{
  const rarities=Array.isArray(x.rarities_present)&&x.rarities_present.length?x.rarities_present.map(r=>rarityMark(r)).join(''):'<span class="collection-nd">N/D</span>';
  return '<article class="collection-card"><a class="collection-card-main" href="'+hubHref(x)+'"><div class="collection-card-head">'+collectionIdentity(x.collection_name||x.collection_key,'standard')+'<span class="card-action">Abrir coleção →</span></div><div class="collection-metrics"><div><span>Skins</span><strong>'+esc(fmt(x.skin_count))+'</strong></div><div><span>Variantes</span><strong>'+esc(fmt(x.variant_count))+'</strong></div><div><span>StatTrak</span><strong>'+esc(boolLabel(x.has_stattrak))+'</strong></div><div><span>Consumer Grade</span><strong>'+esc(boolLabel(x.has_consumer_grade))+'</strong></div></div><div class="collection-rarities"><span>Raridades presentes</span><div class="rarity-list">'+rarities+'</div></div><div class="collection-freshness"><span>Catálogo atualizado</span><strong>'+esc(freshness(x.catalog_updated_at))+'</strong></div></a></article>';
 }).join('');}
function updateControls(){ $('collectionSearch').value=state.q;$('collectionFilter').value=state.collection;$('rarityFilter').value=state.rarity;$('sortSelect').value=state.sort;document.querySelectorAll('[data-st]').forEach(b=>b.classList.toggle('active',b.dataset.st===state.hasStattrak));document.querySelectorAll('[data-consumer]').forEach(b=>b.classList.toggle('active',b.dataset.consumer===state.hasConsumer));}
function updatePagination(){const b=$('loadMoreBtn');b.hidden=!state.hasMore;b.disabled=state.loading;b.textContent=state.loading?'Carregando…':'Carregar mais';}
async function fetchPage({append=false,offset=0,silent=false}={}){
 const seq=++state.seq;if(state.controller)state.controller.abort();state.controller=new AbortController();state.loading=true;updatePagination();$('searchBtn').disabled=true;
 if(!silent)setState(append?'Carregando mais coleções…':'Carregando coleções…');
 try{
  const r=await fetch(API+'?'+buildParams(offset).toString(),{signal:state.controller.signal});
  const d=await r.json().catch(()=>({status:'ERROR',error:'INVALID_RESPONSE'}));
  if(seq!==state.seq)return false;
  if(!r.ok||d.status==='ERROR'){const code=d.error||('HTTP_'+r.status);if(!append)render([]);state.hasMore=false;state.nextOffset=null;$('resultsTitle').textContent='Não foi possível carregar as coleções.';$('resultsMeta').textContent='Seus filtros foram preservados';setState(ERROR_MESSAGES[code]||'Não foi possível carregar as coleções.','',true);return false;}
  const page=Array.isArray(d.items)?d.items:[];const merged=append?[...state.items,...page]:page;render(merged);
  const pg=d.pagination||{};state.hasMore=pg.has_more===true;state.nextOffset=Number.isFinite(Number(pg.next_offset))?Number(pg.next_offset):null;
  if(merged.length){$('resultsTitle').textContent=merged.length+' coleções carregadas';$('resultsMeta').textContent='Ordenação: '+state.sort+(state.hasMore?' · há mais resultados':'');setState(state.hasMore?'Continue explorando ou carregue a próxima página.':'Todos os resultados desta consulta foram carregados.');}
  else{$('resultsTitle').textContent='Nenhuma coleção encontrada.';$('resultsMeta').textContent='Consulta concluída';setState('Nenhuma coleção encontrada para os filtros atuais.');}
  syncUrl();return true;
 }catch(e){if(e?.name==='AbortError')return false;if(!append)render([]);state.hasMore=false;state.nextOffset=null;$('resultsTitle').textContent='Não foi possível carregar as coleções.';setState('Não foi possível carregar as coleções.','',true);return false;}
 finally{if(seq===state.seq){state.loading=false;updatePagination();$('searchBtn').disabled=false;}}
}
function loadFromUrl(){const p=new URLSearchParams(location.search);state.q=p.get('q')||'';state.collection=p.get('collection')||'';state.rarity=p.get('rarity')||'';state.hasStattrak=['true','false'].includes(p.get('has_stattrak'))?p.get('has_stattrak'):'';state.hasConsumer=['true','false'].includes(p.get('has_consumer_grade'))?p.get('has_consumer_grade'):'';state.sort=['default','name_asc','name_desc'].includes(p.get('sort'))?p.get('sort'):'default';updateControls();fetchPage();}
function apply(){state.q=$('collectionSearch').value.trim();state.collection=$('collectionFilter').value.trim();state.rarity=$('rarityFilter').value;state.sort=$('sortSelect').value;state.items=[];fetchPage();}
$('searchBtn').onclick=apply;$('collectionSearch').addEventListener('keydown',e=>{if(e.key==='Enter')apply();});$('applyCollectionFilter').onclick=apply;$('rarityFilter').onchange=apply;$('sortSelect').onchange=apply;
document.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{state.hasStattrak=b.dataset.st;updateControls();state.items=[];fetchPage();});
document.querySelectorAll('[data-consumer]').forEach(b=>b.onclick=()=>{state.hasConsumer=b.dataset.consumer;updateControls();state.items=[];fetchPage();});
$('filterToggle').onclick=()=>{const p=$('filtersPanel');p.hidden=!p.hidden;$('filterToggle').setAttribute('aria-expanded',String(!p.hidden));};
$('clearBtn').onclick=()=>{state.q='';state.collection='';state.rarity='';state.hasStattrak='';state.hasConsumer='';state.sort='default';state.items=[];updateControls();fetchPage();};
$('loadMoreBtn').onclick=()=>{if(state.hasMore&&state.nextOffset!==null&&!state.loading)fetchPage({append:true,offset:state.nextOffset});};
addEventListener('popstate',loadFromUrl);loadFromUrl();