# Release Operator Checklist v0.1

## 1. Purpose

Release Operator Checklist is review-only.

Release Operator Checklist is candidate-only.

Release Operator Checklist is not release approval.

Release Operator Checklist does not publish release notes.

Release Operator Checklist does not create release artifacts.

Release Operator Checklist does not execute release.

Release Operator Checklist does not approve release.

Release Operator Checklist does not grant release authority.

Release Operator Checklist does not grant product-write authority.

This slice builds deterministic public-safe checklist candidates for future
human/operator review. It does not publish notes, approve a release, execute a
release, create release artifacts, product-write, or grant authority.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This implements the `release_operator_checklist_v0_1` slice from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` as a
review-only/candidate-only checklist builder after Release Notes Public Safe
Summary v0.1.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Field, type, enum, and runtime
authority remains with this slice contract and the existing repo-local SSOT
layers.

## 3. Relationship to Release Notes Public Safe Summary and Release Candidate Operator Review

Product-write remains parked by #686.

Product-write authority is not granted.

Product-write runtime is not implemented.

Product-write adapter is not enabled.

Product-write target contract is not created.

Product IDs are not allocated.

Products are not persisted.

Release notes summary, release candidate operator review, release readiness,
disabled harness, product-write reentry review, Git Ledger, runtime audit,
dogfooding, feedback, verification, privacy, rollback, idempotency,
failure-mode, release-boundary, product-write-boundary, and operator note refs
are review context only. They do not grant release authority, release approval,
product-write authority, adapter runtime authority, product target contract
authority, truth, proof, or accepted evidence.

Runtime audit, Git Ledger packets, release readiness, release candidate
operator review, release notes summary, and disabled harness output are review
context only, not authority.

Smoke/CI pass is not truth.

## 4. Scope and non-goals

In scope:

- Deterministic release operator checklist helper.
- Public-safe fixture.
- Static smoke validation.
- Docs, package script, and latest-index pointer.

Out of scope:

- Release execution.
- Release artifact generation.
- Release notes publication.
- Release approval automation.
- Release publish routes or UI.
- Product-write runtime, adapter enablement, target contract, product ID
  allocation, product persistence, product routes, or product UI.
- DB read/write or migrations.
- Routes or UI.
- Durable Perspective state mutation.
- Formation Receipt write.
- Promotion execution or promotion decision write.
- Proof/evidence creation.
- Claim/evidence writes.
- Git Ledger export runtime, Git writes, GitHub API calls, pull request
  creation, or repository file writes.
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

This PR does not write Formation Receipts.

This PR does not promote Perspective.

This PR does not create proof/evidence.

This PR does not write claim/evidence records.

This PR does not execute Git Ledger export.

This PR does not execute Git.

This PR does not call GitHub.

This PR does not call providers.

This PR does not execute retrieval or RAG.

## 5. Checklist input shape

Inputs use `release_operator_checklist_input.v0.1` and
`release_operator_checklist.v0.1` with `scope: project:augnes`.

The input carries a checklist id, timestamp, release notes summary refs,
release candidate operator refs, release readiness refs, public-safe checklist
items, boundary notes, reason codes, and an optional authority boundary.
Inputs are bounded public-safe review context only.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

## 6. Checklist item shape

Checklist items use `release_operator_checklist_item.v0.1` with
`scope: project:augnes`.

Each item carries a public-safe id, item kind, severity, checked flag, bounded
title, bounded summary, symbolic refs, reason codes, and optional authority
boundary. Items are checklist candidate signals only. They are not truth,
proof, release approval, product-write authority, accepted evidence, or
release artifacts.

Required item kinds are release notes summary, release candidate operator
review, release readiness, disabled product-write harness, product-write
reentry, Git Ledger contract, runtime audit, verification, privacy, release
boundary, and product-write boundary. Dogfooding, feedback, rollback,
idempotency, failure modes, and operator notes are review context. Unknown
items are rejected.

## 7. Decision rules

Decisions can be `checklist_candidate_only`, `needs_operator_review`,
`blocked`, or `rejected`.

`rejected` means an unknown item kind or invalid non-private input was
supplied.

`blocked` means required checklist items are missing or an unchecked blocking
or critical item exists.

`needs_operator_review` means non-blocking unchecked items or top-level review
context gaps remain.

`checklist_candidate_only` means required items are present, required items are
checked, top-level review refs are present, and the output is a public-safe
candidate for future human/operator review only.

`checklist_candidate_only` still does not publish release notes, execute a
release, create release artifacts, approve release, grant release authority,
grant product-write authority, enable product-write, or allocate product IDs.

## 8. Authority rules

Release Operator Checklist does not grant release authority.

Release Operator Checklist does not grant product-write authority.

Forbidden authority fields are rejected anywhere in the input object. Unknown
fields cannot carry release, product-write, GitHub, DB, route, UI, provider,
retrieval, RAG, state mutation, or automation authority. `authority_boundary`
is not the only place where forbidden authority grants are checked.

The result always keeps `release_executed: false`,
`release_artifact_created: false`, `release_notes_published: false`,
`release_authority_granted: false`, `release_candidate_approved: false`,
`product_write_executed: false`, `product_id_allocated: false`, and
`product_write_authority_granted: false`.

The authority boundary denies release execution, release artifact creation,
release notes publication, release authority, release-candidate approval,
product-write, product-write runtime, product-write adapter enablement,
product target contract authority, product ID allocation, product persistence,
product routes, product UI, DB query/write, routes, UI, durable state
writes/apply, Formation Receipt writes, promotion execution, promotion
decision writes, proof/evidence records, claim/evidence writes,
provider/OpenAI calls, prompt sending, retrieval execution, RAG answer
generation, source fetch, local/repository/uploaded file reads,
browser/session/raw conversation ingestion, telemetry ingestion, Git Ledger
export runtime, Git writes, commits, branches, tags, GitHub API calls, pull
request creation, repository file writes, Codex execution authority, GitHub
automation authority, release-operator checklist truth/proof/authority,
verification truth, smoke pass truth, CI pass truth, and product-write
authority.

## 9. Privacy and redaction rules

Release operator checklist input must be public-safe. Private/raw markers are
rejected case-insensitively. Raw conversation markers are blocked. Hidden
reasoning markers are blocked. Telemetry dump markers are blocked.
Secret-like values, private URLs, and local private path markers are blocked.

Token-like secret markers are detected case-insensitively without treating
ordinary words such as risk-reduction or task-level as secrets.

Unknown or extra input fields are scanned for private/raw/secret-like markers.
Unknown fields cannot carry raw conversation, hidden reasoning, telemetry,
secrets, private paths, private URLs, raw product-write payload, raw release
payload, raw release notes payload, raw checklist payload, raw audit payload,
or raw ledger payload through the checklist builder.

Fixtures and examples use bounded summaries and public-safe symbolic refs only.
They do not store raw source bodies, raw provider output, raw retrieval output,
raw product-write payload, raw release payload, raw release notes payload, raw
checklist payload, raw audit payload, raw ledger payload, raw conversation,
hidden reasoning, browser dumps, raw DB rows, actual prompts, actual queries,
telemetry dumps, private URLs, local private paths, tokens, or secrets.

Blocked examples may use bounded placeholder text only to demonstrate blocked
inputs.

## 10. Deferred work

- Release candidate freeze manifest
- Release notes public artifact contract only after explicit release approval
- Product write target contract only after explicit reentry approval
- Product write adapter implementation only after explicit reentry approval
- Product write runtime only after explicit reentry approval

## 11. Verification expectations

Verification should run the Release Operator Checklist smoke, Release Notes
Public Safe Summary downstream smoke, Release Candidate Operator Review
downstream smoke, Disabled Product Write Adapter Reentry Harness downstream
smoke, Release Readiness Matrix downstream smoke, Product Write Reentry Review
downstream smoke, Git Ledger downstream smoke, Runtime Audit downstream smoke
and browser/static validation, dogfooding and feedback downstream smokes,
typecheck, and diff checks.

The smoke should verify deterministic checklist building, empty input behavior,
every decision, item kind, and severity, missing required checklist items,
unchecked blocking and warning items, checklist candidate output preserving
no-authority flags, private/raw blocking, token-aware marker blocking,
public-safe hyphenated text, forbidden authority rejection anywhere in the
input object, harmless unknown booleans, release/product-write flags remaining
false, docs/index pointers, package script, privacy boundaries, no forbidden
imports, and absence of positive authority grants.

## 12. Next recommended slices

1. release_candidate_freeze_manifest_v0_1
2. release_public_artifact_contract_v0_1 only after explicit release approval
3. product_write_target_contract_v0_1 only after explicit reentry approval
4. product_write_adapter_runtime_v0_1 only after explicit reentry approval
5. release_postmerge_observer_notes_v0_1
