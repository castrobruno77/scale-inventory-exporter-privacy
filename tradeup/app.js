const API='https://ubtojlrfxoxbuvgajeos.supabase.co/functions/v1/tradeup-public';
const INVENTORY_STORE='scale_inventory_bridge_v01_session';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const hasNumber=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
const money=v=>hasNumber(v)?'US$ '+Number(v).toFixed(2):'N/D';
const pct=v=>hasNumber(v)?Number(v).toFixed(1)+'%':'N/D';
const cleanName=n=>String(n||'').replace(/^StatTrak™\s+/,'').replace(/^Souvenir\s+/,'').replace(/ \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/,'');
const short=n=>cleanName(n).split('|').map(x=>x.trim()).slice(-1)[0]?.slice(0,3).toUpperCase()||'SKN';
const qp=new URLSearchParams(location.search);
const state={
  goalMode:Boolean(qp.get('skin')),
  targetKey:qp.get('skin')?.trim()||'',
  target:null,
  goal:null,
  slots:Array(10).fill(null),
  result:null,
  searchItems:[],
  inventory:readInventory()
};

const ERROR_MESSAGES={
  EXACTLY_10_INPUTS_REQUIRED:'Um contrato exige exatamente 10 skins.',
  MARKET_KEY_AND_FLOAT_REQUIRED:'Uma ou mais skins estão sem identificação ou float.',
  TARGET_NOT_FOUND:'A skin-alvo não foi encontrada.',
  TARGET_NOT_REACHABLE_AS_OUTPUT:'Esta skin não pode ser resultado de um contrato com o catálogo atual.',
  INPUT_NOT_FOUND:'Uma das skins não foi encontrada no catálogo elegível.',
  INPUT_NOT_TRADEUP_ELIGIBLE:'Uma das skins não é elegível para contrato.',
  INPUT_RARITY_MISMATCH:'A raridade deste input não corresponde ao contrato da skin-alvo.',
  INPUT_MODE_MISMATCH:'Normal e StatTrak não podem ser misturados neste objetivo.',
  INPUT_FLOAT_OUT_OF_RANGE:'O float informado está fora da faixa aceita.',
  INPUT_COLLECTION_HAS_NO_OUTPUTS:'Uma coleção selecionada não possui resultado elegível neste nível.',
  DUPLICATE_ASSET_ID:'O mesmo asset do inventário foi usado mais de uma vez.',
  TOO_MANY_INPUTS:'O contrato aceita no máximo 10 inputs.',
  INVALID_OBJECTIVE:'O objetivo de desgaste/float é inválido.',
  CONTRACT_INTEGRITY:'O serviço detectou divergência entre o contrato orientado ao objetivo e o avaliador final.',
  MIXED_RARITY_NOT_ALLOWED:'As 10 skins precisam ter a mesma raridade.',
  MIXED_STATTRAK_NOT_ALLOWED:'Itens StatTrak e não StatTrak não podem ser misturados.',
  FLOAT_OUT_OF_RANGE:'Um float está fora da faixa válida da skin.',
  NO_ELIGIBLE_OUTPUTS:'Nenhum resultado elegível foi encontrado.',
  RATE_LIMITED:'Muitas avaliações em pouco tempo. Tente novamente em instantes.',
  ORIGIN_NOT_ALLOWED:'Este ambiente não está autorizado a usar o serviço de contratos.',
  PAYLOAD_TOO_LARGE:'Esta solicitação é maior do que o serviço pode processar.',
  QUERY_TOO_LONG:'A busca é longa demais. Use um termo mais curto.',
  INVALID_JSON_BODY:'A solicitação não pôde ser interpretada.',
  INTERNAL_ERROR:'O serviço retornou um erro interno.'
};

function readInventory(){
  try{
    const raw=sessionStorage.getItem(INVENTORY_STORE);
    return raw?JSON.parse(raw):null;
  }catch(_){return null}
}
function safeLocalPath(v){return v&&v.startsWith('/')&&!v.startsWith('//')?v:''}
function art(name,url){
  return url?'<img src="'+esc(url)+'" alt="'+esc(cleanName(name))+'" loading="lazy">':'<div class="fallback-art">'+esc(short(name))+'</div>';
}
function defaultFloat(item,allowed=null){
  const ownMin=Number(item.float_min),ownMax=Number(item.float_max);
  let min=hasNumber(allowed?.min)?Number(allowed.min):ownMin;
  let max=hasNumber(allowed?.max)?Number(allowed.max):ownMax;
  if(max<min){min=ownMin;max=ownMax}
  return +Math.max(min,Math.min(max,0.10)).toFixed(6);
}
function objectivePayload(){
  const wear=$('wearGoal')?.value||'';
  const min=$('floatMinGoal')?.value;
  const max=$('floatMaxGoal')?.value;
  const objective={};
  if(wear)objective.wear=wear;
  if(min!==''||max!==''){
    if(min===''||max==='')return {error:'Informe os dois limites da faixa de float.'};
    objective.float_range={min:Number(min),max:Number(max)};
  }
  return {objective};
}
function selectedInputs(){
  return state.slots.filter(Boolean).map(x=>{
    const input={market_key:x.market_key,float_value:Number(x.float_value),origin:x.origin||'DATABASE'};
    if(x.origin==='INVENTORY'){
      input.asset_id=x.asset_id;
      input.owned=true;
      if(hasNumber(x.price_usd))input.price_usd=Number(x.price_usd);
    }else{
      input.owned=false;
      if(hasNumber(x.price_usd))input.price_usd=Number(x.price_usd);
    }
    return input;
  });
}
function setResultState(kind,title,detail){
  const box=$('resultState');box.className='state-banner '+kind;
  $('resultStateTitle').textContent=title;$('resultStateDetail').textContent=detail;box.hidden=false;
}
function clearResultState(){ $('resultState').hidden=true;$('resultState').className='state-banner';}
function apiError(d,status){
  const code=d?.error||('HTTP_'+status);
  return {code,message:ERROR_MESSAGES[code]||'Não foi possível processar este contrato com segurança.'};
}
function applyOriginContext(){
  const from=qp.get('from')||'';
  const box=$('tradeOriginContext');
  if(state.goalMode){
    box.hidden=false;
    $('tradeOriginTitle').textContent='Como obter esta skin';
    $('tradeOriginDetail').textContent='A skin-alvo permanece fixa enquanto você define o objetivo e monta os 10 inputs.';
    if(safeLocalPath(from)){$('tradeOriginBack').href=from;$('tradeOriginBack').textContent='Voltar à skin';}
    return;
  }
  const invKey=qp.get('inventoryKey')?.trim()||'';
  if(invKey){
    box.hidden=false;$('tradeOriginTitle').textContent='Do inventário importado: '+cleanName(invKey);
    $('tradeOriginDetail').textContent='Este exemplar veio do snapshot importado. Isso comprova apenas presença no snapshot, não marketability ou tradability.';
    if(safeLocalPath(from)){$('tradeOriginBack').href=from;$('tradeOriginBack').textContent='Voltar ao Inventário';}
  }
}
function setGoalModeUI(){
  $('goalPanel').hidden=!state.goalMode;
  $('originLegend').hidden=!state.goalMode;
  $('demoBtn').hidden=state.goalMode;
  if(state.goalMode){
    $('pageTitle').innerHTML='Obtenha a skin-alvo.<br><em>Monte o caminho.</em>';
    $('pageLead').textContent='Defina o desgaste ou float desejado, componha até 10 inputs e acompanhe validade, possibilidade e chance sem transformar probabilidade em promessa.';
    $('searchLabel').textContent='Adicionar skin ao contrato';
    $('inputHint').textContent='Inputs do Inventário preservam asset e float reais. Itens vindos de Skins são simulações com float escolhido.';
    $('simulateBtn').textContent='Calcular contrato';
  }
}
function renderInputs(){
  $('inputGrid').innerHTML=state.slots.map((item,i)=>{
    if(!item)return '<article class="input-card empty"><span class="slot-number">'+String(i+1).padStart(2,'0')+'</span><span>+</span><small>Adicionar skin</small></article>';
    const inv=item.origin==='INVENTORY';
    const originLabel=inv?'Inventário importado':'Simulação · Skins';
    const floatControl=inv
      ? '<div class="fixed-float"><span>Float real</span><strong>'+Number(item.float_value).toFixed(6)+'</strong></div>'
      : '<div class="float-row"><label>float simulado</label><input data-float="'+i+'" type="number" step="0.000001" min="'+item.float_min+'" max="'+item.float_max+'" value="'+item.float_value+'"></div>';
    return '<article class="input-card filled '+(inv?'origin-inventory':'origin-database')+'">'+
      '<span class="slot-number">'+String(i+1).padStart(2,'0')+'</span><button class="remove-btn" data-remove="'+i+'" aria-label="Remover">×</button>'+
      '<span class="origin-chip '+(inv?'inventory':'database')+'">'+originLabel+'</span>'+
      '<div class="skin-art">'+art(item.skin_name,item.image_url)+'</div>'+
      '<div class="input-info"><h3 title="'+esc(item.skin_name)+'">'+esc(cleanName(item.skin_name))+'</h3><div class="collection" title="'+esc(item.collection)+'">'+esc(item.collection||'N/D')+'</div>'+
      floatControl+
      '<div class="input-foot"><span>'+esc(item.rarity||'N/D')+'</span><span>'+(item.is_stattrak?'StatTrak':'Normal')+'</span></div>'+
      (inv?'<div class="asset-note">asset '+esc(item.asset_id||'N/D')+'</div>':'')+
      '</div></article>';
  }).join('');
  const count=state.slots.filter(Boolean).length;
  $('slotCounter').textContent=count+' de 10 skins';
  if($('goalProgress'))$('goalProgress').textContent=count+' de 10 skins';
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=async()=>{state.slots[+b.dataset.remove]=null;resetFinal();renderInputs();if(state.goalMode)await evaluateGoal();else updateLegacyProgress();});
  document.querySelectorAll('[data-float]').forEach(inp=>inp.onchange=async()=>{
    const i=+inp.dataset.float,it=state.slots[i],v=Number(inp.value);
    if(Number.isFinite(v)){it.float_value=Math.max(Number(it.float_min),Math.min(Number(it.float_max),v));inp.value=it.float_value;}
    resetFinal();if(state.goalMode)await evaluateGoal();else updateLegacyProgress();
  });
  if(!state.goalMode)updateLegacyProgress();
}
function updateLegacyProgress(){
  const count=state.slots.filter(Boolean).length;
  $('compatibility').textContent=count<10?count+' de 10 skins · complete o contrato para calcular.':'10 de 10 skins · pronto para calcular.';
  $('simulateBtn').disabled=count!==10;
}
function resetFinal(){
  state.result=null;$('summarySection').hidden=true;$('outputsSection').hidden=true;clearResultState();
}
function renderGoalState(d){
  state.goal=d;
  const c=d.contract||{},t=d.target||{},o=d.objective||{},p=t.probability||{};
  $('goalProgress').textContent=(c.selected_count??0)+' de 10 skins';

  const cEl=$('contractValidState');
  cEl.textContent=c.valid===true?'Contrato válido até aqui':c.valid===false?'Este contrato precisa de ajuste':'—';
  cEl.className=c.valid===true?'ok-text':c.valid===false?'bad-text':'';
  $('contractReason').textContent=c.valid===true?'Estrutura aceita pelo contrato VETOR':(c.reasons||[]).map(r=>ERROR_MESSAGES[r]||r).join(' · ')||'Aguardando';

  $('targetPossibleState').textContent=t.possible===true?'A skin-alvo ainda é possível':t.possible===false?'A skin-alvo não é mais possível com esta composição':t.possible===null?'—':'—';
  $('targetPossibleState').className=t.possible===true?'ok-text':t.possible===false?'bad-text':'';
  $('targetPossibleReason').textContent=t.possible===true
    ? (Number(t.selected_target_collection_inputs||0)===0
      ? 'Adicione uma skin da coleção-alvo para começar a garantir participação dessa coleção.'
      : 'A composição atual mantém esta skin-alvo no contrato.')
    : t.possible===false
      ? 'Troque inputs para recuperar um caminho compatível para a skin-alvo.'
      : 'Depende de uma estrutura válida';

  $('floatReachableState').textContent=o.float_goal_reachable===true?'O objetivo de float ainda é alcançável':o.float_goal_reachable===false?'O objetivo de float não é mais alcançável':'—';
  $('floatReachableState').className=o.float_goal_reachable===true?'ok-text':o.float_goal_reachable===false?'bad-text':'';
  $('floatReachableReason').textContent=o.effective_float_range
    ? 'Faixa desejada válida: '+formatRange(o.effective_float_range)
    : 'Sem objetivo de desgaste/float';

  const finalChance=p.final_pct!==null&&p.final_pct!==undefined;
  $('targetProbabilityLabel').textContent=finalChance?'Chance da skin-alvo':'Chance já comprometida';
  $('targetProbability').textContent=finalChance?pct(p.final_pct):pct(p.committed_pct);
  $('targetProbabilityRange').textContent=finalChance
    ? 'Chance final com 10 inputs válidos.'
    : (hasNumber(p.min_final_pct_if_target_preserved)||hasNumber(p.max_final_pct)
      ? 'Faixa possível ao completar: '+pct(p.min_final_pct_if_target_preserved)+'–'+pct(p.max_final_pct)
      : 'Faixa possível ao completar: —');

  const env=d.progressive?.next_normalized_envelope;
  if(env){
    $('progressiveEnvelope').hidden=false;
    $('progressiveEnvelope').textContent='Para manter o objetivo, use a faixa de float compatível mostrada em cada skin.';
  }else $('progressiveEnvelope').hidden=true;

  const count=Number(c.selected_count||0);
  $('compatibility').textContent=!c.valid?'Revise a composição antes de continuar.':count<10?count+' de 10 skins · composição estruturalmente válida.':'10 de 10 skins · avaliação final disponível.';
  $('simulateBtn').disabled=!(count===10&&c.valid===true);
  $('engineStatus').textContent='Goal-Aware · '+count+'/10 · '+(c.valid?'estrutura válida':'revisão necessária');

  if(count===10&&c.valid&&d.final_evaluation){
    state.result=d.final_evaluation;
    renderFinalEvaluation(d.final_evaluation);
    const successTarget=t.possible===true?'skin-alvo presente':'skin-alvo fora dos resultados';
    const successFloat=o.float_goal_reachable===true?'objetivo de float alcançável':o.float_goal_reachable===false?'objetivo de float não alcançável':'sem objetivo de float';
    setResultState('complete','Avaliação final disponível',successTarget+' · '+successFloat+' · chance final da skin-alvo '+pct(p.final_pct)+'.');
  }
}
function formatRange(r){
  if(!r||!hasNumber(r.min)||!hasNumber(r.max))return 'N/D';
  return Number(r.min).toFixed(6)+' – '+Number(r.max).toFixed(6)+(r.max_inclusive===false?' (máx. exclusivo)':'');
}
async function postGoal(extra={}){
  const op=objectivePayload();
  if(op.error)throw new Error('OBJECTIVE_UI:'+op.error);
  const body={mode:'GOAL_AWARE',target:{market_key:state.targetKey},inputs:selectedInputs(),...op,...extra};
  const r=await fetch(API+'?ui=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json().catch(()=>({status:'ERROR',error:'INVALID_RESPONSE'}));
  if(!r.ok||d.status!=='OK'){const e=apiError(d,r.status);const err=new Error(e.message);err.code=e.code;err.payload=d;throw err;}
  return d;
}
async function evaluateGoal(){
  if(!state.targetKey)return;
  clearResultState();
  try{
    const d=await postGoal();
    renderGoalState(d);
  }catch(e){
    if(String(e.message).startsWith('OBJECTIVE_UI:')){
      $('objectiveHelper').textContent=String(e.message).replace('OBJECTIVE_UI:','');
      $('objectiveHelper').classList.add('error');
      return;
    }
    $('engineStatus').textContent='não foi possível atualizar';
    setResultState('error','Não foi possível atualizar o contrato',(e.message||'Tente novamente.')+(e.code?' · '+e.code:''));
  }
}
async function loadTarget(){
  if(!state.goalMode)return;
  $('targetName').textContent='Carregando skin-alvo…';
  try{
    const r=await fetch(API+'?q='+encodeURIComponent(state.targetKey)+'&limit=24&ui=1');
    const d=await r.json().catch(()=>({status:'ERROR'}));
    if(!r.ok||d.status==='ERROR')throw new Error(apiError(d,r.status).message);
    const item=(d.items||[]).find(x=>x.market_key===state.targetKey)||(d.items||[]).find(x=>x.skin_name===state.targetKey);
    if(!item)throw new Error('Skin-alvo não encontrada no catálogo.');
    state.target=item;
    $('targetName').textContent=cleanName(item.skin_name);
    $('targetMeta').textContent=(item.collection||'N/D')+' · '+(item.rarity||'N/D')+' · '+(item.is_stattrak?'StatTrak':'Normal');
    $('targetArt').innerHTML=art(item.skin_name,item.image_url);
    document.title='SCALE — Como obter '+cleanName(item.skin_name);
    const g=await postGoal();
    renderGoalState(g);
    $('targetEligibility').textContent=g.target?.eligible?'Elegível como resultado de contrato':'Não elegível como resultado com o catálogo atual';
    $('targetEligibility').className='inline-state '+(g.target?.eligible?'positive':'negative');
    if(!g.target?.eligible){
      $('skinSearch').disabled=true;$('searchBtn').disabled=true;
      setResultState('error','Esta skin não pode ser usada como alvo','O contrato certificado não encontrou predecessor elegível para esta skin/modalidade.');
    }
  }catch(e){
    $('targetName').textContent='Não foi possível carregar a skin-alvo';
    $('targetMeta').textContent=e.message||'Tente novamente.';
    $('targetEligibility').textContent='Indisponível';
    $('targetEligibility').className='inline-state negative';
    $('skinSearch').disabled=true;$('searchBtn').disabled=true;
  }
}
function inventoryMatchesCandidate(c){
  const items=state.inventory?.items||[];
  const a=c.allowed_float_range;
  return items.filter(x=>{
    if(x.match_state!=='MATCHED'||x.market_key!==c.market_key||!hasNumber(x.float_value))return false;
    if(!a)return true;
    const v=Number(x.float_value),min=Number(a.min),max=Number(a.max);
    return v>=min-1e-9&&(a.max_inclusive===false?v<max-1e-9:v<=max+1e-9);
  });
}
async function search(){
  const q=$('skinSearch').value.trim();
  if(q.length<2){showSearch([]);return;}
  $('searchBtn').textContent='…';
  try{
    if(state.goalMode){
      const d=await postGoal({candidate_query:{q,limit:18,offset:0}});
      renderGoalState(d);
      showGoalSearch(d.candidates||[]);
    }else{
      const r=await fetch(API+'?q='+encodeURIComponent(q)+'&limit=18&ui=1');
      const d=await r.json().catch(()=>({status:'ERROR'}));
      if(!r.ok||d.status==='ERROR'){const e=apiError(d,r.status);showSearch([],true,e.message,e.code);return;}
      showSearch(d.items||[]);
    }
  }catch(e){showSearch([],true,e.message||'Falha ao consultar o catálogo.',e.code||'NETWORK_ERROR')}
  finally{$('searchBtn').textContent='Buscar';}
}
function showGoalSearch(items){
  state.searchItems=items;
  const box=$('searchResults');
  if(!items.length){box.innerHTML='<div class="search-item"><span>Nenhuma skin compatível encontrada</span></div>';box.hidden=false;return;}
  box.innerHTML=items.map((x,i)=>{
    const assets=inventoryMatchesCandidate(x);
    const allowed=x.allowed_float_range||{min:x.float_min,max:x.float_max,max_inclusive:true};
    const allowedText=formatRange(allowed);
    const relation=x.relation_to_target_collection==='TARGET_COLLECTION'
      ? 'Mantém esta skin-alvo no contrato'
      : 'Compatível, mas reduz a participação da coleção-alvo';
    const assetHtml=assets.length?'<div class="inventory-match-list">'+assets.slice(0,4).map((a,j)=>
      '<button type="button" class="inventory-pick" data-candidate="'+i+'" data-asset="'+j+'"><strong>Adicionar do Inventário</strong><span>asset '+esc(a.asset_id)+' · float '+Number(a.float_value).toFixed(6)+'</span></button>'
    ).join('')+(assets.length>4?'<small>+'+(assets.length-4)+' itens compatíveis neste snapshot</small>':'')+'</div>':'';
    return '<article class="goal-search-item"><div class="goal-search-main"><span class="search-thumb">'+art(x.skin_name,x.image_url)+'</span><span class="search-copy"><strong>'+esc(cleanName(x.skin_name))+'</strong><span class="meta">'+esc(x.collection)+' · '+esc(x.rarity)+'</span><span class="meta">Float compatível agora: '+esc(allowedText)+'</span><span class="meta">'+relation+'</span></span><span class="prob-delta">Após adicionar: '+pct(x.target_committed_probability_after_pct)+'</span></div>'+
      '<div class="candidate-actions candidate-simulation"><label>Float simulado <input class="candidate-float" data-candidate-float="'+i+'" type="number" step="0.000001" min="'+allowed.min+'" max="'+allowed.max+'" placeholder="Informe um float"></label><button type="button" class="button secondary compact simulation-pick" data-candidate="'+i+'" disabled>Adicionar ao contrato</button></div>'+assetHtml+'</article>';
  }).join('');
  box.hidden=false;
  document.querySelectorAll('[data-candidate-float]').forEach(inp=>{
    const i=+inp.dataset.candidateFloat;
    const candidate=items[i];
    const allowed=candidate.allowed_float_range||{min:candidate.float_min,max:candidate.float_max,max_inclusive:true};
    const btn=box.querySelector('.simulation-pick[data-candidate="'+i+'"]');
    const validate=()=>{
      const v=Number(inp.value);
      const ok=inp.value!==''&&Number.isFinite(v)&&v>=Number(allowed.min)-1e-9&&
        (allowed.max_inclusive===false?v<Number(allowed.max)-1e-9:v<=Number(allowed.max)+1e-9);
      btn.disabled=!ok;
    };
    inp.addEventListener('input',validate);validate();
  });
  document.querySelectorAll('.simulation-pick').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.candidate;
    const inp=box.querySelector('[data-candidate-float="'+i+'"]');
    pickGoalCandidate(items[i],null,inp?.value);
  });
  document.querySelectorAll('.inventory-pick').forEach(b=>{
    const c=items[+b.dataset.candidate],assets=inventoryMatchesCandidate(c);
    b.onclick=()=>pickGoalCandidate(c,assets[+b.dataset.asset],null);
  });
}
function pickGoalCandidate(c,asset,simulatedFloat){
  const idx=state.slots.findIndex(v=>!v);if(idx<0)return;
  if(asset){
    state.slots[idx]={
      ...c,skin_name:c.skin_name,is_stattrak:state.target?.is_stattrak,
      float_value:Number(asset.float_value),origin:'INVENTORY',asset_id:String(asset.asset_id),owned:true,
      price_usd:hasNumber(asset.valuation_usd)?Number(asset.valuation_usd):null
    };
  }else{
    if(!hasNumber(simulatedFloat))return;
    state.slots[idx]={
      ...c,is_stattrak:state.target?.is_stattrak,
      float_value:Number(simulatedFloat),origin:'DATABASE',owned:false
    };
  }
  $('searchResults').hidden=true;$('skinSearch').value='';
  renderInputs();resetFinal();evaluateGoal();
}
function showSearch(items,error=false,message='Falha ao consultar o catálogo.',code=''){
  const box=$('searchResults');
  if(error){box.innerHTML='<div class="search-item error">'+esc(message)+(code?' · '+esc(code):'')+'</div>';box.hidden=false;return;}
  if(!items.length){box.innerHTML='<div class="search-item"><span>Nenhum resultado</span></div>';box.hidden=false;return;}
  state.searchItems=items;
  box.innerHTML=items.map((x,i)=>'<button class="search-item" data-pick="'+i+'"><span class="search-thumb">'+art(x.skin_name,x.image_url)+'</span><span class="search-copy"><strong>'+esc(cleanName(x.skin_name))+'</strong><span class="meta">'+esc(x.collection)+' · '+esc(x.rarity)+' · float '+x.float_min+'–'+x.float_max+'</span></span><span class="badge">'+(x.is_stattrak?'STATTRAK':'NORMAL')+'</span></button>').join('');
  box.hidden=false;document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>pickLegacy(items[+b.dataset.pick]));
}
function pickLegacy(x){
  const idx=state.slots.findIndex(v=>!v);if(idx<0)return;
  state.slots[idx]={...x,float_value:defaultFloat(x),owned:false,origin:'DATABASE'};
  $('searchResults').hidden=true;$('skinSearch').value='';renderInputs();resetFinal();
}
function colorForReturn(v){
  if(!hasNumber(v))return {bg:'hsl(190 28% 15%)',border:'hsl(190 28% 32%)'};
  const n=Number(v);let h=n>=0?58+Math.min(n,80)/80*72:58-Math.min(Math.abs(n),100)/100*58;h=Math.max(0,Math.min(132,h));
  return {bg:'hsl('+h+' 55% 15%)',border:'hsl('+h+' 70% 42%)'};
}
function renderSummary(d){
  const e=d.economics||{};$('summarySection').hidden=false;
  $('economicCost').textContent=money(e.economic_cost_usd);$('profitChance').textContent=pct(e.profit_probability_pct);
  $('expectedValue').textContent=money(e.expected_value_usd);$('worstRecovery').textContent=pct(e.worst_recovery_pct);
  $('roi').textContent=pct(e.roi_pct);$('expectedProfit').textContent=money(e.expected_profit_usd);
  $('additionalSpend').textContent=money(e.additional_spend_usd);
  $('coverage').textContent='Inputs: '+(e.input_price_coverage??'N/D')+' · Resultados: '+(e.output_price_coverage??'N/D');
}
function skinEntityHref(x){
  const from=location.pathname+location.search;
  return '../database/skin/?key='+encodeURIComponent(x.market_key||x.skin_name||'')+'&from='+encodeURIComponent(from);
}
function renderOutputs(outputs){
  $('outputsSection').hidden=false;
  $('outputGrid').innerHTML=outputs.map(x=>{
    const c=colorForReturn(x.return_pct),partial=!hasNumber(x.return_pct);
    const targetClass=state.goalMode&&x.market_key===state.targetKey?' target-output':'';
    return '<article class="output-card '+(partial?'partial':'')+targetClass+'" style="--out-bg:'+c.bg+';--out-border:'+c.border+'">'+
      '<div class="output-top"><span class="chance">'+pct(x.probability_pct)+'</span><span class="return-pill">'+(hasNumber(x.return_pct)?(Number(x.return_pct)>=0?'+':'')+Number(x.return_pct).toFixed(1)+'%':'N/D')+'</span></div>'+
      (targetClass?'<span class="target-result-badge">Skin-alvo</span>':'')+
      '<div class="skin-art">'+art(x.skin_name,x.image_url)+'</div><div class="output-body"><h3>'+esc(cleanName(x.skin_name))+'</h3>'+
      '<div class="output-meta">Desgaste previsto: '+esc(x.predicted_wear||'N/D')+' · Float previsto: '+(hasNumber(x.predicted_float)?Number(x.predicted_float).toFixed(5):'N/D')+'</div>'+
      '<div class="output-meta">'+esc(x.collection||'N/D')+'</div>'+
      '<div class="market-context"><span>Fonte: '+esc(x.market?.source||'N/D')+'</span><span>Confiança: '+esc(x.market?.confidence??'N/D')+'</span><span>Atualizado: '+esc(x.market?.updated_at||'N/D')+'</span></div>'+
      '<div class="output-money"><div><span>Valor realizável</span><strong>'+money(x.market?.realizable_usd)+'</strong></div><div><span>Lucro ou perda</span><strong>'+(hasNumber(x.profit_usd)?(Number(x.profit_usd)>=0?'+':'-')+'US$ '+Math.abs(Number(x.profit_usd)).toFixed(2):'N/D')+'</strong></div></div>'+
      '<div class="output-actions"><a class="mini-btn enabled" href="'+skinEntityHref(x)+'">Ver skin</a></div></div></article>';
  }).join('');
}
function renderFinalEvaluation(d){
  renderSummary(d);renderOutputs(d.outputs||[]);
  const es=String(d.economics?.status||'').toUpperCase();
  if(es==='COMPLETE')$('engineStatus').textContent=(d.outputs?.length||0)+' resultados · dados disponíveis';
  else if(es==='PARTIAL')$('engineStatus').textContent=(d.outputs?.length||0)+' resultados · dados parciais';
}
async function simulateLegacy(){
  const inputs=state.slots.map(x=>({market_key:x.market_key,float_value:Number(x.float_value),owned:!!x.owned}));
  $('simulateBtn').disabled=true;$('simulateBtn').textContent='Calculando…';clearResultState();
  try{
    const r=await fetch(API+'?ui=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({inputs})});
    const d=await r.json().catch(()=>({status:'ERROR'}));
    if(!r.ok||d.status!=='OK'){const e=apiError(d,r.status);throw Object.assign(new Error(e.message),{code:e.code})}
    state.result=d;renderFinalEvaluation(d);
    const es=String(d.economics?.status||'').toUpperCase();
    if(es==='COMPLETE')setResultState('complete','Dados disponíveis','O contrato foi avaliado com cobertura econômica completa. Revise fonte e atualização antes de agir.');
    else if(es==='PARTIAL')setResultState('partial','Dados parciais','O contrato estrutural foi calculado, mas dados econômicos ausentes continuam N/D.');
    else setResultState('error','Não foi possível concluir a leitura econômica','O serviço respondeu sem um estado econômico reconhecido.');
  }catch(e){
    $('summarySection').hidden=true;$('outputsSection').hidden=true;
    setResultState('error','Não foi possível calcular o contrato',(e.message||'Tente novamente.')+(e.code?' · '+e.code:''));
  }finally{$('simulateBtn').disabled=false;$('simulateBtn').textContent='Calcular contrato';updateLegacyProgress();}
}
async function loadDemo(){
  let base={collection:'The Arms Deal 2 Collection',skin_name:'FAMAS | Hexane',rarity:'Mil-Spec Grade',rarity_rank:3,float_min:0,float_max:.4,market_key:'FAMAS | Hexane',is_stattrak:false,image_url:null};
  try{const r=await fetch(API+'?q='+encodeURIComponent('FAMAS | Hexane')+'&limit=6&ui=1');const d=await r.json();const found=(d.items||[]).find(x=>x.market_key==='FAMAS | Hexane'&&!x.is_stattrak);if(found)base=found;}catch(_){}
  state.slots=Array.from({length:10},()=>({...base,float_value:.10,owned:false,origin:'DATABASE'}));renderInputs();resetFinal();
}
async function applyInventoryLegacyContext(){
  if(state.goalMode)return;
  const key=qp.get('inventoryKey')?.trim()||'';if(!key)return;
  const floatParam=qp.get('inventoryFloat');
  try{
    const r=await fetch(API+'?q='+encodeURIComponent(key)+'&limit=24&ui=1');const d=await r.json();
    const item=(d.items||[]).find(x=>x.market_key===key);if(!item)return;
    const raw=Number(floatParam),float=Number.isFinite(raw)?Math.max(Number(item.float_min),Math.min(Number(item.float_max),raw)):defaultFloat(item);
    const asset=(state.inventory?.items||[]).find(x=>x.match_state==='MATCHED'&&x.market_key===key&&hasNumber(x.float_value)&&Math.abs(Number(x.float_value)-float)<1e-7);
    state.slots[0]={...item,float_value:float,owned:true,origin:'INVENTORY',asset_id:asset?.asset_id||'snapshot-context'};
    renderInputs();
  }catch(_){}
}
$('searchBtn').onclick=search;
$('skinSearch').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
let timer;$('skinSearch').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,300)});
$('demoBtn').onclick=loadDemo;
$('clearBtn').onclick=async()=>{state.slots=Array(10).fill(null);resetFinal();renderInputs();if(state.goalMode)await evaluateGoal();};
$('simulateBtn').onclick=()=>state.goalMode?evaluateGoal():simulateLegacy();
$('advancedBtn').onclick=()=>{const p=$('advancedPanel');p.hidden=!p.hidden;$('advancedBtn').textContent=p.hidden?'Ver detalhes':'Ocultar detalhes';};
$('applyGoalBtn').onclick=async()=>{
  $('objectiveHelper').classList.remove('error');
  $('objectiveHelper').textContent='Opcional. O desgaste define uma faixa de float. Se você informar também uma faixa de float, a SCALE considera apenas a interseção possível entre os dois objetivos.';
  resetFinal();await evaluateGoal();
};
document.addEventListener('click',e=>{if(!e.target.closest('.search-shell'))$('searchResults').hidden=true;});

applyOriginContext();
setGoalModeUI();
renderInputs();
if(state.goalMode)loadTarget();else applyInventoryLegacyContext();
