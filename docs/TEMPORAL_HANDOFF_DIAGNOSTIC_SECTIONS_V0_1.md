# Temporal Handoff Diagnostic Sections v0.1

## 1. Purpose

Temporal Handoff Diagnostic Sections are diagnostic-preview-only.

This slice adds deterministic, fixture-backed preview sections for AI Context Packet and Codex Handoff Draft style artifacts. The sections preserve expected-vs-observed deltas, decision hold classification, not-done classification, source coverage, unresolved tensions, knowledge gaps, review cues, and authority boundaries.

The sections are review context only. They do not send a handoff, approve execution, mutate work, or create durable state.

## 2. Relationship to the integrated roadmap guide v0.2

It follows the integrated development roadmap guide v0.2.

The primary planning basis is `AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`. Older remaining-development, Research/ROI, Temporal Perspective Overlay, and Git Ledger proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship to #762 Lifecycle, #763 Calibration, #764 Logical Claim Shape, #765 Contract, and #766 Builder

This slice follows the merged Research Candidate sequence:

- #762 Lifecycle Read Model made candidate lifecycle status reviewable.
- #763 Calibration Diagnostic made readiness and overclaim risk reviewable.
- #764 Logical Claim Shape Preview made claim structure reviewable.
- #765 Feedback-to-Rule Candidate Contract defined candidate-only future rule/update suggestions.
- #766 Feedback-to-Rule Candidate Builder deterministically derived candidate-only suggestions from caller-provided feedback.

Temporal Handoff Diagnostic Sections absorb those review vocabularies into handoff packet context without implementing runtime handoff execution, dogfooding ingestion, GitHub automation, or product write.

## 4. Scope and non-goals

In scope:

- type contract
- deterministic helper/builder
- public-safe fixture
- smoke validation
- docs pointer
- package script
- index pointer

Out of scope:

- runtime routes
- UI
- DB reads or writes
- DB migrations
- provider/OpenAI calls
- source fetch
- retrieval/RAG execution
- embeddings or vector search
- proof/evidence writes
- Perspective promotion
- durable Perspective state writes
- work mutation
- Codex/GitHub automation
- branch or PR creation
- Git Ledger export
- product write
- product ID allocation
- package dependencies
- GitHub Actions
- CI runtime changes
- automatic handoff execution
- feedback rule mutation
- parser/helper behavior changes outside the new helper

## 5. Input artifacts

The helper accepts caller-provided handoff preview inputs only. The caller supplies:

- target kind and target ref
- expected files and observed files
- expected checks and observed checks
- source refs
- unresolved tension refs
- knowledge gap refs
- review cue refs
- optional status hint
- optional operator note
- optional authority boundary notes

The helper does not read files, write files, open a DB, call providers, call GitHub, fetch sources, execute retrieval/RAG, create branches, create PRs, execute Codex, create proof/evidence records, promote Perspective, mutate durable state, or use the current clock.

## 6. Diagnostic section shape

The report uses:

- `temporal_handoff_diagnostic_report.v0.1`
- `project:augnes`
- `diagnostic_preview_only`

Each section uses:

- `temporal_handoff_diagnostic_sections.v0.1`
- target kind and target ref
- expected and observed refs
- source, tension, gap, and review cue refs
- expected/observed delta previews
- decision hold traces
- not-done classification
- reason codes
- safe authority boundary

The report includes deterministic target, delta, hold mode, and not-done counts plus a SHA-256 fingerprint over canonical JSON excluding the fingerprint field itself.

## 7. Expected/Observed delta rules

Expected/Observed delta is diagnostic, not authority.

Expected and observed file refs are compared as sets. Missing expected files create an `omission` delta. Unexpected observed files create an `unexpected_change` delta. Expected and observed check mismatches create a `validation_mismatch` delta. Matching expected and observed refs create a `none` delta.

Authority boundary notes that contain approval, execution, automation, PR creation, branch creation, or product write wording create an `authority_boundary_mismatch` delta unless they clearly say that the capability is not granted.

Delta reliability is only a preview label: high when source refs and concrete refs are present, medium when concrete refs are present without source refs, and low when refs are missing.

## 8. Decision hold rules

Decision hold is review context, not rejection.

The helper creates review-only hold traces:

- missing source refs -> `operator_decision_required`
- unresolved tension refs -> `anticipatory_stop`
- expected/observed mismatches -> `reactive_repair`
- blocked status hint -> `operator_decision_required`
- partial or needs-review status hint -> `bounded_continue`

No hold trace authorizes execution. A target with no hold still contributes to `none` hold counts.

## 9. Not-done classification rules

Not-done classification is review context, not automatic failure.

Status hints can classify a section as complete, blocked, partial, out of scope, or needs review. Without a bounded status hint, missing all observed refs when expected refs exist is `not_started`, partial observed refs with missing expected refs is `partial`, matching expected and observed refs is `complete`, and insufficient bounded signal is `unknown`.

## 10. Source/tension/gap/review-cue rules

Source refs are coverage signals, not proof.

Missing source refs add `source_refs_missing` and can create an operator decision hold. Unresolved tension refs add `unresolved_tension_present` and can create an anticipatory stop. Knowledge gap refs add `knowledge_gap_present`. Review cue refs remain review context only.

## 11. Authority boundary

Temporal Handoff Diagnostic Sections do not approve execution.

They do not execute Codex.

They do not call GitHub.

They do not create a branch or PR.

They do not call provider/OpenAI.

They do not fetch sources.

They do not execute retrieval/RAG.

They do not create proof/evidence.

They do not promote Perspective.

They do not mutate durable Perspective state.

They do not mutate work.

They do not export Git Ledger packets.

They do not write product records.

Product-write remains parked by #686.

The authority boundary requires `diagnostic_preview_only: true` and keeps execution approval, Codex execution authority, GitHub automation authority, branch/PR creation authority, source of truth, proof/evidence record, Perspective promotion, durable Perspective state, work mutation, provider/OpenAI authority, source fetch authority, retrieval/RAG authority, Git Ledger export authority, product write authority, and product ID allocation authority false.

## 12. Deferred work

Deferred:

- Temporal handoff UI
- Dogfooding ingestion route
- Codex result report ingestion
- Feedback aggregation runtime
- Feedback controls expansion
- Automatic rule mutation
- Codex PR creation from handoff diagnostics
- GitHub automation
- Cockpit lifecycle/calibration/logical preview
- Durable Candidate Review Memory
- Source intake runtime
- Provider extraction runtime
- Retrieval/RAG runtime
- Human-reviewed promotion
- Formation Receipt durable write
- Durable Perspective state apply
- Git Ledger export
- Product write reentry

## 13. Verification expectations

The smoke checks the document, fixture, type contract, helper, package script, and index pointer. It imports the helper, rebuilds the fixture report, validates the report, recomputes the fingerprint, checks target/delta/hold/not-done/reason coverage, verifies safe authority boundaries, guards helper source from runtime/DB/network/GitHub/process patterns, and checks that output text does not claim execution approval, Codex execution, GitHub PR creation, branch creation, proof/evidence creation, Perspective promotion, state commit, product write, or truth.

Smoke pass is validation signal only, not proof/evidence and not execution approval.

## 14. Next recommended slices

Next recommended slices:

1. `cockpit_lifecycle_calibration_logical_preview_readonly_v0_1`
2. `research_candidate_review_memory_contract_v0_1`
3. `empirical_calibration_dataset_plan_v0_1`
4. `feedback_event_aggregation_runtime_v0_1`
5. `dogfooding_record_runtime_contract_v0_1`

Do not implement those slices in this PR.
