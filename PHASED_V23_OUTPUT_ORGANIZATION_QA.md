# Human Review Execution Pack — Fase D — v23 Output Organization QA

Date: 2026-09-29
Owner: FRONT END — VÉRTICE / SCL-DXP-001
Authority: HOF-VETOR-20260929-7a2c5d91-4e63-48bf-a120-9c6e3d5f7824
Branch: `feature/goal-aware-trade-lab-v0.1`
Backend: `tradeup-public v23`
main/production: unchanged

## Scope

Fase D only:
- output mode Retorno;
- output mode Por coleção;
- strict consumption of backend canonical output organization;
- economic visual language green → yellow → red;
- N/D preserved explicitly;
- RarityMark and CollectionIdentity remain independent;
- no local ranking or economic calculation changes;
- no Fase E.

## Canonical organization contract

### Retorno

Frontend reads only:
`output_organization.modes.RETURN.ordered_output_ids`

Each id is mapped to the matching object from the canonical `outputs` array.

No sort is performed in the browser.

If an id is missing from `outputs`, the frontend preserves its canonical position and renders a mismatch card. It does not silently delete the id or reconstruct ordering.

### Por coleção

Frontend reads:
- `output_organization.modes.BY_COLLECTION.collection_order`;
- `output_organization.modes.BY_COLLECTION.groups`;
- each group's `item_ids`.

Groups are rendered in exactly `collection_order`.
Items inside each group are rendered in exactly `item_ids`.

The frontend does not sort groups by best_return_pct or items by return_pct.

### Same information, different organization

Switching modes reuses the same `state.outputEvaluation`.
No request, recalculation, probability change, valuation change or output mutation occurs on mode toggle.

## Fixture behavior required by VETOR

Canonical fixture:
- RETURN: b1(75), a1(50), a2(50), b2(N/D), g1(N/D)
- BY_COLLECTION collection order: Beta → Alpha → Gamma
- Beta item order: b1 → b2
- tie at 50 is already resolved by backend policy
- N/D stays after known returns according to backend ordering

Frontend does not reproduce the tie policy. It only respects canonical ids.

## Economic visual language

Economic visual is applied only to output cards based on the already-returned `return_pct`.

Visual mapping is presentation-only:
- positive return trends green;
- near break-even trends yellow / yellow-green;
- negative return trends orange/red;
- stronger losses trend red;
- N/D is neutral dark SCALE surface.

This mapping does NOT:
- change ordering;
- calculate return;
- calculate profit;
- calculate realizable value;
- alter probability;
- alter collection grouping.

RarityMark remains a separate vertical rarity marker.
CollectionIdentity remains a separate neutral collection identity.
No rarity glow or collection color participates in economic background.

## Source / integration QA

PASS — tradeup/app.js parses.
PASS — Retorno consumes RETURN.ordered_output_ids.
PASS — Por coleção consumes collection_order.
PASS — Por coleção consumes each group's item_ids.
PASS — no local output .sort() exists.
PASS — no local metric ranking by return_pct / profit_usd / realizable_usd.
PASS — N/D remains explicit.
PASS — mode toggle reuses the same evaluation object.
PASS — economic visual is output-only.
PASS — RarityMark remains independent.
PASS — CollectionIdentity remains independent.
PASS — Retorno / Por coleção controls exist.
PASS — mobile mode switch is responsive.
PASS — canonical missing-id mismatch preserves position instead of locally healing order.

Result: 14/14 PASS.

## Desktop visual QA

- mode switch is compact and located beside output section heading;
- output card grid remains four columns at wide viewport;
- collection mode introduces explicit collection group headers;
- group metadata shows backend best_return_pct only as display;
- output cards preserve probability, predicted wear/float, collection, rarity, market context, realizable value and profit/loss;
- target output marker remains intact.

## Mobile visual QA

At <=620 px:
- output mode switch becomes full-width;
- buttons share width equally;
- collection group header stacks;
- collection metadata remains readable;
- output grid stays one column through existing breakpoint;
- economic background does not obscure rarity/collection labels.

## Multi-collection / tie / N/D QA

Multi-collection:
PASS by canonical rendering path — groups use backend collection_order.

Tie:
PASS by non-interference — browser has no tie sorting logic and preserves ordered ids.

N/D:
PASS — no numeric coercion, no zero fallback, neutral economic card and explicit N/D label.

Mode alternation:
PASS — same evaluation object is re-rendered under the selected backend mode; no recalculation.

## Runtime evidence

POST v23 independent runtime: GAP.

At the checked time window, no v23 function-edge runtime events were present.
No native zero-cost Edge Function invocation tool is available in the connected Supabase toolset.
The external browser provider remains unavailable for a new run because its wallet balance is below zero.

Therefore:
- backend v23 contract: supported by VETOR handoff/source/deploy evidence;
- frontend consumption: source/integration QA PASS;
- independent VÉRTICE POST v23 runtime confirmation: GAP.

No PASS is claimed for POST runtime.

## Gates preserved

- no Fase E;
- no local economic ranking;
- no solver;
- no change to REALIZABLE_FACTOR;
- no economic formula change;
- no merge to main;
- no production publication.

## Result

PASS — Fase D frontend integration complete against canonical v23 output organization.
POST runtime independent evidence remains GAP.
Return to NEXO. Do not initiate Fase E autonomously.
