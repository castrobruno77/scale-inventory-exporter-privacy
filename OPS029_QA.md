# OPS-029 — Skin Hub v0.2 — QA Final

Date: 2026-09-27  
Owner: FRONT END — VÉRTICE / SCL-DXP-001  
Branch: `feature/trade-lab-v0.1`

## Canonical inputs

Reconciled before implementation:

- Blueprint Canônico v0.3;
- OPS-027 Skin Entity Hub v0.1;
- OPS-028 Database Explorer v0.2 PASS;
- CAP 1.1;
- `ENT-VETOR-20260927-3e2b89b5-6e9d-4f9f-9d46-880de4cab92b`;
- `HOF-VETOR-20260927-ade98b52-d6b4-43ab-8b54-26d94f424ee9`;
- `ENT-PRISMA-20260927-RM002-SKINHUB-COPY02`;
- `HOF-PRISMA-20260927-RM002-SKINHUB-VERTICE-02`.

## Scope

P0 only:

- image;
- canonical identity;
- safely derived weapon;
- safely derived finish name;
- rarity;
- collection;
- StatTrak/Normal modality;
- float min/max;
- possible wears derived from structural float range;
- origin context and return;
- contextual bridge to Trade Lab without prefill.

Explicitly excluded:

- description;
- paint_index;
- price / Markets / freshness;
- Patterns / pattern / seed;
- Inspect;
- Inventory;
- Loadout;
- case/container;
- Goals;
- monetization.

## Implementation commits

- `8a180962298d282e7ef1324447044e9e29d3e14b` — Skin Hub v0.2 contextual implementation.
- `5f189af16fc09cb4b407323c0bdb5f969138ce08` — fix Trade Lab context initialization found during pre-QA audit.

The second commit is a narrow regression fix only; no contract or economic behavior changed.

## Exact-source QA

Final result: **30/30 PASS** after correcting one false-positive assertion and verifying the context function directly.

Verified:

- Skin Hub hierarchy and PRISMA copy;
- weapon = segment before ` | ` after removing StatTrak prefix;
- finish = segment after ` | `;
- normal / StatTrak modality;
- collection / rarity;
- float range helper;
- wear derivation from float bounds;
- N/D semantics;
- missing-image copy;
- not-found copy;
- retry on real load error;
- Database origin and return;
- Trade Lab origin and return;
- protocol-relative `from` rejected;
- `Usar no Trade Lab` CTA;
- no automatic composition prefill;
- Trade Lab context banner;
- context banner does not touch `state.slots`;
- Trade Lab output links preserve origin;
- future module card grid removed from Hub;
- no active future capability CTA;
- description / paint_index not consumed;
- no economic fields introduced into Hub;
- Database CAP 1.1 integration preserved;
- Trade Lab COMPLETE/PARTIAL/ERROR preserved;
- Trade Lab source/confidence/updated provenance preserved;
- Trade Lab endpoint preserved;
- responsive rules preserved.

Relevant blobs after implementation:

- `database/skin/index.html`: `f619291f5f7fb797d14f8e6e0314b8f280275260`
- `database/skin/app.js`: `db354c33722389d3e78d34aed968094db800b1ae`
- `platform.css`: `c07cada896338addbcf1dea839f1e0be8040ee06`
- `tradeup/index.html`: `e94b00b3d8374b1d7c5e4ba5649a6c995193ed19`
- `tradeup/app.js` after fix: `a325d66fa0d26e69b505f4124fcbb20ced05178f`
- `tradeup/styles.css`: `ca231cea02cc42ae556835ed3e3a160fba8ad8d1`

## Live CAP 1.1 data QA

### Normal + StatTrak

Read-only query for `FAMAS | Hexane` returned two distinct canonical entities:

Normal:
- market_key: `FAMAS | Hexane`
- collection: `The Arms Deal 2 Collection`
- rarity: `Mil-Spec Grade`
- float: `0–0.4`
- is_stattrak: false
- image_url: present

StatTrak:
- market_key: `StatTrak™ FAMAS | Hexane`
- same structural collection/rarity/float range
- is_stattrak: true
- image_url: present

Derived identity:
- weapon: `FAMAS`
- finish: `Hexane`

Derived possible wears for 0–0.4:
- Factory New
- Minimal Wear
- Field-Tested
- Well-Worn

Battle-Scarred is correctly absent.

### Restricted float range

Read-only query for `AWP | Asiimov` returned:
- float_min: `0.18`
- float_max: `1`

Derived possible wears:
- Field-Tested
- Well-Worn
- Battle-Scarred

Factory New / Minimal Wear are correctly absent.

### Nonexistent entity

Read-only query for `__NO_SUCH_SKIN__` returned:
- status: OK
- count: 0
- items: []
- has_more: false

Hub state:
- `Skin não encontrada.`
- `Volte ao Database e tente outra busca.`

No entity is inferred.

## Continuity QA

### Database → Skin Hub → Database

The Hub accepts the existing local `from` context from OPS-028.

When origin is Database:
- label: `Vindo do Database`
- helper preserves recognition of search/filters;
- back CTA: `Voltar aos resultados`;
- query/filter/pagination context remains encoded in `from`.

### Trade Lab → Skin Hub → Trade Lab

Trade Lab output entity links now preserve Trade Lab origin.

When origin is Trade Lab:
- label: `Vindo do Trade Lab`
- back CTA: `Voltar ao Trade Lab`;
- current Trade Lab URL/context is preserved in `from`.

### Skin Hub → Trade Lab

Primary CTA:
- `Usar no Trade Lab`

The transition carries only skin identity/context in the URL.

Trade Lab displays:
- `Ponto de partida: <skin>`
- explicit notice that the composition was **not** filled automatically.

No slot is modified and no compatibility/trade-up eligibility is promised.

## Rendered responsive QA

Visual QA was executed in local isolated Chromium/Playwright with exact viewports and QA-only render fixtures matching the branch structure/style rules. Live data correctness was validated separately against CAP 1.1 above.

Four states were rendered at all three viewports:

1. normal skin from Database;
2. StatTrak skin from Trade Lab;
3. N/D + missing-image state;
4. nonexistent entity.

### 1440×900

All 4 states:
- innerWidth: 1440
- document scrollWidth: 1440
- horizontal overflow: **NO**

Normal/StatTrak:
- hero: 2 columns;
- identity: 3 columns;
- float/wears: 2 columns;
- origin context visible;
- primary CTA visible;
- hierarchy/legibility: PASS.

### 768×1024

All 4 states:
- innerWidth: 768
- document scrollWidth: 768
- horizontal overflow: **NO**

Normal/StatTrak:
- hero: 1 column;
- identity: 2 columns;
- float/wears: 2 columns;
- action section stacked;
- origin return visible;
- hierarchy/legibility: PASS.

### 390×844

All 4 states:
- innerWidth: 390
- document scrollWidth: 390
- horizontal overflow: **NO**

Normal/StatTrak:
- hero: 1 column;
- identity: 1 column;
- float/wears: 1 column;
- CTA primary full-width;
- back CTA full-width;
- origin remains readable;
- hierarchy/legibility: PASS.

The top platform navigation keeps the already-certified internal horizontal-scroll behavior without creating global page overflow.

## Regression QA

### Database Explorer

No Database implementation file was changed in OPS-029.

CAP 1.1 source assertions remain present:
- weapon;
- rarity;
- collection;
- stattrak;
- offset pagination.

OPS-028 behavior is therefore preserved.

### Trade Lab

Only contextual navigation/copy was added.

Preserved:
- canonical endpoint;
- 10-slot composition model;
- POST semantics;
- COMPLETE / PARTIAL / ERROR;
- N/D handling;
- source / confidence / updated_at;
- v7/v9-compatible error handling;
- economic calculations remain backend-owned.

No prefill was implemented.

## Result

**PASS — OPS-029 Skin Hub v0.2 satisfies its P0 acceptance criteria.**

The page now clearly answers:

1. which skin is being viewed;
2. which reliable structural attributes SCALE knows;
3. where the user came from;
4. which real next action is available;
5. how to return to the previous exploration.

## Gates preserved

- `main` unchanged;
- no merge;
- no production publication;
- no paid service/cost;
- no new credential;
- no endpoint;
- no parallel catalog;
- no economic engine;
- no price/pattern engine;
- no breaking change;
- no autonomous scope expansion.
