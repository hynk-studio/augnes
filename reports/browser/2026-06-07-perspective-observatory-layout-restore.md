# Perspective Observatory Layout Restore Browser Report

Date: 2026-06-07

Branch: `codex/perspective-observatory-layout-restore-v0-1`

URL: `http://127.0.0.1:3000`

Temp DB: `/tmp/augnes-observatory-layout-restore.db`

## Setup

- Reset, migrated, and seeded the temp SQLite DB with `AUGNES_DB_PATH=/tmp/augnes-observatory-layout-restore.db`.
- Started Next dev bound to `127.0.0.1:3000` so the requested URL could hydrate without the dev-origin warning.

## Desktop Observation

- Perspective opened as the active default tab.
- The first Perspective surface is `AUGNES / Perspective Observatory` followed by the `Perspective Observatory workspace`.
- The formation identity strip is visible near the workspace with Viewing, Basis, Source, and Status.
- The desktop observatory layout shows left `Observatory Controls`, center `Current Perspective Starmap`, and right `Inspector`.
- The starmap is visually dominant by width and loaded the sample constellation: 7 nodes, 8 edges, and 2 tensions.
- Left controls show Formation Basis, Lens, Scope, and Source. Future Formation Basis choices are disabled/explanation-only.
- The right inspector starts with Selected, Why here, Evidence / Tensions / Next, and Actions.
- `Open Handoff Packet` is available; the packet textarea remains inside the closed `Preview Handoff Packet` details section by default.
- The Event Rail is present below the observatory grid with Archive / Present / Future grouping plus Session, Decision, Handoff, PR, Review, Closeout, Current View, and Next Perspective.
- Old user-facing Game Window labels were not visible.

## Mobile Observation

- At 390px width, Perspective remained the active tab.
- Core labels remained present: Current Perspective Starmap, Observatory Controls, Inspector, and Archive / Present / Future.
- Page-level horizontal overflow did not occur: `scrollWidth=375`, `viewportWidth=390`.

## Console And Traffic

- Browser console errors: none.
- Browser console warnings: none.
- Dev-server traffic observed only local app/read GETs. No provider, model, billing, GitHub, Codex execution, or external traffic appeared in the server log.

## Authority Boundaries

Visible boundary language remained explicit: local-only, read-only, preview-only, no external calls, no persistence, no graph DB, and no Codex execution.
