# Perspective Codex Former Pipeline Scaffold

## Summary

Conclusion: PASS with follow-up.

This PR adds the first pure local Codex perspective former pipeline scaffold:
Perspective Formation Input Bundle -> CodexPerspectiveFormerInputPacket ->
CodexPerspectiveCandidateDraft -> Augnes validation/normalization ->
Perspective Candidate-compatible review material.

The scaffold proves pipeline existence and boundary validation. It does not try
to prove that generated perspectives are useful.

## Why This Follows PR #476

PR #476 made Worker-Facing Perspective Guidance more concrete for the next
worker action. This PR follows that by adding the local upstream path that can
form candidate-compatible review material before guidance consumes it.

The relationship is downstream-only: guidance may consume validated material,
but this PR does not change the guidance usefulness model.

## Pipeline Existence Goal

The goal is to establish a bounded Codex perspective former path without calling
Codex or any provider. The new local code models:

- former input packet construction from a Formation Input Bundle;
- model-output-shaped draft material;
- validation and normalization into non-committed review material;
- blocked validation when unsafe payloads or authority claims appear;
- optional compatibility with Worker-Facing Perspective Guidance.

## Existing Augnes Elements Reused

- Perspective Formation Input Bundle remains the upstream bounded input source.
- Perspective Candidate shape remains the candidate-compatible output target.
- Worker-Facing Perspective Guidance remains a downstream consumer only.
- Existing unsafe marker rules from worker guidance are mirrored in the local
  former pipeline.
- Existing strict smoke allowlist and forbidden-surface patterns are reused.

## Existing Augnes Elements Intentionally Not Reused

- The worker-guidance private unsafe marker helper was not exported or factored
  because that would alter the downstream consumer surface for this scaffold.
- The existing candidate builder was not used as the draft validator because it
  has no model-shaped draft boundary.
- Runtime routes, UI, DB state, proof/evidence/readiness writers, Codex SDK
  integration, provider/model/API calls, and GitHub automation were not reused
  because they are outside this PR's authority boundary.

## Files Changed

- `lib/perspective-ingest/perspective-codex-former-input-packet.ts`
- `lib/perspective-ingest/perspective-codex-candidate-draft-pipeline.ts`
- `docs/PERSPECTIVE_CODEX_FORMER_PIPELINE_V0_1.md`
- `reports/2026-06-09-perspective-codex-former-pipeline.md`
- `scripts/smoke-perspective-codex-former-pipeline.mjs`
- `scripts/smoke-perspective-candidate-builder-fixture.mjs`
- `scripts/smoke-perspective-worker-facing-guidance.mjs`
- `package.json`

The neighboring smoke changes are allowlist-only updates for this new strict
local scaffold surface.

## What Is Validated

The dedicated smoke covers:

- `ready_draft_fixture`: builds a packet from bounded Formation Input Bundle
  material, validates a model-shaped draft, preserves safe thesis/selected
  material and pointer-only refs, and returns false authority flags.
- `needs_review_draft_fixture`: preserves gaps, unresolved tensions, basis
  qualifications, and skipped-check concrete reasons without authority
  escalation.
- `malformed_draft_shape_fixture`: blocks model-shaped drafts that provide all
  required top-level fields but malformed nested runtime shapes, and returns a
  blocked validation result instead of throwing.
- `blocked_unsafe_payload_fixture`: blocks unsafe raw/private/provider/token
  markers, records omitted fields, and emits no unsafe marker in the blocked
  result.
- `authority_claim_rejection_fixture`: blocks proof/evidence/readiness write,
  approval, merge, GitHub mutation, Codex execution, and Core-decision claims.
- `downstream_guidance_compatibility_fixture`: feeds validated material to
  Worker-Facing Perspective Guidance and confirms advisory-only false authority.

## Authority Boundary

This PR is a pure local pipeline scaffold only. It does not call Codex, execute
Codex, call provider/model APIs, call GitHub APIs, use network access, write DB
state, create runtime routes, add UI, create proof/evidence/readiness records,
approve, merge, publish, retry, replay, deploy, or make Core decisions.

## Verification

Validation run on June 9, 2026:

- PASS `npm run typecheck`
- PASS `npm run smoke:perspective-codex-former-pipeline`
- PASS `npm run smoke:perspective-worker-facing-guidance`
- PASS `npm run smoke:perspective-candidate-builder-fixture`
- PASS `git diff --check`
- PASS `git diff --cached --check`

## Skipped Checks With Concrete Reasons

- Browser validation skipped because this is a pure local library, docs, report,
  package script, and smoke scaffold with no runtime route or UI.
- DB validation skipped because this scaffold does not read or write DB state.
- Network/API validation skipped because the implementation intentionally does
  not call Codex, provider/model APIs, GitHub APIs, or any network service.

## What Codex Did Not Do

Codex did not call Codex, execute Codex, call the Codex SDK, call OpenAI APIs,
call provider/model APIs, call GitHub APIs, use network access, write DB state,
add runtime routes, add UI, create proof/evidence/readiness records, approve,
merge, publish, retry, replay, deploy, or make Core decisions.

## Recommended Next Implementation PR Title

Dogfood local Codex perspective former pipeline on reviewed PR material
