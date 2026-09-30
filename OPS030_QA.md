# OPS-030 — Loadout Lab v0.1 — Armas/Skins — QA Final

Date: 2026-09-28
Owner: FRONT END — VÉRTICE / SCL-DXP-001
Branch: `feature/trade-lab-v0.1`

## Resultado

**PASS — OPS-030 Loadout Lab v0.1 — Armas/Skins**

O incremento entrega um rascunho temporário de composição CT/TR usando somente CAP 1.2 e estado client-side de sessão. Não representa inventário, conta ou alteração real no CS2.

## Fontes reconciliadas

- Blueprint Canônico v0.3;
- CAP 1.2;
- `ENT-PRISMA-20260928-RM002-LOADOUTDISC-01`;
- `ENT-VETOR-20260928-6b5a4e88-2e39-4a06-bdf2-06bb680c12f5`;
- `ENT-VETOR-20260928-3b4e56cc-1f6f-4adb-9c90-31af8847bf25`;
- `ENT-VERTICE-20260927-RM002-OPS029-FINAL01`.

## Implementação

Commit-base do incremento:
- `bfde8cf0b0e448446f3ce22753f10683f581cc8d` — Loadout Lab v0.1 + integrações iniciais.

Correções estreitas encontradas no pre-QA:
- `c10de883be3dc4d3f2597d1c1e340f918ad0133d` — sintaxe de contexto do Database;
- `9e701a5343474332ac5e348a41148a3b637f5a13` — markup de navegação Home;
- `3550b49883ab1308ec4047ccf4845c2243ddcbb1` — markup de navegação Trade Lab;
- `1845090ddb1a387257ab897349a777b7b6a2be86` — contexto Loadout no Skin Hub;
- `f5bd395eeb113729876c291f12f952f77353b59c` — navegação Loadout no Skin Hub;
- `41b240c9f284aa8074da95a134097ce774360846` — banner contextual do Database;
- `37c20400457a871b84482332e8523803d0fe5397` — hardening final de copy para usar somente seleção/rascunho.

Nenhuma dessas correções alterou CAP, backend, economia ou escopo.

## Arquitetura do estado

Persistência temporária:
- `sessionStorage`;
- store: `scale_loadout_v01_session`;
- mantém rascunho durante a sessão/aba, inclusive navegação e refresh;
- não usa `localStorage`;
- não representa conta, sincronização ou persistência entre sessões;
- nova sessão pode iniciar vazia.

Estado separado:
- `selections.CT`;
- `selections.T`.

Uma arma `BOTH` pode ser usada nos dois lados, mas a seleção feita em CT não é copiada para TR e vice-versa.

## CAP 1.2 live QA

O GET canônico foi consultado em modo read-only.

Taxonomia:
- 35 armas/equipamentos;
- 10 PISTOL;
- 13 MID_TIER;
- 11 RIFLE;
- 1 EQUIPMENT;
- CT-only, T-only e BOTH preservados.

Casos críticos confirmados:
- M4A4 → RIFLE / RIFLE / CT;
- AK-47 → RIFLE / RIFLE / T;
- MP7 → MID_TIER / MID_TIER / BOTH;
- Zeus x27 → EQUIPMENT / ZEUS / BOTH.

Zeus é renderizado em seção própria, fora de Pistolas / Intermediárias / Rifles.

Variante StatTrak real usada na validação de substituição:
- `StatTrak™ MP7 | Akoben`;
- weapon: MP7;
- category: MID_TIER;
- slot: MID_TIER;
- side: BOTH;
- is_stattrak: true.

## Functional state QA

**13/13 PASS** em harness determinístico sobre as regras do frontend e a taxonomia CAP certificada:

1. taxonomy 35;
2. CT-only M4A4;
3. TR-only AK-47;
4. BOTH MP7;
5. Zeus EQUIPMENT/ZEUS/BOTH;
6. selecionar MP7 em CT não espelha em TR;
7. substituição no slot MP7 troca a seleção em CT;
8. CT e TR podem manter skins diferentes na mesma arma BOTH;
9. remover em CT não remove em TR;
10. payload de sessão restaura lado/seleções;
11. nova sessão não herda estado permanente;
12. Loadout → Database inclui filtro de weapon + contexto de slot/lado;
13. Database → Loadout inclui pick + side + weapon.

## Exact-source QA

**29/29 PASS**.

Verificado:
- CAP 1.2 consumido no mesmo endpoint;
- `weapon_taxonomy` vem do backend;
- nenhuma lista de armas hardcoded no Loadout;
- CT/TR separados;
- BOTH sem mirror automático;
- Zeus separado;
- sessionStorage somente;
- linguagem “Selecionada”;
- vazio / trocar / remover;
- StatTrak;
- imagem ausente;
- N/D;
- erro real + retry;
- Skin Hub → Loadout;
- Loadout → Database filtrado pela arma;
- Database → Loadout;
- Loadout → Skin Hub;
- Skin Hub reconhece origem Loadout;
- nenhum agent/knife/glove;
- nenhum login/account/ownership;
- nenhuma lógica econômica;
- breakpoints responsivos;
- navegação Loadout conectada em Home/Database/Skin Hub/Trade Lab;
- Database CAP 1.1 preservado;
- Trade Lab COMPLETE/PARTIAL/ERROR e provenance preservados.

Blobs finais relevantes:
- `loadout/index.html`: `8bb800b2ac950766125e77040d0eeb718244b445`
- `loadout/styles.css`: `34b4a7ba1edb48f2b7146ce4758551104bbea83b`
- `loadout/app.js`: `daaaa821d0f9cf43b717295a1bb7a78f3f7e4baa`
- `database/index.html`: `19ecf637ab06bfd2ed18b0d3bf966b4a3948041b`
- `database/app.js`: `30e99128f37b458a73ffd3eea82a364cceed6bcb`
- `database/skin/index.html`: `78d0f4c78d6e88fb3cb7b7684853bcee26739e2a`
- `database/skin/app.js`: `1b48768600393949c83344dcd47d846a600dccec`
- `tradeup/index.html`: `25cd2866d45678affa2b380b28f84adad082eef4`
- `tradeup/app.js`: `a325d66fa0d26e69b505f4124fcbb20ced05178f`.

## Continuity QA

### Skin Hub → Loadout
Skin Hub expõe `Experimentar no Loadout` e envia somente market_key/contexto.
Loadout resolve a entidade exata no CAP 1.2.

Se a arma é BOTH:
- usuário escolhe CT ou TR;
- nenhum mirror automático.

Se a arma é exclusiva:
- o lado canônico é respeitado.

### Loadout → Database
Cada slot vazio/preenchido oferece exploração por arma.
URL contém:
- `weapon`;
- `loadoutSide`;
- `loadoutWeapon`;
- `loadoutFrom`.

Database mantém o filtro de arma no backend e mostra contexto “Escolhendo para”.

### Database → Loadout
Resultado pode retornar:
- `pick`;
- `side`;
- `weapon`;
- `from`.

Loadout valida weapon/side na taxonomia antes de substituir a seleção.

### Loadout → Skin Hub
Skin selecionada abre a entidade canônica e preserva `from`.
Skin Hub reconhece:
- `Vindo do Loadout`;
- lado/slot em contexto;
- CTA de retorno ao Loadout.

## Visual responsive QA

QA visual isolado em Chromium/Playwright com regras exatas de `loadout/styles.css` e primitives do shell vigente. Dados usados no fixture servem somente para renderização de estados; corretude de dados foi validada separadamente no CAP 1.2 live.

### Desktop 1440×900
- innerWidth: 1440
- scrollWidth: 1440
- overflow horizontal: NO
- cards por linha: 4
- toolbar: 3 áreas
- header/nav: legível
- CT/TR, cards, Zeus e ações: PASS.

### Tablet 768×1024
- innerWidth: 768
- scrollWidth: 768
- overflow horizontal: NO
- cards por linha: 2
- toolbar adaptada;
- Zeus sem largura artificial;
- hierarquia/legibilidade: PASS.

### Mobile 390×844
- innerWidth: 390
- scrollWidth: 390
- overflow horizontal: NO
- cards por linha: 1
- CT/TR ocupa largura disponível;
- ações permanecem legíveis;
- nav usa overflow interno sem gerar overflow da página;
- hierarquia/legibilidade: PASS.

Screenshots QA locais:
- `ops030_qa/desktop.png`
- `ops030_qa/tablet.png`
- `ops030_qa/mobile.png`

## Estados

Validado:
- rascunho vazio;
- slot vazio;
- slot preenchido;
- selected;
- substituição;
- StatTrak;
- imagem indisponível;
- N/D;
- arma/lado indisponível;
- erro real de taxonomy/catalog;
- retry.

## Regressão

Database:
- filtros CAP 1.1 continuam presentes;
- offset/paginação preservados;
- contexto Loadout é aditivo.

Skin Hub:
- identidade/float/wears/contexto OPS-029 preservados;
- Loadout é apenas CTA/contexto adicional.

Trade Lab:
- endpoint, POST, 10 slots e motor econômico não foram alterados;
- COMPLETE / PARTIAL / ERROR preservados;
- source / confidence / updated preservados.

## Fora do escopo preservado

Não implementado:
- agents;
- knives;
- gloves;
- Inventory/ownership;
- conta/login;
- persistência entre sessões;
- preço/valor total;
- Markets;
- Patterns;
- Inspect;
- Goals;
- servidor/playtest;
- integração/equip real no CS2.

## Gates

- main unchanged;
- no merge;
- no external publication;
- no paid service/cost;
- no new credential;
- no breaking change;
- no parallel catalog/taxonomy;
- no economic logic.

**OPS-030 — PASS.**
