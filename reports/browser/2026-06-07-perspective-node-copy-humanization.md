# Perspective Node Copy Humanization Browser Validation

Date: 2026-06-08 Asia/Seoul
Branch: `codex/perspective-node-copy-humanization-v0-1`
Local target: `http://127.0.0.1:3000`
Temp DB: `/tmp/augnes-perspective-node-copy-humanization.db`

## Setup

- Confirmed port `3000` was clear before startup.
- Reset temp DB: `AUGNES_DB_PATH=/tmp/augnes-perspective-node-copy-humanization.db npm run db:reset`
- Migrated temp DB: `AUGNES_DB_PATH=/tmp/augnes-perspective-node-copy-humanization.db npm run db:migrate`
- Seeded temp DB: `AUGNES_DB_PATH=/tmp/augnes-perspective-node-copy-humanization.db npm run demo:seed`
- Started fresh dev server: `AUGNES_DB_PATH=/tmp/augnes-perspective-node-copy-humanization.db npm run dev -- -H 127.0.0.1 -p 3000`

## Desktop Validation

- Perspective opened as the default active tab.
- `Current Perspective Starmap` rendered.
- Whole-constellation view showed 7 nodes, 8 edges, and 2 unresolved tensions.
- Starmap node labels were humanized:
  - `Sample ChatGPT record`
  - `What the user wants`
  - `Preview concept`
  - `Safe fixture decision`
  - `Known limitation`
  - `Suggested next step`
  - `Review / Codex packets`
- The old product-concept tag-cloud summary was absent from active UI and packet text.
- Selecting `Preview concept` showed the readable sentence summary:
  `Turn ChatGPT/Codex records into a local constellation preview with typed relationships, visible tensions, and copyable ChatGPT/Codex handoff packets.`
- Inspector selected-node copy used `Preview concept`, `product_concept`, and the sentence-style summary.
- Handoff packet selected material used the humanized selected title and node labels.
- Handoff packet details remained gated: the details element was closed, its summary remained visible, and the packet textarea rendered with `display: none`.
- Compact authority capsule remained visible with reduced-copy local-only/read-only/no-persistence/no-graph-DB/no-Codex-execution authority.
- Event Rail remained `data-augnes-event-rail-view="node-edge"` with 8 nodes and 7 edges.
- PR remained a passive reference node: `data-augnes-rail-node-id="pr"` had class `is-reference`; the PR edge `handoff_to_pr_ref` had class `is-reference`.

## Mobile Validation

Viewport: `390 x 900`

- `Current Perspective Starmap` still rendered.
- Starmap still showed 7 nodes and 8 edges.
- No horizontal overflow:
  - `window.innerWidth`: 390
  - `documentElement.scrollWidth`: 390
  - `body.scrollWidth`: 390
  - `.perspective-tab` client/scroll width: 366/366
- No overflowing elements were detected.

## Console And Traffic

- Browser console warnings/errors: none.
- Dev-server traffic observed only local app/read requests:
  - `GET /`
  - `GET /api/augnes/read/constellation-preview?scope=project:augnes`
  - `GET /api/augnes/read/perspective-ingest-constellation-preview?scope=project:augnes&source=sample%3Achatgpt`
  - Existing local dashboard read routes such as `/api/perspective/snapshot`, `/api/state/brief`, `/api/work`, `/api/events`, and summary/read endpoints.
- No provider/model/GitHub/Codex/OpenAI/external/billing traffic was observed.

## Result

PASS. Perspective node labels and selected-node/packet copy read as human-facing explanations while topology, authority, Event Rail node-edge behavior, and compact authority behavior remain unchanged.
