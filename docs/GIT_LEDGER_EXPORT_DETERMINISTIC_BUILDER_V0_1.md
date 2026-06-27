# Git Ledger Export Deterministic Builder v0.1

## Purpose

`git_ledger_export_deterministic_builder_v0_1` implements deterministic,
public-safe helpers for building Git Ledger export packet candidates from
caller-provided bounded summaries and symbolic refs only.

This slice builds packet candidates only.

This slice renders markdown and suggested commit message text only.

Suggested commit message is not approval.

Packet hash is not truth.

Idempotency key is not authority.

Git ref is not authority.

Git Ledger export packet is not commit, not proof, not accepted evidence, not
durable state, not promotion, and not product-write.

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

This slice implements `git_ledger_export_deterministic_builder_v0_1` from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Existing repo-local contracts and
runtime slices remain authority for fields, types, enums, and future runtime
behavior.

## Relationship to Git Ledger Export Contract v0.1

`docs/GIT_LEDGER_EXPORT_CONTRACT_V0_1.md` and
`types/git-ledger-export-contract.ts` define the existing contract-only Git
Ledger packet boundary. This builder mirrors the existing contract versions:
`git_ledger_export_contract.v0.1` and `git_ledger_packet.v0.1`.

The builder does not weaken the contract. It produces a public-safe packet
candidate, deterministic packet hash, deterministic idempotency key, bounded
markdown summary, suggested commit message text, and validation report.

## Relationship to Privacy Redaction Runtime Guard

Privacy Redaction Runtime Guard v0.1 remains required before any future Git
Ledger export runtime. This builder aligns with that guard by blocking or
redacting raw/private markers, private URLs, local private paths, provider
thread/run/session identifiers, token or secret-like patterns, raw provider
output, raw retrieval output, raw DB rows, raw conversations, hidden reasoning,
telemetry dump markers, and raw diff markers.

Validation findings and rendered packet materials do not echo raw unsafe
values. They include public-safe summaries and paths only.

## Relationship to Local Data Export/Import Policy

Local Data Export/Import Policy v0.1 remains policy-only and contract-only.
This builder is not local export/import runtime. It does not export files
locally, import files, read files as input, write files, query DB, or write DB.

## Relationship to Authority Boundary Regression CI

Authority Boundary Regression CI v0.1 should continue to treat Git refs, GitHub
PRs, packet hashes, idempotency keys, CI pass, and smoke pass as diagnostic or
reference-only material. CI pass is not truth. Smoke pass is not truth.
Smoke/CI pass is not truth.

## Relationship to Codex Result Report Ingestion and Temporal Handoff Usefulness Experiment Plan

Codex Result Report Ingestion v0.1 treats Codex reports, changed files,
validation commands, PR bodies, CI pass/fail, and smoke pass/fail as candidate
or review cues only. Temporal Handoff Usefulness Experiment Plan v0.1 remains
experiment-plan-only and fixture-only. This builder can reference those records
symbolically, but it does not execute Codex, run experiments, call GitHub, or
create proof/evidence.

## Input Contract

The builder accepts caller-provided objects only. The input includes:

- `builder_version`
- `contract_version`
- `scope: project:augnes`
- `generated_by`
- `generated_at`
- `packet_id`
- `packet_title`
- `change_summary`
- `reason_summary`
- public-safe symbolic lineage refs
- `public_safe_metadata`
- `privacy_report`
- `suggested_file_layout`
- `suggested_commit_intent`
- `boundary_notes`
- `reason_codes`
- `authority_boundary`

Unknown fields are recursively scanned. The builder does not read files as
source input, fetch sources, call providers, execute retrieval/RAG, run shell
commands, query DB, call GitHub, or execute Git.

## Packet Shape

The packet candidate includes:

- `packet_version`
- `contract_version`
- `builder_version`
- `scope`
- `status`
- `packet_id`
- `packet_title`
- `generated_by`
- `generated_at`
- `change_summary`
- `reason_summary`
- `lineage_refs`
- `public_safe_metadata`
- `privacy_report`
- `suggested_file_layout`
- `suggested_commit_message`
- `summary_markdown`
- `idempotency_key`
- `packet_hash`
- `validation`
- `boundary_notes`
- `reason_codes`
- `authority_boundary`

Lineage refs are public-safe symbolic refs only. Supported lineage kinds are
source refs, candidate refs, evidence refs, reviewer note refs, Formation
Receipt refs, state transition refs, promotion decision refs, dogfooding record
refs, feedback aggregate refs, runtime audit refs, retrieval index refs,
provider extraction refs, manual anchors, surfacing previews, and trajectories.

## Deterministic Hash Policy

The packet hash is a deterministic SHA-256 hash over canonical packet JSON with
`packet_hash` omitted. Packet hash is not truth. Packet hash is not proof.
Packet hash is not accepted evidence. It is a deterministic review aid only.

## Idempotency Key Policy

The idempotency key is deterministic text derived from public-safe builder
input fields. Idempotency key is not authority. It does not grant export,
commit, merge, GitHub automation, durable state, proof/evidence, promotion, or
product-write authority.

## Markdown Summary Policy

The markdown summary is bounded public-safe text only. It summarizes packet
status, lineage refs, and authority-boundary notes. It is not a file export,
not durable state, not proof, and not accepted evidence.

## Suggested Commit Message Policy

The suggested commit message is text only.

Suggested commit message is not approval.

The suggested commit message does not execute Git, create commits, create
branches, create tags, create pull requests, merge pull requests, or call
GitHub.

## Privacy/Redaction Policy

The builder blocks raw/private payloads and unsafe markers before producing a
`packet_candidate_created` status. Blocked examples use safe placeholder
markers only, such as `SAFE_MARKER_RAW_DIFF` and
`SAFE_MARKER_PROVIDER_THREAD_ID`.

Textual mutation or authority requests are also unsafe for rendering. A blocked
input that asks to execute Git, call GitHub, write files, write DB, call
providers, run retrieval/RAG, create proof/evidence, promote Perspective, write
Formation Receipts, execute product-write, or allocate product IDs is rendered
with public-safe placeholder summaries only.

The builder never includes raw unsafe values in validation errors, packet
candidate output, markdown summary, suggested commit message, fixture expected
output, or smoke failure output.

## Authority Boundary

Allowed true fields:

- `git_ledger_export_builder_now`
- `deterministic_packet_builder_now`
- `caller_provided_input_only`
- `public_safe_packet_candidate_only`
- `summary_markdown_render_now`
- `suggested_commit_message_render_now`

Forbidden capabilities remain false:

- `git_ledger_export_runtime_now`
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
- `export_import_runtime_now`
- `codex_execution_now`
- `codex_execution_authority`
- `github_automation_authority`
- `product_write_now`
- `product_id_allocation_now`
- `product_write_authority`
- `ledger_packet_is_commit`
- `ledger_packet_is_truth`
- `ledger_packet_is_proof`
- `ledger_packet_is_accepted_evidence`
- `ledger_packet_is_product_write`
- `suggested_commit_message_is_approval`
- `packet_hash_is_truth`
- `idempotency_key_is_authority`
- `git_ref_is_authority`
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

## Fixture Policy

`fixtures/git-ledger-export-builder.sample.v0.1.json` uses public-safe symbolic
refs only. Safe placeholder markers appear only inside blocked fixture
examples. The fixture does not include real secrets, real provider IDs, real
connector IDs, real uploaded-file IDs, real private URLs, real local paths, raw
source bodies, raw provider outputs, raw retrieval outputs, raw DB rows, raw
conversations, hidden reasoning, telemetry dumps, real GitHub API payloads,
real PR payloads, or raw diffs.

## Verification Expectations

Expected verification:

- `node --check scripts/smoke-git-ledger-export-builder-v0-1.mjs`
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
