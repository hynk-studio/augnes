# Perspective Codex Former Refined Prompt Real Transcript Dogfood v0.1

## Summary

This follow-up to PR #485 dogfoods one bounded real human-started Codex
response transcript captured with the refined canonical-schema Manual Copy
Packet.

The transcript is preserved as sanitized returned JSON only. It is not replaced
with a synthetic fixture, and synthetic material is used only for negative
controls.

Conclusion: PASS with follow-up.

## What Changed From PR #483

The new transcript avoids the old alias fields found in the first real
transcript:

- changed_file_paths
- plain_summary_facts
- neutral_perspective_basis inside selected_material
- ref_type
- boolean pointer_only
- model-friendly authority aliases
- privacy inclusion aliases
- object user/Core questions
- id/why_next next-action aliases
- id/why_it_matters unresolved-tension aliases

Direct validation now produces candidate-compatible review material without schema alignment.
The candidate remains non_committed and needs_review.

## Remaining Findings

Contract fit still returns needs_review because the local evaluator wants a
clearer neutral-perspective marker in the thesis.

The transcript uses canonical unresolved_tensions shape, but its tension_kind
values are validation_gap, schema_drift_risk, and readiness_boundary. Local
validation normalizes those to readiness_reason, so this is a semantic
prompt-contract refinement finding rather than old alias drift.

The PR #484 alignment safety net remains in place. For this transcript it is not
needed to produce candidate-compatible review material; it is reported
separately and not counted as direct canonical success.

## Provenance

- capture_method: human_manual
- codex_surface_label: Codex
- captured_at: unknown
- source_manual_copy_packet_id: manual-codex-former-copy:v0.1:1h8nabl
- source_former_input_packet_id: codex-perspective-former-input:v0.1:project-augnes-ag-refined-codex-former-canonical:odnwc7
- source_prompt_hash: cc5e44414a9e2942c57cad1ded854194d0a3f4f45be199509ca8600230b185d5
- prompt_was_generated_by_manual_copy_packet: true

## Browser/Computer-Use Validation

Browser/computer-use validation was not run because the transcript was manually
supplied as bounded sanitized text and this PR adds no UI, route,
browser-visible surface, clipboard automation, or interactive copy control.

## Authority Boundary

This PR is a pure local refined real transcript dogfood/report/smoke slice. It
does not call Codex from implementation, execute Codex from Augnes, call the
Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs
from implementation, use network access in implementation behavior, write DB
state, add runtime routes, add UI, add clipboard automation, create
proof/evidence/readiness records, approve, merge, publish, retry, replay,
deploy, or make Core decisions.

## Verification

- npm run typecheck
- npm run dogfood:perspective-codex-former-refined-prompt-real-transcript
- npm run smoke:perspective-codex-former-refined-prompt-real-transcript
- npm run smoke:perspective-codex-former-prompt-contract
- npm run smoke:perspective-codex-former-manual-copy-packet
- npm run dogfood:perspective-codex-former-prompt-contract-canonical-schema
- npm run smoke:perspective-codex-former-prompt-contract-canonical-schema
- npm run dogfood:perspective-codex-former-draft-schema-alignment
- npm run smoke:perspective-codex-former-draft-schema-alignment
- npm run dogfood:perspective-codex-former-manual-copy-real-transcript
- npm run smoke:perspective-codex-former-manual-copy-real-transcript
- npm run smoke:perspective-codex-former-real-transcript-capture-instructions
- npm run dogfood:perspective-codex-former-manual-copy-transcript
- npm run smoke:perspective-codex-former-manual-copy-transcript
- npm run smoke:perspective-codex-former-pipeline
- npm run smoke:perspective-worker-facing-guidance
- npm run smoke:perspective-candidate-builder-fixture
- npm run smoke:perspective-codex-former-pipeline-dogfood
- git diff --check
- git diff --cached --check

## Follow-Up

Refine Codex former prompt contract from refined transcript findings.
