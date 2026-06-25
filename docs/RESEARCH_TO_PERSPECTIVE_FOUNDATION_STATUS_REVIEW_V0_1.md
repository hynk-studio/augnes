# Research-to-Perspective Foundation Status Review v0.1

Slice name: `foundation_status_review_and_next_runtime_slice_selection_v0_1`

## Purpose

Classify the current Research-to-Perspective foundation after PR #759 and PR
#760, then select exactly one next runtime/read-model slice. This review is a
repo-local planning artifact for operator orientation. It does not implement
the selected slice.

Selected next runtime/read-model slice:
research_candidate_lifecycle_read_model_v0_1

## Current Baseline After #759 And #760

PR #759 closed the Research-to-Perspective Foundation Milestone as a
closeout-only, fixture-only, smoke-only slice. The closeout summarized the
foundation scaffold after Dogfooding Research-to-Perspective CI Expansion
closeout and kept runtime persistence, provider runtime, retrieval/RAG runtime,
durable Perspective promotion, product DB writes, and product-write unopened or
parked.

PR #760 added Research-to-Perspective Fixture Smoke Legacy Audit v0.1 and is
the latest baseline for this review. It classified active foundation smokes,
active runtime-adjacent smokes, historical previews, warning debt, disabled
adapter rails, temp DB harnesses, and parked product-write rails without
deleting active validation lineage. Product-write remains parked by #686.

## Scope And Non-Goals

In scope:

- Classify the current foundation rail status after #759 and #760.
- Classify runtime readiness and authority level for the active rails.
- Compare candidate next runtime/read-model slices.
- Select exactly one next runtime/read-model slice:
  `research_candidate_lifecycle_read_model_v0_1`.
- Add a fixture and smoke that validate this review as docs/fixture/smoke
  metadata only.

Non-goals:

- Do not add runtime routes.
- Do not add UI components.
- Do not change DB schema or migrations.
- Do not query or write a product DB.
- Do not add runtime persistence.
- Do not add provider/OpenAI calls.
- Do not fetch sources.
- Do not execute retrieval/RAG.
- Do not add vector, embedding, or index implementation.
- Do not store durable candidate memory.
- Do not store promotion decisions.
- Do not write Formation Receipts.
- Do not write durable Perspective state.
- Do not write proof/evidence records.
- Do not mutate work.
- Do not add product write or product ID allocation.
- Do not implement Git Ledger or export.
- Do not add GitHub Actions.
- Do not change CI runtime.

## Foundation Rail Status Matrix

| Rail | Current status | Authority class | Runtime readiness | Next action |
| --- | --- | --- | --- | --- |
| Research-to-Perspective Foundation Milestone closeout | closeout_lineage | fixture_smoke_only | high | Keep as #759 baseline lineage. |
| Dogfooding Research-to-Perspective CI Expansion closeout | closeout_lineage | fixture_smoke_only | high | Keep as upstream closeout lineage. |
| Agent Perspective Substrate Feedback Loop | active_foundation_lineage | advisory_derived | medium | Preserve folded, derived, advisory-only boundary. |
| Perspective Packet Receipt Linkage | historical_preview | candidate_preview | medium | Treat as provenance linkage, not completion proof. |
| Codex Handoff Draft | historical_preview | candidate_preview | medium | Keep draft status; no execution approval. |
| AI Context Packet | historical_preview | non_authoritative_context | medium | Keep context-only status; no provider or execution authority. |
| Perspective Geometry Digest | historical_preview | advisory_derived | medium | Keep derived review context; no durable state. |
| Project Constellation Runtime Layout | historical_preview | candidate_preview | low | Keep layout preview; no graph DB or persistence. |
| Durable Perspective State / Trajectory | deferred_runtime | deferred_runtime | low | Defer durable state paths until explicit runtime gate. |
| Human-reviewed Durable Perspective Promotion | deferred_runtime | deferred_runtime | low | Defer promotion until human-reviewed promotion contract is reopened. |
| Non-authoritative Retrieval/RAG | deferred_runtime | non_authoritative_context | low | Keep recall/context boundary; do not execute retrieval/RAG. |
| Operator Source Candidate Generation | active_foundation_lineage | candidate_preview | medium | Keep candidate generation as review context only. |
| Bounded External Source Intake | deferred_runtime | deferred_runtime | low | Defer source intake runtime and source fetching. |
| Salience Governor | historical_preview | advisory_derived | medium | Keep policy/selection lineage; no durable write. |
| Recent Rehearsal Buffer | historical_preview | non_authoritative_context | low | Keep rehearsal context non-durable. |
| Formation Receipt Durable Event | active_runtime_adjacent | advisory_derived | medium | Keep contract lineage; no Formation Receipt writes here. |
| Feedback Event Store | active_runtime_adjacent | durable_feedback_event_only | high | Keep bounded feedback validation; no new write authority here. |

No rail in this review opens runtime behavior. Every rail remains subject to
the authority boundary below.

## Runtime Readiness Matrix

| Candidate area | Readiness | Current basis | Decision now |
| --- | --- | --- | --- |
| Foundation status dashboard | medium | Status review plus audit lineage | Deferred; dashboard should not be the next implementation slice. |
| Research candidate lifecycle read model | high | Existing candidate, packet, handoff, feedback, and provenance artifacts | Selected as the next runtime/read-model slice. |
| Calibration Diagnostic | medium | Candidate and feedback signals | Deferred until lifecycle read model exists. |
| Logical Claim Shape Preview | medium | Candidate and claim-shape vocabulary | Deferred until lifecycle and calibration basis are stable. |
| Feedback-to-Rule Candidate Loop | medium | Feedback Event Store and review signals | Deferred until lifecycle and calibration diagnostics can anchor rule candidates. |
| Durable Candidate Review Memory | low | Needs lifecycle and diagnostic basis first | Deferred until lifecycle read model and diagnostic basis are stable. |
| Bounded Source Intake | low | Contract lineage only | Deferred; no source fetch now. |
| Provider Extraction | low | Provider output remains non-authoritative | Deferred; no provider/OpenAI calls now. |
| Retrieval/RAG runtime | low | Non-authoritative recall/context contract only | Deferred; no retrieval/RAG execution now. |
| Human-reviewed promotion and durable state apply | low | Promotion/state contracts remain deferred | Deferred until human-reviewed durable paths are explicitly reopened. |
| Git Ledger / Export | none | Needs promotion, Formation Receipt, and durable state basis | Deferred until after human-reviewed promotion, Formation Receipt, and durable state paths exist. |
| Product write | none | Parked by #686 | Deferred; product-write remains parked by #686. |

## Authority Level Matrix

| Artifact or signal | Authority level |
| --- | --- |
| Candidate | Candidate remains candidate. |
| Feedback | Feedback remains operator signal, not truth. |
| Retrieval/RAG | Retrieval/RAG remains recall/context, not authority. |
| Provider/OpenAI output | Provider/OpenAI output remains non-authoritative. |
| Codex Handoff Draft | Codex Handoff Draft remains draft, not execution approval. |
| Smoke pass | Smoke pass is validation signal, not proof/evidence. |
| CI signal | CI signal is validation signal, not proof/evidence. |
| PR body | PR body is an operator report, not authority. |
| Git refs | Git refs are not authority if mentioned at all. |
| Closeout fixture | Closeout fixture is lineage and summary, not runtime completion proof. |

## Forbidden Capability List

This review does not grant or implement:

- Runtime persistence.
- Provider/OpenAI calls.
- Source fetching.
- Retrieval/RAG execution.
- Vector, embedding, or index implementation.
- Product DB query or write.
- Proof/evidence writes.
- Perspective promotion.
- Durable Perspective state writes.
- Durable candidate memory storage.
- Promotion decision storage.
- Formation Receipt writes.
- Work mutation.
- Product write.
- Product ID allocation.
- Codex execution inside Augnes runtime.
- GitHub automation inside Augnes runtime.
- GitHub Actions.
- CI runtime changes.
- Git Ledger export.

## Product-Write Parked-By-#686 Reaffirmation

Product-write remains parked by #686. This review does not unpark
product-write, does not allocate product IDs, does not create product DB writes,
and does not change any product-write preflight, disabled adapter, temp DB,
dry-run transaction, noop invocation, or disabled bridge artifact.

## Candidate Next Runtime/Read-Model Slice Comparison

| Slice | Decision | Reason |
| --- | --- | --- |
| `foundation_status_dashboard_readonly_ui_v0_1` | Deferred | Useful after the lifecycle read model exists, but dashboard-first would produce orientation UI before a stable lifecycle basis. |
| `research_candidate_lifecycle_read_model_v0_1` | Selected | Best bounded next runtime/read-model slice because it derives candidate lifecycle status and next review cues without new authority. |
| `research_candidate_calibration_diagnostic_v0_1` | Deferred | Needs lifecycle status first so calibration can attach to stable candidate phases. |
| `logical_claim_shape_preview_v0_1` | Deferred | Useful after lifecycle and calibration establish review context. |
| `feedback_to_rule_candidate_loop_v0_1` | Deferred | Needs lifecycle and calibration basis before feedback can become rule candidates. |
| `research_candidate_review_memory_contract_v0_1` | Deferred | Durable Candidate Review Memory is deferred until lifecycle read model and diagnostic basis are stable. |
| `bounded_source_intake_runtime_contract_v0_1` | Deferred | Source intake runtime and source fetching remain unopened. |
| `provider_assisted_extraction_candidate_only_contract_v0_1` | Deferred | Provider/OpenAI output remains non-authoritative and no provider call is opened now. |
| `research_retrieval_runtime_contract_v0_1` | Deferred | Retrieval/RAG remains recall/context, not authority, and no execution is opened now. |
| `perspective_promotion_runtime_contract_v0_1` | Deferred | Promotion and durable Perspective state paths remain deferred. |
| `git_ledger_export_contract_v0_1` | Deferred | Git Ledger / Export must wait until after human-reviewed promotion, Formation Receipt, and durable state paths exist. |
| `product_write_reentry_review_v0_1` | Deferred | Product-write remains parked by #686. |

Foundation Status Dashboard is deferred and should not be the next
implementation slice.
Foundation Status Dashboard is deferred and should not be the next implementation slice.
Dashboard may be an orientation/read-only UI after the lifecycle read model
exists.

## Selected Next Slice

Selected next runtime/read-model slice:
research_candidate_lifecycle_read_model_v0_1

Selection rationale:

- It safely combines existing candidate, packet, handoff, feedback, and
  provenance artifacts as a derived read model.
- It does not require DB writes, provider calls, retrieval/RAG, Perspective
  promotion, product write, or GitHub automation.
- It gives the operator the highest immediate value by showing candidate
  lifecycle status and next review cues.
- It prepares the later Calibration Diagnostic, Logical Claim Shape Preview,
  Feedback-to-Rule Candidate Loop, and temporal handoff diagnostics.

The selected next slice is not implemented by this PR.

## Deferred Slices And Reasons

- Foundation Status Dashboard is deferred because it should orient around a
  stable lifecycle read model rather than precede it.
- Durable Candidate Review Memory is deferred until lifecycle read model and
  diagnostic basis are stable.
- Calibration Diagnostic is deferred until lifecycle phases and candidate
  status are explicit.
- Logical Claim Shape Preview is deferred until lifecycle and calibration
  context exist.
- Feedback-to-Rule Candidate Loop is deferred until feedback can attach to
  lifecycle and calibration signals.
- Temporal handoff diagnostics are deferred until lifecycle, calibration, and
  handoff readouts can be compared. Temporal Perspective Overlay concepts may
  be absorbed later as vocabulary inside lifecycle, calibration, handoff, and
  trajectory surfaces, not as a new SSOT or standalone runtime.
- Bounded Source Intake is deferred; source fetching remains unopened.
- Provider Extraction is deferred; provider/OpenAI calls remain unopened and
  non-authoritative.
- Retrieval/RAG is deferred; recall/context remains non-authoritative.
- Human-reviewed Promotion and Durable State Apply are deferred until explicit
  durable paths are reopened.
- Git Ledger / Export is deferred until after human-reviewed promotion,
  Formation Receipt, and durable state paths exist.
- Git Ledger / Export is deferred until after human-reviewed promotion, Formation Receipt, and durable state paths exist.
- Product Write is deferred; product-write remains parked by #686.

## Follow-Up PR Roadmap

1. `research_candidate_lifecycle_read_model_v0_1`
2. `research_candidate_calibration_diagnostic_v0_1`
3. `logical_claim_shape_preview_v0_1`
4. `feedback_to_rule_candidate_loop_v0_1`
5. `temporal_handoff_diagnostics_v0_1`
6. `foundation_status_dashboard_readonly_ui_v0_1`
7. `research_candidate_review_memory_contract_v0_1`
8. `bounded_source_intake_runtime_contract_v0_1`
9. `provider_assisted_extraction_candidate_only_contract_v0_1`
10. `research_retrieval_runtime_contract_v0_1`
11. `perspective_promotion_runtime_contract_v0_1`
12. `git_ledger_export_contract_v0_1`
13. `product_write_reentry_review_v0_1`

## Authority Boundary Statement

This review is classification and next-slice selection only. It adds no runtime
persistence, provider/OpenAI calls, source fetch, retrieval/RAG execution, DB
query/write, proof/evidence write, Perspective promotion, durable Perspective
state write, work mutation, Codex/GitHub automation inside Augnes runtime,
GitHub Actions, CI runtime change, Git Ledger export, product write, or product
ID allocation. Product-write remains parked by #686.

## Verification Expectations

Expected validation:

- `node --check scripts/smoke-research-to-perspective-foundation-status-review-v0-1.mjs`
- `npm run smoke:research-to-perspective-foundation-status-review-v0-1`
- `npm run smoke:research-to-perspective-fixture-smoke-legacy-audit-v0-1`
- `npm run smoke:research-to-perspective-foundation-milestone-closeout-v0-1`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

Smoke pass is validation signal, not proof/evidence.
Smoke pass is a validation signal, not proof/evidence.
CI signal is validation signal, not proof/evidence. PR body is an operator
report, not authority.
