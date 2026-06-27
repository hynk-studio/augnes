# Deterministic CRPF Variant Review v0.1

## Purpose

`deterministic_crpf_variant_review_v0_1` defines constrained random
perspective formation as deterministic, fixture-backed variant review.

This slice is contract-only and fixture-only.

This slice uses fixed seed refs only.

This slice does not execute runtime randomness.

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

A variant is a review aid only.

A variant is not truth.

A variant is not proof.

A variant is not accepted evidence.

A variant is not promotion readiness.

A variant is not durable Perspective state.

A variant is not product-write.

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

This slice implements `deterministic_crpf_variant_review_v0_1` from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Existing repo-local contracts and
runtime slices remain authority for fields, types, enums, and runtime behavior.

## Relationship to Research/ROI P1/P2 Backlog

The Research P1/P2 backlog calls for deterministic CRPF review before any
runtime random behavior. This slice compares fixed, public-safe variants only.
It does not choose a winning policy, write state, or execute runtime
experiments.

## Relationship to Candidate Lifecycle, Calibration, Logical Claim Shape, Temporal Handoff, and Codex Result Report Ingestion

Candidate lifecycle, calibration diagnostics, logical claim shape, temporal
handoff, and Codex result report ingestion remain review-context sources only.
This slice can reference synthetic candidate refs, source refs, evidence refs,
tension refs, knowledge-gap refs, expected/observed delta refs, and handoff
refs. Those refs remain public-safe review cues, not proof, accepted evidence,
promotion readiness, durable state, or product-write authority.

## Relationship to Privacy Redaction Runtime Guard

Privacy Redaction Runtime Guard v0.1 remains required before any future runtime
or export of variant review material. Fixtures use public-safe symbolic refs
only. Raw private payloads, private URLs, local private paths, secret-like
values, provider thread/run/session identifiers, raw source bodies, raw
provider output, raw retrieval output, raw DB rows, raw conversations, hidden
reasoning, telemetry dumps, raw diffs, and real terminal logs are forbidden.

## Relationship to Authority Boundary Regression CI

Authority Boundary Regression CI v0.1 remains diagnostic only. Smoke/CI pass is
not truth. CI pass is not truth. Smoke pass is not truth. Variant comparison
does not create truth, proof, accepted evidence, promotion readiness, durable
state, product-write authority, GitHub authority, or Codex execution authority.

## Relationship to Product Write Target Contract

Product Write Target Contract v0.1 keeps product-write parked by #686 and
requires promotion decisions, Formation Receipts, source refs, operator
approval, audit trail, rollback, idempotency, and preview-to-write diff before
any future write. This CRPF variant review does not satisfy those gates and
does not grant product-write authority.

Product-write remains parked by #686.

## Variant Set

The deterministic fixture defines exactly five variants:

- `evidence_strict`
- `tension_preserving`
- `source_coverage_strict`
- `handoff_minimal`
- `operator_review_heavy`

Each variant carries a fixed seed ref, selection policy, candidate inclusion
policy, evidence requirement policy, unresolved tension policy, source coverage
policy, handoff policy, operator review policy, expected benefits, risk notes,
review cues, non-authority notes, reason codes, and an authority boundary.

## Fixed Seed Policy

Fixed seed refs are symbolic refs only. They make fixture review repeatable but
do not execute runtime randomness. Same fixed seed/input should produce the
same variant refs, order, and fingerprint in fixture examples.

## Selection Criteria

Selection criteria are public-safe review fields:

- fixed seed ref
- public-safe candidate refs
- evidence coverage
- source ref coverage
- unresolved tension preservation
- knowledge gap preservation
- expected/observed delta preservation
- handoff size bound
- operator review load
- overclaim risk

Selection criteria do not create proof, accepted evidence, promotion readiness,
durable state, or product-write authority.

## Review Cue Policy

Review cues include evidence coverage inspection, unresolved tension
preservation, source ref coverage inspection, handoff size reduction, operator
review requests, not-done item preservation, overclaim risk inspection,
expected/observed delta comparison, and no-action cues.

Review cues are not commands. Review cues are not approval. Review cues are
not promotion readiness.

## Non-Authority Policy

A variant is a review aid only.

A variant is not truth.

A variant is not proof.

A variant is not accepted evidence.

A variant is not promotion readiness.

A variant is not durable Perspective state.

A variant is not product-write.

## Privacy/Redaction Policy

Blocked private/raw examples may use safe placeholders only inside blocked
fixture examples. The docs, fixture expected output, and smoke failures must
not include real secrets, provider IDs, connector IDs, uploaded-file IDs,
private URLs, local paths, raw source bodies, raw provider output, raw
retrieval output, raw DB rows, raw conversations, hidden reasoning, telemetry
dumps, real GitHub API payloads, real PR payloads, raw diffs, or terminal logs.

## Authority Boundary

Allowed true fields:

- `deterministic_crpf_variant_review_now`
- `contract_only`
- `fixture_only`
- `fixed_seed_only`
- `deterministic_review_aid_only`
- `caller_provided_fixture_only`

Forbidden capabilities remain false:

- `runtime_randomness_now`
- `provider_openai_call_now`
- `prompt_sent_now`
- `source_fetch_now`
- `retrieval_execution_now`
- `rag_answer_generation_now`
- `db_query_or_write_now`
- `route_now`
- `ui_now`
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
- `variant_is_truth`
- `variant_is_proof`
- `variant_is_accepted_evidence`
- `variant_is_promotion_readiness`
- `variant_is_durable_state`
- `variant_is_product_write`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

## Fixture Policy

`fixtures/deterministic-crpf-variant-review.sample.v0.1.json` uses public-safe
symbolic refs only. It uses synthetic candidate, source, evidence, tension,
gap, handoff, and fixed seed refs only.

Safe placeholder markers may appear only inside blocked examples.

## Verification Expectations

Expected checks:

- `node --check scripts/smoke-deterministic-crpf-variant-review-v0-1.mjs`
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

Smoke/CI pass is not truth.

## Deferred Work

Future runtime CRPF, empirical calibration datasets, provider-assisted
variant generation, retrieval-backed variant evaluation, promotion execution,
durable state writes, Formation Receipt writes, Git Ledger export runtime,
Codex execution, and product-write remain deferred.
