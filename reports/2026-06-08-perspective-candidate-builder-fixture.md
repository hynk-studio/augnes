# Perspective Candidate Builder Fixture

Date: 2026-06-08

## Summary

This PR adds a deterministic pure local Perspective Candidate builder fixture.
It converts read-only Formation Input Bundles into non-committed Perspective
Candidate material for review while preserving bounded summaries, pointer refs,
skipped-check qualifications, unresolved gaps, and authority boundaries.

## Why This Follows PR #464

PR #464 added the pure local Perspective Formation Input Bundle builder and
fixed review feedback so skipped checks only count as readiness material when
they include concrete reasons. This PR implements the next ladder step:
formation input becomes a deterministic, non-committed candidate object without
adding routes, persistence, provider calls, UI, or decision authority.

## Files Changed

- `lib/perspective-ingest/perspective-candidate-builder.ts`
- `docs/PERSPECTIVE_CANDIDATE_BUILDER_FIXTURE_V0_1.md`
- `reports/2026-06-08-perspective-candidate-builder-fixture.md`
- `scripts/smoke-perspective-candidate-builder-fixture.mjs`
- `package.json`
- `docs/PERSPECTIVE_FORMATION_LANE_V0_1.md`
- `docs/PERSPECTIVE_FORMATION_INPUT_BUNDLE_BUILDER_V0_1.md`
- `scripts/smoke-perspective-formation-lane-v0-1.mjs`
- `scripts/smoke-perspective-formation-input-bundle-builder.mjs`
- `scripts/smoke-perspective-agent-brief-read-surface.mjs`
- `scripts/smoke-perspective-temporal-spatial-projection-builders.mjs`

The existing smoke edits are narrow allowlist and ladder-awareness updates so
the requested validation bundle recognizes the PR C pure-local builder slice.

## Authority Boundary

This PR adds a pure local builder only. It adds no runtime route, no `app/api`,
no DB schema or migrations, no persistence, no graph DB behavior, no source
ingress implementation, no OAuth implementation, no provider/model/API calls,
no GitHub mutation outside the scoped PR workflow, no proof/evidence/readiness
writes, no ChatGPT Apps implementation, no Codex plugin implementation, no
Codex SDK execution, no product UI, no component/CSS/browser-facing behavior,
and no Event Rail, graph topology, node id/type, edge id/type, packet section
order, Agent Brief read route behavior, or local manual preview route behavior
changes.

The candidate output is not committed state, not proof, not evidence, not
readiness, not approval, and not merge authority.

## Validation Plan

- `npm run typecheck`
- `npm run smoke:perspective-candidate-builder-fixture`
- `npm run smoke:perspective-formation-input-bundle-builder`
- `npm run smoke:perspective-formation-lane-v0-1`
- `npm run smoke:perspective-agent-brief-read-surface`
- `npm run smoke:perspective-temporal-spatial-projection-builders`
- `npm run smoke:perspective-ingest-constellation-preview`
- `git diff --check`
- `git diff --cached --check`
- `npm run build`

## What Is Not Implemented

- No ChatGPT Perspective Candidate briefing preview.
- No runtime route.
- No persistence or graph DB behavior.
- No provider/model/API call.
- No OAuth or source ingress implementation.
- No ChatGPT Apps or Codex plugin implementation.
- No proof/evidence/readiness writes.
- No UI or browser-facing behavior.
- No Core-gated accept/reject/supersede route.

## Tests Run

- `AUGNES_API_BASE_URL=http://localhost:3000 CODEX_SCOPE=project:augnes npm run codex:read-brief`: PASS
- `npm run typecheck`: PASS
- `npm run smoke:perspective-candidate-builder-fixture`: PASS
- `npm run smoke:perspective-formation-input-bundle-builder`: PASS
- `npm run smoke:perspective-formation-lane-v0-1`: PASS
- `npm run smoke:perspective-agent-brief-read-surface`: PASS
- `npm run smoke:perspective-temporal-spatial-projection-builders`: PASS
- `npm run smoke:perspective-ingest-constellation-preview`: PASS
- `git diff --check`: PASS
- `npm run build`: PASS

## Skipped Checks

- `npm run lint`: skipped because `package.json` does not define a lint script.
- `npm test`: skipped because `package.json` does not define a test script.
- Browser validation: skipped because this is a pure local builder with no UI
  or route changes.
- Evidence row recording: skipped because `CODEX_WORK_ID` is missing.
- Proof-only closeout status: skipped because `CODEX_WORK_ID` is missing.

## Blockers or Risks

The main risk is over-promoting candidate material into committed state,
approval, proof, evidence, readiness, or merge authority. The builder returns
explicit non-committed authority, pointer-only refs, raw payload exclusion, and
false authority flags. Placeholder skipped checks remain preserved but surface
as unresolved tensions when concrete reasons are missing.

## Next Recommended PR Title

Add ChatGPT Perspective Candidate briefing preview
