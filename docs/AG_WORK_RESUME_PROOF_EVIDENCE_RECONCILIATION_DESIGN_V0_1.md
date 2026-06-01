# AG Work Resume Proof Evidence Reconciliation Design v0.1

## Status

This document is design-only. It defines a future proof/evidence
reconciliation contract for reviewing imported context foreign refs after the
AG Resume proof/evidence/session/Codex gate design.

This document adds no runtime behavior. It adds no schema or migration. It
adds no writer, helper, route, or UI. It creates no proof/evidence records,
no reconciliation candidate records, no session records, no Codex records, no
work items, and no work events.

This design adds no proof/evidence writer, no proof/evidence schema, no
session binding, no Codex behavior, no app/api changes, no components changes,
no lib runtime changes, no `lib/db/schema.sql` changes, no migrations, no
ChatGPT App/MCP/App schema changes, no bridge tools, no Direct Resume Code,
no relay, no telemetry/analytics/browser persistence, and no browser report.

This design grants no session authority, no Codex authority, no approval,
publish, retry, replay, merge, auto-merge, external posting, or committed-state
mutation authority. Durable approval remains user/Core gated.

## Purpose

Imported context foreign refs need reconciliation before they can become local
proof/evidence because they originate outside the local Augnes proof and
evidence ledgers. A foreign proof ref or foreign evidence ref may be useful
review context, but it is not a local proof record, not a local evidence
record, not work authority, and not committed state authority.

Imported context is review metadata only. Its `foreign_refs_summary` may
describe foreign proof, evidence, action, session, Git, evidence-pack, or
handoff refs as bounded summaries for local review. That summary does not
import raw payloads and does not create local proof/evidence.

The future candidate DB/schema contract is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`.
It preserves reconciliation candidates as review metadata only and adds no
schema implementation, migration, runtime behavior, writer/helper/route/UI,
proof/evidence recording, session binding, Codex behavior, approval, publish,
retry, replay, or merge authority.

The candidate DB/schema implementation is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md`.
It creates only the future candidate table and indexes. It creates no rows in
normal migration and adds no writer/helper/route/UI, proof/evidence recording,
session binding, Codex behavior, approval, publish, retry, replay, or merge
authority.

The candidate writer/helper is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md`.
It creates one proposed candidate review metadata row from an imported context
and bounded foreign ref summary, while adding no route/UI, proof/evidence
recording, session binding, Codex behavior, work item/event creation, imported
context/confirmed mapping/proposal mutation, approval, publish, retry, replay,
or merge authority.

The candidate create route is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md`.
It delegates to the writer core and creates reconciliation candidate review
metadata rows only, with no Cockpit UI, schema/migration, proof/evidence
recording, session binding, Codex behavior, work item/event creation, imported
context/confirmed mapping/proposal mutation, approval, publish, retry, replay,
or merge authority.

The candidate read helper/GET route is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md`.
It lists or fetches candidate review metadata only, preserves the existing
POST create route, and does not record proof/evidence, bind sessions, execute
Codex, create work items/events, mutate imported contexts, confirmed mappings,
or proposals, or grant approval, publish, retry, replay, or merge authority.

The candidate read-only Cockpit Operator panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md`.
It calls only the existing GET route and renders candidate review metadata;
it adds no create/update/delete, lifecycle, proof/evidence/session, Codex,
work item/event creation, imported context/confirmed mapping/proposal
mutation, schema/migration, approval, publish, retry, replay, or merge
authority.

The candidate bounded Cockpit Operator create panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md`.
It calls only the existing POST route to create candidate review metadata and
adds no update/delete, lifecycle, proof/evidence/session, Codex, work
item/event creation, imported context/confirmed mapping/proposal mutation,
schema/migration, approval, publish, retry, replay, or merge authority.

The candidate lifecycle action contract is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`.
It updates existing candidate review metadata only.
`accepted_for_future_recording` is not proof/evidence recording, session
binding, Codex continuation, work item/event creation, approval, publish,
retry, replay, or merge authority.

The candidate lifecycle Cockpit panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md`.
It calls only the candidate lifecycle action route and adds no proof/evidence,
session, Codex, work item/event, imported context, confirmed mapping,
proposal, approval, publish, retry, replay, or merge authority.

The actual proof/evidence recording gate is documented in
`docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md`.
It defines future preconditions for turning reviewed candidate metadata into
local proof/evidence records. It is design-only; candidate review and
`accepted_for_future_recording` still do not record proof/evidence.

The proof/evidence recording schema/integration policy is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md`.
It is design-only and recommends a future bridge-table/evidence-first path
without adding schema/migration, writer/helper/route/UI, actual recording,
session binding, Codex continuation, or approval/publish/retry/replay/merge
authority.

The proof/evidence recording bridge-table schema design is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md`.
It is design-only and defines future link-table constraints without adding
schema/migration, modifying `lib/db/schema.sql`, creating evidence/action
records, mutating candidates, binding sessions, continuing Codex, or granting
approval/publish/retry/replay/merge authority.

The proof/evidence recording bridge-table migration/DDL policy is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md`.
It is design-only and defines future DDL/migration expectations without adding
schema/migration, modifying `lib/db/schema.sql`, adding migration files,
creating the bridge table, creating evidence/action records, mutating
candidates, binding sessions, continuing Codex, or granting
approval/publish/retry/replay/merge authority.

The schema-only bridge table implementation adds
`ag_work_resume_proof_evidence_recording_links` to `lib/db/schema.sql` as an
empty table with indexes. It does not record proof/evidence, does not create
evidence/action rows, does not mutate candidates, does not bind sessions, does
not continue Codex, and does not grant approval/publish/retry/replay/merge
authority.

The proof/evidence recording writer/helper gate is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md`.
It is design-only and defines a future helper contract for one separately
approved candidate-to-verification-evidence recording attempt. It does not
implement a writer/helper, route/UI, bridge row creation, verification evidence
row creation, action record creation, candidate mutation, session binding,
Codex continuation, or approval/publish/retry/replay/merge authority.

Foreign refs remain foreign until explicitly reconciled through a separately
approved user/Core gate. Candidate discovery and candidate review can identify
possible future local reconciliation candidates, but no imported context ref is
automatically converted into local proof/evidence.

## Definitions

- **imported context row**: an `ag_work_resume_imported_contexts` row that
  stores bounded review metadata derived from a validated AG Resume packet and
  an active confirmed mapping.
- **foreign proof ref**: a proof/action reference from a source runtime,
  packet, handoff, or foreign review context. It remains foreign until an
  explicit reconciliation decision authorizes future local handling.
- **foreign evidence ref**: an evidence or evidence-pack reference from a
  source runtime, packet, handoff, or foreign review context. It remains
  foreign until an explicit reconciliation decision authorizes future local
  handling.
- **local proof record**: a local Augnes proof/action record created only by a
  separately authorized proof path. This design does not create local proof
  records.
- **local evidence record**: a local Augnes verification evidence row created
  only by a separately authorized evidence path. This design does not create
  local evidence records.
- **reconciliation candidate**: a future review-only object that identifies one
  bounded foreign ref summary that could be reviewed for possible future local
  proof/evidence recording.
- **reconciliation decision**: a future explicit user/Core decision to accept,
  reject, or defer a reconciliation candidate under a separately approved gate.
  This design does not implement that decision.
- **actor/reason**: the explicit user/Core actor and written reason required
  before any future candidate proposal, reconciliation decision, or actual
  proof/evidence recording.
- **redaction report**: metadata showing whether secrets, raw DB paths, raw
  session payloads, and raw proof payloads were excluded.
- **review-only summary**: bounded descriptive metadata that may help review a
  foreign ref without becoming a local proof/evidence payload.
- **proof/evidence authority boundary**: the explicit statement that candidate
  discovery and review do not record proof/evidence, bind sessions, execute
  Codex, create work items/events, or grant approval, publish, retry, replay,
  or merge authority.

## Reconciliation Model

Candidate discovery is read-only. It may inspect an imported context row and
its bounded `foreign_refs_summary` to identify possible reconciliation
candidates for human review in a future design, but discovery does not create
proof/evidence records.

Candidate review does not create proof/evidence. A reviewer may compare a
foreign ref summary to a confirmed local work identity, redaction report, and
expected files/checks, but the review remains metadata until a separate
user/Core gate authorizes any future write.

An explicit user/Core reconciliation decision is required before a candidate
can move beyond review metadata. That future decision must name the actor,
reason, source imported context, foreign ref identity, local target work
identity, redaction status, allowed side effects, and failure behavior.

Future local proof/evidence creation remains separately authorized. Even an
accepted reconciliation decision would not automatically create local proof or
evidence unless a later proof/evidence recording design and implementation
explicitly authorizes that write.

Rejected candidates remain review metadata only. Rejection must not mutate the
imported context row, confirmed mapping, proposal, local work item, proof
ledger, evidence ledger, session state, or Codex state unless a separate
future design explicitly authorizes such mutation.

There is no automatic conversion from imported context refs. Imported context
foreign refs remain foreign until explicitly reconciled, and reconciliation
candidate review remains separate from actual local proof/evidence recording.

## Required Future Checks

Before any future proof/evidence reconciliation implementation is approved, the
design must require:

- imported context exists
- imported context status is allowed for reconciliation
- redaction report is safe
- foreign refs are bounded summaries, not raw payloads
- local target work identity is confirmed
- actor is required
- reason is required
- no raw secrets
- no raw DB paths
- no raw session payloads
- no raw proof payloads
- no session binding
- no Codex execution
- no merge, publish, retry, or replay authority

## Future Non-Implemented Record Shape

The following reconciliation candidate shape is design-only. It is not a
schema, migration, runtime model, writer contract, helper contract, route
contract, UI contract, or proof/evidence recording contract in this PR.

```json
{
  "candidate_id": "ag-resume-proof-evidence-reconciliation-candidate:example",
  "import_id": "ag-resume-imported-context:example",
  "foreign_ref_type": "proof",
  "foreign_ref_id": "foreign-proof:example",
  "local_target_scope": "project:augnes",
  "local_target_work_id": "AG-LOCAL-1",
  "summary": "Bounded review-only summary of the foreign proof/evidence ref.",
  "redaction_status": {
    "safe": true,
    "secrets_included": false,
    "raw_db_paths_included": false,
    "session_payloads_included": false,
    "proof_payloads_included": false
  },
  "proposed_by": "user-core:reviewer",
  "proposed_reason": "Review this bounded foreign ref as a possible future local proof/evidence candidate.",
  "authority_boundary": {
    "review_metadata_only": true,
    "proof_recorded": false,
    "evidence_recorded": false,
    "session_bound": false,
    "codex_executed": false,
    "work_item_created": false,
    "work_event_created": false,
    "approval_granted": false,
    "publish_retry_replay_authority": false,
    "merge_authority": false,
    "durable_approval": "user/Core gated"
  }
}
```

`candidate_id` is not a proof id, not an evidence id, not an imported context
id, not a work id, and not approval. `import_id` traces the candidate back to
review metadata only. `foreign_ref_type` and `foreign_ref_id` identify a
foreign summary for review, not a local record to trust automatically.

## Authority Boundary

This design grants:

- no proof/evidence recording
- no session binding
- no Codex execution
- no work item creation
- no work event creation
- no confirmed mapping mutation
- no proposal mutation
- no imported context mutation
- no approval, publish, retry, replay, merge, auto-merge, or external posting
- no committed state authority

Durable approval remains user/Core gated. Imported context foreign refs remain
foreign until explicitly reconciled. A reconciliation candidate is review
metadata only and is not proof/evidence authority.

## Non-Goals

- No schema or migration.
- No writer, helper, route, or UI.
- No proof/evidence implementation.
- No proof/evidence writer.
- No proof/evidence schema.
- No session implementation.
- No session binding.
- No Codex implementation.
- No Codex behavior.
- No ChatGPT App, MCP/App schema, or bridge tool changes.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, indexedDB, or browser
  persistence.
- No browser report.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Future PR Sequence

1. Proof/evidence reconciliation design only: this PR.
2. Reconciliation candidate DB/schema design:
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`.
3. Reconciliation candidate DB/schema implementation:
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md`.
4. Reconciliation candidate writer/helper:
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md`.
5. Reconciliation candidate create route:
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md`.
6. Proof/evidence actual recording design, separately approved.
7. Session/Codex gates remain separate.

Each future PR must restate that imported context remains review metadata only,
foreign refs remain foreign until explicitly reconciled, actor and reason are
required, and actual local proof/evidence recording is a separate user/Core
authorization.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this design-only proof/evidence reconciliation slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-route
npm run smoke:ag-work-resume-proof-evidence-reconciliation-design
npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design
npm run smoke:ag-work-resume-imported-context-create-cockpit-panel
npm run smoke:ag-work-resume-imported-context-read-cockpit-panel
npm run smoke:ag-work-resume-imported-context-read
npm run smoke:ag-work-resume-imported-context-route
npm run smoke:ag-work-resume-imported-context-writer
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs
```
