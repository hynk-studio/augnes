# GitHub Actuation Contract v0.1

## Purpose

`github_actuation_contract_v0_1` defines a dry-run-only GitHub actuation
contract for a possible future operator-approved GitHub actuation
implementation.

This slice is contract-only and dry-run-only.

This slice does not call GitHub.

This slice does not execute Git.

This slice does not create branches, commits, tags, PRs, reviews, labels,
checks, releases, or merges.

This slice does not write repository files.

This slice does not grant contents write permission.

This slice does not grant actions write permission.

This slice does not grant admin permission.

This slice does not read or write secrets.

This slice does not export files locally.

This slice does not import files.

Approval payload is not merge authority.

Approval payload is not product-write.

Approval payload is not proof.

Approval payload is not durable state.

Git ref is not authority.

GitHub PR is not Core decision.

Any future GitHub actuation implementation requires a separate explicitly
approved PR.

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

This slice implements `github_actuation_contract_v0_1` from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Existing repo-local contracts and
runtime slices remain authority for fields, types, enums, and runtime behavior.

## Relationship to Git Ledger Export Contract v0.1

`docs/GIT_LEDGER_EXPORT_CONTRACT_V0_1.md` and
`types/git-ledger-export-contract.ts` define public-safe Git Ledger packet
contracts. GitHub actuation plans may reference Git Ledger packets by symbolic
refs only. Git Ledger packet refs are not commits, proof, durable state,
promotion, product-write, or GitHub execution authority.

## Relationship to Git Ledger Export Deterministic Builder v0.1

Git Ledger Export Deterministic Builder v0.1 produces packet candidates,
packet hashes, idempotency keys, markdown summaries, and suggested commit
message text. This contract may reference those outputs, but it does not run
the builder and does not transform suggested commit message text into approval.

## Relationship to Git Ledger Export Readonly Preview v0.1

Git Ledger Export Readonly Preview v0.1 renders packet candidates without
action controls. This contract keeps the same boundary: preview and dry-run
plan material can guide operator review, but it does not create branches,
commits, PRs, reviews, labels, checks, releases, or merges.

## Relationship to Local Git Ledger Export v0.1

Local Git Ledger Export v0.1 can write local packet artifacts only under
allowlisted temporary export roots when explicitly requested. This contract can
reference local export manifest refs symbolically, but it does not export files
locally, import files, or write repository files.

## Relationship to Privacy Redaction Runtime Guard

Privacy Redaction Runtime Guard v0.1 is required before any future GitHub
actuation runtime. Plans and approval payloads must block raw private payloads,
GitHub token or secret markers, provider IDs, private URLs, local private paths,
raw source bodies, raw provider output, raw retrieval output, raw DB rows, raw
conversations, hidden reasoning, telemetry dumps, raw diffs, and real GitHub
API payload dumps.

Blocked examples use safe placeholder markers only. Findings and fixtures must
not echo unsafe values.

## Relationship to Local Data Export/Import Policy

Local Data Export/Import Policy v0.1 remains policy-only and contract-only.
This GitHub actuation contract does not implement export/import runtime, file
export, file import, DB access, proof/evidence writes, durable state apply, or
product-write.

## Relationship to Authority Boundary Regression CI

Authority Boundary Regression CI v0.1 remains diagnostic only. Smoke/CI pass is
not truth. CI pass is not truth. Smoke pass is not truth. PR bodies, Git refs,
GitHub PRs, approval payloads, and dry-run plans are not Core decisions.

## Contract Scope

The contract defines:

- permission profile design
- target repository policy
- target branch policy
- target file allowlist policy
- forbidden file/path policy
- explicit operator approval payload
- dry-run actuation plan
- preview-to-action diff
- rollback/abort policy
- idempotency policy
- audit packet refs
- Git Ledger packet refs
- privacy/redaction requirements
- authority boundary

This slice does not query or write DB.

This slice does not add routes or UI.

This slice does not call providers.

This slice does not send prompts.

This slice does not fetch sources.

This slice does not execute retrieval/RAG.

This slice does not create proof/evidence.

This slice does not write claim/evidence records.

This slice does not promote Perspective.

This slice does not write/apply durable Perspective state.

This slice does not write Formation Receipts.

This slice does not execute Codex.

This slice does not product-write or allocate product IDs.

Product-write remains parked by #686.

## Permission Profile Policy

Permission profiles are descriptive contract values only:

- `read_only_metadata`
- `contents_read_only`
- `pull_request_read_only`
- `dry_run_planning_only`
- `future_contents_write_requires_explicit_approval`
- `future_pull_request_write_requires_explicit_approval`
- `forbidden_unbounded_write`
- `forbidden_admin`
- `forbidden_secrets`
- `forbidden_actions_write`
- `forbidden_packages_write`
- `forbidden_deployments_write`

This slice does not grant contents write permission. This slice does not grant
actions write permission. This slice does not grant admin permission. This
slice does not read or write secrets.

## Target Repository/Branch Policy

Target repository refs must be symbolic/ref-only. Target branch refs must be
symbolic/ref-only. A target repo or branch ref is not GitHub execution
authority, merge authority, durable state, proof, accepted evidence, or
product-write authority.

## Target File Allowlist Policy

Target file paths must be allowlisted in a future explicit approval payload
before any future implementation can consider acting on them. This contract
allows only public-safe symbolic target file refs.

Forbidden target file/path categories include:

- `.env`
- secrets
- credentials
- private keys
- package lock modifications unless explicitly allowlisted in future
- `.github/workflows` write unless separately approved in future
- `docs/00_INDEX_LATEST.md` automatic write unless separately approved in future
- product-write files
- DB migration files
- routes that mutate state
- provider secret/config files

Forbidden file paths are blocked as contract findings. Forbidden target paths
do not become approval, proof, durable state, product-write, or GitHub
execution authority.

## Explicit Approval Payload Policy

The explicit approval payload contract requires:

- `approval_payload_version`
- `scope: project:augnes`
- `approval_id`
- `operator_actor_ref`
- `approved_at`
- `approved_action_kinds`
- `approved_target_repo_ref`
- `approved_base_branch_ref`
- `approved_head_branch_ref`
- `approved_file_refs`
- `approved_git_ledger_packet_refs`
- `approved_local_export_manifest_refs`
- `preview_to_action_diff_ref`
- `rollback_or_abort_plan_ref`
- `authority_boundary_acknowledgements`
- `product_write_acknowledgement`
- `approval_is_not_product_write`
- `approval_is_not_proof`
- `approval_is_not_durable_state`

`product_write_acknowledgement` must remain false or blocked.
`approval_is_not_product_write`, `approval_is_not_proof`, and
`approval_is_not_durable_state` must remain true.

Approval payload is not merge authority. Approval payload is not product-write.
Approval payload is not proof. Approval payload is not durable state.

## Dry-Run Plan Policy

Dry-run plans may describe possible future action kinds, permission profiles,
symbolic target refs, preview-to-action diffs, rollback/abort refs, and
idempotency refs. Dry-run plans are review material only.

This slice does not call GitHub. This slice does not execute Git. This slice
does not create branches, commits, tags, PRs, reviews, labels, checks,
releases, or merges.

## Preview-to-Action Diff Policy

Preview-to-action diffs are symbolic refs or bounded public-safe summaries
only. They must not contain raw diffs, raw private payloads, raw terminal logs,
real GitHub API payloads, provider output, retrieval output, DB rows, hidden
reasoning, private URLs, local private paths, or secret-like values.

## Rollback/Abort Policy

Rollback and abort plans are symbolic refs only in this slice. They do not
execute Git, GitHub, filesystem, DB, route, provider, retrieval, proof/evidence,
state, Formation Receipt, Codex, product-write, or product ID operations.

## Idempotency Policy

Idempotency refs are deterministic review aids only. They do not grant GitHub
automation authority, merge authority, repository write authority, proof,
durable state, approval, or product-write authority.

## Privacy/Redaction Policy

The contract requires Privacy Redaction Runtime Guard v0.1 before any future
runtime. Raw private payloads, GitHub tokens, secrets, provider IDs, private
URLs, local private paths, raw source bodies, raw provider output, raw retrieval
output, raw DB rows, raw conversations, hidden reasoning, telemetry dumps, raw
diffs, and real GitHub API payloads are blocked.

## Authority Boundary

Allowed true fields:

- `github_actuation_contract_now`
- `dry_run_contract_only`
- `future_operator_approval_required`
- `caller_provided_refs_only`

Forbidden capabilities remain false:

- `github_api_call_now`
- `git_write_now`
- `git_commit_now`
- `git_branch_now`
- `git_tag_now`
- `github_pr_create_now`
- `github_pr_merge_now`
- `github_review_submit_now`
- `github_label_write_now`
- `github_check_write_now`
- `github_release_create_now`
- `repository_file_write_now`
- `contents_write_now`
- `actions_write_now`
- `packages_write_now`
- `deployments_write_now`
- `secrets_read_or_write_now`
- `admin_permission_now`
- `local_file_export_now`
- `local_file_import_now`
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
- `codex_execution_now`
- `codex_execution_authority`
- `github_automation_authority`
- `product_write_now`
- `product_id_allocation_now`
- `product_write_authority`
- `approval_is_merge_authority`
- `approval_is_product_write`
- `approval_is_proof`
- `approval_is_durable_state`
- `git_ref_is_authority`
- `github_pr_is_core_decision`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

## Fixture Policy

`fixtures/github-actuation-contract.sample.v0.1.json` uses public-safe symbolic
refs only. Safe placeholder markers appear only inside blocked examples.

The fixture must not include real GitHub tokens, real secrets, real provider
IDs, real connector IDs, real uploaded-file IDs, real private URLs, real local
paths, raw source bodies, raw provider outputs, raw retrieval outputs, raw DB
rows, raw conversations, hidden reasoning, telemetry dumps, real GitHub API
payloads, real PR payloads, raw diffs, or real terminal logs.

## Verification Expectations

Expected checks:

- `node --check scripts/smoke-github-actuation-contract-v0-1.mjs`
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

Future GitHub actuation implementation is deferred. Any future implementation
requires a separate explicitly approved PR with a new authority boundary,
operator-gated approval flow, privacy guard integration, permission review,
target-policy enforcement, rollback/abort behavior, and independent smokes.
