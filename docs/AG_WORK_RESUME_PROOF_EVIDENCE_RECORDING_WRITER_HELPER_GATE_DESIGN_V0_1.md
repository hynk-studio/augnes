# AG Resume Proof/Evidence Recording Writer/Helper Gate Design v0.1

## Status

This document is design-only. It defines the future writer/helper gate for
turning one reviewed AG Resume reconciliation candidate into one local
verification evidence row plus one bridge link row after separate user/Core
approval for the exact attempt.

This design adds no runtime behavior, no schema or migration, no writer/helper
implementation, no route, no UI, no browser surface, no proof/evidence
recording, no bridge rows, no `verification_evidence_records` row creation, no
`action_records` row creation, no session binding, no Codex execution or
continuation, no work item/event creation, no imported context mutation, no
confirmed mapping mutation, no proposal mutation, no reconciliation candidate
mutation, no approval, publish, retry, replay, merge, auto-merge, external
posting, or committed-state authority.

`accepted_for_future_recording` is not proof/evidence recording. Writer/helper gate design is not approval to record. A future writer/helper implementation PR is not blanket approval to record. Actual recording remains separately user/Core gated per exact attempt. The bridge table is not proof/evidence recording by itself.

## Larger Goal

The larger AG Resume cross-local continuity goal is to make foreign review
metadata recoverable without confusing it for local Augnes proof, evidence,
session, execution, or approval authority.

The review-metadata pipeline can now import bounded foreign summaries, confirm
local mappings, create imported context review rows, and review reconciliation
candidates. The next future gate is the smallest local recording path that can
turn one explicitly accepted and separately approved candidate into local
verification evidence while preserving provenance, idempotency, rollback, and
authority boundaries.

## Writer/Helper Purpose

The future writer/helper should be a local transaction boundary for one
approved recording attempt. Its purpose is to:

- re-read and validate one accepted reconciliation candidate
- re-derive the source imported context and confirmed mapping ids
- validate exact user/Core approval for this attempt
- validate actor, reason, redaction, trust/provenance, and idempotency inputs
- insert exactly one `verification_evidence_records` row
- insert exactly one `ag_work_resume_proof_evidence_recording_links` row
- return a bounded JSON result that proves whether a new write happened

It must not be a route, UI control, browser report, session binder, Codex
continuation helper, approval helper, publish helper, retry helper, replay
helper, merge helper, imported-context mutator, confirmed-mapping mutator,
proposal mutator, reconciliation-candidate mutator, work item/event creator, or
action-record writer.

## Future Helper Naming Recommendation

Future helper name recommendation only:

```text
createAgWorkResumeProofEvidenceRecordingFromCandidate
```

Future local script recommendation only:

```text
scripts/ag-work-resume-proof-evidence-recording-create.mjs
```

Those names are future recommendations, not implementation in this PR. This
design does not add either file, function, export, package script, route, or UI
surface.

## Non-Authority Statement

The future helper may write only after exact user/Core authorization is supplied
for one attempt. It must not infer authorization from:

- `accepted_for_future_recording`
- a bridge table existing in `lib/db/schema.sql`
- a merged design PR
- a merged writer/helper implementation PR
- a route returning `ok`
- a smoke passing
- a PR being open, ready, merged, or reviewed
- Codex, ChatGPT, Browser, MCP, session, or GitHub context

The future writer/helper implementation PR may add code, but it must still
require per-attempt user/Core approval at runtime before any row is inserted.

## Canonical Input Contract

The future helper takes `candidate_id` as canonical input. It may accept
`import_id` and `mapping_id` only as optional cross-checks.

Required input:

| Field | Requirement |
| --- | --- |
| `candidate_id` | Required canonical reconciliation candidate id. |
| `user_core_approval` | Required exact approval payload for this attempt. |
| `actor` | Required explicit user/Core actor; must not be inferred from Codex or session. |
| `reason` | Required bounded recording reason. |
| `redaction_summary` | Required public-safe JSON object. |
| `trust_provenance_label` | Required allowlisted trust/provenance label. |
| `local_target_scope` | Required expected local target scope, cross-checked against candidate and mapping. |
| `local_target_work_id` | Required expected local target work id, cross-checked against candidate and mapping. |

Optional cross-check input:

| Field | Requirement |
| --- | --- |
| `import_id` | Optional; if supplied, must match the candidate-derived source import id. |
| `mapping_id` | Optional; if supplied, must match the candidate-derived confirmed mapping id. |
| `expected_idempotency_key` | Optional outside the approval payload; if supplied, must match the helper-derived key and approval payload. |

The helper must re-derive `import_id` and `mapping_id` from the candidate and
cross-check them when supplied. A supplied mismatch fails closed before any
write.

## User/Core Approval Payload

The future approval payload must be exact enough that a reviewer can see what
will be written before the helper writes anything.

Required approval payload shape:

```json
{
  "approval_kind": "ag_work_resume_actual_proof_evidence_recording",
  "approval_schema": "augnes.ag_work_resume.actual_proof_evidence_recording.approval.v0_1",
  "approved_candidate_id": "<candidate_id>",
  "approved_import_id": "<candidate-derived import_id>",
  "approved_mapping_id": "<candidate-derived mapping_id>",
  "approved_local_target_scope": "<local_target_scope>",
  "approved_local_target_work_id": "<local_target_work_id>",
  "approved_target_record_kind": "verification_evidence",
  "approved_idempotency_key": "<helper-derived canonical key>",
  "approved_actor": "<user/Core actor>",
  "approved_reason": "<bounded reason>",
  "approved_redaction_summary": {},
  "approved_trust_provenance_label": "foreign_summary_user_core_attested",
  "approved_side_effects": {
    "insert_tables": [
      "verification_evidence_records",
      "ag_work_resume_proof_evidence_recording_links"
    ],
    "forbidden_tables": [
      "action_records",
      "sessions",
      "work_items",
      "work_events",
      "ag_work_resume_imported_contexts",
      "ag_work_resume_confirmed_mappings",
      "ag_work_resume_mapping_proposals",
      "ag_work_resume_proof_evidence_reconciliation_candidates"
    ]
  }
}
```

The helper should derive the canonical idempotency key from re-read source rows,
then require the approval payload to include or attest to that exact key. If
the approval payload lacks the expected key or approves a different key, the
helper fails closed. This prevents approval for one candidate/target from being
reused for another.

## Idempotency Key

The canonical key for the first implementation should be:

```text
actual-proof-evidence-recording:v0_1:<candidate_id>:<import_id>:<mapping_id>:<foreign_ref_type>:<foreign_ref_id>:<local_scope>:<local_work_id>:verification_evidence
```

The key is not retry, replay, publish, merge, or approval authority. It is only
local duplicate-write protection for the exact approved attempt.

## Output Contract

The future helper should return one JSON object with no raw imported payloads
and no secrets.

Success with new write:

```json
{
  "ok": true,
  "result": "recorded",
  "created": true,
  "candidate_id": "<candidate_id>",
  "evidence_id": "<new evidence id>",
  "recording_link_id": "<new bridge link id>",
  "idempotency_key": "<canonical key>",
  "target_record_kind": "verification_evidence"
}
```

Idempotent no-new-write:

```json
{
  "ok": true,
  "result": "idempotent_no_new_write",
  "created": false,
  "candidate_id": "<candidate_id>",
  "evidence_id": "<existing evidence id>",
  "recording_link_id": "<existing bridge link id>",
  "idempotency_key": "<canonical key>",
  "target_record_kind": "verification_evidence"
}
```

Failure responses must be fail-closed and must create no partial write. The
recommended `result` values are:

| Result | Meaning |
| --- | --- |
| `unauthorized_attempt` | Exact user/Core approval is missing, stale, or mismatched. |
| `invalid_candidate` | Candidate is missing or not in `accepted_for_future_recording`. |
| `source_cross_check_failed` | Supplied `import_id` or `mapping_id` does not match the candidate-derived row. |
| `missing_source_rows` | Candidate, imported context, confirmed mapping, or local target work row is missing. |
| `unsafe_redaction` | Redaction summary or source redaction status is unsafe or unknown. |
| `invalid_actor_reason` | Actor or reason is missing, inferred, too broad, or unbounded. |
| `invalid_trust_provenance` | Trust/provenance label is missing or outside the allowlist. |
| `duplicate_conflict` | Same key with different payload, or same candidate with different key. |
| `fk_or_unique_failure` | Database FK or unique constraint failed and the transaction rolled back. |

Every failure result must include `created: false`, must not include fabricated
row ids, and must state `partial_write: false` only after the transaction
rollback is confirmed.

## Required Preconditions

The future helper must fail closed unless all of these are true:

- exact user/Core approval is present for this attempt
- source candidate exists
- candidate lifecycle state is `accepted_for_future_recording`
- `accepted_for_future_recording` is treated as necessary but not sufficient
- source imported context exists
- source confirmed mapping exists
- optional supplied `import_id` and `mapping_id` match re-derived values
- local target scope and work id match candidate, imported context, and mapping
- local target work row exists if `verification_evidence_records.work_id` is set
- actor is explicit
- reason is explicit and bounded
- redaction summary is a safe JSON object
- trust/provenance label is allowlisted
- idempotency key is derived and approved exactly
- bridge table schema exists
- side-effect boundary is enforced

No precondition may be satisfied by route success, PR state, smoke state,
session context, Codex context, or ChatGPT context alone.

## Candidate, Imported Context, And Mapping Re-Read Validation

The future helper must re-read source rows at recording time, preferably inside
the same local transaction that inserts the evidence and bridge rows.

Candidate validation:

- `candidate_id` exists
- lifecycle state is `accepted_for_future_recording`
- candidate references one source `import_id`
- candidate references or derives one source `mapping_id`
- candidate foreign ref type/id are bounded metadata
- candidate local target scope/work id are explicit
- candidate row is not mutated

Imported context validation:

- `import_id` exists and matches the candidate-derived id
- imported context still describes bounded review metadata
- imported context redaction state is safe
- imported context does not include raw secrets, raw DB paths, raw session
  payloads, raw proof payloads, raw evidence payloads, raw command output, or
  raw foreign database rows in the recording payload
- imported context row is not mutated

Confirmed mapping validation:

- `mapping_id` exists and matches the candidate-derived id
- mapping connects the candidate foreign work identity to the intended local
  target work identity
- mapping status is active or otherwise allowed by a separately approved policy
- mapping row is not mutated

## Evidence Target Shape

The first future implementation may insert only one
`verification_evidence_records` row. It must not insert an `action_records`
row.

Recommended evidence row shape:

| Column | First implementation value |
| --- | --- |
| `evidence_id` | New local id generated by the helper. |
| `scope` | Approved local target scope. |
| `work_id` | Approved local target work id; no work item is created. |
| `publication_id` | `NULL`. |
| `delivery_id` | `NULL`. |
| `target_surface` | `ag_work_resume`. |
| `target_ref` | `candidate:<candidate_id>`. |
| `evidence_kind` | Existing allowlisted value, recommended `check_passed` for the gate-validation recording. |
| `label` | Bounded label naming AG Resume proof/evidence recording from candidate metadata. |
| `status` | Existing allowlisted value, recommended `passed`. |
| `command` | `NULL`; this is not command output recording. |
| `result_summary` | Bounded public-safe summary of the approved recording. |
| `skipped_reason` | `NULL`. |
| `observed_behavior` | Public-safe summary, not raw foreign payload. |
| `source_surface` | `ag_work_resume_proof_evidence_recording_writer_helper`. |
| `source_ref` | `candidate:<candidate_id>`. |
| `related_action_id` | `NULL`; action records are out of first implementation scope. |
| `related_work_event_id` | `NULL`; work events are out of first implementation scope. |
| `metadata` | JSON object described below. |
| `created_by` | Explicit user/Core actor. |

The evidence row must not store raw foreign proof payloads, raw evidence
payloads, raw session payloads, raw DB paths, tokens, keys, cookies, private
local absolute paths, or unredacted command output.

## `verification_evidence_records.metadata` Shape

Recommended metadata JSON object:

```json
{
  "schema": "augnes.ag_work_resume.actual_proof_evidence_recording.metadata.v0_1",
  "recording_kind": "ag_work_resume_candidate_to_verification_evidence",
  "candidate_id": "<candidate_id>",
  "import_id": "<import_id>",
  "mapping_id": "<mapping_id>",
  "foreign_ref_type": "<foreign_ref_type>",
  "foreign_ref_id": "<foreign_ref_id>",
  "local_target_scope": "<local_target_scope>",
  "local_target_work_id": "<local_target_work_id>",
  "target_record_kind": "verification_evidence",
  "idempotency_key": "<canonical key>",
  "recording_link_id": "<bridge link id>",
  "actor": "<user/Core actor>",
  "reason": "<bounded reason>",
  "redaction_summary": {},
  "trust_provenance_label": "foreign_summary_user_core_attested",
  "source_material_policy": "bounded_foreign_summary_only",
  "accepted_for_future_recording_is_recording": false,
  "bridge_table_is_recording_by_itself": false,
  "action_records_created": false,
  "session_binding_created": false,
  "codex_continuation_started": false
}
```

Metadata may mirror bridge fields for read-surface clarity, but the bridge row
is the canonical structured linkage and idempotency record.

## Bridge Row Shape

The first future implementation may insert only one
`ag_work_resume_proof_evidence_recording_links` row in the same transaction as
the evidence row.

Required bridge row shape:

| Column | First implementation value |
| --- | --- |
| `recording_link_id` | New local bridge link id generated by the helper. |
| `record_kind` | `ag_work_resume_proof_evidence_recording_link`. |
| `schema` | `augnes.ag_work_resume_proof_evidence_recording_link.v0_1`. |
| `candidate_id` | Re-read candidate id. |
| `import_id` | Candidate-derived source import id. |
| `mapping_id` | Candidate-derived confirmed mapping id. |
| `local_target_scope` | Approved local target scope. |
| `local_target_work_id` | Approved local target work id. |
| `target_record_kind` | `verification_evidence`. |
| `target_evidence_id` | Evidence id created in the same transaction. |
| `target_action_id` | `NULL`. |
| `idempotency_key` | Helper-derived and approval-attested canonical key. |
| `actor` | Explicit user/Core actor. |
| `reason` | Bounded reason. |
| `redaction_summary` | Public-safe JSON object. |
| `trust_provenance_label` | `foreign_summary_user_core_attested` for the first implementation. |
| `provenance_json` | JSON object described below. |
| `recording_status` | `recorded`. |
| `failure_reason` | `NULL`. |

The bridge row is not a pending placeholder. It exists only after the evidence
row exists in the same committed transaction.

## `provenance_json` Shape

Recommended bridge `provenance_json`:

```json
{
  "schema": "augnes.ag_work_resume.proof_evidence_recording.provenance.v0_1",
  "source": {
    "candidate_id": "<candidate_id>",
    "import_id": "<import_id>",
    "mapping_id": "<mapping_id>",
    "foreign_ref_type": "<foreign_ref_type>",
    "foreign_ref_id": "<foreign_ref_id>",
    "source_runtime_instance_id": "<bounded source runtime id or null>",
    "packet_id": "<packet id or null>",
    "packet_hash": "<packet hash or null>"
  },
  "target": {
    "local_target_scope": "<local_target_scope>",
    "local_target_work_id": "<local_target_work_id>",
    "target_record_kind": "verification_evidence",
    "target_evidence_id": "<evidence id>",
    "target_action_id": null
  },
  "approval": {
    "actor": "<user/Core actor>",
    "reason": "<bounded reason>",
    "approved_idempotency_key": "<canonical key>"
  },
  "redaction": {
    "summary": {},
    "raw_foreign_payload_copied": false
  },
  "trust": {
    "trust_provenance_label": "foreign_summary_user_core_attested",
    "foreign_refs_remain_foreign": true
  },
  "side_effects": {
    "allowed_insert_tables": [
      "verification_evidence_records",
      "ag_work_resume_proof_evidence_recording_links"
    ],
    "action_records_created": false,
    "session_binding_created": false,
    "work_item_event_created": false,
    "candidate_mutated": false,
    "imported_context_mutated": false,
    "confirmed_mapping_mutated": false,
    "proposal_mutated": false
  }
}
```

The duplicated fields between evidence metadata and bridge `provenance_json`
are intentional: `candidate_id`, `import_id`, `mapping_id`, foreign ref
type/id, local target scope/work id, target kind/id, idempotency key, actor,
reason, redaction summary, and trust/provenance label. The bridge row remains
canonical for linkage and idempotency; evidence metadata remains optimized for
evidence read surfaces.

## Transaction Boundaries

The future helper must use one local database transaction for the validating
re-read and the two inserts.

Required transaction order:

1. Begin transaction.
2. Re-read candidate, imported context, confirmed mapping, and local target
   work identity.
3. Derive `import_id`, `mapping_id`, local target, foreign ref, and canonical
   idempotency key.
4. Validate exact user/Core approval payload.
5. Check for existing bridge row by idempotency key and candidate id.
6. If same key and same payload already exist, return idempotent no-new-write.
7. Insert one `verification_evidence_records` row.
8. Insert one `ag_work_resume_proof_evidence_recording_links` row.
9. Commit transaction.

If any step fails after transaction start, the transaction must roll back. A
failed attempt must leave no evidence row, no bridge row, no action record, no
work event, no session binding, and no source-row mutation.

The helper must not call external services inside the transaction. It must not
publish, retry, replay, merge, auto-merge, execute Codex, bind a session, or
create work items/events before, during, or after the transaction.

## Idempotency And Duplicate Behavior

The future helper must enforce these behaviors:

- Same key with same payload may return an idempotent no-new-write response.
- Same key with different payload must fail closed with `duplicate_conflict`.
- Same candidate with a different key must fail closed with `duplicate_conflict`.
- Same target evidence id must never be reused for another bridge row.
- Same target action id is not allowed because `target_action_id` must be
  `NULL` in the first implementation.
- A failed attempt must not leave a bridge placeholder that blocks a later safe
  attempt.

The unique `candidate_id`, `idempotency_key`, and `target_evidence_id`
constraints in the bridge table are the database backstop. The helper must
validate duplicates before insert and still map unique constraint failures to a
closed result after rollback.

## Actor, Reason, Redaction, Trust, And Provenance Validation

Actor validation:

- required
- non-empty
- user/Core explicit
- not inferred from session, Codex, ChatGPT, Browser, MCP, GitHub, branch, or
  PR metadata

Reason validation:

- required
- bounded text
- names the candidate, source imported context, confirmed mapping, foreign ref,
  local target work, and why recording is safe

Redaction validation:

- required JSON object
- must say raw foreign payloads are not copied
- must fail closed for secrets, raw DB paths, raw session payloads, raw proof
  payloads, raw evidence payloads, credentials, tokens, keys, cookies, private
  local absolute paths, and unredacted command output

Trust/provenance validation:

- required allowlisted label
- first implementation label is `foreign_summary_user_core_attested`
- trust label is metadata, not approval
- foreign refs remain foreign even after a local evidence row is created

## Local Target Scope And Work Validation

The helper must validate local target scope and work id from three sources:

- candidate review metadata
- confirmed mapping
- exact user/Core approval payload

The three values must match. If the target `work_id` is set on the evidence
row, the referenced local `work_items(scope, work_id)` row must already exist.
The helper must not create a work item to satisfy that foreign key. Missing
local target work fails closed with `missing_source_rows` or a more specific
future result name.

## Rollback, Failure, And No Partial Write Policy

Failure is local and mechanical:

- validation failure occurs before inserts when possible
- database failure rolls back the full transaction
- FK or unique failure returns a fail-closed result after rollback
- no failure row is inserted in the first implementation
- no bridge placeholder row is inserted
- no evidence row survives without its bridge row
- no bridge row survives without its evidence row

If a future PR wants durable failure audit rows, that requires a separate
design because failure audit could itself become durable local state.

## Protected Side-Effect Boundary

The exact allowed insert tables for the first implementation are:

- `verification_evidence_records`
- `ag_work_resume_proof_evidence_recording_links`

The future implementation must not insert, update, or delete rows in:

- `action_records`
- `sessions`
- session binding tables
- `work_items`
- `work_events`
- `ag_work_resume_imported_contexts`
- `ag_work_resume_confirmed_mappings`
- `ag_work_resume_mapping_proposals`
- `ag_work_resume_proof_evidence_reconciliation_candidates`
- approval, publication, delivery, retry, replay, merge, auto-merge, external
  posting, or committed-state tables

It must not add or call route/helper/UI paths that grant approval, publish,
retry, replay, merge, auto-merge, external posting, session binding, Codex
continuation, Direct Resume Code, or relay/hosted transfer authority.

## Future Route, Helper, UI, And CLI Sequence

Later PRs should proceed in this order:

1. This writer/helper gate design PR.
2. Writer/helper implementation PR with local direct helper tests and smoke.
3. Local CLI/script boundary PR only if it remains a thin explicit caller for
   the helper and does not create new authority.
4. Read-surface PR showing evidence/bridge links without candidate mutation.
5. Route gate design PR, tracked in
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md`,
   then route implementation PR, only after helper behavior is proven.
6. UI design PR, then UI implementation PR, only after route behavior is
   approved.

The future local script boundary must require explicit inputs and approval
payload. It must print one JSON result, must not start servers, must not open
Browser, must not bind sessions, must not continue Codex, and must not create a
package script that runs recording without explicit per-attempt arguments.

The proof/evidence recording route invocation gate is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md`.
It is design-only and does not add route implementation, UI/Cockpit controls,
schema/migration, writer/helper changes, bridge rows, verification evidence
rows, action records, or approval/publish/retry/replay/merge authority.

## Smoke Expectations

This design PR should include a smoke guard that verifies:

- writer/helper gate design doc exists
- design-only boundary exists
- recommended helper/script names are mentioned only as future recommendations
- `accepted_for_future_recording` is not proof/evidence recording
- actual recording remains per-attempt user/Core gated
- future implementation allowed inserts are exactly one verification evidence
  row plus one bridge row
- `action_records` out of first implementation scope
- route/UI out of scope
- session binding and Codex continuation remain out of scope
- approval/publish/retry/replay/merge remains out of scope
- no runtime/schema/migration/writer/helper/route/UI/browser files changed

## Browser And DB Proof Expectations For Later Implementation PRs

A future implementation PR must include DB proof that:

- one approved attempt creates exactly one `verification_evidence_records` row
- one approved attempt creates exactly one
  `ag_work_resume_proof_evidence_recording_links` row
- both rows are created in one transaction
- idempotent no-new-write creates no extra rows
- duplicate conflicts create no extra rows
- invalid candidate creates no rows
- unsafe redaction creates no rows
- missing source rows create no rows
- FK/unique failures create no rows after rollback
- `action_records` row count does not change
- session row/binding count does not change
- work item/event row count does not change
- imported context rows are not mutated
- confirmed mapping rows are not mutated
- proposal rows are not mutated
- reconciliation candidate rows are not mutated

Browser verification is not applicable to this design-only PR and is required
only for a later UI/Cockpit/browser surface PR.

## Authority Boundary

This writer/helper gate design grants:

- no runtime behavior
- no schema or migration
- no writer/helper implementation
- no route/UI
- no proof/evidence recording
- no bridge rows created
- no `verification_evidence_records` row creation
- no `action_records` row creation
- no session binding
- no Codex execution or continuation
- no work item/event creation
- no imported context mutation
- no confirmed mapping mutation
- no proposal mutation
- no reconciliation candidate mutation
- no approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state authority

Actual recording remains separately user/Core gated per exact attempt.

## What This Enables Next

This design enables a future implementation PR to build the local helper
contract for exactly one evidence row and one bridge row, with strict
idempotency, source validation, redaction, provenance, and rollback behavior.

It does not authorize that implementation PR to record by default. The runtime
helper must still require exact user/Core approval for each actual recording
attempt.

The proof/evidence recording Cockpit/UI invocation gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md`.
It is design-only and does not add UI/Cockpit implementation, route changes,
writer/helper behavior changes, schema/migration, proof/evidence recording,
bridge rows, verification evidence rows, action records, or broader recording
authority.

## What This Does Not Solve

This design does not solve:

- actual proof/evidence recording
- evidence row creation
- bridge row creation
- action-record proof creation
- session binding
- Codex continuation
- route behavior
- UI behavior
- read-surface behavior
- work item/event creation
- imported context mutation
- confirmed mapping mutation
- proposal mutation
- reconciliation candidate mutation
- approval/publish/retry/replay/merge authority
- auto-merge authority
- external posting
- committed-state mutation
- Direct Resume Code
- relay/hosted transfer

## Browser Verification

Browser verification skipped: no runtime/UI/Cockpit/browser files are changed
by this design-only writer/helper gate PR.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-proof-evidence-recording-writer-helper-gate-design
npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema
npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-migration-policy
npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema-design
npm run smoke:ag-work-resume-proof-evidence-recording-schema-integration-policy
npm run smoke:ag-work-resume-actual-proof-evidence-recording-gate-design
npm run smoke:ag-work-resume-review-metadata-closeout
npm run smoke:ag-work-resume-mapping-import-authority-gate
npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-design
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel
node --check scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper-gate-design.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-migration-policy.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema-design.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-recording-schema-integration-policy.mjs
node --check scripts/smoke-ag-work-resume-actual-proof-evidence-recording-gate-design.mjs
node --check scripts/smoke-ag-work-resume-review-metadata-closeout.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs
git diff --check
git diff --cached --check
```
