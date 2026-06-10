# Perspective Codex Former Separate-Session Provenance-Clean Capture

Generated at: 2026-06-10T00:00:00.000Z
Conclusion: PASS with follow-up
Recommended next implementation PR title: Promote provenance-clean Codex former capture path to manual workflow docs

## Summary

This dogfood completes the PR #491 separate-session capture path with the supplied real transcript envelope. It uses the prepared manual copy packet metadata, extracts one returned CodexPerspectiveCandidateDraft-shaped object, runs contract fit and direct local validation, keeps alignment as a safety net, and keeps all output non-committed and advisory-only.

## Why This Follows PR #491 Prep

PR #491 prepared the copyable prompt and return envelope, then merged while waiting for a real separate-session transcript. This slice uses the supplied envelope to complete that dogfood without changing the generated packet lineage.

## Real Separate-Session Transcript Provenance

Complete: transcript_available true, human_manual capture, separate user-started Codex session surface, matching packet ids/hash, and no not_supplied_in_chat values.
Transcript available: true
capture_method: human_manual
codex_surface_label: separate user-started Codex session
prompt_was_generated_by_manual_copy_packet: true
source_manual_copy_packet_id: manual-codex-former-copy:v0.1:okr3cu
source_former_input_packet_id: codex-perspective-former-input:v0.1:project-augnes-ag-separate-session-provenance-cl:3elrni
source_prompt_hash: 3jveop
captured_at: unknown
provenance_status: complete
No not_supplied_in_chat values: true
Fabricated metadata: false
Clearly not same-session fallback: true

## Capture Method

human_manual, by a human copy/paste envelope returned from a separate user-started Codex session.

## Generated Packet Match

Transcript ids and prompt hash match the PR #491 prepared packet metadata.
Manual copy packet id: manual-codex-former-copy:v0.1:okr3cu
Former input packet id: codex-perspective-former-input:v0.1:project-augnes-ag-separate-session-provenance-cl:3elrni
Prompt hash: 3jveop
Stable contract label present: true
Stale PR #479 prompt wording absent: true
Capture return envelope present: true
Capture return envelope matches packet: true

## Contract-Fit Result

Contract fit returned needs_review with concrete warnings: pointer_ref:draft.evidence_pointer_refs[0], pointer_ref:draft.evidence_pointer_refs[1].
Extracted candidate count: 1
Contract-fit status: needs_review
Contract-fit warning kinds: pointer_ref, pointer_ref
Pointer warning fields: draft.evidence_pointer_refs[0], draft.evidence_pointer_refs[1]
Plain-summary warning present: false
Tension-kind warning present: false

## Direct Validation Result

Direct validation returned needs_review and produced non-committed candidate-compatible review material.
Validation status: needs_review
Validation warning kinds: unknown_pointer_ref, unknown_pointer_ref
Candidate-compatible material: true
Candidate authority: non_committed
Candidate basis quality: needs_review
Candidate pointer count: 1
Basis quality suggestion: needs_review
Unsafe material detected: false
Authority flags all false: true

## Alignment Safety-Net Result

Alignment remains available, but direct validation ran first and alignment is not counted as direct success.
Alignment available: true
Direct validation ran first: true
Direct validation succeeded first: true
Alignment status: blocked
Alignment required for candidate material: false
Alignment counted as direct success: false

## Downstream Guidance Result

Worker-Facing Guidance ran advisory-only with 3 next actions.
Worker guidance status: resolve_gaps_first
Worker guidance advisory-only: true
Next action count: 3
Authority flags all false: true

## Drift/Stale Wording Regression Result

Old alias drift, non-local tension_kind drift, stale missing-transcript wording, stale capture-next-action wording, and stale prompt-lineage labels are absent.
Old PR #483 alias drift absent: true
PR #486 non-local tension_kind drift absent: true
Stale wording findings: none
Stale prompt-lineage labels: none

## Privacy/Omitted-Field Handling

The supplied envelope reported omitted unsafe/private marker names. The local draft preserves unsafe_input_material_omitted: true and stores only a sanitized marker-count summary; public artifacts do not echo the raw marker names.
Unsafe/private marker names supplied: true
Raw marker names echoed in public artifact: false
Sanitized omitted marker summary: sanitized_omitted_marker_names_count:11

## Unsafe Authority Regression

Synthetic unsafe authority fixture blocked safely.
Unsafe or authority survived: false

## Evaluation Conclusion

PASS with follow-up: provenance is complete and direct validation is safe, while contract-fit pointer warnings and needs_review basis quality remain review follow-up.

## Files Changed

- scripts/dogfood-perspective-codex-former-separate-session-provenance-clean-capture.mjs
- scripts/smoke-perspective-codex-former-separate-session-provenance-clean-capture.mjs
- docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_V0_1.md
- reports/dogfood/2026-06-10-perspective-codex-former-separate-session-provenance-clean-capture.md
- scripts/dogfood-perspective-codex-former-separate-session-capture-packet-prep.mjs
- scripts/smoke-perspective-codex-former-separate-session-capture-packet-prep.mjs
- docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_CAPTURE_PACKET_PREP_V0_1.md
- reports/2026-06-10-perspective-codex-former-separate-session-capture-packet-prep.md
- package.json

## Authority Boundary

This PR is a pure local separate-session transcript dogfood/docs/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.

## Verification

- npm run typecheck
- npm run dogfood:perspective-codex-former-separate-session-provenance-clean-capture
- npm run smoke:perspective-codex-former-separate-session-provenance-clean-capture
- npm run dogfood:perspective-codex-former-separate-session-capture-packet-prep
- npm run smoke:perspective-codex-former-separate-session-capture-packet-prep
- npm run dogfood:perspective-codex-former-provenance-clean-transcript-capture
- npm run smoke:perspective-codex-former-provenance-clean-transcript-capture
- npm run dogfood:perspective-codex-former-provenance-stale-wording
- npm run smoke:perspective-codex-former-provenance-stale-wording
- npm run smoke:perspective-codex-former-manual-copy-packet
- git diff --check
- git diff --cached --check

## Neighboring Smoke Coverage

- npm run dogfood:perspective-codex-former-second-refined-transcript
- npm run smoke:perspective-codex-former-second-refined-transcript
- npm run dogfood:perspective-codex-former-refined-findings-contract
- npm run smoke:perspective-codex-former-refined-findings-contract
- npm run dogfood:perspective-codex-former-refined-prompt-real-transcript
- npm run smoke:perspective-codex-former-refined-prompt-real-transcript
- npm run smoke:perspective-codex-former-prompt-contract
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

## Skipped Checks With Concrete Reasons

- Browser/computer-use validation: Not run: this PR is pure local separate-session transcript dogfood/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.
- DB validation: not run because this PR adds no DB schema, persistence path, or state writer.
- Provider/model validation: not run because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs from implementation.
- Runtime/browser validation: not run because this PR adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.

## What Codex Did Not Do

Codex did not fabricate a transcript, replace the supplied transcript with a synthetic fixture, call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.

## Recommended Next Implementation PR Title

Promote provenance-clean Codex former capture path to manual workflow docs

## Scenarios

### Separate Session Transcript Provenance

Scenario id: separate_session_transcript_provenance
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The supplied envelope is treated as human_manual pasteback from a separate user-started Codex session.
- The supplied packet ids and prompt hash are compared to the immutable #491 generated packet.
- No missing or fabricated provenance metadata is accepted.

### Generated Packet Match

Scenario id: generated_packet_match
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- The supplied transcript metadata matches PR #491's generated manual copy packet id, former input packet id, and prompt hash.
- The generated prompt retains the stable CodexPerspectiveFormerDraftPromptContract v0.1 label.
- The stale PR #479 prompt wording is absent.

### Contract Fit And Validation

Scenario id: contract_fit_and_validation
Conclusion: PASS with follow-up
Blocked reasons: None

Dogfood notes:
- The supplied response extracts as exactly one candidate draft.
- Contract fit is needs_review because one or more returned pointer refs were not present in the former input packet.
- Direct validation runs before alignment and produces non-committed candidate-compatible review material when safe.
- The supplied unsafe-marker list is summarized through a sanitized marker-count label rather than echoed.

### Drift Regression

Scenario id: drift_regression
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Old alias fields from prior Codex former drafts are rejected as drift.
- Non-local tension_kind values remain absent.
- The returned draft does not echo pre-capture missing-transcript wording as current state.

### Alignment Safety Net

Scenario id: alignment_safety_net
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Alignment remains available as a safety net.
- Direct validation succeeds first, so alignment is reported separately and is not required for candidate material.
- The raw supplied pointer refs make alignment return a safe blocked result, which is not counted against direct validation.

### Downstream Guidance

Scenario id: downstream_guidance
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Worker-Facing Guidance runs on direct candidate material.
- Guidance remains advisory-only and cannot escalate authority.

### Unsafe Authority Regression

Scenario id: unsafe_authority_regression
Conclusion: PASS
Blocked reasons: None

Dogfood notes:
- Synthetic bad fixture includes a true authority flag, raw payload inclusion, non-pointer evidence ref, and source former input mismatch.
- The fixture is blocked/rejected safely and produces no candidate-compatible material.

## Sanitized Capture Snapshot

```json
{
  "capture_method": "human_manual",
  "codex_surface_label": "separate user-started Codex session",
  "prompt_was_generated_by_manual_copy_packet": true,
  "source_manual_copy_packet_id": "manual-codex-former-copy:v0.1:okr3cu",
  "source_former_input_packet_id": "codex-perspective-former-input:v0.1:project-augnes-ag-separate-session-provenance-cl:3elrni",
  "source_prompt_hash": "3jveop",
  "captured_at": "unknown",
  "provenance_status": "complete",
  "sanitized_redaction": {
    "included_only_returned_draft_or_bounded_response_text": true,
    "unsafe_private_marker_names_supplied": true,
    "unsafe_private_marker_names_sanitized_from_public_artifacts": true,
    "sanitized_omitted_marker_summary": "sanitized_omitted_marker_names_count:11"
  }
}
```
