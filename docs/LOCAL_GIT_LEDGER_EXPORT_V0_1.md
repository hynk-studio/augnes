# Local Git Ledger Export v0.1

## Purpose

`local_git_ledger_export_v0_1` adds an explicit, allowlisted, local-only Git
Ledger packet artifact export helper for public-safe packet candidates.

This slice writes local export artifacts only to allowlisted output
directories.

This slice supports dry-run manifest mode without file writes.

This slice writes packet artifacts only when a caller supplies a validated,
public-safe request and an allowlisted local output directory.

Suggested commit message artifact is not approval.

Manifest hash is not truth.

Artifact hash is not authority.

Git ref is not authority.

Exported packet is not commit, not proof, not accepted evidence, not durable
state, not promotion, and not product-write.

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

This slice implements `local_git_ledger_export_v0_1` from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Existing repo-local contracts and
runtime slices remain authority for fields, types, enums, and runtime behavior.

## Relationship to Git Ledger Export Contract v0.1

`docs/GIT_LEDGER_EXPORT_CONTRACT_V0_1.md` and
`types/git-ledger-export-contract.ts` define the contract-only Git Ledger packet
boundary. This local export helper consumes public-safe packet candidates and
symbolic refs only. It does not weaken or replace the contract.

## Relationship to Git Ledger Export Deterministic Builder v0.1

`lib/git-ledger/build-export-packet.ts` builds deterministic packet candidates,
packet hashes, idempotency keys, markdown summaries, and suggested commit
message text. This slice requires packet data to be caller-provided and
public-safe. It does not run Git, create commits, create branches, create tags,
create PRs, merge PRs, or call GitHub.

## Relationship to Git Ledger Export Readonly Preview v0.1

`components/git-ledger-export-readonly-preview-panel.tsx` displays packet
candidates as read-only preview material. This local export helper is the next
bounded step: it can write a fixed set of local artifacts under an allowlisted
temporary export root, but it still does not grant Git, GitHub, proof/evidence,
promotion, durable state, or product-write authority.

## Relationship to Privacy Redaction Runtime Guard

Privacy Redaction Runtime Guard v0.1 remains required. This helper blocks
raw/private markers, private URLs, local private paths, token or secret-like
patterns, provider thread/run/session identifiers, raw source bodies, raw
provider output, raw retrieval output, raw DB rows, raw conversations, hidden
reasoning, telemetry dump markers, and raw diff markers.

Validation errors, manifests, and artifacts must not echo raw unsafe values.
Blocked outputs use public-safe summaries only.

## Relationship to Local Data Export/Import Policy

Local Data Export/Import Policy v0.1 remains the broader policy boundary. This
slice implements only local Git Ledger packet artifact export under
`tmp/git-ledger-export/` or `.tmp/git-ledger-export/`. It does not implement
local import runtime.

## Relationship to Authority Boundary Regression CI

Authority Boundary Regression CI v0.1 remains diagnostic only. Smoke/CI pass is
not truth. CI pass is not truth. Git refs, manifest hashes, artifact hashes,
packet hashes, idempotency keys, and suggested commit message text remain
review aids only.

## Export Request Contract

The export request includes:

- `request_version`
- `export_version`
- `builder_version`
- `contract_version`
- `scope: project:augnes`
- `export_id`
- `requested_by`
- `requested_at`
- `output_dir`
- `dry_run`
- `packet`
- `summary_markdown`
- `suggested_commit_message`
- `privacy_report`
- `source_refs`
- `evidence_refs`
- `candidate_refs`
- `authority_boundary`
- `boundary_notes`
- `reason_codes`

Unknown fields are recursively scanned. Caller-provided packet data is accepted
only as public-safe candidate material.

## Allowlisted Output Directory Policy

Allowed output roots are:

- `tmp/git-ledger-export/`
- `.tmp/git-ledger-export/`

The helper rejects absolute paths, paths with `..`, paths with null bytes,
paths with backslashes, URLs, private/local user paths, token or secret-looking
paths, and paths under `docs/`, `lib/`, `app/`, `components/`, `scripts/`,
`fixtures/`, `package.json`, `.github/`, or any repo source directory.

This slice does not write repository source files.

This slice does not export outside `tmp/git-ledger-export/` or
`.tmp/git-ledger-export/`.

## Artifact Layout

Write mode emits exactly these artifact names:

- `packet.json`
- `summary.md`
- `source-refs.json`
- `evidence-refs.json`
- `candidate-refs.json`
- `privacy-report.json`
- `suggested-commit-message.txt`
- `authority-boundary.json`
- `manifest.json`

The artifacts are local export artifacts only. They are not Git commits, Git
refs, GitHub PRs, proof/evidence records, durable state, promotion, approval,
authority, product-write, or product ID allocation.

## Dry-Run Policy

Dry-run mode validates the request and builds a deterministic manifest without
writing files. `dry_run_manifest_only` is true. `local_file_export_now` is
false.

## Write Mode Policy

Write mode writes only the fixed artifact names under an allowlisted output
directory. It creates the output directory when needed and fails closed if any
artifact path would escape that directory.

This slice does not execute Git.

This slice does not execute Git Ledger export runtime beyond local artifact
writing.

This slice does not create commits, branches, tags, PRs, or merges.

This slice does not call GitHub.

## Deterministic Manifest/Hash Policy

The manifest includes artifact names, artifact count, artifact hashes,
manifest hash, packet ref, packet hash, idempotency key, privacy report
summary, authority boundary, boundary notes, reason codes, and status.

Manifest hash is not truth.

Artifact hash is not authority.

Git ref is not authority.

## Suggested Commit Message Artifact Policy

`suggested-commit-message.txt` is text only.

Suggested commit message artifact is not approval.

It does not execute Git, create a commit, create a branch, create a tag, create
a PR, merge a PR, call GitHub, or grant product-write authority.

## Privacy/Redaction Policy

The helper blocks raw/private payloads and textual mutation or authority
requests before writing. Blocked inputs do not write artifacts. Blocked
manifests and validation reports use public-safe summaries only.

## Authority Boundary

Allowed true fields:

- `local_git_ledger_export_helper_now`
- `caller_provided_packet_only`
- `allowlisted_local_output_dir_only`
- `deterministic_artifact_manifest_now`
- `local_file_export_now` only in write mode
- `dry_run_manifest_only` only in dry-run mode

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
- `exported_packet_is_commit`
- `exported_packet_is_truth`
- `exported_packet_is_proof`
- `exported_packet_is_accepted_evidence`
- `exported_packet_is_durable_state`
- `exported_packet_is_promotion`
- `exported_packet_is_product_write`
- `suggested_commit_message_is_approval`
- `manifest_hash_is_truth`
- `artifact_hash_is_authority`
- `git_ref_is_authority`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

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

`fixtures/local-git-ledger-export.sample.v0.1.json` uses public-safe symbolic
refs only. Safe placeholder markers appear only inside blocked fixture
examples. The fixture does not include real secrets, real provider IDs, real
connector IDs, real uploaded-file IDs, real private URLs, real local paths, raw
source bodies, raw provider outputs, raw retrieval outputs, raw DB rows, raw
conversations, hidden reasoning, telemetry dumps, real GitHub API payloads,
real PR payloads, or raw diffs.

## Verification Expectations

Expected verification:

- `node --check scripts/smoke-local-git-ledger-export-v0-1.mjs`
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

## Deferred Work

- Git execution
- GitHub API mutation
- Branch, commit, tag, pull request, and merge creation
- Repository source file writes
- Local import runtime
- DB-backed export queues
- Routes and UI action controls
- Provider calls and prompt sending
- Source fetching
- Retrieval/RAG execution
- Proof/evidence writes
- Durable Perspective state apply
- Formation Receipt writes
- Product-write reentry
- Product ID allocation
