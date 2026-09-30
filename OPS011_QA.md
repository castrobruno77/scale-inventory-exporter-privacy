# OPS-011 — Platform Shell v0.1 + Home + Database Preview — QA Final

Date: 2026-09-27  
Owner: FRONT END — VÉRTICE / SCL-DXP-001  
Branch: `feature/trade-lab-v0.1`

Certified Trade Lab baseline preserved from OPS-010: `43bf61685885ed40b331745660436cf43414416c`

OPS-011 implementation commits:
- `8d9120a891f35309d37eae669d51de500060e5d2` — Platform Shell + Home + Database Preview.
- `556edde3a3edd25d0a349a66fccbf9863847acb3` — alignment with the latest PRISMA Product Copy Handoff.

## Frozen unit and completion criteria

OPS-011 is the smallest coherent next RM-002 unit after the certified Trade Lab:

1. reusable global shell and clear navigation;
2. navigable Home;
3. navigable Database Preview using only the existing canonical public catalog GET or explicit N/D/preview states;
4. certified Trade Lab remains reachable and its contract/state semantics remain intact;
5. no parallel economic logic and no new backend contract;
6. desktop/tablet/mobile without horizontal overflow and with legible hierarchy;
7. static + real rendered visual QA;
8. canonical evidence/handoff;
9. no merge or external production publication.

## Canonical sources reconciled

- Blueprint Canônico da Plataforma v0.1;
- CAP-SCL-TRADEUP-EVALUATE v1;
- certified OPS-010 branch state and QA;
- PRISMA Deep Brand Review / Brand System Validation v0.2;
- **latest PRISMA handoff:** `HOF-PRISMA-20260927-RM003-PRODUCTCOPY-01`;
- Product Copy document: `PRISMA — RM-003 — SCALE Product Copy Handoff para VÉRTICE v0.1`.

The latest PRISMA handoff is authoritative for this cycle:
- operational brand token bound to `SCALE`;
- Home core copy uses the APPROVED strings;
- Database/skin hub copy is used only as reversible PROVISIONAL preview;
- Markets/Patterns/Inventory are marked `Em desenvolvimento`;
- Intelligence is not exposed in this P0/P1 shell;
- no naming migration/publication is implied.

## Navigable pages

| Path | State | Data behavior |
| --- | --- | --- |
| `/` | Home / Platform Shell v0.1 | Approved Home copy; proof/evidence semantics; no fictitious market data |
| `/tradeup/` | Functional certified Trade Lab | CAP v1 behavior preserved; copy aligned to latest PRISMA handoff |
| `/database/` | Reversible Database Preview | Real catalog GET only; missing values remain N/D |

Visible but not navigable:
- Markets — Em desenvolvimento.
- Patterns — Em desenvolvimento.
- Inventory — Em desenvolvimento.

Not exposed in this unit:
- Intelligence;
- Watch/alerts;
- Inspect/3D as a live action;
- Buy/Obtain actions.

## Exact-source QA

Final result: **23/23 PASS**.

Verified against the GitHub branch source:

- approved Home eyebrow/headline/subheadline;
- approved Home evidence/proof semantics;
- approved navigation labels;
- unavailable destinations marked `Em desenvolvimento`;
- Intelligence not exposed;
- Database provisional approved headline/placeholder;
- Database uses only the existing canonical `tradeup-public` endpoint;
- Database contains no POST/economic engine;
- Database preserves literal N/D;
- Database future modules do not claim availability;
- Trade Lab approved eyebrow/subheadline/input-progress copy;
- COMPLETE/PARTIAL/ERROR preserved;
- N/D / source / confidence / updated preserved;
- seven v7 error mappings preserved;
- no parallel economics in Database;
- no new prohibited real-time/accuracy/guarantee/best-price claims;
- new platform CSS contains responsive breakpoints at <=900px and <=620px;
- no glow token/effect was introduced in the new platform shell.

Final relevant blob SHAs:

- `index.html`: `f28050aeb099318a6f08bb2c99ab83e394822d11`
- `platform.css`: `779d5f721b4af2a4e260ad9d77f2bc7461f2d9b5`
- `database/index.html`: `b183df7b54fb45c84e7fa2fc4862082d1c9ca5d4`
- `database/app.js`: `b86a4cc1f2b1a44f75b0b1230bb7d8516469d399`
- `tradeup/index.html`: `c869ebd06133244cc7bec9f17afd6971701ab01e`
- `tradeup/app.js`: `a14aefbd23e590a3e26fd81c1ed7835d3433e070`
- `tradeup/styles.css`: `43433f6ec9868ff2a197371b8470953185fc2a26`

## Rendered visual QA

Real Chromium/Playwright rendering was executed locally after the final PRISMA-copy alignment.

No external deployment, paid service or new credential was used.

The execution environment blocked direct localhost/file navigation, so the QA harness rendered the branch page structure/styles with Playwright `set_content`; exact GitHub source was independently verified by the 23/23 source assertions above.

### Home

| Viewport | Horizontal overflow | Console errors | Hierarchy / legibility | Result |
| --- | --- | --- | --- | --- |
| 1440×900 | No | None | Clear | PASS |
| 768×1024 | No | None | Clear | PASS |
| 390×844 | No | None | Clear | PASS |

Visual review after the final copy alignment confirmed:

- approved headline wraps without clipping;
- primary and secondary CTAs remain readable;
- evidence block remains secondary to the value proposition;
- Functional / Preview / Em desenvolvimento states are distinguishable;
- product cards collapse cleanly on mobile;
- no economic semantic color is reused as the primary brand signal.

### Database Preview

QA-only network fixtures were used solely to exercise rendering. They were never committed or presented as platform data.

| Viewport | Horizontal overflow | Console errors | Search results | Skin hub | Result |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | No | None | Rendered | Rendered | PASS |
| 768×1024 | No | None | Rendered | Rendered | PASS |
| 390×844 | No | None | Single-column | Single-column | PASS |

Also verified:

- missing image renders as `imagem N/D`;
- no fake US$/R$ values are generated;
- market/pattern modules stay unavailable;
- safe simulated HTTP 429 renders the RATE_LIMITED error state;
- page remains readable with provisional copy and explicit PREVIEW labeling.

## Trade Lab regression boundary

The original OPS-011 implementation changed only Trade Lab navigation. The final PRISMA alignment changed Trade Lab text strings only; no request shape, response semantics, economic formula or backend endpoint was altered.

Preserved:

- COMPLETE / PARTIAL / ERROR;
- N/D preservation;
- source / confidence / updated_at;
- v7 error handling;
- canonical endpoint;
- absence of a browser economic engine.

## Result

**PASS — OPS-011 completion criteria satisfied.**

No proven visual regression required further source correction.

## Gates preserved

- `main` unchanged;
- no merge;
- no production publication;
- no paid service/cost;
- no new credential;
- no CAP v1 change;
- no breaking change;
- no fictitious market/pattern/economic data presented as real.

A review surface may use the already-public GitHub branch through a branch renderer. That creates no repository mutation and is not a production release.
