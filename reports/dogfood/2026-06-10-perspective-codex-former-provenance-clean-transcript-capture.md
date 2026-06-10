# Perspective Codex Former Provenance-Clean Transcript Capture

Generated at: 2026-06-10T00:00:00.000Z
Conclusion: PASS with follow-up
Recommended next implementation PR title: Confirm provenance-clean Codex former capture in separate session
Alternative if fully sufficient: Promote provenance-clean Codex former capture path to manual workflow docs

## Summary

This dogfood generated a fresh post-PR #489 Manual Codex Former Draft Copy Packet locally, used its copyable prompt text as bounded local input in this same human-started Codex work session, captured one CodexPerspectiveCandidateDraft-shaped response, and validated the result as non-committed review material.

## Why This Follows PR #489

PR #489 made the manual copy packet provenance-clean enough to test: it added stable prompt contract wording, copyable_prompt_hash, capture_return_envelope, source pre-capture gap guidance, and stale PR #479 wording prevention.

## Why Phone/Manual Copy Was Avoided

The user was on a phone and could not safely copy a large Manual Codex Former Draft Copy Packet between sessions.

## Fresh Generated Packet Provenance

manual copy packet manual-codex-former-copy:v0.1:1smxq68; former input packet codex-perspective-former-input:v0.1:project-augnes-ag-provenance-clean-codex-former-:1t2k3qo; prompt hash 1bctd1u.
Generated manual copy packet id fresh: true
Generated former input packet id fresh: true
Generated prompt hash fresh: true
Stable contract label present: true
Stale PR #479 prompt wording present: false
Capture return envelope matches packet: true

## Capture Method And Honesty Note

Capture was performed in a human-started Codex work session by generating the post-PR #489 packet locally and using its copyable prompt text as bounded input, avoiding phone/manual packet copying. No Codex SDK, provider/model API, or implementation Codex call was used.

## Capture Envelope Result

Complete: source_manual_copy_packet_id, source_former_input_packet_id, and source_prompt_hash are present and match the generated packet.
capture_method: human_manual
codex_surface_label: Codex
prompt_was_generated_by_manual_copy_packet: true
source_manual_copy_packet_id: manual-codex-former-copy:v0.1:1smxq68
source_former_input_packet_id: codex-perspective-former-input:v0.1:project-augnes-ag-provenance-clean-codex-former-:1t2k3qo
source_prompt_hash: 1bctd1u
captured_at: 2026-06-10T00:00:00.000Z
provenance_status: complete
fabricated_metadata: false

## Contract-Fit Result

Direct contract fit returned fits_contract with no plain_summary or tension_kind warning.
Extracted candidate count: 1
Contract-fit status: fits_contract
Contract-fit warning kinds: none

## Direct Validation Result

Direct validation returned needs_review and produced non-committed candidate-compatible material.
Validation status: needs_review
Candidate-compatible material: true
Candidate authority: non_committed
Candidate basis quality: needs_review

## Alignment Safety-Net Result

Alignment remains available, but direct validation succeeded first and alignment is not required for candidate material.
PR #484 alignment available: true
Alignment status: aligned
Alignment required for candidate material: false
Alignment applied mappings: privacy_false_alias_flags

## Downstream Guidance Result

Worker-Facing Guidance ran advisory-only with 3 next actions.
Worker guidance status: resolve_gaps_first
Worker guidance advisory-only: true
Next action count: 3

## Stale Wording Regression Result

No stale PR #479 prompt contract wording, stale transcript-not-captured current-state wording, or stale capture-next-action wording survived.
Stale wording findings: none
Source pre-capture gap historical: true

## Provenance Completeness

Complete, with no not_supplied_in_chat values and no fabricated metadata.
No not_supplied_in_chat values: true

## Unsafe Authority Regression

Synthetic unsafe authority fixture blocked safely.
Unsafe or authority survived: false

## Files Changed

- scripts/dogfood-perspective-codex-former-provenance-clean-transcript-capture.mjs
- scripts/smoke-perspective-codex-former-provenance-clean-transcript-capture.mjs
- docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_V0_1.md
- reports/dogfood/2026-06-10-perspective-codex-former-provenance-clean-transcript-capture.md
- package.json
- scripts/smoke-perspective-candidate-builder-fixture.mjs
- scripts/smoke-perspective-codex-former-draft-schema-alignment.mjs
- scripts/smoke-perspective-codex-former-manual-copy-packet.mjs
- scripts/smoke-perspective-codex-former-manual-copy-real-transcript.mjs
- scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs
- scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs
- scripts/smoke-perspective-codex-former-pipeline.mjs
- scripts/smoke-perspective-codex-former-prompt-contract-canonical-schema.mjs
- scripts/smoke-perspective-codex-former-prompt-contract.mjs
- scripts/smoke-perspective-codex-former-provenance-stale-wording.mjs
- scripts/smoke-perspective-codex-former-real-transcript-capture-instructions.mjs
- scripts/smoke-perspective-codex-former-refined-findings-contract.mjs
- scripts/smoke-perspective-codex-former-refined-prompt-real-transcript.mjs
- scripts/smoke-perspective-codex-former-second-refined-transcript.mjs
- scripts/smoke-perspective-worker-facing-guidance.mjs

## Authority Boundary

This PR is a pure local packet-generation/provenance-clean transcript dogfood/docs/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.

## Verification

- npm run typecheck
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

## Skipped Checks With Concrete Reasons

- Browser/computer-use validation: Not run: this PR is pure local packet-generation/provenance-clean transcript dogfood/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.
- Separate manual pasted Codex session: skipped because the user is on a phone and cannot safely copy a large packet between sessions.
- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.
- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs from implementation.
- Runtime/browser validation: skipped because this PR adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.

## What Codex Did Not Do

Codex did not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.
Codex did not claim this was a separate manual pasted Codex session.

## Recommended Next Implementation PR Title

Confirm provenance-clean Codex former capture in separate session

## Scenarios

### Generated Post PR #489 Packet

Scenario id: generated_post_pr489_packet
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The packet is generated locally from current main after PR #489.
- The generated ids and prompt hash are checked against the explicitly banned older ids and hashes.
- The copyable prompt uses the stable CodexPerspectiveFormerDraftPromptContract v0.1 label and does not use stale PR #479 prompt wording.

### Provenance Clean Capture Envelope

Scenario id: provenance_clean_capture_envelope
Conclusion: PASS with follow-up
Blocked reasons: None

Dogfood notes:
- Capture was performed in a human-started Codex work session by generating the post-PR #489 packet locally and using its copyable prompt text as bounded input, avoiding phone/manual packet copying. No Codex SDK, provider/model API, or implementation Codex call was used.
- The envelope keeps capture_method: human_manual because the existing schema requires it, but records the same-session phone-assisted path explicitly.
- No manual copy packet id, former input packet id, or prompt hash is fabricated; all three come from the generated packet.

### Captured Candidate Contract Fit

Scenario id: captured_candidate_contract_fit
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The captured response is exactly one CodexPerspectiveCandidateDraft-shaped object.
- The thesis frames the useful neutral perspective around validating the post-PR #489 provenance-clean capture path, not merely narrating PR history.
- No old alias fields or non-local tension_kind values are emitted.

### Direct Validation

Scenario id: direct_validation
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- validateAndNormalizeCodexPerspectiveCandidateDraft runs directly against the generated former input packet.
- The expected status is needs_review or ready_for_review, but not blocked.
- Candidate-compatible material remains non_committed.

### Alignment Safety Net

Scenario id: alignment_safety_net
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- PR #484 alignment remains available as a safety net.
- Direct validation succeeds first, so alignment is not required for candidate material.
- Alignment mappings are reported separately and are not counted as direct success.

### Downstream Guidance

Scenario id: downstream_guidance
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Worker-Facing Guidance runs on the direct candidate material.
- The guidance remains advisory-only and cannot escalate authority.

### Stale Wording Regression

Scenario id: stale_wording_regression
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The generated prompt does not contain the stale PR #479 prompt wording.
- The captured candidate does not claim the current transcript is absent.
- The source pre-capture gap remains historical input context; the post-capture gap is review/confirmation.

### Unsafe Authority Regression

Scenario id: unsafe_authority_regression
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Synthetic bad fixture includes a true authority flag, raw payload inclusion, non-pointer evidence ref, and source former input packet mismatch.
- The fixture is blocked/rejected safely and produces no candidate-compatible material.

## Capture Envelope Snapshot

```json
{
  "capture_method": "human_manual",
  "capture_method_honesty_note": "Capture was performed in a human-started Codex work session by generating the post-PR #489 packet locally and using its copyable prompt text as bounded input, avoiding phone/manual packet copying. No Codex SDK, provider/model API, or implementation Codex call was used.",
  "codex_surface_label": "Codex",
  "prompt_was_generated_by_manual_copy_packet": true,
  "source_manual_copy_packet_id": "manual-codex-former-copy:v0.1:1smxq68",
  "source_former_input_packet_id": "codex-perspective-former-input:v0.1:project-augnes-ag-provenance-clean-codex-former-:1t2k3qo",
  "source_prompt_hash": "1bctd1u",
  "captured_at": "2026-06-10T00:00:00.000Z",
  "provenance_status": "complete",
  "redaction_notes": [
    "Included only returned CodexPerspectiveCandidateDraft JSON or bounded response text.",
    "No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets included."
  ]
}
```

## Generated Prompt Bounds

copyable_codex_prompt_text length: 13207
copyable_prompt_hash: 1bctd1u
