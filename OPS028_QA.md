# OPS-028 — Database Explorer v0.2 — QA de Integração CAP 1.1

Date: 2026-09-27
Owner: FRONT END — VÉRTICE / SCL-DXP-001
Branch: `feature/trade-lab-v0.1`

## Estado

**INTEGRAÇÃO FUNCIONAL CONCLUÍDA / CERTIFICAÇÃO FINAL PENDENTE SOMENTE DE QA VISUAL TABLET EXATO (768px).**

OPS-028 **não deve ser marcado PASS** até a lacuna visual de 768px ser fechada.

## Fontes reconciliadas

- Blueprint Canônico v0.3;
- OPS-027 certificado;
- HOF-ATLAS para VÉRTICE sobre Database P0 / continuidade de contexto;
- Capability Matrix de VETOR;
- `ENT-VETOR-20260927-9e244f6f-0e57-4f9a-83ce-2e5fd3f11e38`;
- `HOF-VETOR-20260927-64f03403-7385-4f7f-95fc-2dd104f33e19` — CAP 1.1 ready to consume;
- PRISMA — Database Explorer UX & Contextual Transitions v0.2.

## Commits desta etapa

- `16ec796bbcc5252424839f13854e92f7eb6200ed` — checkpoint UX/contexto pré-backend.
- `6f17ff8d01146515880aebe72322f15c9a8ccdab` — integração real com CAP 1.1.
- `400b4f71e6cf67de0f191aa4ed3e3bda8e785bf7` — hardening do parâmetro de retorno contextual.

## Integração CAP 1.1

O frontend continua usando o mesmo endpoint:

`https://ubtojlrfxoxbuvgajeos.supabase.co/functions/v1/tradeup-public`

Implementado:

- `q`;
- `weapon` multivalor por CSV;
- `rarity` multivalor por CSV;
- `collection` multivalor por CSV;
- `stattrak=true|false`;
- `limit=24`;
- `offset`;
- consumo de `pagination.has_more`;
- consumo de `pagination.next_offset`;
- botão `Carregar mais`;
- append de páginas sem tratar a página atual como universo completo;
- zero-result somente após resposta real do backend;
- nenhum uso de `total_count` ou facets, que não pertencem ao CAP 1.1.

Sem catálogo local, endpoint paralelo ou filtro client-side global.

## Continuidade Database → Skin Hub → Database

O link da entidade preserva:

- query;
- weapon;
- rarity;
- collection;
- stattrak;
- modo de seleção;
- quantidade de registros já carregados quando > 24.

O retorno usa `from` e reexecuta traversal até reconstruir o contexto carregado anteriormente.

Hardening:
- aceita somente caminho iniciado por `/`;
- rejeita `//...` protocol-relative.

## Static/source QA

**32/32 PASS.**

Verificado:

- parâmetros CAP 1.1;
- offset pagination;
- has_more/next_offset;
- q + filtros na mesma consulta;
- Collection != case;
- nenhum filtro proibido;
- nenhuma taxonomia local de weapon;
- weapon exibido pela regra validada de prefixo da skin;
- chips ativos/removíveis;
- limpar filtros / limpar tudo;
- multiseleção;
- Compare continua disabled;
- nenhum prefill de Trade Lab;
- contexto Database→Skin;
- profundidade de paginação preservada;
- retorno reconstruído;
- N/D e imagem N/D;
- loading/empty/error;
- breakpoints responsivos;
- COMPLETE/PARTIAL/ERROR e provenance do Trade Lab preservados;
- endpoint Trade Lab inalterado;
- nenhuma lógica econômica no Database.

Blobs após integração:
- `database/index.html`: `4b73e50379d639e53fa4d5acf2f60c2772ec716a`
- `database/app.js`: `a9e4e4926d20e50e93d382439140b164c52be520`
- `database/skin/app.js`: `f81aa42022db5762d3ff9b81f9d28b941a33d4f8`
- `platform.css`: `172e1a5b4126f261927e0843183b13f78eed7c4e`
- `tradeup/app.js`: `a0474cb5e554540391f125c0ca61aea37a9055cc`

## QA live do CAP 1.1

Consultas read-only executadas no endpoint canônico confirmaram:

| Cenário | Resultado |
| --- | --- |
| Busca textual FAMAS \| Hexane | PASS — 2 entidades, normal + StatTrak |
| weapon=FAMAS | PASS — página com has_more/next_offset |
| weapon=FAMAS,AK-47 | PASS — OR intradimensão |
| rarity=Mil-Spec Grade | PASS |
| rarity=Mil-Spec Grade,Restricted | PASS |
| collection=The Arms Deal 2 Collection | PASS |
| stattrak=true | PASS |
| weapon + rarity + collection + stattrak=false | PASS — FAMAS \| Hexane |
| coleção inexistente | PASS — count=0, items=[], has_more=false |
| limit=5 offset=0 | PASS — next_offset=5 |
| limit=5 offset=5 | PASS — próxima página, sem sobreposição observada |

A certificação backend de VETOR complementa a travessia integral:
- 44 páginas;
- 2147 itens;
- 2147 market_keys distintos;
- zero duplicação;
- zero página com erro.

## QA visual

### Desktop

Run: `4238894d-d133-45f6-a918-4eea4ce12025`

- viewport efetivo informado: 1504×1191;
- classe desktop;
- horizontal overflow: NÃO;
- hierarchy: PASS;
- stacking: PASS;
- defects: nenhum.

Limitação esperada: o domínio de review raw.githack não está na allowlist CORS do backend.

### Mobile

Run: `1c928c27-86ee-448a-b3b5-dbb741e1db36`

- viewport efetivo: **390×844**;
- horizontal overflow: NÃO;
- hierarchy: PASS;
- stacking: PASS;
- chips ativos/removíveis exercitados;
- selection mode exercitado;
- Compare permaneceu disabled;
- defects: nenhum.

O run usou dados QA-local apenas para render do grid devido CORS do domínio de review. O comportamento real do CAP 1.1 foi validado separadamente nas consultas live acima.

### Tablet

Primeiro run: `3e14307f-d13e-4a7a-ac51-a363012f97db`
- pedido: 768×1024;
- viewport real retornado: 1680×921;
- portanto **não é evidência tablet válida**.

Tentativa final estrita: `1535a34d-111a-481c-b224-d9c2a4e97366`
- agente confirmou que não consegue aplicar/emular 768×1024 nesta sessão;
- `exact_tablet_verified=false`;
- portanto **não declarar PASS**.

A fonte contém regras exatas para <=768px:
- filters-panel → 1 coluna;
- explorer-results → 2 colunas;
- results-head → coluna;
- context rail / selection bar → coluna;
- selection-actions → 100%.

Isso é evidência estática, não substitui a exigência de QA visual exato.

## Result

- Backend integration: **PASS**
- Static/source QA: **PASS 32/32**
- Live CAP 1.1 functional QA: **PASS**
- Desktop visual: **PASS**
- Mobile 390 visual: **PASS**
- Tablet 768 visual: **PENDENTE POR LIMITAÇÃO DO AMBIENTE DE REVIEW**

**OPS-028 permanece EM EXECUÇÃO.**

## Gates preservados

- `main` inalterada;
- sem merge;
- sem publicação externa;
- sem nova credencial;
- sem custo criado;
- sem endpoint novo;
- sem contrato paralelo;
- sem breaking change;
- sem lógica econômica nova;
- Trade Lab e Skin Hub preservados.
