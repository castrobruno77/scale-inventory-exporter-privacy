# Human Review Execution Pack — Fase C — Trade Lab Input Flow QA

Date: 2026-09-29
Owner: FRONT END — VÉRTICE / SCL-DXP-001
Authority: NEXO promotion of Fase C from SCALE — Human Review — Product Direction & Execution Pack v0.1
Branch: `feature/goal-aware-trade-lab-v0.1`
Backend authority: active `tradeup-public v21` / existing Goal-Aware + CAP evaluator
main/production: unchanged

## Scope delivered

- persistent input selector opened from empty slots or explicit “Alterar”;
- selector remains open after successful additions;
- selector advances to next empty slot after each addition;
- explicit “Adicionado” feedback via selector status + transient toast;
- explicit close via X/Escape; backdrop click does not accidentally dismiss context;
- progressive composition continues calling Goal-Aware after add/change/remove/duplicate/price edit;
- Database candidate requires explicit simulated float and is selected by clicking the candidate itself — no separate Add button;
- Inventory asset uses real snapshot float and is added in one click;
- source tabs: Todos / Inventário / Skins;
- duplicate simulation into next empty slot;
- Inventory asset duplicate is blocked because one asset_id cannot represent two owned inputs;
- Alterar targets the chosen slot and candidate search excludes that slot from the replacement preview payload;
- Remover remains explicit;
- manual input price is optional;
- manual price is sent as `price_usd` to the certified evaluator; no ROI/EV/valuation calculation is performed in browser;
- when manual price is blank, no price override is sent and the evaluator remains free to use its canonical reference when available;
- targetKey, objective and origin context remain intact.

## Important interaction rules

### Database / Skins origin

Goal-Aware requires an explicit float for a simulated Database input.

The frontend does NOT invent a float. User enters a float inside the backend-provided `allowed_float_range`, then clicks the candidate card. The existing backend candidate contract remains the source of:
- candidate eligibility;
- allowed float range;
- relation to target collection;
- target committed probability after add.

### Inventory origin

Inventory candidate uses:
- existing snapshot match;
- exact asset_id;
- real float_value;
- origin INVENTORY;
- owned=true.

Ownership continues to mean snapshot presence only. No marketability/tradability assumption is introduced.

### Duplicate

Database/simulation duplicate:
- copies skin reference;
- copies explicit simulated float;
- preserves explicit/manual price state when present;
- fills next empty slot;
- Goal-Aware is called again.

Inventory duplicate is intentionally blocked in UI because backend already enforces DUPLICATE_ASSET_ID for the same owned asset.

## Manual price

Each filled input includes an optional manual price field.

Source label states:
- “Preço manual do usuário” when an override exists;
- “Referência SCALE disponível” when an explicit reference value is present in the frontend item;
- otherwise “Referência: resolvida pelo avaliador quando disponível”.

The browser never computes economic cost, expected value, ROI or output profitability from the manual price. It only forwards the explicit `price_usd` override.

## Source/integration QA

PASS — tradeup/app.js parses.
PASS — persistent dialog exists.
PASS — empty slot opens selector.
PASS — “Alterar” opens selector on an existing slot.
PASS — selector does not close after successful add.
PASS — selector advances to next empty slot.
PASS — explicit transient “Adicionado” feedback exists.
PASS — selector has no accidental backdrop-close handler.
PASS — target slot replacement uses candidate query with current slot excluded.
PASS — candidate replacement preview does not overwrite actual displayed composition state.
PASS — no separate Add button for Database candidate.
PASS — Database selection requires explicit float.
PASS — Inventory selection is one click with real float.
PASS — duplicate action exists.
PASS — Inventory duplicate is blocked.
PASS — remove action exists.
PASS — manual price input exists.
PASS — manual price is forwarded as `price_usd`.
PASS — no manual ROI/EV/economic formula added.
PASS — source tabs Todos / Inventário / Skins exist.
PASS — candidate discovery still uses Goal-Aware `candidate_query`.
PASS — empty Goal-Aware query can browse the first candidate page.
PASS — mobile selector becomes full-screen.
PASS — body scroll locks while selector is open.
PASS — Fase B rarity/economic visual separation preserved.

Result: 25/25 PASS.

## Desktop/mobile QA

Desktop:
- modal-like selector is centered, max-width 960 px and independently scrollable;
- existing contract remains visible behind contextual backdrop;
- candidate selection and inline float editing remain within selector;
- input cards expose Alterar / Duplicar / Remover and manual-price state;
- selector remains open after additions.

Mobile <=620 px:
- selector becomes full-screen;
- candidate cards collapse to two-column content;
- probability moves below primary candidate identity;
- manual-price editor stacks;
- add feedback becomes bottom full-width toast;
- input actions remain three compact controls;
- collection fallback can continue text-first behavior.

Live browser automation was not executed because the connected external browser provider wallet is below zero. Certification evidence is exact branch source + JavaScript parsing + backend contract inspection. Manual preview is required before merge/publication.

## Backend dependencies registered for VETOR/NEXO

### DEP-C1 — Candidate structural filters

Current Goal-Aware `candidate_query` accepts q/limit/offset, but does not expose weapon/collection/other structured selector filters.

Impact:
The persistent selector can search/browse but cannot truthfully offer full Database-like filter controls without either duplicating search logic locally or receiving an additive backend contract.

Requested backend direction:
Extend candidate_query additively with canonical field filters or an equivalent certified candidate-filter contract. Frontend must consume backend resolution only.

### DEP-C2 — Inventory-complete discovery

Inventory tab currently identifies compatible owned assets only among candidates returned by the current candidate query page.

Impact:
An owned compatible asset outside the returned candidate page may not appear in a broad empty-query Inventory view.

Requested backend direction:
Provide an additive way to validate/filter a bounded set of inventory market_keys/assets against the current Goal-Aware target/objective/composition, or a candidate_query inventory scope. Do not make frontend infer eligibility.

### DEP-C3 — Reference price provenance/value in selector

Goal-Aware candidate payload does not currently expose the canonical input reference price/provenance that the economic evaluator may later use.

Impact:
Frontend can show whether a manual override was entered, but cannot always display “reference US$ X vs manual US$ Y” before final evaluation.

Requested backend direction:
Expose additive input/candidate price reference metadata (value, source, freshness/confidence as applicable) or echo effective input price provenance in evaluation. No local market-price lookup should be added by VÉRTICE.

None of these dependencies requires VÉRTICE to simulate logic locally.

## Non-scope / gates preserved

- no Phase D output ordering changes;
- no new valuation engine;
- no Database price-sort;
- no automatic trade-up solver;
- no Steam sync/auth;
- no marketability/tradability inference;
- no merge to main;
- no production publish.

## Result

PASS — Fase C frontend interaction layer complete within current certified capabilities.
Return to NEXO. Do not initiate another Execution Pack phase autonomously.
