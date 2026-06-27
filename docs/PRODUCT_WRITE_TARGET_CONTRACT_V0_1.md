# Product Write Target Contract v0.1

## Purpose

`product_write_target_contract_v0_1` defines product-write target contracts for
a future explicit reentry implementation while keeping product-write parked by
#686.

This slice is contract-only.

This slice does not execute product-write.

This slice does not enable a product-write adapter.

This slice does not allocate product IDs.

This slice does not persist products.

This slice does not open product routes or product UI.

This slice does not execute SQL transactions.

This slice does not query/write DB.

Product-write remains parked by #686.

Candidate cannot be written as proof/evidence directly.

Provider output cannot be written as accepted evidence directly.

Retrieval result cannot be written as accepted evidence directly.

Codex result cannot be written as proof/evidence/state.

Feedback cannot be written as truth.

Product write is impossible without promotion decision and Formation Receipt.

Product write is impossible without explicit operator approval.

Product ID allocation remains disabled in this contract.

Preview-to-write diff is not write approval.

Smoke/CI pass is not truth.

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

This slice implements `product_write_target_contract_v0_1` from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Existing repo-local contracts and
runtime slices remain authority for fields, types, enums, and runtime behavior.

## Relationship to Product Write Reentry Review v0.1

Product Write Reentry Review v0.1 is review-only and keeps product-write parked
by #686. This target contract can reference product-write reentry review refs
as public-safe prerequisites only. Those refs do not execute product-write, do
not allocate product IDs, do not persist products, and do not grant
product-write authority.

## Relationship to Disabled Product Write Adapter Reentry Harness v0.1

Disabled Product Write Adapter Reentry Harness v0.1 is disabled and
review-only. This target contract does not enable the adapter. It does not open
adapter runtime and does not convert invocation previews into commands.

## Relationship to Promotion Decision Store

Future product writes require a promotion decision ref. A candidate cannot be
written as proof/evidence directly. A promotion decision ref is a prerequisite,
not a product-write execution command.

## Relationship to Formation Receipt Durable Write

Future product writes require a Formation Receipt ref. Product write is
impossible without promotion decision and Formation Receipt. This slice does
not write Formation Receipts.

## Relationship to Durable Perspective State Apply

Durable Perspective state refs can be prerequisites for perspective state
targets, but this slice does not write/apply durable Perspective state and does
not mutate durable state from product-write.

## Relationship to Git Ledger / Local Export / GitHub Actuation Contract

Git Ledger packet refs, local export manifest refs, and GitHub actuation
contract refs are public-safe lineage or review refs only. They are not proof,
not accepted evidence, not product-write authority, not Git/GitHub actuation,
and not durable state.

This slice does not execute Git Ledger export runtime.

This slice does not execute Git.

This slice does not call GitHub.

This slice does not write repository files.

This slice does not export/import files.

## Relationship to Privacy Redaction Runtime Guard

Privacy Redaction Runtime Guard v0.1 remains required before any future
product-write runtime. Product-write target contracts must block private/raw
payloads, private URLs, local private paths, token or secret-like patterns,
provider thread/run/session identifiers, raw source bodies, raw provider
output, raw retrieval output, raw DB rows, raw conversations, hidden reasoning,
telemetry dumps, and raw diffs.

## Relationship to Local Data Export/Import Policy

Local Data Export/Import Policy v0.1 remains policy-only and contract-only.
This slice does not export/import files and does not implement local import or
restore behavior.

## Relationship to Authority Boundary Regression CI

Authority Boundary Regression CI v0.1 remains diagnostic only. Smoke/CI pass is
not truth. CI pass is not truth. Smoke pass is not truth. Candidate, provider,
retrieval, Codex, feedback, preview, Git, GitHub, and product activity log refs
do not become truth, proof, accepted evidence, durable state, or product-write
authority.

## Contract Scope

This contract defines:

- target groups
- ownership refs
- schema refs
- allowed future write intents
- forbidden write intents
- required prerequisites
- idempotency keys
- transaction boundaries
- rollback behavior
- audit trail requirements
- source refs requirements
- promotion decision requirements
- Formation Receipt requirements
- operator approval binding
- preview-to-write diff requirements
- authority boundaries

This slice does not write proof/evidence records.

This slice does not write claim/evidence records.

This slice does not create work items.

This slice does not promote Perspective.

This slice does not write/apply durable Perspective state.

This slice does not write Formation Receipts.

This slice does not call providers.

This slice does not send prompts.

This slice does not fetch sources.

This slice does not execute retrieval/RAG.

This slice does not execute Codex.

## Target Group Matrix

| Target group | Owner surface | Schema ref | Required prerequisites |
| --- | --- | --- | --- |
| `accepted_evidence_records` | `owner-surface:evidence-review` | `schema-ref:accepted-evidence-records:v0.1` | promotion decision, Formation Receipt, review record, source refs, operator approval, reentry review, target contract |
| `proof_records` | `owner-surface:proof-review` | `schema-ref:proof-records:v0.1` | promotion decision, Formation Receipt, review record, source refs, accepted evidence refs, operator approval, reentry review, target contract |
| `work_items` | `owner-surface:work-intake` | `schema-ref:work-items:v0.1` | promotion decision, Formation Receipt, review record, source refs, operator approval, reentry review, target contract |
| `perspective_state_records` | `owner-surface:perspective-state` | `schema-ref:perspective-state-records:v0.1` | promotion decision, Formation Receipt, durable state ref, review record, source refs, operator approval, reentry review, target contract |
| `formation_receipts` | `owner-surface:formation-receipts` | `schema-ref:formation-receipts:v0.1` | promotion decision, review record, source refs, operator approval, reentry review, target contract |
| `product_activity_log` | `owner-surface:product-activity-log` | `schema-ref:product-activity-log:v0.1` | promotion decision, Formation Receipt, review record, source refs, operator approval, reentry review, target contract |

Each target group requires idempotency policy, transaction boundary policy,
rollback policy, audit trail policy, source refs policy, operator approval
policy, preview-to-write diff policy, and a closed authority boundary.

## Required Prerequisite Policy

Required prerequisite refs include:

- `promotion_decision_ref`
- `formation_receipt_ref`
- `review_record_ref`
- `source_refs`
- `accepted_evidence_refs` when relevant
- `durable_state_ref` when relevant
- `operator_approval_ref`
- `product_write_reentry_review_ref`
- `product_write_target_contract_ref`

Product write is impossible without promotion decision and Formation Receipt.
Product write is impossible without explicit operator approval.

## Idempotency Key Policy

Future product writes require stable idempotency keys scoped by target group,
operator approval, and preview-to-write diff. Idempotency keys are review and
replay guards only. They are not write approval, truth, proof, durable state,
or product-write authority.

## Transaction Boundary Policy

Future product writes require explicit transaction boundaries. This contract is
preview-only for SQL transaction policy. This slice does not execute SQL
transactions.

Cross-target-group transactions are forbidden unless a future explicit contract
approves them.

## Rollback Policy

Future product writes require rollback or abort plans before execution.
Rollback plans are not product-write authority. Abort-before-partial-write is
required for future implementations.

## Audit Trail Policy

Future product writes require audit trails. Product activity log is audit-only.
Product activity log is not product-write authority. Audit trail is not truth.

## Source Refs Policy

Source refs are required. Source refs are lineage pointers, not proof. Source
refs must be public-safe symbolic refs. Future product writes without source
refs are blocked.

## Operator Approval Binding

Explicit operator approval is required for future product-write reentry.
Operator approval must bind to target group, promotion decision ref, Formation
Receipt ref, source refs, review record ref, product-write reentry review ref,
target contract ref, idempotency key ref, rollback or abort plan ref, and
preview-to-write diff ref.

Operator approval is not proof. Operator approval is not durable state.
Operator approval is not product-write until a future explicit runtime slice
implements and executes a write under all gates.

## Preview-to-Write Diff Policy

Preview-to-write diff is required. Preview-to-write diff is not write approval.
Preview material cannot be executed by this contract.

## Forbidden Direct Write Policy

Candidate cannot be written as proof/evidence directly.

Provider output cannot be written as accepted evidence directly.

Retrieval result cannot be written as accepted evidence directly.

Codex result cannot be written as proof/evidence/state.

Feedback cannot be written as truth.

Forbidden direct write intents include candidate-as-proof, candidate-as-
evidence, provider-output-as-truth, retrieval-result-as-evidence,
Codex-result-as-state, feedback-as-truth, bypassing promotion decision,
bypassing Formation Receipt, bypassing operator approval, bypassing
preview-to-write diff, writing without source refs, writing without audit
trail, mutating durable state from product-write, creating work items directly
from provider output, and creating proof from RAG answers.

## Product ID Allocation Policy

Product ID allocation remains disabled in this contract.

This slice does not allocate product IDs.

Product ID allocation requires a future explicit reentry implementation and
separate approval boundary.

## Authority Boundary

Allowed true fields:

- `product_write_target_contract_now`
- `contract_only`
- `future_reentry_review_required`
- `operator_approval_required_for_future_write`
- `promotion_decision_required`
- `formation_receipt_required`
- `source_refs_required`
- `preview_to_write_diff_required`
- `audit_trail_required`
- `rollback_policy_required`

Forbidden capabilities remain false:

- `product_write_now`
- `product_write_runtime_now`
- `product_write_adapter_enabled_now`
- `product_write_target_contract_runtime_now`
- `product_id_allocation_now`
- `product_persistence_now`
- `product_route_now`
- `product_ui_now`
- `sql_transaction_now`
- `db_query_or_write_now`
- `proof_or_evidence_record_now`
- `claim_or_evidence_write_now`
- `work_item_write_now`
- `promotion_execution_now`
- `durable_state_write_now`
- `durable_state_apply_now`
- `formation_receipt_write_now`
- `provider_openai_call_now`
- `prompt_sent_now`
- `source_fetch_now`
- `retrieval_execution_now`
- `rag_answer_generation_now`
- `git_ledger_export_runtime_now`
- `git_write_now`
- `github_api_call_now`
- `repository_file_write_now`
- `local_file_export_now`
- `local_file_import_now`
- `codex_execution_now`
- `codex_execution_authority`
- `github_automation_authority`
- `product_write_authority`
- `candidate_is_proof`
- `candidate_is_accepted_evidence`
- `provider_output_is_truth`
- `retrieval_result_is_evidence`
- `codex_result_is_state`
- `feedback_is_truth`
- `product_id_is_allocated`
- `preview_is_write_approval`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

## Fixture Policy

`fixtures/product-write-target-contract.sample.v0.1.json` uses public-safe
symbolic refs only. Safe placeholder markers appear only inside blocked
private/raw examples.

The fixture must not include real secrets, real provider IDs, real connector
IDs, real uploaded-file IDs, real private URLs, real local paths, raw source
bodies, raw provider outputs, raw retrieval outputs, raw DB rows, raw
conversations, hidden reasoning, telemetry dumps, real GitHub API payloads,
real PR payloads, raw diffs, or real terminal logs.

## Verification Expectations

Expected checks:

- `node --check scripts/smoke-product-write-target-contract-v0-1.mjs`
- `npm run smoke:product-write-target-contract-v0-1`
- `npm run smoke:product-write-reentry-review-v0-1`
- `npm run smoke:disabled-product-write-adapter-reentry-harness-v0-1`
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

Future product-write runtime, product-write adapter enablement, product ID
allocation, SQL transaction execution, product routes/UI, and product
persistence remain deferred. They require a separate explicitly approved
reentry implementation after all prerequisite gates are satisfied.
