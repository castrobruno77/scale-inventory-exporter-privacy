# Human Review Execution Pack — Fase E — Skin Hub / Como obter QA

Date: 2026-09-29
Owner: FRONT END — VÉRTICE / SCL-DXP-001
Authority: NEXO promotion after acceptance of HOF-VERTICE-20260929-EXECUTIONPACK-PHASED-V23-PASS01
Branch: `feature/goal-aware-trade-lab-v0.1`
main/production: unchanged
Next phase: STOP before Fase F

## Scope

Fase E only:
- Skin Hub remains the central skin entity;
- "Como obter esta skin" becomes the acquisition/continuity hub;
- Goal-Aware Trade Lab entry preserves target skin and return context;
- CTA hierarchy is reduced and rewritten around verb + object;
- only existing capabilities are exposed;
- RarityMark, CollectionIdentity fallback, StatTrak, float/wear and canonical identifiers remain intact;
- no Markets, Inspect, purchase, Steam sync, pattern intelligence, or unsupported capability is exposed.

## CTA hierarchy

Hero:
- one contextual action only: "Adicionar esta skin ao Loadout";
- duplicate trade-up and generic back CTAs removed from the hero;
- breadcrumb/origin context remains the return mechanism.

"Como obter esta skin":
1. "Montar contrato para esta skin" — primary path;
2. "Ver skins desta coleção" — uses the existing Database collection filter, not a Collection entity page;
3. Inventory path — copy adapts to current session snapshot:
   - matching owned exemplar(s): "Ver meu Inventário";
   - snapshot without matching target: "Revisar meu Inventário";
   - no snapshot: "Importar Inventário".

## Goal-Aware continuity

Trade-up URL is built as:
`../../tradeup/?skin=<canonical market_key>&from=<current Skin Hub URL>`

The Trade Lab already consumes:
- `skin` as target key;
- `from` as safe local return path;
- backend Goal-Aware target/eligibility/float/probability/economics.

No eligibility, float envelope, probability, or economics is reproduced in Skin Hub.

## Collection path

The Skin Hub uses only the existing Database field filter:
`../?collection=<canonical collection text>`

This is intentionally NOT a Collection entity page and does not start Fase F.
When collection is unavailable:
- UI shows "Coleção indisponível";
- helper states that no relation was invented;
- fallback CTA is "Explorar Skins".

CollectionIdentity remains the authorized fallback; no unapproved collection image is consumed.

## Inventory semantics

Ownership evidence stays session-snapshot scoped:
- matching `market_key` only;
- presence is not tradability, marketability, or contract eligibility;
- no Steam synchronization is claimed.

The Inventory page itself does not currently preserve a generic Skin Hub target/back context. Fase E therefore does not pretend that cross-module return exists there.

## Source / integration QA

PASS — only one "Montar contrato para esta skin" CTA remains in Skin Hub.
PASS — hero retains the real Loadout capability.
PASS — "Como obter" contains trade-up, collection-filter and Inventory paths only.
PASS — no Markets CTA.
PASS — no Inspect CTA.
PASS — no purchase CTA.
PASS — no Steam sync CTA.
PASS — Trade Lab receives the canonical target key.
PASS — Trade Lab receives the Skin Hub URL as return context.
PASS — collection path uses the existing Database collection filter.
PASS — collection N/D is explicit and does not synthesize a relation.
PASS — Inventory ownership remains evidence-only.
PASS — origin context still supports return from Database / Inventory / Loadout / Trade Lab.
PASS — RarityMark preserved.
PASS — CollectionIdentity preserved.
PASS — StatTrak preserved when available.
PASS — structural float range and supported wears preserved.
PASS — no Fase F surface or Collection entity page created.

Result: 17/17 source/integration assertions PASS.

## Desktop / mobile responsive QA

Source-responsive checks:
- desktop: `.obtain-grid` = three-column hierarchy with primary trade-up path emphasized;
- <=900px: two columns, primary trade-up path spans full width;
- <=620px: one column; CTA buttons become full width; existing Skin Hub hero remains single-column.

Result: responsive source QA PASS.

Live visual browser execution was attempted against the isolated RawGitHack preview, but the connected browser provider did not start because the user wallet balance is negative. Therefore:
- independent live desktop screenshot: GAP;
- independent live mobile screenshot: GAP;
- no visual-runtime PASS is claimed.

## Backend dependency identified

DEP-E1 — Skin Hub target reachability preflight.

Current safe flow:
Skin Hub -> "Montar contrato para esta skin" -> Trade Lab -> Goal-Aware backend decides TARGET_NOT_REACHABLE_AS_OUTPUT / target validity.

Missing capability for a stricter Skin Hub state:
a read-safe, canonical target reachability signal consumable before entering the Trade Lab (for example an additive field on the existing skin response or another already-governed contract surface).

VÉRTICE does NOT infer this from rarity/collection and does NOT reproduce eligibility logic locally.

Owner if promoted: VETOR / SCL-DE-001.
Decision: NEXO decides whether preflight is worth adding; it is not required for the safe current journey.

## Gates preserved

- no merge to main;
- no production publication;
- no schema/infra/credential/cost change;
- no Markets/Inspect/buy/Steam sync/pattern capability;
- no Collection entity implementation;
- no Fase F.

## Result

Fase E frontend implementation: PASS by source/integration + responsive-source QA.
Live visual desktop/mobile execution: GAP due browser-wallet access.
DEP-E1 recorded, non-blocking for the safe current flow.
Return to NEXO. Do not initiate Fase F autonomously.
