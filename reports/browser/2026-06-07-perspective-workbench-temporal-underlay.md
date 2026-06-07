# Perspective Workbench Temporal Underlay Browser Validation

Date: 2026-06-07
Branch: `codex/perspective-workbench-temporal-underlay-v0-1`
Commit: final PR head recorded in PR body and closeout response
PR: pending before final commit

## Preflight Result

PR #447, "Implement Perspective temporal-spatial projection builders", is merged into `main`.
Confirmed merge commit: `adc2e84e6fa2e1ff478c6d177efdcfea673c1951`.

`main` contains:

- `lib/perspective-ingest/perspective-temporal-spatial-map.ts`
- `lib/perspective-ingest/perspective-workbench-projection.ts`
- `lib/perspective-ingest/perspective-agent-brief.ts`
- `docs/PERSPECTIVE_TEMPORAL_SPATIAL_PROJECTION_BUILDERS_V0_1.md`

## Files Changed

- `components/augnes-cockpit.tsx`
- `app/globals.css`
- `docs/PERSPECTIVE_WORKBENCH_TEMPORAL_UNDERLAY_V0_1.md`
- `scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs`
- `package.json`
- Existing Perspective smoke assertions/allowlists for the new projection-driven workbench contract
- `reports/browser/2026-06-07-perspective-workbench-temporal-underlay.md`

## Projection Wiring Summary

The default Perspective UI now uses `buildPerspectiveWorkbenchProjection` for source/status, selected material, capped tensions, capped next actions, action availability, and Temporal Underlay data.

The compact Temporal Underlay renders:

- Primary path: Session, Decision, Handoff, Current View, Next Perspective
- Handoff satellites: PR, Review, Closeout

Selecting the `Known limitation` starmap node updated underlay highlights to `decision`, `next_perspective`, and `closeout`, and the selected material panel showed the related temporal hint.

## Browser Setup

Commands:

- `AUGNES_DB_PATH=/tmp/augnes-perspective-workbench-temporal-underlay.db npm run db:init`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-workbench-temporal-underlay.db npm run db:reset`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-workbench-temporal-underlay.db npm run db:migrate`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-workbench-temporal-underlay.db npm run demo:seed`
- `AUGNES_DB_PATH=/tmp/augnes-perspective-workbench-temporal-underlay.db npx next dev -H 127.0.0.1 -p 3000`

Port 3000 was free before startup. The dev server served this branch locally.

## Browser Validation

- PASS: Perspective opens as the default active surface.
- PASS: Default screen reads as a compact workbench, not a diagnostics wall.
- PASS: Current Perspective Starmap renders with 7 nodes, 8 edges, and 2 tensions.
- PASS: Default visible Starmap text does not include all edge labels/summaries.
- PASS: Node labels are readable and avoid awkward visible ellipses: Sample record, User goal, Preview concept, Fixture decision, Limitation, Next step, Review packets.
- PASS: Selected material panel shows title, short summary, type/scope, capped tensions, capped next steps, and primary actions.
- PASS: Primary actions are visible: Copy ChatGPT Review Packet, Copy Codex Handoff Packet, Open packet preview.
- PASS: Formation Basis future choices are not visible in the default first workbench.
- PASS: Manual Gravity controls are not visible by default.
- PASS: FormationReceipt / long authority details are not visible by default.
- PASS: Full Event Rail node-edge graph is not default-rendered.
- PASS: Temporal Underlay is visible and visually simpler than full Event Rail.
- PASS: Full Event Rail remains reachable behind Temporal details.
- PASS: PR remains a passive reference node with `reference-only` authority in Temporal details.
- PASS: Packet textarea is not present in the DOM before opening packet preview.
- PASS: Opening packet preview renders the packet textarea and preserves section order from `1. Purpose` through `8. Base Packet Text`.
- PASS: Compact authority remains reduced and collapsed by default.
- PASS: At 390px viewport, there is no horizontal overflow; starmap, selected panel, and Temporal Underlay fit at 344px width.
- PASS: Browser console warnings/errors: none.
- PASS: Dev-server traffic was limited to local app/read GET requests. No provider/model/GitHub/Codex/OpenAI/external/billing traffic was observed.

Note: The collapsed lower `Advanced diagnostics` summary remains visible as a low-priority disclosure, but its body is not rendered by default.

## Console and Traffic Summary

Console warnings/errors: none.

Observed local server traffic:

- `GET /`
- `GET /api/augnes/read/constellation-preview?scope=project:augnes`
- `GET /api/augnes/read/perspective-ingest-constellation-preview?scope=project:augnes&source=sample%3Achatgpt`
- Existing local read endpoints for snapshot, state, work, events, mailbox, publications, approval gate, proposals, and work brief

No calls to `api.github.com`, `api.openai.com`, provider/model APIs, Codex execution, external billing, or mutation/handoff execution were observed.

## Tests Run

- PASS: `npm run typecheck`
- PASS: `npm run smoke:perspective-ingest-constellation-preview`
- PASS: `npm run smoke:perspective-capsule-contract`
- PASS: `npm run smoke:cockpit-perspective-ia`
- PASS: `npm run smoke:cockpit-perspective-evidence-handoff-snapshot`
- PASS: `npm run smoke:cockpit-perspective-observatory-layout`
- PASS: `npm run smoke:cockpit-perspective-event-rail-entry-cards`
- PASS: `npm run smoke:cockpit-perspective-event-rail-node-edge`
- PASS: `npm run smoke:cockpit-perspective-formation-switch-overlay`
- PASS: `npm run smoke:cockpit-perspective-scope-handler-cleanup`
- PASS: `npm run smoke:cockpit-perspective-overlay-focus-agent-semantics`
- PASS: `npm run smoke:cockpit-perspective-primary-advanced-diagnostics-collapse`
- PASS: `npm run smoke:perspective-handoff-packet-structure-review`
- PASS: `npm run smoke:perspective-handoff-packet-copy-to-agent-dogfood`
- PASS: `npm run smoke:cockpit-perspective-authority-copy-collapse`
- PASS: `npm run smoke:perspective-node-copy-humanization`
- PASS: `npm run smoke:perspective-temporal-spatial-projection-builders`
- PASS: `npm run smoke:cockpit-perspective-workbench-temporal-underlay`
- PASS: `npm run build`

- PASS: `git diff --check`
- PASS: `git diff --cached --check`

## Skipped Checks

- `npm run lint`: skipped because `package.json` has no `lint` script.
- `npm test`: skipped because `package.json` has no `test` script.

## Blockers or Risks

Blockers: none.

Risk: normal UI/smoke contract drift as the next Perspective UI slices move more surfaces behind projection-driven read surfaces.

## Next Suggested Implementation PR

`Add Perspective Agent Brief read surface`
