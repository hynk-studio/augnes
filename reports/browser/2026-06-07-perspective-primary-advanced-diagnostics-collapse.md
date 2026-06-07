# Perspective Primary Advanced Diagnostics Collapse Browser Validation

Date: 2026-06-07

Branch: `codex/perspective-primary-advanced-diagnostics-collapse-v0-1`

URL: `http://127.0.0.1:3000`

Temp DB: `/tmp/augnes-primary-advanced-diagnostics-collapse.db`

Server command:

- `env -u OPENAI_API_KEY -u GITHUB_TOKEN AUGNES_DB_PATH=/tmp/augnes-primary-advanced-diagnostics-collapse.db npm run dev -- --hostname 127.0.0.1 --port 3000`

Port note:

- A pre-existing same-repo Next dev server owned port 3000 before validation. It was stopped, then this slice was validated on port 3000 with the temp DB above.

## Setup Commands

- `AUGNES_DB_PATH=/tmp/augnes-primary-advanced-diagnostics-collapse.db npm run db:reset`
- `AUGNES_DB_PATH=/tmp/augnes-primary-advanced-diagnostics-collapse.db npm run db:migrate`
- `AUGNES_DB_PATH=/tmp/augnes-primary-advanced-diagnostics-collapse.db npm run demo:seed`

## Default Collapsed Behavior

PASS:

- Perspective opens as the default tab.
- First visible user flow remains Observatory-first.
- Perspective Observatory is visible.
- Current Perspective Starmap is visible and primary.
- Observatory Controls, Inspector, and Event Rail are visible.
- Immediately after Event Rail, only the compact Advanced Diagnostics entry is visible.
- Advanced Diagnostics was collapsed by default.
- `data-augnes-diagnostics-state` was `collapsed`.
- `aria-expanded` was `false`.
- Advanced Diagnostics body was not mounted by default.
- Frame section was not visible until Advanced Diagnostics opened.
- Evidence, Tensions, Boundary / Next, Route Preview, Ingest Graph, and Constellation Preview were not visible inline by default.
- No new always-visible panel appeared.
- No new boundary wall appeared.

Desktop measurements:

- Collapsed `scrollHeight`: `1942`
- Event Rail bottom: `1812`
- Advanced Diagnostics top: `1824`
- Horizontal overflow: none

## Open / Close Behavior

PASS:

- Opening Advanced Diagnostics revealed the secondary diagnostic sections.
- Closing Advanced Diagnostics collapsed the sections again and unmounted the body.
- Existing section ids remained reachable when diagnostics were open.
- Advanced section links were inside Advanced Diagnostics.

Open-state observations:

- `data-augnes-diagnostics-state`: `open`
- `aria-expanded`: `true`
- Open `scrollHeight`: `23840`
- Groups observed:
  - `advanced-boundaries`
  - `boundary-next`
  - `constellation-preview`
  - `evidence-tensions`
  - `formation-archive`
  - `frame-ledger`
  - `ingest-graph`
  - `research-temporal`
  - `route-preview`

Close-state observations:

- `data-augnes-diagnostics-state`: `collapsed`
- `aria-expanded`: `false`
- Advanced Diagnostics body mounted: `false`
- Frame visible: `false`

## Preserved Primary Interactions

PASS:

- Handoff packet details still worked.
- `Open Handoff Packet` opened the details disclosure.
- Packet textarea was visible.
- Packet text still contained `Perspective Handoff Packet`.
- Packet text still contained `7. Compact Authority`.
- Formation Basis overlay still worked.
- Manual Selection basis opened `Switch to Manual Selection View?`.
- Overlay retained read-only/local/no-external-call semantics.
- Cancel closed the overlay.
- Event Rail cards still worked.
- Selecting an archive rail card changed the selected card from `Current View Card` to `Archive Entry Card`.
- Advanced Diagnostics stayed collapsed during Event Rail card selection.

## Mobile 390px Check

Viewport override: 390px wide, observed 375px CSS viewport.

PASS:

- Perspective remained the default tab.
- Perspective Observatory remained visible.
- Current Perspective Starmap remained visible.
- Observatory Controls, Inspector, and Event Rail remained visible.
- Advanced Diagnostics stayed collapsed by default.
- Frame section remained hidden by default.
- No horizontal page overflow.

Mobile observations:

- `docClientWidth`: `375`
- `docScrollWidth`: `375`
- Collapsed mobile `scrollHeight`: `6296`

## Console Warnings/Errors

PASS:

- No browser console warnings or errors.

## Traffic Summary

Server logs showed local app/read GETs only, including:

- `GET /`
- `GET /api/augnes/read/constellation-preview?scope=project:augnes`
- `GET /api/augnes/read/perspective-ingest-constellation-preview?scope=project:augnes&source=sample%3Achatgpt`
- local read/state/work/events summary routes such as `/api/perspective/snapshot`, `/api/state/brief`, `/api/work`, `/api/events`, `/api/mailbox/summary`, `/api/publications/summary`, `/api/approval-gate-state/summary`, `/api/state/snapshot`, `/api/state/trajectory`, and `/api/work/AG-001/brief`

No external provider, GitHub, Codex, OpenAI, or API-billing traffic was observed.

## Skipped Checks

None.
