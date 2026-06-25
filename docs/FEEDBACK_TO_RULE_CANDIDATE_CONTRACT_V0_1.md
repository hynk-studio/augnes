# Feedback-to-Rule Candidate Contract v0.1

Slice name: `feedback_to_rule_candidate_contract_v0_1`

## Purpose

Feedback-to-Rule Candidate is candidate-only. It defines a deterministic,
public-safe contract for summarizing durable operator feedback signals into
reviewable future rule/update suggestions.

Feedback is operator signal, not truth. Rule candidate is not rule mutation.
The contract does not apply a rule change and does not change any parser,
lifecycle, calibration, logical-shape, handoff, packet, or feedback behavior.

## Relationship To The Integrated Roadmap Guide v0.2

It implements Phase 1.4 from the integrated development roadmap guide v0.2.
The primary planning basis is
`AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`.

Older remaining-development, Research/ROI, Temporal Perspective Overlay, and
Git Ledger proposal documents are background inputs already integrated into the
roadmap guide, not standalone ordering authority.
Those older proposal documents are background inputs already integrated into the roadmap guide.

## Relationship To #762 Lifecycle, #763 Calibration, And #764 Logical Claim Shape

PR #762 added Research Candidate Lifecycle Read Model v0.1. PR #763 added
Research Candidate Calibration Diagnostic v0.1. PR #764 added Logical Claim
Shape Preview v0.1.

This contract follows those derived read/diagnostic/preview slices. It may
refer to lifecycle, calibration, and logical shape surfaces as affected
surfaces for future rule candidates, but it does not change lifecycle behavior.
It does not change calibration behavior. It does not change logical claim shape
behavior.

## Scope And Non-Goals

In scope:

- Type contract for Feedback-to-Rule candidate bundles.
- Public-safe sample fixture.
- Static smoke validation for fixture, contract vocabulary, docs, package
  script, index pointer, redaction, and authority boundaries.
- Documentation and index pointers.

Non-goals:

- No Feedback-to-Rule builder implementation.
- No feedback aggregation runtime.
- No feedback controls expansion.
- No automatic rule mutation.
- No parser/helper behavior changes.
- No runtime route.
- No UI.
- No DB query/write.
- No DB migration.
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
- No branch or PR creation from a rule candidate.
- No Git Ledger export.
- No product write.
- No product ID allocation.

Product-write remains parked by #686.

## Contract Shape

The fixture contract includes:

- `fixture_version`
- `bundle_version`
- `candidate_version`
- `scope`
- `status`
- `as_of`
- `source_fixture_refs`
- `sample_feedback_events`
- `expected_bundle`

The expected bundle includes:

- `bundle_version`
- `scope`
- `status`
- `as_of`
- `source_fixture_refs`
- `candidates`
- `affected_surface_counts`
- `feedback_pattern_counts`
- `review_status_counts`
- `risk_level_counts`
- `boundary_notes`
- `authority_boundary`
- `bundle_fingerprint`

The bundle fingerprint is deterministic SHA-256 over canonical JSON for the
expected bundle without `bundle_fingerprint`.

## Affected Surfaces

Controlled affected surfaces are:

- `manual_note_parser`
- `research_candidate_review`
- `research_candidate_lifecycle_read_model`
- `research_candidate_calibration_diagnostic`
- `logical_claim_shape_preview`
- `perspective_geometry_digest`
- `agent_perspective_substrate`
- `ai_context_packet`
- `codex_handoff_draft`
- `feedback_event_store`
- `foundation_status_review`
- `unknown`

An affected surface label is routing context for review. It is not authority to
change the surface.

## Feedback Pattern Kinds

Controlled feedback pattern kinds are:

- `repeated_dismissal`
- `repeated_pin`
- `repeated_correction`
- `repeated_invalidation`
- `needs_more_evidence_pattern`
- `scope_overreach_pattern`
- `missing_source_pattern`
- `overclaim_risk_pattern`
- `logical_structure_gap_pattern`
- `handoff_not_done_pattern`
- `authority_boundary_confusion`
- `other`

Feedback pattern kinds summarize operator signals. They do not establish truth,
proof, or automatic rule updates.

## Review Status Semantics

Controlled review statuses are:

- `candidate_only`: reviewable suggestion only.
- `needs_review`: operator review is still required.
- `rejected`: the candidate should not proceed in its current form.
- `accepted_for_future_pr`: accepted as future work text only.
- `superseded`: replaced by another candidate.

accepted_for_future_pr is not PR creation authority. It does not create a
branch, commit, GitHub automation, or PR. proposed_rule_change is review text,
not execution.

## Redaction And Secret-Like Pattern Rules

Secret-like operator notes must be blocked or redacted. Fixture examples may
use public-safe redacted markers such as `OPENAI_API_KEY=REDACTED_EXAMPLE`,
`ghp_REDACTED_EXAMPLE`, or `sk-REDACTED_EXAMPLE`.

The contract must not include real tokens, private URLs, raw user data, hidden
reasoning, provider logs, raw source bodies, or private key material. Source
feedback refs carrying token-like examples must use `redaction_status:
"redacted"` or `redaction_status: "blocked_secret_like_pattern"`.

## Candidate-To-Future-PR Boundary

Rule candidate is not rule mutation. accepted_for_future_pr is not PR creation
authority. proposed_rule_change is review text, not execution.

The contract can preserve a future PR suggestion in a public-safe candidate
record, but it does not create a branch or PR, does not call GitHub, does not
execute Codex, and does not mutate work.

## Authority Boundary

This contract is candidate-contract-only. It does not change parser behavior.
It does not change lifecycle behavior. It does not change calibration behavior.
It does not change logical claim shape behavior. It does not create
proof/evidence. It does not promote Perspective. It does not mutate durable
Perspective state. It does not mutate work. It does not execute Codex. It does
not call GitHub. It does not create a branch or PR. It does not call
provider/OpenAI. It does not fetch sources. It does not execute retrieval/RAG.
It does not export Git Ledger packets. It does not write product records.

The authority boundary keeps these fields false:

- `rule_mutation_executed_now`
- `future_pr_created_now`
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

- It does not change parser behavior.
- It does not change lifecycle behavior.
- It does not change calibration behavior.
- It does not change logical claim shape behavior.
- It does not create proof/evidence.
- It does not promote Perspective.
- It does not mutate durable Perspective state.
- It does not mutate work.
- It does not execute Codex.
- It does not call GitHub.
- It does not create a branch or PR.
- It does not call provider/OpenAI.
- It does not fetch sources.
- It does not execute retrieval/RAG.
- It does not export Git Ledger packets.
- It does not write product records.

## Deferred Work

Deferred work:

- Feedback-to-Rule builder implementation.
- Feedback aggregation runtime.
- Feedback controls expansion.
- Automatic rule mutation.
- Codex PR creation from rule candidates.
- GitHub automation.
- Cockpit Feedback-to-Rule UI.
- Temporal handoff diagnostics.
- Cockpit lifecycle/calibration/logical preview.
- Durable Candidate Review Memory.
- Source intake runtime.
- Provider extraction runtime.
- Retrieval/RAG runtime.
- Human-reviewed promotion.
- Formation Receipt durable write.
- Durable Perspective state apply.
- Git Ledger export.
- Product write reentry.

## Verification Expectations

Verification should run:

- `node --check scripts/smoke-feedback-to-rule-candidate-contract-v0-1.mjs`
- `npm run smoke:feedback-to-rule-candidate-contract-v0-1`
- Existing downstream Research Candidate smokes requested by the PR handoff.
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

Smoke pass is validation signal, not proof/evidence. PR body is an operator
report, not authority.

## Next Recommended Slices

Recommended follow-up slices:

1. `feedback_to_rule_candidate_builder_v0_1`
2. `temporal_handoff_diagnostic_sections_v0_1`
3. `cockpit_lifecycle_calibration_logical_preview_readonly_v0_1`
4. `research_candidate_review_memory_contract_v0_1`
5. `empirical_calibration_dataset_plan_v0_1`

Do not implement those next slices in this PR.
