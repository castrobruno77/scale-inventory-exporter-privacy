const API = 'https://ubtojlrfxoxbuvgajeos.supabase.co/functions/v1/tradeup-public';
const state = { slots: Array(10).fill(null), result: null };
const $ = id => document.getElementById(id);
const hasNumber = v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
const money = v => hasNumber(v) ? `US$ ${Number(v).toFixed(2)}` : 'N/D';
const pct = v => hasNumber(v) ? `${Number(v).toFixed(1)}%` : 'N/D';
const cleanName = n => String(n||'').replace(/^StatTrak™\s+/,'').replace(/^Souvenir\s+/,'').replace(/ \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/,'');
const short = n => cleanName(n).split('|').map(x=>x.trim()).slice(-1)[0]?.slice(0,3).toUpperCase() || 'SKN';
const ERROR_MESSAGES = {
  EXACTLY_10_INPUTS_REQUIRED:'Um trade-up exige exatamente 10 itens.',
  MARKET_KEY_AND_FLOAT_REQUIRED:'Um ou mais itens estão sem identificação da skin ou float.',
  INPUT_NOT_FOUND:'Uma das skins selecionadas não foi encontrada no catálogo elegível.',
  INPUT_NOT_TRADEUP_ELIGIBLE:'Um dos itens selecionados não é elegível para este trade-up.',
  MIXED_RARITY_NOT_ALLOWED:'Os 10 itens precisam ter a mesma raridade.',
  MIXED_STATTRAK_NOT_ALLOWED:'Itens StatTrak e não StatTrak não podem ser misturados no mesmo trade-up.',
  FLOAT_OUT_OF_RANGE:'Um dos floats informados está fora da faixa válida da skin.',
  NO_ELIGIBLE_OUTPUTS:'Nenhum resultado elegível foi encontrado para esta composição.',
  INVALID_PRICE_USD:'Um dos preços informados é inválido. Revise o valor e tente novamente.',
  RATE_LIMITED:'Muitas avaliações em pouco tempo. Tente novamente em instantes.',
  ORIGIN_NOT_ALLOWED:'Este ambiente não está autorizado a usar o serviço do Trade Lab.',
  PAYLOAD_TOO_LARGE:'Esta solicitação é maior do que o Trade Lab pode processar.',
  QUERY_TOO_LONG:'A busca é longa demais. Use um termo mais curto.',
  REQUEST_URI_TOO_LONG:'Esta solicitação não pôde ser processada porque o endereço ficou longo demais.',
  INVALID_JSON_BODY:'A solicitação não pôde ser interpretada. Reinicie o trade-up e tente novamente.',
  INTERNAL_ERROR:'O serviço retornou um erro interno. Seus dados de entrada não foram alterados.'
};
function applyTradeOriginContext(){
  const p=new URLSearchParams(location.search);
  const skin=p.get('skin')?.trim()||'';
  const from=p.get('from')||'';
  if(!skin)return;
  const box=$('tradeOriginContext');if(!box)return;
  box.hidden=false;
  $('tradeOriginTitle').textContent='Ponto de partida: '+cleanName(skin);
  $('tradeOriginDetail').textContent='Leve esta skin como referência para montar uma composição compatível. A composição não foi preenchida automaticamente.';
  if(from&&from.startsWith('/')&&!from.startsWith('//')){$('tradeOriginBack').href=from;$('tradeOriginBack').textContent='Voltar à skin';}
}
async function applyInventoryTradeContext(){
  const p=new URLSearchParams(location.search);
  const key=p.get('inventoryKey')?.trim()||'';
  if(!key)return;
  const from=p.get('from')||'';
  const floatParam=p.get('inventoryFloat');
  const box=$('tradeOriginContext');if(box){box.hidden=false;$('tradeOriginTitle').textContent='Do inventário importado: '+cleanName(key);$('tradeOriginDetail').textContent='Este exemplar foi trazido como contexto do snapshot importado. Owned vale apenas para este snapshot; tradability não é presumida.';if(from&&from.startsWith('/')&&!from.startsWith('//')){$('tradeOriginBack').href=from;$('tradeOriginBack').textContent='Voltar ao Inventory';}}
  try{
    const r=await fetch(API+'?q='+encodeURIComponent(key)+'&limit=24&ui=1');
    const d=await r.json().catch(()=>({status:'ERROR'}));if(!r.ok||d.status==='ERROR')throw new Error('LOOKUP');
    const item=(d.items||[]).find(x=>x.market_key===key);if(!item)throw new Error('NOT_FOUND');
    const raw=Number(floatParam);const float=Number.isFinite(raw)?Math.max(Number(item.float_min),Math.min(Number(item.float_max),raw)):defaultFloat(item);
    const idx=state.slots.findIndex(v=>!v);if(idx>=0){state.slots[idx]={...item,float_value:float,owned:true,from_inventory:true};renderInputs();resetResult();}
  }catch(_){
    if(box){$('tradeOriginDetail').textContent='A identidade veio do snapshot, mas não foi possível carregar a variante canônica agora. Nenhum slot foi preenchido.';}
  }
}
function skinEntityHref(x){
  const from=location.pathname+location.search;
  return '../database/skin/?key='+encodeURIComponent(x.market_key||x.skin_name||'')+'&from='+encodeURIComponent(from);
}
function setResultState(kind,title,detail){
  const box=$('resultState');
  box.className=`state-banner ${kind}`;
  $('resultStateTitle').textContent=title;
  $('resultStateDetail').textContent=detail;
  box.hidden=false;
}
function clearResultState(){ $('resultState').hidden=true; $('resultState').className='state-banner'; }
function art(name,imageUrl){ return imageUrl ? `<img src="${imageUrl}" alt="${cleanName(name)}" loading="lazy">` : `<div class="fallback-art">${short(name)}</div>`; }
function defaultFloat(item){
  const min=Number(item.float_min),max=Number(item.float_max); const target=Math.max(min,Math.min(max,0.10)); return +target.toFixed(6);
}
function renderInputs(){
  $('inputGrid').innerHTML=state.slots.map((item,i)=>{
    if(!item) return `<article class="input-card empty"><span class="slot-number">${String(i+1).padStart(2,'0')}</span><span>+</span></article>`;
    return `<article class="input-card filled">
      <span class="slot-number">${String(i+1).padStart(2,'0')}</span><button class="remove-btn" data-remove="${i}" aria-label="Remover">×</button>
      <div class="skin-art">${art(item.skin_name,item.image_url)}</div>
      <div class="input-info"><h3 title="${item.skin_name}">${item.skin_name}</h3><div class="collection" title="${item.collection}">${item.collection}</div>
      <div class="float-row"><label>float</label><input data-float="${i}" type="number" step="0.000001" min="${item.float_min}" max="${item.float_max}" value="${item.float_value}"></div>
      <div class="input-foot"><span>${item.rarity}</span><span>${item.is_stattrak?'ST':'normal'}</span></div></div></article>`;
  }).join('');
  $('slotCounter').textContent=`${state.slots.filter(Boolean).length} de 10 itens`;
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{state.slots[+b.dataset.remove]=null;state.result=null;renderInputs();resetResult();});
  document.querySelectorAll('[data-float]').forEach(inp=>inp.onchange=()=>{const i=+inp.dataset.float; const it=state.slots[i]; const v=Number(inp.value); if(Number.isFinite(v)){it.float_value=Math.max(Number(it.float_min),Math.min(Number(it.float_max),v)); inp.value=it.float_value;} state.result=null; resetResult(); updateCompatibility();});
  updateCompatibility();
}
function updateCompatibility(){
  const filled=state.slots.filter(Boolean); let msg='Complete os 10 itens para avaliar o trade-up.'; let ok=false;
  if(filled.length){const ranks=new Set(filled.map(x=>x.rarity_rank)),modes=new Set(filled.map(x=>!!x.is_stattrak));
    if(ranks.size>1) msg=ERROR_MESSAGES.MIXED_RARITY_NOT_ALLOWED; else if(modes.size>1) msg=ERROR_MESSAGES.MIXED_STATTRAK_NOT_ALLOWED; else if(filled.length<10) msg=`${filled.length} de 10 itens · complete os 10 itens para avaliar o trade-up.`; else {msg='10 de 10 itens · pronto para avaliar.';ok=true;}}
  $('compatibility').textContent=msg; $('simulateBtn').disabled=!ok;
}
async function search(){
  const q=$('skinSearch').value.trim(); if(q.length<2){showSearch([]);return;}
  $('searchBtn').textContent='…';
  try{
    const r=await fetch(`${API}?q=${encodeURIComponent(q)}&limit=18&ui=1`);
    const d=await r.json().catch(()=>({status:'ERROR',error:'INVALID_RESPONSE'}));
    if(!r.ok||d.status==='ERROR'){
      const code=d.error||`HTTP_${r.status}`;
      showSearch([],true,ERROR_MESSAGES[code]||'Falha ao consultar o catálogo.',code);
      return;
    }
    showSearch(d.items||[]);
  }catch(e){showSearch([],true,'Falha ao consultar o catálogo.','NETWORK_ERROR');}
  finally{$('searchBtn').textContent='Buscar';}
}
function showSearch(items,error=false,message='Falha ao consultar o catálogo.',code=''){
  const box=$('searchResults'); if(error){box.innerHTML=`<div class="search-item error">${message}${code?` · ${code}`:''}</div>`;box.hidden=false;return;}
  if(!items.length){box.innerHTML='<div class="search-item"><span>Nenhum resultado</span></div>';box.hidden=false;return;}
  box.innerHTML=items.map((x,i)=>`<button class="search-item" data-pick="${i}"><span class="search-thumb">${art(x.skin_name,x.image_url)}</span><span class="search-copy"><strong>${x.skin_name}</strong><span class="meta">${x.collection} · ${x.rarity} · float ${x.float_min}–${x.float_max}</span></span><span class="badge">${x.is_stattrak?'ST':'NORMAL'}</span></button>`).join('');
  box.hidden=false; document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>pick(items[+b.dataset.pick]));
}
function pick(x){const idx=state.slots.findIndex(v=>!v);if(idx<0)return;state.slots[idx]={...x,float_value:defaultFloat(x),owned:false};$('searchResults').hidden=true;$('skinSearch').value='';renderInputs();}
function resetResult(){
  $('summarySection').hidden=true;
  $('outputsSection').hidden=true;
  $('engineStatus').textContent='aguardando avaliação';
  clearResultState();
}
function colorForReturn(v){
  if(!hasNumber(v)) return {h:190,bg:'hsl(190 28% 15%)',border:'hsl(190 28% 32%)'};
  const n=Number(v); let h=n>=0?58+Math.min(n,80)/80*72:58-Math.min(Math.abs(n),100)/100*58; h=Math.max(0,Math.min(132,h));
  return {h,bg:`hsl(${h} 55% 15%)`,border:`hsl(${h} 70% 42%)`};
}
function patternFlag(name){return /(Case Hardened|Heat Treated|Fade|Doppler|Gamma Doppler|Marble Fade|Slaughter|Crimson Web)/i.test(name);}
function renderSummary(d){const e=d.economics||{};$('summarySection').hidden=false;$('economicCost').textContent=money(e.economic_cost_usd);$('profitChance').textContent=pct(e.profit_probability_pct);$('expectedValue').textContent=money(e.expected_value_usd);$('worstRecovery').textContent=pct(e.worst_recovery_pct);$('roi').textContent=pct(e.roi_pct);$('expectedProfit').textContent=money(e.expected_profit_usd);$('additionalSpend').textContent=money(e.additional_spend_usd);$('coverage').textContent=`Inputs: ${e.input_price_coverage ?? 'N/D'} · Outputs: ${e.output_price_coverage ?? 'N/D'}`;}
function renderOutputs(outputs){
  $('outputsSection').hidden=false;$('outputGrid').innerHTML=outputs.map(x=>{const c=colorForReturn(x.return_pct);const partial=!hasNumber(x.return_pct);return `<article class="output-card ${partial?'partial':''}" style="--out-bg:${c.bg};--out-border:${c.border}">
    <div class="output-top"><span class="chance">${pct(x.probability_pct)}</span><span class="return-pill">${hasNumber(x.return_pct)?(Number(x.return_pct)>=0?'+':'')+Number(x.return_pct).toFixed(1)+'%':'N/D'}</span></div>
    <div class="skin-art">${art(x.skin_name,x.image_url)}</div><div class="output-body"><h3>${x.skin_name}</h3><div class="output-meta">Desgaste previsto: ${x.predicted_wear || 'N/D'} · Float previsto: ${hasNumber(x.predicted_float)?Number(x.predicted_float).toFixed(5):'N/D'}</div><div class="output-meta">${x.collection}</div>
    <div class="market-context"><span>Fonte: ${x.market?.source || 'N/D'}</span><span>Confiança: ${x.market?.confidence ?? 'N/D'}</span><span>Atualizado: ${x.market?.updated_at || 'N/D'}</span></div>
    ${patternFlag(x.skin_name)?'<span class="pattern-flag">PATTERN-SENSITIVE · explorar depois</span>':''}
    <div class="output-money"><div><span>Valor realizável</span><strong>${money(x.market?.realizable_usd)}</strong></div><div><span>Lucro / perda</span><strong>${hasNumber(x.profit_usd)?`${Number(x.profit_usd)>=0?'+':'-'}US$ ${Math.abs(Number(x.profit_usd)).toFixed(2)}`:'N/D'}</strong></div></div>
    <div class="output-actions"><button class="mini-btn" disabled title="Inspect exige um asset/listing real">Inspect</button><a class="mini-btn enabled" href="${skinEntityHref(x)}">Abrir skin</a></div></div></article>`}).join('');
}
async function simulate(){
  const inputs=state.slots.map(x=>({market_key:x.market_key,float_value:Number(x.float_value),owned:!!x.owned}));
  $('simulateBtn').disabled=true;
  $('simulateBtn').textContent='Avaliando…';
  $('engineStatus').textContent='avaliando estrutura e dados de mercado';
  clearResultState();
  try{
    const r=await fetch(`${API}?ui=1`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({inputs})});
    const d=await r.json().catch(()=>({status:'ERROR',error:'INVALID_RESPONSE'}));
    if(!r.ok||d.status!=='OK'){
      const code=d.error||`HTTP_${r.status}`;
      const friendly=ERROR_MESSAGES[code]||'Não foi possível avaliar este contrato com segurança.';
      $('summarySection').hidden=true;
      $('outputsSection').hidden=true;
      $('engineStatus').textContent='erro de avaliação';
      setResultState('error','ERROR · Não foi possível avaliar o trade-up',`${friendly} · ${code}`);
      return;
    }
    state.result=d;
    if(Array.isArray(d.inputs)){
      d.inputs.forEach((x,i)=>{if(state.slots[i])state.slots[i]={...state.slots[i],image_url:x.image_url||state.slots[i].image_url};});
      renderInputs();
    }
    renderSummary(d);
    renderOutputs(d.outputs||[]);
    const economicsStatus=String(d.economics?.status||'').toUpperCase();
    if(economicsStatus==='COMPLETE'){
      $('engineStatus').textContent=`${d.outputs.length} outputs · cobertura completa`;
      setResultState('complete','COMPLETE · Leitura econômica completa','Há dados de mercado disponíveis para os inputs e resultados necessários ao cálculo do resumo econômico. Revise fonte, confiança e momento da observação antes de agir. As condições de mercado podem mudar após esta avaliação.');
    }else if(economicsStatus==='PARTIAL'){
      $('engineStatus').textContent=`${d.outputs.length} outputs · cobertura parcial`;
      setResultState('partial','PARTIAL · Leitura econômica parcial','A estrutura do trade-up está disponível, mas a cobertura de mercado está incompleta. Valores econômicos sem suporte permanecem como N/D. Probabilidades e floats previstos ainda podem ser analisados. Não trate preços ausentes como zero.');
    }else{
      $('summarySection').hidden=true;
      $('outputsSection').hidden=true;
      $('engineStatus').textContent='estado econômico inválido';
      setResultState('error','ERROR · Não foi possível avaliar o trade-up','O serviço respondeu sem um estado econômico COMPLETE ou PARTIAL reconhecido. Nenhum valor econômico foi inferido no frontend.');
    }
  }catch(e){
    $('summarySection').hidden=true;
    $('outputsSection').hidden=true;
    $('engineStatus').textContent='falha de conexão';
    setResultState('error','ERROR · Não foi possível avaliar o trade-up','Verifique os itens e tente novamente. Sua composição atual continua disponível para edição. · NETWORK_ERROR');
  }finally{
    $('simulateBtn').disabled=false;
    $('simulateBtn').textContent='Avaliar trade-up';
  }
}
async function loadDemo(){
  let base={collection:'The Arms Deal 2 Collection',skin_name:'FAMAS | Hexane',rarity:'Mil-Spec Grade',rarity_rank:3,float_min:0,float_max:.4,market_key:'FAMAS | Hexane',is_stattrak:false,image_url:null};
  try{const r=await fetch(`${API}?q=${encodeURIComponent('FAMAS | Hexane')}&limit=6&ui=1`);const d=await r.json();const found=(d.items||[]).find(x=>x.market_key==='FAMAS | Hexane'&&!x.is_stattrak);if(found)base=found;}catch(_){}
  state.slots=Array.from({length:10},()=>({...base,float_value:.10,owned:false}));state.result=null;renderInputs();resetResult();
}
$('searchBtn').onclick=search;$('skinSearch').addEventListener('keydown',e=>{if(e.key==='Enter')search();});let timer;$('skinSearch').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,280)});$('demoBtn').onclick=loadDemo;$('clearBtn').onclick=()=>{state.slots=Array(10).fill(null);state.result=null;renderInputs();resetResult();};$('simulateBtn').onclick=simulate;$('advancedBtn').onclick=()=>{const p=$('advancedPanel');p.hidden=!p.hidden;$('advancedBtn').textContent=p.hidden?'Ver detalhes':'Ocultar detalhes';};document.addEventListener('click',e=>{if(!e.target.closest('.search-shell'))$('searchResults').hidden=true;});
applyTradeOriginContext();
renderInputs();
applyInventoryTradeContext();
