# OPS-037 — Legacy Input Compatibility Guard — QA

Date: 2026-09-30
Owner: FRONT END — VÉRTICE / SCL-DXP-001
Base: main@3fbdb4fcc69eef7a86393e200aff59444ac0ebb7
Backend authority: tradeup-public v25 / HOF-VETOR-20260930-OPS037-VERTICE-COMPATIBILITY-2a7c5e94

## Scope

Prevent invalid Legacy Trade Lab composition before final POST, using only existing backend-returned canonical rarity + is_stattrak and existing GET filters. Goal-Aware remains backend-owned.

## Implementation

- Added legacyCompatibilityContext(excludeSlot) derived from all remaining filled slots.
- 0 remaining inputs => FREE context.
- 1+ coherent remaining inputs => LOCKED to exact rarity + is_stattrak.
- incoherent remaining inputs => CONFLICT; new add/change is blocked until corrected.
- Legacy search now preserves q, weapon, collection, limit, offset, ui and adds rarity/stattrak only when context is LOCKED.
- pickLegacy applies defensive guard before state mutation.
- change naturally derives context excluding the slot being replaced.
- remove recomputes implicitly because context is derived from current slots on every selector/search.
- duplicate applies the same Legacy guard; Inventory assets remain non-duplicable.
- Inventory/deep-link Legacy applies the guard before slot mutation.
- POST legacy defenses remain unchanged.
- Goal-Aware candidate_query, inventory_discovery and candidate_validation remain unchanged.

## QA matrix

| Case | Expected | Result |
| --- | --- | --- |
| Zero inputs Legacy | no lock | PASS |
| First Normal input | establishes Normal + rarity | PASS |
| Normal → Normal same rarity | allowed | PASS |
| Normal → StatTrak | blocked | PASS |
| StatTrak → StatTrak same rarity | allowed | PASS |
| StatTrak → Normal | blocked | PASS |
| Different rarity | blocked | PASS |
| Change slot | context excludes changed slot | PASS |
| Remove partial | context recomputed from remaining | PASS |
| Remove until zero | context returns FREE | PASS |
| Duplicate simulation | allowed only when context-compatible | PASS |
| Existing incoherent state | blocks new mutation until repaired | PASS |
| Inventory/deep-link first input | establishes/respects same context | PASS source |
| Goal-Aware regression | backend-owned path untouched | PASS source |

## Backend runtime evidence

Existing v25 GET filters were exercised without backend changes:

- q=Hexane + rarity=Mil-Spec Grade + stattrak=false => 2 results, both Normal.
- q=Hexane + rarity=Mil-Spec Grade + stattrak=true => 2 results, both StatTrak.
- q=Calligraffiti + rarity=Restricted + stattrak=false => count=0.
- q=Calligraffiti + rarity=Mil-Spec Grade + stattrak=false => Desert Eagle | Calligraffiti Normal.

These confirm the selector can rely on existing backend filtering rather than local rarity tables or fuzzy logic.

## Structural QA

- tradeup/app.js compiles in V8: PASS.
- search includes backend filters rarity/stattrak only when context locked: PASS.
- weapon/collection/query/limit/offset remain preserved: PASS.
- pickLegacy defensive guard: PASS.
- duplicate Legacy guard: PASS.
- Inventory/deep-link Legacy guard: PASS.
- no backend/schema/route/capability/economics/float/probability/output organization changes: PASS.
- Souvenir behavior unchanged: PASS by non-modification.

## Result

PASS — OPS-037 ETAPA 2 FRONTEND IMPLEMENTATION.

Eligible for PR → main publication under NEXO authorization.