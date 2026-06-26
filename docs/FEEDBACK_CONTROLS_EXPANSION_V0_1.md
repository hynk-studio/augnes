# Feedback Controls Expansion v0.1

## 1. Purpose

Feedback Controls Expansion is local UI intent only.

This slice adds bounded UI affordances for an operator to express feedback
intent. The controls shape intent payloads for review surfaces, but they do not
persist feedback and do not create authority.

Feedback is not truth.
Feedback is not proof.
Feedback is not evidence.
Feedback is not promotion readiness.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` places this slice
after `feedback_event_aggregation_runtime_v0_1`.

The roadmap guide is not SSOT. It is an operational sequencing guide and
authority-boundary checklist. Field, type, enum, route, and runtime authority
remain with the relevant slice contracts and repo-local implementations.

## 3. Relationship to PR #792 Feedback Event Aggregation Runtime

PR #792 aggregates caller-provided public-safe feedback events into advisory
summaries and rule-failure candidates.

This slice follows that boundary. It adds local UI intent controls only and a
read-only folded audit panel for supplied intent, aggregate, and rule-failure
candidate summaries. It does not persist aggregation output and does not add a
feedback write route.

## 4. Scope and non-goals

In scope:

- Expanded feedback intent controls.
- Folded read-only audit panel.
- Public-safe fixture, docs, smoke, and browser/static validation.
- Callback-only feedback intent emission.

Out of scope:

- Feedback write route.
- Feedback event persistence.
- DB read/write.
- Candidate mutation or deletion.
- Automatic candidate rejection.
- Promotion.
- Rule mutation.
- Parser mutation.
- Durable Perspective state mutation.
- Proof/evidence creation.
- Claim/evidence writes.
- Product write or product ID allocation.
- Provider/OpenAI calls.
- Prompt sending.
- Retrieval/RAG execution.
- Source fetch or file reads as source input.
- Git Ledger export.
- Codex/GitHub automation.

Feedback controls do not persist feedback.
Feedback controls do not write DB.
Feedback controls do not call routes.
Feedback controls do not mutate candidates.
Feedback controls do not delete candidates.
Feedback controls do not promote candidates.
Feedback controls do not mutate rules.
Feedback controls do not mutate parser behavior.
Feedback controls do not mutate durable Perspective state.
Feedback controls do not product-write.

Product-write remains parked by #686.

Needs-more-evidence creates review cue intent only.
Scope-overreach creates rule failure candidate intent only.

## 5. Control shape

The expanded controls cover:

- `dismiss_preview`
- `pin_preview`
- `correct_preview`
- `invalidate_preview`
- `needs_more_evidence`
- `scope_overreach`
- `not_relevant_now`
- `mark_useful`
- `mark_wrong`

Each control is an intent affordance. Controls emit bounded payloads through an
optional callback only. They do not call routes, do not persist feedback, and do
not mutate the target candidate, surface, parser, rules, or durable state.

## 6. Feedback intent payload rules

Payloads use `feedback_controls_expansion.v0.1`, `scope: project:augnes`, and
public-safe symbolic refs. Payloads include the target surface, target surface
ref, target candidate ref, source refs, review record refs, operator actor ref,
bounded summary, reason codes, and an authority boundary.

Payloads must keep:

- `public_safe: true`
- `advisory_only: true`
- `persists_feedback: false`
- `mutates_candidate: false`
- `deletes_candidate: false`
- `promotes_candidate: false`
- `mutates_rules: false`
- `mutates_parser: false`
- `mutates_durable_state: false`
- `product_write_executed: false`

## 7. Destructive-looking action confirmation rules

Destructive-looking actions require local confirmation.

The destructive-looking controls are:

- `dismiss_preview`
- `invalidate_preview`
- `mark_wrong`

Confirmation is local display state only. Confirmation does not persist
feedback, does not call a route, and does not create mutation authority.

## 8. Correction note rules

Correction requires bounded operator note summary.

The correction note is a bounded display/review summary. It is not parser
mutation, rule mutation, proof, evidence, or durable Perspective state.

## 9. Audit panel rules

Audit panel is read-only.

The folded audit panel renders supplied feedback intent summaries, aggregation
summaries, rule failure candidates, and authority boundary fields. It is
props-only. It does not fetch, post, write DB, persist feedback, mutate state,
or product-write.

Aggregation is advisory only.
Rule failure candidates are review aids.

## 10. Privacy and redaction rules

Fixtures and emitted payload examples use bounded summaries and public-safe
symbolic refs only.

Forbidden content includes private URLs, local private paths, tokens, secrets,
raw source text, raw provider output, raw retrieval output, raw feedback
payloads, raw control payloads, raw conversation logs, hidden reasoning, raw DB
rows, browser dumps, actual prompt text, actual query text, embeddings, and
vector index dumps.

Source refs are lineage pointers, not proof.
Source refs must be public-safe symbolic refs.

## 11. Authority boundary

This PR does not add feedback write route.
This PR does not persist feedback events.
This PR does not add DB writes.

The authority boundary denies candidate mutation, candidate deletion, promotion,
rule mutation, parser mutation, durable state write/apply, Formation Receipt
write, proof/evidence writes, claim/evidence writes, product write, provider
calls, prompt sending, retrieval/RAG execution, source fetch, Git Ledger export,
Codex execution, and GitHub automation.

## 12. Deferred work

- Feedback influenced surfacing preview
- Runtime audit panel integration
- Dogfooding ingestion
- Git Ledger export
- Product write reentry

## 13. Verification expectations

Verification should include static component checks, fixture privacy checks,
docs phrase checks, package script checks, index pointer checks, browser/static
readiness validation, downstream Feedback Event Aggregation Runtime smoke,
typecheck, and diff checks.

Browser validation may remain static-only when no mounted page or browser
harness exists for this UI-only slice.

## 14. Next recommended slices

1. `feedback_influenced_surfacing_preview_v0_1`
2. `dogfooding_record_runtime_contract_v0_1`
3. `runtime_audit_panel_v0_1`
4. `git_ledger_export_contract_v0_1` only after audit/readiness review
5. `product_write_reentry_review_v0_1` only after explicit reentry approval
