# Perspective Codex Former Refined Findings Contract

Generated at: 2026-06-10T00:00:00.000Z
Conclusion: PASS with follow-up
Recommended next implementation PR title: Dogfood refined Codex former prompt contract with a second captured transcript

## Summary

This pure local prompt-contract/evaluator/docs/report/smoke slice follows PR #486 and addresses the refined transcript findings without capturing a new transcript.
It refines thesis-boundary wording, teaches the evaluator to distinguish boundary-focused theses with PR refs from plain PR chronology, and adds explicit local unresolved_tensions.tension_kind enum guidance.
PR #484 schema alignment remains a safety net; PR #486 replay still produces candidate-compatible review material directly without requiring alignment.

## What PR #486 Found

- Old PR #483 alias drift was largely fixed.
- Direct local validation produced candidate-compatible review material without PR #484 schema alignment.
- Worker-Facing Guidance ran advisory-only on the direct candidate.
- Contract fit still returned needs_review with a plain_summary warning at draft.thesis.
- unresolved_tensions used canonical object shape but non-local tension_kind values: validation_gap, schema_drift_risk, and readiness_boundary.

## Prompt Contract Changes

- The thesis must name the validation boundary, unresolved tension, scope/risk tradeoff, remaining gap, or next smallest useful work first.
- The thesis must not merely list what PRs did or narrate PR chronology.
- PR facts must support the boundary rather than replace it.
- The thesis should contrast what is implemented with what remains unproven or needs_review.

## Contract-Fit Evaluator Changes

Boundary-positive fixture contract fit: fits_contract
Plain-summary negative fixture contract fit: needs_review
PR #486 replay contract fit: needs_review
PR #486 replay warnings: tension_kind at draft.unresolved_tensions[0].tension_kind; tension_kind at draft.unresolved_tensions[1].tension_kind; tension_kind at draft.unresolved_tensions[2].tension_kind

## Tension-Kind Enum Guidance

Allowed local tension_kind values: unresolved_gap, readiness_reason, failed_check, skipped_check_missing_reason
Discouraged values and conceptual mapping:
- validation_gap -> unresolved_gap
- schema_drift_risk -> unresolved_gap or readiness_reason, depending on context
- readiness_boundary -> readiness_reason
- missing validation/check result -> skipped_check_missing_reason when tied to skipped check with missing or weak reason
- failed validation/check -> failed_check

## Local Enum And Old Drift Controls

Local enum fixture contract fit: fits_contract
Old PR #486 drift fixture contract fit: needs_review
Old PR #486 drift warnings: tension_kind at draft.unresolved_tensions[0].tension_kind; tension_kind at draft.unresolved_tensions[1].tension_kind; tension_kind at draft.unresolved_tensions[2].tension_kind

## PR #486 Replay Result

Old alias drift: none
Semantic tension enum drift: validation_gap, schema_drift_risk, readiness_boundary
Direct validation status: needs_review
Candidate material: yes
Alignment needed for candidate material: false

## Alignment Safety Net Status

PR #484 alignment remains available as a compatibility safety net. This PR does not remove it, make it the main success path, or weaken strict validation.

## Downstream Guidance Result

Worker-Facing Guidance ran with status resolve_gaps_first; advisory-only=true; next actions=3.

## Scenarios

### Refined Prompt Contract Thesis Boundary

Scenario id: refined_prompt_contract_thesis_boundary
Fixture: updated prompt contract
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The prompt now asks the thesis to identify the validation boundary, unresolved tension, scope/risk tradeoff, remaining gap, or next smallest useful work first.
- The prompt explicitly separates PR facts from the perspective boundary.
- The prompt requests local unresolved_tensions.tension_kind enum values and discourages PR #486 drift values.

### Contract Fit Boundary Positive Fixture

Scenario id: contract_fit_boundary_positive_fixture
Fixture: synthetic canonical boundary thesis
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The thesis contains PR refs but names the validation boundary and next smallest useful work first.
- The evaluator should not warn plain_summary merely because PR numbers are present.
- Direct validation produces non_committed candidate-compatible review material.

### Contract Fit Plain Summary Negative Fixture

Scenario id: contract_fit_plain_summary_negative_fixture
Fixture: synthetic plain summary thesis
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The evaluator still catches a thesis that merely narrates PR chronology.
- Validation may still normalize draft material, but dogfood records weak thesis quality.
- No unsafe material or authority escalation is produced.

### Unresolved Tension Kind Local Enum Fixture

Scenario id: unresolved_tension_kind_local_enum_fixture
Fixture: synthetic local tension enum fixture
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The local canonical tension_kind enum is unresolved_gap, readiness_reason, failed_check, and skipped_check_missing_reason.
- The contract-fit evaluator does not warn for local enum values.
- Validation preserves or safely normalizes local tension material.

### Unresolved Tension Kind Old PR486 Drift Fixture

Scenario id: unresolved_tension_kind_old_pr486_drift_fixture
Fixture: synthetic old PR #486 tension drift fixture
Conclusion: PASS with follow-up
Blocked reasons: None

Dogfood notes:
- The old PR #486 tension_kind values remain visible as non-local semantic drift.
- The fixture is not fatal when validation can normalize safely, but the contract-fit result records follow-up.
- Historical PR #486 material is not rewritten.

### Refined Transcript Replay After Contract Update

Scenario id: refined_transcript_replay_after_contract_update
Fixture: PR #486 captured transcript replay
Conclusion: PASS with follow-up
Blocked reasons: None

Dogfood notes:
- PR #486 replay no longer warns plain_summary after the thesis heuristic refinement.
- PR #486 replay still records non-local tension_kind values as a historical drift finding.
- Direct validation still produces candidate-compatible material and alignment remains a safety net, not the main success path.
- Worker-Facing Guidance remains advisory-only.

### Unsafe Authority Privacy Regression

Scenario id: unsafe_authority_privacy_regression
Fixture: synthetic unsafe authority privacy control
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Synthetic controls cover true authority, privacy inclusion true, non-pointer evidence, source packet mismatch, and unsafe marker material.
- Public summaries omit the unsafe marker text while preserving blocked status.
- False authority flags are preserved in returned validation/alignment results.


## Evaluation Questions

- what_pr_486_found: PR #486 found old PR #483 alias drift was largely fixed, direct validation produced candidate-compatible material without schema alignment, and Worker-Facing Guidance ran advisory-only.
- what_improved_compared_with_pr_483: selected_material, evidence pointers, authority/privacy flags, questions, and next actions were emitted in canonical local shape.
- what_remained_as_refined_findings: The thesis was useful but still warned plain_summary, and unresolved_tensions used non-local values validation_gap, schema_drift_risk, and readiness_boundary.
- prompt_contract_wording_changed: The prompt now asks the thesis to name the validation boundary/unresolved tension/scope-risk/remaining gap/next smallest useful work first, not merely list PR chronology.
- evaluator_behavior_changed: Boundary-focused thesis with PR refs no longer warns plain_summary, while pure chronological PR summary still does.
- requested_tension_kind_values: unresolved_gap, readiness_reason, failed_check, skipped_check_missing_reason
- discouraged_tension_kind_values: validation_gap -> unresolved_gap; schema_drift_risk -> unresolved_gap or readiness_reason; readiness_boundary -> readiness_reason.
- pr_486_replay_result: PR #486 replay improved: no plain_summary warning and direct validation still succeeds, while historical non-local tension_kind drift remains recorded.
- was_new_real_transcript_captured: No. This PR refines local contract/evaluator/docs/report/smoke behavior only.
- browser_computer_use_validation: Not run: this PR is pure local prompt-contract/evaluator/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, interactive copy control, or transcript capture.
- what_should_happen_next: Dogfood refined Codex former prompt contract with a second captured transcript
- alignment_safety_net_status: PR #484 alignment remains available as a safety net; PR #486 replay still succeeds directly without requiring alignment.
- downstream_guidance_result: Worker-Facing Guidance ran on PR #486 replay material and remained advisory-only.
- local_enum_fixture_result: Local tension_kind enum fixture fits contract without tension_kind warnings.
- old_drift_fixture_result: Old PR #486 drift values remain visible as needs_review semantic drift.

## Browser/Computer-Use Validation

Not run: this PR is pure local prompt-contract/evaluator/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, interactive copy control, or transcript capture.

## Authority Boundary

This PR is a pure local prompt-contract/evaluator/docs/report/smoke slice. It does not capture a new transcript, call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.

## Verification

- npm run typecheck
- npm run dogfood:perspective-codex-former-refined-findings-contract
- npm run smoke:perspective-codex-former-refined-findings-contract
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

## Skipped Checks With Concrete Reasons

- Browser/computer-use validation: Not run: this PR is pure local prompt-contract/evaluator/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, interactive copy control, or transcript capture.
- Second real transcript capture: skipped because this PR intentionally refines the local contract/evaluator before asking for another human-started transcript.
- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.
- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs.

## What Codex Did Not Do

Codex did not capture a new transcript, fabricate a transcript, call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.

## Recommended Next Implementation PR Title

Dogfood refined Codex former prompt contract with a second captured transcript
