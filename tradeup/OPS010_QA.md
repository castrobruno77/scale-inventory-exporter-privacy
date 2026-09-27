# OPS-010 — Trade Lab QA evidence

Date: 2026-09-27  
Owner: FRONT END — VÉRTICE / SCL-DXP-001  
Branch: `feature/trade-lab-v0.1`  
Parent implementation commit: `ff5c5bf2b6843b7c6044de243f38ed123cf385b2`

## Scope executed

Static/responsive QA over the exact files committed on the branch:
- `tradeup/index.html`
- `tradeup/app.js`
- `tradeup/styles.css`

The branch remains isolated from `main`. No merge and no external publication were performed.

## Contract and state checks

PASS:
- canonical endpoint remains `tradeup-public`;
- exact 10-input composition preserved;
- COMPLETE state present with economic summary only from backend response;
- PARTIAL state preserves unavailable values as `N/D`;
- ERROR state remains inline and preserves composition;
- source, confidence and updated_at are displayed as metadata;
- no "real-time" claim was introduced;
- no confidence-to-precision claim or invented threshold was introduced;
- all seven v7 hardening errors remain mapped:
  - RATE_LIMITED
  - ORIGIN_NOT_ALLOWED
  - PAYLOAD_TOO_LARGE
  - QUERY_TOO_LONG
  - REQUEST_URI_TOO_LONG
  - INVALID_JSON_BODY
  - INVALID_PRICE_USD
- GET non-2xx/API error is not rendered as an empty search result;
- POST payload remains limited to canonical input fields used by the frontend;
- no browser-side formula for expected value, ROI or profit probability was added.

## Responsive checks

PASS by stylesheet inspection:
- viewport meta present;
- <=1000px: input/output grids reduce to two columns;
- <=620px: input/output/metric grids reduce to one column;
- <=620px: toolbar, section headers and contract footer stack vertically;
- future navigation items are hidden on narrow mobile;
- overall wrapper padding reduces on tablet/mobile.

## N/D checks

PASS:
- money formatter returns `N/D` when value is null/undefined/empty/non-finite;
- percentage formatter returns `N/D` under the same conditions;
- PARTIAL copy explicitly states that unsupported economic values remain `N/D` and that missing prices must not be treated as zero.

## Deterministic result

21/21 assertions PASS after correcting one test that initially checked an implementation-specific syntax instead of the actual ternary N/D behavior.

## Limitation / remaining visual QA

A rendered browser preview was not created because external publication remains gated and no authenticated computer-use/browser-preview environment is available in this chat. Therefore this unit certifies static responsive behavior and state semantics, but does **not** claim final rendered desktop/mobile visual approval.

OPS-010 should remain open until rendered desktop/mobile QA is executed against a reviewable preview or equivalent authorized browser surface.

## Preservation guarantees

- `main` unchanged.
- CAP-SCL-TRADEUP-EVALUATE v1 preserved.
- Baseline artifact commit remains before v7+copy commit.
- No parallel economic logic added.
- No merge.
- No external publication.
