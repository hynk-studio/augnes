# Perspective Worker-Facing Guidance

Date: 2026-06-09

## Summary

This PR adds a deterministic pure local worker-facing guidance builder for the
Codex side of the Perspective loop. It converts a `perspective_candidate.v0.1`
object into neutral guidance a future Codex worker can use to plan the next
smallest useful work, while keeping unresolved tensions, verification gaps,
worker instructions, and false authority flags visible.

## Why This Follows The Completed Local Packet Chain

The previous local chain produced Formation Input Bundle, Perspective
Candidate, ChatGPT Briefing Preview, Manual User Judgment Capture Packet,
Codex Next-Handoff Draft Packet, and the dogfood/eval/readability/manual usage
note layers. The missing local Codex-side step is a builder that converts a
Perspective Candidate into worker-facing guidance without executing Codex or
claiming approval. This PR starts that loop.

## Files Changed

- `lib/perspective-ingest/perspective-worker-facing-guidance.ts`
- `docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_V0_1.md`
- `reports/2026-06-09-perspective-worker-facing-guidance.md`
- `scripts/smoke-perspective-worker-facing-guidance.mjs`
- `package.json`
- `scripts/smoke-perspective-candidate-builder-fixture.mjs`

The existing smoke edit is a narrow changed-file allowlist update so adjacent
candidate-builder validation recognizes this explicit pure local worker
guidance slice.

## Authority Boundary

This PR is pure local guidance only. It adds no runtime route, no UI, no
`app/api` route, no DB/schema/persistence, no provider/model/API call, no
proof/evidence/readiness write, no ChatGPT Apps integration, no Codex
SDK/plugin integration, no GitHub mutation automation, no actual Codex
execution, no merge, no approval, and no Core decision.

The guidance is not committed state, proof, evidence, readiness, approval,
merge authority, GitHub mutation, ChatGPT Apps integration, Codex execution,
provider/model/API behavior, persistence, or Core decision authority.

## Behavior Covered

- `sufficient_for_review` candidates become actionable advisory guidance.
- `needs_review` candidates prioritize resolving visible gaps before further
  work.
- `blocked` candidates tell the worker to stop or defer.
- unresolved tensions stay visible;
- verification gaps stay visible;
- explicit bounded summaries are allowed when safe and reviewable;
- raw/private/provider/token payloads, hidden reasoning, raw source payloads,
  raw candidate payloads, generated model payloads, API keys, OAuth payloads,
  billing payloads, and secrets are omitted.

## Validation Plan

- `npm run typecheck`
- `npm run smoke:perspective-worker-facing-guidance`
- `npm run smoke:perspective-candidate-builder-fixture`
- `git diff --check`
- `git diff --cached --check`

## What Is Not Implemented

- No runtime route.
- No UI.
- No app/api route.
- No DB schema, migration, persistence, or graph DB behavior.
- No source ingress or OAuth implementation.
- No provider/model/API calls.
- No GitHub mutation automation.
- No proof/evidence/readiness writes.
- No ChatGPT Apps integration.
- No Codex plugin or Codex SDK integration.
- No actual Codex execution.
- No Core decision.
- No merge, publish, or approval authority.

## Tests Run

- PASS: `npm run typecheck`
- PASS: `npm run smoke:perspective-worker-facing-guidance`
- PASS: `npm run smoke:perspective-candidate-builder-fixture`
- PASS: `git diff --check`
- PASS: `git diff --cached --check`

## Skipped Checks

- Browser validation: skipped because this is a pure local builder, docs,
  report, package script, and smoke slice with no UI or route changes.
- `npm run build`: skipped because this PR changes no runtime route, UI,
  component, CSS, DB, persistence, or app behavior.

## Main Risk

The main risk is over-promoting worker guidance into execution or authority.
The builder keeps guidance advisory, preserves visible gaps, redacts unsafe
source-like material, and sets all authority flags to false.
