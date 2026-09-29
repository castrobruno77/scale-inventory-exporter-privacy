const API='https://ubtojlrfxoxbuvgajeos.supabase.co/functions/v1/tradeup-public';
const STORE='scale_inventory_bridge_v01_session';
const SUPPORTED_SCHEMA=/^scale\.inventory_export\.v0\.8\.1$/i;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=v=>v===null||v===undefined||v===''?'N/D':String(v);
const clean=n=>String(n||'').replace(/^StatTrak™\s+/,'').replace(/^Souvenir\s+/,'').replace(/\s+\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/i,'');
const canonicalKey=n=>String(n||'').trim().replace(/\s+\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/i,'');
const state={catalog:new Map(),taxonomy:new Map(),snapshot:null,filter:'ALL',q:'',catalogReady:false};

function safePath(v){return v&&v.startsWith('/')&&!v.startsWith('//')?v:''}
function normalizeBool(v){if(v===true||v===false)return v;const s=String(v??'').toLowerCase();if(['yes','true','1','stattrak'].includes(s))return true;if(['no','false','0'].includes(s))return false;return null}
function numberOrNull(v){if(v===null||v===undefined||v==='')return null;const n=Number(String(v).replace(',','.').replace(/[^0-9.+-]/g,''));return Number.isFinite(n)?n:null}
function getValuation(raw){const v=raw?.valuation;if(v&&typeof v==='object')return numberOrNull(v.usd??v.value_usd??v.estimated_value_usd);return numberOrNull(raw.estimated_value_usd??raw.est_value_usd??raw.price_usd)}
function getSchema(doc){return String(doc?.schema_version??doc?.schema??doc?.export_schema??'').trim()}
function getItems(doc){if(Array.isArray(doc?.items))return doc.items;if(Array.isArray(doc?.inventory))return doc.inventory;if(Array.isArray(doc?.assets))return doc.assets;return null}
function getSnapshotAt(doc){return doc?.snapshot_at??doc?.inventory_snapshot_at??doc?.snapshot?.inventory_at??doc?.generated_at??null}

async function loadCatalog(){
 $('catalogStatus').textContent='Preparando catálogo público para matching local…';
 let offset=0, guard=0;
 try{
  while(guard++<60){
   const r=await fetch(API+'?limit=50&offset='+offset+'&ui=1');
   const d=await r.json().catch(()=>({status:'ERROR'}));
   if(!r.ok||d.status==='ERROR'||!Array.isArray(d.items))throw new Error('CATALOG_ERROR');
   d.items.forEach(x=>state.catalog.set(String(x.market_key),x));
   (d.weapon_taxonomy||[]).forEach(x=>state.taxonomy.set(x.weapon,x));
   if(!d.pagination?.has_more)break;
   offset=Number(d.pagination.next_offset);if(!Number.isFinite(offset))break;
  }
  if(!state.catalog.size)throw new Error('EMPTY_CATALOG');
  state.catalogReady=true;$('fileInput').disabled=false;$('dropZone').setAttribute('aria-disabled','false');
  $('catalogStatus').textContent=state.catalog.size+' variantes canônicas disponíveis para matching local.';
 }catch(_){
  $('catalogStatus').textContent='Não foi possível preparar o catálogo. Recarregue a página para tentar novamente.';
  showError('ERROR · Catálogo indisponível','A importação não foi habilitada porque o matching canônico não pode ser garantido.');
 }
}
function showError(title,detail){$('errorBox').hidden=false;$('errorBox').innerHTML='<strong>'+esc(title)+'</strong><span>'+esc(detail)+'</span>'}
function clearError(){$('errorBox').hidden=true;$('errorBox').textContent=''}

function normalizeItem(raw,index){
 const assetId=String(raw?.asset_id??raw?.assetId??raw?.['ASSET ID']??'').trim();
 if(!assetId)throw new Error('ASSET_ID_REQUIRED:'+index);
 const marketHash=String(raw?.market_hash_name??raw?.marketHashName??raw?.market_name??raw?.market_key??raw?.ITEM??raw?.item??'').trim();
 const display=String(raw?.display_name??raw?.skin_name??raw?.ITEM??raw?.item??marketHash||'Registro importado').trim();
 const key=canonicalKey(marketHash);
 const match=key?state.catalog.get(key):null;
 const floatValue=numberOrNull(raw?.float_value??raw?.float??raw?.FLOAT);
 const floatState=String(raw?.float_state??raw?.float_status??raw?.['FLOAT STATUS']??(floatValue!==null?'PRESENT':'N/D')).toUpperCase();
 const stattrak=normalizeBool(raw?.stattrak??raw?.is_stattrak??raw?.STATTRAK);
 const itemType=String(raw?.item_type??raw?.type??'').trim();
 let matchState='PARTIAL';
 if(match)matchState='MATCHED';else if(marketHash)matchState='OUTSIDE_CATALOG';
 const tax=match?state.taxonomy.get(match.weapon):null;
 return {
  asset_id:assetId,asset_key:raw?.asset_key??null,market_hash_name:marketHash||null,display_name:display,
  item_type:itemType||null,float_value:floatValue,float_state:floatState,stattrak:stattrak??(match?.is_stattrak??null),
  stattrak_kills:numberOrNull(raw?.stattrak_kills??raw?.st_kills??raw?.['ST KILLS']),souvenir:normalizeBool(raw?.souvenir??raw?.SOUVENIR),
  exterior:raw?.exterior??raw?.EXTERIOR??null,collection:raw?.collection??raw?.COLLECTION??match?.collection??null,
  rarity:raw?.rarity??raw?.RARITY??match?.rarity??null,valuation_usd:getValuation(raw),
  price_updated:raw?.price_updated??raw?.['PRICE UPDATED']??null,trade_lock_until:raw?.trade_lock_until??raw?.['TRADE LOCK UNTIL (UTC)']??null,
  match_state:matchState,market_key:match?.market_key??null,weapon:match?.weapon??raw?.weapon??raw?.WEAPON??null,
  weapon_category:match?.weapon_category??tax?.category??null,loadout_slot:match?.loadout_slot??tax?.slot??null,side:match?.side??tax?.side??null,
  image_url:match?.image_url??null
 };
}
function validateAndNormalize(doc){
 const schema=getSchema(doc);if(!SUPPORTED_SCHEMA.test(schema))throw new Error('SCHEMA_INCOMPATIBLE');
 const rawItems=getItems(doc);if(!rawItems)throw new Error('ITEMS_REQUIRED');if(!rawItems.length)throw new Error('EMPTY_SNAPSHOT');
 const items=rawItems.map(normalizeItem);const seen=new Set();
 for(const x of items){if(seen.has(x.asset_id))throw new Error('DUPLICATE_ASSET_ID:'+x.asset_id);seen.add(x.asset_id)}
 return {schema_version:schema,snapshot_at:getSnapshotAt(doc),imported_at:new Date().toISOString(),source:'SCALE_INVENTORY_EXPORTER',items};
}
function persist(){if(!state.snapshot)return;sessionStorage.setItem(STORE,JSON.stringify(state.snapshot))}
function restore(){try{const raw=sessionStorage.getItem(STORE);if(raw){state.snapshot=JSON.parse(raw);renderSnapshot()}}catch(_){}}
function clearSnapshot(){state.snapshot=null;sessionStorage.removeItem(STORE);$('snapshotSection').hidden=true;$('fileInput').value='';$('replaceInput').value='';clearError()}

function statusLabel(s){return s==='MATCHED'?'Reconhecido':s==='PARTIAL'?'Reconhecimento parcial':'Fora do catálogo'}
function statusClass(s){return s==='MATCHED'?'matched':s==='PARTIAL'?'partial':'outside'}
function priceText(x){return x.valuation_usd===null?'N/D':'US$ '+Number(x.valuation_usd).toFixed(2)}
function floatText(x){if(x.float_state==='NOT_APPLICABLE')return 'N/A';return x.float_value===null?'N/D':Number(x.float_value).toFixed(6)}
function art(x){return x.image_url?'<img src="'+esc(x.image_url)+'" alt="'+esc(clean(x.display_name))+'" loading="lazy">':'<span>Imagem N/D</span>'}
function sourceUrl(){return location.pathname+location.search}
function skinUrl(x){return '../database/skin/?key='+encodeURIComponent(x.market_key)+'&from='+encodeURIComponent(sourceUrl())}
function loadoutUrl(x){return '../loadout/?skin='+encodeURIComponent(x.market_key)+'&inventory=1&from='+encodeURIComponent(sourceUrl())}
function tradeUrl(x){const p=new URLSearchParams();p.set('inventoryKey',x.market_key);if(x.float_value!==null)p.set('inventoryFloat',String(x.float_value));p.set('from',sourceUrl());return '../tradeup/?'+p.toString()}
function card(x){
 const matched=x.match_state==='MATCHED';
 const actions=matched?'<div class="inventory-actions"><a href="'+skinUrl(x)+'">Abrir skin</a>'+(x.weapon?'<a href="'+loadoutUrl(x)+'">Loadout</a>':'')+(x.float_value!==null&&x.float_state!=='NOT_APPLICABLE'?'<a href="'+tradeUrl(x)+'">Trade Lab</a>':'')+'</div>':'<div class="inventory-actions single"><a href="../database/?q='+encodeURIComponent(x.market_hash_name||x.display_name)+'">Explorar no Database</a></div>';
 return '<article class="inventory-card '+statusClass(x.match_state)+'"><div class="inventory-card-head"><span class="asset-id">asset '+esc(x.asset_id)+'</span><span class="match-badge '+statusClass(x.match_state)+'">'+statusLabel(x.match_state)+'</span></div><div class="inventory-art">'+art(x)+'</div><div class="inventory-body"><h3>'+esc(clean(x.display_name))+'</h3><p>'+esc(fmt(x.collection))+' · '+esc(fmt(x.rarity))+'</p><div class="inventory-meta"><div><span>Float</span><strong>'+esc(floatText(x))+'</strong></div><div><span>Preço no snapshot</span><strong>'+esc(priceText(x))+'</strong></div><div><span>StatTrak</span><strong>'+esc(x.stattrak===true?'Sim':x.stattrak===false?'Não':'N/D')+'</strong></div><div><span>Market key</span><strong>'+esc(fmt(x.market_key))+'</strong></div></div>'+(matched?'':'<div class="raw-note">Registro preservado exatamente como ownership do snapshot; atributos canônicos não foram inventados.</div>')+'</div>'+actions+'</article>';
}
function renderSnapshot(){
 const s=state.snapshot;if(!s)return;
 $('snapshotSection').hidden=false;$('snapshotTitle').textContent=s.items.length+' itens no snapshot';
 $('snapshotFreshness').textContent='Importado nesta sessão: '+new Date(s.imported_at).toLocaleString('pt-BR')+' · Origem observada: '+(s.snapshot_at?new Date(s.snapshot_at).toLocaleString('pt-BR'):'N/D');
 $('totalCount').textContent=s.items.length;$('matchedCount').textContent=s.items.filter(x=>x.match_state==='MATCHED').length;$('partialCount').textContent=s.items.filter(x=>x.match_state==='PARTIAL').length;$('outsideCount').textContent=s.items.filter(x=>x.match_state==='OUTSIDE_CATALOG').length;
 renderItems();
}
function renderItems(){
 if(!state.snapshot)return;const q=state.q.toLowerCase();
 const items=state.snapshot.items.filter(x=>(state.filter==='ALL'||x.match_state===state.filter)&&(!q||[x.display_name,x.market_hash_name,x.weapon,x.collection,x.rarity,x.asset_id].some(v=>String(v||'').toLowerCase().includes(q))));
 $('inventoryGrid').innerHTML=items.map(card).join('');
 $('inventoryState').hidden=items.length>0;if(!items.length){$('inventoryState').hidden=false;$('inventoryState').textContent='Nenhum item corresponde a este filtro.'}
}
async function readFile(file){
 clearError();if(!state.catalogReady){showError('ERROR · Catálogo ainda não está pronto','Aguarde o catálogo público ser preparado antes de importar.');return}
 if(!file||file.size>5*1024*1024){showError('ERROR · Arquivo inválido','Use um JSON de até 5 MB exportado pelo SCALE Inventory Exporter.');return}
 let doc;try{doc=JSON.parse(await file.text())}catch(_){showError('ERROR · JSON malformado','O arquivo não pôde ser interpretado como JSON válido. Nenhum snapshot foi criado.');return}
 try{state.snapshot=validateAndNormalize(doc);persist();renderSnapshot()}
 catch(e){
  state.snapshot=null;
  const code=String(e.message||'IMPORT_ERROR');
  if(code==='SCHEMA_INCOMPATIBLE')showError('ERROR · Schema incompatível','Este JSON não usa o schema scale.inventory_export.v0.8.1. Nenhum snapshot foi criado.');
  else if(code.startsWith('DUPLICATE_ASSET_ID:'))showError('ERROR · Asset duplicado','O mesmo asset_id aparece mais de uma vez. A importação falhou fechada e nenhum ownership parcial foi criado.');
  else showError('ERROR · Snapshot incompatível','Campos obrigatórios do Inventory Exporter estão ausentes ou inválidos. Nenhum snapshot foi criado.');
 }
}
$('fileInput').onchange=e=>readFile(e.target.files?.[0]);$('replaceInput').onchange=e=>readFile(e.target.files?.[0]);$('clearSnapshotBtn').onclick=clearSnapshot;
$('inventorySearch').oninput=e=>{state.q=e.target.value.trim();renderItems()};
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;renderItems()});
['dragenter','dragover'].forEach(ev=>$('dropZone').addEventListener(ev,e=>{e.preventDefault();if(state.catalogReady)$('dropZone').classList.add('drag')}));
['dragleave','drop'].forEach(ev=>$('dropZone').addEventListener(ev,e=>{$('dropZone').classList.remove('drag');if(ev==='drop'){e.preventDefault();readFile(e.dataTransfer?.files?.[0])}}));
restore();loadCatalog();