# Perspective Worker-Facing Guidance Action Specificity

Date: 2026-06-09

## Summary

This PR refines `buildWorkerFacingPerspectiveGuidanceFromCandidate(input)` so
worker-facing next actions use safe, bounded source candidate context that was
already available to the builder. The output schema and guidance version stay
the same.

## What PR #475 Found

PR #475 dogfooded the local worker-facing guidance loop and concluded `PASS
with follow-up`. The guidance was specific enough to seed a future Codex task
prompt, but the action summaries were still too generic. A future worker could
see that they should inspect refs, draft a plan, or resolve gaps, but had to
infer which files, refs, and checks mattered.

## What Action Specificity Changed

Action summaries now incorporate bounded context when it is safe:

- selected changed-file count and the first relevant selected files;
- source work id or PR refs;
- work goal or changed-files summary;
- verification gap count, gap kinds, and check/gap refs;
- unresolved tension count and tension kinds;
- blocking basis, such as missing scope.

The ready path stays `actionable_advisory`, but its actions now point at
concrete PR/work refs, selected files, and check ids. The needs-review path
names failed/skipped checks or gap kinds when available. The blocked path
continues to stop/defer while naming the safe blocking reason.

## Bounded Before And After Examples

Before:

- `inspect_source_candidate_refs`: inspect source refs and selected material.
- `draft_smallest_scoped_plan`: draft from the work goal and changed-file
  summary.
- `resolve_verification_gaps`: resolve verification gaps before planning.
- `stop_and_request_unblock`: resolve the blocking basis first.

After:

- `inspect_source_candidate_refs`: mentions a safe work id or PR ref and the
  selected file count.
- `draft_smallest_scoped_plan`: mentions the work goal and relevant selected
  files.
- `carry_forward_verification_gaps`: names gap kinds and check ids when
  available.
- `resolve_verification_gaps`: names failed/skipped check ids or gap kinds.
- `stop_and_request_unblock`: names the missing-scope or blocking-basis reason
  when safe.

## Why This Makes The Next Worker Action More Concrete

The future Codex worker sees the likely smallest useful step without opening
the entire candidate object first. The action list now directs the worker to
the relevant files and checks while still requiring independent verification
before editing.

## Safety And Authority Boundary

The refinement reuses existing sanitized guidance material. It preserves raw
payload exclusion and unsafe marker omission, including billing, token, OAuth,
raw source, raw candidate, private, provider, API key, hidden reasoning,
generated model, GitHub-token-like, and secret-like markers.

The guidance remains advisory only. It is not proof, evidence, readiness,
approval, merge authority, GitHub mutation, Codex execution, ChatGPT Apps
integration, persistence, provider/model/API behavior, or Core decision
authority.

## Intentionally Out Of Scope

- No runtime routes.
- No UI or app/api behavior.
- No DB schema, migrations, persistence, or graph DB behavior.
- No source ingress or OAuth.
- No provider/model/API calls.
- No proof/evidence/readiness writes.
- No ChatGPT Apps integration.
- No Codex SDK/plugin integration.
- No GitHub mutation automation.
- No actual Codex execution.
- No merge, approval, publish, retry, replay, or deploy behavior.
- No Core decisions.

## Recommended Next Implementation PR

Add local ChatGPT perspective request preview surface.

## Validation

- `npm run typecheck`
- `npm run smoke:perspective-worker-facing-guidance`
- `npm run dogfood:perspective-worker-facing-guidance-loop`
- `npm run smoke:perspective-worker-facing-guidance-loop-dogfood`
- `npm run smoke:perspective-candidate-builder-fixture`
- `git diff --check`
- `git diff --cached --check`
