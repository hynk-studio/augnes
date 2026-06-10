# Perspective Codex Former Provenance And Stale Wording Follow-Up

Generated at: 2026-06-10T00:00:00.000Z
Conclusion: PASS with follow-up
Recommended next implementation PR title: Dogfood provenance-clean Codex former transcript capture

## Summary

This pure local follow-up to PR #488 refines the manual copy packet provenance return envelope and stale source-gap wording before the next real transcript capture run.
It does not capture a new transcript.

## What PR #488 Found

PR #488 found PASS with follow-up: old PR #483 alias drift absent, PR #486 non-local tension_kind drift absent, direct contract fit fits_contract, direct local validation produced candidate-compatible material, PR #484 alignment was not required, and Worker-Facing Guidance ran advisory-only.

## Stale Wording Found

stale_pr_479_prompt_contract_reference, stale_second_transcript_missing_capture_wording, and stale_capture_next_action_after_supplied_transcript.

## Provenance Missing In PR #488

source_manual_copy_packet_id and source_prompt_hash were not supplied in chat.

## Manual Copy Packet Wording Changed

The copyable prompt now uses CodexPerspectiveFormerDraftPromptContract v0.1 as the stable contract label instead of the stale PR #479 prompt contract wording.
New prompt uses stable label: true
Stale PR #479 contract wording remains in newly generated prompt: false

## Capture Return Envelope Added

The manual copy packet exposes REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET with capture_method, codex_surface_label, source_manual_copy_packet_id, source_former_input_packet_id, source_prompt_hash, captured_at, redaction notes, and RETURNED_CODEX_RESPONSE bounds.
Envelope required fields present: true
Envelope source_manual_copy_packet_id: manual-codex-former-copy:v0.1:12z6arh
Envelope source_former_input_packet_id: codex-perspective-former-input:v0.1:project-augnes-project-augnes-ag-codex-former-pr:1hopnqy
Envelope source_prompt_hash: 10l91xe

## Source Pre-Capture Gap Vs Post-Capture State

Source packet pre-capture gaps are historical input context; when a transcript fixture is present, dogfood treats the current remaining gap as local validation/provenance review, not missing transcript evidence.
source_packet_pre_capture_gap: true
captured_transcript_present: true
post_capture_remaining_gap: local_validation_required
stale_source_gap_treated_as_current_state: false

## Stale Wording Detection

Stale fixture findings: stale_pr_479_prompt_contract_reference, stale_prompt_lineage_label, stale_old_pr_prompt_contract_reference, stale_source_packet_gap_echo, stale_second_transcript_missing_capture_wording, stale_capture_next_action_after_supplied_transcript
Stale fixture classification: needs_review
Clean fixture findings: none

## Provenance Behavior

Complete provenance status: complete
Partial provenance status: needs_review
Partial missing fields: source_manual_copy_packet_id, source_prompt_hash
Partial provenance fabricated metadata: false

## New Real Transcript Capture

No. This PR does not capture a new transcript.

## Browser/Computer-Use Validation

Not run: this PR is pure local manual-copy/provenance/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, interactive copy control, or transcript capture.

## Scenarios

### Manual Copy Packet Current Contract Label

Scenario id: manual_copy_packet_current_contract_label
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The copyable prompt now identifies the local contract by stable contract label/version.
- PR refs may still appear as bounded source refs, but not as the prompt contract identity.

### Capture Return Envelope Present

Scenario id: capture_return_envelope_present
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The capture return envelope is separate from the Codex JSON-only prompt and is intended for the human to return with the captured transcript.
- The envelope preserves manual copy packet id, former input packet id, and copyable prompt hash.

### Pre-Capture Gap Not Current State

Scenario id: pre_capture_gap_not_current_state
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Source packet pre-capture gaps remain historical input context.
- When a transcript fixture is present, dogfood treats the current remaining gap as local validation/provenance review, not missing transcript evidence.

### Stale Wording Detection Fixture

Scenario id: stale_wording_detection_fixture
Conclusion: PASS with follow-up
Blocked reasons: None

Dogfood notes:
- Stale source-gap wording is classified as needs_review/follow-up, not unsafe by itself.
- Validation may still produce non-committed candidate-compatible material when the schema is otherwise valid.

### Clean Second Transcript Style Fixture

Scenario id: clean_second_transcript_style_fixture
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The clean fixture uses the current contract label and treats the response as present while still requiring local validation.
- Worker-Facing Guidance remains advisory-only.

### Provenance Complete Fixture

Scenario id: provenance_complete_fixture
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- A returned envelope with source_manual_copy_packet_id and source_prompt_hash can now preserve complete provenance.

### Provenance Partial Fixture

Scenario id: provenance_partial_fixture
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Partial provenance remains needs_review and records not_supplied_in_chat without fabricating metadata.

### Regression Safety

Scenario id: regression_safety
Conclusion: PASS
Blocked reasons: draft source former input packet ref does not match; draft includes forbidden authority claims; draft says raw payloads are included

Dogfood notes:
- Controls cover true authority flags, raw payload inclusion, non-pointer evidence refs, and source former input packet mismatch.
- Blocked controls produce no candidate-compatible material and keep returned authority flags false.

## Authority Boundary

This PR is a pure local manual-copy/provenance/docs/report/smoke slice. It does not capture a new transcript, call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.

## Verification

- npm run typecheck
- npm run dogfood:perspective-codex-former-provenance-stale-wording
- npm run smoke:perspective-codex-former-provenance-stale-wording
- npm run dogfood:perspective-codex-former-second-refined-transcript
- npm run smoke:perspective-codex-former-second-refined-transcript
- npm run smoke:perspective-codex-former-manual-copy-packet
- full neighboring Perspective smoke bundle
- git diff --check
- git diff --cached --check

## Skipped Checks With Concrete Reasons

- Browser/computer-use validation: Not run: this PR is pure local manual-copy/provenance/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, interactive copy control, or transcript capture.
- New real transcript capture: skipped because this PR intentionally refines provenance/capture instructions before the next transcript run.
- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.
- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs.
- GitHub implementation behavior: skipped because implementation code has no GitHub API/network path.

## What Codex Did Not Do

Codex did not capture a new transcript, call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.

## What Should Happen Next

Dogfood provenance-clean Codex former transcript capture
