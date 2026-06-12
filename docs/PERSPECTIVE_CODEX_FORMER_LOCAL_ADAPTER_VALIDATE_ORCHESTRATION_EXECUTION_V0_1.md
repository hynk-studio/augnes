# Local Codex Adapter Validate Orchestration Execution v0.1

## Why Follows PR #523

PR #523 merged the local validate orchestration dry-run. That slice proved local file parsing, returned envelope provenance checks, exactly-one returned candidate semantics, existing-validator-compatible candidate draft shape checks, malformed pointer blocking, pointer warning preservation, and bounded dry-run summaries.

This slice implements the next local-only step: `validate-orchestration` execution. It consumes the same local source input, prepare execution summary, returned candidate envelope, and optionally a matching dry-run summary, then runs local in-process validation libraries to produce one bounded review-only validation summary.

## Execution Versus Dry-Run Boundary

Dry-run mode still stops before direct validation. It answers whether the current local files are ready to be validated.

Execution mode repeats the dry-run-equivalent checks against the current files, rejects stale optional dry-run summaries, extracts exactly one returned JSON object, requires exactly one existing-validator-compatible `codex_perspective_candidate_draft.v0.1` / `codex_perspective_candidate_draft`, and only then runs local contract-fit, direct validation, schema-alignment safety-net comparison, and Worker-Facing Guidance.

Execution mode is still local review-only validation. It is not validate helper execution and does not call the capture helper validate API.

## Local Execution Runs

The execution path uses direct local library calls:

- `buildPerspectiveFormationInputBundle`
- `buildCodexPerspectiveFormerInputPacket`
- `evaluateCodexPerspectiveCandidateDraftPromptContractFit`
- `validateAndNormalizeCodexPerspectiveCandidateDraft`
- `alignCodexPerspectiveCandidateDraftSchemaFromModelOutput`
- `buildWorkerFacingPerspectiveGuidanceFromCandidate`

The order is fixed:

1. Load and parse local files only.
2. Compute source input, prepare execution summary, returned envelope, and optional dry-run summary hashes.
3. Rebuild a current dry-run-equivalent summary and block on stale supplied dry-run summaries.
4. Parse returned envelope provenance only from the header before `RETURNED_CODEX_RESPONSE`.
5. Extract exactly one returned JSON object and exactly one existing-validator-compatible candidate draft.
6. Rebuild the former input packet from the local source input flow.
7. Run contract-fit evaluation.
8. Run direct candidate validation.
9. Run schema alignment only as a safety-net comparison.
10. Run Worker-Facing Guidance only after candidate-compatible review material exists.
11. Write a bounded review-only validation summary.

## Local Execution Does Not Run

Execution does not call Codex, the Codex SDK, provider/model APIs, network, GitHub mutation, DB, browser, clipboard, Core systems, accepted-state writers, review-decision writers, proof/evidence/readiness writers, persistence, surface export, runtime fixture mutation, automatic promotion, approval, merge, deploy, or the capture helper validate CLI.

Returned candidate content is not trusted runtime state. It is treated as untrusted local input for validation and summarized only through bounded status, warning, provenance, and authority fields.

## Candidate Shape

The returned JSON object must be compatible with the existing local candidate draft validator. Required fields include:

- `draft_version: "codex_perspective_candidate_draft.v0.1"`
- `draft_kind: "codex_perspective_candidate_draft"`
- `source_former_input_packet`
- `thesis`
- `selected_material`
- `evidence_pointer_refs`
- `unresolved_tensions`
- `basis_quality_suggestion`
- `next_action_candidates`
- `user_core_decision_questions`
- `qualification_notes`
- `privacy_flags`
- `authority_flags`
- `forbidden_actions`

Each `evidence_pointer_refs` item must be an object with non-empty `pointer_kind` and `ref`. Non-`pointer_only` semantics remain pointer warnings when the item is object-shaped; malformed pointer items block before validation execution.

## Provenance Matching

The envelope header must provide `source_manual_copy_packet_id`, `source_former_input_packet_id`, and `source_prompt_hash`. These are envelope/helper metadata provenance fields, not trusted candidate draft fields.

Execution verifies:

- `source_manual_copy_packet_id` matches prepare helper provenance.
- `candidate.source_former_input_packet.packet_id` matches `envelope.source_former_input_packet_id`.
- The rebuilt former input packet id from local source input matches envelope and prepare provenance.
- `source_prompt_hash` matches prepare helper metadata `metadata_source_prompt_hash` or `copyable_prompt_hash`.
- source_prompt_hash is envelope/helper metadata provenance.
- `source_prompt_hash` / `copyable_prompt_hash` remain distinct from `prompt_file_sha256`.
- `prompt_file_sha256` compares to local prompt artifact bytes only when a local prompt artifact is available; otherwise it is `not_present` or `not_comparable`.
- prompt_file_sha256 is a prompt artifact byte hash.

## Dry-Run Summary Equivalence

`--dry-run-summary <path>` is optional for execution. When supplied, execution computes the dry-run summary file hash and compares the supplied dry-run summary against current local inputs.

Stale dry-run summaries block execution when version, mode, source input hash, prepare execution summary hash, returned envelope hash, candidate count, dry-run result, candidate shape status, provenance ids, prompt hash, or provenance match fields do not match the current dry-run-equivalent result.

## Validation Summary Schema

The bounded execution summary uses:

```json
{
  "summary_version": "codex_former_local_adapter_validate_summary.v0.1",
  "mode": "validate-orchestration",
  "generated_at": "string",
  "source_input_path": "string",
  "source_input_hash": "sha256",
  "prepare_execution_summary_path": "string",
  "prepare_execution_summary_hash": "sha256",
  "dry_run_summary_path": "string|null",
  "dry_run_summary_hash": "sha256|null",
  "returned_envelope_path": "string",
  "returned_envelope_hash": "sha256",
  "candidate_count": 1,
  "result_state": "PASS | PASS with follow-up | BLOCKED",
  "execution_result": "success | blocked | failed",
  "failure_kind": "string|null",
  "provenance_status": "complete | blocked",
  "metadata_match": true,
  "source_manual_copy_packet_id": "string|null",
  "source_manual_copy_packet_id_match": true,
  "former_input_packet_id": "string|null",
  "former_input_packet_id_match": true,
  "source_prompt_hash": "string|null",
  "source_prompt_hash_match": true,
  "prompt_file_sha256": "string|null",
  "prompt_file_sha256_match": "true|false|not_present|not_comparable",
  "candidate_shape_status": "existing_validator_compatible | missing_candidate | multiple_candidates | wrong_shape | unparsable",
  "contract_fit_status": "fits_contract | needs_review | violates_contract | not_run",
  "contract_fit_warning_count": 0,
  "direct_validation_status": "ready_for_review | needs_review | blocked | not_run",
  "candidate_compatible_review_material": true,
  "candidate_authority": "non_committed|null",
  "candidate_basis_quality": "sufficient_for_review | needs_review | blocked | null",
  "alignment_safety_net_status": "aligned | needs_review | blocked | not_run",
  "alignment_counted_as_direct_success": false,
  "worker_facing_guidance_status": "actionable_advisory | resolve_gaps_first | stop_or_defer | skipped_candidate_compatible_review_material_absent | skipped_blocked_candidate | not_run",
  "worker_facing_guidance_advisory_only": true,
  "warnings": [],
  "pointer_warnings": [],
  "blocked_reasons": [],
  "next_safe_action": "string",
  "candidate_material_is_review_only": true,
  "returned_candidate_treated_as_trusted_runtime_state": false,
  "authority_flags": {},
  "validate_orchestration_execute_ran": true,
  "contract_fit_evaluation_ran": true,
  "direct_candidate_validation_ran": true,
  "schema_alignment_safety_net_ran": true,
  "worker_facing_guidance_ran": true
}
```

## Result States

`PASS` means local validation produced candidate-compatible review material without warnings, pointer warnings, hard contract violations, direct validation blockers, or Worker-Facing Guidance advisory-boundary failures. PASS does not mean approval, acceptance, mergeability, product readiness, Core decision, review decision, automatic promotion, persistence permission, surface export permission, runtime mutation permission, or permission to treat returned candidate content as trusted state.

`PASS with follow-up` means candidate-compatible review material exists and no hard provenance/schema/privacy/authority blocker remains, but warnings, pointer warnings, needs-review basis quality, advisory follow-up, or minor review issues remain. It remains review material only.

`BLOCKED` means validation cannot safely produce candidate-compatible review material or a hard provenance, schema, privacy, authority, candidate-count, contract-fit, direct-validation, unsafe-material, or guidance-boundary check failed. `BLOCKED` is a validation result, not an automated product decision, rejection record, retry command, regeneration command, promotion, persistence write, runtime mutation, or review decision.

## Worker-Facing Guidance

Worker-Facing Guidance runs only after direct validation produces candidate-compatible review material. The output is advisory-only. It must preserve no-Codex, no-authority, no-persistence, no-proof/evidence/readiness, no-review-decision, no-GitHub-mutation, and no-Core-decision semantics.

If candidate-compatible review material is absent, guidance is skipped with an explicit reason. Guidance is not run for blocked candidates.

## Authority Boundary

All authority flags remain false:

- `accepted_state_created`
- `review_decision_created`
- `db_writes`
- `network_calls`
- `provider_model_api_calls`
- `codex_calls`
- `codex_sdk_calls`
- `github_mutation`
- `core_decision`
- `proof_evidence_readiness_records_created`
- `persistence`
- `surface_export`
- `clipboard_automation`
- `runtime_fixture_mutation`
- `automatic_promotion`
- `validate_helper_executed`

Operational fields such as `validate_orchestration_execute_ran`, `contract_fit_evaluation_ran`, `direct_candidate_validation_ran`, `schema_alignment_safety_net_ran`, and `worker_facing_guidance_ran` are provenance only. They do not imply accepted state, persistence, product readiness, review decision, or Core decision.

## Fixtures

Deterministic committed fixtures cover:

- `PASS`: local ready source/prepare/envelope fixture with sufficient review basis.
- `PASS with follow-up`: existing ready returned envelope with deterministic prepare provenance and needs-review warning pressure.
- `BLOCKED`: malformed pointer envelope that blocks before direct validation and still writes a bounded summary.

## Skipped Browser/Computer-Use Checks

Browser and computer-use validation are intentionally skipped because this PR adds no UI, route, browser-visible surface, clipboard automation, browser capture, or runtime fixture mutation.

## Recommended Next PR

Prepare validate result snapshots, or harden validate execution once only if this execution surface reveals concrete safety gaps.
