# Execution plan

## Phase 0 — skeleton to working local app

Goal: make the MCP app run end-to-end in ChatGPT developer mode.

Tasks:
- install dependencies
- verify `npm run dev`
- verify `npm run inspect`
- expose with ngrok / Cloudflare Tunnel
- attach in ChatGPT developer mode
- confirm widget renders for at least `open_casefile`

Done when:
- app can be added in ChatGPT
- at least one widget panel renders
- search/fetch and one console tool work

## Phase 1 — real Augnes Core adapter

Goal: replace mock data with real backend calls.

Tasks:
- define stable Augnes Core read endpoints
- implement HTTP adapter
- normalize output into app-safe shapes
- strip raw internal IDs from public payloads
- add adapter tests using recorded fixtures

Done when:
- all read-only tools hit real Augnes data
- payloads remain stable and review-safe

## Phase 2 — value surface

Goal: make Augnes value obvious inside ChatGPT.

Tasks:
- polish Casefile panel
- polish Strategy Rationale panel
- polish Boundary Packet panel
- polish Continuity panel
- keep RepoGraph panel minimal but useful

Done when:
- user can understand evidence, rationale, boundary, continuity without raw JSON

## Phase 3 — review hardening

Goal: make the public profile submit-ready.

Tasks:
- verify tool hints on every tool
- verify no write behavior exists
- verify no raw trace leakage
- add privacy policy draft
- add app listing copy
- add explicit review test cases

Done when:
- public profile can be tested on web and mobile
- likely rejection causes are pre-empted

## Phase 4 — Chrono Lab expansion

Goal: push the chrono-self experimentation further without endangering the public app.

Tasks:
- narrator diff timeline
- same-self / branch / successor preview
- continuity canaries with richer diagnostics
- audit panel for promotion bans and raw-first handling

Done when:
- internal lab can stress-test temporal self-governance
- public profile remains conservative and read-only
