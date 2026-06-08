# Perspective Formation Input Bundle Builder

Date: 2026-06-08

## Summary

This PR adds the first pure local Perspective Formation Input Bundle builder
after PR #463. The builder converts caller-supplied Codex work material refs
into a read-only, non-authoritative Formation Input Bundle for future
Perspective Candidate formation.

## Why This Follows PR #463

PR #463 defined Perspective Formation Lane v0.1 and named PR B as "pure local
formation input bundle builder." This PR implements that next ladder step
without jumping to routes, persistence, provider calls, ChatGPT Apps, Codex
plugins, Codex SDK execution, or Core-gated accept/reject/supersede behavior.

## Usability Correction: Bounded Summaries Are Allowed

This PR corrects the lane-definition wording that grouped bounded summary
values with raw/private payloads. Formation Input Bundles need bounded
summaries to be useful, so changed file summaries, check result summaries,
skipped-check reasons, gap summaries, and safe source labels are allowed when
explicit, safe, and reviewable.

Raw/private/provider/token/source payloads remain forbidden.

## Review Fix

Review feedback found that placeholder skipped checks with empty reasons could
make a scoped work bundle ready for candidate formation. The builder now counts
skipped checks as verification material only when `skipped_reason` has concrete
non-empty text. Empty skipped-check entries remain preserved as bounded input
material, but they add the readiness reason `skipped checks missing concrete
reasons` and do not make the bundle ready.

## Files Changed

- `lib/perspective-ingest/perspective-formation-input-bundle.ts`
- `docs/PERSPECTIVE_FORMATION_INPUT_BUNDLE_BUILDER_V0_1.md`
- `reports/2026-06-08-perspective-formation-input-bundle-builder.md`
- `scripts/smoke-perspective-formation-input-bundle-builder.mjs`
- `package.json`
- `docs/PERSPECTIVE_FORMATION_LANE_V0_1.md`
- `scripts/smoke-perspective-formation-lane-v0-1.mjs`
- `scripts/smoke-perspective-agent-brief-read-surface.mjs`
- `scripts/smoke-perspective-temporal-spatial-projection-builders.mjs`

The existing smoke edits are narrow allowlist updates needed for the requested
validation bundle to recognize this explicitly promoted pure-local builder
slice.

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

## Validation Plan

- `npm run typecheck`
- `npm run smoke:perspective-formation-input-bundle-builder`
- `npm run smoke:perspective-formation-lane-v0-1`
- `npm run smoke:perspective-agent-brief-read-surface`
- `npm run smoke:perspective-temporal-spatial-projection-builders`
- `npm run smoke:perspective-ingest-constellation-preview`
- `git diff --check`
- `git diff --cached --check`
- `npm run build`

## What Is Not Implemented

- No Perspective Candidate builder fixture.
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
- `npm run smoke:perspective-formation-input-bundle-builder`: PASS
- `npm run smoke:perspective-formation-lane-v0-1`: PASS
- `npm run smoke:perspective-agent-brief-read-surface`: PASS
- `npm run smoke:perspective-temporal-spatial-projection-builders`: PASS
- `npm run smoke:perspective-ingest-constellation-preview`: PASS
- `git diff --check`: PASS
- `git diff --cached --check`: PASS
- `npm run build`: PASS

## Skipped Checks

- `npm run lint`: skipped because `package.json` does not define a lint script.
- `npm test`: skipped because `package.json` does not define a test script.
- Browser validation: skipped because this is a pure local builder with no UI
  or route changes.
- Evidence row recording: skipped because `CODEX_WORK_ID` is missing.
- Proof-only closeout status: skipped because `CODEX_WORK_ID` is missing.

## Blockers or Risks

Main risk is over-promoting a pure local input bundle into candidate,
approval, proof, or runtime authority. The builder returns explicit
non-authoritative flags and keeps output limited to bounded summaries and
pointer refs. The review fix also prevents placeholder skipped checks from
standing in for concrete verification material.

## Next Recommended PR Title

Add deterministic Perspective Candidate builder fixture
