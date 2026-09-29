# OPS-033 — Skins Reactive Search & Filter Flow — QA

Date: 2026-09-29
Owner: FRONT END — VÉRTICE / SCL-DXP-001
Source decision: HOF-VERTICE-20260929-HUMANREVIEW-PROMOTION-01
Human Review: SCALE — Launch Candidate 0.1 — Revisão Humana e Feedback Consolidado v0.2
Branch: `feature/goal-aware-trade-lab-v0.1`
Production/main: unchanged

## Scope delivered

- Reactive autocomplete/dropdown under the main Skins search field.
- Partial-term suggestions use the existing canonical GET search endpoint; no local catalog or duplicated search corpus.
- Suggestions preserve current structural filters when querying.
- Suggestions support one-character partial queries because tradeup-public v12 GET has no minimum query length.
- Suggestion click opens the canonical Skin Hub route.
- Explicit “Ver resultados para …” remains available from the dropdown.
- Enter remains supported.
- Escape and outside click close suggestions.
- The primary Buscar action was moved below the complete filter block.
- Existing rarity and StatTrak reactive filtering is preserved.
- Existing weapon/collection token workflow is preserved.
- Existing pagination (“Carregar mais”), selection mode, Loadout context, URL restoration and Skin Hub bridge are preserved.

## Backend/authority check

tradeup-public v12 remains the search authority. GET uses case-insensitive partial matching against `skin_name` and `collection` with `ILIKE %q%`. Weapon strings such as AK-47 are part of `skin_name`, so partial search returns matching weapon skins without a local weapon catalog.

No backend change was made.

## Static regression checks

PASS — JavaScript parses with `new Function`.
PASS — searchSuggestions container exists.
PASS — search button is after filtersPanel in DOM order.
PASS — input event schedules reactive suggestions.
PASS — suggestions call the canonical API.
PASS — suggestion requests are not locally blocked at one character.
PASS — suggestion request reuses current structural filters.
PASS — explicit Buscar remains bound.
PASS — Enter remains bound.
PASS — mobile rule makes the search action full-width.
PASS — dropdown has anchored/overlay styling.

Result: 11/11 PASS.

## Known limitation / dependency

True typo-tolerant fuzzy search is NOT implemented by this frontend increment. tradeup-public v12 currently uses ILIKE partial matching, not fuzzy/trigram similarity. If NEXO wants tolerance for misspellings beyond substring matching, VETOR must evaluate/contract that backend capability.

This limitation does not block the requested immediate behavior of typing a partial term such as AK and seeing matching skins in a dropdown.

## Gates preserved

- no merge to main
- no production publication
- no paid service
- no new credential
- no account/persistence
- no new Markets/Patterns/Inspect surface
- no client-side duplicate catalog/search engine
