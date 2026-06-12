# Perspective Codex Former Local Adapter Validate Orchestration Design v0.1

## Purpose

This document defines future local Codex adapter validate orchestration mode.

This PR is design-only. It adds no validate orchestration implementation, no validate execution CLI behavior, no UI, no route, no browser-visible surface, no runtime fixture mutation, no DB write, no network call, no provider/model API call, no Codex call, no Codex SDK call, no GitHub mutation, no Core decision, no proof/evidence/readiness records, no persistence, no surface export, no clipboard automation, no accepted state, no review decision, and no automatic promotion.

Future validate orchestration means one local review-only operation: consume exactly one returned Codex candidate envelope produced from the prepared prompt/manual copy packet flow, verify local provenance and schema against source input plus prepare execution summary metadata, and emit a bounded local validation summary contract.

It does not mean approval, acceptance, mergeability, product readiness, Core decision, review decision, persistence, promotion, or trusted runtime state.

Local validation is not a review decision.

## Why Follows PR #521

PR #521 completed the read-only local Codex adapter snapshot fixture surface hardening. That surface made prepared and waiting states inspectable without creating runtime authority.

The next major feature axis is validate orchestration design. The prepared prompt/manual copy packet flow can already produce a return envelope template and metadata. A later local adapter mode needs a contract for checking one human-returned candidate before any future read-only validate result snapshots or UI can exist.

This design deliberately stops before helper execution and product surfaces. It defines the contract that a later implementation must satisfy.

## Product Thesis

Validate orchestration mode should make one returned Codex candidate safe to inspect as review material.

It should:

- require exactly one returned candidate envelope;
- verify the envelope came from the prepared prompt/manual copy packet flow;
- verify source ids and prompt hash against source input, helper metadata, and prepare execution summary;
- validate schema and candidate compatibility locally;
- preserve warnings and pointer warnings as review material;
- run Worker-Facing Guidance only after candidate-compatible review material exists;
- emit a bounded validation summary;
- support future validate result snapshots and future read-only validate UI;
- not create accepted state, review decisions, persistence, proof/evidence/readiness records, or automatic promotion.

Returned candidate content must not be treated as trusted runtime state. It is untrusted input until local validation completes, and even after validation it remains review-only material.

## Relationship To Existing Modes

This design follows:

- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DESIGN_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_DESIGN_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_OUTPUT_SNAPSHOTS_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_MANUAL_WORKFLOW_V0_1.md`
- `scripts/perspective-codex-former-capture-helper.mjs`

Manifest-to-source-input mode produces helper-compatible source input.

Source-input preflight validates that source input locally.

Prepare dry-run proves helper readiness without running the helper.

Prepare execution runs only the reviewed local helper prepare command and records output metadata.

Prepare output snapshots may show prepared / waiting-for-return state.

Validate orchestration consumes one returned envelope plus the local prepare execution summary. It must not rerun prepare, call Codex, mutate runtime fixtures, or decide acceptance.

## Returned Candidate Envelope Input Contract

Future validate orchestration should require these local inputs:

- returned candidate envelope path;
- prepare execution summary path;
- source input path;
- optional preflight summary path for hash cross-checking;
- optional helper metadata path when not discoverable from prepare execution summary;
- optional validation summary output path;
- optional expected source input hash;
- optional expected source_manual_copy_packet_id;
- optional expected former_input_packet_id;
- optional expected prompt_hash.

The returned envelope must be local file input supplied by a human after a separate user-started Codex session. The adapter must not fetch it, scrape it from a browser, read it from a DB, call Codex for it, call a provider/model API for it, or automate the clipboard.

The envelope text contract remains:

```text
REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET

capture_method: human_manual
codex_surface_label: separate user-started Codex session
prompt_was_generated_by_manual_copy_packet: true
source_manual_copy_packet_id: <packet id>
source_former_input_packet_id: <former input packet id>
source_prompt_hash: <prompt hash>
captured_at: <timestamp or unknown>

TRANSCRIPT_REDACTION_NOTES:
- Included only returned CodexPerspectiveCandidateDraft JSON or bounded response text.
- No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets included.

RETURNED_CODEX_RESPONSE:
<returned JSON>
END RETURNED_CODEX_RESPONSE
```

The adapter-facing aliases are:

- `source_manual_copy_packet_id` check uses the envelope `source_manual_copy_packet_id`;
- `former_input_packet_id` check uses the envelope `source_former_input_packet_id`;
- `prompt_hash` check uses the envelope `source_prompt_hash`.

The returned response may be a JSON object or bounded prose containing exactly one balanced candidate JSON object. In both cases extraction must produce exactly one `CodexPerspectiveCandidateDraft` object before downstream validation runs.

## Candidate Count Rule

`candidate_count` must be exactly one.

Validation must be `BLOCKED` when `candidate_count` is zero, greater than one, unknown, unparsable, or derived from multiple candidate-looking JSON objects.

The adapter must not choose a best candidate, merge candidates, discard extras, retry with a different parse policy, or ask Codex to regenerate. Multiple returned candidates are useful blocked findings for a human, not an automated selection problem.

## Candidate Envelope JSON Shape

The extracted candidate JSON object should match the existing Codex Former candidate draft contract used by direct local validation.

At design level, the object must include:

```json
{
  "draft_kind": "CodexPerspectiveCandidateDraft",
  "draft_version": "v0.1",
  "source_former_input_packet_id": "codex-perspective-former-input:v0.1:<id>",
  "source_manual_copy_packet_id": "manual-codex-former-copy:v0.1:<id>",
  "source_prompt_hash": "<prompt hash>",
  "candidate_summary": {
    "status": "draft",
    "summary": "bounded summary"
  },
  "basis_quality_suggestion": {
    "status": "sufficient_for_review | needs_review"
  },
  "evidence_pointer_refs": [
    {
      "ref": "pointer_ref:<bounded local reference>",
      "semantics": "pointer_only"
    }
  ],
  "recommended_next_actions": [],
  "authority_flags": {
    "accepted_state_created": false,
    "review_decision_created": false,
    "proof_evidence_readiness_created": false,
    "provider_model_calls": false,
    "codex_sdk_calls": false,
    "github_mutation": false,
    "db_writes": false,
    "core_decision": false,
    "automatic_promotion": false
  },
  "privacy_flags": {
    "raw_payloads_included": false
  }
}
```

The exact future implementation should continue to use the existing local candidate validators rather than a parallel schema. This JSON shape is a design contract for required provenance, pointer-only evidence semantics, review-only authority, and bounded material.

Candidate content remains untrusted even when this shape is present. Shape compatibility is a prerequisite for review material, not a runtime trust grant.

## Provenance And Metadata Matching

Future validate orchestration must compare the envelope, extracted candidate, helper metadata, prepare execution summary, and source input.

Required checks:

- source input exists and its hash matches prepare execution summary `source_input_hash`;
- prepare execution summary mode is `prepare-orchestration-execution`;
- prepare execution summary records successful or complete enough helper output discovery;
- prepare execution summary references helper metadata path or helper metadata hash;
- helper metadata source input hash matches source input bytes when metadata exposes it;
- helper metadata `source_manual_copy_packet_id` matches prepare execution summary output discovery;
- helper metadata `source_former_input_packet_id` or `former_input_packet_id` matches prepare execution summary output discovery;
- helper metadata `source_prompt_hash`, `copyable_prompt_hash`, or prompt output hash matches prepare execution summary `prompt_hash`;
- returned envelope provenance fields are present and not `not_supplied_in_chat`;
- envelope `capture_method` is `human_manual`;
- envelope `codex_surface_label` is `separate user-started Codex session`;
- envelope `prompt_was_generated_by_manual_copy_packet` is true;
- source_manual_copy_packet_id check passes across envelope, extracted candidate, helper metadata, and prepare execution summary;
- former_input_packet_id check passes across envelope `source_former_input_packet_id`, extracted candidate `source_former_input_packet_id`, helper metadata, source input packet id, and prepare execution summary;
- prompt_hash check passes across envelope `source_prompt_hash`, extracted candidate `source_prompt_hash`, helper metadata, prompt output metadata, and prepare execution summary;
- extracted candidate points back to the same former input packet used by direct validation.

Any mismatch blocks validation. Mismatches are validation results, not product decisions.

## Prepare Execution Summary Relationship

Validate orchestration must be downstream of exactly one prepare execution summary.

The prepare execution summary is the local provenance anchor for:

- source input path and hash;
- preflight summary path and hash when available;
- helper output directory;
- helper metadata path and hash;
- manual copy packet path, id, hash, and size when available;
- former input packet path, id, hash, and size when available;
- prompt path and prompt_hash;
- return envelope template path and hash;
- prepare helper command argv and hash;
- authority flags proving no provider/model, Codex SDK, GitHub, DB, persistence, accepted state, review decision, or Core decision behavior.

Validate orchestration must not accept a returned envelope without either a matching prepare execution summary or an explicitly blocked result that says the prepare summary is missing. It must not infer prepare provenance from candidate text alone.

## Validate Dry-Run Command Plan

Future dry-run command, design-only:

```bash
npm run perspective:codex-former:local-adapter:validate -- --dry-run --source-input <path> --prepare-execution-summary <path> --returned-envelope <path> --validation-summary-out <path>
```

Dry-run should:

- load and parse only local files;
- compute hashes;
- verify expected paths and provenance fields;
- check whether `candidate_count` would be exactly one;
- report whether direct validation prerequisites are present;
- report the planned local validation steps;
- report planned Worker-Facing Guidance eligibility;
- emit a dry-run summary only when requested;
- not run direct candidate validation if dry-run is defined as pre-execution only;
- not run helper validate execution;
- not call Codex, provider/model APIs, GitHub, network, DB, browser, clipboard, or Core systems.

Dry-run output should distinguish `ready_for_validate_execution`, `blocked_before_validate_execution`, and `warnings_before_validate_execution`.

## Validate Execution Command Plan

Future execution command, design-only:

```bash
npm run perspective:codex-former:local-adapter:validate -- --execute --source-input <path> --prepare-execution-summary <path> --returned-envelope <path> --validation-summary-out <path>
```

Execution should:

- repeat dry-run checks from current files;
- reject stale dry-run summaries unless hashes still match;
- extract exactly one candidate draft;
- run existing local contract-fit and direct validation routines;
- run schema alignment only as a safety-net comparison, not as direct success;
- run Worker-Facing Guidance only when direct validation produces candidate-compatible review material;
- write a bounded validation summary outside any helper output directory;
- never call Codex, provider/model APIs, GitHub, network, DB, browser, clipboard, or Core systems.

`--execute` and `--dry-run` must not be allowed together. Execution must not be implicit when neither flag is supplied. The adapter must not allow arbitrary command override, provider/model selection, Codex SDK options, network flags, DB flags, GitHub mutation flags, browser capture flags, clipboard flags, persistence flags, promotion flags, accept flags, approval flags, merge flags, or Core decision flags.

## Validation Summary Schema

Future validation summary version:

```text
codex_former_local_adapter_validate_summary.v0.1
```

Future mode:

```text
validate-orchestration
```

Required fields:

- `summary_version`
- `mode`
- `generated_at`
- `source_input_path`
- `source_input_hash`
- `prepare_execution_summary_path`
- `prepare_execution_summary_hash`
- `helper_metadata_path`
- `helper_metadata_hash`
- `returned_envelope_path`
- `returned_envelope_hash`
- `candidate_count`
- `result_state: PASS | PASS with follow-up | BLOCKED`
- `provenance_status`
- `metadata_match`
- `source_manual_copy_packet_id`
- `source_manual_copy_packet_id_match`
- `former_input_packet_id`
- `former_input_packet_id_match`
- `prompt_hash`
- `prompt_hash_match`
- `contract_fit_status`
- `direct_validation_status`
- `candidate_compatible_review_material`
- `candidate_authority`
- `candidate_basis_quality`
- `alignment_safety_net_status`
- `alignment_counted_as_direct_success: false`
- `worker_facing_guidance_status`
- `worker_facing_guidance_advisory_only`
- `warnings`
- `pointer_warnings`
- `blocked_reasons`
- `next_safe_action`
- `candidate_material_is_review_only: true`
- `returned_candidate_treated_as_trusted_runtime_state: false`
- `authority_flags`

Authority flags must include:

```json
{
  "accepted_state_created": false,
  "review_decision_created": false,
  "db_writes": false,
  "network_calls": false,
  "provider_model_api_calls": false,
  "codex_calls": false,
  "codex_sdk_calls": false,
  "github_mutation": false,
  "core_decision": false,
  "proof_evidence_readiness_records_created": false,
  "persistence": false,
  "surface_export": false,
  "clipboard_automation": false,
  "runtime_fixture_mutation": false,
  "automatic_promotion": false
}
```

The summary must prefer hashes, counts, statuses, warning ids, and bounded excerpts over raw returned content. It must not store hidden reasoning, provider logs, secrets, raw diffs, raw review payloads, browser dumps, or raw packet content.

Validation summary must be review-only.

## Result State Semantics

### PASS

`PASS` means provenance is complete, `candidate_count` is exactly one, schema and direct validation pass, candidate-compatible review material exists, authority flags are false, unsafe material is absent, Worker-Facing Guidance is advisory-only when run, and no warnings remain.

`PASS` must not mean approval, acceptance, mergeability, product readiness, Core decision, review decision, automatic promotion, permission to persist, permission to export a surface, or permission to mutate runtime state.

### PASS with follow-up

`PASS with follow-up` means candidate-compatible review material exists, but warnings, pointer warnings, needs-review basis quality, advisory follow-up, or minor review issues remain.

`PASS with follow-up` must remain review material only. It must not create accepted state, review decisions, proof/evidence/readiness records, persistence, product readiness, mergeability, or Core decisions.

### BLOCKED

`BLOCKED` means validation could not safely produce candidate-compatible review material, or hard provenance/schema/privacy/authority checks failed.

`BLOCKED` must remain a validation result, not an automated product decision. It can carry useful findings, blocked reasons, and next safe action for human review. It must not automatically reject, retry, regenerate, promote, persist, or mutate state.

## Warning Handling

Warnings are first-class review material.

Future validation summary should preserve:

- warning source: provenance, extraction, contract fit, direct validation, alignment safety-net, Worker-Facing Guidance;
- warning kind;
- field or pointer;
- severity: info, follow_up, blocking;
- bounded message;
- whether candidate-compatible review material still exists;
- next safe action.

Non-blocking warnings may produce `PASS with follow-up`. Blocking warnings produce `BLOCKED`.

Warnings must not become trusted runtime facts. They are review annotations.

## Pointer-Warning Handling

Pointer warnings must be represented without turning pointer targets into trusted authority.

Future validation summary should include `pointer_warnings` as bounded records:

```json
{
  "warning_kind": "unknown_pointer_ref | pointer_ref_needs_review | pointer_target_unavailable",
  "pointer_ref": "pointer_ref:<bounded>",
  "pointer_semantics": "pointer_only",
  "target_material_trusted": false,
  "target_material_loaded": false,
  "candidate_material_is_review_only": true,
  "next_safe_action": "Human reviewer should inspect the pointer source manually before using this material."
}
```

The adapter must not dereference pointer targets into authority, trust pointer targets because the candidate names them, treat pointer warnings as proof, or use pointer targets to create acceptance/readiness records.

Pointer warnings may coexist with `PASS with follow-up` when candidate-compatible review material exists. Pointer warnings may produce `BLOCKED` when they break provenance, schema, safety, or reviewability.

## Candidate-Compatible Review Material

Candidate-compatible review material is the normalized output of direct local validation.

It must have `authority: non_committed`, false authority flags, pointer-only evidence semantics, privacy-safe bounded content, and basis quality suitable for human review. It is not accepted Augnes state and must not be persisted as product state by validate orchestration.

If direct validation does not produce candidate-compatible review material, result state is `BLOCKED`.

## Worker-Facing Guidance Connection

Worker-Facing Guidance may run only after direct validation produces candidate-compatible review material.

Worker-Facing Guidance is advisory-only. It may summarize next smallest useful actions, stop/defer actions, and review caveats. It must not create execution authority, accepted state, proof/evidence/readiness records, Core decisions, GitHub mutations, DB writes, network calls, clipboard actions, or automatic promotion.

If candidate-compatible review material is absent, Worker-Facing Guidance must be skipped with an explicit skipped reason.

## Future Validate Result Snapshots

Future validate result snapshots may adapt validation summary fields into read-only local snapshots for Session Panel, Capture Review Inbox, or Constellation-style inspection.

Snapshot inputs must be validation summaries, source input hashes, prepare execution summary hashes, and bounded warning metadata. Snapshots must not consume raw returned candidate content as trusted runtime state.

Potential future snapshot states:

- not_ready: validate prerequisites missing;
- waiting_for_returned_candidate: prepare is complete and no envelope is supplied;
- validate_ready: dry-run says execution prerequisites match;
- reviewable_pass: `PASS` summary exists but remains review-only;
- reviewable_pass_with_follow_up: `PASS with follow-up` summary exists and warning pressure is visible;
- blocked_validation: `BLOCKED` summary exists with blocked reasons.

Snapshots must not create accepted state, review decisions, persistence, proof/evidence/readiness records, surface export, or automatic promotion.

## Future Read-Only Validate UI

Future read-only validate UI may show validation result summaries, provenance checks, candidate count, warning pressure, pointer warnings, Worker-Facing Guidance status, and authority flags.

The future UI must remain read-only until a later accepted-state/persistence design exists.

It must not add accept, approve, promote, reject, merge, deploy, persist, export, rerun, call Codex, call provider/model, call GitHub, write DB, clipboard, or Core decision controls. It must not render raw returned candidate content, raw prompt/source packets, hidden reasoning, secrets, provider logs, browser dumps, raw diffs, or raw review payloads.

## Authority Boundary

This design preserves:

- no accepted state;
- no review decision;
- no DB;
- no network;
- no provider/model API;
- no Codex call;
- no Codex SDK;
- no GitHub mutation;
- no Core decision;
- no proof/evidence/readiness records;
- no persistence;
- no surface export;
- no clipboard automation;
- no runtime fixture mutation;
- no automatic promotion.

Validation summary is local review material only. Returned candidate content is never trusted runtime state. PASS, PASS with follow-up, and BLOCKED are validation results for a human reviewer, not product decisions.

Local validation is not a review decision, and validation output must not create review decision records.

## Browser/Computer-Use Validation Plan

Browser/computer-use validation is skipped for this design-only PR because no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture is added.

If a later PR adds future read-only validate UI, that PR should include targeted browser validation with explicit local-only traffic checks and read-only control checks.

## Verification Strategy

This design PR requires:

- `npm run typecheck`
- `npm run smoke:perspective-codex-former-local-adapter-validate-orchestration-design`
- `git diff --check`
- `git diff --cached --check`

A later implementation PR should additionally test local dry-run, local execution, candidate_count zero/multiple blocking, provenance mismatch blocking, prompt_hash mismatch blocking, source_manual_copy_packet_id mismatch blocking, former_input_packet_id mismatch blocking, pointer warning preservation, Worker-Facing Guidance skip/run behavior, summary schema validation, and authority-denylist regressions.

## Recommended Next PR

Implement local Codex adapter validate orchestration dry-run only.

That future PR should still avoid validate execution, UI, persistence, DB, network, provider/model, Codex, GitHub mutation, accepted state, review decision, proof/evidence/readiness records, surface export, clipboard automation, runtime fixture mutation, and automatic promotion unless explicitly rescoped.
