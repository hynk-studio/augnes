# Perspective Codex Former Draft Schema Alignment

Generated at: 2026-06-10T00:00:00.000Z
Conclusion: PASS with follow-up
Recommended next implementation PR title: Refine Codex former prompt contract to emit canonical schema after alignment findings

## Summary

This pure local dogfood/report/smoke slice follows PR #483 and adds an explicit schema-alignment layer for known safe CodexPerspectiveCandidateDraft model-output aliases.
It preserves the original #483 finding, then deliberately aligns known aliases before local validation.
The captured real transcript now produces candidate-compatible review material after alignment, remains non_committed, keeps basis quality at needs_review, and feeds advisory-only Worker-Facing Guidance.

## Captured Transcript Findings Addressed

- selected_material.changed_files was missing because the real output used changed_file_paths.
- pointer refs preserved pointer-only intent but used ref_type and pointer_only aliases.
- authority intent was false but used model-friendly flag names.
- privacy intent used false inclusion aliases.

## Schema Mappings Added

- authority_model_friendly_false_flags
- next_action_id_to_action_id
- pointer_ref_type_pointer_only
- privacy_false_alias_flags
- selected_material_changed_file_paths
- selected_material_neutral_perspective_basis_to_qualification_notes
- selected_material_plain_summary_facts
- selected_material_work_id_from_source_context
- unresolved_tension_id_source_ref
- user_core_decision_question_object_question

## Remaining Blocked Fields

- pointer_only false or raw/non-pointer semantics
- pointer refs not present in the former input packet
- true model-friendly or canonical authority flags
- privacy inclusion true values
- unsafe raw/private/provider/token/billing/API/hidden-reasoning markers
- missing changed files when no former input packet context can safely supply them

## Alignment Result

Captured real transcript alignment status: aligned
Original contract fit: violates_contract
Aligned contract fit: fits_contract

## Local Validation Result

Validation status: needs_review
Candidate material produced: yes
Candidate authority: non_committed
Basis quality: needs_review

## Downstream Guidance Result

Worker-Facing Guidance ran with status resolve_gaps_first; advisory-only=true; next actions=3.

## Why This Remains Draft/Review-Only

Aligned material is local candidate-compatible review material only. It remains non_committed and does not create accepted state, persistence, proof, evidence, readiness, approval, merge authority, GitHub mutation, Codex execution, provider/model/API behavior, or a Core decision.

## Scenarios

### Captured Real Transcript Schema Alignment

Scenario id: captured_real_transcript_schema_alignment
Fixture: real_human_started_codex_response
Conclusion: PASS with follow-up
Alignment status: aligned
Applied mappings: authority_model_friendly_false_flags, next_action_id_to_action_id, pointer_ref_type_pointer_only, privacy_false_alias_flags, selected_material_changed_file_paths, selected_material_neutral_perspective_basis_to_qualification_notes, selected_material_plain_summary_facts, selected_material_work_id_from_source_context, unresolved_tension_id_source_ref, user_core_decision_question_object_question
Validation status: needs_review
Candidate material: present
Worker guidance: none
Blocked reasons: None

Dogfood notes:
- The original #483 drift remains visible in original_contract_fit.
- Alignment explicitly maps selected material, pointer aliases, privacy aliases, and model-friendly false authority flags.
- Aligned validation produces candidate-compatible review material that remains non_committed and needs_review.

### Pointer Alias Alignment Fixture

Scenario id: pointer_alias_alignment_fixture
Fixture: synthetic pointer alias control
Conclusion: PASS
Alignment status: aligned
Applied mappings: pointer_ref_type_pointer_only, privacy_false_alias_flags
Validation status: not evaluated
Candidate material: none
Worker guidance: none
Blocked reasons: None

Dogfood notes:
- ref_type plus pointer_only true maps to pointer_kind plus pointer_semantics pointer_only.
- pointer_only false blocks.

### Authority Alias Alignment Fixture

Scenario id: authority_alias_alignment_fixture
Fixture: synthetic authority alias control
Conclusion: PASS
Alignment status: aligned
Applied mappings: authority_model_friendly_false_flags, privacy_false_alias_flags
Validation status: not evaluated
Candidate material: none
Worker guidance: none
Blocked reasons: None

Dogfood notes:
- Model-friendly false authority flags map to canonical false authority flags.
- True model-friendly and true canonical authority flags block.

### Selected Material Alias Alignment Fixture

Scenario id: selected_material_alias_alignment_fixture
Fixture: synthetic selected material alias control
Conclusion: PASS
Alignment status: aligned
Applied mappings: privacy_false_alias_flags, selected_material_changed_file_paths, selected_material_neutral_perspective_basis_to_qualification_notes, selected_material_plain_summary_facts, selected_material_work_id_from_source_context
Validation status: not evaluated
Candidate material: none
Worker guidance: none
Blocked reasons: None

Dogfood notes:
- changed_file_paths maps to changed_files.
- plain_summary_facts maps to a bounded changed_files_summary.
- neutral_perspective_basis is preserved as qualification notes.
- Ambiguous missing changed files block when no source context default exists.

### Unsafe Or Private Material Regression

Scenario id: unsafe_or_private_material_regression
Fixture: synthetic unsafe/privacy controls
Conclusion: PASS
Alignment status: blocked
Applied mappings: privacy_false_alias_flags, selected_material_changed_file_paths, selected_material_changed_files_summary_from_source_context, selected_material_work_id_from_source_context
Validation status: not evaluated
Candidate material: none
Worker guidance: none
Blocked reasons: None

Dogfood notes:
- Unsafe markers block alignment and are not copied into aligned draft material.
- Privacy inclusion true values block alignment.

### Downstream Guidance After Alignment

Scenario id: downstream_guidance_after_alignment
Fixture: aligned real transcript candidate guidance
Conclusion: PASS
Alignment status: aligned
Applied mappings: authority_model_friendly_false_flags, next_action_id_to_action_id, pointer_ref_type_pointer_only, privacy_false_alias_flags, selected_material_changed_file_paths, selected_material_neutral_perspective_basis_to_qualification_notes, selected_material_plain_summary_facts, selected_material_work_id_from_source_context, unresolved_tension_id_source_ref, user_core_decision_question_object_question
Validation status: needs_review
Candidate material: present
Worker guidance: present
Blocked reasons: None

Dogfood notes:
- Worker-Facing Guidance ran with { candidate, guidance_context }.
- Guidance remains advisory-only with false authority flags and visible next actions.


## Evaluation Questions

- what_pr_483_found: PR #483 found a useful real Codex former draft that extracted cleanly but blocked strict validation on schema drift.
- schema_drifts_observed: selected_material aliases, pointer ref_type/pointer_only aliases, model-friendly false authority flag names, privacy false alias names, object user questions, and non-canonical next action ids.
- aliases_now_supported: authority_model_friendly_false_flags, next_action_id_to_action_id, pointer_ref_type_pointer_only, privacy_false_alias_flags, selected_material_changed_file_paths, selected_material_neutral_perspective_basis_to_qualification_notes, selected_material_plain_summary_facts, selected_material_work_id_from_source_context, unresolved_tension_id_source_ref, user_core_decision_question_object_question
- aliases_still_blocked: pointer_only false, non-pointer-only semantics, unknown pointer refs, true model-friendly authority flags, true canonical authority flags, privacy inclusion true values, unsafe markers, missing source packet refs, and missing changed files without source context.
- aligned_validation_result: needs_review
- candidate_material_produced: Yes. Candidate-compatible review material was produced and remains non_committed.
- downstream_guidance_result: Worker-Facing Guidance ran and remained advisory-only.
- why_draft_review_only: Alignment and validation return local review material only and do not create accepted state.
- next_refinement: Refine Codex former prompt contract to emit canonical schema after alignment findings

## Browser/Computer-Use Validation

Not run: this PR is pure local schema-alignment/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, interactive copy control, or transcript capture.

## Authority Boundary

This PR is a pure local schema-alignment/docs/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.

## Verification

- npm run typecheck
- npm run dogfood:perspective-codex-former-draft-schema-alignment
- npm run smoke:perspective-codex-former-draft-schema-alignment
- npm run dogfood:perspective-codex-former-manual-copy-real-transcript
- npm run smoke:perspective-codex-former-manual-copy-real-transcript
- npm run smoke:perspective-codex-former-real-transcript-capture-instructions
- npm run dogfood:perspective-codex-former-manual-copy-transcript
- npm run smoke:perspective-codex-former-manual-copy-transcript
- npm run smoke:perspective-codex-former-manual-copy-packet
- npm run smoke:perspective-codex-former-prompt-contract
- npm run smoke:perspective-codex-former-pipeline
- npm run smoke:perspective-worker-facing-guidance
- npm run smoke:perspective-candidate-builder-fixture
- npm run smoke:perspective-codex-former-pipeline-dogfood
- git diff --check
- git diff --cached --check

## Skipped Checks With Concrete Reasons

- Browser/computer-use validation: Not run: this PR is pure local schema-alignment/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, interactive copy control, or transcript capture.
- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.
- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs.

## What Codex Did Not Do

Codex did not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.

## What Should Be Refined Next

Refine Codex former prompt contract to emit canonical schema after alignment findings
