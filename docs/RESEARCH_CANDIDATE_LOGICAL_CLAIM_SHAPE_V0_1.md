# Research Candidate Logical Claim Shape Preview v0.1

Slice name: `logical_claim_shape_preview_v0_1`

## Purpose

Logical Claim Shape Preview is structure-only. It derives a deterministic,
operator-reviewable claim structure from caller-provided claim, evidence,
tension, knowledge gap, and calibration inputs.

It helps an operator inspect premise refs, premise summaries, conclusion text,
missing assumptions, counterclaim refs, contradictions, and review cues. It does
not prove claims.

## Relationship To The Integrated Roadmap Guide v0.2

It implements Phase 1.3 from the integrated development roadmap guide v0.2.
This slice follows the Research Candidate Calibration Diagnostic. The primary
planning basis is
`AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`.

Older remaining-development, Research/ROI, Temporal Perspective Overlay, and
Git Ledger proposal documents are background inputs already integrated into the
roadmap guide, not standalone ordering authority.
Those older proposal documents are background inputs already integrated into the roadmap guide.

## Relationship To #762 Lifecycle Read Model And #763 Calibration Diagnostic

PR #762 added Research Candidate Lifecycle Read Model v0.1. PR #763 added
Research Candidate Calibration Diagnostic v0.1. Logical Claim Shape Preview
uses calibration diagnostics only as caller-provided input signal.

Calibration Diagnostic is input signal, not truth. Calibration readiness can
surface review cues such as `add_evidence`, `inspect_source`, or
`state_missing_assumption`, but it does not prove or promote a claim.

## Scope And Non-Goals

In scope:

- Type contract for logical claim shape previews and report shape.
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
- No proof checking.
- No theorem proving.
- No formal verification.
- No Lean, SMT, or SAT execution.
- No natural-language proof checking as authority.

Product-write remains parked by #686.

## Input Artifacts

The helper accepts caller-provided input only:

- `candidate_review.claim_candidates`
- `candidate_review.evidence_candidates`
- `candidate_review.tension_candidates`
- `candidate_review.knowledge_gap_candidates`
- `calibration_diagnostic.diagnostics`
- `source_fixture_refs`

The helper does not read files, write files, open a DB, call network, call
provider/OpenAI, fetch sources, execute retrieval/RAG, mutate input, use wall
clock time, run theorem provers, run formal verification, or infer truth from
wording alone.

## Logical Shape Report Structure

The report includes:

- `shape_version`
- `scope`
- `status`
- `as_of`
- `source_fixture_refs`
- `claim_shapes`
- `logical_status_counts`
- `review_cue_counts`
- `shape_queue`
- `boundary_notes`
- `shape_fingerprint`
- `authority_boundary`

The shape fingerprint is SHA-256 over deterministic canonical JSON and does not
include `shape_fingerprint` in its own hash input.

## Inference Type Rules

Inference type is deterministic and rule-based only:

- Controlled `inference_type` is used when supplied.
- `claim_type` values map to observation, summary, hypothesis, analogy,
  extrapolation, operational translation, causal, comparison, or definition
  labels.
- `epistemic_status: "hypothesis_only"` maps to `abductive_hypothesis`.
- Otherwise the inference type is `unknown`.

Inference type is a review label, not proof status.

## Premise/Conclusion Rules

Premises are detected from explicit fields only:

- `premise_candidate_ids`
- `premise_claim_candidate_ids`
- `basis_claim_candidate_ids`
- `supporting_claim_candidate_ids`
- `basis_evidence_candidate_ids`
- `supporting_evidence_candidate_ids`
- `related_evidence_candidate_ids`

Evidence-backed premise summaries use bounded caller-provided evidence summary,
quality note, locator, or source ref text when present. The helper does not
invent premises from free text.

Conclusion text uses explicit fields in order:

1. `conclusion_text`
2. `claim_text`
3. `proposed_update_summary`
4. `after_summary`

Missing premise is a review cue, not rejection. Logical status is not proof
status.

## Counterclaim/Contradiction/Tension/Gap Rules

Counterclaim and contradiction refs are detected from explicit linked fields and
caller-provided tension/calibration inputs. The helper does not auto-generate
counterclaims from free text.

Contradiction is preserved as tension, not deletion. Contradictions and
counterclaims become review cues such as `resolve_contradiction` or
`resolve_counterclaim`; they do not delete or reject a claim.

Knowledge gaps are detected from explicit gap refs, linked knowledge gap
candidates, or calibration reason codes.

## Calibration Signal Use

Calibration Diagnostic is input signal, not truth. It may influence logical
status and review cues:

- `blocked` calibration -> `inspect_source`
- `ready_with_tensions` with unresolved tension -> `resolve_contradiction`
- `readiness_overclaim_risk` -> `add_evidence` or
  `state_missing_assumption`
- `evidence_missing` -> `add_evidence`
- `source_ref_missing` -> `inspect_source`

Calibration does not create proof/evidence and does not promote Perspective.

## Logical Status Rules

Ordered status rules:

1. Missing source refs without source coverage boundary -> `blocked`.
2. Empty claim text -> `underspecified`.
3. Empty conclusion text -> `missing_conclusion`.
4. Empty premise refs and premise summaries -> `missing_premise`.
5. Contradiction refs or contradiction/tension calibration signals ->
   `contradicted_by_candidate`.
6. Conclusion with no premise and no evidence support ->
   `possible_non_sequitur`.
7. Missing assumption notes -> `underspecified`.
8. Otherwise -> `well_structured_candidate`.

Logical status is not proof status.

## Review Cue Rules

Review cues are not execution authority.

- `blocked` -> `inspect_source`
- `missing_conclusion` -> `clarify_conclusion`
- `missing_premise` -> `add_premise`
- `possible_non_sequitur` -> `state_missing_assumption`
- `contradicted_by_candidate` -> `resolve_contradiction` or
  `resolve_counterclaim`
- Calibration `evidence_missing` -> `add_evidence`
- Calibration `knowledge_gap_present` -> `add_evidence`
- Calibration `readiness_overclaim_risk` -> `add_evidence` or
  `state_missing_assumption`
- `well_structured_candidate` with no other cue -> `no_action`

Review cues are operator cues only. They do not execute work.

## Authority Boundary

Logical Claim Shape Preview is structure-only. It does not prove claims. It does
not run theorem proving. It does not run formal verification. It does not create
proof/evidence. It does not promote Perspective. It does not mutate durable
Perspective state. It does not mutate work. It does not execute Codex. It does
not call GitHub. It does not call provider/OpenAI. It does not fetch sources. It
does not execute retrieval/RAG. It does not export Git Ledger packets. It does
not write product records.

The authority boundary keeps these fields false:

- `proof_check`
- `theorem_proving`
- `formal_verification`
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

- It does not prove claims.
- It does not run theorem proving.
- It does not run formal verification.
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
- Calibration Diagnostic is input signal, not truth.
- Missing premise is a review cue, not rejection.
- Contradiction is preserved as tension, not deletion.
- Logical status is not proof status.
- Review cues are not execution authority.
- Shape summary is explanation, not authority.

## Deferred Work

Deferred and not implemented here:

- Cockpit logical claim shape UI
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
- Lean/formal proof integration

## Verification Expectations

The smoke validates the type contract, helper boundary, deterministic fixture,
authority boundary, logical status coverage, review cue coverage, reason code
coverage, source-boundary behavior, calibration signal behavior, contradiction
cue behavior, stable fingerprint, package script pointer, and index pointer.

Smoke pass is a validation signal, not proof/evidence. Shape summary is
explanation, not authority.

## Next Recommended Slices

1. `feedback_to_rule_candidate_contract_v0_1`
2. `temporal_handoff_diagnostic_sections_v0_1`
3. `cockpit_lifecycle_calibration_logical_preview_readonly_v0_1`
4. `research_candidate_review_memory_contract_v0_1`
5. `empirical_calibration_dataset_plan_v0_1`

Those slices are not implemented in this PR.
