# Perspective Authority Copy Collapse Browser Report

Date: 2026-06-07
Branch: `codex/perspective-authority-copy-collapse-v0-1`

## Setup

- Prepared isolated DB path: `/tmp/augnes-perspective-authority-copy-collapse.db`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-authority-copy-collapse.db npm run db:reset`: PASS
- `AUGNES_DB_PATH=/tmp/augnes-perspective-authority-copy-collapse.db npm run db:migrate`: PASS
- `AUGNES_DB_PATH=/tmp/augnes-perspective-authority-copy-collapse.db npm run demo:seed`: PASS
- Starting a second Next dev server on port 3001 was blocked by the existing Next dev server lock:
  - Existing server: PID 6475 on `http://localhost:3000`
  - Next message: `Another next dev server is already running`
- Browser validation used the already-running local server at `http://localhost:3000/`.
- The existing server process did not expose `AUGNES_DB_PATH` in `ps eww`, so the visible browser pass should be read as local-server validation rather than confirmed temp-DB validation.

## Desktop Validation

Viewport: 1280 x 900
URL: `http://localhost:3000/`

- Perspective opens as the default active tab: PASS
- Current Perspective Starmap renders: PASS
- Sample constellation counts: PASS
  - Nodes: 7
  - Edges: 8
  - Tensions: 2
- Old always-visible starmap caption removed: PASS
  - `Read-only starmap · no persistence · no graph DB · no external calls` was not visible.
  - `No DB writes`, `No persistence`, `No graph DB`, `No external calls`, and `No Codex execution` were not visible in the starmap caption.
- Compact authority capsule visible: PASS
  - `Local read-only preview`
  - `Safe preview`
  - `Advisory only`
  - `Authority details`
- Authority details accessible through disclosure: PASS
  - Closed by default after CSS fix.
  - Hidden body includes structured fields such as `external_calls` and `codex_execution`.
- Handoff packet remains details-gated: PASS
  - `Preview Handoff Packet` details is closed by default.
- Handoff Compact Authority remains structured once in the packet wrapper: PASS
  - Selected packet text contains one `7. Compact Authority` section.
- Event Rail keeps card/button structure: PASS
  - 8 Event Rail buttons were present.
  - Selected temporal entry card was present.
  - No node-edge temporal graph refactor was visible.
- First viewport repeated authority copy: PASS
  - `local-only`: 0 visible matches
  - `read-only`: 1 visible match
  - `preview-only`: 0 visible matches
  - `No persistence`: 0 visible matches
  - `No graph DB`: 0 visible matches
  - `No external calls`: 0 visible matches
  - `No Codex execution`: 0 visible matches

## Mobile Validation

Viewport: 390 x 844
URL: `http://localhost:3000/`

- Current Perspective Starmap renders: PASS
- Sample constellation counts remain 7 nodes, 8 edges, and 2 tensions: PASS
- Starmap caption remains compact: PASS
- Horizontal overflow: PASS
  - `document.documentElement.scrollWidth`: 375
  - `document.documentElement.clientWidth`: 375
  - Overflowing visible elements: 0

## Console And Traffic

- Browser console warnings/errors on final localhost desktop pass: none observed.
- Browser console warnings/errors on final 390px mobile pass: none observed.
- Observed browser resource entries with external hosts: none.
- Observed provider/model/GitHub/Codex/OpenAI/external/billing traffic: none.
- Note: an earlier `127.0.0.1` navigation emitted a Next dev-origin warning in the server log. The final validation used `localhost:3000`, where no browser console warnings/errors were observed.

## Result

READY for PR browser evidence with one setup caveat: the temp DB was prepared successfully, but Next refused a second dev instance while an existing local server for this repo was already running, so the visual validation used the existing `localhost:3000` server.
