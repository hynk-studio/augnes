# Git Ledger Export Readonly Preview v0.1

## Purpose

`git_ledger_export_readonly_preview_v0_1` adds a read-only public-safe preview
panel for Git Ledger export packet candidates produced by the deterministic
builder.

This slice is read-only preview only.

This slice renders packet candidates only.

This slice renders markdown and suggested commit message text only.

Suggested commit message is not approval.

Packet hash is not truth.

Idempotency key is not authority.

Git ref is not authority.

Git Ledger export packet is not commit, not proof, not accepted evidence, not
durable state, not promotion, and not product-write.

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

This slice implements `git_ledger_export_readonly_preview_v0_1` from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Existing repo-local contracts and
runtime slices remain authority for fields, types, enums, and future runtime
behavior.

## Relationship to Git Ledger Export Contract v0.1

`docs/GIT_LEDGER_EXPORT_CONTRACT_V0_1.md` and
`types/git-ledger-export-contract.ts` define the contract-only Git Ledger packet
boundary. The preview renders public-safe packet candidate fields and symbolic
lineage refs only. It does not change the contract.

## Relationship to Git Ledger Export Deterministic Builder v0.1

`docs/GIT_LEDGER_EXPORT_DETERMINISTIC_BUILDER_V0_1.md` and
`lib/git-ledger/build-export-packet.ts` define deterministic packet candidate
building, validation, hashing, idempotency, markdown rendering, and suggested
commit message rendering. This preview displays those public-safe results. It
does not mutate builder inputs and does not run the builder.

## Relationship to Privacy Redaction Runtime Guard

Privacy Redaction Runtime Guard v0.1 remains required before any future Git
Ledger export runtime. This preview renders privacy report summaries and
validation summaries only. It must not render raw source bodies, raw provider
output, raw retrieval output, raw DB rows, raw conversations, hidden reasoning,
telemetry dumps, private URLs, local private paths, tokens, secrets, provider
thread/run/session identifiers, or raw diffs.

## Relationship to Local Data Export/Import Policy

Local Data Export/Import Policy v0.1 remains policy-only and contract-only. The
preview is not local export/import runtime. It does not export files locally,
import files, read files as input, write files, query DB, or write DB.

## Relationship to Authority Boundary Regression CI

Authority Boundary Regression CI v0.1 treats CI pass, smoke pass, PR bodies,
Git refs, GitHub PRs, packet hashes, idempotency keys, and packet previews as
diagnostic or reference-only material. Smoke/CI pass is not truth.

## Relationship to Codex Result Report Ingestion and Temporal Handoff Usefulness Experiment Plan

Codex Result Report Ingestion v0.1 treats Codex reports and validation outcomes
as candidate/review cues only. Temporal Handoff Usefulness Experiment Plan v0.1
remains experiment-plan-only and fixture-only. The Git Ledger readonly preview
may display symbolic refs to those outputs, but it does not execute Codex, run
experiments, call GitHub, create proof/evidence, promote Perspective, or write
state.

## Preview Model

The preview model includes:

- packet status
- packet title
- packet id
- `generated_by`
- `generated_at`
- change summary
- reason summary
- lineage refs
- privacy report summary
- validation report summary
- authority boundary highlights
- deterministic packet hash
- deterministic idempotency key
- bounded markdown summary
- suggested commit message text
- product-write parked status

All refs are public-safe symbolic refs. Displayed summaries are bounded
operator review material only.

## Component Boundary

`components/git-ledger-export-readonly-preview-panel.tsx` exports
`GitLedgerExportReadonlyPreviewPanel`.

The component is props-only and read-only. It does not fetch, call routes, call
GitHub, execute Git, run commands, write files, query DB, call providers,
execute retrieval/RAG, execute Codex, create proof/evidence, promote
Perspective, write/apply durable state, write Formation Receipts, product-write,
or allocate product IDs.

There are no create branch, commit, PR, merge, publish, deploy, product-write,
proof/evidence, promotion, or state-apply controls.

## Suggested Commit Message Display Policy

The suggested commit message is text only.

Suggested commit message is not approval.

The suggested commit message display is a readonly text area. It does not
execute Git, create commits, create branches, create tags, create PRs, merge
PRs, call GitHub, write repository files, or approve an export.

## Markdown Summary Display Policy

The markdown summary is bounded public-safe text only. It is rendered as
read-only selectable text. It is not a file export, not durable state, not
proof, not accepted evidence, not promotion, and not product-write.

## Privacy/Validation Display Policy

Privacy and validation reports are public-safe summaries only. Blocked preview
examples may use safe placeholder markers only inside blocked fixture examples.
Blocked outputs must not render raw private payloads, raw source bodies, raw
provider output, raw retrieval output, raw DB rows, raw conversations, hidden
reasoning, telemetry dumps, private URLs, local private paths, secrets, provider
runtime IDs, or raw diffs.

## Authority Boundary

Allowed true fields:

- `git_ledger_export_readonly_preview_now`
- `readonly_preview_only`
- `caller_provided_packet_only`
- `public_safe_render_only`
- `suggested_commit_message_text_render_now`
- `summary_markdown_render_now`

Forbidden capabilities remain false:

- `git_ledger_export_runtime_now`
- `git_ledger_export_builder_mutation_now`
- `git_write_now`
- `git_commit_now`
- `git_branch_now`
- `git_tag_now`
- `github_api_call_now`
- `pull_request_creation_now`
- `github_merge_now`
- `repository_file_write_now`
- `local_file_export_now`
- `local_file_import_now`
- `db_query_or_write_now`
- `route_now`
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
- `export_import_runtime_now`
- `codex_execution_now`
- `codex_execution_authority`
- `github_automation_authority`
- `product_write_now`
- `product_id_allocation_now`
- `product_write_authority`
- `suggested_commit_message_is_approval`
- `packet_hash_is_truth`
- `idempotency_key_is_authority`
- `git_ref_is_authority`
- `ledger_packet_is_commit`
- `ledger_packet_is_truth`
- `ledger_packet_is_proof`
- `ledger_packet_is_accepted_evidence`
- `ledger_packet_is_durable_state`
- `ledger_packet_is_promotion`
- `ledger_packet_is_product_write`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

This slice does not execute Git.

This slice does not execute Git Ledger export.

This slice does not create commits, branches, tags, PRs, or merges.

This slice does not call GitHub.

This slice does not write repository files.

This slice does not export files locally.

This slice does not import files.

This slice does not query/write DB.

This slice does not add routes.

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

## Fixture Policy

`fixtures/git-ledger-export-readonly-preview.sample.v0.1.json` uses
public-safe symbolic refs only. Safe placeholder markers appear only inside
blocked preview examples. The fixture does not include real secrets, real
provider IDs, real connector IDs, real uploaded-file IDs, real private URLs,
real local paths, raw source bodies, raw provider outputs, raw retrieval
outputs, raw DB rows, raw conversations, hidden reasoning, telemetry dumps,
real GitHub API payloads, real PR payloads, or raw diffs.

## Verification Expectations

Expected verification:

- `node --check scripts/smoke-git-ledger-export-readonly-preview-v0-1.mjs`
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

## Deferred Work

- Git Ledger export runtime
- Operator-gated local file export/import
- Git writes
- GitHub API mutation
- Branch, commit, tag, pull request, and merge creation
- DB-backed export queues
- Provider-assisted extraction runtime changes
- Retrieval/RAG execution
- Proof/evidence writes
- Durable Perspective state apply
- Formation Receipt writes
- Product-write reentry
- Product ID allocation
