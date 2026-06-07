# Perspective Scope Handler Cleanup Browser Validation

Date: 2026-06-07

Branch: `codex/perspective-scope-handler-cleanup-v0-1`

URL: `http://127.0.0.1:3000/`

Temp DB: `/tmp/augnes-perspective-scope-handler-cleanup.db`

## Setup

- `AUGNES_DB_PATH=/tmp/augnes-perspective-scope-handler-cleanup.db npm run db:reset`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-scope-handler-cleanup.db npm run db:migrate`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-scope-handler-cleanup.db npm run demo:seed`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-scope-handler-cleanup.db npx next dev -H 127.0.0.1 -p 3000`

## Checks

- Perspective opened as the default Cockpit tab.
- Perspective Observatory workspace, Current Perspective Starmap, Observatory Controls, Inspector, and Event Rail rendered.
- Left Controls retained Formation Basis, Lens, Scope, and Source.
- Scope controls:
  - Manual Selection with no selected material stayed on Whole Constellation and showed `Select a node or cluster before using Manual Selection.`
  - Connected Node selected connected-node context.
  - Cluster selected cluster context.
  - Manual Selection with selected cluster entered local Manual Selection context.
  - Whole returned to Whole Constellation and cleared selected material.
- Lens controls:
  - Whole Constellation returned whole view.
  - Connected Nodes selected connected-node context.
  - Open Tensions used the explicit Manual Selection fallback without crash.
  - Next Candidates used the explicit Manual Selection fallback without crash.
  - Codex Handoff switched packet target to Codex Handoff without changing scope.
- Node click:
  - `Product concept` on `sample:chatgpt` and `Work unit` on `sample:codex` selected connected-node context and updated the inspector selection summary.
- Formation Basis:
  - Existing cached acknowledgement was observed for `sample:chatgpt` / `Product concept`: `Viewing Manual Selection · cached local acknowledgement · no API call`.
  - Fresh `sample:codex` / `Work unit` context opened `Switch to Manual Selection View?` with `Cancel` and `Apply View`.
  - Applying Manual Selection set scope to Manual Selection and showed `Applied Manual Selection View · local-only`.
  - Re-clicking Manual Selection used cached acknowledgement and showed `Viewing Manual Selection · cached local acknowledgement · no API call`.
  - Current opened `Switch to Current View?`; Apply View returned lens and scope to Whole Constellation and showed `Applied Current View · local-only`.
- Inspector actions:
  - Inspect connected nodes selected connected-node context.
  - Preview Perspective Unit selected cluster context and ChatGPT Review packet target.
  - Mark as Next Candidate Preview selected Manual Selection context, Next Candidates lens, and `Marked as next candidate preview`.
  - Open Handoff Packet opened packet details, switched target to Codex Handoff, and did not change scope or lens.
- Event Rail cards:
  - Next Perspective displayed Future Candidate Card copy.
  - Current View displayed Current View Card copy.
- Mobile viewport:
  - Requested 390px width; Browser reported 375px effective width.
  - Page horizontal overflow: `0`.
  - Sampled Observatory, Controls, Starmap, Inspector, Event Rail, Lens, Scope, and Event Rail item elements had no horizontal overflow.
- Console warnings/errors: none observed.
- Server traffic:
  - Only local app/API GETs were observed, including `/`, `/api/augnes/read/...`, `/api/perspective/snapshot`, `/api/state/...`, `/api/work...`, `/api/events`, and local summary routes.
  - No external provider, model, GitHub, Codex execution, or API billing traffic was observed.

## Skipped Checks

- Direct localStorage payload inspection was not repeated in this slice. Cached acknowledgement behavior was verified through the UI, while metadata shape and storage boundaries remain covered by the Formation Switch helper and smoke tests.
