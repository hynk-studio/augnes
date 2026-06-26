# Product Write Reentry Review v0.1

## 1. Purpose

Product Write Reentry Review is review-only.

Product-write remains parked by #686.

This slice builds a bounded public-safe review model for future product-write
reentry prerequisites. It shows why product-write remains blocked or what
future prerequisites would still be required. It does not grant product-write
authority, execute product-write, allocate product IDs, persist products, or
mutate durable state.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This implements the `product_write_reentry_review_v0_1` slice from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` as a review-only
gate after Git Ledger Export Contract v0.1.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Field, type, enum, and runtime
authority remains with this slice contract and the existing repo-local SSOT
layers.

## 3. Relationship to Runtime Audit Panel and Git Ledger Export Contract

Runtime audit is review context, not authority.

Git Ledger packets are review/export candidates, not commits.

This slice can reference runtime audit, Git Ledger contract packets, dogfooding
records, feedback aggregates, durable state apply refs, Formation Receipt refs,
and promotion decision refs only as public-safe symbolic review context. Those
refs do not create product-write authority, truth, proof, accepted evidence, or
durable Perspective state authority.

Smoke/CI pass is not truth.

## 4. Scope and non-goals

In scope:

- Deterministic product-write reentry review helper.
- Public-safe fixture.
- Static smoke validation.
- Docs, package script, and latest-index pointer.

Out of scope:

- Product-write runtime.
- Product-write adapter enablement.
- Disabled adapter reentry harness.
- Product write target contract.
- Product ID allocation.
- Product persistence.
- Product routes or UI.
- DB read/write or migrations.
- Routes or UI.
- Durable Perspective state mutation.
- Formation Receipt write.
- Promotion execution or promotion decision write.
- Proof/evidence creation.
- Claim/evidence writes.
- Git Ledger export runtime, Git writes, or GitHub calls.
- Provider/OpenAI calls.
- Prompt sending.
- Retrieval or RAG execution.
- Source fetch or file reads as source input.
- Browser log, session log, raw conversation, hidden reasoning, or telemetry ingestion.
- Codex/GitHub automation.
- Work mutation, background jobs, external network calls, dependencies, or GitHub Actions.

This PR does not re-enable product-write.

This PR does not implement product-write runtime.

This PR does not enable product-write adapter.

This PR does not allocate product IDs.

This PR does not persist products.

This PR does not write DB.

This PR does not call routes.

This PR does not add UI.

This PR does not mutate durable Perspective state.

This PR does not write Formation Receipts.

This PR does not promote Perspective.

This PR does not create proof/evidence.

This PR does not write claim/evidence records.

This PR does not execute Git Ledger export.

This PR does not call GitHub.

This PR does not call providers.

This PR does not execute retrieval or RAG.

## 5. Reentry review input shape

Inputs use `product_write_reentry_input.v0.1` and
`product_write_reentry_review.v0.1` with `scope: project:augnes`.

The input carries a review id, timestamp, symbolic review-context refs,
requested prerequisites, boundary notes, reason codes, and an optional authority
boundary. Inputs are public-safe bounded review context only.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

## 6. Prerequisite shape

Prerequisites use `product_write_reentry_prerequisite.v0.1` with
`scope: project:augnes`.

Each prerequisite carries a public-safe id, prerequisite kind, satisfied flag,
bounded summary, symbolic refs, reason codes, and a review-only authority
boundary. Missing prerequisites are review cues only. They do not create
product-write authority or product-write readiness.

## 7. Gate decision rules

Gate decisions can be `blocked`, `remains_parked`,
`needs_explicit_reentry_approval`, `eligible_for_future_reentry_review`, or
`rejected`.

`blocked` means one or more blocking prerequisites are missing.

`remains_parked` means required review context is absent and Product-write
remains parked by #686.

`needs_explicit_reentry_approval` means future reentry approval is still
required.

`eligible_for_future_reentry_review` means supplied prerequisites are satisfied
for review purposes only. It does not grant authority.

`rejected` means the supplied review context is not acceptable for a future
reentry review.

## 8. Product-write authority rules

Product-write authority is not granted by review context.

The review result always keeps `product_write_executed: false`,
`product_id_allocated: false`, and `product_write_authority_granted: false`.

Product-write remains parked by #686 unless and until an explicit future
reentry approval slice says otherwise.

## 9. Privacy and redaction rules

Product-write reentry review input must be public-safe. Private/raw markers are
rejected case-insensitively. Raw conversation markers are blocked. Hidden
reasoning markers are blocked. Telemetry dump markers are blocked. Secret-like
values, private URLs, and local private path markers are blocked.

Unknown or extra input fields are scanned for private/raw/secret-like markers.
Unknown fields cannot carry raw conversation, hidden reasoning, telemetry,
secrets, private paths, or private URLs through the review builder.

Fixtures and examples use bounded summaries and public-safe symbolic refs only.
They do not store raw source bodies, raw provider output, raw retrieval output,
raw product-write payload, raw audit payload, raw ledger payload, raw
conversation, hidden reasoning, browser dumps, raw DB rows, actual prompts,
actual queries, telemetry dumps, private URLs, local private paths, tokens, or
secrets.

Blocked examples may use bounded placeholder text only to demonstrate blocked
inputs.

## 10. Authority boundary

Product-write remains parked by #686.

The review denies product-write runtime, product-write adapter enablement,
product target contract authority, product ID allocation, product persistence,
product routes, product UI, DB query/write, routes, UI, durable state
writes/apply, Formation Receipt writes, promotion execution, promotion decision
writes, proof/evidence records, claim/evidence writes, provider/OpenAI calls,
prompt sending, retrieval execution, RAG answer generation, source fetch,
local/repository/uploaded file reads, browser/session/raw conversation
ingestion, telemetry ingestion, Git Ledger export runtime, Git writes, commits,
branches, tags, GitHub API calls, pull request creation, repository file writes,
Codex execution authority, GitHub automation authority, product-write authority,
review context authority, runtime audit truth, smoke pass truth, and CI pass
truth.

## 11. Deferred work

- Release readiness matrix
- Disabled product write adapter reentry harness
- Product write target contract
- Product write adapter implementation only after explicit reentry approval
- Product write runtime only after explicit reentry approval

## 12. Verification expectations

Verification should run the Product Write Reentry Review smoke, Git Ledger
Export Contract downstream smoke, Runtime Audit downstream smoke and
browser/static validation, dogfooding and feedback downstream smokes, typecheck,
and diff checks.

The smoke should verify deterministic review building, empty input behavior,
every gate decision and prerequisite kind, blocked private/raw inputs, forbidden
authority rejection, product-write flags remaining false, docs/index pointers,
package script, privacy boundaries, no forbidden imports, and absence of
positive authority grants.

## 13. Next recommended slices

1. release_readiness_matrix_v0_1
2. disabled_product_write_adapter_reentry_harness_v0_1 only after explicit reentry approval
3. product_write_target_contract_v0_1 only after explicit reentry approval
4. product_write_adapter_runtime_v0_1 only after explicit reentry approval
5. release_candidate_operator_review_v0_1
