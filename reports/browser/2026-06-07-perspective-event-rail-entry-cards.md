# Perspective Event Rail Entry Cards Browser Validation

Date: 2026-06-07

Branch: `codex/perspective-event-rail-entry-cards-v0-1`

URL: `http://127.0.0.1:3000`

Temp DB: `/tmp/augnes-event-rail-entry-cards.db`

## Setup

- Reset DB with `AUGNES_DB_PATH=/tmp/augnes-event-rail-entry-cards.db npm run db:reset`.
- Applied migrations with `AUGNES_DB_PATH=/tmp/augnes-event-rail-entry-cards.db npm run db:migrate`.
- Seeded demo data with `AUGNES_DB_PATH=/tmp/augnes-event-rail-entry-cards.db npm run demo:seed`.
- Started local dev server with `AUGNES_DB_PATH=/tmp/augnes-event-rail-entry-cards.db npx next dev -H 127.0.0.1 -p 3000`.

## Observations

- Perspective opened as the default tab. The active Cockpit tab was `Perspective` with `aria-current="page"`.
- The starmap remained the first visible observatory workspace and loaded the local fixture constellation with 7 nodes, 8 edges, and 2 tensions.
- The Event Rail remained visible below the observatory with Past / Archive, Present / Active View, and Future / Candidate roles.
- Clicking Session selected the archive card:
  - `Event Rail archive entry card`
  - `Archive Entry Card`
  - `Past / Archive / reference`
  - `reference-only`
  - `No snapshot persistence yet`
  - `No delta view`
  - Snapshot preview text said frozen snapshots are not stored and Compare to Current is not implemented.
- Clicking Current View selected the present card:
  - `Current View Card`
  - `Present / Active local preview`
  - `PerspectiveUnitPreview / FormationReceiptV0`
  - `local-only / read-only / preview-only`
  - no snapshot persistence and no delta engine language remained visible.
- Clicking Next Perspective selected the future candidate card:
  - `Future Candidate Card`
  - `Future / Advisory candidate`
  - `advisory-only`
  - no Codex execution, no GitHub call, no provider/model/API billing, and no mutation language remained visible.
- Related refs were visible in the selected-card ref preview. Opening Event details exposed the full related ref list for the selected Next Perspective card.

## Console

No browser console warnings or errors were captured.

## Mobile

At an around-390px mobile viewport, the page reported:

- `pageOverflowX: 0`
- no sampled DOM elements extending beyond the viewport
- the Event Rail and selected card stacked to the available mobile width

## Traffic

The server log showed only local app/API `GET` traffic for the page and existing local Augnes read/state endpoints, including:

- `/`
- `/api/augnes/read/constellation-preview?scope=project:augnes`
- `/api/augnes/read/perspective-ingest-constellation-preview?scope=project:augnes&source=sample%3Achatgpt`
- `/api/perspective/snapshot?scope=project:augnes`
- `/api/state/brief?scope=project:augnes`
- `/api/work?scope=project:augnes`
- `/api/events?scope=project:augnes`
- `/api/work/AG-001/brief?scope=project:augnes`

No external provider, model, GitHub, Codex, or billing traffic was observed.
