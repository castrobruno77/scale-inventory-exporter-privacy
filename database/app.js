const API='https://ubtojlrfxoxbuvgajeos.supabase.co/functions/v1/tradeup-public';
const PAGE_SIZE=24;
const SUGGEST_LIMIT=8;
let suggestTimer=null;
let suggestSeq=0;
let suggestController=null;
let queryController=null;
let querySeq=0;
const $=id=>document.getElementById(id);
const ERROR_MESSAGES={QUERY_TOO_LONG:'A busca é longa demais. Use um termo mais curto.',REQUEST_URI_TOO_LONG:'A solicitação não pôde ser processada porque o endereço ficou longo demais.',RATE_LIMITED:'Muitas consultas em pouco tempo. Tente novamente em instantes.',ORIGIN_NOT_ALLOWED:'Este ambiente não está autorizado a consultar o catálogo.'};
const RARITIES=['Consumer Grade','Industrial Grade','Mil-Spec Grade','Restricted','Classified','Covert'];
const state={q:'',weapons:[],rarities:[],collections:[],stattrak:'',sort:'default',selectMode:false,selected:new Set(),items:[],loading:false,hasMore:false,nextOffset:null,restoreCount:0,loadoutSide:'',loadoutWeapon:'',loadoutFrom:'',lastSearchMode:'NONE',lastEffectiveSort:'default',fieldFilters:null};
const clean=n=>String(n||'').replace(/^StatTrak™\s+/,'').replace(/^Souvenir\s+/,'');
const fmt=v=>v===null||v===undefined||v===''?'N/D':String(v);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const weaponOf=item=>{const raw=String(item?.skin_name||item?.market_key||'').replace(/^StatTrak™\s+/,'');const i=raw.indexOf(' | ');return i>0?raw.slice(0,i):'N/D';};
const hasStructuralFilters=()=>state.weapons.length||state.rarities.length||state.collections.length||state.stattrak!=='';
const hasQuery=()=>state.q.trim().length>0||hasStructuralFilters();
const filterCount=()=>state.weapons.length+state.rarities.length+state.collections.length+(state.stattrak!==''?1:0);
const encodeList=a=>a.join('~');
const decodeList=s=>s?String(s).split('~').map(x=>x.trim()).filter(Boolean):[];
function currentContextUrl(){
 const u=new URL(location.href);u.search='';
 if(state.q)u.searchParams.set('q',state.q);
 if(state.weapons.length)u.searchParams.set('weapon',encodeList(state.weapons));
 if(state.rarities.length)u.searchParams.set('rarity',encodeList(state.rarities));
 if(state.collections.length)u.searchParams.set('collection',encodeList(state.collections));
 if(state.stattrak!=='')u.searchParams.set('stattrak',state.stattrak);
 if(state.sort!=='default')u.searchParams.set('sort',state.sort);
 if(state.selectMode)u.searchParams.set('select','1');
 if(state.items.length>PAGE_SIZE)u.searchParams.set('loaded',String(state.items.length));
 if(state.loadoutSide)u.searchParams.set('loadoutSide',state.loadoutSide);if(state.loadoutWeapon)u.searchParams.set('loadoutWeapon',state.loadoutWeapon);if(state.loadoutFrom)u.searchParams.set('loadoutFrom',state.loadoutFrom);
 return u.pathname+u.search;
}
function syncUrl(){history.replaceState(null,'',currentContextUrl());}
function entityHref(x){return 'skin/?key='+encodeURIComponent(x.market_key||x.skin_name||'')+'&from='+encodeURIComponent(currentContextUrl());}
function safeLocalPath(v){return v&&v.startsWith('/')&&!v.startsWith('//')?v:''}
function loadoutPickHref(x){if(!state.loadoutSide||!state.loadoutWeapon)return '';return '../loadout/?pick='+encodeURIComponent(x.market_key||x.skin_name||'')+'&side='+encodeURIComponent(state.loadoutSide)+'&weapon='+encodeURIComponent(state.loadoutWeapon)+'&from='+encodeURIComponent(currentContextUrl())}
function renderLoadoutContext(){
 const active=(state.loadoutSide==='CT'||state.loadoutSide==='T')&&state.loadoutWeapon;
 $('loadoutContext').hidden=!active;if(!active)return;
 $('loadoutContextTitle').textContent='Escolhendo para: '+state.loadoutSide+' · '+state.loadoutWeapon;
 $('loadoutContextHelper').textContent='Escolha uma skin desta arma para voltar ao rascunho temporário.';
 $('loadoutBackBtn').href=state.loadoutFrom||('../loadout/?side='+encodeURIComponent(state.loadoutSide)+'&focus='+encodeURIComponent(state.loadoutWeapon));
}
function setState(text,error=false){const b=$('stateBox');b.textContent=text;b.className='state-box'+(error?' error':'');b.hidden=false;}
function setResultsHeading(title,meta=''){$('resultsTitle').textContent=title;$('resultsMeta').textContent=meta;}
function art(item){if(item.image_url)return '<img src="'+esc(item.image_url)+'" alt="'+esc(clean(item.skin_name))+'" loading="lazy">';return '<span class="skin-meta">imagem N/D</span>';}
function addUnique(list,value){const v=String(value||'').trim();if(v&&!list.some(x=>x.toLowerCase()===v.toLowerCase()))list.push(v);}
function removeValue(list,value){const i=list.findIndex(x=>x===value);if(i>=0)list.splice(i,1);}
function renderTokens(containerId,list,type){$(containerId).innerHTML=list.map(v=>'<button type="button" class="filter-token" data-remove-type="'+type+'" data-remove-value="'+esc(v)+'">'+esc(v)+' <span aria-hidden="true">×</span></button>').join('');}
function resolutionModeLabel(mode){return mode==='FUZZY_FALLBACK'?'aproximado':mode==='SUBSTRING_NORMALIZED'?'parcial':mode==='NO_MATCH'?'sem correspondência':'resolvido';}
function renderFieldResolution(field){
 const box=$(field+'Resolution');if(!box)return;
 const ff=state.fieldFilters?.[field];const terms=Array.isArray(ff?.terms)?ff.terms:[];
 if(!terms.length){box.hidden=true;box.innerHTML='';return;}
 box.innerHTML=terms.map(t=>{
  const resolved=Array.isArray(t?.resolved)?t.resolved:[];
  const detail=resolved.length?resolved.map(esc).join(', '):'nenhuma correspondência';
  return '<div class="resolution-row '+(t?.mode==='NO_MATCH'?'no-match':'')+'"><span>'+esc(t?.input||'')+'</span><strong>'+esc(resolutionModeLabel(t?.mode))+'</strong><small>'+detail+'</small></div>';
 }).join('');
 box.hidden=false;
}
function renderFieldResolutions(){renderFieldResolution('weapon');renderFieldResolution('collection');}
function renderFilterControls(){
 $('skinSearch').value=state.q;renderTokens('weaponTokens',state.weapons,'weapon');renderTokens('collectionTokens',state.collections,'collection');
 document.querySelectorAll('input[name="rarity"]').forEach(c=>c.checked=state.rarities.includes(c.value));
 document.querySelectorAll('[data-stattrak]').forEach(b=>b.classList.toggle('active',b.dataset.stattrak===state.stattrak));
 $('sortSelect').value=state.sort;
 const n=filterCount();$('activeFilters').hidden=n===0;$('activeFilterCount').textContent=n?(n+' filtros ativos'):'Nenhum filtro aplicado';
 const chips=[];state.weapons.forEach(v=>chips.push({type:'weapon',label:'Arma: '+v,value:v}));state.rarities.forEach(v=>chips.push({type:'rarity',label:'Raridade: '+v,value:v}));state.collections.forEach(v=>chips.push({type:'collection',label:'Coleção: '+v,value:v}));if(state.stattrak!=='')chips.push({type:'stattrak',label:state.stattrak==='true'?'StatTrak':'Normal',value:state.stattrak});
 $('activeFilterChips').innerHTML=chips.map(c=>'<button class="active-chip" type="button" data-active-remove="'+c.type+'" data-active-value="'+esc(c.value)+'">'+esc(c.label)+' <span>×</span></button>').join('');
 $('capabilityNotice').hidden=!hasStructuralFilters();renderFieldResolutions();bindFilterRemovers();
}
function renderSelection(){$('selectToggle').classList.toggle('active',state.selectMode);$('selectToggle').setAttribute('aria-pressed',String(state.selectMode));$('selectionBar').hidden=!state.selectMode;$('selectionCount').textContent=state.selected.size+' selecionadas';$('openFirstBtn').disabled=state.selected.size===0;$('compareBtn').disabled=true;}
function render(items){
 state.items=items;
 $('results').innerHTML=items.map(x=>{const key=x.market_key||x.skin_name||'';const selected=state.selected.has(key);const selectControl=state.selectMode?'<button class="select-skin '+(selected?'selected':'')+'" type="button" data-select-key="'+esc(key)+'" aria-pressed="'+String(selected)+'">'+(selected?'Selecionada':'Adicionar à seleção')+'</button>':'';
 const useControl=state.loadoutSide&&state.loadoutWeapon?'<a class="select-skin selected" href="'+loadoutPickHref(x)+'">Usar neste slot</a>':'';
 return '<article class="skin-card explorer-card"><a class="skin-card-main" href="'+entityHref(x)+'">'+art(x)+'<div class="card-identity"><span class="weapon-label">'+esc(weaponOf(x))+'</span><h3>'+esc(clean(x.skin_name))+'</h3></div><div class="skin-meta">'+esc(fmt(x.rarity))+'</div><div class="skin-meta">'+esc(fmt(x.collection))+'</div><div class="card-badges">'+(x.is_stattrak?'<span class="mini-tag">StatTrak</span>':'')+'<span class="mini-tag muted">float '+esc(fmt(x.float_min))+'–'+esc(fmt(x.float_max))+'</span></div><span class="card-action">Abrir skin →</span></a>'+selectControl+'</article>';}).join('');
 document.querySelectorAll('[data-select-key]').forEach(btn=>btn.onclick=e=>{e.preventDefault();e.stopPropagation();const key=btn.dataset.selectKey;if(state.selected.has(key))state.selected.delete(key);else state.selected.add(key);render(state.items);renderSelection();});
}
function hideSuggestions(){const box=$('searchSuggestions');box.hidden=true;box.innerHTML='';$('skinSearch').setAttribute('aria-expanded','false');}
function renderSuggestions(items,q,search){
 const box=$('searchSuggestions');
 if(!q||!items.length){hideSuggestions();return;}
 const approx=search?.mode==='FUZZY_FALLBACK'?'<div class="suggestion-context">Resultados aproximados para esta busca</div>':'';
 box.innerHTML=approx+items.slice(0,SUGGEST_LIMIT).map(x=>'<a class="search-suggestion" href="'+entityHref(x)+'"><span><strong>'+esc(clean(x.skin_name))+'</strong><small>'+esc(weaponOf(x))+' · '+esc(fmt(x.collection))+'</small></span><span class="suggestion-rarity">'+esc(fmt(x.rarity))+'</span></a>').join('')+'<button class="search-suggestion-all" type="button" data-search-all>Ver resultados para “'+esc(q)+'”</button>';
 box.hidden=false;$('skinSearch').setAttribute('aria-expanded','true');
 const all=box.querySelector('[data-search-all]');if(all)all.onclick=()=>{hideSuggestions();executeQuery();};
}
async function fetchSuggestions(raw){
 const q=String(raw||'').trim();const seq=++suggestSeq;
 if(suggestController)suggestController.abort();
 if(!q){hideSuggestions();return;}
 suggestController=new AbortController();
 const p=buildParams(0,q);p.set('limit',String(SUGGEST_LIMIT));p.set('offset','0');
 try{
  const r=await fetch(API+'?'+p.toString(),{signal:suggestController.signal});
  const d=await r.json().catch(()=>({status:'ERROR'}));
  if(seq!==suggestSeq)return;
  if(!r.ok||d.status==='ERROR'){hideSuggestions();return;}
  renderSuggestions(Array.isArray(d.items)?d.items:[],q,d.search||null);
 }catch(e){if(e?.name!=='AbortError'&&seq===suggestSeq)hideSuggestions();}
}
function scheduleSuggestions(){clearTimeout(suggestTimer);const q=$('skinSearch').value;suggestTimer=setTimeout(()=>fetchSuggestions(q),180);}
function bindFilterRemovers(){document.querySelectorAll('[data-remove-type]').forEach(btn=>btn.onclick=()=>removeFilter(btn.dataset.removeType,btn.dataset.removeValue));document.querySelectorAll('[data-active-remove]').forEach(btn=>btn.onclick=()=>removeFilter(btn.dataset.activeRemove,btn.dataset.activeValue));}
function updatePagination(){
 const btn=$('loadMoreBtn');btn.hidden=!state.hasMore;btn.disabled=state.loading;
 btn.textContent=state.loading?'Carregando…':'Carregar mais';
}
function buildParams(offset=0,queryOverride=null){
 const p=new URLSearchParams();
 const q=queryOverride===null?state.q:String(queryOverride);
 if(q)p.set('q',q);
 if(state.weapons.length)p.set('weapon',state.weapons.join(','));
 if(state.rarities.length)p.set('rarity',state.rarities.join(','));
 if(state.collections.length)p.set('collection',state.collections.join(','));
 if(state.stattrak!=='')p.set('stattrak',state.stattrak);
 if(state.sort!=='default')p.set('sort',state.sort);
 p.set('limit',String(PAGE_SIZE));p.set('offset',String(offset));p.set('ui','1');return p;
}
async function fetchPage({append=false,offset=0,silent=false}={}){
 if(!hasQuery()){state.items=[];state.hasMore=false;state.nextOffset=null;render([]);updatePagination();setResultsHeading('Comece pela busca ou refine pelos filtros.','Nenhuma consulta executada');setState('Explore pelo campo de busca ou pelos filtros.');return true;}
 const seq=++querySeq;
 if(queryController)queryController.abort();
 queryController=new AbortController();
 state.loading=true;updatePagination();$('searchBtn').disabled=true;$('searchBtn').textContent='Buscando…';
 if(!silent){setResultsHeading(append?'Carregando mais skins…':'Buscando skins…','Consulta no catálogo autorizado');setState(append?'Carregando próxima página…':'Buscando skins…');}
 try{
  const r=await fetch(API+'?'+buildParams(offset).toString(),{signal:queryController.signal});const d=await r.json().catch(()=>({status:'ERROR',error:'INVALID_RESPONSE'}));
  if(seq!==querySeq)return false;
  if(!r.ok||d.status==='ERROR'){const code=d.error||('HTTP_'+r.status);if(!append)render([]);setResultsHeading('Não foi possível concluir a busca.','Query e filtros preservados');setState((ERROR_MESSAGES[code]||'Não foi possível concluir a busca. Tente novamente sem perder seus filtros.')+' · '+code,true);state.hasMore=false;state.nextOffset=null;return false;}
  const page=Array.isArray(d.items)?d.items:[];const merged=append?[...state.items,...page]:page;render(merged);
  const pg=d.pagination||{};state.hasMore=pg.has_more===true;state.nextOffset=Number.isFinite(Number(pg.next_offset))?Number(pg.next_offset):null;
  state.lastSearchMode=d.search?.mode||'NONE';state.lastEffectiveSort=d.sort?.effective||state.sort;state.fieldFilters=d.field_filters||null;renderFilterControls();
  const fieldModes=[...(state.fieldFilters?.weapon?.terms||[]),...(state.fieldFilters?.collection?.terms||[])];
  const hasFieldFuzzy=fieldModes.some(t=>t?.mode==='FUZZY_FALLBACK');
  const hasFieldNoMatch=fieldModes.some(t=>t?.mode==='NO_MATCH');
  const searchNote=state.lastSearchMode==='FUZZY_FALLBACK'?'Busca global aproximada aplicada pelo catálogo':(state.q?'Busca global direta':(hasFieldFuzzy?'Filtro aproximado resolvido pelo catálogo':(hasFieldNoMatch?'Filtro sem correspondência canônica':'Filtros estruturais')));
  const sortNote=state.lastEffectiveSort==='relevance'?'ordem por relevância do catálogo':(state.lastEffectiveSort==='default'?'ordem padrão':'ordenação '+state.lastEffectiveSort.replace('_',' '));
  if(merged.length){setResultsHeading(merged.length+' skins carregadas',searchNote+' · '+sortNote+(state.hasMore?' · há mais resultados':''));setState(state.hasMore?'Continue explorando ou carregue a próxima página.':'Todos os resultados desta consulta foram carregados.');}
  else{setResultsHeading('Nenhuma skin encontrada.','Consulta completa para os filtros atuais');setState('Nenhuma skin encontrada. Tente outro termo ou ajuste os filtros.');}
  return true;
 }catch(e){if(e?.name==='AbortError')return false;if(!append)render([]);setResultsHeading('Não foi possível concluir a busca.','Query e filtros preservados');setState('Não foi possível concluir a busca. Tente novamente sem perder seus filtros. · NETWORK_ERROR',true);state.hasMore=false;state.nextOffset=null;return false;}
 finally{if(seq===querySeq){state.loading=false;$('searchBtn').disabled=false;$('searchBtn').textContent='Buscar';updatePagination();syncUrl();}}
}
async function restoreTraversal(){
 const target=Math.max(PAGE_SIZE,state.restoreCount||0);let guard=0;
 while(state.hasMore&&state.items.length<target&&state.nextOffset!==null&&guard<100){guard++;const ok=await fetchPage({append:true,offset:state.nextOffset,silent:true});if(!ok)break;}
}
async function executeQuery({restore=false}={}){
 state.q=$('skinSearch').value.trim();state.selected.clear();syncUrl();
 const ok=await fetchPage({append:false,offset:0});if(ok&&restore)await restoreTraversal();
}
function removeFilter(type,value){if(type==='weapon')removeValue(state.weapons,value);if(type==='rarity')removeValue(state.rarities,value);if(type==='collection')removeValue(state.collections,value);if(type==='stattrak')state.stattrak='';state.fieldFilters=null;renderFilterControls();state.restoreCount=0;executeQuery();}
function clearFilters(){state.weapons=[];state.rarities=[];state.collections=[];state.stattrak='';state.fieldFilters=null;renderFilterControls();state.restoreCount=0;executeQuery();}
function clearAll(){state.q='';state.weapons=[];state.rarities=[];state.collections=[];state.stattrak='';state.sort='default';state.fieldFilters=null;state.selected.clear();state.items=[];state.hasMore=false;state.nextOffset=null;state.restoreCount=0;renderFilterControls();renderSelection();render([]);syncUrl();updatePagination();setResultsHeading('Comece pela busca ou refine pelos filtros.','Nenhuma consulta executada');setState('Comece pela busca ou refine pelos filtros.');}
function loadFromUrl(){
 const p=new URLSearchParams(location.search);state.q=p.get('q')||'';state.weapons=decodeList(p.get('weapon'));state.rarities=decodeList(p.get('rarity')).filter(x=>RARITIES.includes(x));state.collections=decodeList(p.get('collection'));const st=p.get('stattrak');state.stattrak=st==='true'||st==='false'?st:'';const so=p.get('sort')||'default';state.sort=['default','name_asc','name_desc','rarity_asc','rarity_desc'].includes(so)?so:'default';state.selectMode=p.get('select')==='1';state.restoreCount=Math.max(0,Number(p.get('loaded'))||0);state.loadoutSide=['CT','T'].includes(p.get('loadoutSide'))?p.get('loadoutSide'):'';state.loadoutWeapon=p.get('loadoutWeapon')||'';state.loadoutFrom=safeLocalPath(p.get('loadoutFrom')||'');renderLoadoutContext();
 renderFilterControls();renderSelection();$('skinSearch').value=state.q;if(hasQuery())executeQuery({restore:true});else{setResultsHeading('Comece pela busca ou refine pelos filtros.','Nenhuma consulta executada');setState('Explore pelo campo de busca ou pelos filtros.');updatePagination();}
}
$('searchBtn').onclick=()=>{hideSuggestions();executeQuery();};$('skinSearch').addEventListener('input',scheduleSuggestions);$('skinSearch').addEventListener('focus',()=>{if($('skinSearch').value.trim())scheduleSuggestions();});$('skinSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){hideSuggestions();executeQuery();}if(e.key==='Escape')hideSuggestions();});document.addEventListener('click',e=>{if(!e.target.closest('.reactive-search'))hideSuggestions();});
$('weaponAdd').onclick=()=>{addUnique(state.weapons,$('weaponInput').value);$('weaponInput').value='';state.fieldFilters=null;renderFilterControls();state.restoreCount=0;executeQuery();};$('weaponInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('weaponAdd').click();}});
$('collectionAdd').onclick=()=>{addUnique(state.collections,$('collectionInput').value);$('collectionInput').value='';state.fieldFilters=null;renderFilterControls();state.restoreCount=0;executeQuery();};$('collectionInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('collectionAdd').click();}});
document.querySelectorAll('input[name="rarity"]').forEach(c=>c.onchange=()=>{if(c.checked)addUnique(state.rarities,c.value);else removeValue(state.rarities,c.value);renderFilterControls();state.restoreCount=0;executeQuery();});
document.querySelectorAll('[data-stattrak]').forEach(b=>b.onclick=()=>{state.stattrak=b.dataset.stattrak;renderFilterControls();state.restoreCount=0;executeQuery();});
$('sortSelect').onchange=()=>{state.sort=$('sortSelect').value;state.restoreCount=0;renderFilterControls();executeQuery();};
$('filterToggle').onclick=()=>{const p=$('filtersPanel');p.hidden=!p.hidden;$('filterToggle').setAttribute('aria-expanded',String(!p.hidden));};
$('selectToggle').onclick=()=>{state.selectMode=!state.selectMode;if(!state.selectMode)state.selected.clear();renderSelection();render(state.items);syncUrl();};
$('clearFiltersBtn').onclick=clearFilters;$('clearAllBtn').onclick=clearAll;$('clearSelectionBtn').onclick=()=>{state.selected.clear();renderSelection();render(state.items);};
$('openFirstBtn').onclick=()=>{const key=[...state.selected][0];if(!key)return;const x=state.items.find(i=>(i.market_key||i.skin_name)===key);if(x)location.href=entityHref(x);};
$('loadMoreBtn').onclick=()=>{if(state.hasMore&&state.nextOffset!==null&&!state.loading)fetchPage({append:true,offset:state.nextOffset});};
addEventListener('popstate',loadFromUrl);loadFromUrl();