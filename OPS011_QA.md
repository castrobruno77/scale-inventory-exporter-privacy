# OPS-011 — Platform Shell v0.1 + Home + Database Preview — QA

Date: 2026-09-27  
Owner: FRONT END — VÉRTICE / SCL-DXP-001  
Branch: `feature/trade-lab-v0.1`  
Implementation commit: `8d9120a891f35309d37eae669d51de500060e5d2`  
Certified Trade Lab baseline preserved from OPS-010: `43bf61685885ed40b331745660436cf43414416c`

## Scope frozen before implementation

OPS-011 is the smallest coherent next unit after certified Trade Lab:

1. reusable global platform shell and navigation;
2. navigable Home;
3. navigable Database Preview using only the existing canonical public catalog GET;
4. certified Trade Lab remains reachable and behaviorally unchanged;
5. unsupported hubs are visibly marked preview/unavailable;
6. no parallel economic logic, no new backend contract;
7. desktop/tablet/mobile QA;
8. no merge to main and no production publication.

## Canonical inputs reconciled

- Blueprint Canônico da Plataforma v0.1;
- PRISMA Deep Brand Review / Brand System Validation v0.2;
- SCALE CS2 Brand Architecture & Clearance v0.1;
- SCALE CS2 Trade Lab Copy System v0.1;
- CAP-SCL-TRADEUP-EVALUATE v1;
- certified OPS-010 branch state and QA.

Brand-system constraints applied to new surfaces:

- dark matte product surface;
- one dominant brand chroma / Signal Cyan candidate;
- no recurring glow;
- economic positive/caution/negative colors remain semantically isolated;
- Evidence Rail concept for source/observation/confidence/coverage;
- quiet, precise and plain-spoken voice;
- SCALE CS2 remains WORKING BRAND — NOT CLEARED.

## Navigable surfaces

| Path | State | Data behavior |
| --- | --- | --- |
| `/` | Home / Platform Shell v0.1 | Product/navigation state only; no fictitious economic data |
| `/tradeup/` | Functional certified Trade Lab | Existing CAP v1 behavior preserved |
| `/database/` | Database Preview | Real catalog GET only; missing values remain N/D |
| Markets | Unavailable | No route/data fabricated |
| Patterns | Unavailable | No route/data fabricated |
| Inventory | Unavailable | No route/data fabricated |
| Intelligence | Unavailable | No route/data fabricated |

## Exact-source static QA

20/20 assertions PASS against GitHub branch source.

Verified:

- reversible-preview labeling on Home;
- Home → Trade Lab navigation;
- Home → Database Preview navigation;
- future hubs marked unavailable;
- Evidence Rail uses N/D rather than zero;
- no glow declaration in the new platform stylesheet;
- Signal Cyan token present;
- responsive breakpoints <=900px and <=620px;
- Database uses the existing canonical `tradeup-public` endpoint;
- Database performs no POST and contains no economic formulas;
- Database preserves N/D;
- safe v7 GET errors mapped: QUERY_TOO_LONG, REQUEST_URI_TOO_LONG, RATE_LIMITED, ORIGIN_NOT_ALLOWED;
- Database explicitly states that price/pattern/availability/recommendation are not invented;
- Trade Lab navigation integrates Home/Database;
- COMPLETE/PARTIAL/ERROR preserved;
- Source/Confidence/Updated preserved;
- N/D formatter behavior preserved;
- all seven v7 error mappings preserved in Trade Lab;
- no new real-time/guaranteed/accuracy claims.

Relevant blobs at QA:

- `index.html`: `b41e3e6c0b4fa381e2d41c043a6f545bce21c4ee`
- `platform.css`: `779d5f721b4af2a4e260ad9d77f2bc7461f2d9b5`
- `database/index.html`: `28e463e29be8681e145d083aa69c34dd0d39f63a`
- `database/app.js`: `19be4bb0532e5e865b366f2d3be356111152f4c8`
- `tradeup/index.html`: `d82883e42d630962247ff32c8900cf41041405b0`
- `tradeup/app.js`: `65950a54cc9f35aa5df886b6783cda1e4f77274d`
- `tradeup/styles.css`: `43433f6ec9868ff2a197371b8470953185fc2a26`

## Rendered visual QA

Rendered in local Chromium/Playwright without external deployment or paid service.

The environment blocked direct localhost/file URL navigation, so the QA harness rendered the exact page structure/styles and Database interaction semantics with Playwright `set_content`. Exact branch source was independently checked by the 20/20 source assertions above.

### Home

| Viewport | Horizontal overflow | Console errors | Hierarchy / legibility | Result |
| --- | --- | --- | --- | --- |
| 1440×900 | No | None | Clear | PASS |
| 768×1024 | No | None | Clear | PASS |
| 390×844 | No | None | Clear; single-column product cards | PASS |

Visual review confirmed:

- readable hero and navigation;
- live/preview/unavailable states are visually distinct without celebration/gambling language;
- Evidence Rail remains secondary and legible;
- no clipping or broken card grids;
- no economic color used as brand identity.

### Database Preview

QA-only network fixtures were used solely to exercise rendering and were not added to product code or presented as real platform data.

| Viewport | Horizontal overflow | Console errors | Search results | Skin hub | Result |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | No | None | Rendered | Rendered | PASS |
| 768×1024 | No | None | Rendered | Rendered | PASS |
| 390×844 | No | None | Single-column | Single-column | PASS |

Also verified:

- missing image renders as `imagem N/D`;
- no fake US$/R$ values appear;
- Markets / Patterns / Inspect / Inventory remain explicitly unavailable in the hub;
- safe simulated HTTP 429 renders the canonical RATE_LIMITED message in an error state.

### Trade Lab regression boundary

OPS-011 did not change `tradeup/app.js` or the economic/state model. It changed only the navigation in `tradeup/index.html`.

Therefore the certified OPS-010 guarantees remain intact:

- COMPLETE / PARTIAL / ERROR;
- N/D preservation;
- source / confidence / updated_at;
- v7 error handling;
- no browser economic engine.

## Result

PASS — OPS-011 Platform Shell v0.1 + Home + Database Preview satisfies its frozen completion criteria.

No visual regression requiring source correction was found.

## Preservation / gates

- `main` not changed;
- no merge performed;
- no production publication;
- no new credential;
- no paid service/cost;
- no CAP v1 change;
- no breaking change;
- no fictitious market/pattern/economic data presented as real.

Review may use the existing public GitHub branch through a non-deploy branch renderer; this does not change repository state or create a production release.
