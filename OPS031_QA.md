# OPS-031 — SCALE Launch Candidate 0.1 / Inventory Bridge — QA Final

Date: 2026-09-28
Owner: FRONT END — VÉRTICE / SCL-DXP-001
Branch: `feature/trade-lab-v0.1`
Base main: `9da99f99e985c98acfe210f93a62162adfaea60a`
Pre-QA head: `408f9c887161fa60c0f5087cb539bf924d64b41e`

## Resultado

**PASS — Inventory Bridge funcional + Product Closure do Launch Candidate 0.1**

Jornada fechada:
Inventory Exporter → SCALE → import local → reconhecimento → Skin Hub / Loadout / Trade Lab → continuidade da exploração.

Estado certificado preservado:
Database → Skin Hub → Loadout → Database
com conexão ao Trade Lab.

## Fontes reconciliadas

- Blueprint Canônico v0.3;
- ART-PRISMA-RM002-INVENTORYBRIDGE-1sCP;
- ENT-VETOR-20260928-34c57625-9a5c-4a2f-b022-28d83a442832;
- HOF-VETOR-20260928-cebd8fdb-e110-4645-8d64-0d487dde995a;
- CAP 1.2;
- OPS-028/029/030 PASS;
- amostra real Inventory Exporter v0.8.1.

## Implementação Inventory Bridge

Arquivos:
- `inventory/index.html`
- `inventory/styles.css`
- `inventory/app.js`

Comportamento:
- aceita somente JSON;
- schema aceito: `scale.inventory_export.v0.8.1`;
- leitura local do arquivo;
- snapshot temporário em `sessionStorage`;
- sem login;
- sem persistência cloud;
- sem Steam sync;
- `asset_id` obrigatório e preservado por exemplar;
- múltiplos assets da mesma skin não são colapsados;
- identidade técnica usa `market_hash_name`, nunca o campo human-first `ITEM`;
- wear final é normalizado apenas para construir candidato de `market_key`, que só vira MATCHED se existir no catálogo canônico carregado;
- catálogo público é carregado separadamente antes da importação e o matching ocorre localmente;
- valuation é opcional e desacoplado de ownership;
- N/D permanece N/D;
- reimport substitui o snapshot ativo;
- remover snapshot não apaga o Loadout.

Estados:
- MATCHED / Reconhecido;
- PARTIAL / Reconhecimento parcial;
- OUTSIDE_CATALOG / Fora do catálogo;
- ERROR para import inválido.

Falha fechada:
- JSON malformado;
- schema incompatível;
- asset_id ausente;
- asset_id duplicado;
- snapshot vazio/incompatível.

## Continuidade

### Inventory → Skin Hub
Somente MATCHED expõe `Abrir skin`.
Skin Hub lê o snapshot ativo e mostra `No inventário importado · n` apenas quando o market_key atual possui assets correspondentes.
Origem Inventory recebe retorno `Voltar ao Inventory`.

### Inventory → Loadout
Somente item MATCHED de arma suporta o CTA.
Loadout recebe identidade canônica e proveniência Inventory.
Armas BOTH continuam exigindo escolha CT/TR.
Depois da seleção, o card mostra `Do inventário importado`.
Ownership e seleção de Loadout permanecem conceitos separados.

### Inventory → Trade Lab
Somente MATCHED com float real aplicável expõe o CTA.
Trade Lab recebe market_key + float como contexto user-initiated.
O catálogo canônico é consultado pelo contrato vigente e o primeiro slot recebe:
- `owned=true`;
- float do exemplar, limitado ao intervalo canônico;
- `from_inventory=true`.
Tradability/trade lock não é presumido.
Nenhuma avaliação é disparada automaticamente.

## Product Closure

Navegação pública padronizada:
Home → Inventory → Database → Loadout Lab → Trade Lab.

Home:
- Launch Candidate 0.1;
- CTA primário: `Importar inventário`;
- CTA secundário: `Explorar Database`;
- módulos vazios de roadmap removidos;
- jornada pública mostra somente capacidades materializadas.

Trade Lab:
- strip de roadmap futuro removido;
- conexão pública reduzida a Skin Hub / Inventory / Loadout.

Nenhum redesign amplo foi realizado.

## QA funcional do adapter

**14/14 PASS**

1. import válido;
2. múltiplos assets da mesma skin preservam asset IDs distintos;
3. normalização de wear + verificação no catálogo;
4. StatTrak preservado;
5. kills=0 preservado;
6. float NOT_APPLICABLE válido;
7. preço N/D permanece null/N/D;
8. item fora do catálogo continua visível;
9. campo human-first ITEM sem market_hash_name gera PARTIAL, nunca MATCHED;
10. asset duplicado falha fechado;
11. schema incompatível rejeitado;
12. asset_id ausente rejeitado;
13. JSON malformado é tratado antes de ownership;
14. caminho de importação não executa fetch/XHR/sendBeacon.

## QA de fonte e regressão

**29/29 PASS**

Inclui:
- parse JS Inventory/Database/Skin Hub/Loadout/Trade Lab;
- CTA Home;
- ausência de future empty modules em Home e Inventory;
- sessionStorage;
- matching técnico;
- ausência de rede no fluxo de read/import;
- três bridges Inventory;
- ownership rail no Skin Hub;
- contexto de retorno Inventory;
- provenance Loadout;
- owned exemplar no Trade Lab;
- responsive breakpoints;
- mesma ordem de navegação em 6 superfícies;
- filtros Database preservados;
- CAP taxonomy e CT/TR Loadout preservados;
- COMPLETE/PARTIAL/ERROR e endpoint econômico Trade Lab preservados.

## QA visual

Browser read-only sobre a branch via raw.githack.

### 1440×900
- sem overflow horizontal;
- hero legível;
- import panel legível;
- layout desktop consistente.

### 768×1024
- sem overflow horizontal;
- hero e import panel legíveis;
- adaptação de grid/stack consistente.

### 390×844
- sem overflow horizontal;
- headline, helper e import area legíveis;
- scroll somente vertical.

Limitação:
- o browser QA não fez upload de arquivo por instrução de segurança;
- parsing/import foi validado separadamente pelo harness exato de código (14/14);
- a ordem final do nav foi simplificada após o primeiro render QA, removendo itens futuros, mudança que reduz — não aumenta — risco de overflow.

## Regressão das superfícies certificadas

Database:
- filtros weapon/rarity/collection/stattrak e paginação preservados.

Skin Hub:
- entidade canônica e float/wear preservados;
- ownership importado é aditivo e session-scoped.

Loadout:
- CAP 1.2 e separação CT/TR preservados;
- provenance Inventory é aditiva;
- remover snapshot não remove seleção do Loadout.

Trade Lab:
- motor econômico, COMPLETE/PARTIAL/ERROR e endpoint preservados;
- Inventory apenas pré-preenche exemplar owned + float;
- nenhuma avaliação automática.

## Fora do escopo preservado

Não implementado:
- account/login;
- cloud persistence;
- Steam sync;
- extension→site direct bridge;
- Inventory history;
- total valuation;
- Markets;
- Patterns;
- Inspect;
- Goals;
- agents;
- knives;
- gloves;
- backend/tabela/endpoint novo;
- alteração da extensão publicada;
- merge/main;
- publicação externa.

## Gates

- `main` intacta;
- branch 55 commits à frente / 0 atrás de main antes do commit de QA;
- sem merge;
- sem publicação;
- sem custo;
- sem credencial;
- sem breaking change;
- sem nova lógica econômica.

**OPS-031 — PASS.**
