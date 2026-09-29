# OPS-032 — Goal-Aware Trade Lab Experience + Launch Candidate Continuity — QA

Status: PASS no escopo reversível da branch
Branch: `feature/goal-aware-trade-lab-v0.1`
Base: `feature/trade-lab-v0.1`
Produção/main: não alterada

## Autoridades consumidas

- VETOR — CAP-SCL-TRADEUP-GOAL-AWARE v0.1 CERTIFIED / tradeup-public v12.
- PRISMA — Product Language & Identity Pass v0.1.
- ATLAS — Launch Candidate Human Review v0.2 reconciliation.
- CAP-SCL-TRADEUP-EVALUATE 1.2 permanece autoridade do avaliador final legado.

## P0 entregue

Fluxo:
Skins → página da skin → Como obter esta skin → Contratos → skin-alvo preservada → objetivo wear/float → composição 0–10 → avaliação final.

A interface distingue:
- skin-alvo;
- objetivo de desgaste/float;
- asset real do Inventário importado;
- simulação vinda de Skins;
- validade estrutural;
- possibilidade da skin-alvo;
- alcance do objetivo de float;
- probabilidade da skin-alvo;
- progresso 0/10 a 10/10;
- avaliação final, quando retornada pelo backend.

## Boundary técnico

O frontend envia `mode=GOAL_AWARE` e consome:
- `contract.valid`;
- `target.eligible`;
- `target.possible`;
- `target.probability`;
- `objective.float_goal_reachable`;
- `progressive.next_normalized_envelope`;
- `candidates[].allowed_float_range`;
- `final_evaluation`.

O frontend NÃO calcula normalização, envelope, elegibilidade ou probabilidade Goal-Aware.

Inventory:
- `origin=INVENTORY`;
- `asset_id` e float real preservados;
- ownership do snapshot não é apresentado como marketability/tradability.

Skins:
- `origin=DATABASE`;
- candidato só entra na composição após receber float simulado concreto;
- ranges aceitos vêm do backend.

## Regressão funcional por fonte exata

21/21 PASS.

1. Skins → página da skin.
2. Skin → Contratos com target preservado.
3. Skin → Loadout.
4. Loadout → Skins filtradas.
5. Loadout → Skin.
6. Inventário → Skin.
7. Inventário → Loadout.
8. Inventário → Contratos.
9. Contratos lê snapshot do Inventário.
10. POST Goal-Aware usa modo certificado.
11. Target é enviado por market_key preservado.
12. Candidate discovery é backend-derived.
13. allowed_float_range é consumido do backend.
14. origin INVENTORY enviado.
15. origin DATABASE enviado.
16. asset_id preservado.
17. final_evaluation consumido.
18. POST legado exatamente-10 permanece no fluxo livre.
19. Nenhum localStorage introduzido.
20. Markets/Patterns/Inspect não foram abertos.
21. Navegação visível naturalizada em Início / Inventário / Skins / Loadout / Contratos.

## Sintaxe

5/5 PASS:
- database/app.js
- database/skin/app.js
- loadout/app.js
- inventory/app.js
- tradeup/app.js

Um defeito de edição foi detectado antes da certificação em database/skin/app.js (newline literal/quote malformado) e corrigido no commit 337fe85775086e009448c962e3ba8c27f29f5daa. O mesmo passe também corrigiu a ausência preexistente do helper `esc` usado no ownership banner.

## Layout responsivo

Fixture local com as regras exatas do novo layout Goal-Aware:

- 1440×900: sem overflow horizontal; inputs 5 colunas; estados 4 colunas; objetivo 4 colunas.
- 768×1024: sem overflow horizontal; inputs 2 colunas; estados 2 colunas; objetivo 2 colunas.
- 390×844: sem overflow horizontal; inputs 1 coluna; estados 1 coluna; objetivo 1 coluna.

A tentativa adicional de sessão externa automatizada sobre raw.githack não iniciou por saldo insuficiente do navegador TinyFish. Portanto, não é registrada como evidência de QA live. Isso não altera a certificação técnica da capability v12, já entregue pelo VETOR, nem os checks de fonte/layout desta branch.

## Linguagem PRISMA

Aplicado:
- Database → Skins na interface;
- Trade Lab → Contratos;
- Inventory → Inventário;
- Home → Início;
- CTAs verbo + objeto;
- estados técnicos continuam internos;
- nenhuma promessa de resultado/probabilidade;
- nenhuma marca/ícone oficial novo.

## Gates preservados

- main intacta;
- sem merge;
- sem publicação externa;
- sem endpoint novo;
- sem solver/optimizer;
- sem Markets, Patterns, account/persistence, Steam auth/sync ou Inspect;
- sem nova lógica econômica/eligibility no frontend.

## Resultado

PASS — OPS-032 pronto para handoff ao NEXO dentro do escopo reversível autorizado.
