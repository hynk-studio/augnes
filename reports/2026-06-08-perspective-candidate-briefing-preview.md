# Perspective Candidate Briefing Preview

Date: 2026-06-08

## Summary

This PR adds a deterministic pure local ChatGPT Perspective Candidate briefing
preview builder. It turns a non-committed Perspective Candidate into bounded
review material with a headline, briefing sections, pointer-only evidence
summary, visible unresolved tensions, advisory next actions, user reply prompts,
handoff discussion readiness, copyable briefing text, privacy flags, and false
authority flags.

## Why This Follows PR #465

PR #465 added
`buildPerspectiveCandidateFromFormationInputBundle(bundle)`, which turns a
read-only Formation Input Bundle into non-committed Perspective Candidate
material. This PR is the next pure local usability step: it makes that
candidate readable in a ChatGPT review conversation without adding runtime
integration, routes, UI, persistence, provider calls, approval, or execution
authority.

## Files Changed

- `lib/perspective-ingest/perspective-candidate-briefing-preview.ts`
- `docs/PERSPECTIVE_CANDIDATE_BRIEFING_PREVIEW_V0_1.md`
- `reports/2026-06-08-perspective-candidate-briefing-preview.md`
- `scripts/smoke-perspective-candidate-briefing-preview.mjs`
- `package.json`
- `docs/PERSPECTIVE_CANDIDATE_BUILDER_FIXTURE_V0_1.md`
- `docs/PERSPECTIVE_FORMATION_LANE_V0_1.md`
- `scripts/smoke-perspective-candidate-builder-fixture.mjs`
- `scripts/smoke-perspective-formation-input-bundle-builder.mjs`
- `scripts/smoke-perspective-formation-lane-v0-1.mjs`
- `scripts/smoke-perspective-agent-brief-read-surface.mjs`
- `scripts/smoke-perspective-temporal-spatial-projection-builders.mjs`

The existing smoke edits are narrow allowlist and ladder-awareness updates so
the requested validation bundle recognizes this explicit pure local briefing
preview slice.

## Authority Boundary

This PR adds a pure local builder only. It adds no runtime route, no `app/api`,
no DB schema or migrations, no persistence, no graph DB behavior, no source
ingress implementation, no OAuth implementation, no provider/model/API calls,
no GitHub mutation outside the scoped PR workflow, no proof/evidence/readiness
writes, no ChatGPT Apps implementation, no Codex plugin implementation, no
Codex SDK execution, no product UI, no component/CSS/browser-facing behavior,
and no Event Rail, graph topology, node id/type, edge id/type, packet section
order, Agent Brief read route behavior, local manual preview route behavior,
or Perspective runtime route behavior changes.

The briefing preview is not committed state, proof, evidence, readiness,
approval, merge authority, ChatGPT Apps integration, or Codex execution.

## Validation Plan

- `npm run typecheck`
- `npm run smoke:perspective-candidate-briefing-preview`
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

- No actual ChatGPT Apps integration.
- No route or UI.
- No DB schema, migrations, persistence, or graph DB behavior.
- No source ingress or OAuth implementation.
- No provider/model/API calls.
- No ChatGPT Apps bridge, Codex plugin, or Codex SDK execution.
- No proof/evidence/readiness writes.
- No Core-gated accept/reject/supersede implementation.
- No merge, publish, or approval authority.

## Tests Run

- `npm run typecheck`: PASS
- `npm run smoke:perspective-candidate-briefing-preview`: PASS
- `npm run smoke:perspective-candidate-builder-fixture`: PASS
- `npm run smoke:perspective-formation-input-bundle-builder`: PASS
- `npm run smoke:perspective-formation-lane-v0-1`: PASS
- `npm run smoke:perspective-agent-brief-read-surface`: PASS
- `npm run smoke:perspective-temporal-spatial-projection-builders`: PASS
- `npm run smoke:perspective-ingest-constellation-preview`: PASS
- `git diff --check`: PASS
- `git diff --cached --check`: PASS
- `npm run build`: PASS

## Skipped Checks

- `AUGNES_API_BASE_URL=http://localhost:3000 CODEX_SCOPE=project:augnes npm run codex:read-brief`: skipped because the helper returned `CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE`.
- `npm run lint`: skipped because `package.json` does not define a lint script.
- `npm test`: skipped because `package.json` does not define a test script.
- Browser validation: skipped because this is a pure local builder with no UI or
  route changes.
- Evidence row recording: skipped because `CODEX_WORK_ID` is missing.
- Proof-only closeout status: skipped because `CODEX_WORK_ID` is missing.

## Blockers or Risks

The main risk is confusing readable briefing material with approval,
committed state, proof, evidence, readiness, merge authority, or Codex
execution. The builder keeps explicit false authority flags, pointer-only refs,
raw payload exclusion, advisory-only next actions, and separate unresolved
tensions to preserve that boundary.

## Next Recommended PR Title

Add manual ChatGPT user judgment capture packet
