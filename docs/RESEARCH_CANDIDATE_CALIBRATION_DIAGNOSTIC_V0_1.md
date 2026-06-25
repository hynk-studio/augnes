# Research Candidate Calibration Diagnostic v0.1

Slice name: `research_candidate_calibration_diagnostic_v0_1`

## Purpose

Calibration Diagnostic is diagnostic-only. It produces deterministic readiness
diagnostics, reason codes, risk flags, and review queues for Research Candidate
objects using caller-provided candidate, lifecycle, feedback, source, evidence,
tension, and gap inputs.

It explains why a candidate appears blocked, weak, ready with tensions, or ready
for review. It does not decide promotion. It does not train an empirical
calibration model. It does not create proof/evidence.

## Relationship To The Integrated Roadmap Guide v0.2

It implements Phase 1.2 from the integrated development roadmap guide v0.2.
This slice follows the Research Candidate Lifecycle Read Model. The primary
planning basis is
`AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`.

Older remaining-development, Research/ROI, Temporal Perspective Overlay, and
Git Ledger proposal documents are background inputs already integrated into the
roadmap guide, not standalone ordering authority.
Those older proposal documents are background inputs already integrated into the roadmap guide.

## Relationship To #762 Lifecycle Read Model

PR #762 added Research Candidate Lifecycle Read Model v0.1. This diagnostic
layer consumes lifecycle summaries when the caller provides them and combines
their lifecycle status, next review action, unresolved tension count, knowledge
gap count, and source coverage with candidate review input and feedback signals.

Lifecycle status remains lifecycle status. Calibration readiness remains a
diagnostic review label. Readiness is not promotion.

## Scope And Non-Goals

In scope:

- Type contract for diagnostic reports.
- Deterministic helper that consumes caller-provided input data.
- Public-safe sample fixture with input preview and expected report.
- Smoke validation for fixture, helper, docs, package script, and index pointer.
- Documentation and index pointers.

Non-goals:

- No UI.
- No runtime route.
- No DB query/write.
- No migration.
- No provider/OpenAI call.
- No source fetch.
- No retrieval/RAG execution.
- No embedding, vector search, or index runtime.
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
- `lifecycle_read_model.candidate_summaries` when a lifecycle read model is
  available.
- `feedback_events` containing operator preview signals such as dismiss, pin,
  correct, and invalidate.
- `source_fixture_refs` listing public-safe fixture lineage.

The helper does not read files, write files, open a DB, call network, call
provider/OpenAI, fetch sources, execute retrieval/RAG, mutate input, or use wall
clock time.

## Diagnostic Report Shape

The report includes:

- `diagnostic_version`
- `scope`
- `status`
- `as_of`
- `source_fixture_refs`
- `diagnostics`
- `readiness_counts`
- `risk_flag_counts`
- `diagnostic_queue`
- `boundary_notes`
- `diagnostic_fingerprint`
- `authority_boundary`

The diagnostic fingerprint is SHA-256 over deterministic canonical JSON and
does not include `diagnostic_fingerprint` in its own hash input.

## Readiness Labels

Readiness labels are diagnostic review labels only:

- `blocked`: review cannot proceed without source coverage or explicit boundary
  clarification. blocked is a review stop, not rejection.
- `not_ready`: invalidation or missing basis makes review readiness fail.
- `weak_ready`: review can continue only with visible weakness.
- `ready_with_tensions`: review can proceed with unresolved tensions visible.
  ready_with_tensions preserves unresolved tensions.
- `ready`: ready means ready for review, not ready to promote.

Confidence is not truth. Readiness is not promotion. Ready means ready for
review, not ready to promote.

## Reason Code Rules

Reason codes explain each major diagnostic factor. They cover source coverage,
evidence support, contradictions, unresolved tensions, knowledge gaps, locator
coverage, lifecycle status, operator feedback signals, and overclaim risk.

Every diagnostic includes `diagnostic_only_not_promotion`.

Examples:

- `source_ref_missing` or `source_ref_present`
- `source_coverage_boundary_present`
- `evidence_missing` or `evidence_present`
- `contradiction_present`
- `unresolved_tension_present`
- `knowledge_gap_present`
- `locator_missing` or `locator_present`
- `lifecycle_blocked`
- `operator_invalidation_present`
- `readiness_overclaim_risk`
- `ready_with_unresolved_tensions`

## Risk Flag Rules

Risk flags make operator-facing review risks visible:

- `missing_source_ref`
- `missing_evidence`
- `missing_locator`
- `operator_invalidated`
- `contradiction_or_tension`
- `knowledge_gap_open`
- `overclaim_risk`
- `stale_context`

Overclaim risk is raised when a candidate advertises readiness while support,
source coverage, or unresolved-tension conditions still make that readiness
unsafe to treat as promotion authority.

## Feedback Interpretation Rules

Feedback is operator signal, not truth. Feedback affects diagnostic reason codes
and risk flags only. It does not create truth, proof/evidence, Perspective
promotion, durable state, or product write authority.

Family-specific feedback `target_kind` values are respected when they map to
candidate families, so feedback for one candidate family does not leak to
another family that shares the same candidate id. Feedback with absent or empty
`target_kind` keeps legacy target-id-only matching. Feedback with unknown
`target_kind` does not attach across families.

Dismissed feedback is not rejection. Pinned feedback is not promotion. Corrected
feedback is not truth. Invalidated feedback is not proof.

## Source/Evidence/Tension/Gap/Locator Rules

Source refs are detected from candidate fields, lifecycle summary fields, and
target-kind-matched feedback event source refs. Explicit
`source_coverage_boundary_note` values are preserved when source refs are
absent. Missing source refs without boundary clarification raise
`source_ref_missing` and `missing_source_ref`.

Evidence support is counted from linked evidence candidates and direct support
fields. Contradiction counts include contradicting evidence and contradiction
tensions. Unresolved tension and knowledge gap counts prefer lifecycle summary
counts when present, then fall back to direct candidate relationships. Locator
coverage checks evidence locators and linked evidence locators for claims and
Perspective deltas.

The diagnostic does not fetch sources. It does not execute retrieval/RAG.

## Authority Boundary

Calibration Diagnostic is diagnostic-only. It does not train an empirical
calibration model. It does not create proof/evidence. It does not promote
Perspective. It does not mutate durable Perspective state. It does not mutate
work. It does not execute Codex. It does not call GitHub. It does not call
provider/OpenAI. It does not fetch sources. It does not execute retrieval/RAG.
It does not export Git Ledger packets. It does not write product records.

The authority boundary keeps these fields false:

- `empirical_calibration_model`
- `confidence_is_truth`
- `readiness_is_promotion`
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

- It does not train an empirical calibration model.
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
- Feedback is operator signal, not truth.
- Confidence is not truth.
- Readiness is not promotion.
- Ready means ready for review, not ready to promote.
- diagnostic_summary is explanation, not authority.

## Deferred Work

Deferred and not implemented here:

- Cockpit calibration diagnostic UI
- Logical Claim Shape Preview
- Feedback-to-Rule Candidate Loop
- Temporal handoff diagnostics
- Empirical Calibration Dataset
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

The smoke validates the type contract, helper boundary, deterministic fixture,
authority boundary, readiness label coverage, reason code coverage, risk flag
coverage, target-kind-aware feedback matching, stable fingerprint, package
script pointer, and index pointer.

Smoke pass is a validation signal, not proof/evidence. The diagnostic report is
an operator-facing explanation, not authority.

## Next Recommended Slices

1. `logical_claim_shape_preview_v0_1`
2. `feedback_to_rule_candidate_contract_v0_1`
3. `temporal_handoff_diagnostic_sections_v0_1`
4. `cockpit_lifecycle_calibration_preview_readonly_v0_1`
5. `research_candidate_review_memory_contract_v0_1`
6. `empirical_calibration_dataset_plan_v0_1`

Those slices are not implemented in this PR.
