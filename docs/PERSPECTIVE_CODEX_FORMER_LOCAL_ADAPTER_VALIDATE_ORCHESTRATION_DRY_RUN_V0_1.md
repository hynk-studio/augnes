# Perspective Codex Former Local Adapter Validate Orchestration Dry-Run v0.1

## Purpose

This implementation adds local Codex adapter validate orchestration dry-run mode.

The dry-run consumes only local files:

- source input JSON;
- prepare execution summary JSON;
- returned candidate envelope text.

It computes hashes, checks returned envelope bounds and provenance, extracts existing-validator-compatible candidate draft objects without trusting returned content as runtime state, enforces exactly one candidate for readiness, and writes a bounded dry-run summary when requested.

This PR implements only `--dry-run`. It does not implement validate `--execute`, run validate helper execution, call Codex, use Codex SDK, call provider/model APIs, mutate GitHub from runtime behavior, use network, write DB, create accepted state, create review decisions, create proof/evidence/readiness records, persist validation state, export surfaces, automate clipboard, mutate runtime fixtures, add UI/routes/browser-visible surfaces, create final PASS/PASS with follow-up/BLOCKED validation summaries, approve, merge, deploy, or make Core decisions.

## Why Follows PR #522

PR #522 merged the design-only contract for local Codex adapter validate orchestration. That design established the returned envelope contract, exactly-one candidate rule, existing-validator-compatible candidate shape, source_prompt_hash versus prompt_file_sha256 distinction, review-only validation summary boundary, and future dry-run/execution split.

This slice implements the first local adapter mode from that design: dry-run only.

## Dry-Run Versus Execution Boundary

Dry-run may:

- load and parse local files;
- compute source input, prepare execution summary, and returned envelope hashes;
- parse returned envelope bounds;
- check provenance fields;
- extract candidate-looking JSON objects;
- count existing-validator-compatible candidate drafts;
- check candidate source former input packet id matching;
- check source_manual_copy_packet_id, source_prompt_hash, and prompt_file_sha256 provenance when comparable;
- report planned direct validation steps;
- report Worker-Facing Guidance eligibility;
- write a bounded dry-run summary.

Dry-run must not:

- run validate helper execution;
- call `validateCodexFormerCapture`;
- run direct candidate validation;
- run contract-fit evaluation;
- run schema alignment;
- run Worker-Facing Guidance;
- produce final PASS, PASS with follow-up, or BLOCKED validation result states.

Allowed dry-run result names are:

- `ready_for_validate_execution`;
- `blocked_before_validate_execution`;
- `warnings_before_validate_execution`.

## CLI

```bash
npm run perspective:codex-former:local-adapter:validate -- --dry-run --source-input <path> --prepare-execution-summary <path> --returned-envelope <path> --validation-summary-out <path>
```

`--execute` is explicitly rejected in this slice.

## Exactly-One Candidate Rule

Dry-run extracts balanced JSON objects from `RETURNED_CODEX_RESPONSE` bounds.

`candidate_count` counts existing-validator-compatible `codex_perspective_candidate_draft.v0.1` objects only.

Readiness requires exactly one parsed JSON object and exactly one existing-validator-compatible candidate draft.

The dry-run reports `blocked_before_validate_execution` when candidate_count is zero, multiple, unknown, unparsable, or wrong shape. It also blocks ambiguous multiple-object returned material, including the case where one object is compatible and another parsed object is wrong shape. It does not choose a best candidate, merge candidate objects, discard extras, retry with Codex, or run model/provider regeneration.

## Existing-Validator-Compatible Candidate Draft Shape

The candidate object must match the local `CodexPerspectiveCandidateDraftV0` validator shape:

- `draft_version: codex_perspective_candidate_draft.v0.1`;
- `draft_kind: codex_perspective_candidate_draft`;
- `source_former_input_packet`;
- `thesis`;
- `selected_material`;
- `evidence_pointer_refs`;
- `unresolved_tensions`;
- `basis_quality_suggestion`;
- `next_action_candidates`;
- `user_core_decision_questions`;
- `qualification_notes`;
- `privacy_flags`;
- `authority_flags`;
- `forbidden_actions`.

The dry-run requires `candidate.source_former_input_packet.packet_id` to match the envelope `source_former_input_packet_id` and helper/source former input packet provenance.

The dry-run also checks nested runtime-shape prerequisites aligned with the existing validator, including `source_former_input_packet.packet_version`, `source_former_input_packet.packet_id`, `source_former_input_packet.role`, `selected_material.changed_files`, `selected_material.source_pr_refs`, `basis_quality_suggestion.status`, and `basis_quality_suggestion.reasons`.

`source_manual_copy_packet_id` and `source_prompt_hash` are envelope/helper metadata provenance fields, not required candidate draft fields.

## source_prompt_hash versus prompt_file_sha256

source_prompt_hash is envelope/helper metadata provenance.

prompt_file_sha256 is prompt artifact byte hash.

`source_prompt_hash` is compared against helper metadata `metadata_source_prompt_hash`, `source_prompt_hash`, or `copyable_prompt_hash` when present.

`prompt_file_sha256` is compared against local prompt artifact bytes only when the prepare execution summary points to an available local prompt file. If the prompt file is not available, the dry-run records `prompt_file_sha256_match: not_comparable` without turning that into acceptance or trust.

## Provenance Matching Behavior

The dry-run verifies:

- prepare execution summary mode is `prepare-orchestration-execution`;
- prepare execution summary version is `codex_former_local_adapter_prepare_execution_summary.v0.1`;
- prepare output discovery is complete;
- source input hash matches prepare execution summary `source_input_hash`;
- returned envelope has the expected header and response bounds;
- header provenance fields are parsed only from the header/preamble before `RETURNED_CODEX_RESPONSE`;
- returned response content cannot supply or repair missing header provenance fields;
- envelope `capture_method` is `human_manual`;
- envelope `codex_surface_label` is `separate user-started Codex session`;
- envelope `prompt_was_generated_by_manual_copy_packet` is true;
- envelope source ids and prompt hash are present and not `not_supplied_in_chat`;
- source_manual_copy_packet_id matches helper output refs when available;
- former_input_packet_id matches candidate and helper output refs when available;
- source_prompt_hash matches helper metadata when available;
- prompt_file_sha256 matches prompt artifact bytes when comparable;
- authority flags do not drift;
- validate_helper_executed remains false.

Returned candidate content is never trusted runtime state. Candidate shape and provenance checks only decide dry-run readiness.

## Planned Direct Validation Steps

The dry-run summary lists planned validation steps for a future execution PR:

- parse returned envelope bounds;
- extract exactly one existing-validator-compatible candidate;
- verify source_manual_copy_packet_id, former_input_packet_id, source_prompt_hash, and prompt_file_sha256 provenance;
- run contract-fit evaluation during validate execution;
- run direct candidate validation during validate execution;
- run schema alignment only as a safety-net comparison during validate execution.

The dry-run reports whether direct validation prerequisites are present or missing, but it does not produce final validation results.

## Worker-Facing Guidance Eligibility

Worker-Facing Guidance Eligibility is reported as planned or skipped.

When dry-run prerequisites are present, the summary reports:

```text
planned_after_direct_validation
```

When prerequisites are missing, the summary reports:

```text
skipped_until_candidate_compatible_review_material
```

Worker-Facing Guidance is not run in this dry-run slice.

## Dry-Run Summary

Summary version:

```text
codex_former_local_adapter_validate_dry_run_summary.v0.1
```

Mode:

```text
validate-orchestration-dry-run
```

The summary includes:

- source input path and hash;
- prepare execution summary path and hash;
- returned envelope path and hash;
- candidate_count;
- dry_run_result;
- provenance_status;
- metadata_match;
- source_manual_copy_packet_id and match status;
- former_input_packet_id and match status;
- source_prompt_hash and match status;
- prompt_file_sha256 and match status;
- candidate_shape_status;
- direct_validation_prerequisites_status;
- planned_validation_steps;
- worker_facing_guidance_eligibility;
- warnings;
- pointer_warnings;
- blocked_reasons;
- next_safe_action;
- `candidate_material_is_review_only: true`;
- `returned_candidate_treated_as_trusted_runtime_state: false`;
- authority flags.

## Authority Boundary

Authority flags remain false:

- accepted_state_created;
- review_decision_created;
- db_writes;
- network_calls;
- provider_model_api_calls;
- codex_calls;
- codex_sdk_calls;
- github_mutation;
- core_decision;
- proof_evidence_readiness_records_created;
- persistence;
- surface_export;
- clipboard_automation;
- runtime_fixture_mutation;
- automatic_promotion;
- validate_helper_executed.

Prepare helper execution may appear in upstream prepare execution provenance, but validate dry-run itself does not execute helpers.

## Fixtures

This PR adds:

- `reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt`;
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-dry-run-summary-ready.json`.

The returned envelope fixture contains exactly one bounded existing-validator-compatible candidate draft. It does not include raw prompt text, raw source packet, hidden reasoning, provider logs, secrets, raw diffs, raw review payloads, browser dumps, cookies, tokens, or private material.

## Skipped Browser/Computer-Use Checks

Browser/computer-use validation is skipped because this PR adds no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture.

No local dev server is needed.

## Verification

Required:

- `npm run typecheck`;
- `npm run perspective:codex-former:local-adapter:validate -- --dry-run --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --prepare-execution-summary reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json --returned-envelope reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt --validation-summary-out /tmp/augnes-codex-former-local-adapter-validate-dry-run-summary.json`;
- `npm run smoke:perspective-codex-former-local-adapter-validate-orchestration-dry-run`;
- `git diff --check`;
- `git diff --cached --check`.

## Recommended Next PR

Implement local Codex adapter validate orchestration execution.
