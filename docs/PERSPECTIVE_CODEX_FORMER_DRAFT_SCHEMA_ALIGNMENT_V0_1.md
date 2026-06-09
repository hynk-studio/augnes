# Perspective Codex Former Draft Schema Alignment v0.1

This document describes the pure local schema-alignment layer that follows PR
#483, which dogfooded the Manual Codex Former Draft Copy Packet with the first
bounded real human-started Codex response transcript.

PR #483 found useful real model output, but strict local validation blocked it
because the returned draft used safe model-output aliases rather than the local
canonical CodexPerspectiveCandidateDraft shape.

This PR preserves that finding. It does not pretend the original transcript
already matched the schema. Instead, it adds an explicit opt-in alignment layer
before validation.

## Supported Alignments

`alignCodexPerspectiveCandidateDraftSchemaFromModelOutput` supports these known
safe aliases from the captured transcript:

- `selected_material.changed_file_paths` to `selected_material.changed_files`;
- `selected_material.plain_summary_facts` to a bounded
  `selected_material.changed_files_summary` when a canonical summary is missing;
- `selected_material.neutral_perspective_basis` to bounded qualification notes;
- `ref_type` plus `pointer_only: true` to `pointer_kind` plus
  `pointer_semantics: "pointer_only"`;
- model-friendly false authority flags to canonical false authority flags;
- false privacy inclusion aliases to the local privacy shape;
- object user/Core decision questions to question strings;
- known next-action ids to canonical local next-action ids;
- unresolved tension ids to `source_ref`.

## Still Blocked

Alignment blocks unsafe, ambiguous, malformed, or authority-claiming material:

- pointer refs that are not pointer-only;
- pointer refs missing from the former input packet;
- true model-friendly or true canonical authority flags;
- privacy inclusion flags set to true;
- unsafe raw/private/provider/token/billing/API/hidden-reasoning markers;
- missing changed files when no former input packet context can safely supply
  them;
- mismatched source former input packet refs.

## Real Transcript Result

The captured PR #483 transcript now aligns successfully. The original contract
fit remains recorded as `violates_contract`, while the aligned draft fits the
contract and validates to candidate-compatible review material.

The candidate remains:

- `non_committed`;
- `needs_review`;
- pointer-only;
- false-authority;
- draft/review-only.

Worker-Facing Guidance runs only after aligned validation produces the
candidate. Guidance remains advisory-only and keeps authority flags false.

## Follow-Up Prompt Contract Refinement

The recommended #484 follow-up is represented by:

- `docs/PERSPECTIVE_CODEX_FORMER_PROMPT_CONTRACT_CANONICAL_SCHEMA_V0_1.md`
- `reports/2026-06-09-perspective-codex-former-prompt-contract-canonical-schema.md`

After that prompt-contract refinement, the next implementation PR should be:

Dogfood refined Codex former prompt contract with a new captured transcript.

## Browser/Computer-Use Validation

Not run: this PR is pure local schema-alignment/docs/report/smoke/package work
and adds no UI, route, browser-visible surface, clipboard automation,
interactive copy control, or transcript capture.

## Authority Boundary

This PR is a pure local schema-alignment/docs/report/smoke slice. It does not
call Codex from implementation, execute Codex from Augnes, call the Codex SDK,
call OpenAI/provider/model APIs from implementation, call GitHub APIs from
implementation, use network access in implementation behavior, write DB state,
add runtime routes, add UI, add clipboard automation, create proof/evidence/
readiness records, approve, merge, publish, retry, replay, deploy, or make Core
decisions.

## Verification

- `npm run typecheck`
- `npm run dogfood:perspective-codex-former-draft-schema-alignment`
- `npm run smoke:perspective-codex-former-draft-schema-alignment`
- `npm run dogfood:perspective-codex-former-manual-copy-real-transcript`
- `npm run smoke:perspective-codex-former-manual-copy-real-transcript`
- `npm run smoke:perspective-codex-former-real-transcript-capture-instructions`
- `npm run dogfood:perspective-codex-former-manual-copy-transcript`
- `npm run smoke:perspective-codex-former-manual-copy-transcript`
- `npm run smoke:perspective-codex-former-manual-copy-packet`
- `npm run smoke:perspective-codex-former-prompt-contract`
- `npm run smoke:perspective-codex-former-pipeline`
- `npm run smoke:perspective-worker-facing-guidance`
- `npm run smoke:perspective-candidate-builder-fixture`
- `npm run smoke:perspective-codex-former-pipeline-dogfood`
- `git diff --check`
- `git diff --cached --check`

## Conclusion

PASS with follow-up.

Recommended next implementation PR title:

Refine Codex former prompt contract to emit canonical schema after alignment findings
