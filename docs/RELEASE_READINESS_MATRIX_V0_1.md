# Release Readiness Matrix v0.1

## 1. Purpose

Release Readiness Matrix is review-only.

This slice builds a deterministic public-safe review matrix for future
release-candidate review. It summarizes whether review context is blocked, not
ready, needs operator review, or is ready for a future release-candidate review.

Release readiness is not truth.

Release readiness is not proof.

Release readiness does not grant authority.

Release candidate review is not release.

This PR does not execute a release.

This PR does not create release artifacts.

This PR does not approve a release candidate.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This implements the `release_readiness_matrix_v0_1` slice from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` as a review-only
matrix after Product Write Reentry Review v0.1.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Field, type, enum, and runtime
authority remains with this slice contract and the existing repo-local SSOT
layers.

## 3. Relationship to Product Write Reentry Review and Git Ledger Export Contract

Product-write remains parked by #686.

Product-write authority is not granted.

Product-write is not executed.

Product IDs are not allocated.

Product-write runtime is not implemented.

Product-write adapter is not enabled.

Runtime audit is review context, not authority.

Git Ledger packets are review/export candidates, not commits.

Smoke/CI pass is not truth.

The matrix can reference product-write reentry review, Git Ledger contract,
runtime audit, dogfooding, feedback, verification, rollback, idempotency,
failure-mode, state-boundary, external-side-effect, operator-approval, and
release-scope summaries only as review context. Those refs do not create
release authority, product-write authority, truth, proof, accepted evidence, or
durable Perspective state authority.

## 4. Scope and non-goals

In scope:

- Deterministic release readiness matrix helper.
- Public-safe fixture.
- Static smoke validation.
- Docs, package script, and latest-index pointer.

Out of scope:

- Release runtime or release execution.
- Release routes, UI, or release artifact generation.
- Product-write runtime, adapter enablement, target contract, product ID
  allocation, product persistence, product routes, or product UI.
- Git Ledger export runtime, Git writes, GitHub API calls, pull request
  creation, or repository file writes.
- DB read/write or migrations.
- Routes or UI.
- Durable Perspective state mutation.
- Formation Receipt write.
- Promotion execution or promotion decision write.
- Proof/evidence creation.
- Claim/evidence writes.
- Provider/OpenAI calls.
- Prompt sending.
- Retrieval or RAG execution.
- Source fetch or file reads as source input.
- Browser log, session log, raw conversation, hidden reasoning, or telemetry
  ingestion.
- Codex/GitHub automation.
- Work mutation, background jobs, external network calls, dependencies, or
  GitHub Actions.

This PR does not write DB.

This PR does not add routes.

This PR does not add UI.

This PR does not mutate durable Perspective state.

This PR does not execute Git Ledger export.

This PR does not execute Git.

This PR does not call GitHub.

This PR does not call providers.

This PR does not execute retrieval or RAG.

## 5. Readiness input shape

Inputs use `release_readiness_input.v0.1` and
`release_readiness_matrix.v0.1` with `scope: project:augnes`.

The input carries a matrix id, timestamp, required top-level refs, public-safe
review items, boundary notes, reason codes, and an optional authority boundary.
Inputs are public-safe bounded review context only.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

## 6. Matrix item shape

Items use `release_readiness_item.v0.1` with `scope: project:augnes`.

Each item carries a public-safe id, category, severity, satisfied flag, bounded
title, bounded summary, symbolic refs, reason codes, and a read-only authority
boundary. Items are review signals only. They are not truth, proof, release
approval, product-write authority, or accepted evidence.

## 7. Category summary shape

Category summaries use `release_readiness_category.v0.1` with
`scope: project:augnes`.

Each summary aggregates the caller-provided public-safe items for one category.
It includes satisfied, unsatisfied, blocking, and critical counts plus item
refs. Missing mandatory categories are represented as stable missing category
refs and not as fabricated satisfied items.

## 8. Decision rules

Decisions can be `blocked`, `not_ready`, `needs_operator_review`,
`ready_for_release_candidate_review`, or `rejected`.

`rejected` means the supplied review items include an unknown category or an
invalid/private payload.

`blocked` means a mandatory category is missing or an unsatisfied blocking or
critical item is present.

`not_ready` means required top-level refs are missing.

`not_ready` reason codes identify only the required refs that are actually
missing. Present refs are not also reported as missing.

`*_ref_present` reason codes are emitted only when matching refs are actually
supplied. Category labels alone do not create ref-present reason codes.

`needs_operator_review` means non-blocking review gaps remain.

`ready_for_release_candidate_review` means all mandatory categories are present
and satisfied and required refs are present. It still does not grant release
authority, approve a release candidate, execute a release, create release
artifacts, or grant product-write authority.

## 9. Authority rules

The matrix always keeps `release_executed: false`,
`release_artifact_created: false`, `release_authority_granted: false`,
`release_candidate_approved: false`, `product_write_executed: false`,
`product_id_allocated: false`, and `product_write_authority_granted: false`.

The authority boundary denies release execution, release artifact creation,
release authority, release-candidate approval, product-write, product-write
runtime, product-write adapter enablement, product target contract authority,
product ID allocation, product persistence, product routes, product UI, DB
query/write, routes, UI, durable state writes/apply, Formation Receipt writes,
promotion execution, promotion decision writes, proof/evidence records,
claim/evidence writes, provider/OpenAI calls, prompt sending, retrieval
execution, RAG answer generation, source fetch, local/repository/uploaded file
reads, browser/session/raw conversation ingestion, telemetry ingestion, Git
Ledger export runtime, Git writes, commits, branches, tags, GitHub API calls,
pull request creation, repository file writes, Codex execution authority,
GitHub automation authority, release readiness truth/proof/authority,
verification truth, smoke pass truth, CI pass truth, and product-write
authority.

## 10. Privacy and redaction rules

Release readiness matrix input must be public-safe. Private/raw markers are
rejected case-insensitively. Raw conversation markers are blocked. Hidden
reasoning markers are blocked. Telemetry dump markers are blocked. Secret-like
values, private URLs, and local private path markers are blocked.

Token-like secret markers are detected case-insensitively without treating
ordinary words such as risk-reduction or task-level as secrets.

Unknown or extra input fields are scanned for private/raw/secret-like markers.
Unknown fields cannot carry raw conversation, hidden reasoning, telemetry,
secrets, private paths, private URLs, raw release payload, raw audit payload, or
raw ledger payload through the matrix builder.

Fixtures and examples use bounded summaries and public-safe symbolic refs only.
They do not store raw source bodies, raw provider output, raw retrieval output,
raw product-write payload, raw release payload, raw audit payload, raw ledger
payload, raw conversation, hidden reasoning, browser dumps, raw DB rows, actual
prompts, actual queries, telemetry dumps, private URLs, local private paths,
tokens, or secrets.

Blocked examples may use bounded placeholder text only to demonstrate blocked
inputs.

## 11. Deferred work

- Disabled product write adapter reentry harness
- Product write target contract
- Product write adapter implementation only after explicit reentry approval
- Product write runtime only after explicit reentry approval
- Release candidate operator review

## 12. Verification expectations

Verification should run the Release Readiness Matrix smoke, Product Write
Reentry Review downstream smoke, Git Ledger downstream smoke, Runtime Audit
downstream smoke and browser/static validation, dogfooding and feedback
downstream smokes, typecheck, and diff checks.

The smoke should verify deterministic matrix building, empty input behavior,
every decision, category, and severity, missing mandatory category handling,
required-ref handling, blocked private/raw inputs, token-aware marker blocking,
public-safe hyphenated text, forbidden authority rejection, release/product
flags remaining false, docs/index pointers, package script, privacy boundaries,
no forbidden imports, and absence of positive authority grants.

## 13. Next recommended slices

1. disabled_product_write_adapter_reentry_harness_v0_1 only after explicit reentry approval
2. product_write_target_contract_v0_1 only after explicit reentry approval
3. product_write_adapter_runtime_v0_1 only after explicit reentry approval
4. release_candidate_operator_review_v0_1
5. release_notes_public_safe_summary_v0_1
