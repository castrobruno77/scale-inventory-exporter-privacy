const API='https://ubtojlrfxoxbuvgajeos.supabase.co/functions/v1/tradeup-public';
const $=id=>document.getElementById(id);
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
  const isTrade=/\/tradeup\/?(?:\?|$)/.test(from);const isLoadout=/\/loadout\/?(?:\?|$)/.test(from);
  $('originContext').hidden=false;
  $('breadcrumbBack').href=from;$('contextBackBtn').href=from;$('entityBackBtn').href=from;$('backBtnBottom').href=from;
  if(isLoadout){
    const q=new URL(from,'https://scale.local').searchParams;const side=q.get('side')||'N/D';const focus=q.get('focus')||'slot';
    $('originLabel').textContent='Vindo do Loadout';$('originHelper').textContent='Slot: '+side+' · '+focus;
    $('contextBackBtn').textContent='Voltar ao Loadout';$('entityBackBtn').textContent='Voltar ao Loadout';$('backBtnBottom').textContent='Voltar ao Loadout';$('breadcrumbBack').textContent='Loadout Lab';
    return {type:'loadout',href:from};
  }
  if(isTrade){
    $('originLabel').textContent='Vindo do Trade Lab';
    $('originHelper').textContent='Retorne à composição sem perder o contexto atual.';
    $('contextBackBtn').textContent='Voltar ao Trade Lab';
    $('entityBackBtn').textContent='Voltar ao Trade Lab';
    $('backBtnBottom').textContent='Voltar ao Trade Lab';
    $('breadcrumbBack').textContent='Trade Lab';
    return {type:'tradeup',href:from};
  }
  $('originLabel').textContent='Vindo do Database';
  $('originHelper').textContent='Sua busca e seus filtros devem continuar reconhecíveis ao retornar.';
  $('contextBackBtn').textContent='Voltar aos resultados';
  $('entityBackBtn').textContent='Voltar aos resultados';
  $('backBtnBottom').textContent='Voltar aos resultados';
  return {type:'database',href:from};
}
function render(x){
  $('entityHub').hidden=false;$('entityState').hidden=true;
  const name=fmt(x.skin_name);const identity=parseIdentity(name);const mode=x.is_stattrak===true?'StatTrak':x.is_stattrak===false?'Normal':'N/D';
  const wears=possibleWears(x.float_min,x.float_max);
  $('crumbName').textContent=clean(name);
  $('entityName').textContent=clean(name);
  $('entityIdentityLine').textContent=identity.weapon+' · '+fmt(x.rarity);
  $('entitySubline').textContent=fmt(x.collection)+(mode!=='N/D'?' · '+mode:'');
  $('entityFinish').textContent=identity.finish;
  $('entityWeapon').textContent=identity.weapon;
  $('entityCollection').textContent=fmt(x.collection);
  $('entityRarity').textContent=fmt(x.rarity);
  $('entityMode').textContent=mode;
  $('entityKey').textContent=fmt(x.market_key);
  $('entityFloatRange').textContent=hasNum(x.float_min)&&hasNum(x.float_max)?Number(x.float_min)+' – '+Number(x.float_max):'N/D';
  $('entityWears').innerHTML=wears.length?wears.map(w=>'<span class="wear-chip">'+w+'</span>').join(''):'<span class="wear-chip unknown" title="Não disponível com os dados atuais.">N/D</span>';
  $('entityArt').innerHTML='';
  if(x.image_url){const img=document.createElement('img');img.src=x.image_url;img.alt=clean(name);img.loading='lazy';img.onerror=()=>{$('entityArt').innerHTML='<span>Imagem indisponível</span>';};$('entityArt').appendChild(img);}
  else{$('entityArt').innerHTML='<span>Imagem indisponível</span>';}
  const hubUrl=currentEntityUrl(x.market_key||x.skin_name||'');
  const tradeHref='../../tradeup/?skin='+encodeURIComponent(x.market_key||x.skin_name||'')+'&from='+encodeURIComponent(hubUrl);
  $('tradeLabBtn').href=tradeHref;$('tradeLabBtnBottom').href=tradeHref;
  const loadoutHref='../../loadout/?skin='+encodeURIComponent(x.market_key||x.skin_name||'')+'&from='+encodeURIComponent(hubUrl);$('loadoutBtn').href=loadoutHref;$('loadoutBtnBottom').href=loadoutHref;
  document.title='SCALE — '+clean(name)+' · Skin Hub';
}
async function load(){
  const key=new URLSearchParams(location.search).get('key')?.trim()||'';
  if(key.length<2){stateBox('Skin não encontrada.','Volte ao Database e tente outra busca.',true,false);return;}
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
    if(!exact){stateBox('Skin não encontrada.','Volte ao Database e tente outra busca.',true,false);return;}
    render(exact);
  }catch(e){stateBox('Não foi possível carregar esta skin.','Tente novamente. · NETWORK_ERROR',true,true);}
}
applyOriginContext();
load();