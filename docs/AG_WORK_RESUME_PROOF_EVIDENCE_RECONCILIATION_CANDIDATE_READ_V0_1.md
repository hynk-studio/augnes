# AG Work Resume Proof Evidence Reconciliation Candidate Read v0.1

## Purpose

This document records the AG Resume proof/evidence reconciliation candidate
read helper and GET route. The reader lists or fetches rows from
`ag_work_resume_proof_evidence_reconciliation_candidates` as read-only
candidate review metadata.

Reads are read-only candidate review metadata only. Candidate rows are not
proof/evidence. Reads are not proof/evidence recording, not session binding,
not Codex execution or continuation, not work item/event creation, not
imported context/confirmed mapping/proposal mutation, and not approval,
publish, retry, replay, or merge authority.
Candidate rows are not proof/evidence.
Reads grant no approval, publish, retry, replay, or merge authority.

No Cockpit UI, schema, migration, lifecycle mutation, proof/evidence
recording, session binding, Codex execution, Direct Resume Code, relay,
browser report, ChatGPT App/MCP/App schema, or bridge tool was added by this
read helper/route slice. The existing POST create route is preserved but not
changed by this read slice.

The later read-only Cockpit Operator panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md`.
It calls only this existing GET route, renders candidate review metadata, and
adds no create/update/delete, lifecycle, proof/evidence/session, Codex, work
item/event creation, imported context/confirmed mapping/proposal mutation,
schema/migration, approval, publish, retry, replay, or merge authority.

The later bounded Cockpit Operator create panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md`.
It calls only the existing POST reconciliation candidates route and does not
change this read helper/GET route behavior.

The candidate lifecycle action contract is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`.
It updates existing candidate review metadata only. The read route may render
those lifecycle status values, but it does not apply lifecycle actions and
does not record proof/evidence.

## Relationship To Writer Route Schema And Design

This read slice follows:

- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md`
- `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md`

The writer creates bounded reconciliation candidate review metadata from an
imported context row and a bounded foreign ref summary. The existing POST
route delegates creation to that writer. This read helper/route only reads
candidate rows already present in
`ag_work_resume_proof_evidence_reconciliation_candidates`; it does not join
imported context, confirmed mapping, proposal, work, proof/evidence, session,
or Codex tables.

Foreign refs remain foreign until explicitly reconciled through a separately
approved user/Core gate. Candidate reads do not reconcile foreign refs and do
not create local proof or evidence records.

## Read Filters

Supported read filters:

- `candidate_id`: fetch one candidate.
- `import_id`
- `mapping_id`
- `foreign_ref_type` plus `foreign_ref_id`
- `local_target_scope` plus `local_target_work_id`
- `status`
- `proposed_by`
- `reviewed_by`
- `limit` for list reads only

List reads order records by `created_at DESC, candidate_id ASC`.

## Validation Rules

- At least one supported read filter is required; there is no implicit
  list-all.
- `candidate_id` fetch must not combine with list filters or `limit`.
- `foreign_ref_type` and `foreign_ref_id` must be supplied together.
- `local_target_scope` and `local_target_work_id` must be supplied together.
- `limit` must be a positive integer.
- Default `limit` is `20`.
- Maximum `limit` is `100`; larger values are capped to `100`.
- `foreign_ref_type` must be one of `proof`, `evidence`, `action`,
  `session`, `git`, `evidence_pack`, `handoff`, or `other`.
- `status` must be one of `proposed`, `accepted_for_future_recording`,
  `rejected`, `deferred`, `superseded`, `withdrawn`, or `revoked`.

## Core API

Core module:

```ts
import { readAgWorkResumeProofEvidenceReconciliationCandidates } from "@/lib/ag-work-resume-proof-evidence-reconciliation-candidate-read";
```

Input shape:

```ts
{
  candidate_id?: unknown,
  import_id?: unknown,
  mapping_id?: unknown,
  foreign_ref_type?: unknown,
  foreign_ref_id?: unknown,
  local_target_scope?: unknown,
  local_target_work_id?: unknown,
  status?: unknown,
  proposed_by?: unknown,
  reviewed_by?: unknown,
  limit?: unknown,
  db?: Database.Database
}
```

Result shape:

```ts
{
  ok,
  status,
  record,
  records,
  filters,
  limit,
  warnings,
  failures,
  authority_boundary,
  recommended_next_step
}
```

Statuses:

- `fetched`
- `listed`
- `invalid_input`
- `not_found`
- `db_error`

## JSON Text Parsing

Read records parse these JSON text fields into structured output:

- `redaction_status`
- `authority_boundary`

Malformed stored JSON is treated as a database read error by the core.

## Local Helper Usage

Helper command:

```bash
npm run ag:resume-proof-evidence-reconciliation-candidate-read -- --json --file input.json
```

Input priority:

1. `AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_INPUT`
2. `--file <path>`
3. flags
4. stdin

Supported flags:

- `--json`
- `--help`
- `--file <path>`
- `--candidate-id <id>`
- `--import-id <id>`
- `--mapping-id <id>`
- `--foreign-ref-type <proof|evidence|action|session|git|evidence_pack|handoff|other>`
- `--foreign-ref-id <id>`
- `--local-target-scope <scope>`
- `--local-target-work-id <id>`
- `--status <proposed|accepted_for_future_recording|rejected|deferred|superseded|withdrawn|revoked>`
- `--proposed-by <actor>`
- `--reviewed-by <actor>`
- `--limit <n>`

The helper prints one JSON object to stdout. It exits `0` for `fetched` or
`listed`. It exits non-zero for `invalid_input`, `not_found`, and `db_error`.

The helper never calls route, network, browser, GitHub, OpenAI,
proof/evidence, session, work, or Codex helpers.

## GET Route Behavior

Endpoint:

```text
GET /api/ag-work-resume/proof-evidence-reconciliation-candidates
```

Request rules:

- Query params only.
- Repeated params are rejected.
- Unknown params are rejected.
- Request bodies are rejected.
- The route delegates read validation and database reads to
  `readAgWorkResumeProofEvidenceReconciliationCandidates`.

Status mapping:

- `fetched` -> HTTP 200
- `listed` -> HTTP 200
- `invalid_input` -> HTTP 400
- `not_found` -> HTTP 404
- `db_error` -> HTTP 500

The GET route id is
`ag_work_resume_proof_evidence_reconciliation_candidate_read.v0_1`.
The existing POST create route id remains
`ag_work_resume_proof_evidence_reconciliation_candidates.v0_1`.

## Authority Boundary

Candidate read authority boundary:

- `read_only: true`
- `review_metadata_only: true`
- `reconciliation_candidate_created: false`
- `reconciliation_candidate_updated: false`
- `reconciliation_candidate_deleted: false`
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

Candidate reads expose review metadata only and are not
proof/evidence/session/Codex/merge authority.

## Non-Goals

- No writer changes.
- No POST behavior change except preserving the existing POST create route.
- No lifecycle mutation.
- No Cockpit UI.
- No schema or migration.
- No proof/evidence recording.
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

browser verification skipped: no rendered UI/operator surface changed in this reconciliation candidate read helper/route slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-read
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-route
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-writer
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-db-schema
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-design
npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design
npm run smoke:ag-work-resume-imported-context-route
npm run smoke:ag-work-resume-imported-context-writer
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs
```
