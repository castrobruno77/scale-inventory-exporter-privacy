const API='https://ubtojlrfxoxbuvgajeos.supabase.co/functions/v1/tradeup-public';
const $=id=>document.getElementById(id);
const ERROR_MESSAGES={
  QUERY_TOO_LONG:'A busca usada neste link é longa demais.',
  REQUEST_URI_TOO_LONG:'Este endereço não pôde ser processado porque ficou longo demais.',
  RATE_LIMITED:'Muitas consultas em pouco tempo. Tente novamente em instantes.',
  ORIGIN_NOT_ALLOWED:'Este ambiente não está autorizado a consultar o catálogo.'
};
const fmt=v=>v===null||v===undefined||v===''?'N/D':String(v);
const clean=n=>String(n||'').replace(/^StatTrak™\s+/,'').replace(/^Souvenir\s+/,'');
function state(text,error=false){const b=$('entityState');b.textContent=text;b.className='state-box'+(error?' error':'');b.hidden=false}
function applyOriginContext(){
  const p=new URLSearchParams(location.search);const from=p.get('from')||'';
  if(!from||!from.startsWith('/')||from.startsWith('//'))return;
  $('originContext').hidden=false;$('breadcrumbBack').href=from;$('contextBackBtn').href=from;$('entityBackBtn').href=from;
}
function render(x){
  $('entityHub').hidden=false;$('entityState').hidden=true;
  const name=fmt(x.skin_name);
  $('crumbName').textContent=clean(name);
  $('entityName').textContent=clean(name);
  $('entityEyebrow').textContent=(x.is_stattrak?'StatTrak · ':'Skin · ')+fmt(x.rarity);
  $('entityCollection').textContent=fmt(x.collection);
  $('entityRarity').textContent=fmt(x.rarity);
  $('entityFloatMin').textContent=fmt(x.float_min);
  $('entityFloatMax').textContent=fmt(x.float_max);
  $('entityMode').textContent=x.is_stattrak===true?'StatTrak':x.is_stattrak===false?'Normal':'N/D';
  $('entityKey').textContent=fmt(x.market_key);
  $('entityArt').innerHTML='';
  if(x.image_url){
    const img=document.createElement('img');img.src=x.image_url;img.alt=clean(name);img.loading='lazy';$('entityArt').appendChild(img);
  }else{
    const span=document.createElement('span');span.textContent='imagem N/D';$('entityArt').appendChild(span);
  }
  $('originText').textContent='Você abriu '+clean(name)+' a partir do Database.';
  document.title='SCALE — '+clean(name)+' · Skin Hub Preview';
}
async function load(){
  const key=new URLSearchParams(location.search).get('key')?.trim()||'';
  if(key.length<2){state('Nenhuma entidade foi informada neste link. Volte ao Database e selecione uma skin.',true);return}
  state('Consultando entidade no catálogo autorizado…');
  try{
    const r=await fetch(API+'?q='+encodeURIComponent(key)+'&limit=24&ui=1');
    const d=await r.json().catch(()=>({status:'ERROR',error:'INVALID_RESPONSE'}));
    if(!r.ok||d.status==='ERROR'){
      const code=d.error||('HTTP_'+r.status);
      state((ERROR_MESSAGES[code]||'Não foi possível carregar esta entidade.')+' · '+code,true);return;
    }
    const items=Array.isArray(d.items)?d.items:[];
    const exact=items.find(x=>x.market_key===key)||items.find(x=>x.skin_name===key);
    if(!exact){state('Esta skin não foi encontrada como entidade exata no catálogo autorizado. Nenhum detalhe foi inferido.',true);return}
    render(exact);
  }catch(e){state('Falha de conexão ao consultar esta entidade. · NETWORK_ERROR',true)}
}
applyOriginContext();
load();
