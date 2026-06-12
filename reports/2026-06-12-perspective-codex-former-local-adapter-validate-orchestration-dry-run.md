# Perspective Codex Former Local Adapter Validate Orchestration Dry-Run

## Summary

This PR implements local Codex adapter validate orchestration dry-run mode.

The dry-run loads only local source input, prepare execution summary, and returned candidate envelope files. It computes hashes, checks envelope bounds, validates provenance fields, extracts existing-validator-compatible candidate drafts, enforces the exactly-one candidate rule for readiness, reports planned validation steps, reports Worker-Facing Guidance eligibility without running it, and writes a bounded dry-run summary.

It implements only `--dry-run`. It does not implement validate `--execute`.

## Why Follows PR #522

PR #522 merged the validate orchestration design contract. This PR implements the first local adapter mode from that design while preserving the dry-run versus execution boundary.

## Implemented Files

- `lib/perspective-ingest/codex-former-local-adapter-validate-orchestration.ts`
- `scripts/perspective-codex-former-local-adapter-validate-orchestration.mjs`
- `scripts/smoke-perspective-codex-former-local-adapter-validate-orchestration-dry-run.mjs`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_ORCHESTRATION_DRY_RUN_V0_1.md`
- `reports/2026-06-12-perspective-codex-former-local-adapter-validate-orchestration-dry-run.md`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-dry-run-summary-ready.json`
- `package.json`

## Dry-Run Versus Execution Boundary

Dry-run parses local files, computes hashes, checks provenance and candidate shape, and reports readiness. It does not run validate helper execution, direct candidate validation, contract-fit evaluation, schema alignment, Worker-Facing Guidance, Codex, provider/model APIs, GitHub mutation, network, DB, UI, clipboard, persistence, accepted state, review decisions, proof/evidence/readiness records, surface export, automatic promotion, or Core decisions.

Dry-run result names are limited to:

- `ready_for_validate_execution`
- `blocked_before_validate_execution`
- `warnings_before_validate_execution`

Final validation states PASS, PASS with follow-up, and BLOCKED are not used as dry-run results.

## Candidate And Provenance Contract

The dry-run enforces the exactly-one candidate rule. Candidate_count is based on existing-validator-compatible `codex_perspective_candidate_draft.v0.1` / `codex_perspective_candidate_draft` objects.

The candidate shape requires `source_former_input_packet`, `thesis`, `selected_material`, `evidence_pointer_refs`, `unresolved_tensions`, `basis_quality_suggestion`, `next_action_candidates`, `user_core_decision_questions`, `qualification_notes`, `privacy_flags`, `authority_flags`, and `forbidden_actions`.

`candidate.source_former_input_packet.packet_id` must match envelope `source_former_input_packet_id` and helper/source former input packet provenance.

source_prompt_hash is envelope/helper metadata provenance. prompt_file_sha256 is prompt artifact byte hash. The dry-run keeps source_prompt_hash/copyable_prompt_hash separate from prompt_file_sha256.

## Dry-Run Summary

The summary version is `codex_former_local_adapter_validate_dry_run_summary.v0.1`.

The mode is `validate-orchestration-dry-run`.

The summary includes source input hash, prepare execution summary hash, returned envelope hash, candidate_count, dry_run_result, provenance status, metadata match status, source_manual_copy_packet_id match, former_input_packet_id match, source_prompt_hash match, prompt_file_sha256 match, candidate shape status, direct-validation prerequisite status, planned validation steps, Worker-Facing Guidance eligibility, warnings, pointer warnings, blocked reasons, next safe action, review-only flags, returned-candidate-trust boundary, and authority flags.

## Smoke Coverage

The dry-run smoke covers:

- ready happy path;
- missing returned envelope;
- missing `RETURNED_CODEX_RESPONSE` bounds;
- candidate_count zero;
- candidate_count multiple;
- unsupported draft_version or draft_kind;
- candidate missing required fields;
- candidate.source_former_input_packet.packet_id mismatch;
- source_manual_copy_packet_id mismatch;
- source_prompt_hash mismatch;
- prompt_file_sha256 comparable match and mismatch;
- prepare execution summary wrong mode;
- source input hash mismatch;
- authority flag drift;
- validate_helper_executed remains false;
- forbidden behavior strings/runtime surfaces not introduced;
- changed-file boundary.

## Authority Boundary

Authority flags remain false for accepted state, review decision, DB writes, network calls, provider/model API calls, Codex calls, Codex SDK calls, GitHub mutation, Core decision, proof/evidence/readiness records, persistence, surface export, clipboard automation, runtime fixture mutation, automatic promotion, and validate_helper_executed.

## Verification

Passed:

- `npm run typecheck`
- `npm run perspective:codex-former:local-adapter:validate -- --dry-run --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --prepare-execution-summary reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json --returned-envelope reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt --validation-summary-out /tmp/augnes-codex-former-local-adapter-validate-dry-run-summary.json`
- `npm run smoke:perspective-codex-former-local-adapter-validate-orchestration-dry-run`
- `git diff --check`
- `git diff --cached --check`

## Skipped Browser/Computer-Use Checks

Browser/computer-use validation is skipped because this PR adds no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture.

## Caveats

- Validate execution remains future work.
- Worker-Facing Guidance is not run; eligibility is only planned or skipped.
- The returned candidate is never trusted runtime state.
- The dry-run summary is review-only and not a final validation result.

## Recommended Next PR

Implement local Codex adapter validate orchestration execution.
