# Perspective Codex Former Refined Prompt Real Transcript Dogfood

Generated at: 2026-06-10T00:00:00.000Z
Conclusion: PASS with follow-up
Recommended next implementation PR title: Refine Codex former prompt contract from refined transcript findings

## Summary

This pure local dogfood/report/smoke slice follows merged PR #485 and uses one supplied bounded real human-started Codex response transcript captured with the refined canonical-schema manual copy packet.
The transcript avoids the old PR #483 alias fields and direct local validation produces candidate-compatible review material without schema alignment.
The result still stays review-only and needs_review; remaining findings are semantic contract-fit/tension-kind refinement, not proof, evidence, readiness, or accepted Augnes state.

## Real Transcript Provenance

- fixture_source: real_human_started_codex_response
- capture_method: human_manual
- codex_surface_label: Codex
- captured_at: unknown
- source_manual_copy_packet_id: manual-codex-former-copy:v0.1:1h8nabl
- source_former_input_packet_id: codex-perspective-former-input:v0.1:project-augnes-ag-refined-codex-former-canonical:odnwc7
- source_prompt_hash: cc5e44414a9e2942c57cad1ded854194d0a3f4f45be199509ca8600230b185d5
- prompt_was_generated_by_manual_copy_packet: true

## Redaction And Privacy

- Included only the returned CodexPerspectiveCandidateDraft JSON.
- No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets are included.
- Browser/computer-use validation was not run because no UI, route, browser-visible surface, clipboard automation, or interactive copy control was added.

## Alias Drift Comparison Against PR #483

Old alias fields absent: true
Old alias drift found: none
Semantic tension enum drift: validation_gap, schema_drift_risk, readiness_boundary

## Direct Contract-Fit Result

Contract fit status: needs_review
Contract fit warnings: plain_summary at draft.thesis

## Direct Local Validation Result

Validation status: needs_review
Candidate-compatible material: yes
Candidate authority: non_committed
Basis quality: needs_review
Alignment required for candidate material: false

## Alignment Safety-Net Result

Alignment status: aligned
Alignment needed for candidate material: false
Applied mappings: privacy_false_alias_flags
Aligned validation status: needs_review

## Downstream Guidance Result

Worker-Facing Guidance ran on the direct candidate with status resolve_gaps_first; advisory-only=true; next actions=3.

## Evaluation Conclusion

PASS with follow-up

## Files Changed

- scripts/dogfood-perspective-codex-former-refined-prompt-real-transcript.mjs
- scripts/smoke-perspective-codex-former-refined-prompt-real-transcript.mjs
- docs/PERSPECTIVE_CODEX_FORMER_REFINED_PROMPT_REAL_TRANSCRIPT_DOGFOOD_V0_1.md
- reports/dogfood/2026-06-09-perspective-codex-former-refined-prompt-real-transcript.md
- package.json
- neighboring Perspective smoke changed-file allowlists only, so the requested strict validation bundle recognizes this follow-up slice

## Scenarios

### Refined Prompt Real Transcript Main

Scenario id: refined_prompt_real_transcript_main
Fixture: real_human_started_codex_response
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The fixture is labeled real_human_started_codex_response and is preserved as bounded sanitized material.
- The captured response is from the refined post-PR #485 canonical-schema manual copy packet.
- Exactly one returned CodexPerspectiveCandidateDraft JSON object is present.
- No page, browser, account, provider, raw PR diff, raw review payload, unrelated chat text, credential, or extra transcript material is included.

### Canonical No Alignment Path

Scenario id: canonical_no_alignment_path
Fixture: direct canonical real transcript validation
Conclusion: PASS with follow-up
Blocked reasons: None

Dogfood notes:
- This scenario runs evaluateCodexPerspectiveCandidateDraftPromptContractFit and validateAndNormalizeCodexPerspectiveCandidateDraft directly.
- No schema alignment is applied before direct local validation.
- Direct validation produced candidate-compatible review material without PR #484 alignment.
- Direct contract fit result: needs_review.

### Alignment Safety Net Path

Scenario id: alignment_safety_net_path
Fixture: PR #484 alignment safety net
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Direct validation already produced candidate-compatible review material, so alignment is not required for this transcript.
- Alignment applied mappings: privacy_false_alias_flags.
- Alignment success is reported separately and is not counted as direct canonical success.

### Alias Drift Detection

Scenario id: alias_drift_detection
Fixture: real transcript alias drift scan
Conclusion: PASS with follow-up
Blocked reasons: None

Dogfood notes:
- The supplied transcript avoids the old PR #483 alias field names.
- The transcript uses canonical tension shape but non-local tension_kind values, which is a semantic enum refinement finding.

### Transcript Extraction Failure Control

Scenario id: transcript_extraction_failure_control
Fixture: synthetic negative control
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Synthetic control with no parseable candidate draft fails closed.
- The control is labeled synthetic and produces no candidate material.

### Bad Response Regression Control

Scenario id: bad_response_regression_control
Fixture: synthetic bad response control
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Synthetic control includes malformed pointer semantics, raw-payload inclusion, and true authority.
- Contract fit, direct validation, and alignment block the control without producing candidate-compatible material.

### Downstream Guidance From Refined Transcript

Scenario id: downstream_guidance_from_refined_transcript
Fixture: direct real transcript candidate guidance
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Worker-Facing Guidance ran on the direct validation candidate and remained advisory-only.
- Guidance uses { candidate, guidance_context } and does not create accepted state.


## Evaluation Questions

- was_new_captured_transcript_supplied_after_pr_485: Yes. One bounded real human-started Codex response transcript was supplied after PR #485.
- did_it_come_from_refined_manual_copy_packet: Yes. manual copy packet manual-codex-former-copy:v0.1:1h8nabl; former input packet codex-perspective-former-input:v0.1:project-augnes-ag-refined-codex-former-canonical:odnwc7; prompt hash cc5e44414a9e2942c57cad1ded854194d0a3f4f45be199509ca8600230b185d5.
- was_browser_computer_use_used: No. Browser/computer-use validation was not run; this PR adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.
- what_was_redacted: Only the returned CodexPerspectiveCandidateDraft JSON is included; hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, and secrets are not included.
- did_it_emit_canonical_selected_material: Yes. It emits changed_files, changed_files_summary, work_id, and source_pr_refs directly.
- did_it_avoid_old_alias_fields_from_pr_483: Yes. The old alias fields checked from PR #483 are absent.
- did_it_emit_canonical_evidence_pointer_refs: Yes. Evidence refs use pointer_kind, pointer_semantics, and ref.
- did_it_emit_canonical_authority_and_privacy_flags: Yes. Authority and privacy flags use canonical local fields.
- did_it_emit_string_questions_and_action_summary_shape: Yes. Questions are strings and next actions use action_id/summary.
- did_unresolved_tensions_pass_or_reveal_enum_drift: Direct local validation produced material, but tension_kind values reveal semantic enum drift: validation_gap, schema_drift_risk, readiness_boundary.
- did_contract_fit_return_fits_contract: No. It returned needs_review.
- did_direct_local_validation_produce_candidate_material: Yes. Status needs_review; candidate authority non_committed; basis needs_review.
- did_it_require_pr_484_alignment: No. Direct validation produced candidate-compatible review material without schema alignment.
- if_alignment_was_used_what_mappings_applied: privacy_false_alias_flags
- did_downstream_worker_guidance_run: Yes. Worker-Facing Guidance ran on the direct candidate and remained advisory-only.
- did_result_show_alias_drift_reduction: Yes. Compared with PR #483, the checked old alias fields are absent; remaining follow-up is semantic contract refinement rather than the old alias shape.
- what_remains_to_refine_next: Refine Codex former prompt contract from refined transcript findings

## Browser/Computer-Use Validation

Not run: browser/computer-use validation not required because transcript was manually supplied as bounded sanitized text and this PR adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.

## Authority Boundary

This PR is a pure local refined real transcript dogfood/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.

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

## Skipped Checks With Concrete Reasons

- Browser/computer-use validation: Not run: browser/computer-use validation not required because transcript was manually supplied as bounded sanitized text and this PR adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.
- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.
- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs.
- GitHub implementation behavior: skipped because implementation code has no GitHub API/network path.

## What Codex Did Not Do

Codex did not fabricate a transcript, replace the transcript with a synthetic fixture, call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.

## Recommended Next Implementation PR Title

Refine Codex former prompt contract from refined transcript findings
