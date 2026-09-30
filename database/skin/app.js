const API='https://ubtojlrfxoxbuvgajeos.supabase.co/functions/v1/tradeup-public';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const ERROR_MESSAGES={
  QUERY_TOO_LONG:'A busca usada neste link é longa demais.',
  REQUEST_URI_TOO_LONG:'Este endereço não pôde ser processado porque ficou longo demais.',
  RATE_LIMITED:'Muitas consultas em pouco tempo. Tente novamente em instantes.',
  ORIGIN_NOT_ALLOWED:'Este ambiente não está autorizado a consultar o catálogo.'
};
const WEARS=[
  {label:'Factory New',min:0,max:0.07,last:false},
  {label:'Minimal Wear',min:0.07,max:0.15,last:false},
  {label:'Field-Tested',min:0.15,max:0.38,last:false},
  {label:'Well-Worn',min:0.38,max:0.45,last:false},
  {label:'Battle-Scarred',min:0.45,max:1,last:true}
];
const fmt=v=>v===null||v===undefined||v===''?'N/D':String(v);
const hasNum=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
const clean=n=>String(n||'').replace(/^StatTrak™\s+/,'').replace(/^Souvenir\s+/,'');
function rarityMark(rarity,size='hero'){const r=fmt(rarity);return '<span class="rarity-mark '+size+'" data-rarity="'+esc(r)+'"><span>'+esc(r)+'</span></span>';}
function collectionIdentity(collection,size='standard'){const c=fmt(collection);return '<span class="collection-identity '+size+'" title="'+esc(c)+'"><span class="collection-plate" aria-hidden="true">S</span><span class="collection-name">'+esc(c)+'</span></span>';}
function parseIdentity(name){
  const cleanName=clean(name);const i=cleanName.indexOf(' | ');
  return {weapon:i>0?cleanName.slice(0,i):'N/D',finish:i>0?cleanName.slice(i+3):cleanName||'N/D'};
}
function possibleWears(min,max){
  if(!hasNum(min)||!hasNum(max))return [];
  const lo=Number(min),hi=Number(max);if(lo>hi)return [];
  return WEARS.filter(w=>{
    const lowerOk=hi>=w.min;
    const upperOk=w.last?lo<=w.max:lo<w.max;
    return lowerOk&&upperOk;
  }).map(w=>w.label);
}
function stateBox(title,detail,error=false,retry=false){
  const b=$('entityState');b.className='state-box'+(error?' error':'');
  b.innerHTML='<strong>'+title+'</strong><span>'+detail+'</span>'+(retry?'<button id="retryBtn" class="text-button" type="button">Tentar novamente</button>':'');
  b.hidden=false;if(retry&&$('retryBtn'))$('retryBtn').onclick=load;
}
function safeFrom(){
  const from=new URLSearchParams(location.search).get('from')||'';
  return from&&from.startsWith('/')&&!from.startsWith('//')?from:'';
}
function currentEntityUrl(key){return location.pathname+'?key='+encodeURIComponent(key)+(safeFrom()?'&from='+encodeURIComponent(safeFrom()):'');}
function applyOriginContext(){
  const from=safeFrom();if(!from)return {type:'none',href:'../'};
  const isTrade=/\/tradeup\/?(?:\?|$)/.test(from);const isLoadout=/\/loadout\/?(?:\?|$)/.test(from);const isInventory=/\/inventory\/?(?:\?|$)/.test(from);const isCollection=/\/database\/collections\/collection\/?(?:\?|$)/.test(from);
  $('originContext').hidden=false;
  $('breadcrumbBack').href=from;$('contextBackBtn').href=from;
  if(isLoadout){
    const q=new URL(from,'https://scale.local').searchParams;const side=q.get('side')||'N/D';const focus=q.get('focus')||'slot';
    $('originLabel').textContent='Vindo do Loadout';$('originHelper').textContent='Slot: '+side+' · '+focus;
    $('contextBackBtn').textContent='Voltar ao Loadout';$('breadcrumbBack').textContent='Loadout Lab';
    return {type:'loadout',href:from};
  }
  if(isInventory){
    $('originLabel').textContent='Vindo do Inventário';$('originHelper').textContent='Este item foi aberto a partir do snapshot importado ativo.';
    $('contextBackBtn').textContent='Voltar ao Inventário';$('breadcrumbBack').textContent='Inventário';
    return {type:'inventory',href:from};
  }
  if(isCollection){
    $('originLabel').textContent='Vindo de uma coleção';$('originHelper').textContent='Retorne ao Collection Hub sem perder esta skin.';
    $('contextBackBtn').textContent='Voltar à coleção';$('breadcrumbBack').textContent='Collection Hub';
    return {type:'collection',href:from};
  }
  if(isTrade){
    $('originLabel').textContent='Vindo de Contratos';
    $('originHelper').textContent='Retorne à composição sem perder o contexto atual.';
    $('contextBackBtn').textContent='Voltar aos Contratos';
    $('breadcrumbBack').textContent='Contratos';
    return {type:'tradeup',href:from};
  }
  $('originLabel').textContent='Vindo de Skins';
  $('originHelper').textContent='Sua busca e seus filtros devem continuar reconhecíveis ao retornar.';
  $('contextBackBtn').textContent='Voltar aos resultados';
  return {type:'database',href:from};
}
function inventoryMatches(x){
  try{
    const raw=sessionStorage.getItem('scale_inventory_bridge_v01_session');if(!raw)return {snapshot:false,matches:[]};
    const snap=JSON.parse(raw);const matches=(snap?.items||[]).filter(i=>i.match_state==='MATCHED'&&i.market_key===x.market_key);
    return {snapshot:true,snapshotAt:snap.snapshot_at||null,matches};
  }catch(_){return {snapshot:false,matches:[]}}
}
function applyInventoryOwnership(x){
  const box=$('inventoryOwnership');if(!box)return;
  box.hidden=true;box.textContent='';
  const inv=inventoryMatches(x);
  if(inv.matches.length){
    box.hidden=false;
    box.innerHTML='<span>No inventário importado · '+inv.matches.length+'</span><span>Snapshot: '+esc(inv.snapshotAt?new Date(inv.snapshotAt).toLocaleString('pt-BR'):'N/D')+'</span>';
  }
  const title=$('inventoryPathTitle'),helper=$('inventoryPathHelper'),btn=$('inventoryBtn');
  if(!title||!helper||!btn)return;
  if(inv.matches.length){
    title.textContent='Você já tem '+inv.matches.length+' exemplar'+(inv.matches.length===1?'':'es');
    helper.textContent='O snapshot confirma que estes itens estão no inventário importado. A compatibilidade com um contrato é verificada ao montar a composição.';
    btn.textContent='Ver meu Inventário';
  }else if(inv.snapshot){
    title.textContent='Complete o caminho com seu Inventário';
    helper.textContent='Há um snapshot importado, mas esta skin não aparece nele como item reconhecido. Outros itens do snapshot ainda podem ser avaliados em Contratos.';
    btn.textContent='Revisar meu Inventário';
  }else{
    title.textContent='Use o que você já tem';
    helper.textContent='Importe um snapshot para usar seus itens como contexto em Contratos. Isso não sincroniza a Steam.';
    btn.textContent='Importar Inventário';
  }
}
function render(x){
  $('entityHub').hidden=false;$('entityState').hidden=true;
  const name=fmt(x.skin_name);const identity=parseIdentity(name);const mode=x.is_stattrak===true?'StatTrak':x.is_stattrak===false?'Normal':'N/D';
  const wears=possibleWears(x.float_min,x.float_max);
  $('crumbName').textContent=clean(name);
  $('entityName').textContent=clean(name);
  $('entityIdentityLine').innerHTML='<span>'+esc(identity.weapon)+'</span> · '+rarityMark(x.rarity,'hero');
  $('entitySubline').innerHTML=collectionIdentity(x.collection,'standard')+(mode!=='N/D'?'<span> · '+esc(mode)+'</span>':'');
  $('entityFinish').textContent=identity.finish;
  $('entityWeapon').textContent=identity.weapon;
  $('entityCollection').innerHTML=collectionIdentity(x.collection,'standard');
  $('entityRarity').innerHTML=rarityMark(x.rarity,'standard');
  $('entityMode').textContent=mode;
  $('entityKey').textContent=fmt(x.market_key);
  $('entityFloatRange').textContent=hasNum(x.float_min)&&hasNum(x.float_max)?Number(x.float_min)+' – '+Number(x.float_max):'N/D';
  $('entityWears').innerHTML=wears.length?wears.map(w=>'<span class="wear-chip">'+w+'</span>').join(''):'<span class="wear-chip unknown" title="Não disponível com os dados atuais.">N/D</span>';
  $('entityArt').innerHTML='';
  if(x.image_url){const img=document.createElement('img');img.src=x.image_url;img.alt=clean(name);img.loading='lazy';img.onerror=()=>{$('entityArt').innerHTML='<span>Imagem indisponível</span>';};$('entityArt').appendChild(img);}
  else{$('entityArt').innerHTML='<span>Imagem indisponível</span>';}
  const hubUrl=currentEntityUrl(x.market_key||x.skin_name||'');
  const tradeHref='../../tradeup/?skin='+encodeURIComponent(x.market_key||x.skin_name||'')+'&from='+encodeURIComponent(hubUrl);
  $('tradeLabBtnBottom').href=tradeHref;
  const loadoutHref='../../loadout/?skin='+encodeURIComponent(x.market_key||x.skin_name||'')+'&from='+encodeURIComponent(hubUrl);
  $('loadoutBtn').href=loadoutHref;
  const collection=x.collection||'';
  if(collection){
    $('collectionBtn').href='../collections/collection/?collection='+encodeURIComponent(collection)+'&from='+encodeURIComponent(hubUrl);
    $('collectionPathTitle').textContent='Explore '+collection;
    $('collectionPathHelper').textContent='Abra o Collection Hub e continue pelas skins pertencentes a esta coleção.';
    $('collectionBtn').textContent='Abrir coleção';
  }else{
    $('collectionBtn').href='../';
    $('collectionPathTitle').textContent='Coleção indisponível';
    $('collectionPathHelper').textContent='A coleção desta skin não está disponível nos dados atuais.';
    $('collectionBtn').textContent='Explorar Skins';
  }
  applyInventoryOwnership(x);
  document.title='SCALE — '+clean(name)+' · Skin Hub';
}
async function load(){
  const key=new URLSearchParams(location.search).get('key')?.trim()||'';
  if(key.length<2){stateBox('Skin não encontrada.','Volte a Skins e tente outra busca.',true,false);return;}
  stateBox('Carregando skin…','Consultando o catálogo autorizado.');
  try{
    const r=await fetch(API+'?q='+encodeURIComponent(key)+'&limit=24&ui=1');
    const d=await r.json().catch(()=>({status:'ERROR',error:'INVALID_RESPONSE'}));
    if(!r.ok||d.status==='ERROR'){
      const code=d.error||('HTTP_'+r.status);
      stateBox('Não foi possível carregar esta skin.',(ERROR_MESSAGES[code]||'Tente novamente.')+' · '+code,true,true);return;
    }
    const items=Array.isArray(d.items)?d.items:[];
    const exact=items.find(x=>x.market_key===key)||items.find(x=>x.skin_name===key);
    if(!exact){stateBox('Skin não encontrada.','Volte a Skins e tente outra busca.',true,false);return;}
    render(exact);
  }catch(e){stateBox('Não foi possível carregar esta skin.','Tente novamente. · NETWORK_ERROR',true,true);}
}
applyOriginContext();
load();