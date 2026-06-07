# Perspective Formation Switch Overlay Browser Validation

Date: 2026-06-07

Branch: `codex/perspective-formation-switch-overlay-v0-1`

URL: `http://127.0.0.1:3000`

Temp DB: `/tmp/augnes-formation-switch-overlay.db`

## Setup

- Reset DB with `AUGNES_DB_PATH=/tmp/augnes-formation-switch-overlay.db npm run db:reset`.
- Applied migrations with `AUGNES_DB_PATH=/tmp/augnes-formation-switch-overlay.db npm run db:migrate`.
- Seeded demo data with `AUGNES_DB_PATH=/tmp/augnes-formation-switch-overlay.db npm run demo:seed`.
- Started local dev server with `AUGNES_DB_PATH=/tmp/augnes-formation-switch-overlay.db npx next dev -H 127.0.0.1 -p 3000`.

## Observations

- Perspective opened as the default tab with `aria-current="page"`.
- The Perspective Observatory layout remained intact: identity strip, left Observatory Controls, center starmap, right inspector, and lower Event Rail stayed present.
- Clicking Current while already on the current whole-constellation basis did not open the overlay and showed `Already viewing Current`.
- Selected the `User intent` starmap node, then clicked Manual Selection:
  - The Formation Basis switch overlay appeared.
  - Overlay title was `Switch to Manual Selection View?`.
  - Overlay explained local-only, read-only, preview-only behavior.
  - Overlay included `make no API calls`, `cost nothing`, and `create no persistence`.
  - Cancel closed the overlay without changing basis; the identity strip still reported `current`.
- Reopened Manual Selection and clicked Apply View:
  - Overlay closed.
  - Basis changed to `manual_selection`.
  - Inspector reflected `Selection scope Manual Selection`.
  - Notice showed `Applied Manual Selection View · local-only`.
- Clicking Manual Selection again with the same selected-node context skipped the overlay and showed `Viewing Manual Selection · cached local acknowledgement · no API call`.
- Clicking Current from Manual Selection opened `Switch to Current View?`; Apply View returned the basis to `current`, scope to Whole Constellation, and showed `Applied Current View · local-only`.
- Historical Snapshot opened a Close-only explanation card with no Apply View. It stated future archive behavior only, no frozen snapshot persistence, and no delta view.
- Auto Proposal opened a Close-only explanation card with no Apply View. It stated no provider, model, API call, API billing, proposal generation, graph rearrangement, or persistence.
- Experimental opened a Close-only explanation card with no Apply View. It stated internals remain unexposed and contained no Rulecraft wording.

## LocalStorage Metadata

The Browser read-only evaluation scope did not expose `localStorage` directly, so the stored JSON payload could not be printed from the browser tool. The UI confirmed the acknowledgement was written and read by the app because a repeated Manual Selection switch with the same selected-node context skipped OK and showed the cached-local acknowledgement notice.

Source and smoke coverage verified the storage key and metadata shape:

- key: `augnes.perspective.formationSwitchAcknowledgement.v0_1`
- metadata only: basis, basisVersion, sourceQuery, constellationId, formationId, contextFingerprint, costTier, externalCalls, apiBillable, persistence, acknowledgedAt, expiresAt
- TTL: 24 hours
- forbidden content excluded from metadata type: raw graph, pasted text, source text, packet text, prompt text, model output, private history

## Console

No browser console warnings or errors were captured.

## Mobile

At an around-390px mobile viewport, the page reported:

- `pageOverflowX: 0`
- no sampled DOM elements extending beyond the viewport
- Perspective remained the active/default tab

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
