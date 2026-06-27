# Codex Result Report Ingestion v0.1

## Purpose

`codex_result_report_ingestion_v0_1` normalizes caller-provided Codex result
reports into public-safe dogfooding candidate input for later operator review.
Codex result report is candidate input only.

The helper accepts report material such as PR body summaries, changed-file
summaries, validation command reports, skipped checks, known warnings, not-done
items, expected/observed deltas, symbolic source refs, privacy findings, and
authority boundary notes. It returns deterministic public-safe review cues.

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

This slice implements `codex_result_report_ingestion_v0_1` from the roadmap.
The roadmap guide is not SSOT. Existing repo-local contracts and runtime slices
remain authoritative for fields, behavior, and boundaries.

## Relationship to Dogfooding, Authority Boundary Regression CI, Privacy Redaction Runtime Guard, Local Data Export/Import Policy, Review Memory, Handoff Capsules, GitHub, Git Ledger, and Product Write

- Dogfooding: the normalized record is candidate-only review material for a
  future operator-reviewed dogfooding path.
- Authority Boundary Regression CI: wording in this slice keeps CI, smoke,
  Git refs, PR bodies, Codex reports, and product-write claims diagnostic or
  reference-only.
- Privacy Redaction Runtime Guard: Privacy Redaction Runtime Guard v0.1 is the
  required convention for future runtime surfaces; this slice aligns with it
  and never echoes unsafe raw values.
- Local Data Export/Import Policy: Local Data Export/Import Policy v0.1 remains
  policy-only and contract-only; this slice does not implement export/import
  runtime.
- Review Memory and Handoff Capsules: report ingestion may later feed
  operator-reviewed memory or handoff review, but this slice does not write
  review memory or handoff state.
- GitHub and Git Ledger: GitHub branch/commit/PR refs are references only, not
  authority. Git Ledger export is not executed here.
- Product Write: Product-write remains parked by #686.

## Input Contract

Inputs are caller-provided objects only. The expected shape includes:

- `input_version`
- `scope: project:augnes`
- `report_id`
- `report_kind`
- `reported_at`
- `operator_actor_ref`
- optional PR, branch, commit, source, privacy, validation, warning, skipped,
  not-done, changed-file, and boundary note fields
- optional `authority_boundary`

The library does not read files. The library does not inspect repo state.
Missing or invalid required fields are rejected without echoing raw input
values. `report_kind` must be one of the declared kinds; `unknown` is allowed
only when the caller explicitly supplies `"unknown"`.

## Output Record Shape

The output record includes:

- `record_version`
- `scope`
- `status`
- report refs and operator refs
- symbolic source refs
- `normalized_summary`
- observed file, observed check, changed file, skipped check, known warning,
  not-done, and expected/observed delta refs
- `review_cues`
- `reason_codes`
- `boundary_notes`
- `privacy_report`
- `authority_boundary`
- `report_fingerprint`

Statuses are `candidate_only`, `needs_operator_review`,
`blocked_private_or_raw_payload`, `blocked_forbidden_authority`, or `rejected`.

## Review Cue Policy

PR body is not authority. Changed files are review cues only. Validation
commands are diagnostic only. CI pass is not truth. Smoke pass is not truth.
Validation pass is not approval. Validation failure is not automatic rejection.

Codex report is not proof, not evidence, not durable state, and not execution
approval. GitHub branch/commit/PR refs are references only, not authority.

## Privacy/Redaction Policy

The normalizer rejects or redacts private/raw material before producing the
public-safe record. Blocked input categories include private URLs, local private
paths, token/secret/cookie/key markers, raw terminal logs, raw GitHub payloads,
raw provider output, raw retrieval output, raw source bodies, raw DB rows, raw
conversation markers, hidden reasoning markers, provider thread/run/session
IDs, opaque connector IDs, and uploaded-file opaque IDs when used as canonical
labels or public-safe payload material.

Reports, findings, docs examples, and smoke failure messages must not echo raw
unsafe values.

## Authority Boundary

Allowed now:

- `codex_result_report_ingestion_now`
- `caller_provided_input_only`
- `candidate_only`
- `deterministic_normalization_now`

Forbidden now:

- Codex execution
- GitHub API calls or GitHub mutation
- branch, commit, PR, or merge creation
- Git writes
- repository file writes
- runtime state mutation
- DB query/write
- routes
- provider/OpenAI calls
- prompt sending
- source fetch
- retrieval/RAG
- proof/evidence or claim/evidence writes
- Perspective promotion
- durable Perspective state write/apply
- Formation Receipt writes
- Git Ledger export runtime
- export/import runtime
- product-write or product ID allocation

This slice does not execute Codex. This slice does not call GitHub. This slice
does not create branches, commits, PRs, or merges. This slice does not run
validation commands. This slice does not read files or write files. This slice
does not query/write DB. This slice does not add routes. This slice does not
call providers. This slice does not execute retrieval/RAG. This slice does not
create proof/evidence. This slice does not promote Perspective. This slice does
not write/apply durable Perspective state. This slice does not write Formation
Receipts. This slice does not execute Git Ledger export. This slice does not
product-write or allocate product IDs.

Smoke/CI pass is not truth.

## Component/Read-Only Preview Boundary

`components/codex-result-report-ingestion-panel.tsx` is a read-only preview
surface for caller-provided normalized records. It shows report status,
normalized summary, changed file refs, observed checks, skipped checks, known
warnings, not-done items, expected/observed deltas, review cues, authority
boundary notes, and product-write parked status.

The component does not call routes, fetch data, execute Codex, call GitHub,
create PRs, trigger validation commands, write DB, write files, promote state,
create proof/evidence, or product-write.

## Fixture Policy

The fixture uses public-safe symbolic refs. Safe placeholder markers appear only
inside blocked fixture examples. Fixtures must not include real PR payloads,
real GitHub API payload dumps, real secrets, real provider IDs, real connector
IDs, real uploaded-file IDs, real private URLs, real local paths, raw terminal
logs, raw source bodies, raw provider outputs, raw retrieval outputs, raw DB
rows, raw conversations, or hidden reasoning.

## Verification Expectations

Expected checks:

- `node --check scripts/smoke-codex-result-report-ingestion-v0-1.mjs`
- `npm run smoke:codex-result-report-ingestion-v0-1`
- `npm run smoke:authority-boundary-regression-v0-1`
- `npm run smoke:privacy-redaction-guard-v0-1`
- `npm run smoke:local-data-export-policy-v0-1`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

The smoke verifies exports, fixture shape, deterministic fingerprint behavior,
blocked private/raw input, blocked forbidden authority input, read-only panel
source, package/index pointers, and no new runtime authority.

## Deferred Work

- Operator-reviewed conversion into dogfooding records.
- Any DB-backed ingestion runtime.
- Any route or UI wiring beyond this read-only component.
- Any GitHub, Git, Codex, provider, retrieval/RAG, proof/evidence, durable state,
  Formation Receipt, Git Ledger, export/import, or product-write runtime.
