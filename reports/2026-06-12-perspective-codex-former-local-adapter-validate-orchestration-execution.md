# Local Codex Adapter Validate Orchestration Execution Report

Date: 2026-06-12

## Summary

This PR implements local Codex adapter validate orchestration execution after merged PR #523. The execution path repeats the current dry-run checks, optionally rejects stale dry-run summaries, extracts exactly one existing-validator-compatible `codex_perspective_candidate_draft.v0.1` / `codex_perspective_candidate_draft`, rebuilds the former input packet from local source input, runs local contract-fit evaluation, runs direct candidate validation, runs schema alignment only as a safety-net comparison, runs Worker-Facing Guidance only after candidate-compatible review material exists, and writes a bounded review-only validation summary.

The CLI now supports:

```bash
npm run perspective:codex-former:local-adapter:validate -- --execute --source-input <path> --prepare-execution-summary <path> --returned-envelope <path> --validation-summary-out <path>
```

It also supports optional dry-run summary equivalence:

```bash
npm run perspective:codex-former:local-adapter:validate -- --execute --source-input <path> --prepare-execution-summary <path> --returned-envelope <path> --dry-run-summary <path> --validation-summary-out <path>
```

Existing `--dry-run` behavior remains in place. `--dry-run` and `--execute` are mutually exclusive. Omitting both flags fails. Unknown flags fail. No command override flags were added.

## What Execution Runs

- Local file reads for source input, prepare execution summary, returned envelope, optional dry-run summary, and optional local prompt artifact bytes.
- Current dry-run-equivalent provenance and schema checks.
- Source input validation with the existing local adapter source input validator.
- Local former input packet rebuild through `buildPerspectiveFormationInputBundle` and `buildCodexPerspectiveFormerInputPacket`.
- Local contract-fit evaluation through `evaluateCodexPerspectiveCandidateDraftPromptContractFit`.
- Local direct validation through `validateAndNormalizeCodexPerspectiveCandidateDraft`.
- Local schema-alignment safety-net comparison through `alignCodexPerspectiveCandidateDraftSchemaFromModelOutput`.
- Local Worker-Facing Guidance through `buildWorkerFacingPerspectiveGuidanceFromCandidate` only after candidate-compatible review material exists.

## What Execution Does Not Run

The implementation does not run validate helper execution or the capture helper validate API. It does not call Codex, the Codex SDK, provider/model APIs, network, GitHub mutation, DB, browser, clipboard, Core systems, accepted-state writers, review-decision writers, proof/evidence/readiness writers, persistence, surface export, runtime fixture mutation, automatic promotion, approval, merge, or deploy behavior.

## Result States

`PASS` means current local inputs validated cleanly into candidate-compatible review material with no warnings or pointer warnings. PASS does not mean approval, acceptance, mergeability, product readiness, Core decision, review decision, automatic promotion, persistence permission, surface export permission, or runtime mutation permission.

`PASS with follow-up` means candidate-compatible review material exists but warnings, pointer warnings, needs-review basis quality, advisory follow-up, or minor review issues remain. It remains review material only.

`BLOCKED` means validation could not safely produce candidate-compatible review material, or a hard provenance, schema, privacy, authority, candidate-count, contract-fit, direct-validation, unsafe-material, or guidance-boundary check failed. It is a validation result, not an automated product decision or rejection record.

## Provenance And Hashes

Execution keeps `source_prompt_hash` / `copyable_prompt_hash` separate from `prompt_file_sha256`.

- `source_prompt_hash` is envelope/helper metadata provenance.
- source_prompt_hash is envelope/helper metadata provenance.
- `prompt_file_sha256` is a prompt artifact byte hash and is compared only when the local prompt artifact is available.
- prompt_file_sha256 is a prompt artifact byte hash.
- `candidate.source_former_input_packet.packet_id` must match the envelope `source_former_input_packet_id`, helper prepare provenance, and the rebuilt former input packet id.
- `source_manual_copy_packet_id` must match prepare helper provenance.

## Fixtures

Committed fixtures cover:

- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass-with-follow-up.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-blocked.json`

The PASS fixture uses a bounded source/prepare/envelope set with ready local validation basis. The PASS with follow-up fixture uses the existing ready returned envelope with deterministic prepare provenance and naturally yields needs-review warning pressure. The BLOCKED fixture uses a malformed `evidence_pointer_refs` item and proves the CLI writes a bounded summary instead of throwing.

## Smoke Coverage

The execution smoke covers:

- package script registration;
- required docs, report, fixtures, lib, CLI, and smoke files;
- PASS, PASS with follow-up, and BLOCKED fixture summaries;
- stale supplied dry-run summary rejection;
- source/prepare/envelope hash mismatch versus dry-run summary;
- candidate count zero and multiple;
- valid candidate plus wrong-shape extra object;
- unsupported `draft_version` / `draft_kind`;
- malformed `evidence_pointer_refs` item;
- non-`pointer_only` pointer warning pressure without a crash;
- `source_manual_copy_packet_id`, former input packet id, `source_prompt_hash`, and comparable `prompt_file_sha256` mismatches;
- contract-fit hard violation;
- direct validation blocked;
- Worker-Facing Guidance skipped when candidate-compatible review material is absent;
- Worker-Facing Guidance advisory-only when run;
- authority flag drift;
- `validate_helper_executed` remains false;
- `--dry-run` still works after adding `--execute`;
- `--dry-run` and `--execute` together fail;
- neither `--dry-run` nor `--execute` fails;
- forbidden runtime surfaces are not introduced;
- changed-file boundary remains within lib/CLI/smoke/docs/report/fixtures/package scope.

## Browser And Computer-Use

Browser/computer-use validation is skipped because this PR adds no UI, route, browser-visible surface, clipboard automation, browser capture, or runtime fixture mutation.

## Caveats

Returned candidate content remains untrusted input and is not stored as runtime state. Schema alignment is reported only as a safety-net comparison and `alignment_counted_as_direct_success` remains false. Worker-Facing Guidance is advisory-only and cannot grant authority.

## Recommended Next PR

Prepare validate result snapshots, or harden validate execution once only if this execution surface reveals concrete safety gaps.
