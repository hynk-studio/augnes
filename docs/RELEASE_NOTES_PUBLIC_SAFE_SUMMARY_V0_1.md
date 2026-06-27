# Release Notes Public Safe Summary v0.1

## 1. Purpose

Release Notes Public Safe Summary is review-only.

Release Notes Public Safe Summary is candidate-only.

Release Notes Public Safe Summary does not publish release notes.

Release Notes Public Safe Summary does not create release artifacts.

Release Notes Public Safe Summary does not execute release.

Release Notes Public Safe Summary does not approve release.

Release Notes Public Safe Summary does not grant release authority.

Release Notes Public Safe Summary does not grant product-write authority.

This slice builds deterministic public-safe release-note summary candidates
from caller-provided bounded review context. It does not publish, approve,
release, product-write, create release artifacts, or grant authority.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This implements the `release_notes_public_safe_summary_v0_1` slice from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` as a
review-only/candidate-only summary builder after Release Candidate Operator
Review v0.1.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Field, type, enum, and runtime
authority remains with this slice contract and the existing repo-local SSOT
layers.

## 3. Relationship to Release Candidate Operator Review and Release Readiness Matrix

Product-write remains parked by #686.

Product-write authority is not granted.

Product-write runtime is not implemented.

Product-write adapter is not enabled.

Product-write target contract is not created.

Product IDs are not allocated.

Products are not persisted.

Release candidate operator review, release readiness, disabled harness,
product-write reentry review, Git Ledger, runtime audit, dogfooding, feedback,
verification, privacy, release-boundary, and deferred-work refs are review
context only. They do not grant release authority, release approval,
product-write authority, adapter runtime authority, product target contract
authority, truth, proof, or accepted evidence.

Runtime audit, Git Ledger packets, release readiness, disabled harness output,
and release candidate operator review are review context only, not authority.

Smoke/CI pass is not truth.

## 4. Scope and non-goals

In scope:

- Deterministic release notes public-safe summary helper.
- Public-safe fixture.
- Static smoke validation.
- Docs, package script, and latest-index pointer.

Out of scope:

- Release notes publication.
- Release artifact generation.
- Release approval automation.
- Release execution.
- Release routes or UI.
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

## 5. Release note summary input shape

Inputs use `release_notes_public_safe_input.v0.1` and
`release_notes_public_safe_summary.v0.1` with `scope: project:augnes`.

The input carries a summary id, timestamp, release candidate operator refs,
release readiness refs, release scope refs, public-safe input sections,
boundary notes, reason codes, and an optional authority boundary. Inputs are
bounded public-safe review context only.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

## 6. Section shape

Sections use `release_notes_public_safe_section.v0.1` with
`scope: project:augnes`.

Each section carries a public-safe id, section kind, bounded title, bounded
summary, public-safe bullet summaries, symbolic refs, reason codes, and an
optional authority boundary. Sections are summary candidates only. They are not
truth, proof, release approval, product-write authority, accepted evidence, or
release artifacts.

Required section kinds are overview, notable changes, known limitations,
verification notes, privacy notes, product-write status, release boundary, and
deferred work. Review context is optional. Unknown sections are rejected.

## 7. Decision rules

Decisions can be `summary_candidate_only`, `needs_operator_review`, `blocked`,
or `rejected`.

`rejected` means an unknown section kind or invalid non-private input was
supplied.

`blocked` means required sections are missing.

`needs_operator_review` means non-blocking review gaps remain.

`summary_candidate_only` means required sections are present and the output is
a public-safe candidate for future human/operator review only.

`summary_candidate_only` requires required sections and top-level review refs to be present.

Missing release candidate operator refs or release readiness refs require operator review.

Missing top-level review context cannot produce `summary_candidate_only`.

`summary_candidate_only` still does not publish release notes, execute a
release, create release artifacts, approve release, grant release authority,
grant product-write authority, enable product-write, or allocate product IDs.

## 8. Public-safe summary rules

Release note candidates must be bounded public-safe summaries. They may include
only symbolic refs and bounded bullet summaries supplied by the caller.

Release Notes Public Safe Summary does not publish release notes.

Release Notes Public Safe Summary does not create release artifacts.

Release Notes Public Safe Summary does not execute release.

Release Notes Public Safe Summary does not approve release.

## 9. Authority rules

Release Notes Public Safe Summary does not grant release authority.

Release Notes Public Safe Summary does not grant product-write authority.

Forbidden authority fields are rejected anywhere in the input object.

Unknown fields cannot carry release, product-write, GitHub, DB, route, UI, provider, retrieval, RAG, state mutation, or automation authority.

`authority_boundary` is not the only place where forbidden authority grants are checked.

The result always keeps `release_notes_published: false`,
`release_executed: false`, `release_artifact_created: false`,
`release_authority_granted: false`, `release_candidate_approved: false`,
`product_write_executed: false`, `product_id_allocated: false`, and
`product_write_authority_granted: false`.

The authority boundary denies release notes publication, release execution,
release artifact creation, release authority, release-candidate approval,
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
automation authority, release-notes summary truth/proof/authority,
verification truth, smoke pass truth, CI pass truth, and product-write
authority.

## 10. Privacy and redaction rules

Release notes public-safe summary input must be public-safe. Private/raw
markers are rejected case-insensitively. Raw conversation markers are blocked.
Hidden reasoning markers are blocked. Telemetry dump markers are blocked.
Secret-like values, private URLs, and local private path markers are blocked.

Token-like secret markers are detected case-insensitively without treating
ordinary words such as risk-reduction or task-level as secrets.

Unknown or extra input fields are scanned for private/raw/secret-like markers.
Unknown fields cannot carry raw conversation, hidden reasoning, telemetry,
secrets, private paths, private URLs, raw product-write payload, raw release
payload, raw release notes payload, raw audit payload, or raw ledger payload
through the summary builder.

Fixtures and examples use bounded summaries and public-safe symbolic refs only.
They do not store raw source bodies, raw provider output, raw retrieval output,
raw product-write payload, raw release payload, raw release notes payload, raw
audit payload, raw ledger payload, raw conversation, hidden reasoning, browser
dumps, raw DB rows, actual prompts, actual queries, telemetry dumps, private
URLs, local private paths, tokens, or secrets.

Blocked examples may use bounded placeholder text only to demonstrate blocked
inputs.

## 11. Deferred work

- Release operator checklist
- Product write target contract only after explicit reentry approval
- Product write adapter implementation only after explicit reentry approval
- Product write runtime only after explicit reentry approval
- Release candidate freeze manifest

## 12. Verification expectations

Verification should run the Release Notes Public Safe Summary smoke, Release
Candidate Operator Review downstream smoke, Disabled Product Write Adapter
Reentry Harness downstream smoke, Release Readiness Matrix downstream smoke,
Product Write Reentry Review downstream smoke, Git Ledger downstream smoke,
Runtime Audit downstream smoke and browser/static validation, dogfooding and
feedback downstream smokes, typecheck, and diff checks.

The smoke should verify deterministic summary building, empty input behavior,
every decision and section kind, missing required sections, summary candidate
output preserving no-authority flags, private/raw blocking, token-aware marker
blocking, public-safe hyphenated text, forbidden authority rejection,
release/product-write flags remaining false, docs/index pointers, package
script, privacy boundaries, no forbidden imports, and absence of positive
authority grants.

## 13. Next recommended slices

1. release_operator_checklist_v0_1
2. release_candidate_freeze_manifest_v0_1
3. product_write_target_contract_v0_1 only after explicit reentry approval
4. product_write_adapter_runtime_v0_1 only after explicit reentry approval
5. release_public_artifact_contract_v0_1 only after explicit release approval
