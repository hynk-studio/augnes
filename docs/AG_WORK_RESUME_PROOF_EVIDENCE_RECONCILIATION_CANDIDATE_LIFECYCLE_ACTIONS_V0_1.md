# AG Work Resume Proof Evidence Reconciliation Candidate Lifecycle Actions v0.1

## Purpose

This document records the AG Resume proof/evidence reconciliation candidate
lifecycle contract, core helper, CLI helper, and JSON route.

Lifecycle actions update existing reconciliation candidate review metadata only
in `ag_work_resume_proof_evidence_reconciliation_candidates`.
accepted_for_future_recording is not proof/evidence recording. It marks that
candidate metadata may be suitable for a future, separately authorized
proof/evidence recording design.

This slice does not create proof/evidence records, bind sessions, execute or
continue Codex, create work items, create work events, mutate imported context
rows, mutate confirmed mapping rows, mutate proposal rows, grant approval,
publish, retry, replay, merge, auto-merge, externally post, or commit/reject
Augnes state.

Durable approval remains user/Core gated.

## Relationship To Existing Candidate Pieces

Related documents:

- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md`

The lifecycle core uses the existing candidate schema. The schema already
defines the review metadata statuses. This contract uses the existing
`proposed` status as the pending-review state rather than adding a new
`pending_review` status.

## Core API

Core module:

```ts
import { applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction } from "@/lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action";
```

Input shape:

```ts
{
  candidate_id: unknown;
  action: unknown;
  reviewed_by: unknown;
  review_note: unknown;
  reviewed_at?: unknown;
  replacement_candidate_id?: unknown;
  superseded_by_candidate_id?: unknown;
  db?: Database.Database;
  now?: string;
}
```

Result shape:

```ts
{
  ok,
  status,
  action,
  candidate_id,
  before_record,
  record,
  updated_fields,
  warnings,
  failures,
  authority_boundary,
  recommended_next_step
}
```

Statuses:

- `updated`
- `invalid_input`
- `not_found`
- `invalid_transition`
- `replacement_not_found`
- `db_error`

## Lifecycle Actions

Supported actions:

- `accept_for_future_recording`
- `reject`
- `defer`
- `withdraw`
- `revoke`
- `supersede`

Status effects:

- `accept_for_future_recording` sets status
  `accepted_for_future_recording`.
- `reject` sets status `rejected`.
- `defer` sets status `deferred`.
- `withdraw` sets status `withdrawn`.
- `revoke` sets status `revoked`.
- `supersede` sets status `superseded`.

`accepted_for_future_recording` means only that the candidate review metadata
has been accepted as suitable for a possible future recording path. It does not
record proof/evidence, create proof/evidence records, bind a session, continue
Codex, or create work items/events.

## Allowed Transitions

Allowed lifecycle transitions:

- `proposed` -> `accepted_for_future_recording`
- `proposed` -> `rejected`
- `proposed` -> `deferred`
- `proposed` -> `withdrawn`
- `proposed` -> `superseded`
- `deferred` -> `accepted_for_future_recording`
- `deferred` -> `rejected`
- `deferred` -> `withdrawn`
- `deferred` -> `revoked`
- `deferred` -> `superseded`
- `accepted_for_future_recording` -> `revoked`
- `accepted_for_future_recording` -> `superseded`
- `rejected` -> `revoked`
- `rejected` -> `superseded`
- `withdrawn` -> `revoked`
- `withdrawn` -> `superseded`
- `superseded` -> `revoked`

`revoked` has no further transition in this contract.

Duplicate actions or actions that would repeat the current terminal decision
return `invalid_transition` and do not write. Correction, reopen, or any
broader idempotency behavior requires a separately gated future design.

Revoking a superseded candidate intentionally preserves any existing
`superseded_by_candidate_id` as audit metadata. The revoke action updates the
candidate status and review metadata only; it does not clear the replacement
link and does not update the replacement candidate row.

## Validation Rules

- Unknown fields are rejected.
- `candidate_id` is required and must be a non-empty string.
- `action` must be one of the supported lifecycle actions.
- `reviewed_by` is required and must be a non-empty string.
- `review_note` is required, non-empty, and bounded.
- `reviewed_at`, when supplied, must be ISO UTC with millisecond precision.
- `now`, when supplied internally, must be ISO UTC with millisecond precision.
- If `reviewed_at` is omitted, the core uses `now` when supplied, otherwise
  `new Date().toISOString()`.
- `replacement_candidate_id` and `superseded_by_candidate_id` are allowed only
  for `supersede`.
- If both replacement id fields are supplied, they must match after trimming.
- A supersede replacement candidate id must not equal `candidate_id`.
- A supplied replacement candidate row must already exist.
- Missing candidates return `not_found`.
- Unsupported status/action pairs return `invalid_transition`.

Imported-context inactive or mismatch checks are not reapplied by lifecycle
actions. Lifecycle actions operate on an existing candidate row and update only
candidate review metadata. They do not mutate imported context rows or
revalidate the imported context as a new creation authority gate.

## DB Behavior

The core uses one DB transaction. On success it updates exactly one row in
`ag_work_resume_proof_evidence_reconciliation_candidates`.

Updated fields:

- `status`
- `reviewed_by`
- `reviewed_at`
- `review_note`
- `updated_at`
- `superseded_by_candidate_id` only for `supersede` when a replacement id is
  supplied

For `revoke` from `superseded`, `superseded_by_candidate_id` is preserved from
the earlier supersede action but is not included in `updated_fields`.

The lifecycle action does not update the replacement candidate row. It does
not update `supersedes_candidate_id`, imported context rows, confirmed mapping
rows, proposal rows, work tables, session tables, action records,
verification evidence records, proof/evidence tables, bridge tables, MCP/App
schemas, publication tables, approval tables, or delivery tables.

## Helper Usage

Local helper:

```bash
npm run ag:resume-proof-evidence-reconciliation-candidate-lifecycle-action -- --candidate-id ag-resume-proof-evidence-reconciliation-candidate:example --action reject --reviewed-by user-core:reviewer --review-note "Reject candidate metadata."
```

Input priority:

1. `AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_INPUT`
2. `--file <path>`
3. flags
4. stdin

Supported flags:

- `--json`
- `--help`
- `--file <path>`
- `--candidate-id <id>`
- `--action <accept_for_future_recording|reject|defer|withdraw|revoke|supersede>`
- `--reviewed-by <actor>`
- `--review-note <note>`
- `--reviewed-at <iso>`
- `--replacement-candidate-id <id>`
- `--superseded-by-candidate-id <id>`

The helper prints one JSON object to stdout and exits zero only when the
lifecycle update succeeds.

## Route

```text
POST /api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions
```

The route accepts JSON request bodies only. It rejects invalid JSON,
non-object JSON bodies, unsupported fields, and non-JSON content types.

Supported HTTP body fields:

- `candidate_id`
- `action`
- `reviewed_by`
- `review_note`
- `reviewed_at`
- `replacement_candidate_id`
- `superseded_by_candidate_id`

The route does not accept `db` or `now`. It delegates validation and DB writes
to the shared lifecycle core.

HTTP status mapping:

- `updated` -> HTTP 200
- `invalid_input` -> HTTP 400
- `not_found` -> HTTP 404
- `invalid_transition` -> HTTP 409
- `replacement_not_found` -> HTTP 404
- `db_error` -> HTTP 500

## Authority Boundary

The authority boundary sets `reconciliation_candidate_lifecycle_updated: true`
and `reconciliation_candidate_updated: true` only on successful lifecycle
updates. In all cases:

- `review_metadata_only: true`
- `reconciliation_candidate_created: false`
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

## Non-Goals

- No proof/evidence recording.
- No proof/evidence record creation.
- No session binding.
- No Codex execution or continuation.
- No work item creation.
- No work event creation.
- No imported context mutation.
- No confirmed mapping mutation.
- No proposal mutation.
- No replacement candidate row update.
- No schema or migration.
- No ChatGPT App cards.
- No MCP/App tool schema changes.
- No bridge tools.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, or indexedDB.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-read
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-route
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-writer
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-db-schema
npm run smoke:ag-work-resume-proof-evidence-reconciliation-design
npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design
git diff --check
git diff --cached --check
node --check scripts/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route.mjs
```
