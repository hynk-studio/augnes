# Research Candidate Lifecycle Read Model v0.1

Slice name: `research_candidate_lifecycle_read_model_v0_1`

## Purpose

Research Candidate Lifecycle Read Model v0.1 derives operator-facing lifecycle
summaries from existing candidate review objects, feedback events, packet and
handoff refs, tension and gap relationships, and source coverage. Candidate
lifecycle is a derived read model only.

It helps an operator see which candidates need review, which candidates are
ready for handoff review, and which candidates have missing source coverage or
operator feedback signals. It does not create proof/evidence.

## Relationship To #761 Foundation Status Review

PR #761 selected `research_candidate_lifecycle_read_model_v0_1` as the next
runtime/read-model slice after the Foundation Status Review. This PR implements
that selected next runtime/read-model slice as a deterministic derived read
model only. The selected slice remains bounded to type contract, helper,
fixture, smoke, docs pointer, package script, and index pointer.

## Scope And Non-Goals

In scope:

- Type contract for lifecycle summaries and read model shape.
- Deterministic helper that consumes caller-provided input data.
- Public-safe sample fixture with input preview and expected read model.
- Smoke validation for fixture, helper, doc, package script, and index pointer.
- Documentation and index pointers.

Non-goals:

- No runtime route.
- No UI.
- No DB query/write.
- No migrations.
- No provider/OpenAI call.
- No source fetch.
- No retrieval/RAG execution.
- No proof/evidence write.
- No Perspective promotion.
- No durable Perspective state write.
- No work mutation.
- No Codex execution.
- No GitHub automation.
- No Git Ledger export.
- No product write.
- No product ID allocation.

Product-write remains parked by #686.

## Input Artifacts

The helper accepts caller-provided input only:

- `candidate_review` with claim, evidence, tension, knowledge gap, perspective
  delta, and follow-up work candidate arrays.
- `feedback_events` containing operator preview signals such as dismiss, pin,
  correct, and invalidate.
- `packet_refs` linking packets to candidate refs and source refs.
- `handoff_refs` linking handoff drafts to candidate refs and source refs.
- `source_fixture_refs` listing public-safe fixture lineage.

The helper does not read files, open a DB, call network, call providers/OpenAI,
execute retrieval/RAG, or mutate input.

## Derived Read Model Shape

The read model includes:

- `lifecycle_version`
- `scope`
- `status`
- `as_of`
- `source_fixture_refs`
- `candidate_summaries`
- `family_counts`
- `lifecycle_status_counts`
- `review_queue`
- `boundary_notes`
- `lifecycle_fingerprint`
- `authority_boundary`

The lifecycle fingerprint is SHA-256 over deterministic canonical JSON and does
not include `lifecycle_fingerprint` in its own hash input.

## Candidate Family Coverage

Candidate families:

- `claim`
- `evidence`
- `tension`
- `knowledge_gap`
- `perspective_delta`
- `follow_up_work`

Candidate IDs are detected from the existing field names:

- `claim_candidate_id`
- `evidence_candidate_id`
- `tension_candidate_id`
- `knowledge_gap_candidate_id`
- `perspective_delta_candidate_id`
- `follow_up_work_candidate_id`

## Lifecycle Status Rules

Feedback priority determines operator feedback statuses first:

1. `invalidate_preview` -> `invalidated`
2. `correct_preview` -> `operator_corrected`
3. `pin_preview` -> `operator_pinned`
4. `dismiss_preview` -> `operator_dismissed`
5. Missing source refs without an explicit input source coverage boundary note
   -> `blocked`
6. Review status `needs_review` or `candidate_only` -> `needs_review`
7. Perspective delta with promotion readiness `ready` or `ready_with_tensions`
   -> `ready_for_review`
8. Otherwise -> `new_candidate`

Dismissed is not rejected. Pinned is not promoted. Invalidated is not proof.
Ready for review is not promotion.

## Feedback Interpretation Rules

Feedback is operator signal, not truth. Feedback changes lifecycle labels and
review cues only. Family-specific feedback `target_kind` values are respected
when they map to candidate families, so feedback for one candidate family does
not leak to another family that shares the same candidate id. Feedback with
absent or empty `target_kind` keeps legacy target-id-only matching. Feedback
with unknown `target_kind` does not attach across families. Corrected is not
truth. Dismissed is not rejected. Pinned is not promoted. Invalidated is not
proof.

## Source Coverage Rules

Source refs are detected from `source_ref_id` and `source_refs`, plus linked
feedback, packet, and handoff source refs when provided by the caller. Every
summary must include either non-empty `source_refs` or
`source_coverage_boundary_note`.

An explicit input `source_coverage_boundary_note` can explain a known
missing-source boundary. Missing source refs without an explicit input boundary
note are classified as `blocked`. The read model may synthesize an output
source coverage boundary note for blocked candidates so every summary remains
reviewable.

The read model records missing source coverage. It does not fetch sources.

## Next Review Action Rules

`next_review_action` is a review cue, not execution authority.

- `invalidated` -> `review_feedback`
- `operator_corrected` -> `review_feedback`
- `operator_pinned` -> `prepare_handoff`
- `operator_dismissed` -> `defer`
- `blocked` -> `inspect_source`
- `needs_review` with unresolved tensions -> `resolve_tension`
- `needs_review` with no source coverage -> `inspect_source`
- `needs_review` with knowledge gaps -> `add_evidence`
- `ready_for_review` -> `prepare_handoff`
- `stale` -> `inspect_source`
- otherwise -> `no_action`

## Authority Boundary

Candidate lifecycle is a derived read model only. It does not create
proof/evidence. It does not promote Perspective. It does not mutate durable
Perspective state. It does not mutate work. It does not execute Codex. It does
not call GitHub. It does not call provider/OpenAI. It does not fetch sources. It
does not execute retrieval/RAG. It does not export Git Ledger packets. It does
not write product records.

The authority boundary keeps these fields false:

- `source_of_truth`
- `proof_or_evidence_record`
- `perspective_promotion`
- `durable_perspective_state`
- `work_mutation`
- `execution_authority`
- `codex_execution_authority`
- `github_automation_authority`
- `provider_openai_authority`
- `source_fetch_authority`
- `retrieval_rag_authority`
- `git_ledger_export_authority`
- `product_write_authority`
- `product_id_allocation_authority`

Product-write remains parked by #686.

Exact boundary statements:

- It does not create proof/evidence.
- It does not promote Perspective.
- It does not mutate durable Perspective state.
- It does not mutate work.
- It does not execute Codex.
- It does not call GitHub.
- It does not call provider/OpenAI.
- It does not fetch sources.
- It does not execute retrieval/RAG.
- It does not export Git Ledger packets.
- It does not write product records.
- next_review_action is a review cue, not execution authority.

## Deferred Work

Deferred and not implemented here:

- Cockpit lifecycle preview UI
- Calibration Diagnostic
- Logical Claim Shape Preview
- Feedback-to-Rule Candidate Loop
- Durable Candidate Review Memory
- Source intake runtime
- Provider extraction runtime
- Retrieval/RAG runtime
- Human-reviewed promotion
- Formation Receipt durable write
- Durable Perspective state apply
- Git Ledger export
- Product write reentry

## Verification Expectations

Expected validation:

- `node --check scripts/smoke-research-candidate-lifecycle-read-model-v0-1.mjs`
- `npm run smoke:research-candidate-lifecycle-read-model-v0-1`
- `npm run smoke:research-to-perspective-foundation-status-review-v0-1`
- `npm run smoke:research-to-perspective-fixture-smoke-legacy-audit-v0-1`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

Smoke pass is validation signal, not proof/evidence. PR body is operator
report, not authority. CI signal is validation signal, not proof/evidence.

## Next Recommended Slices

1. `research_candidate_calibration_diagnostic_v0_1`
2. `logical_claim_shape_preview_v0_1`
3. `feedback_to_rule_candidate_contract_v0_1`
4. `cockpit_lifecycle_preview_readonly_v0_1`
5. `research_candidate_review_memory_contract_v0_1`

Do not implement those next slices in this PR.
