# Formal Invariant Checks Narrow Scope v0.1

## Purpose

`formal_invariant_checks_narrow_scope_v0_1` defines narrow formal-style
invariant contracts, fixtures, and static smoke checks for Augnes authority
boundaries.

This slice is contract-only and fixture-only.

This slice is static invariant smoke only.

This slice is narrow scope only.

This slice does not add theorem prover runtime.

This slice does not add Lean dependency.

This slice does not prove arbitrary natural-language claims.

This slice does not call providers.

This slice does not send prompts.

This slice does not fetch sources.

This slice does not execute retrieval/RAG.

This slice does not query/write DB.

This slice does not add routes or UI.

This slice does not create proof/evidence.

This slice does not write claim/evidence records.

This slice does not promote Perspective.

This slice does not write/apply durable Perspective state.

This slice does not write Formation Receipts.

This slice does not execute Git Ledger export runtime.

This slice does not execute Git or call GitHub.

This slice does not execute Codex.

This slice does not export/import files.

This slice does not product-write.

This slice does not allocate product IDs.

Product-write remains parked by #686.

Invariant pass is not truth.

Invariant pass is not proof.

Invariant pass is not approval.

Invariant pass is not promotion.

Invariant pass is not durable state.

Invariant pass is not product-write authority.

Invariant pass is not merge authority.

Smoke/CI pass is not truth.

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

This slice implements `formal_invariant_checks_narrow_scope_v0_1` from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Existing repo-local contracts and
runtime slices remain authority for fields, types, enums, and runtime behavior.

## Relationship to Authority Boundary Regression CI

Authority Boundary Regression CI v0.1 remains the broad static wording guard.
This slice is narrower: it defines fixture-backed invariant specs and expected
allowed or blocked cases for specific authority boundaries. It does not replace
the regression CI classifier and does not weaken that smoke.

## Relationship to Privacy Redaction Runtime Guard

Privacy Redaction Runtime Guard v0.1 remains required before any future runtime
or export surface handles invariant cases. Private, raw, provider, runtime,
URL, local path, secret-like, and opaque identifiers cannot become canonical
labels.

## Relationship to Product Write Target Contract

Product Write Target Contract v0.1 remains the product-write target authority
boundary. Product-write remains parked by #686.

The narrow invariant fixture requires product-write reentry review, product
write target contract, promotion decision, Formation Receipt, explicit
operator approval, source refs, audit trail, idempotency key, rollback policy,
and preview-to-write diff refs before any future product-write can be reviewed.
This slice does not execute product-write and does not grant product-write
authority.

## Relationship to GitHub Actuation Contract

GitHub Actuation Contract v0.1 is dry-run-only and contract-only. Git refs and
GitHub PR refs remain reference-only and do not become Core decisions, merge
authority, product-write authority, proof, or durable state.

## Relationship to Git Ledger / Local Export

Git Ledger packet refs, local export manifests, packet hashes, idempotency
keys, and suggested commit messages remain public-safe review artifacts. They
do not become commits, proof, accepted evidence, durable state, promotion, or
product-write.

## Relationship to Empirical Calibration Dataset

Empirical Calibration Dataset v0.1 is offline diagnostic only. Dataset rows are
not training data by default. This slice captures that invariant as a
fixture-backed static check only; it does not train, learn, mutate rules, or
ingest telemetry runtime data.

## Relationship to Deterministic CRPF Variant Review

Deterministic CRPF Variant Review v0.1 provides fixed-seed review variants.
Variants remain review aids only and do not become truth, proof, accepted
evidence, promotion readiness, durable state, or product-write.

## Relationship to Codex Result Report Ingestion and Temporal Handoff

Codex result reports and temporal handoff outcomes remain candidate/review
context only. Codex result reports do not become proof, evidence, or state.
Handoff outcomes do not become approval.

## Invariant Scope

Allowed invariant scope:

- candidate cannot become proof via route
- provider output cannot become accepted evidence
- retrieval result cannot promote Perspective state
- Codex result cannot become proof, evidence, or state
- empirical calibration dataset row cannot become training data by default
- feedback cannot become truth or automatic rule mutation
- layout coordinate cannot become authority
- Git ref cannot become authority
- GitHub PR cannot become Core decision
- CI pass cannot become proof, truth, or approval
- smoke pass cannot become proof, truth, or approval
- Git Ledger packet cannot become commit, proof, accepted evidence, state, or product-write
- product-write requires reentry gate, target contract, promotion decision, Formation Receipt, explicit operator approval, source refs, audit trail, idempotency, rollback, and preview-to-write diff
- product ID allocation remains disabled before explicit product-write runtime approval
- private/raw/provider/runtime identifiers cannot become canonical labels

## What is Intentionally Not Formalized

This slice does not prove arbitrary natural-language claims. It does not add a
theorem prover runtime. It does not add Lean dependency. It does not generate
natural-language proof. It does not create proof/evidence records.

The checks are static fixture contracts and smoke assertions only.

## Positive Boundary Cases

Positive boundary cases are allowed negated or refusal statements such as
candidate not-proof boundaries, provider output not-evidence boundaries,
retrieval not-promotion boundaries, Codex not-state boundaries, dataset
not-training-data boundaries, feedback not-truth boundaries, Git ref
not-authority boundaries, GitHub PR not-Core-decision boundaries, CI/smoke
not-truth boundaries, Git Ledger packet not-commit boundaries, and
product-write parked boundaries.

## Negative Forbidden Claim Cases

Negative forbidden claim cases are represented in the fixture as segmented
public-safe tokens so the broad authority regression scanner does not mistake
the fixture for product wording. The narrow smoke reconstructs those tokens and
expects them to be blocked.

## Route Refusal Contract Cases

Route refusal contract cases are contract examples only. They describe
expected refusal outcomes for attempts to convert candidate, provider,
retrieval, Codex, calibration, feedback, layout, Git, GitHub, Git Ledger,
product-write, product ID, or private identifier material into authority.

No route is added.

## Product-Write Gate Cases

Product-write gate cases require:

- `product_write_reentry_review_ref`
- `product_write_target_contract_ref`
- `promotion_decision_ref`
- `formation_receipt_ref`
- `explicit_operator_approval_ref`
- `source_refs`
- `audit_trail_ref`
- `idempotency_key_ref`
- `rollback_policy_ref`
- `preview_to_write_diff_ref`

Product-write remains parked by #686.

## Privacy Identifier Cases

Privacy identifier cases keep private/raw/provider/runtime identifiers out of
canonical labels. Fixture examples use safe symbolic refs only. Safe markers
appear only inside blocked fixture examples.

## Authority Boundary

Allowed true fields:

- `formal_invariant_checks_contract_now`
- `contract_only`
- `fixture_only`
- `static_invariant_smoke_only`
- `narrow_scope_only`
- `caller_provided_fixture_only`

Forbidden capabilities remain false:

- `theorem_prover_runtime_now`
- `lean_dependency_added_now`
- `natural_language_claim_proving_now`
- `runtime_route_check_now`
- `runtime_state_mutation_now`
- `db_query_or_write_now`
- `route_now`
- `ui_now`
- `provider_openai_call_now`
- `prompt_sent_now`
- `source_fetch_now`
- `retrieval_execution_now`
- `rag_answer_generation_now`
- `proof_or_evidence_record_now`
- `claim_or_evidence_write_now`
- `promotion_execution_now`
- `durable_state_write_now`
- `durable_state_apply_now`
- `formation_receipt_write_now`
- `git_ledger_export_runtime_now`
- `git_write_now`
- `github_api_call_now`
- `repository_file_write_now`
- `local_file_export_now`
- `local_file_import_now`
- `codex_execution_now`
- `codex_execution_authority`
- `github_automation_authority`
- `product_write_now`
- `product_write_runtime_now`
- `product_write_adapter_enabled_now`
- `product_id_allocation_now`
- `product_persistence_now`
- `product_write_authority`
- `invariant_pass_is_truth`
- `invariant_pass_is_proof`
- `invariant_pass_is_approval`
- `invariant_pass_is_promotion`
- `invariant_pass_is_durable_state`
- `invariant_pass_is_product_write_authority`
- `invariant_pass_is_merge_authority`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

## Fixture Policy

The fixture uses public-safe symbolic refs only. It includes invariant specs,
positive boundary cases, negative forbidden claim cases, route refusal contract
cases, product-write gate cases, privacy identifier cases, blocked private/raw
and forbidden authority examples, deterministic repeatability, and an authority
boundary sample.

Safe placeholders may appear only inside blocked private/raw fixture examples.

## Verification Expectations

Expected checks:

- `node --check scripts/smoke-formal-invariant-checks-narrow-scope-v0-1.mjs`
- `npm run smoke:formal-invariant-checks-narrow-scope-v0-1`
- `npm run smoke:empirical-calibration-dataset-v0-1`
- `npm run smoke:deterministic-crpf-variant-review-v0-1`
- `npm run smoke:product-write-target-contract-v0-1`
- `npm run smoke:github-actuation-contract-v0-1`
- `npm run smoke:local-git-ledger-export-v0-1`
- `npm run smoke:git-ledger-export-readonly-preview-v0-1`
- `npm run smoke:git-ledger-export-builder-v0-1`
- `npm run smoke:git-ledger-export-contract-v0-1`
- `npm run smoke:authority-boundary-regression-v0-1`
- `npm run smoke:privacy-redaction-guard-v0-1`
- `npm run smoke:local-data-export-policy-v0-1`
- `npm run smoke:codex-result-report-ingestion-v0-1`
- `npm run smoke:temporal-handoff-usefulness-experiment-plan-v0-1`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`
- `npm run smoke:release-postmerge-observer-notes-v0-1`
- `npm run smoke:release-readiness-matrix-v0-1`

Smoke verifies docs, types, fixture shape, invariant coverage, expected allowed
and blocked cases, product-write gate prerequisites, authority boundary
closure, safe marker placement, public-safe refs, no Lean dependency, no new
runtime files, package/index pointers, and the existing empirical calibration
smoke availability.

## Deferred Work

- Any theorem prover runtime.
- Any Lean dependency or build pipeline.
- Any arbitrary natural-language proof.
- Any runtime route checks.
- Any provider call, retrieval/RAG, DB runtime, routes/UI, proof/evidence write,
  Perspective promotion, durable state apply, Formation Receipt write,
  Git/GitHub, Codex execution, export/import runtime, product-write, or product
  ID allocation.
