# Perspective Overlay Focus and Agent Semantics Browser Validation

Date: 2026-06-07

Branch: `codex/perspective-overlay-focus-agent-semantics-v0-1`

URL: `http://127.0.0.1:3000/`

Temp DB: `/tmp/augnes-perspective-overlay-focus-agent-semantics.db`

Setup:

- `AUGNES_DB_PATH=/tmp/augnes-perspective-overlay-focus-agent-semantics.db npm run db:reset`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-overlay-focus-agent-semantics.db npm run db:migrate`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-overlay-focus-agent-semantics.db npm run demo:seed`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-overlay-focus-agent-semantics.db npx next dev -H 127.0.0.1 -p 3000`

## Result

PASS with noted browser-tool limitations below.

## Default Observatory

- Perspective opened as the default tab.
- Perspective Observatory, Current Perspective Starmap, Observatory Controls, Inspector, and Event Rail rendered in the expected structure.
- Starmap remained present as the primary center surface.
- Browser DOM check found one each for the new semantic regions:
  - `formation-identity`
  - `observatory-controls`
  - `formation-basis-controls`
  - `lens-controls`
  - `scope-controls`
  - `source-summary`
  - `starmap`
  - `inspector`
  - `event-rail`
  - `temporal-entry-card`
- `data-augnes-surface="perspective-observatory"` was present with:
  - `data-augnes-authority="read-only local-only preview-only"`
  - `data-augnes-external-calls="false"`
  - `data-augnes-api-billable="false"`
  - `data-augnes-persistence="false"`
  - `data-augnes-codex-execution="false"`
- Browser DOM scan found no unsafe `data-*` attributes for raw graph, source text, pasted text, packet text, prompt text, model output, private history, serialized graph JSON, or serialized FormationReceipt content.

## Manual Selection Overlay

Without a selected node:

- Manual Selection opened the Formation Basis switch overlay.
- Focus landed on `Cancel`.
- Overlay exposed:
  - `role="dialog"`
  - `aria-modal="true"`
  - `aria-labelledby="perspective-formation-switch-overlay-title"`
  - `aria-describedby="perspective-formation-switch-overlay-description"`
  - `aria-label="Formation Basis switch overlay"`
  - action row `aria-label="Formation Basis switch actions"`
  - safe authority attributes matching the Observatory surface.
- Apply View was present but disabled.
- Tab and Shift+Tab browser key checks stayed inside the overlay.
- Escape closed the overlay and returned focus to the Manual Selection Formation Basis button.

With a selected starmap node:

- Manual Selection opened the overlay with Apply View enabled.
- Focus landed on `Cancel`.
- Keyboard focus stayed inside the overlay; CUA Shift+Tab landed on `Apply View`.
- Explicit Apply View activation switched the view to Manual Selection and showed `Applied Manual Selection View · local-only`.

## Current Overlay

- From Manual Selection, Current opened the local switch overlay.
- Focus landed on `Cancel`.
- Apply View was enabled.
- Explicit Apply View activation switched the view to Current and showed `Applied Current View · local-only`.
- A cached Current acknowledgement path was exercised by moving scope away from Whole and then choosing Current again:
  - overlay count stayed `0`
  - notice showed `Viewing Current · cached local acknowledgement · no API call`
  - Whole scope became active again.

## Future Explanation Overlays

- Historical Snapshot opened a future explanation overlay.
- Focus landed on `Close`.
- Browser DOM showed:
  - `aria-label="Formation Basis future explanation"`
  - `Apply View` button count `0`
  - enabled Apply View count `0`
- Escape closed the overlay and returned focus to Historical Snapshot.
- Auto Proposal opened the same future explanation style.
- Close closed the overlay and returned focus to Auto Proposal.

## Mobile

Viewport override: `390x844`.

- Perspective Observatory remained present.
- Starmap remained present.
- Page-level horizontal overflow check passed:
  - document client width: `375`
  - document scroll width: `375`
  - body scroll width: `375`

The viewport override was reset after the check.

## Console And Traffic

- Browser console warnings/errors: none.
- Dev server logs showed local app/read GETs only:
  - `/`
  - `/api/augnes/read/constellation-preview`
  - `/api/augnes/read/perspective-ingest-constellation-preview`
  - `/api/perspective/snapshot`
  - `/api/state/brief`
  - `/api/work`
  - `/api/events`
  - `/api/mailbox/summary`
  - `/api/publications/summary`
  - `/api/approval-gate-state/summary`
  - `/api/state/snapshot`
  - `/api/state/trajectory`
  - `/api/proposals`
  - `/api/work/AG-001/brief`
- No provider, GitHub, Codex execution, or external traffic appeared in server logs.

## Skipped Or Limited Checks

- Direct browser `localStorage` inspection was unavailable because the Browser read-only evaluate scope did not expose `localStorage`. Metadata-only cached acknowledgement storage remains covered by the helper source and `smoke:cockpit-perspective-formation-switch-overlay`.
- Browser-control Tab/Enter dispatch behaved differently from a normal user keyboard in this runtime. The checks still proved focus stayed inside the overlay and could reach Apply View; Apply mutation was validated with explicit button activation.
