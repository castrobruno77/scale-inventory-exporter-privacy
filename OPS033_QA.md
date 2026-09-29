# OPS-033 — Skins Reactive Search & Filter Flow — QA v18

Date: 2026-09-29
Owner: FRONT END — VÉRTICE / SCL-DXP-001
Authority: HOF-VETOR-20260929-cf4b7e15-0d53-45d9-8ab1-e372bf0a9348
Source decision: HOF-VERTICE-20260929-HUMANREVIEW-PROMOTION-01
Branch: `feature/goal-aware-trade-lab-v0.1`
Production/main: unchanged

## Integrated backend contract

Frontend consumes `tradeup-public v18` on the existing endpoint.

- substring search remains canonical;
- server-side normalized matching supports forms such as `ak47`;
- fuzzy fallback is backend-owned and only surfaced through `search.mode=FUZZY_FALLBACK`;
- combined filters: weapon, rarity, collection, stattrak;
- allowed sort values exposed in UI: default, name_asc, name_desc, rarity_asc, rarity_desc;
- no price sort;
- no fuzzy score exposed;
- no fuzzy or normalization algorithm duplicated in the browser.

## Frontend behavior

- autocomplete remains debounced at 180 ms;
- previous suggestion request is aborted with AbortController;
- stale suggestion responses are discarded by sequence guard;
- previous main query request is aborted when a newer query starts;
- stale main-query responses are discarded;
- one-character substring search is no longer blocked locally;
- fuzzy feedback appears as “Resultados aproximados para esta busca” only when the backend says FUZZY_FALLBACK;
- results metadata reports backend search mode and effective ordering without calculating relevance locally;
- sort survives URL context and reload;
- filters remain combinable and server-side;
- Buscar remains after the complete filter block;
- price ordering is explicitly unavailable.

## Source / integration QA

PASS — JavaScript parses with `new Function`.
PASS — five allowed sort values are present.
PASS — no price sort exists.
PASS — sort parameter is sent to backend.
PASS — FUZZY_FALLBACK is consumed.
PASS — no local Levenshtein/trigram/similarity formula exists.
PASS — no local text-normalization implementation exists.
PASS — debounce preserved.
PASS — suggestion AbortController preserved.
PASS — main query AbortController added.
PASS — stale-response sequence guards exist for suggestions and results.
PASS — weapon/rarity/collection/stattrak are all sent server-side.
PASS — old one-character local blocker removed.
PASS — mobile sort control has explicit responsive rule.
PASS — mobile result grid collapses to one column.
PASS — Buscar remains after filters.

Result: 16/16 PASS.

## Backend runtime evidence

tradeup-public v18 is ACTIVE, SHA `679b8cec08842010cea4658a7500ce5f35d828d4c085c73ab4ab1f651e0f6e46`.

Observed v18 runtime logs include:
- `q=ak47` → HTTP 200;
- `q=aphrodte` → HTTP 200;
- `weapon=AK-47&rarity=Covert&sort=name_desc` → HTTP 200;
- `weapon=AK-47&sort=rarity_desc` → HTTP 200;
- invalid sort test → HTTP 400 as expected.

## Desktop/mobile QA

Responsive source checks cover:
- desktop: sort remains inline in toolbar and result grid uses four/three columns by width;
- <=768 px: sort control becomes full-width, search action becomes full-width, filters collapse to one column, results to two columns;
- <=480 px: results collapse to one column and token-entry controls stack.

A live external browser automation session was not executed because the connected TinyFish wallet is below zero. This is recorded as a QA limitation, not as successful browser evidence. Backend live runtime evidence and exact branch-source responsive checks support the branch PASS.

## Remaining gap

Price ordering remains intentionally unavailable. VETOR states valuation is wear-specific and does not yet map 1:1 to the structural catalog. No local approximation was introduced.

## Gates preserved

- no merge to main
- no production publication
- no price valuation approximation
- no paid service or new credential
- no new account/persistence/auth scope
- no local search engine or duplicated ranking logic
