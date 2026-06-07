# Perspective Event Rail Node-Edge Browser Validation

Date: 2026-06-07

Branch: `codex/perspective-event-rail-node-edge-v0-1`

Base HEAD before local changes: `cd4a427`

## Setup

- Stopped an existing Next dev listener on port 3000 (`pid 43986`, cwd `/Users/hynk/Documents/augnes`) before validation.
- Reset isolated DB: `AUGNES_DB_PATH=/tmp/augnes-perspective-event-rail-node-edge.db npm run db:reset`
- Migrated isolated DB: `AUGNES_DB_PATH=/tmp/augnes-perspective-event-rail-node-edge.db npm run db:migrate`
- Seeded isolated DB: `AUGNES_DB_PATH=/tmp/augnes-perspective-event-rail-node-edge.db npm run demo:seed`
- Started fresh dev server: `AUGNES_DB_PATH=/tmp/augnes-perspective-event-rail-node-edge.db npm run dev -- -H 127.0.0.1 -p 3000`
- Validated URL: `http://127.0.0.1:3000/`

## Desktop Check

Viewport: 1280 x 900

- Event Rail region exposed `data-augnes-region="event-rail"` and `data-augnes-event-rail-view="node-edge"`.
- Observed 8 rail nodes with stable ids: `session`, `decision`, `handoff`, `pr`, `review`, `closeout`, `current_view`, `next_perspective`.
- Observed node roles and authority hooks:
  - Archive nodes used `data-augnes-rail-node-role="archive"` and `data-augnes-rail-authority="reference-only"`.
  - Current View used `data-augnes-rail-node-role="present"` and `data-augnes-rail-authority="active-local-preview"`.
  - Next Perspective used `data-augnes-rail-node-role="future"` and `data-augnes-rail-authority="advisory-only"`.
- Observed 7 rail edges with stable ids/types: `session_to_decision`/`informs`, `decision_to_handoff`/`packages`, `handoff_to_review`/`reviews`, `handoff_to_pr_ref`/`refs`, `review_to_closeout`/`closes`, `closeout_to_current`/`forms`, `current_to_next`/`suggests`.
- PR appeared as an archive reference node with passive copy: "PR entries are review pointers for local inspection."
- Clicking each node updated `data-augnes-rail-selected-node-id` and the selected detail card:
  - Session, Decision, Handoff, PR, Review, Closeout -> Archive Entry Card.
  - Current View -> Current View Card.
  - Next Perspective -> Future Candidate Card.
- Closed Event Rail details disclosure hid capability/detail content (`display: none`). Opening the disclosure revealed capability boundaries and the archive snapshot preview.
- Compact authority capsule from PR #444 remained present (`PerspectiveCompactAuthority`) with "Safe preview", "Advisory only", and "Authority details".
- No horizontal overflow: `scrollWidth 1280`, `clientWidth 1280`.
- Console warning/error log was empty.
- Observed resource URLs were local-only; no GitHub/OpenAI/Codex/billing-looking URLs were observed during this check.
- Dev server logs showed existing local Cockpit read/bootstrap APIs only, including `/api/augnes/read/constellation-preview`, `/api/augnes/read/perspective-ingest-constellation-preview`, `/api/perspective/snapshot`, `/api/state/brief`, `/api/work`, `/api/events`, `/api/mailbox/summary`, `/api/publications/summary`, `/api/approval-gate-state/summary`, `/api/state/snapshot`, `/api/state/trajectory`, `/api/proposals`, and `/api/work/AG-001/brief`.

## Mobile Check

Viewport: 390 x 844

- Event Rail still exposed `data-augnes-event-rail-view="node-edge"`.
- Observed 8 nodes and 7 edges.
- Node/edge layout stacked vertically; archive node widths were 304px inside the 390px viewport.
- No horizontal overflow: `scrollWidth 390`, `clientWidth 390`.
- Console warning/error log was empty.

## Result

PASS. The Perspective Event Rail renders as a node-edge temporal view with stable node/edge hooks, passive PR reference behavior, disclosure-gated details, preserved compact authority copy, and no observed external traffic.
