# Human Review Execution Pack — Fase A — Field-Scoped Search QA

Date: 2026-09-29
Owner: FRONT END — VÉRTICE / SCL-DXP-001
Authority: HOF-VETOR-20260929-3c7e51a9-28d4-4b6f-8e12-5a90d7c3f241
Product pack: SCALE — Human Review — Product Direction & Execution Pack v0.1
Backend: tradeup-public v20
Branch: `feature/goal-aware-trade-lab-v0.1`
main/production: unchanged

## Scope

Fase A only:
- field-scoped facilitated search for Arma and Coleção;
- raw partial terms are sent directly to backend;
- substring/normalization/fuzzy resolution remains backend-owned;
- filters work without global `q`;
- filters remain combinable;
- `field_filters` is the sole authority for how weapon/collection terms resolved;
- no local aliases, fuzzy formula, canonicalization table or ranking;
- debounce, AbortController and stale-response sequence guards preserved;
- no price-sort work.

## Frontend behavior

Weapon and Collection tokens keep the user's requested value. After the response, the UI renders the canonical resolution from `field_filters` below the corresponding field.

Examples of intended presentation:
- `47` → `AK-47` (partial);
- `FMAS` → `FAMAS` (approximate);
- `2021` → all canonical collections returned by backend;
- invalid term → “sem correspondência”.

The frontend does not rewrite the request before calling the API.

## Source/integration QA

PASS — JavaScript parses.
PASS — `field_filters` response is consumed.
PASS — weapon resolution is rendered.
PASS — collection resolution is rendered.
PASS — no local alias table.
PASS — no local fuzzy/Levenshtein/trigram/similarity implementation.
PASS — no local normalization/searchCompact implementation.
PASS — filters qualify as a valid query even when global `q` is empty.
PASS — raw weapon tokens are sent as `weapon`.
PASS — raw collection tokens are sent as `collection`.
PASS — 180ms global-search debounce preserved.
PASS — suggestion AbortController preserved.
PASS — main-query AbortController preserved.
PASS — stale suggestion and result responses discarded by sequence guards.
PASS — price sort remains absent.
PASS — resolution UI exists for both fields.
PASS — mobile resolution layout is explicitly responsive.

Result: 17/17 PASS.

## Canonical backend cases

tradeup-public v20 is ACTIVE, SHA `de0ea8a7cbd5ae8df48f8726dc7f665c2d73f6b9168066cd3387ceb318cede22`.

VETOR-certified expected resolutions:
- `weapon=47` → AK-47;
- `weapon=AK47` → AK-47;
- `weapon=FMAS` → FAMAS via FUZZY_FALLBACK;
- `collection=2021` → four canonical 2021 collections;
- `collection=Dreams` → Dreams & Nightmares;
- `collection=Drams` → Dreams & Nightmares via FUZZY_FALLBACK;
- `weapon=47&collection=2021` with no q → Green Laminate / Gold Arabesque result set;
- `collection=2021&rarity=Consumer Grade` with no q → results;
- `q=Aphrodite&weapon=47` → Aphrodite;
- invalid weapon term → count 0 + NO_MATCH.

Live v20 function logs observed HTTP 200 for the canonical request set above, including the invalid-filter request (valid API response with no match).

## Desktop/mobile QA

Desktop source:
- two-column filter grid preserved;
- canonical field-resolution rows render below token lists;
- search action remains below filters;
- combined filters and sort controls remain intact.

<=768 px:
- filters collapse to one column;
- sort becomes full-width;
- search button becomes full-width;
- result grid becomes two columns.

<=480 px:
- result grid becomes one column;
- token-entry controls stack;
- field-resolution rows collapse so resolved details occupy their own line.

No live external browser automation was used as evidence in this cycle. QA is based on exact branch source + live v20 runtime logs. Manual preview validation remains appropriate before any merge/publication gate.

## Remaining gates / non-scope

- price-sort/valuation: not advanced;
- no Phase B work;
- no rarity visual system changes;
- no collection database implementation;
- no Trade Lab selector work;
- no merge to main;
- no production publication.

## Result

PASS — Fase A frontend integration complete.
Return to NEXO for promotion of any next phase.
