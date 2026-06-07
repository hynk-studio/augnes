# Perspective Temporal-Spatial Projection Builders Validation

Date: 2026-06-07

## Branch

`codex/perspective-temporal-spatial-projection-builders-v0-1`

## Commit

Preflight/base commit: `b5faa50a70f1e8b77ef9cc7ef33fd3a7073a2a85`

Implementation commit: pending at report authoring. This report is committed with the PR branch; the final PR head SHA is recorded in the PR body and final closeout.

## Preflight Result

PASS. PR #446, "Humanize Perspective constellation node labels and summaries", is merged into `main`.

- PR #446 state: `MERGED`
- PR #446 merged at: `2026-06-07T16:37:02Z`
- PR #446 merge commit: `b5faa50a70f1e8b77ef9cc7ef33fd3a7073a2a85`
- `origin/main` / remote `HEAD` resolved to `b5faa50a70f1e8b77ef9cc7ef33fd3a7073a2a85`

## Files Changed

- `lib/perspective-ingest/perspective-temporal-spatial-map.ts`
- `lib/perspective-ingest/perspective-workbench-projection.ts`
- `lib/perspective-ingest/perspective-agent-brief.ts`
- `docs/PERSPECTIVE_TEMPORAL_SPATIAL_PROJECTION_BUILDERS_V0_1.md`
- `scripts/smoke-perspective-temporal-spatial-projection-builders.mjs`
- `package.json`
- `reports/2026-06-07-perspective-temporal-spatial-projection-builders.md`
- Existing smoke allowlists updated only where required for this slice:
  - `scripts/smoke-cockpit-perspective-authority-copy-collapse.mjs`
  - `scripts/smoke-cockpit-perspective-event-rail-node-edge.mjs`
  - `scripts/smoke-perspective-capsule-contract.mjs`
  - `scripts/smoke-perspective-node-copy-humanization.mjs`

## Projection Builder Summary

This slice adds pure/local/read-only builders only:

- `perspective-temporal-spatial-map.ts` defines stable temporal node ids, Cockpit surface ids, sample ChatGPT spatial-to-temporal mapping, fallback node-type mapping, Temporal Underlay primary path, handoff satellites, surface hints, and pure helper functions.
- `perspective-workbench-projection.ts` builds `perspective_workbench_projection.v0.1` from the existing preview response without packet text, full refs, FormationReceipt details, raw source text, or DOM output. Visible tensions and next actions are capped at two by default.
- `perspective-agent-brief.ts` builds `perspective_brief.v0.1` for future agent consumption surfaces without creating ingress, route, provider, execution, or authority behavior.

No UI redesign, graph topology change, node/edge id/type change, route, DB schema, migration, persistence, graph DB behavior, provider/model/API call, GitHub mutation, Codex execution, proof/evidence/readiness write, Rulecraft exposure, hidden raw JSON dump, or packet section order change was added.

## Tests Run

- PASS: `npm run typecheck`
- PASS: `npm run smoke:perspective-ingest-constellation-preview`
- PASS: `npm run smoke:perspective-capsule-contract`
- PASS: `npm run smoke:cockpit-perspective-event-rail-node-edge`
- PASS: `npm run smoke:perspective-node-copy-humanization`
- PASS: `npm run smoke:cockpit-perspective-authority-copy-collapse`
- PASS: `npm run smoke:perspective-temporal-spatial-projection-builders`
- PASS: `npm run build`
- PASS: `git diff --check`
- PASS: `git diff --cached --check`

Validation note: after `npm run build`, Next.js rewrote tracked generated file `next-env.d.ts` from `./.next/dev/types/routes.d.ts` to `./.next/types/routes.d.ts`. That generated churn was restored because it is outside this PR's scope. The changed-file-boundary smokes were rerun after cleanup and passed against the final branch contents.

## Skipped Checks

- `npm run lint`: skipped because `package.json` does not define a `lint` script.
- `npm test`: skipped because `package.json` does not define a `test` script.
- Browser validation: skipped because this is a builder-only data/projection PR with no component, CSS, route, or runtime UI changes.

## Blockers

None.

## Next Suggested Implementation PR

Recommended next PR title: **Simplify Perspective workbench with Temporal Underlay projection**.

That PR should wire the Human Workbench projection into the Perspective surface while keeping Event Rail available as the full temporal view and preserving the research substrate.
