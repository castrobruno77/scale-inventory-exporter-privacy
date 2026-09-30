# Human Review Execution Pack — Fase F — Collections Explorer + Collection Hub QA

Date: 2026-09-30
Owner: FRONT END — VÉRTICE / SCL-DXP-001
Backend authority: tradeup-public v24
Backend handoff: HOF-VETOR-20260930-COLLECTION-CONTRACT-V24-2f4c8d61
Branch: `feature/goal-aware-trade-lab-v0.1`
main/production: unchanged

## Scope implemented

Collection is materialized as a first frontend entity without changing the global Database / Skins / Collections information architecture.

New preview surfaces:
- `database/collections/` — Collections Explorer
- `database/collections/collection/` — Collection Hub

Existing surfaces changed only for modular continuity:
- Skins page exposes a local "Explorar coleções" entry;
- Skin Hub links its collection action to Collection Hub;
- Skin Hub recognizes Collection Hub as an origin and preserves return context.

No global navigation item was renamed or consolidated.

## v24 contract consumption

Collections Explorer sends only supported request fields:
- `entity=collection`
- `q`
- `collection`
- `rarity`
- `has_stattrak`
- `has_consumer_grade`
- `limit`
- `offset`
- `sort=default|name_asc|name_desc`

No client fuzzy, normalization, aggregation, ranking or sorting is implemented.

Collection cards render only:
- `collection_name` / `collection_key`
- `skin_count`
- `variant_count`
- `rarities_present`
- `has_stattrak`
- `has_consumer_grade`
- `catalog_updated_at`

`catalog_updated_at` is labeled "Catálogo atualizado" and treated only as freshness.

Unsupported fields are not exposed:
- no release_date
- no case/container relation
- no collection_type
- no structural confidence
- no source_collection_id

## Collection visual policy

No real collection asset is requested or rendered.
The UI uses only the authorized CollectionIdentity fallback:
- neutral SCALE "S" plate;
- canonical collection text returned by v24.

The 93/93 real assets remain outside the frontend because they are LICENSE_REVIEW_REQUIRED and 0 are PUBLIC_ALLOWED.

## Collection Hub

The Hub obtains its Collection identity/attributes through `entity=collection&collection=<collection_name>`.
It requires an exact returned `collection_name` or `collection_key` match before rendering the entity.

The skins section reuses the legacy GET exactly through:
`collection=<collection_name>&limit=<n>&offset=<n>`

No collection aggregation is recomputed from returned skins.

Skin cards preserve existing skin data:
- image_url from legacy skin GET;
- rarity through global RarityMark;
- CollectionIdentity;
- StatTrak when true;
- structural float min/max when present.

## Bidirectional context

Collection -> Skin:
- Skin Hub URL carries `from=<Collection Hub URL>`.

Skin -> Collection:
- Collection Hub URL carries `collection=<skin.collection>`
- and `from=<Skin Hub URL>`.

Skin Hub explicitly recognizes Collection Hub origin and renders "Voltar à coleção".

Collections Explorer -> Collection Hub:
- Hub URL carries `from=<current Explorer query/filter URL>`.

Safe local-path validation remains active on entity return context.

## Deterministic QA

### JavaScript syntax
PASS — Collections Explorer app.js parses.
PASS — Collection Hub app.js parses.
PASS — modified Skin Hub app.js parses.

### DOM integration
PASS — all static Explorer DOM ids referenced by JS exist.
PASS — all static Hub DOM ids referenced by JS exist. `retryBtn` is intentionally dynamic and created only in error state.

### Contract assertions
PASS — Explorer sends `entity=collection`.
PASS — q remains backend-owned.
PASS — collection remains backend-owned.
PASS — rarity filter is sent to v24.
PASS — has_stattrak filter is sent to v24.
PASS — has_consumer_grade filter is sent to v24.
PASS — pagination consumes backend `has_more` / `next_offset`.
PASS — only default/name_asc/name_desc sort modes are exposed.
PASS — no `.sort()` is used for Collection results.
PASS — Collection render references exactly the contracted v24 item fields.
PASS — no release_date is referenced.
PASS — no collection image_url is referenced.

### Hub assertions
PASS — Hub entity lookup uses v24 `entity=collection`.
PASS — Hub skin listing uses legacy GET collection filter, without a parallel skin endpoint.
PASS — Hub requires exact collection identity before render.
PASS — Collection -> Skin Hub preserves context.
PASS — Skin -> Collection Hub preserves context.
PASS — Skin Hub recognizes Collection origin.

### Architecture / capability guardrails
PASS — current global nav still exposes "Skins"; it was not renamed to Collections or Database.
PASS — Collections is exposed only as a modular local preview entry.
PASS — no Markets capability added.
PASS — no Inspect capability added.
PASS — no Steam sync capability added.
PASS — no price-total capability added.
PASS — global RarityMark is reused in Collection surfaces.

### Responsive deterministic checks
PASS — desktop Collection Explorer grid: 3 columns.
PASS — <=900px: 2 columns.
PASS — <=620px: 1 column.
PASS — Collection Hub entity layout collapses to one column at tablet/mobile breakpoints.
PASS — Collection attributes collapse 3 -> 2 -> 1 columns.

### Loading / empty / error / N-D states
PASS — Explorer starts in loading state.
PASS — Explorer renders explicit empty state for zero items.
PASS — Explorer preserves filters and shows explicit API/network error state.
PASS — Collection Hub starts in loading state.
PASS — Collection Hub has explicit not-found / API / network error states.
PASS — skin list has loading, empty, API and network states.
PASS — missing scalar Collection fields render N/D.
PASS — missing rarities render N/D.
PASS — unknown booleans render N/D.
PASS — missing catalog_updated_at renders N/D.

## Runtime evidence

Backend v24 already carries backend source/SQL deterministic PASS in the accepted VETOR handoff.

An independent HTTP GET runtime check was attempted from the currently available external verifier, but the Supabase function URL was not accessible from that verifier. No alternative zero-cost independent runtime path is available in this session.

Therefore:
- independent GET v24 runtime: GAP;
- no runtime PASS is claimed;
- this matches the accepted backend handoff, which also records GET runtime as GAP.

## Gates preserved

- no merge to main;
- no publication;
- no new backend route;
- no schema/credential/cost change;
- no collection asset clearance;
- no global IA/navigation decision;
- no Markets / Inspect / Steam sync / price total;
- no unsupported Collection metadata.

## Result

Fase F frontend implementation: PASS by deterministic source/integration/responsive-state QA.
Independent GET v24 runtime: GAP.
Return to NEXO for review/acceptance.
