# Perspective Codex Former Separate-Session Capture Packet Prep

Generated at: 2026-06-10T00:00:00.000Z
Conclusion: BLOCKED / WAITING_FOR_TRANSCRIPT
Recommended next implementation PR title: Capture separate-session provenance-clean Codex former transcript

## Summary

No real separate-session transcript envelope was supplied, and this artifact does not claim separate-session confirmation. It prepares a fresh post-PR #490 Manual Codex Former Draft Copy Packet plus the exact return envelope needed for a future separate user-started Codex session.

## Why This Follows PR #490

PR #490 proved the provenance-clean same-session fallback and explicitly left separate-session confirmation as the remaining follow-up.

## Whether Real Separate-Session Transcript Was Supplied

No real separate-session transcript envelope was supplied. The current artifact is a prep packet and return envelope only.
Transcript available: false

## Capture Method And Provenance

Not captured yet. The prepared return template requires capture_method: human_manual, prompt_was_generated_by_manual_copy_packet: true, source_manual_copy_packet_id, source_former_input_packet_id, and source_prompt_hash.
capture_method template: human_manual
codex_surface_label template: separate user-started Codex session
prompt_was_generated_by_manual_copy_packet template: true
source_manual_copy_packet_id: manual-codex-former-copy:v0.1:okr3cu
source_former_input_packet_id: codex-perspective-former-input:v0.1:project-augnes-ag-separate-session-provenance-cl:3elrni
source_prompt_hash: 3jveop

## Generated Packet Metadata

Manual copy packet id: manual-codex-former-copy:v0.1:okr3cu
Former input packet id: codex-perspective-former-input:v0.1:project-augnes-ag-separate-session-provenance-cl:3elrni
Prompt hash: 3jveop
Copy status: needs_review
Copy status reasons: source readiness is needs_review; skipped checks require human review; unresolved gaps require human review
Manual copy packet id fresh: true
Former input packet id fresh: true
Prompt hash fresh: true
Stable contract label present: true
Stale PR #479 prompt wording present: false
Capture return envelope matches packet: true

## Contract-Fit Result

Not run because no real separate-session CodexPerspectiveCandidateDraft transcript was supplied.
Result: not_run_no_transcript

## Direct Validation Result

Not run because no real separate-session CodexPerspectiveCandidateDraft transcript was supplied.
Result: not_run_no_transcript

## Alignment Safety-Net Result

Not run because there is no transcript to align; keep alignment as a future safety-net comparison only.
Result: not_run_no_transcript

## Downstream Guidance Result

Not run because direct candidate validation has not produced candidate-compatible review material.
Result: not_run_no_transcript

## Stale Wording Regression Result

Generated prompt avoids stale PR #479 prompt wording and includes the post-capture stale-state guard.
Pre-capture gap guidance present: true
Post-capture stale-state guard present: true

## Evaluation Conclusion

BLOCKED / WAITING_FOR_TRANSCRIPT because no real separate-session transcript envelope was supplied.

## Files Changed

- scripts/dogfood-perspective-codex-former-separate-session-capture-packet-prep.mjs
- scripts/smoke-perspective-codex-former-separate-session-capture-packet-prep.mjs
- docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_CAPTURE_PACKET_PREP_V0_1.md
- reports/2026-06-10-perspective-codex-former-separate-session-capture-packet-prep.md
- package.json
- scripts/smoke-perspective-codex-former-manual-copy-packet.mjs
- scripts/smoke-perspective-codex-former-provenance-clean-transcript-capture.mjs
- scripts/smoke-perspective-codex-former-provenance-stale-wording.mjs

## Copyable Prompt For Separate User-Started Codex Session

```text
Manual Codex Former Draft Copy Packet

Human review required before pasting. Paste this only into a user-started Codex session.
This packet does not call Codex, does not execute Codex, does not call SDKs or provider/model APIs, and does not mutate GitHub.
Do not use this prompt to approve, merge, publish, retry, replay, deploy, write state, or make Core decisions.

Reviewer: separate-session manual reviewer
Intended Codex surface: separate user-started Codex session

Use the current Codex former draft prompt contract below.
Prompt contract: CodexPerspectiveFormerDraftPromptContract v0.1
Contract version: codex_perspective_former_draft_prompt_contract.v0.1
This contract includes the latest local canonical-schema, thesis-boundary, and tension-kind guidance.

Role: codex_perspective_former

Task: Produce one CodexPerspectiveCandidateDraft JSON object from the bounded former input packet below.
The draft must form a neutral perspective, not a plain PR summary.
The output is draft/review material only and creates no Augnes state.

Former input packet ref:
- packet_version: codex_perspective_former_input_packet.v0.1
- packet_id: codex-perspective-former-input:v0.1:project-augnes-ag-separate-session-provenance-cl:3elrni
- role: codex_perspective_former

Allowed input material:
- source PR refs
- bounded changed-file summaries and changed-file paths
- validation command summaries and skipped-check reasons
- unresolved gap summaries
- authority boundary summaries
- privacy and redaction summaries
- pointer-only refs listed in the former input packet

Bounded packet summary:
- scope: project:augnes
- work_id: AG-separate-session-provenance-clean-codex-former-capture-packet-prep
- source_pr_refs: pr:hynk-studio/augnes#490, pr:hynk-studio/augnes#489, pr:hynk-studio/augnes#488, pr:hynk-studio/augnes#487, pr:hynk-studio/augnes#486, pr:hynk-studio/augnes#485, pr:hynk-studio/augnes#484, pr:hynk-studio/augnes#483
- changed_files_summary: Follow-up to PR #490 that prepares a fresh Manual Codex Former Draft Copy Packet and return envelope for a future separate user-started Codex session. No real separate-session transcript envelope was supplied, so this slice remains blocked on transcript return.
- changed_files: scripts/dogfood-perspective-codex-former-separate-session-capture-packet-prep.mjs, scripts/smoke-perspective-codex-former-separate-session-capture-packet-prep.mjs, docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_CAPTURE_PACKET_PREP_V0_1.md, reports/2026-06-10-perspective-codex-former-separate-session-capture-packet-prep.md, package.json, scripts/smoke-perspective-codex-former-manual-copy-packet.mjs, scripts/smoke-perspective-codex-former-provenance-clean-transcript-capture.mjs, scripts/smoke-perspective-codex-former-provenance-stale-wording.mjs
- readiness: needs_review
- readiness_reasons: unresolved gaps present
- checks_run: check:pr-490-provenance-clean-same-session-fallback (passed): PR #490 proved same-session provenance-clean capture and left separate-session confirmation as follow-up.
- skipped_checks: check:real-separate-session-transcript-envelope: No real separate-session transcript envelope was supplied in the task prompt or found in local fixtures.; check:browser-computer-use-validation: Not run: this PR is pure local separate-session transcript capture prep docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.
- unresolved_gaps: gap:waiting-for-real-separate-session-transcript: A real separate-session transcript envelope must be returned before contract fit, direct validation, alignment comparison, and downstream guidance can confirm the flow.
- pointer_refs: work_event_ref|pointer_only|work:event:generate-post-pr-490-separate-session-manual-copy-packet; work_event_ref|pointer_only|work:event:prepare-separate-session-capture-return-envelope; perspective_ref|pointer_only|perspective:codex-former-provenance-clean-transcript-capture:v0.1; perspective_ref|pointer_only|perspective:codex-former-provenance-stale-wording:v0.1
- unsafe_input_material_omitted: no
- omitted_unsafe_field_count: 0

Output contract:
- Return JSON only.
- draft_version must be codex_perspective_candidate_draft.v0.1.
- draft_kind must be codex_perspective_candidate_draft.
- Required fields:
- draft_version
- draft_kind
- source_former_input_packet
- thesis
- selected_material
- evidence_pointer_refs
- unresolved_tensions
- basis_quality_suggestion
- next_action_candidates
- user_core_decision_questions
- qualification_notes
- privacy_flags
- authority_flags
- forbidden_actions
- source_former_input_packet must match the former input packet ref above.
- evidence_pointer_refs must use only pointer-only refs from the bounded packet summary.
- thesis must explain the useful neutral perspective beyond a plain PR summary.
- qualification_notes must preserve uncertainty, skipped checks, or why the perspective is or is not useful beyond summary.
- basis_quality_suggestion.status must be one of sufficient_for_review, needs_review, or blocked.

Canonical schema only:
- selected_material must be exactly { changed_files: string[], changed_files_summary: string|null, work_id: string|null, source_pr_refs: string[] }.
- Do not emit selected_material aliases changed_file_paths, plain_summary_facts, or neutral_perspective_basis.
- Fold plain summary facts into selected_material.changed_files_summary.
- Put neutral perspective basis in thesis or qualification_notes.
- evidence_pointer_refs entries must be exactly { pointer_kind, pointer_semantics: "pointer_only", ref }.
- Do not emit evidence pointer aliases ref_type or pointer_only.
- Each evidence pointer ref must match one former input packet pointer ref.
- authority_flags must use only committed_state, persistence, provider_model_api_calls, proof_evidence_readiness_writes, codex_execution, github_mutation, merge_publish_approval, and core_decision, with every value false.
- Do not emit model-friendly authority aliases creates_augnes_state, creates_proof, creates_evidence, creates_readiness_record, approves, merges, publishes, retries, replays, deploys, mutates_github, executes_codex, calls_codex_sdk, calls_provider_model_api, or makes_core_decision.
- privacy_flags must use only raw_payloads_included: false, unsafe_input_material_omitted: boolean, and omitted_unsafe_fields: string[].
- Do not emit privacy inclusion aliases raw_diffs_included, raw_review_material_included, raw_source_material_included, private_material_included, provider_material_included, token_material_included, billing_material_included, api_credentials_included, or hidden[_]reasoning_included.
- user_core_decision_questions must be string[]. Do not emit objects for user/Core questions.
- next_action_candidates entries must be exactly { action_id, summary } using local action ids review_candidate, fix_input_gaps, or prepare_codex_handoff.
- Do not emit next-action aliases id or why_next.
- unresolved_tensions entries must be exactly { tension_kind, summary, source_ref? }.
- unresolved_tensions[].tension_kind must be one of unresolved_gap, readiness_reason, failed_check, or skipped_check_missing_reason.
- Do not emit non-local tension_kind values validation_gap, schema_drift_risk, or readiness_boundary.
- Map validation_gap to unresolved_gap.
- Map schema_drift_risk to unresolved_gap or readiness_reason, depending on whether the risk is an input gap or a review qualification.
- Map readiness_boundary to readiness_reason.
- Use skipped_check_missing_reason when a missing validation or weak check result is tied to a skipped check with a missing or weak reason.
- Use failed_check when a validation or check result failed.
- Do not emit unresolved tension aliases id or why_it_matters.

Neutral perspective requirements:
- Form a neutral perspective, not a plain PR summary.
- The thesis must name the validation boundary, unresolved tension, scope/risk tradeoff, remaining gap, or next smallest useful work first.
- The thesis must not merely list what PRs did or narrate PR chronology.
- If the thesis includes PR facts, those facts must support the boundary rather than replace it.
- The thesis should explicitly contrast what is implemented with what remains unproven or needs_review when gaps remain.
- Use wording such as "The useful neutral perspective is..." only if it immediately identifies a boundary, risk, unresolved tension, or next useful work.
- State why the perspective is useful beyond a plain summary in the thesis or qualification notes.
- Separate plain summary facts from neutral perspective, validation gaps, next actions, and user/Core decision questions.
- Preserve uncertainty; do not make ready claims when the packet only supports needs-review or blocked material.

Basis quality rules:
- Use sufficient_for_review only when packet material has concrete validation summaries and no unresolved gaps.
- Use needs_review when skipped checks, unresolved gaps, weak verification, or qualification notes remain.
- Use blocked when the packet is blocked or a safe draft cannot be produced from bounded material.
- Do not claim checks passed unless the former input packet provides check summaries.
- Give concrete reasons for the basis_quality_suggestion status.

Privacy rules:
- Use only bounded summaries and pointer refs from the packet.
- Use privacy_flags only as { raw_payloads_included: false, unsafe_input_material_omitted: boolean, omitted_unsafe_fields: string[] }.
- Do not invent raw diffs, raw review data, raw source data, hidden reasoning, private material, provider material, token material, billing material, credentials, or sensitive values.
- Preserve pointer-only semantics for evidence_pointer_refs.
- If unsafe input was omitted, mention omission only as a qualification without reconstructing the omitted content.

Authority rules:
- Output is draft/review material only.
- Do not create proof, evidence, or readiness records.
- Do not approve, merge, publish, retry, replay, deploy, or mutate GitHub.
- Do not execute Codex, call the Codex SDK, or call provider/model/API services.
- Do not make Core decisions.
- Set every authority flag to false.

Insufficient input rules:
- If the packet is insufficient, produce needs_review or blocked draft material with visible reasons.
- If a neutral perspective beyond summary cannot be produced, say so in qualification_notes and set basis_quality_suggestion accordingly.
- Prefer a narrow next-action candidate that resolves input gaps or refines the prompt contract.

Manual response requirements:
- Return JSON only.
- Return exactly one CodexPerspectiveCandidateDraft object.
- Use draft_version codex_perspective_candidate_draft.v0.1.
- Use draft_kind codex_perspective_candidate_draft.
- Use only pointer-only refs from the former input packet.
- Form a neutral perspective beyond a plain summary.
- If the packet is insufficient, return needs_review or blocked draft material with visible reasons.
- The former input packet may mention that a transcript is missing because it was generated before this capture. Do not repeat that as current state after this response exists.
- Treat this response as the captured draft output to be locally validated.
- Use needs_review because local validation has not yet run, not because this response does not exist.
- It is okay to say future validation is still needed.
- It is not okay to phrase the current returned transcript as still absent.
- Do not include raw diffs, raw review material, raw source material, private material, provider material, token material, billing material, API credentials, hidden reasoning, or generated raw model material.
- Do not claim proof, evidence, readiness, approval, merge, GitHub mutation, Codex execution, provider/model execution, or Core-decision authority.
- Set all authority flags false.

After response:
- A human must paste the returned JSON into Augnes local validation.
- Run validateAndNormalizeCodexPerspectiveCandidateDraft with the same former input packet.
- The returned draft is not accepted state before validation.
- The user decides whether to continue after validation.
```

## Capture Return Envelope To Paste Back

```text
REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET

capture_method: human_manual
codex_surface_label: separate user-started Codex session
prompt_was_generated_by_manual_copy_packet: true
source_manual_copy_packet_id: manual-codex-former-copy:v0.1:okr3cu
source_former_input_packet_id: codex-perspective-former-input:v0.1:project-augnes-ag-separate-session-provenance-cl:3elrni
source_prompt_hash: 3jveop
captured_at: <timestamp or unknown>

TRANSCRIPT_REDACTION_NOTES:
- Included only returned CodexPerspectiveCandidateDraft JSON or bounded response text.
- No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets included.

RETURNED_CODEX_RESPONSE:
<returned JSON>
END RETURNED_CODEX_RESPONSE
```

## Authority Boundary

This PR is a pure local separate-session capture dogfood/prep docs/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.

## Verification

- npm run typecheck
- npm run dogfood:perspective-codex-former-separate-session-capture-packet-prep
- npm run smoke:perspective-codex-former-separate-session-capture-packet-prep
- npm run dogfood:perspective-codex-former-provenance-clean-transcript-capture
- npm run smoke:perspective-codex-former-provenance-clean-transcript-capture
- npm run dogfood:perspective-codex-former-provenance-stale-wording
- npm run smoke:perspective-codex-former-provenance-stale-wording
- npm run smoke:perspective-codex-former-manual-copy-packet
- git diff --check
- git diff --cached --check

## Skipped Checks With Concrete Reasons

- Real separate-session transcript dogfood: skipped because no real separate-session transcript envelope was supplied.
- Browser/computer-use validation: Not run: this PR is pure local separate-session transcript capture prep docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.
- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.
- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs from implementation.
- Successful transcript validation bundle: skipped until a real separate-session transcript envelope is returned.

## What Codex Did Not Do

Codex did not fabricate a separate-session transcript, did not reuse PR #490 same-session capture as separate-session capture, did not reuse old packet ids or prompt hashes, did not use stale packets from chat attachments, did not call Codex from implementation, did not execute Codex from Augnes, did not call the Codex SDK, did not call OpenAI/provider/model APIs from implementation, did not call GitHub APIs from implementation behavior, did not use implementation network behavior, did not write DB state, did not add runtime routes, did not add UI, did not add clipboard automation, did not create proof/evidence/readiness records, did not approve, merge, publish, retry, replay, deploy, or make Core decisions.

## Recommended Next Implementation PR Title

Capture separate-session provenance-clean Codex former transcript

## Future Successful-Transcript Validation Bundle

- npm run typecheck
- npm run dogfood:perspective-codex-former-separate-session-provenance-clean-capture
- npm run smoke:perspective-codex-former-separate-session-provenance-clean-capture
- npm run dogfood:perspective-codex-former-provenance-clean-transcript-capture
- npm run smoke:perspective-codex-former-provenance-clean-transcript-capture
- npm run dogfood:perspective-codex-former-provenance-stale-wording
- npm run smoke:perspective-codex-former-provenance-stale-wording
- npm run dogfood:perspective-codex-former-second-refined-transcript
- npm run smoke:perspective-codex-former-second-refined-transcript
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

## Scenarios

### Separate Session Transcript Availability

Scenario id: separate_session_transcript_availability
Conclusion: WAITING_FOR_TRANSCRIPT
Blocked reasons: No real separate-session transcript envelope was supplied.; Same-session PR #490 material is not reused as separate-session capture.

Dogfood notes:
- The task prompt supplied the required envelope shape, but not a filled envelope.
- Local search found prior same-session and older transcript material, not a fresh separate-session envelope for this packet.
- This script does not fabricate returned CodexPerspectiveCandidateDraft JSON.

### Generated Packet Match

Scenario id: generated_packet_match
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The packet is generated locally from current main after PR #490.
- Generated ids and the prompt hash are checked against all explicitly banned older values, including PR #490's same-session packet values.
- The copyable prompt uses the stable CodexPerspectiveFormerDraftPromptContract v0.1 label and does not use stale PR #479 prompt wording.

### Capture Instruction Artifact

Scenario id: capture_instruction_artifact
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The report stores the exact copyable prompt for a future separate user-started Codex session.
- The report stores the exact return envelope to paste back after the manual session returns a bounded response.
- The envelope provenance fields are generated from the fresh packet, not old transcript metadata.

### No Confirmation Claim Without Transcript

Scenario id: no_confirmation_claim_without_transcript
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Contract fit is not run because there is no returned CodexPerspectiveCandidateDraft.
- Direct validation is not run because there is no returned CodexPerspectiveCandidateDraft.
- Alignment and Worker-Facing Guidance are reserved for the real transcript follow-up.

### Authority Boundary

Scenario id: authority_boundary
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The packet remains draft/review-only and non-authoritative.
- No browser/computer-use validation is required because there is no UI or interactive copy control.
- No transcript, proof, evidence, readiness, DB, runtime, clipboard, provider/model, or Core-decision behavior is added.
