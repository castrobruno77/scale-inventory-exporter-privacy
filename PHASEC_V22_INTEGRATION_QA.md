# Human Review Execution Pack — Fase C — v22 Integration Closure QA

Date: 2026-09-29
Owner: FRONT END — VÉRTICE / SCL-DXP-001
Authority: HOF-VETOR-20260929-5d7a3c18-2e64-4f91-a730-8c2b6e5d4190
Branch: `feature/goal-aware-trade-lab-v0.1`
Backend: `tradeup-public v22`
main/production: unchanged

## Scope

This increment closes only the three Fase C dependencies already registered:

- DEP-C1 — candidate selector structural filters;
- DEP-C2 — inventory-complete discovery;
- DEP-C3 — price reference / provenance separation.

No Phase D work was started.

## DEP-C1 — Candidate selector filters

Status: PASS.

Frontend now sends selector filters inside `candidate_query`.

Current exposed selector filters:
- weapon;
- collection;
- q remains the independent text search.

Frontend consumes:
- `candidate_pagination.filters`;
- `candidate_pagination.required_context`.

The resolved filter interpretation is rendered as backend-owned information.
Required rarity/mode are rendered as Goal-Aware context rather than reimplemented locally.

No frontend fuzzy algorithm, alias table, normalization table, eligibility rule or candidate ranking was created.

## DEP-C2 — Inventory discovery

Status: PASS.

Frontend sends the MATCHED inventory snapshot through `inventory_query.assets`, with:
- asset_id;
- market_key;
- float_value.

Only response items with `eligible=true` are shown as selectable Inventory candidates.

When selected, the frontend preserves the backend-returned:
- asset_id;
- market_key;
- float_value;
- skin/collection/rarity metadata;
- allowed_float_range;
- price_reference.

Ownership remains snapshot context only. The frontend does not infer marketability, tradability or eligibility from ownership.

A certified request supports up to 500 assets. If a MATCHED snapshot exceeds 500, frontend does not silently truncate it; it surfaces a limitation instead.

## DEP-C3 — Price reference / provenance

Status: PARTIAL by backend coverage, integration PASS.

Database:
- a simulated candidate is not accepted until the user supplies float;
- frontend then calls Goal-Aware `candidate_validation`;
- `candidate_validation.price_reference` becomes the SCALE reference for that input;
- changing the simulated float revalidates the candidate price reference.

Inventory:
- `inventory_discovery.items[].price_reference` is consumed directly.

Reference display:
- only when `price_reference.status=AVAILABLE` and estimate_usd is numeric;
- shows SCALE reference estimate;
- source when present;
- confidence when present;
- updated_at when present.

N/D:
- remains “Referência SCALE: N/D”;
- never becomes zero;
- never falls back to old inventory valuation;
- never silently becomes a manual price.

Manual price:
- remains a distinct user override field;
- ONLY `manual_price_usd` is serialized to `price_usd`;
- SCALE reference is never sent as `price_usd`.

Backend handoff reports canonical reference coverage 9988/10096 = 98.93%; 108 remain N/D. Therefore DEP-C3 overall status remains PARTIAL despite frontend integration PASS.

## Existing Fase C flow preserved

PASS — persistent selector remains open after add.
PASS — explicit “Adicionado” feedback remains.
PASS — selector advances to next empty slot.
PASS — Alterar / Duplicar / Remover remain.
PASS — Database float remains explicit.
PASS — Inventory remains real asset + real float.
PASS — target/objective/context preserved.
PASS — no automatic solver.
PASS — no local economics.
PASS — no Phase D output ordering/gradient work.

## Source / integration QA

PASS — tradeup/app.js parses.
PASS — candidate_query sends selector filters.
PASS — candidate_pagination.required_context consumed.
PASS — candidate_pagination.filters consumed.
PASS — no local fuzzy/aliases.
PASS — MATCHED-only inventory snapshot is built.
PASS — inventory_query sends asset_id/market_key/float_value.
PASS — >500 inventory request is not silently truncated.
PASS — only eligible=true inventory items are rendered/selectable.
PASS — asset_id and backend float are preserved.
PASS — Database invokes candidate_validation after float.
PASS — candidate_validation.price_reference consumed.
PASS — Inventory price_reference consumed.
PASS — manual price only becomes price_usd.
PASS — no reference_price_usd legacy path remains.
PASS — N/D is not coerced to zero.
PASS — source/confidence/updated_at provenance displayed when available.
PASS — editing Database float revalidates reference.
PASS — persistent Fase C interaction retained.
PASS — mobile filter/inventory layouts defined.
PASS — no Phase D controls.

Result: 21/21 source/integration checks PASS.

## Runtime evidence

### GET v22

PASS.

Observed v22 logs:
- GET Aphrodite + weapon=47 → HTTP 200;
- GET collection=2021 + Consumer Grade → HTTP 200.

### POST v22

GAP — not independently re-invoked in this VÉRTICE cycle.

The available connected external browser provider cannot start new runs because its wallet balance is below zero.
No native Supabase edge-function invocation tool is available in the current connector set.
Current v22 logs in the checked time window contain GET 200 evidence but no new POST request attributable to this QA cycle.

Therefore:
- backend source/deploy contract: supported by VETOR handoff;
- frontend POST construction: source QA PASS;
- independent VÉRTICE runtime POST confirmation: GAP.

This GAP is evidence-related, not a reason to simulate or downgrade the certified backend contract.

## Desktop/mobile QA

Desktop:
- selector gains two scoped filter inputs;
- backend-required context and resolution remain visible;
- Inventory candidates show reference provenance separately from manual price;
- persistent selector behavior unchanged.

Mobile <=620px:
- selector filter grid collapses to one column;
- Inventory discovery card collapses to one column;
- provenance aligns left;
- selector remains full-screen;
- existing input actions and persistent flow remain unchanged.

## Final state

DEP-C1: PASS.
DEP-C2: PASS.
DEP-C3: PARTIAL — frontend integration PASS; backend coverage 98.93%, 108 N/D preserved.
POST runtime independent confirmation: GAP.
Fase C integration closure: PASS WITH DECLARED PARTIAL/GAP EVIDENCE.

Do not initiate Phase D autonomously.
