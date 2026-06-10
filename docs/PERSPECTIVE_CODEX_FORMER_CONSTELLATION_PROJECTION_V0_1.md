# Perspective Codex Former Constellation Projection v0.1

## Purpose

This document defines the read-only Codex Former constellation projection
contract. The projection maps existing local Codex Former capture, validation,
and review material into nodes, edges, status summaries, warning summaries,
authority summaries, and privacy summaries for a future Constellation Preview.

This follows PR #498, which defined the first product-surface design contract
for the Codex Session Perspective Panel, Capture Review Inbox, Constellation
Preview, display density policy, and Authority Lens. PR #498 intentionally
stopped before defining an implementation-facing projection shape. This PR
fills that next contract layer without building UI or runtime surfaces.

The projection is read-only. It does not create accepted Augnes state, write
persistence, create proof/evidence/readiness records, call providers, call the
Codex SDK, mutate GitHub, automate clipboard behavior, implement UI, deploy,
approve, merge, or make Core decisions.

## Input Shape

The builder accepts a narrow local input shape that mirrors validation-like
summary material, not a generic UI state object:

- `generated_at`
- `capture_source_kind`
- `source_input_hash`
- `source_prompt_hash`
- `metadata_match`
- `candidate_count`
- `conclusion`
- `direct_validation_status`
- `candidate_authority`
- `candidate_basis_quality`
- `pointer_warning_count`
- `warning_summary`
- `blocked_reasons`
- `source_pr_refs`
- `changed_files`
- `next_action_summaries`

The input is expected to be bounded local summary material. It must not contain
raw private/source/provider payloads.

## Projection Contract

The versioned output shape is
`codex_former_constellation_projection.v0.1` with kind
`codex_former_constellation_projection`.

The projection includes:

- `generated_at`
- `source`
- `nodes`
- `edges`
- `status_summary`
- `warning_summary`
- `authority_summary`
- `privacy`
- `authority_flags`

The contract is a derived view model. It is not a route, not a DB schema, not
runtime state, and not a review decision.

## Node Model

Supported node kinds:

- `work`
- `source_input`
- `manual_copy_packet`
- `codex_session`
- `candidate_draft`
- `validation_summary`
- `review_candidate`
- `warning`
- `worker_guidance`
- `next_action`

Each node includes:

- `id`
- `node_kind`
- `title`
- `status`
- `authority`
- `primary_badges`
- `warning_count`
- `provenance_refs`
- `detail_refs`

Supported node statuses:

- `raw`
- `prepared`
- `returned`
- `validated`
- `needs_review`
- `blocked`
- `review_only`
- `accepted_future_only`

`accepted_future_only` is a schema/docs future enum value only. The current
builder must not emit it for current workflow fixtures.

Supported node authority values:

- `review_only`
- `non_committed`
- `advisory_only`
- `pointer_only`
- `blocked`
- `accepted_future_only`

`accepted_future_only` is a schema/docs future enum value only. The current
builder must not emit it for current workflow fixtures.

## Edge Model

Supported relations:

- `prepared`
- `pasted_by_human`
- `returned`
- `validated`
- `informs`
- `suggests`
- `pointer_only`
- `blocked_by`

Each edge includes:

- `id`
- `from`
- `to`
- `relation`
- `status`
- `authority_boundary`
- `warning_count`
- `provenance_refs`

Supported edge statuses:

- `raw`
- `prepared`
- `returned`
- `validated`
- `needs_review`
- `blocked`
- `review_only`

Supported authority boundary values:

- `review_only`
- `non_committing`
- `advisory_only`
- `pointer_only`
- `blocked`

## PASS With Follow-Up Mapping

For a `PASS with follow-up` result with exactly one non-committed,
candidate-compatible review material result, the projection emits:

- `source_input`
- `manual_copy_packet`
- `codex_session`
- `candidate_draft`
- `validation_summary`
- `review_candidate`
- warning node when pointer or review warnings remain
- `worker_guidance`
- `next_action` nodes when next action summaries are supplied

Expected edges include:

- `source_input -> manual_copy_packet`: `prepared`
- `manual_copy_packet -> codex_session`: `pasted_by_human`
- `codex_session -> candidate_draft`: `returned`
- `candidate_draft -> validation_summary`: `validated`
- `validation_summary -> review_candidate`: `informs`
- `warning -> review_candidate`: `pointer_only`
- `review_candidate -> worker_guidance`: `informs`
- `worker_guidance -> next_action`: `suggests`

The review candidate remains non-committed and review-only. The projection never
emits `accepted_future_only` for this workflow.

## BLOCKED Mapping

For `BLOCKED with useful findings`, the projection emits source, packet,
session, candidate draft when a candidate was returned, validation summary, and
warning/blocking nodes.

The blocked projection does not emit:

- `review_candidate`
- `worker_guidance`
- usable `next_action`

It emits `blocked_by` edges from warning/blocking nodes to the validation
summary. The block remains review information only; it is not accepted state.

## Status Summary

`status_summary` includes:

- `conclusion`
- `overall_status`
- `candidate_count`
- `metadata_match`
- `direct_validation_status`
- `candidate_basis_quality`

`overall_status` is one of `pass`, `pass_with_follow_up`, or `blocked`.

## Warning Summary

`warning_summary` includes:

- `warning_count`
- `pointer_warning_count`
- sanitized `warnings`
- sanitized `blocked_reasons`

Warning and blocking strings are bounded summaries only. Unsafe marker-like or
private/source/provider material is omitted rather than echoed.

## Authority Summary

`authority_summary` always states:

- `review_only: true`
- whether a non-committed candidate-compatible node was emitted
- `accepted_state_created: false`
- `proof_evidence_readiness_created: false`
- `provider_model_calls: false`
- `codex_sdk_calls: false`
- `github_mutation: false`
- `db_writes: false`
- `ui_implemented: false`
- `core_decision: false`

`authority_flags` mirrors the false-authority behavior:

- `committed_state: false`
- `persistence: false`
- `provider_model_api_calls: false`
- `proof_evidence_readiness_writes: false`
- `codex_execution: false`
- `github_mutation: false`
- `merge_publish_approval: false`
- `core_decision: false`

## Privacy Boundary

The projection includes:

- `raw_payloads_included: false`
- `bounded_summaries_only: true`
- `unsafe_input_material_omitted`
- `omitted_unsafe_fields`

The projection omits unsafe marker-like strings from warning summaries,
blocking summaries, node titles, badges, and detail refs. Public docs and
reports use sanitized descriptions instead of raw unsafe/private marker
literals.

## Future Relationship To Constellation Preview

This contract is the future Constellation Preview input layer. A later PR can
build fixture-backed previews using this projection without adding accepted
state, persistence, routes, UI, provider/model calls, Codex SDK calls, GitHub
mutation, approval, merge, deploy, or Core decision authority.

Recommended next PR:
`Add Codex Former constellation projection fixture preview`.

## Conclusion

Conclusion: PASS with follow-up
