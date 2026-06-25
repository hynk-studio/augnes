# Feedback-to-Rule Candidate Builder v0.1

## 1. Purpose

Feedback-to-Rule Candidate Builder is deterministic and candidate-only.

This slice turns caller-provided, public-safe feedback events into candidate-only future rule/update suggestions that match the v0.1 Feedback-to-Rule Candidate Contract. It groups feedback by target surface, target id, and derived feedback pattern, then emits bounded review text, reason codes, risk labels, redaction status, and an authority boundary.

It does not apply rules. It does not write memory. It does not open a runtime path.

## 2. Relationship to the integrated roadmap guide v0.2

It implements the builder follow-up from Phase 1.4 of the integrated development roadmap guide v0.2.

The primary planning basis is `AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`. Older remaining-development, Research/ROI, Temporal Perspective Overlay, and Git Ledger proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship to #765 Feedback-to-Rule Candidate Contract

It follows the #765 Feedback-to-Rule Candidate Contract.

The builder emits the same contract shape:

- `feedback_to_rule_candidate_bundle.v0.1`
- `feedback_to_rule_candidate.v0.1`
- `project:augnes`
- `candidate_contract_only`

The output remains compatible with the contract fixture and smoke expectations. The builder adds deterministic grouping and sanitization only; it does not expand the contract into runtime behavior.

## 4. Scope and non-goals

In scope:

- deterministic helper/builder
- public-safe fixture
- smoke validation
- docs pointer
- package script
- index pointer
- minimal builder input type additions

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
- branch or PR creation from Augnes runtime
- Git Ledger export
- product write
- product ID allocation
- package dependencies
- GitHub Actions
- CI runtime changes
- automatic rule mutation
- parser/helper behavior changes
- feedback aggregation runtime
- feedback controls expansion

## 5. Input artifacts

The builder accepts caller-provided feedback events and optional candidate overrides. The helper does not read files, open a DB, call providers, call GitHub, fetch sources, execute retrieval/RAG, create branches, create PRs, or use the current clock.

Required event fields are bounded to public-safe metadata:

- `event_id`
- `event_type`
- `target_kind`
- `target_id`
- `source_ref_ids`
- `operator_note` or `operator_note_summary`
- `created_at`

The caller owns all input collection. The builder only transforms the provided values.

## 6. Builder output shape

The output bundle includes:

- deterministic candidate ids
- affected surface counts
- feedback pattern counts
- review status counts
- risk level counts
- source feedback refs
- redaction status
- reason codes
- boundary notes
- authority boundary
- deterministic `bundle_fingerprint`

The fingerprint is a SHA-256 hash over canonical JSON excluding `bundle_fingerprint` itself.

## 7. Grouping and pattern rules

Feedback events are sorted by target kind, target id, event type, created timestamp, and event id. Candidate output is sorted by affected surface, feedback pattern kind, and candidate id.

Target kinds map to affected surfaces such as:

- `lifecycle` -> `research_candidate_lifecycle_read_model`
- `calibration` -> `research_candidate_calibration_diagnostic`
- `logical_claim_shape` -> `logical_claim_shape_preview`
- `handoff` -> `codex_handoff_draft`
- unrecognized values -> `unknown`

Pattern kinds are derived from repeated event types first, then from bounded note hints such as missing evidence, scope overreach, missing source coverage, overclaim risk, logical structure gaps, incomplete handoff, or authority boundary confusion.

## 8. Repeated pattern rules

repeated_* patterns require at least two distinct feedback events.

A single feedback event may still produce a candidate signal, but it must not be labeled `repeated_*` unless another distinct event supports the repeated pattern. The builder and smoke require repeated candidates to have at least two `feedback_event_refs` and at least two matching `source_feedback_refs`.

`source_feedback_refs.feedback_event_ref` values must match `feedback_event_refs` exactly as a set.

## 9. Redaction and secret-like pattern rules

Secret-like operator notes must be blocked or redacted.

The builder detects public redacted markers and unredacted secret-like patterns. Safe redacted examples may be summarized only as redacted. Unredacted secret-like input is blocked from output summaries and may only produce generic text such as "Operator note contained secret-like material and was blocked from summary."

The builder must not echo raw token-like values in candidate ids, observed patterns, proposed changes, expected benefits, risk notes, boundary notes, or source feedback summaries.

## 10. Candidate-to-future-PR boundary

Feedback is operator signal, not truth.

Rule candidate is not rule mutation.

accepted_for_future_pr is not PR creation authority.

proposed_rule_change is review text, not execution.

`accepted_for_future_pr` is only a review status in the candidate bundle. It does not create a branch, create a pull request, run Codex, call GitHub, or mutate code.

## 11. Validation rules

Validation fails when:

- bundle or candidate versions are wrong
- scope or candidates are empty
- the fingerprint is empty or mismatched
- candidate ids duplicate
- controlled vocabulary values are outside the contract
- required text fields are empty
- feedback refs are empty
- source feedback refs do not match feedback refs as a set
- a repeated pattern has fewer than two distinct feedback refs
- `accepted_for_future_pr` lacks boundary reason codes
- authority boundaries grant forbidden authority
- output text contains unredacted secret-like material
- output text claims a rule was applied, a PR was created, proof/evidence was created, Perspective was promoted, state was committed, product write happened, truth was established, or automatic mutation occurred

## 12. Authority boundary

The builder authority boundary is candidate-only.

The builder does not change parser behavior.

The builder does not change lifecycle behavior.

The builder does not change calibration behavior.

The builder does not change logical claim shape behavior.

The builder does not create proof/evidence.

The builder does not promote Perspective.

The builder does not mutate durable Perspective state.

The builder does not mutate work.

The builder does not execute Codex.

The builder does not call GitHub.

The builder does not create a branch or PR.

The builder does not call provider/OpenAI.

The builder does not fetch sources.

The builder does not execute retrieval/RAG.

The builder does not export Git Ledger packets.

The builder does not write product records.

Product-write remains parked by #686.

## 13. Deferred work

Deferred:

- Feedback aggregation runtime
- Feedback controls expansion
- Automatic rule mutation
- Codex PR creation from rule candidates
- GitHub automation
- Cockpit Feedback-to-Rule UI
- Temporal handoff diagnostics
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

## 14. Verification expectations

Expected local verification:

- `node --check scripts/smoke-feedback-to-rule-candidate-builder-v0-1.mjs`
- `npm run smoke:feedback-to-rule-candidate-builder-v0-1`
- `npm run smoke:feedback-to-rule-candidate-contract-v0-1`
- `npm run smoke:research-candidate-logical-claim-shape-v0-1`
- `npm run smoke:research-candidate-calibration-diagnostic-v0-1`
- `npm run smoke:research-candidate-lifecycle-read-model-v0-1`
- `npm run smoke:research-to-perspective-foundation-status-review-v0-1`
- `npm run smoke:research-to-perspective-fixture-smoke-legacy-audit-v0-1`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

Smoke pass is validation signal, not proof/evidence.

## 15. Next recommended slices

1. `temporal_handoff_diagnostic_sections_v0_1`
2. `cockpit_lifecycle_calibration_logical_preview_readonly_v0_1`
3. `research_candidate_review_memory_contract_v0_1`
4. `empirical_calibration_dataset_plan_v0_1`
5. `feedback_event_aggregation_runtime_v0_1`

These slices are not implemented here.
