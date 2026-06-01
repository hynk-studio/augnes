# AG Work Resume Proof Evidence Reconciliation Candidate Writer v0.1

## Purpose

This document records the AG Resume proof/evidence reconciliation candidate
writer core and local helper.

The writer creates candidate review metadata rows only. Candidate rows are not
proof/evidence. The writer does not record proof/evidence, bind sessions,
execute Codex, create work items/events, mutate imported context rows, mutate
confirmed mapping rows, mutate proposal rows, add routes, or add UI.
The writer does not bind sessions. The writer does not execute Codex. The
writer does not create work items/events. The writer does not mutate imported
context rows, confirmed mapping rows, or proposal rows.
The writer does not mutate imported context rows. The writer does not mutate
confirmed mapping rows. The writer does not mutate proposal rows.
The writer adds no route. The writer adds no UI.

Reconciliation candidates remain bounded review metadata derived from an
existing imported context row and a bounded foreign ref summary. Foreign refs
remain foreign until explicitly reconciled through a separately approved
user/Core gate.

## Relationship To Candidate Schema Reconciliation And Gate Docs

This writer follows:

- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md`

The schema implementation creates only the candidate table and indexes. This
writer adds the first bounded row creation path for that table, but still does
not add any route, Cockpit UI, proof/evidence recording, session binding,
Codex execution, work item/event creation, imported context mutation,
confirmed mapping mutation, proposal mutation, approval, publish, retry,
replay, or merge authority.

The later JSON route is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md`.
It delegates to this shared writer core and preserves the same review metadata
authority boundary. The writer core remains independent of HTTP route
behavior.

The later read helper/GET route is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md`.
It reads candidate review metadata only and does not change writer behavior,
record proof/evidence, bind sessions, execute Codex, create work items/events,
mutate imported contexts, confirmed mappings, or proposals, or grant approval,
publish, retry, replay, or merge authority.

The later read-only Cockpit Operator panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md`.
It calls only the existing GET route, renders candidate review metadata, and
adds no writer behavior, create/update/delete controls, lifecycle mutation,
proof/evidence/session behavior, Codex authority, work item/event creation,
imported context/confirmed mapping/proposal mutation, approval, publish,
retry, replay, or merge authority.

The later bounded Cockpit Operator create panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md`.
It calls only the existing POST route over this writer and adds no update,
delete, lifecycle, proof/evidence/session, Codex, work item/event creation,
imported context/confirmed mapping/proposal mutation, schema/migration,
approval, publish, retry, replay, or merge authority.

## Core API

Core module:

```ts
import { createAgWorkResumeProofEvidenceReconciliationCandidate } from "@/lib/ag-work-resume-proof-evidence-reconciliation-candidate";
```

Input shape:

```ts
{
  import_id: unknown;
  mapping_id?: unknown;
  foreign_ref_type: unknown;
  foreign_ref_id: unknown;
  local_target_scope: unknown;
  local_target_work_id: unknown;
  summary: unknown;
  redaction_status: unknown;
  proposed_by: unknown;
  proposed_reason: unknown;
  created_at?: unknown;
  db?: Database.Database;
  now?: string;
}
```

Result shape:

```ts
{
  ok,
  status,
  candidate_id,
  record,
  imported_context,
  warnings,
  failures,
  authority_boundary,
  recommended_next_step
}
```

Statuses:

- `created`
- `invalid_input`
- `imported_context_not_found`
- `imported_context_not_allowed`
- `imported_context_mismatch`
- `redaction_blocked`
- `duplicate_candidate`
- `db_error`

## Helper Usage

Local helper:

```bash
npm run ag:resume-proof-evidence-reconciliation-candidate-create -- --json --file candidate.json
```

Input priority:

1. `AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_INPUT`
2. `--file <path>`
3. flags
4. stdin

Supported flags:

- `--json`
- `--help`
- `--file <path>`
- `--import-id <id>`
- `--mapping-id <id>`
- `--foreign-ref-type <proof|evidence|action|session|git|evidence_pack|handoff|other>`
- `--foreign-ref-id <id>`
- `--local-target-scope <scope>`
- `--local-target-work-id <id>`
- `--summary <summary>`
- `--redaction-status-json <json-object>`
- `--proposed-by <actor>`
- `--proposed-reason <reason>`
- `--created-at <iso>`

The helper prints one JSON object to stdout. It exits `0` only when the writer
returns `created`. It exits non-zero for invalid input, missing imported
context, disallowed imported context status, imported context mismatch,
redaction blocks, duplicate candidates, and database errors.

The helper never calls route, network, browser, GitHub, OpenAI,
proof/evidence, session, work, or Codex helpers.

## Validation Rules

- Unknown fields are rejected.
- `import_id` is required and must be a non-empty string.
- `mapping_id`, when supplied, must be a non-empty string and must match the
  imported context `mapping_id`.
- `foreign_ref_type` is required and must be one of `proof`, `evidence`,
  `action`, `session`, `git`, `evidence_pack`, `handoff`, or `other`.
- `foreign_ref_id` is required and must be a non-empty string.
- `local_target_scope` is required and must be a non-empty string.
- `local_target_work_id` is required and must be a non-empty string.
- `summary` is required, non-empty, and bounded.
- `proposed_by` is required and must be a non-empty string.
- `proposed_reason` is required, non-empty, and bounded.
- `created_at`, when supplied, must be ISO UTC with millisecond precision.
- `now`, when supplied internally, must be ISO UTC with millisecond precision.
- If `created_at` is omitted, the writer uses `now` when supplied, otherwise
  `new Date().toISOString()`.

## DB Behavior

The writer uses a DB transaction. On success it creates exactly one row in
`ag_work_resume_proof_evidence_reconciliation_candidates`.

Created rows use:

- `record_kind = ag_work_resume_proof_evidence_reconciliation_candidate`
- `schema = augnes.ag_work_resume_proof_evidence_reconciliation_candidate.v0_1`
- `status = proposed`

The writer stores `redaction_status` and `authority_boundary` as bounded JSON
text. It returns the inserted candidate row with parsed JSON fields.

The writer does not create rows in proof/evidence tables, sessions,
work_events, action_records, verification_evidence_records, work_items,
imported contexts, confirmed mappings, or proposals.

## Imported Context Validation

The writer loads the imported context by `import_id` from
`ag_work_resume_imported_contexts`.

- Missing imported context returns `imported_context_not_found`.
- Imported context status must be `review_metadata`; otherwise the writer
  returns `imported_context_not_allowed`.
- If `mapping_id` is supplied, it must match the imported context
  `mapping_id`; if omitted, it is derived from the imported context.
- `local_target_scope` and `local_target_work_id` must match the imported
  context `local_scope` and `local_work_id`.
- The matching local work identity must still exist.

`foreign_ref_type` and `foreign_ref_id` identify foreign refs for review only.
The writer does not validate them as local proof/evidence IDs.

## Redaction Validation

`redaction_status` is required and must be a bounded JSON object with:

- `safe === true`
- `secrets_included === false`
- `raw_db_paths_included === false`
- `session_payloads_included === false`
- `proof_payloads_included === false`

Any unsafe or missing redaction field returns `redaction_blocked`.

## Duplicate Candidate Policy

The writer rejects a duplicate proposed candidate when an existing row has
status `proposed` or `accepted_for_future_recording` for the same:

- `import_id`
- `mapping_id`
- `foreign_ref_type`
- `foreign_ref_id`
- `local_target_scope`
- `local_target_work_id`

Duplicate candidate rejection is review metadata protection only. Supersession
or lifecycle behavior remains separately designed.

## Output Shape

On success, `record` is the inserted candidate row, `candidate_id` is the row
id, and `imported_context` is the loaded imported context review metadata.

On failure, `record` is `null`, `ok` is `false`, and `failures` explains the
fail-closed reason. When the imported context was loaded, the failure may
return it for review context only.

## Authority Boundary

The writer authority boundary states:

- `reconciliation_candidate_created: true` only on success
- `review_metadata_only: true`
- `proof_recorded: false`
- `evidence_recorded: false`
- `session_bound: false`
- `codex_executed: false`
- `work_item_created: false`
- `work_event_created: false`
- `imported_context_updated: false`
- `confirmed_mapping_updated: false`
- `proposal_record_updated: false`
- `approval_granted: false`
- `publish_retry_replay_authority: false`
- `merge_authority: false`
- `durable_approval: user/Core gated`

Reconciliation candidate creation is review metadata only and not
proof/evidence/session/Codex/merge authority.

## Non-Goals

- No route.
- No UI.
- No schema or migration changes.
- No candidate read helper/route.
- No proof/evidence recording.
- No evidence recording.
- No session binding.
- No Codex execution or continuation.
- No work item/event creation.
- No imported context mutation.
- No confirmed mapping mutation.
- No proposal mutation.
- No ChatGPT App/MCP/App schema.
- No bridge tools.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, indexedDB, or browser
  persistence.
- No browser report.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this reconciliation candidate writer/helper slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-route
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-writer
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-db-schema
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-design
npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design
npm run smoke:ag-work-resume-imported-context-writer
npm run smoke:ag-work-resume-imported-context-route
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/ag-work-resume-proof-evidence-reconciliation-candidate-create.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs
```
