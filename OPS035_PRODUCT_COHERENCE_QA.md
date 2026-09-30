# OPS-035 — Product Coherence & Stabilization — QA integrado

Date: 2026-09-30  
Owner: FRONT END — VÉRTICE / SCL-DXP-001  
Base pública: main@7ec5840c14659fd3347347b03eab347f20b63dc8  
Branch: feature/ops-035-product-coherence

## Objetivo

Transformar a soma de incrementos certificados em uma experiência pública coerente ponta a ponta, sem criar capability, endpoint, schema, lógica econômica, IA global ou asset de Collection novo.

## Matriz problema → causa → correção → evidência

| Problema | Causa | Correção | Evidência |
| --- | --- | --- | --- |
| Home afirmava que não havia merge/publicação | copy de preview stale após OPS-034 | removida linguagem de branch/preview e reconstruído hero público | index.html |
| Home parecia dashboard interno | incremento nunca foi reproduto como landing pública | hero orientado a jornada + card de jornada + 4 ferramentas coerentes | Home + platform.css |
| OPS, VÉRTICE, SCL-DXP e Human Review apareciam ao usuário | rodapés técnicos acumulados | removidos de todas as superfícies públicas | 8 HTML auditados |
| títulos exibiam v0.1/v0.2/Launch Candidate | nomes de artefato viraram título de produto | títulos públicos simplificados | HTML público |
| navegação variava | páginas evoluíram isoladamente | nav padronizada: Início → Skins → Inventário → Loadout → Contratos | 8 shells |
| relação Skins↔Coleções parecia separada | Collection entrou depois | tabs locais Skins/Coleções, sem promover Collection à nav global | Skins + Collections |
| Collection explicava backend v24/GET legado | copy de QA vazou para produto | linguagem de tarefa, catálogo e freshness | Collections |
| Skin Hub descrevia backend/Goal-Aware | handoff técnico exposto literalmente | copy orientada a ação mantendo target | Skin Hub |
| Inventory mostrava schema/matching/ownership e Database/Trade Lab | bridge técnico ficou público | mensagens simplificadas e ações alinhadas a Skins/Contratos | Inventory |
| Loadout mostrava CAP/taxonomia/Erro real | diagnóstico técnico virou mensagem final | estados convertidos para linguagem de tarefa | Loadout |
| Trade Lab mostrava VETOR/backend/certificação/IDs internos | contratos de integração vazaram para UI | linguagem interna removida; estados reais e N/D preservados | Trade Lab |
| erros exibiam códigos internos | diagnóstico concatenado no UI | códigos removidos da superfície pública | Skins/Collections/Trade Lab |
| páginas pareciam produtos diferentes | CSS criado em ciclos independentes | tokens, header, cards, profundidade, hover/focus e backgrounds alinhados | CSS global + módulos |
| responsividade era distribuída por módulo | módulos nasceram em fases diferentes | breakpoints/shell/grids revistos como sistema | source responsive QA |

## QA funcional integrado

PASS por inspeção determinística de fonte:
- Home → Skins.
- Skins → Skin Hub.
- Skin → Collection Hub com from.
- Collection Hub → Skin Hub com from.
- Skin → Contratos preserva skin=<market_key>.
- Inventory → Skin Hub / Loadout / Contratos.
- Loadout → Skins preservando contexto suportado.
- Skin Hub reconhece origens Collection/Inventory/Loadout/Contratos.
- Collection Explorer continua backend-owned; nenhum sort local.
- Collection continua sem asset real.
- Trade Lab continua sem fórmula econômica paralela no browser.

## QA estrutural

PASS:
- 7/7 arquivos app.js parseiam em V8.
- 7/7 pares HTML/JS sem IDs estáticos ausentes.
- nenhum termo público stale encontrado para VÉRTICE, SCL-DXP, OPS-0, Human Review, Launch Candidate, branch isolada, preview reversível, contrato VETOR, CAP 1.2, backend canônico, aguardando backend ou Collection v24.

## Estados

Preservados e harmonizados: loading, vazio, erro, N/D, partial e indisponível. A limpeza de linguagem não altera a condição dos estados nem converte ausência de dado em valor.

## Responsividade

Source QA PASS:
- global: <=900px e <=620px;
- Inventory: <=1000px, <=768px, <=620px;
- Loadout: <=1000px, <=768px, <=620px;
- Trade Lab: <=1000px, <=900px, <=620px;
- Home product grid: 4 → 2 → 1;
- catalog tabs full-width no mobile;
- nav com overflow horizontal seguro;
- cards/grids colapsam progressivamente.

### GAP de render independente

TinyFish wallet em 2026-09-30: -US$ 0.023741. O navegador automatizado externo não pode iniciar.

Portanto:
- QA visual renderizado independente desktop/tablet/mobile = GAP;
- não há claim de visual browser PASS;
- source/responsive/integration QA = PASS;
- o GAP não é tratado como bug nem bloqueia a publicação já autorizada pela OPS-035.

## VETOR

OPS-036 foi aberta em paralelo pelo NEXO e concluída pelo VETOR em HOF-VETOR-20260930-OPS036-RUNTIME-RECERT-V25-9a2f6d43. tradeup-public v25 está ACTIVE no mesmo endpoint. GET Skin/Collection/Hub foi recertificado em runtime real; o único bug encontrado foi limit inválido causando HTTP500, corrigido para INVALID_LIMIT HTTP400. O frontend atual já envia limit inteiro, portanto nenhuma mudança nem workaround é necessária. O antigo GET runtime GAP foi encerrado; permanece apenas GAP não bloqueante de body→response POST v25 arbitrário.

## Gates preservados

Não implementados: Markets, Inspect, Steam Sync, price total, capability nova, endpoint/schema novo, asset real de Collection, mudança global Database/Skins/Collections ou lógica econômica paralela.

## Resultado

PASS — PRODUCT COHERENCE SOURCE/INTEGRATION/STATES/RESPONSIVE

GAP — independent rendered-browser QA

Próximo passo autorizado: PR → merge main → publicação → revisão pública direta.