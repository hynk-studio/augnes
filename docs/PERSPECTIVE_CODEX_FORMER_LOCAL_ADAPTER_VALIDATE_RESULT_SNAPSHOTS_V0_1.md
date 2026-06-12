# Local Codex Adapter Validate Result Snapshots v0.1

## Why This Follows PR #524

PR #524 added local-only validate orchestration execution for exactly one returned Codex candidate envelope. It produced deterministic `PASS`, `PASS with follow-up`, and `BLOCKED` execution summary fixtures while preserving dry-run behavior and the review-only authority boundary.

This slice prepares the next local-only layer: validate result snapshots. The snapshots consume the committed PR #524 execution summary fixtures and project them into deterministic, read-only fixture contracts for future Session Panel, Capture Review Inbox, and read-only validate result UI surfaces.

## What Validate Result Snapshots Are

Validate result snapshots are bounded local JSON fixtures derived from validation summaries. They are designed to let later read-only surfaces render validation state without re-running validate execution, mutating runtime fixtures, calling providers, or promoting review material.

The snapshot set contains:

- three Session Panel snapshots for `PASS`, `PASS with follow-up`, and `BLOCKED`;
- three Capture Review Inbox item snapshots for the same states;
- one snapshot summary that records inputs, output hashes, covered result states, covered surfaces, authority boundary, future UI path, and later browser validation requirement.

The generator command is:

```bash
npm run perspective:codex-former:local-adapter:validate-result-snapshots -- --pass-summary <path> --pass-with-follow-up-summary <path> --blocked-summary <path> --out-dir <path> --generated-at <iso>
```

## What They Are Not

Validate result snapshots are not UI, routes, browser-visible surfaces, persistence, DB writes, accepted Augnes state, review decisions, proof/evidence/readiness records, surface exports, runtime/product state, clipboard automation, provider/model API calls, Codex calls, Codex SDK calls, GitHub mutations, Core decisions, automatic promotion, approval, merge, or deploy behavior.

Returned candidate content remains untrusted source material from a prior local validation summary. The snapshots expose only bounded review fields, counts, hashes, caveats, and false authority flags.

## Snapshot States

Session Panel scenario ids:

- `validation-pass`
- `validation-pass-with-follow-up`
- `validation-blocked`

Inbox item ids:

- `local-adapter-validation-pass`
- `local-adapter-validation-pass-with-follow-up`
- `local-adapter-validation-blocked`

Snapshot status labels:

- `PASS, review-only`
- `PASS with follow-up, review-only`
- `BLOCKED, review-only finding`

## Read-Only Result Semantics

`PASS` is review-only and not approval. It does not mean acceptance, mergeability, product readiness, review decision, persistence permission, surface export permission, runtime mutation permission, Core decision, automatic promotion, or trusted runtime state.

`PASS with follow-up` is review-only and not acceptance. It means candidate-compatible review material exists, but warning or follow-up pressure remains. It remains review material only.

`BLOCKED` is a validation result, not automated rejection. It means validation could not safely produce candidate-compatible review material or a hard validation boundary failed. It is not a product decision, rejection record, retry command, regeneration command, promotion, persistence write, runtime mutation, or review decision.

PASS with follow-up is review-only and not acceptance. BLOCKED is a validation result, not automated rejection.

No state creates accepted Augnes state. No state creates review decisions. No state creates proof/evidence/readiness records. No state creates persistence. No state creates runtime/product state. No state creates surface export. No state creates GitHub, provider/model, Codex, Codex SDK, DB, network, clipboard, or Core authority.

## Session Panel Snapshot Contract

Each Session Panel snapshot exposes compact fields only:

```json
{
  "scenario_id": "validation-pass",
  "result_state": "PASS",
  "primary_status": "PASS, review-only",
  "caveat": "PASS is review-only and not approval, acceptance, mergeability, product readiness, persistence, or Core decision.",
  "next_safe_action": "string",
  "candidate_count": 1,
  "candidate_shape_status": "existing_validator_compatible",
  "contract_fit_status": "fits_contract",
  "direct_validation_status": "ready_for_review",
  "candidate_compatible_review_material": true,
  "candidate_authority": "non_committed",
  "candidate_basis_quality": "sufficient_for_review",
  "worker_facing_guidance_status": "actionable_advisory",
  "worker_facing_guidance_advisory_only": true,
  "warning_count": 0,
  "pointer_warning_count": 0,
  "blocked_reason_count": 0,
  "validation_summary_path": "reports/fixtures/example.json",
  "validation_summary_hash": "sha256",
  "source_input_hash": "sha256",
  "prepare_execution_summary_hash": "sha256",
  "returned_envelope_hash": "sha256",
  "authority_flags": {},
  "review_only": true,
  "accepted_state": false,
  "review_decision_created": false,
  "product_readiness_created": false,
  "constellation_handoff_available": false,
  "runtime_handoff_available": false
}
```

## Capture Review Inbox Snapshot Contract

Each inbox item exposes compact fields only:

```json
{
  "item_id": "local-adapter-validation-pass",
  "title": "Validate result: PASS",
  "stage": "validate_result_snapshot",
  "reviewability": "reviewable",
  "result_state": "PASS",
  "candidate_count": 1,
  "warning_count": 0,
  "pointer_warning_count": 0,
  "blocked_reason_count": 0,
  "badges": ["review-only", "PASS"],
  "summary_line": "PASS, review-only; candidate_count=1; warnings=0; blocked_reasons=0.",
  "caveat": "string",
  "next_safe_action": "string",
  "safe_links": {},
  "authority_tags": [],
  "validation_summary_path": "reports/fixtures/example.json",
  "validation_summary_hash": "sha256",
  "review_candidate_available": true,
  "worker_guidance_available": true,
  "accepted_state": false,
  "review_decision_created": false,
  "review_only": true
}
```

The `safe_links` object may point to the local validation summary fixture. Future read-only validate result UI and runtime handoff links remain unavailable in this snapshot PR.

## Reviewability Mapping

The reviewability mapping is:

- `PASS` -> `reviewable`
- `PASS with follow-up` -> `reviewable_with_follow_up`
- `BLOCKED` -> `blocked`

`reviewable` does not mean accepted, approved, persisted, product-ready, mergeable, or Core-decided. It means the local snapshot can be reviewed as bounded material in a future read-only surface.

## Snapshot Summary Contract

The summary fixture includes:

- `summary_version`
- `mode: validate-result-snapshots`
- `generated_at`
- input summary paths and hashes
- emitted snapshot paths and hashes
- covered result states
- covered surfaces
- `candidate_count_by_state`
- `warning_count_by_state`
- `blocked_reason_count_by_state`
- authority boundary
- future UI path
- browser validation requirement for the later UI PR

The summary covers Session Panel, Capture Review Inbox, and future read-only validate result UI. It does not make those surfaces available.

## Validation And Rejection Behavior

The snapshot builder rejects:

- unsupported validate summary version;
- unsupported mode;
- missing or invalid JSON through the CLI reader;
- result states outside `PASS`, `PASS with follow-up`, and `BLOCKED`;
- missing or mismatched `candidate_count`;
- `PASS` summaries with non-empty `blocked_reasons`;
- `PASS` summaries with `candidate_compatible_review_material: false`;
- `PASS` summaries with `candidate_authority` other than `non_committed`;
- `PASS` summaries with `worker_facing_guidance_advisory_only: false`;
- `PASS with follow-up` summaries without candidate-compatible review material;
- `BLOCKED` summaries that claim review candidate availability;
- authority flag drift for accepted state, review decision, proof/evidence/readiness, persistence, surface export, DB, network, provider/model, Codex, Codex SDK, GitHub, clipboard, Core, validate helper execution, runtime fixture mutation, or automatic promotion;
- `returned_candidate_treated_as_trusted_runtime_state: true`;
- `candidate_material_is_review_only` other than `true`;
- `alignment_counted_as_direct_success` other than `false`;
- raw unsafe/private/provider/token/browser/source/candidate material markers in public snapshots.

## Authority Boundary

All snapshot authority flags remain false:

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

Operational snapshot generation is provenance only. It does not create accepted state, review decisions, product readiness, persistence, surface exports, runtime state, provider calls, Codex calls, GitHub mutations, DB writes, network calls, clipboard behavior, or Core decisions.

## Future Read-Only Validate UI Path

A later PR may implement a read-only validate result fixture surface that consumes these snapshots. That future UI must remain read-only unless a later accepted-state and persistence design exists. The UI PR must add browser/computer-use validation because this PR adds no UI, route, browser-visible surface, clipboard automation, browser capture, runtime fixture mutation, or product navigation behavior.

## Skipped Browser/Computer-Use Validation

Browser/computer-use validation is skipped for this slice because it adds no UI, route, browser-visible surface, clipboard automation, browser capture, runtime fixture mutation, or product navigation behavior.

## Recommended Next PR

Implement the read-only validate result fixture surface, unless this snapshot PR reveals a concrete hardening gap that should be fixed first.
