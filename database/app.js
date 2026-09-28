const API='https://ubtojlrfxoxbuvgajeos.supabase.co/functions/v1/tradeup-public';
const $=id=>document.getElementById(id);
const ERROR_MESSAGES={QUERY_TOO_LONG:'A busca é longa demais. Use um termo mais curto.',REQUEST_URI_TOO_LONG:'A solicitação não pôde ser processada porque o endereço ficou longo demais.',RATE_LIMITED:'Muitas consultas em pouco tempo. Tente novamente em instantes.',ORIGIN_NOT_ALLOWED:'Este ambiente não está autorizado a consultar o catálogo.'};
const RARITIES=['Consumer Grade','Industrial Grade','Mil-Spec Grade','Restricted','Classified','Covert'];
const state={q:'',weapons:[],rarities:[],collections:[],stattrak:'',selectMode:false,selected:new Set(),items:[],loading:false};
const clean=n=>String(n||'').replace(/^StatTrak™\s+/,'').replace(/^Souvenir\s+/,'');
const fmt=v=>v===null||v===undefined||v===''?'N/D':String(v);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const weaponOf=item=>{const raw=String(item?.skin_name||item?.market_key||'').replace(/^StatTrak™\s+/,'');const i=raw.indexOf(' | ');return i>0?raw.slice(0,i):'N/D';};
const hasStructuralFilters=()=>state.weapons.length||state.rarities.length||state.collections.length||state.stattrak!=='';
const filterCount=()=>state.weapons.length+state.rarities.length+state.collections.length+(state.stattrak!==''?1:0);
const encodeList=a=>a.join('~');
const decodeList=s=>s?String(s).split('~').map(x=>x.trim()).filter(Boolean):[];
function currentContextUrl(){const u=new URL(location.href);u.search='';if(state.q)u.searchParams.set('q',state.q);if(state.weapons.length)u.searchParams.set('weapon',encodeList(state.weapons));if(state.rarities.length)u.searchParams.set('rarity',encodeList(state.rarities));if(state.collections.length)u.searchParams.set('collection',encodeList(state.collections));if(state.stattrak!=='')u.searchParams.set('stattrak',state.stattrak);if(state.selectMode)u.searchParams.set('select','1');return u.pathname+u.search;}
function syncUrl(){history.replaceState(null,'',currentContextUrl());}
function entityHref(x){return 'skin/?key='+encodeURIComponent(x.market_key||x.skin_name||'')+'&from='+encodeURIComponent(currentContextUrl());}
function setState(text,error=false){const b=$('stateBox');b.textContent=text;b.className='state-box'+(error?' error':'');b.hidden=false;}
function setResultsHeading(title,meta=''){$('resultsTitle').textContent=title;$('resultsMeta').textContent=meta;}
function art(item){if(item.image_url)return '<img src="'+esc(item.image_url)+'" alt="'+esc(clean(item.skin_name))+'" loading="lazy">';return '<span class="skin-meta">imagem N/D</span>';}
function addUnique(list,value){const v=String(value||'').trim();if(v&&!list.some(x=>x.toLowerCase()===v.toLowerCase()))list.push(v);}
function removeValue(list,value){const i=list.findIndex(x=>x===value);if(i>=0)list.splice(i,1);}
function renderTokens(containerId,list,type){$(containerId).innerHTML=list.map(v=>'<button type="button" class="filter-token" data-remove-type="'+type+'" data-remove-value="'+esc(v)+'">'+esc(v)+' <span aria-hidden="true">×</span></button>').join('');}
function renderFilterControls(){
 $('skinSearch').value=state.q;renderTokens('weaponTokens',state.weapons,'weapon');renderTokens('collectionTokens',state.collections,'collection');
 document.querySelectorAll('input[name="rarity"]').forEach(c=>c.checked=state.rarities.includes(c.value));
 document.querySelectorAll('[data-stattrak]').forEach(b=>b.classList.toggle('active',b.dataset.stattrak===state.stattrak));
 const n=filterCount();$('activeFilters').hidden=n===0;$('activeFilterCount').textContent=n?(n+' filtros ativos'):'Nenhum filtro aplicado';
 const chips=[];state.weapons.forEach(v=>chips.push({type:'weapon',label:'Arma: '+v,value:v}));state.rarities.forEach(v=>chips.push({type:'rarity',label:'Raridade: '+v,value:v}));state.collections.forEach(v=>chips.push({type:'collection',label:'Coleção: '+v,value:v}));if(state.stattrak!=='')chips.push({type:'stattrak',label:state.stattrak==='true'?'StatTrak':'Normal',value:state.stattrak});
 $('activeFilterChips').innerHTML=chips.map(c=>'<button class="active-chip" type="button" data-active-remove="'+c.type+'" data-active-value="'+esc(c.value)+'">'+esc(c.label)+' <span>×</span></button>').join('');
 $('capabilityNotice').hidden=!hasStructuralFilters();bindFilterRemovers();
}
function renderSelection(){$('selectToggle').classList.toggle('active',state.selectMode);$('selectToggle').setAttribute('aria-pressed',String(state.selectMode));$('selectionBar').hidden=!state.selectMode;$('selectionCount').textContent=state.selected.size+' selecionadas';$('openFirstBtn').disabled=state.selected.size===0;$('compareBtn').disabled=true;}
function render(items){
 state.items=items;
 $('results').innerHTML=items.map(x=>{const key=x.market_key||x.skin_name||'';const selected=state.selected.has(key);const selectControl=state.selectMode?'<button class="select-skin '+(selected?'selected':'')+'" type="button" data-select-key="'+esc(key)+'" aria-pressed="'+String(selected)+'">'+(selected?'Selecionada':'Adicionar à seleção')+'</button>':'';
 return '<article class="skin-card explorer-card"><a class="skin-card-main" href="'+entityHref(x)+'">'+art(x)+'<div class="card-identity"><span class="weapon-label">'+esc(weaponOf(x))+'</span><h3>'+esc(clean(x.skin_name))+'</h3></div><div class="skin-meta">'+esc(fmt(x.rarity))+'</div><div class="skin-meta">'+esc(fmt(x.collection))+'</div><div class="card-badges">'+(x.is_stattrak?'<span class="mini-tag">StatTrak</span>':'')+'<span class="mini-tag muted">float '+esc(fmt(x.float_min))+'–'+esc(fmt(x.float_max))+'</span></div><span class="card-action">Abrir skin →</span></a>'+selectControl+'</article>';}).join('');
 document.querySelectorAll('[data-select-key]').forEach(btn=>btn.onclick=e=>{e.preventDefault();e.stopPropagation();const key=btn.dataset.selectKey;if(state.selected.has(key))state.selected.delete(key);else state.selected.add(key);render(state.items);renderSelection();});
}
function bindFilterRemovers(){document.querySelectorAll('[data-remove-type]').forEach(btn=>btn.onclick=()=>removeFilter(btn.dataset.removeType,btn.dataset.removeValue));document.querySelectorAll('[data-active-remove]').forEach(btn=>btn.onclick=()=>removeFilter(btn.dataset.activeRemove,btn.dataset.activeValue));}
function removeFilter(type,value){if(type==='weapon')removeValue(state.weapons,value);if(type==='rarity')removeValue(state.rarities,value);if(type==='collection')removeValue(state.collections,value);if(type==='stattrak')state.stattrak='';renderFilterControls();syncUrl();refreshForState();}
function clearFilters(){state.weapons=[];state.rarities=[];state.collections=[];state.stattrak='';renderFilterControls();syncUrl();refreshForState();}
function clearAll(){state.q='';state.weapons=[];state.rarities=[];state.collections=[];state.stattrak='';state.selected.clear();renderFilterControls();renderSelection();render([]);syncUrl();setResultsHeading('Comece pela busca ou refine pelos filtros.','Nenhuma consulta executada');setState('Comece pela busca ou refine pelos filtros.');}
function pendingFilteredState(){render([]);setResultsHeading('Filtros prontos para integração','Catálogo completo ainda não consultável');setState('Os filtros atuais foram preservados, mas os resultados globais aguardam a extensão aditiva do catálogo. Nenhum lote parcial está sendo apresentado como universo completo.');}
async function search(){
 state.q=$('skinSearch').value.trim();syncUrl();
 if(hasStructuralFilters()){pendingFilteredState();return}
 if(state.q.length===0){render([]);setResultsHeading('Comece pela busca ou refine pelos filtros.','Nenhuma consulta executada');setState('Explore pelo campo de busca ou pelos filtros.');return;}
 if(state.q.length<2){render([]);setResultsHeading('Busca incompleta','Digite mais um caractere');setState('Digite parte do nome para começar.',true);return;}
 state.loading=true;$('searchBtn').disabled=true;$('searchBtn').textContent='Buscando…';setResultsHeading('Buscando skins…','Consulta nominal no catálogo autorizado');setState('Buscando skins…');
 try{
  const r=await fetch(API+'?q='+encodeURIComponent(state.q)+'&limit=24&ui=1');const d=await r.json().catch(()=>({status:'ERROR',error:'INVALID_RESPONSE'}));
  if(!r.ok||d.status==='ERROR'){const code=d.error||('HTTP_'+r.status);render([]);setResultsHeading('Não foi possível concluir a busca.','Filtros e query preservados');setState((ERROR_MESSAGES[code]||'Não foi possível concluir a busca. Tente novamente sem perder seus filtros.')+' · '+code,true);return;}
  const items=Array.isArray(d.items)?d.items:[];render(items);
  if(items.length){setResultsHeading(items.length+' skins encontradas','Busca nominal · lote retornado pelo GET vigente');setState('Continue a análise sem perder o contexto da busca.');}else{setResultsHeading('Nenhuma skin encontrada.','Busca nominal concluída');setState('Nenhuma skin encontrada. Tente outro termo ou ajuste os filtros.');}
 }catch(e){render([]);setResultsHeading('Não foi possível concluir a busca.','Filtros e query preservados');setState('Não foi possível concluir a busca. Tente novamente sem perder seus filtros. · NETWORK_ERROR',true);}
 finally{state.loading=false;$('searchBtn').disabled=false;$('searchBtn').textContent='Buscar';}
}
function refreshForState(){if(hasStructuralFilters()){pendingFilteredState();return}if(state.q)search();else{render([]);setResultsHeading('Comece pela busca ou refine pelos filtros.','Nenhuma consulta executada');setState('Explore pelo campo de busca ou pelos filtros.');}}
function loadFromUrl(){const p=new URLSearchParams(location.search);state.q=p.get('q')||'';state.weapons=decodeList(p.get('weapon'));state.rarities=decodeList(p.get('rarity')).filter(x=>RARITIES.includes(x));state.collections=decodeList(p.get('collection'));const st=p.get('stattrak');state.stattrak=st==='true'||st==='false'?st:'';state.selectMode=p.get('select')==='1';renderFilterControls();renderSelection();if(hasStructuralFilters())pendingFilteredState();else if(state.q)search();else{setResultsHeading('Comece pela busca ou refine pelos filtros.','Nenhuma consulta executada');setState('Explore pelo campo de busca ou pelos filtros.');}}
$('searchBtn').onclick=search;$('skinSearch').addEventListener('keydown',e=>{if(e.key==='Enter')search();});
$('weaponAdd').onclick=()=>{addUnique(state.weapons,$('weaponInput').value);$('weaponInput').value='';renderFilterControls();syncUrl();pendingFilteredState();};$('weaponInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('weaponAdd').click();}});
$('collectionAdd').onclick=()=>{addUnique(state.collections,$('collectionInput').value);$('collectionInput').value='';renderFilterControls();syncUrl();pendingFilteredState();};$('collectionInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('collectionAdd').click();}});
document.querySelectorAll('input[name="rarity"]').forEach(c=>c.onchange=()=>{if(c.checked)addUnique(state.rarities,c.value);else removeValue(state.rarities,c.value);renderFilterControls();syncUrl();pendingFilteredState();});
document.querySelectorAll('[data-stattrak]').forEach(b=>b.onclick=()=>{state.stattrak=b.dataset.stattrak;renderFilterControls();syncUrl();pendingFilteredState();});
$('filterToggle').onclick=()=>{const p=$('filtersPanel');p.hidden=!p.hidden;$('filterToggle').setAttribute('aria-expanded',String(!p.hidden));};
$('selectToggle').onclick=()=>{state.selectMode=!state.selectMode;if(!state.selectMode)state.selected.clear();renderSelection();render(state.items);syncUrl();};
$('clearFiltersBtn').onclick=clearFilters;$('clearAllBtn').onclick=clearAll;$('clearSelectionBtn').onclick=()=>{state.selected.clear();renderSelection();render(state.items);};
$('openFirstBtn').onclick=()=>{const key=[...state.selected][0];if(!key)return;const x=state.items.find(i=>(i.market_key||i.skin_name)===key);if(x)location.href=entityHref(x);};
addEventListener('popstate',loadFromUrl);loadFromUrl();