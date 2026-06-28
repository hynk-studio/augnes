# Feedback Event Aggregation Runtime Completion v0.1

## Purpose

This slice implements `feedback_event_aggregation_runtime_completion_v0_1` as the original Phase 5.5 feedback aggregation runtime completion.

It closes the original Phase 5.5 feedback event aggregation runtime gap if the earlier implementation was partial. The earlier `FEEDBACK_EVENT_AGGREGATION_RUNTIME_V0_1` helper remains compatible, but it aggregated caller-provided public-safe events only and did not bind the aggregation route to persisted/caller-injected feedback event records.

This completion adds bounded runtime aggregation over persisted feedback event rows in the existing feedback event store table, while still allowing caller-provided public-safe feedback events for deterministic smoke coverage.

Aggregates pin/dismiss/correct/invalidate/needs_more_evidence/scope_overreach and related feedback events into advisory counts, priority hints, rule failure candidates, and source visibility warnings.

## Relationship To Roadmap

`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` lists Phase 5.5 as `feedback_event_aggregation_runtime_v0_1` and requires aggregation of:

- `pin_count`
- `dismiss_count`
- `correct_count`
- `invalidate_count`
- `needs_more_evidence_count`
- `scope_overreach_count`
- `last_feedback_at`
- `current_surface_priority_hint`
- `rule_failure_candidates`

The acceptance criteria require advisory aggregation only, preserved candidate/durable distinction, and no silent source suppression from invalid feedback.

The roadmap guide is not SSOT.

## Relationship To Earlier Aggregation Runtime

The earlier Feedback Event Aggregation Runtime v0.1 remains compatible. It still accepts caller-provided bounded events and returns deterministic advisory aggregates.

This completion adds the runtime path that can aggregate persisted feedback event records from a caller-injected SQLite DB path under the allowlist. It does not change the meaning of legacy aggregation results.

## Relationship To Feedback Controls Expansion

Feedback Controls Expansion defines UI controls such as pin, dismiss, correct, invalidate, needs-more-evidence, scope-overreach, not-relevant-now, mark-useful, and mark-wrong.

This slice does not add UI controls. It consumes feedback event records and aggregates them into advisory read-model results.

## Relationship To Feedback-Influenced Surfacing Preview

Feedback-influenced surfacing remains preview/advisory work. This slice creates priority hints and source visibility warnings, but it does not mutate ranking or surfacing.

Priority hint is not durable state.

## Relationship To Review Memory DB Runtime

Review Memory DB runtime persists explicit operator review records. Feedback aggregation is a separate advisory signal and does not write review memory, proof/evidence, or durable Perspective state.

## Aggregation Input Policy

Runtime completion requests use:

- `request_version`
- `aggregation_version`
- `scope`
- `aggregation_request_id`
- `requested_by`
- `requested_at`
- optional allowlisted `db_path`
- optional filters
- optional public-safe `feedback_events`
- authority boundary
- reason codes

When `db_path` is provided, the route reads persisted feedback event rows from the existing feedback event store table and does not write cache rows.

## Aggregation Output Shape

Each target aggregation includes advisory counts, `last_feedback_at`, `feedback_event_refs`, `current_surface_priority_hint`, `rule_failure_candidates`, `source_visibility_warnings`, and `candidate_durable_boundary_notes`.

Aggregation is advisory only.

Feedback is not truth.

Pin is not promotion.

Dismiss is not delete.

Invalidate is not source suppression.

Rule failure candidate is not rule mutation.

## Priority Hint Policy

Priority hints are deterministic review aids:

- invalidate or scope-overreach -> `needs_operator_review`
- needs-more-evidence -> `needs_more_evidence`
- pin, useful, or correction -> `raise_priority_for_review`
- dismiss, not-relevant-now, or wrong -> `lower_priority`
- no signal -> `no_change`

Priority hint is not durable state.

## Rule Failure Candidate Policy

Correction, scope-overreach, wrong, and needs-more-evidence feedback may produce rule failure candidates.

Rule failure candidates are candidate-only preview objects. They require operator review. This slice does not mutate rules.

This slice does not mutate parsers.

This slice does not mutate prompts.

## Source Visibility Policy

Invalidation, dismissal, or not-relevant-now feedback may produce source visibility warnings.

Invalid feedback cannot suppress source visibility silently. The output explicitly records that source visibility is preserved.

This slice does not suppress sources.

This slice does not delete candidates.

## Candidate/Durable Boundary Policy

Feedback on candidate layers remains candidate feedback.

Feedback on durable Perspective state remains a review signal only and does not mutate durable Perspective state.

Candidate/durable distinction is preserved.

## Route Policy

The route remains:

```text
POST /api/research-candidate/feedback-events/aggregation
```

Completion requests use `route_version: feedback_event_aggregation_runtime_completion_route.v0.1` and `action: aggregate_feedback_events`.

The route is same-origin only. It reads a caller-injected DB path only when provided and safe. It does not create schema on aggregation reads. Missing DB and missing schema return bounded errors.

## DB Path Policy

Allowed DB paths are relative paths under:

- `tmp/feedback-event-aggregation/`
- `.tmp/feedback-event-aggregation/`

The path must end with `.sqlite` or `.db`.

The route rejects absolute paths, `..`, backslashes, null bytes, URLs, private/local user paths, and token/secret-looking paths. Unsafe DB paths are not echoed in responses.

## Privacy And Redaction Policy

Inputs and persisted event rows are recursively checked for private/raw markers, secret-like markers, local paths, private URLs, raw source bodies, raw provider output, raw retrieval output, raw DB rows, raw conversations, hidden reasoning, telemetry dumps, and raw diffs.

Blocked responses are bounded and do not echo unsafe raw values.

## Authority Boundary

Allowed true fields:

- `feedback_event_aggregation_runtime_now`
- `explicit_operator_aggregation_only`
- `caller_injected_db_only`
- `db_query_now` when a DB-backed aggregation read is executed
- `aggregation_read_now`
- `advisory_result_only`
- `rule_failure_candidate_preview_now`
- `candidate_durable_boundary_visible`
- `source_visibility_warning_visible`

Forbidden false fields:

- `feedback_is_truth`
- `pin_is_promotion`
- `dismiss_is_delete`
- `invalidate_is_source_suppression`
- `rule_mutation_now`
- `parser_mutation_now`
- `prompt_mutation_now`
- `ranking_mutation_now`
- `surfacing_mutation_now`
- `source_suppression_now`
- `candidate_delete_now`
- `proof_or_evidence_record_now`
- `claim_or_evidence_write_now`
- `work_item_write_now`
- `promotion_execution_now`
- `durable_state_write_now`
- `durable_state_apply_now`
- `formation_receipt_write_now`
- `provider_openai_call_now`
- `prompt_sent_now`
- `source_fetch_now`
- `retrieval_execution_now`
- `retrieval_index_write_now`
- `rag_answer_generation_now`
- `product_write_now`
- `product_write_runtime_now`
- `product_write_adapter_enabled_now`
- `product_id_allocation_now`
- `product_persistence_now`
- `git_ledger_export_runtime_now`
- `git_write_now`
- `github_api_call_now`
- `repository_file_write_now`
- `local_file_export_now`
- `local_file_import_now`
- `codex_execution_now`
- `codex_execution_authority`
- `github_automation_authority`
- `product_write_authority`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

Forbidden authority fields fail closed for non-false values.

## Explicit Non-Goals

This slice does not mutate ranking.

This slice does not mutate surfacing.

This slice does not create proof/evidence.

This slice does not write claim/evidence records.

This slice does not create work items.

This slice does not promote Perspective.

This slice does not write/apply durable Perspective state.

This slice does not write Formation Receipts.

This slice does not call providers.

This slice does not send prompts.

This slice does not fetch sources.

This slice does not execute retrieval/RAG.

This slice does not write retrieval indexes.

This slice does not generate RAG answers.

This slice does not execute Git/GitHub.

This slice does not execute Codex.

This slice does not product-write.

This slice does not allocate product IDs.

Product-write remains parked by #686.

Smoke/CI pass is not truth.

## Fixture Policy

`fixtures/feedback-event-aggregation-runtime-completion.sample.v0.1.json` contains public-safe symbolic feedback events, a safe aggregation request, expected advisory result examples, priority hints, rule failure candidates, source visibility warnings, candidate/durable boundary examples, and blocked examples.

Safe markers appear only inside blocked examples.

## Verification Expectations

`scripts/smoke-feedback-event-aggregation-runtime-completion-v0-1.mjs` verifies helper exports, route behavior, DB schema/read aggregation, deterministic counts, priority hints, source visibility warnings, candidate/durable boundary notes, blocked private/raw payloads, blocked forbidden authority, invalid events, invalid DB paths, package/index pointers, and compatibility with the earlier aggregation smoke.

## Deferred Surfacing/Application Work

Applying feedback to surfacing remains deferred to preview/application slices. This completion only produces advisory aggregation results.
