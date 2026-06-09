# Perspective Codex Former Manual Copy Real Transcript Dogfood v0.1

This document describes the pure local real-transcript dogfood harness that
follows merged PR #482, which prepared bounded real Codex former transcript
capture instructions.

The main fixture is labeled `real_human_started_codex_response`. It was supplied
manually with `capture_method=human_manual`, `captured_at=unknown`, and
`codex_surface_label=unknown`.

The supplied transcript includes only the returned
CodexPerspectiveCandidateDraft JSON. It does not include hidden reasoning,
browser/account material, provider logs, raw page dumps, raw PR diffs, raw review
payloads, unrelated chat text, or credential material.

## What This Adds

The harness uses the supplied real transcript as the main fixture and keeps
synthetic fixtures only as controls. It extracts exactly one candidate draft,
runs `evaluateCodexPerspectiveCandidateDraftPromptContractFit`, runs
`validateAndNormalizeCodexPerspectiveCandidateDraft`, records whether
candidate-compatible review material is produced, and attempts Worker-Facing Guidance
only when local validation produces a candidate.

This is not Codex execution, not proof/evidence/readiness, not approval, not
merge authority, and not a Core decision.

## Current Finding

The real response is useful beyond a plain summary because it identifies the
validation boundary between reviewable manual scaffolding and honest real
transcript dogfood.

The current local result is BLOCKED with useful findings. Extraction succeeds,
but local validation does not produce candidate-compatible review material
because the returned draft reveals selected material schema drift, pointer schema drift, and authority flag schema drift:

- selected material uses `plain_summary_facts`, `neutral_perspective_basis`, and
  `changed_file_paths` rather than the validator's `changed_files`,
  `changed_files_summary`, `work_id`, and `source_pr_refs` shape;
- evidence pointer refs preserve pointer-only intent but use `ref_type` and
  `pointer_only` rather than `pointer_kind` and `pointer_semantics`;
- authority flags are all false but use model-friendly names rather than the
  validator's expected false-authority keys.

The harness does not pre-normalize those differences away.

## Scenarios

`captured_real_transcript_main` uses the supplied real transcript. It extracts
one candidate draft, finds useful neutral perspective content, records
prompt-contract drift, and blocks candidate-compatible review material at strict
local validation.

`transcript_extraction_failure_control` is a synthetic negative control with no
parseable candidate draft. It must fail closed.

`bad_response_regression_control` is a synthetic bad response control with plain
summary content, malformed refs/shape, overconfident basis, and authority claims.
It must be flagged or blocked.

`downstream_guidance_from_real_transcript` runs
`buildWorkerFacingPerspectiveGuidanceFromCandidate({ candidate,
guidance_context })` only if validation produces candidate-compatible review
material. For the current real transcript, it is skipped with a concrete
validation-blocked reason and does not count as usefulness success.

## Browser/Computer-Use Validation

Not run: browser/computer-use validation not required because transcript was
manually supplied as bounded sanitized text and this PR adds no UI, route,
browser-visible surface, clipboard automation, or interactive copy control.

## Authority Boundary

This PR is a pure local real transcript dogfood/report/smoke slice. It does not
call Codex from implementation, execute Codex from Augnes, call the Codex SDK,
call OpenAI/provider/model APIs from implementation, call GitHub APIs from
implementation, use network access in implementation behavior, write DB state,
add runtime routes, add UI, add clipboard automation, create proof/evidence/
readiness records, approve, merge, publish, retry, replay, deploy, or make Core
decisions.

## Verification

- `npm run typecheck`
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

## Recommended Next Implementation PR

Refine Codex former draft schema alignment from captured transcript findings

Followed by:

- `docs/PERSPECTIVE_CODEX_FORMER_DRAFT_SCHEMA_ALIGNMENT_V0_1.md`
- `reports/2026-06-09-perspective-codex-former-draft-schema-alignment.md`

Recommended next implementation PR after alignment:

Refine Codex former prompt contract to emit canonical schema after alignment findings
