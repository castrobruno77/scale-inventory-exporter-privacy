const API='https://ubtojlrfxoxbuvgajeos.supabase.co/functions/v1/tradeup-public';
const STORE='scale_loadout_v01_session';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=v=>v===null||v===undefined||v===''?'N/D':String(v);
const clean=n=>String(n||'').replace(/^StatTrak™\s+/,'').replace(/^Souvenir\s+/,'');
const GROUPS={PISTOL:{grid:'pistolGrid'},MID_TIER:{grid:'midGrid'},RIFLE:{grid:'rifleGrid'},EQUIPMENT:{grid:'zeusGrid'}};
const state={side:'CT',taxonomy:[],selections:{CT:{},T:{}},loading:false};

function safeLocalPath(v){return v&&v.startsWith('/')&&!v.startsWith('//')?v:''}
function restore(){
 try{const raw=sessionStorage.getItem(STORE);if(!raw)return;const d=JSON.parse(raw);if(d?.side==='CT'||d?.side==='T')state.side=d.side;if(d?.selections?.CT&&d?.selections?.T)state.selections=d.selections;}catch(_){}
}
function persist(){try{sessionStorage.setItem(STORE,JSON.stringify({side:state.side,selections:state.selections}))}catch(_){}}
function currentUrl(focus=''){const p=new URLSearchParams();p.set('side',state.side);if(focus)p.set('focus',focus);return location.pathname+'?'+p.toString()}
function taxonomyForWeapon(w){return state.taxonomy.find(x=>x.weapon===w)||null}
function sideAllowed(t,side){return !!t&&(t.side===side||t.side==='BOTH')}
function selected(side,weapon){return state.selections?.[side]?.[weapon]||null}
function setState(title,detail='',error=false,retry=false){const b=$('loadoutState');b.hidden=false;b.className='state-box'+(error?' error':'');b.innerHTML='<strong>'+esc(title)+'</strong>'+(detail?'<span>'+esc(detail)+'</span>':'')+(retry?'<button id="retryLoadout" class="text-button" type="button">Tentar novamente</button>':'');if(retry&&$('retryLoadout'))$('retryLoadout').onclick=loadTaxonomy}
function hideState(){$('loadoutState').hidden=true}
function art(item){return item?.image_url?'<img src="'+esc(item.image_url)+'" alt="'+esc(clean(item.skin_name))+'" loading="lazy">':'<span>Imagem indisponível</span>'}
function databaseHref(side,weapon){const from=currentUrl(weapon);return '../database/?weapon='+encodeURIComponent(weapon)+'&loadoutSide='+encodeURIComponent(side)+'&loadoutWeapon='+encodeURIComponent(weapon)+'&loadoutFrom='+encodeURIComponent(from)}
function skinHref(side,weapon,item){return '../database/skin/?key='+encodeURIComponent(item.market_key||item.skin_name||'')+'&from='+encodeURIComponent(currentUrl(weapon))}
function card(t){
 const item=selected(state.side,t.weapon);
 if(!item)return '<article class="loadout-card empty"><div class="loadout-card-head"><div><strong>'+esc(t.weapon)+'</strong><div class="slot-label">'+esc(t.slot)+'</div></div></div><div class="loadout-art"><span>Nenhuma skin selecionada</span></div><div class="loadout-copy"><h3>Nenhuma skin selecionada</h3><p>Escolha uma skin compatível para esta arma.</p></div><div class="slot-actions single"><a href="'+databaseHref(state.side,t.weapon)+'">Escolher skin</a></div></article>';
 return '<article class="loadout-card selected"><div class="loadout-card-head"><div><strong>'+esc(t.weapon)+'</strong><div class="slot-label">'+esc(t.slot)+'</div></div><span class="selection-status">Selecionada</span></div><div class="loadout-art">'+art(item)+'</div><div class="loadout-copy"><h3>'+esc(clean(item.skin_name))+'</h3><p>'+esc(fmt(item.rarity))+'</p><div class="loadout-meta">'+(item.is_stattrak?'<span class="mini-tag">StatTrak</span>':'')+(item.from_inventory?'<span class="mini-tag">Do inventário importado</span>':'')+'<span class="mini-tag muted">'+esc(t.side)+'</span></div></div><div class="slot-actions"><a href="'+databaseHref(state.side,t.weapon)+'">Trocar</a><a href="'+skinHref(state.side,t.weapon,item)+'">Abrir skin</a><button class="remove" type="button" data-remove="'+esc(t.weapon)+'">Remover</button></div></article>';
}
function render(){
 $('ctTab').setAttribute('aria-selected',String(state.side==='CT'));$('tTab').setAttribute('aria-selected',String(state.side==='T'));
 const applicable=state.taxonomy.filter(t=>sideAllowed(t,state.side));
 Object.entries(GROUPS).forEach(([cat,cfg])=>{const list=applicable.filter(t=>t.category===cat);$(cfg.grid).innerHTML=list.map(card).join('')});
 const count=Object.keys(state.selections[state.side]||{}).length;$('summaryCount').textContent=count+' '+(count===1?'slot preenchido':'slots preenchidos');$('emptyState').hidden=count!==0;
 $('exploreDatabaseBtn').href='../database/?loadoutSide='+encodeURIComponent(state.side)+'&loadoutFrom='+encodeURIComponent(currentUrl());
 document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{delete state.selections[state.side][b.dataset.remove];persist();render()});
 const p=new URLSearchParams(location.search);p.set('side',state.side);history.replaceState(null,'',location.pathname+'?'+p.toString());
}
function selectItem(side,weapon,item,fromInventory=false){
 const t=taxonomyForWeapon(weapon);if(!t||!sideAllowed(t,side)){showArrivalError('Indisponível','Esta arma não está disponível neste lado.');return false}
 if(item.weapon&&item.weapon!==weapon){showArrivalError('Indisponível','Esta skin não corresponde à arma escolhida.');return false}
 state.selections[side][weapon]={market_key:item.market_key,skin_name:item.skin_name,rarity:item.rarity??null,is_stattrak:item.is_stattrak??null,image_url:item.image_url??null,weapon:item.weapon||weapon,weapon_category:item.weapon_category||t.category,loadout_slot:item.loadout_slot||t.slot,side:item.side||t.side,from_inventory:!!fromInventory};
 state.side=side;persist();$('arrivalPanel').hidden=true;render();return true;
}
function showArrivalError(title,detail){$('arrivalPanel').hidden=false;$('arrivalTitle').textContent=title;$('arrivalText').textContent=detail;$('arrivalActions').innerHTML='<a class="button secondary" href="'+esc(currentUrl())+'">Voltar ao Loadout</a>'}
async function exactItem(key){
 const r=await fetch(API+'?q='+encodeURIComponent(key)+'&limit=24&ui=1');const d=await r.json().catch(()=>({status:'ERROR'}));if(!r.ok||d.status==='ERROR')throw new Error('CATALOG_ERROR');return (d.items||[]).find(x=>x.market_key===key)||null;
}
function arrivalButtons(item,origin,fromInventory=false){
 const t=taxonomyForWeapon(item.weapon);if(!t)return showArrivalError('Não foi possível continuar','A taxonomia recebida não contém esta arma.');
 const sides=t.side==='BOTH'?['CT','T']:[t.side];
 $('arrivalPanel').hidden=false;$('arrivalTitle').textContent='Adicionando: '+clean(item.skin_name);$('arrivalText').textContent=sides.length>1?'Escolha onde usar esta skin.':'Para '+sides[0]+' · '+item.weapon;
 $('arrivalActions').innerHTML=sides.map(s=>'<button class="button primary" type="button" data-arrival-side="'+s+'">Selecionar em '+s+'</button>').join('')+(origin?'<a class="button secondary" href="'+esc(origin)+'">'+(fromInventory?'Voltar ao Inventory':'Voltar à skin')+'</a>':'');
 document.querySelectorAll('[data-arrival-side]').forEach(b=>b.onclick=()=>selectItem(b.dataset.arrivalSide,item.weapon,item,fromInventory));
}
async function consumeContext(){
 const p=new URLSearchParams(location.search);const pick=p.get('pick')||'';const incoming=p.get('skin')||'';const side=p.get('side');const weapon=p.get('weapon')||'';const origin=safeLocalPath(p.get('from')||'');const fromInventory=p.get('inventory')==='1';
 if(side==='CT'||side==='T')state.side=side;
 if(pick){
  try{const item=await exactItem(pick);if(!item)return showArrivalError('Não foi possível continuar','A skin escolhida não foi encontrada no catálogo.');if(!weapon)return showArrivalError('Não foi possível continuar','O slot de destino não foi informado.');if(selectItem(state.side,weapon,item))history.replaceState(null,'',currentUrl(weapon));}catch(_){showArrivalError('Não foi possível carregar esta skin.','Tente novamente por Skins.')}return;
 }
 if(incoming){
  try{const item=await exactItem(incoming);if(!item)return showArrivalError('Skin não encontrada.','Volte à skin e tente novamente.');arrivalButtons(item,origin,fromInventory);}catch(_){showArrivalError('Não foi possível carregar esta skin.','Tente novamente.')}return;
 }
 render();
}
async function loadTaxonomy(){
 state.loading=true;setState('Carregando taxonomia de armas…','Preparando as armas disponíveis.');
 try{const r=await fetch(API+'?limit=1&offset=0&ui=1');const d=await r.json().catch(()=>({status:'ERROR'}));if(!r.ok||d.status==='ERROR'||!Array.isArray(d.weapon_taxonomy))throw new Error('TAXONOMY_ERROR');state.taxonomy=d.weapon_taxonomy;hideState();$('loadoutBody').hidden=false;await consumeContext();}
 catch(_){setState('Não foi possível carregar o Loadout.','Não foi possível carregar as armas disponíveis. Tente novamente.',true,true)}
 finally{state.loading=false}
}
document.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>{state.side=b.dataset.side;persist();render()});
restore();loadTaxonomy();