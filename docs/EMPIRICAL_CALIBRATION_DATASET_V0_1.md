# Empirical Calibration Dataset v0.1

## Purpose

`empirical_calibration_dataset_v0_1` defines an offline empirical calibration
dataset contract for analyzing candidate readiness labels, diagnostic reason
codes, feedback outcomes, handoff usage, Codex result review outcomes,
not-done classification, validation warnings/skips/fails/passes, and later
review outcomes.

This slice is contract-only and fixture-only.

This slice is offline diagnostic only.

calibration_training_allowed is false by default.

`calibration_training_allowed` is false by default.

This slice does not execute training.

This slice does not execute automatic learning.

This slice does not mutate rules.

This slice does not mutate prompts.

This slice does not mutate parsers.

This slice does not mutate ranking.

This slice does not mutate surfacing.

This slice does not ingest telemetry runtime data.

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

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

This slice implements `empirical_calibration_dataset_v0_1` from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Existing repo-local contracts and
runtime slices remain authority for fields, types, enums, and runtime behavior.

## Relationship to Deterministic CRPF Variant Review

Deterministic CRPF Variant Review v0.1 defines fixed-seed variant review
material. Empirical calibration rows may reference deterministic CRPF variant
refs as diagnostic context, but those refs remain review aids only. A variant
ref is not truth, proof, accepted evidence, promotion readiness, durable state,
or product-write.

## Relationship to Temporal Handoff Usefulness Experiment

Temporal Handoff Usefulness Experiment Plan v0.1 defines public-safe scenario
and scoring vocabulary for future operator experiments. This dataset may carry
symbolic temporal handoff experiment refs and handoff outcomes. Experiment
results and handoff outcomes remain diagnostic only.

Handoff outcome is not approval.

## Relationship to Codex Result Report Ingestion

Codex Result Report Ingestion v0.1 normalizes Codex reports as candidate input
only. This dataset may carry symbolic Codex result report refs and Codex review
outcomes. Codex result is not proof.

## Relationship to Candidate Lifecycle, Calibration Diagnostic, Feedback, Review Memory, and Validation Reports

Candidate lifecycle status refs, calibration diagnostic reason codes, feedback
event refs, review memory refs, validation command refs, skipped check refs,
warning refs, failure refs, and pass refs are diagnostic context only.

Feedback is not truth.

Readiness label is not truth.

Diagnostic reason code is not truth.

Validation pass is not truth.

Validation failure is not automatic rejection.

Later review outcome is not truth.

Dataset row is not proof.

Dataset row is not accepted evidence.

Dataset row is not training data unless a future explicit approval changes
policy.

## Relationship to Privacy Redaction Runtime Guard

Privacy Redaction Runtime Guard v0.1 is required before any future runtime,
export, import, training, or analysis surface stores or publishes calibration
dataset material. This slice uses public-safe symbolic refs and bounded
summaries only.

Raw private payloads, private URLs, local private paths, secret-like values,
provider thread/run/session identifiers, raw source bodies, raw provider
output, raw retrieval output, raw DB rows, raw conversations, hidden reasoning,
telemetry dumps, raw diffs, real GitHub payloads, real PR payloads, and real
terminal logs are forbidden.

## Relationship to Authority Boundary Regression CI

Authority Boundary Regression CI v0.1 remains diagnostic only. Smoke/CI pass is
not truth. CI pass is not truth. Smoke pass is not truth. The dataset does not
grant truth, proof, accepted evidence, promotion, durable state, approval,
rejection, product-write, GitHub authority, Codex authority, or training
authority.

## Relationship to Product Write Target Contract

Product Write Target Contract v0.1 keeps product-write parked by #686 and
requires promotion decisions, Formation Receipts, source refs, operator
approval, audit trail, rollback, idempotency, and preview-to-write diff before
any future product-write. This dataset does not satisfy those gates and does
not grant product-write authority.

Product-write remains parked by #686.

## Dataset Row Shape

Each dataset row is caller-provided fixture material only and includes:

- `row_id`
- `dataset_version`
- `scope: project:augnes`
- `candidate_ref`
- `candidate_family`
- `initial_readiness_label`
- `diagnostic_reason_codes`
- `lifecycle_status_ref`
- `feedback_event_refs`
- `handoff_used`
- `handoff_profile_ref`
- `handoff_outcome`
- `codex_result_report_ref`
- `codex_review_outcome`
- `not_done_classification`
- `validation_command_refs`
- `validation_skipped_refs`
- `validation_warning_refs`
- `validation_failure_refs`
- `validation_pass_refs`
- `later_review_outcome`
- `later_review_reason_codes`
- `expected_observed_delta_refs`
- `temporal_handoff_experiment_refs`
- `deterministic_crpf_variant_refs`
- `source_refs`
- `privacy_report`
- `calibration_training_allowed`
- `boundary_notes`
- `reason_codes`
- `authority_boundary`

Candidate families are `manual_note_candidate`,
`provider_extraction_candidate`, `retrieval_context_candidate`,
`feedback_to_rule_candidate`, `codex_result_candidate`,
`temporal_handoff_candidate`, `crpf_variant_candidate`, and `unknown`.

Every safe fixture row has `calibration_training_allowed: false`.

## Dataset Bundle Shape

The dataset bundle carries contract version, row version, scope, status, dataset
id, title, public-safe creator/time refs, embedded rows, row count, covered
candidate families, the training default, deterministic fixture fingerprint,
boundary notes, reason codes, and authority boundary.

The bundle is a fixture contract. It does not read files, write files, query a
database, ingest telemetry, train a model, mutate rules, or publish anything.

## Training-Disabled Policy

`calibration_training_allowed` is false by default.

Safe rows in this slice are not training rows. Training is not executed.
Automatic learning is not executed. Rule mutation is not executed. Prompt,
parser, ranking, and surfacing mutation are not executed.

Any future training or learning path requires a separate explicit approval and
must not infer authority from this fixture.

## Offline Diagnostic Policy

Rows preserve diagnostic relationships for later operator review. They do not
change candidate lifecycle state, review memory, feedback rules, handoff
profiles, validation behavior, Codex behavior, retrieval behavior, ranking,
surfacing, Perspective state, proof/evidence state, product state, or product
IDs.

## Privacy/Redaction Policy

Fixture rows use public-safe symbolic refs only. Blocked private/raw examples
may use safe placeholders only inside blocked fixture examples. The fixture,
docs examples, and smoke failures must not include real secrets, provider IDs,
connector IDs, uploaded-file IDs, private URLs, local paths, raw source bodies,
raw provider output, raw retrieval output, raw DB rows, raw conversations,
hidden reasoning, telemetry dumps, real GitHub API payloads, real PR payloads,
raw diffs, or terminal logs.

## Non-Authority Policy

Feedback is not truth.

Readiness label is not truth.

Diagnostic reason code is not truth.

Validation pass is not truth.

Validation failure is not automatic rejection.

Codex result is not proof.

Handoff outcome is not approval.

Later review outcome is not truth.

Dataset row is not proof.

Dataset row is not accepted evidence.

Dataset row is not training data unless a future explicit approval changes
policy.

Candidate is not fact.

Candidate is not proof.

Candidate is not accepted evidence.

## Authority Boundary

Allowed true fields:

- `empirical_calibration_dataset_contract_now`
- `contract_only`
- `fixture_only`
- `offline_diagnostic_only`
- `calibration_training_allowed_default_false`
- `caller_provided_fixture_only`

Forbidden capabilities remain false:

- `training_runtime_now`
- `automatic_learning_now`
- `rule_mutation_now`
- `prompt_mutation_now`
- `parser_mutation_now`
- `ranking_mutation_now`
- `surfacing_mutation_now`
- `telemetry_ingestion_now`
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
- `readiness_label_is_truth`
- `diagnostic_reason_code_is_truth`
- `validation_pass_is_truth`
- `validation_failure_is_rejection`
- `codex_result_is_proof`
- `handoff_outcome_is_approval`
- `later_review_outcome_is_truth`
- `dataset_row_is_training_data`
- `dataset_row_is_proof`
- `dataset_row_is_accepted_evidence`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

## Fixture Policy

The fixture uses public-safe symbolic refs only. It includes rows covering all
candidate families, a bundle example, blocked private/raw and forbidden
authority examples, a training-disabled example, and deterministic
repeatability example.

Safe placeholders may appear only inside blocked private/raw fixture examples.

## Verification Expectations

Expected checks:

- `node --check scripts/smoke-empirical-calibration-dataset-v0-1.mjs`
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

Smoke verifies docs, types, fixture coverage, package/index pointers, authority
boundary closure, safe marker placement, public-safe refs, no new runtime files,
and the deterministic repeatability fixture.

## Deferred Work

- Any operator-reviewed calibration analysis runtime.
- Any training dataset approval path.
- Any automatic learning, rule mutation, prompt mutation, parser mutation,
  ranking mutation, surfacing mutation, telemetry ingestion runtime, DB-backed
  dataset runtime, provider call, retrieval/RAG, proof/evidence write,
  Perspective promotion, durable state apply, Formation Receipt write,
  Git/GitHub, Codex execution, export/import runtime, product-write, or product
  ID allocation.
