# OPS-027 — Skin Entity Hub v0.1 — QA

Date: 2026-09-27  
Owner: FRONT END — VÉRTICE / SCL-DXP-001  
Branch: `feature/trade-lab-v0.1`  
Implementation commit: `8caf9d4e49551b5c83e5c16376a2c4f1538c9d52`

## Why this unit

Markets was not promoted because the latest VETOR handoff still classifies the multi-market/confidence contract as PROPOSED, with heterogeneous freshness and partially degraded sources.

Therefore the smallest coherent next RM-002 unit is the canonical skin entity itself, using only data already exposed by the existing public catalog GET.

## Frozen completion criteria

1. Database result opens a navigable deep-link for a skin.
2. Skin page uses only structural attributes returned by the existing public catalog.
3. Missing/unavailable capabilities stay N/D, Em desenvolvimento or Indisponível.
4. Skin page links to Trade Lab without fake prefill.
5. Deep-link reload identifies the entity by query key.
6. Exact-match failure renders a safe not-found state and does not infer a different entity.
7. Desktop/tablet/mobile visual QA passes without horizontal overflow.
8. No new API, no economic engine, no contract v1 change, no merge, no external production publication.

## Implementation

New:
- `database/skin/index.html`
- `database/skin/app.js`

Updated:
- `database/index.html`
- `database/app.js`
- `platform.css`
- `tradeup/app.js`

Navigation flow:
- Database search → `database/skin/?key=<market_key>`
- Skin entity → Trade Lab
- Trade Lab output → Skin entity via canonical name/key
- Inspect remains disabled because an output/entity is not a real asset/listing.

## Exact-source QA

Final result: **18/18 PASS**.

Verified:

- Database results deep-link to entity page.
- Entity page reads the `key` query parameter.
- Entity page consumes only the existing `tradeup-public` GET.
- Exact matching uses `market_key` or exact `skin_name`; no loose fallback silently changes entity.
- Not-found explicitly says no detail was inferred.
- N/D remains literal.
- Structural fields: collection, rarity, float min/max, modality and identifier.
- Markets, Patterns and Inventory remain unavailable/development states.
- Inspect explicitly requires a real exemplar.
- Trade Lab bridge states that it does not create fake prefill/contract.
- Trade Lab output now links to the canonical skin page.
- Inspect remains disabled in Trade Lab output.
- COMPLETE/PARTIAL/ERROR remain in Trade Lab.
- Source/Confidence/Updated remain in Trade Lab.
- N/D formatting remains intact.
- Entity responsive breakpoints exist at <=900px and <=620px.
- Entity app contains no economic formulas.
- No new live/real-time/best-price/accuracy/guarantee claims.

Relevant blobs:

- `database/index.html`: `50584755b23523e44ee24466d23a0d0242f84a00`
- `database/app.js`: `ff537281a07dc823c78a481e9544f81cfd149d74`
- `database/skin/index.html`: `49a75bb103f7a548b29a20c9e06c96c627ab52c6`
- `database/skin/app.js`: `1dd6dc4b3e3b0987d83171fcac36e7d4b2bb496e`
- `platform.css`: `9d83a60846959994ab7463d1079eddf4a34a0d00`
- `tradeup/app.js`: `a0474cb5e554540391f125c0ca61aea37a9055cc`

## Real catalog evidence

Read-only GET on the canonical endpoint for `FAMAS | Hexane` returned `status=OK`, count 2.

Exact normal entity used for QA:
- skin_name: `FAMAS | Hexane`
- market_key: `FAMAS | Hexane`
- collection: `The Arms Deal 2 Collection`
- rarity: `Mil-Spec Grade`
- rarity_rank: `3`
- float_min: `0`
- float_max: `0.4`
- is_stattrak: `false`
- image_url: present in canonical response

A StatTrak entity was also returned separately, proving why exact key/modality must remain distinct.

## Rendered visual QA

Rendered locally in real Chromium via Playwright `set_content`, using the current entity markup/style rules and the real structural values above. No deployment or external publication was created.

The harness intentionally rendered image as `imagem N/D` because the local QA environment has no outbound network. This tests the required missing-image state rather than substituting a fake asset.

### Entity — populated

| Viewport | scrollWidth | innerWidth | Horizontal overflow | Console errors | Result |
| --- | ---: | ---: | --- | --- | --- |
| 1440×900 | 1440 | 1440 | No | None | PASS |
| 768×1024 | 768 | 768 | No | None | PASS |
| 390×844 | 390 | 390 | No | None | PASS |

Visual inspection:
- hero hierarchy is clear;
- long structural fields wrap safely;
- CTA hierarchy remains clear;
- entity data grid collapses correctly;
- evidence strip stays secondary;
- module states are readable;
- mobile navigation remains horizontally scrollable rather than breaking layout;
- no economic semantic color is introduced into structural data.

### Not-found

Mobile 390×844:
- explicit not-found state visible;
- text: `Esta skin não foi encontrada como entidade exata no catálogo autorizado. Nenhum detalhe foi inferido.`
- no horizontal overflow.

## Regression boundary

OPS-027 does not change:
- CAP-SCL-TRADEUP-EVALUATE v1;
- Trade Lab POST body;
- economic calculations;
- COMPLETE/PARTIAL/ERROR semantics;
- N/D, source, confidence or updated_at behavior;
- v7 error handling.

Only the output action `Abrir skin` changed from disabled to a canonical entity link. Inspect remains disabled.

## Result

**PASS — OPS-027 Skin Entity Hub v0.1 satisfies its frozen completion criteria.**

## Gates preserved

- `main` unchanged;
- no merge;
- no production publication;
- no paid service;
- no new credential;
- no new API/contract;
- no breaking change;
- no fictitious market/pattern/inspect/inventory data.
