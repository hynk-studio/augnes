# Runtime Audit Panel v0.1

## 1. Purpose

Runtime Audit Panel is read-only.

Runtime Audit Panel is a review surface, not source of truth.

Audit is a review cue, not truth.

Audit is not proof.

Audit is not authority.

This slice builds a bounded audit model from caller-provided public-safe audit
facts and renders that model in a props-only panel. It helps operators review
runtime boundaries across dogfooding, feedback, durable state, manual anchors,
routes, stores, verification, and product-write parking without creating new
runtime authority.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This implements the Phase 6.3 `runtime_audit_panel_v0_1` slice from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Field, type, enum, and runtime
authority remains with the local slice contracts and existing repo-local SSOT
layers.

## 3. Relationship to PR #786 through PR #796

This slice follows the bounded runtime chain from durable Perspective state
apply through dogfooding ingestion.

PR #786 Durable Perspective State Apply introduced durable state-write audit
boundaries. PR #787 through PR #791 added trajectory and constellation layout
read/write slices. PR #792 through PR #794 added feedback aggregation,
expanded controls, and advisory surfacing preview. PR #795 defined dogfooding
record contracts. PR #796 added bounded dogfooding ingestion.

This PR adds a read-only audit panel over caller-provided public-safe summaries
from those slices. It does not read their stores, call their routes, fetch
data, write DB rows, mutate durable state, or product-write.

## 4. Scope and non-goals

In scope:

- Deterministic runtime audit model builder.
- Read-only runtime audit panel component.
- Public-safe fixture.
- Static smoke and browser/static validation.
- Docs, package scripts, and latest-index pointer.

Out of scope:

- Runtime audit persistence.
- Audit write route.
- Audit read route.
- DB read/write or migration.
- Route calls.
- Fetch.
- Server actions.
- Durable Perspective state mutation.
- Dogfooding ingestion.
- Manual anchor write.
- Feedback write.
- Candidate mutation or deletion.
- Rule or parser mutation.
- Promotion execution.
- Formation Receipt write.
- Promotion decision write.
- Proof/evidence creation.
- Claim/evidence writes.
- Product write or product ID allocation.
- Provider/OpenAI calls.
- Prompt sending.
- Retrieval or RAG execution.
- Source fetch or file reads as source input.
- Browser log, session log, raw conversation, or telemetry ingestion.
- Git Ledger export.
- Codex/GitHub automation.
- Work mutation, background jobs, external network calls, dependencies, or GitHub Actions.

Runtime Audit Panel does not write DB.

Runtime Audit Panel does not call routes.

Runtime Audit Panel does not fetch data.

Runtime Audit Panel does not mutate durable Perspective state.

Runtime Audit Panel does not write Formation Receipts.

Runtime Audit Panel does not promote Perspective.

Runtime Audit Panel does not create proof/evidence.

Runtime Audit Panel does not write claim/evidence records.

Runtime Audit Panel does not product-write.

## 5. Audit input shape

Inputs use `runtime_audit_model_builder.v0.1` and
`runtime_audit_panel.v0.1` with `scope: project:augnes`.

The input carries an audit id, timestamp, public-safe input items, boundary
notes, reason codes, and an optional authority boundary. Each input item
contains a section kind, severity, bounded title, bounded summary, symbolic
lineage refs, `public_safe: true`, reason codes, and an optional authority
boundary.

All refs are symbolic lineage pointers. Source refs are lineage pointers, not proof.
Source refs must be public-safe symbolic refs.

## 6. Audit model shape

The model includes version fields, scope, audit id, status, timestamp, sorted
sections, sorted audit items, blocked item refs, warnings, boundary notes,
reason codes, authority boundary, and a deterministic audit fingerprint.

The audit fingerprint is deterministic canonical JSON over the model without
`audit_fingerprint`.

## 7. Section and item rules

Sections are sorted by `section_kind`. Items are sorted by `section_kind`,
`severity`, and `input_item_id`, then deduplicated by `input_item_id`.

Section kinds cover authority, route, store, state mutation, product-write,
provider/retrieval, dogfooding, feedback, Perspective state, layout,
verification, privacy, and unknown boundaries.

Severity values are review cues only. Verification is not proof.
Smoke pass is not truth.
CI pass is not truth.

## 8. Read-only panel rules

The panel is props-only and read-only. It may keep local display state for item
selection, but it does not call routes, fetch data, persist audit facts, write
DB rows, or execute mutations.

The panel has no save, apply, promote, delete, or product-write controls.

## 9. Verification signal rules

Verification summaries are review cues, not proof.

Smoke pass is not truth.

CI pass is not truth.

Verification refs can help an operator locate checks, but they do not create
truth, proof, promotion readiness, product-write authority, or durable state
authority.

## 10. Dogfooding and feedback review cue rules

Dogfooding records are bounded review records.

Dogfooding records and review cues can appear as audit context only. They are
not truth, proof, or promotion readiness.

Feedback aggregation is advisory only.

Surfacing preview refs are advisory display context only.

Manual anchors are display hints.

Durable state apply is not product-write.

Formation Receipt refs are lineage context only in this panel.

## 11. Privacy and redaction rules

Runtime Audit Panel input must be public-safe. Private/raw markers are rejected
case-insensitively. Raw conversation markers are blocked. Hidden reasoning
markers are blocked. Telemetry dump markers are blocked. Secret-like values,
private URLs, and local private path markers are blocked.

Fixtures and examples use bounded summaries and public-safe symbolic refs only.
They do not store raw source bodies, raw provider output, raw retrieval output,
raw dogfooding payload, raw audit payload, raw conversations, hidden reasoning,
browser dumps, raw DB rows, actual prompts, actual queries, telemetry dumps,
private URLs, local private paths, tokens, or secrets.

Blocked examples may use bounded placeholder text only to demonstrate blocked
inputs.

## 12. Authority boundary

Product-write remains parked by #686.

Runtime Audit Panel creates no runtime authority. It denies runtime audit
persistence, audit routes, DB query/write, route calls, fetch, durable state
writes/apply, Formation Receipt writes, promotion execution, promotion decision
writes, proof/evidence records, claim/evidence writes, product writes, product
ID allocation, candidate mutation/deletion, rule mutation, parser mutation,
source fetch, local/repository/uploaded file reads, provider/OpenAI calls,
prompt sending, retrieval execution, RAG answer generation, browser/session
log ingestion, raw conversation ingestion, telemetry ingestion, embedding,
vector search, Git Ledger export, Codex execution authority, GitHub automation
authority, audit truth/proof/authority, verification truth, smoke pass truth,
CI pass truth, and product-write authority.

## 13. Deferred work

- Git Ledger export.
- Product write reentry.
- Release readiness matrix.
- Disabled product write adapter reentry harness.

## 14. Verification expectations

Verification should run the runtime audit panel smoke, browser/static
validation, dogfooding ingestion downstream smoke, feedback/surfacing smokes,
typecheck, and diff checks.

The smoke should verify deterministic model building, empty input behavior,
blocked private/raw inputs, forbidden authority rejection, fixture coverage,
component labels, no false affordances, docs/index boundaries, package scripts,
and public-safe fixture boundaries.

The browser/static validation checks 390px viewport readiness wording for this
read-only audit panel slice when no mounted page/browser harness exists.

## 15. Next recommended slices

1. git_ledger_export_contract_v0_1 only after audit/readiness review
2. product_write_reentry_review_v0_1 only after explicit reentry approval
3. release_readiness_matrix_v0_1
4. disabled_product_write_adapter_reentry_harness_v0_1 only after explicit reentry approval
5. product_write_target_contract_v0_1 only after explicit reentry approval
