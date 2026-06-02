# AG Work Resume Proof Evidence Session Codex Gates Design v0.1

## Status

This document is design-only. It defines a future gate contract after Stage D
AG Resume imported context review metadata.

This document adds no runtime behavior. It adds no schema or migration. It
adds no writer, helper, route, or UI. It creates no proof/evidence records,
no session records or session bindings, no Codex records or actions, no work
items, no work events, and no imported context records.

This design adds no proof/evidence writer, no session binder, no Codex
continuation route/helper/UI, no app/api changes, no components changes, no lib runtime changes, no ChatGPT App/MCP/App schema changes, no bridge tools,
no Direct Resume Code, no relay, no telemetry/analytics/browser persistence,
and no browser report.

This design grants no approval, publish, retry, replay, merge, auto-merge,
external posting, or committed-state mutation authority. Durable approval
remains user/Core gated.

## Purpose

Imported context is bounded review metadata derived from a validated AG Resume
packet and an existing active confirmed mapping. It can help a reviewer see
packet summary material, expected files, expected checks, foreign refs summary,
and redaction metadata, but it must remain review metadata until separately
gated.

Imported context must remain review metadata because it may mention foreign
refs and foreign history that are not local Augnes proof, evidence, sessions,
work events, committed state, or Codex authority. A stored imported context
row means local review metadata exists. It does not mean proof/evidence was
reconciled, a session was bound, Codex may continue, or durable approval was
granted.

Proof/evidence reconciliation, session binding, and Codex continuation are
distinct future gates. Each gate needs its own design, explicit authorization,
actor, reason, validation, side-effect boundary, and verification. No gate
implies the next gate.

The first design-only proof/evidence reconciliation contract is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`. It
describes future review of imported context foreign refs as reconciliation
candidates only; it adds no runtime behavior, schema/migration,
writer/helper/route/UI, proof/evidence recording, session binding, Codex
behavior, approval, publish, retry, replay, or merge authority.

The future reconciliation candidate DB/schema contract is design-only in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`.
It documents possible future candidate table shape and indexes only, with no
schema/migration implementation and no downstream proof/evidence/session/Codex
authority.

The reconciliation candidate DB/schema implementation is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md`.
It creates only the future candidate table and indexes, creates no rows during
normal migration, and adds no writer/helper/route/UI, proof/evidence
recording, session binding, Codex behavior, approval, publish, retry, replay,
or merge authority.

The reconciliation candidate writer/helper is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md`.
It creates one proposed candidate review metadata row only. It does not record
proof/evidence, bind sessions, execute Codex, create work items/events, mutate
imported contexts, confirmed mappings, or proposals, add routes/UI, or grant
approval, publish, retry, replay, or merge authority.

The reconciliation candidate create route is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md`.
It delegates to the writer core and creates reconciliation candidate review
metadata rows only. It adds no Cockpit UI, schema/migration, proof/evidence
recording, session binding, Codex behavior, work item/event creation, imported
context/confirmed mapping/proposal mutation, approval, publish, retry, replay,
or merge authority.

The reconciliation candidate read helper/GET route is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md`.
It reads reconciliation candidate review metadata only and does not record
proof/evidence, bind sessions, execute Codex, create work items/events, mutate
imported contexts, confirmed mappings, or proposals, or grant approval,
publish, retry, replay, or merge authority.

The reconciliation candidate read-only Cockpit Operator panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md`.
It calls only the existing GET route and adds no create/update/delete,
lifecycle, proof/evidence/session, Codex, work item/event creation, imported
context/confirmed mapping/proposal mutation, schema/migration, approval,
publish, retry, replay, or merge authority.

The reconciliation candidate bounded Cockpit Operator create panel is
documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md`.
It calls only the existing POST route to create candidate review metadata and
adds no update/delete, lifecycle, proof/evidence/session, Codex, work
item/event creation, imported context/confirmed mapping/proposal mutation,
schema/migration, approval, publish, retry, replay, or merge authority.

The reconciliation candidate lifecycle action contract is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`.
It updates existing candidate review metadata only.
`accepted_for_future_recording` is not proof/evidence recording, session
binding, Codex continuation, work item/event creation, approval, publish,
retry, replay, or merge authority.

The reconciliation candidate lifecycle Cockpit panel is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md`.
It calls only the lifecycle action route and adds no proof/evidence, session,
Codex, work item/event, imported context, confirmed mapping, proposal,
approval, publish, retry, replay, or merge authority.

The actual proof/evidence recording gate is documented in
`docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md`.
It defines the future explicit gate after review-metadata closeout and
candidate lifecycle review. It is design-only; actual proof/evidence recording
remains unauthorized until a separate implementation PR is explicitly approved
after that design.

The proof/evidence recording schema/integration policy is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md`.
It is design-only and narrows the future integration shape without adding
schema/migration, writer/helper/route/UI, proof/evidence recording, session
binding, Codex continuation, or approval/publish/retry/replay/merge authority.

The proof/evidence recording bridge-table schema design is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md`.
It is design-only and does not add schema/migration, bridge row creation,
verification evidence row creation, action record creation, session binding,
Codex continuation, or approval/publish/retry/replay/merge authority.

The proof/evidence recording bridge-table migration/DDL policy is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md`.
It is design-only and does not add schema/migration, modify `lib/db/schema.sql`,
add migration files, create the bridge table, create bridge/evidence/action
rows, bind sessions, continue Codex, or grant approval/publish/retry/replay/merge
authority.

The schema-only bridge table implementation adds
`ag_work_resume_proof_evidence_recording_links` to `lib/db/schema.sql` as an
empty table with indexes. It does not create bridge/evidence/action rows, bind
sessions, continue Codex, add writer/helper/route/UI behavior, or grant
approval/publish/retry/replay/merge authority.

The proof/evidence recording writer/helper gate is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md`.
It is design-only and defines the future helper contract for one separately
approved candidate-to-evidence recording attempt. It does not implement a
writer/helper, route/UI, bridge row creation, verification evidence row
creation, action record creation, session binding, Codex continuation, or
approval/publish/retry/replay/merge authority.

The proof/evidence recording route gate is documented in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md`.
It is design-only and defines a future POST invocation boundary over the
writer/helper. It does not implement the route, add UI/Cockpit controls,
weaken helper validation, create bridge/evidence/action rows, bind sessions, or
continue Codex.

Approval, publish, retry, replay, and merge remain separate from imported
context review. Durable approval remains user/Core gated and merge remains a
GitHub/user review decision, not an AG Resume imported context decision.

## Definitions

- **imported context review metadata**: a Stage D
  `ag_work_resume_imported_contexts` row containing bounded summary, expected
  files/checks, foreign refs summary, redaction metadata, actor, reason, and
  authority boundary for review only.
- **proof record**: a local Augnes proof/action record created only through a
  separately authorized proof path. Imported context is not a proof record and
  must not automatically create one.
- **evidence record**: a local verification evidence row created only through a
  separately authorized evidence path. Imported context is not an evidence
  record and must not automatically create one.
- **session binding**: an explicit local association between a known local work
  identity and a known existing session identity. Imported context must not
  create, infer, or mutate session bindings.
- **Codex continuation**: future authorized Codex work on local repo files
  after current local state and work context are read and stop conditions are
  defined. Imported context must not execute or continue Codex.
- **codex:read-brief**: the check-only Codex helper that reads current Augnes
  state and, when a work id is supplied, current Work Brief context before
  Codex work proceeds.
- **user/Core approval**: explicit human/Core-gated authorization for a named
  future action. A packet, imported context row, route `ok`, smoke pass, PR,
  browser pass, or proof row is not user/Core approval.
- **committed state authority**: authority to make durable accepted project
  state transitions in Augnes Core. Imported context review metadata has none.
- **merge/publish/retry/replay authority**: authority to merge GitHub PRs,
  externally publish, retry publication, replay delivery, or grant those
  abilities. Imported context review metadata has none.

## Gate Model

### Gate A: Imported Context Review Complete

The reviewer confirms that an imported context row exists for the intended
confirmed mapping and that its bounded review metadata is understandable,
redacted, and still relevant.

Gate A completion is not proof/evidence reconciliation, not session binding,
not Codex continuation, not work item/event creation, and not approval,
publish, retry, replay, or merge authority.

### Gate B: Proof/Evidence Reconciliation Design And Explicit Authorization

Proof/evidence reconciliation must be designed and authorized separately before
any imported context material can be used to create local proof or evidence
records.

The future gate must define the exact source refs, local target work identity,
actor, reason, validation, allowed record shape, side effects, failure modes,
and verification. Imported context does not automatically record
proof/evidence.

### Gate C: Session Binding Design And Explicit Authorization

Session binding must be designed and authorized separately before any local
session can be associated with the mapped local work.

The future gate must define the exact local work identity, explicit session
identity, actor, reason, validation, allowed binding behavior, side effects,
failure modes, and verification. Imported context does not automatically bind
sessions.

### Gate D: Codex Continuation After Fresh codex:read-brief

Codex continuation must be designed and authorized separately. A future Codex
continuation gate requires a fresh `codex:read-brief` result before Codex work
can proceed.

The future gate must define the local work identity, confirmed mapping,
reviewed imported context, expected files/checks, stop conditions, required
runtime ids, actor, reason, and verification. Imported context and Cockpit UI
do not automatically execute or continue Codex.

### Gate E: Approval/Publish/Retry/Replay/Merge Remains Separate

Approval, publish, retry, replay, merge, auto-merge, and external posting are
not downstream defaults of imported context review, proof/evidence
reconciliation, session binding, or Codex continuation.

Those actions remain separately user/Core gated. Merge remains outside Codex
authority and outside imported context authority.

## Required Future Checks Before Proof/Evidence

Before any future proof/evidence reconciliation implementation is approved,
the design must require:

- imported context row exists
- imported context status is `review_metadata`, or an approved future status
  only if separately designed
- redaction report is safe and explicitly excludes secrets, raw DB paths,
  session payloads, and proof payloads
- foreign refs remain foreign until a separate reconciliation gate validates
  them for local use
- user/Core actor is required
- user/Core reason is required
- no automatic proof/evidence recording from imported context

## Required Future Checks Before Session Binding

Before any future session binding implementation is approved, the design must
require:

- local work identity is confirmed
- session identity is explicit
- user/Core actor is required
- user/Core reason is required
- no automatic session binding from imported context

## Required Future Checks Before Codex Continuation

Before any future Codex continuation implementation is approved, the design
must require:

- confirmed mapping exists
- imported context was reviewed
- fresh `codex:read-brief` succeeds
- expected files/checks were reviewed
- stop conditions are defined
- `CODEX_WORK_ID` is present if required by the future runtime
- `CODEX_SESSION_ID` is present if required by the future runtime
- no automatic Codex execution from imported context or UI

## Authority Boundary

This design grants:

- no proof/evidence recording
- no session binding
- no Codex execution or continuation
- no work item creation
- no work event creation
- no confirmed mapping mutation
- no proposal mutation
- no approval, publish, retry, replay, merge, auto-merge, or external posting
- no Direct Resume Code
- no relay
- no committed state authority

Durable approval remains user/Core gated. Imported context review metadata is
not proof/evidence, not session binding, not Codex, not work authority, and
not approval/publish/retry/replay/merge authority.

## Non-Goals

- No schema or migration.
- No writer, helper, route, or UI.
- No proof/evidence writer.
- No proof/evidence reconciliation implementation.
- No session binder.
- No session binding implementation.
- No Codex continuation route/helper/UI.
- No Codex continuation implementation.
- No app/api changes.
- No components changes.
- No lib runtime changes.
- No ChatGPT App, MCP/App schema, or bridge tool changes.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, indexedDB, or browser
  persistence.
- No browser report.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Future PR Sequence

1. Proof/evidence/session/Codex gate design only: this PR.
2. Proof/evidence reconciliation design:
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`.
3. Reconciliation candidate DB/schema design:
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`.
4. Reconciliation candidate DB/schema implementation:
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md`.
5. Reconciliation candidate writer/helper:
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md`.
6. Reconciliation candidate create route:
   `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md`.
7. Proof/evidence schema/design or integration design, separately approved.
8. Session binding design, separately approved.
9. Codex continuation design, separately approved.
10. Runtime implementations only after separate user/Core approval.

Each future PR must restate the authority boundary, name actor and reason
requirements, identify side effects, include fail-closed checks, and verify
that imported context review metadata does not itself grant downstream
authority.

The proof/evidence recording Cockpit/UI invocation gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md`.
It is design-only and does not add UI/Cockpit implementation, route changes,
writer/helper behavior changes, schema/migration, proof/evidence recording,
bridge rows, verification evidence rows, action records, session binding,
Codex continuation, or broader recording authority.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this design-only proof/evidence/session/Codex gate slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-route
npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design
npm run smoke:ag-work-resume-imported-context-create-cockpit-panel
npm run smoke:ag-work-resume-imported-context-read-cockpit-panel
npm run smoke:ag-work-resume-imported-context-read
npm run smoke:ag-work-resume-imported-context-route
npm run smoke:ag-work-resume-imported-context-writer
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs
```

## Proof/Evidence Recording Gate Closeout Pointer

The AG Resume Proof/Evidence Recording Gate Milestone v0.1 closeout is tracked
in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_GATE_CLOSEOUT_V0_1.md`.

That closeout records the post-PR #354 safe stopping point: exactly one
`verification_evidence_records` row and exactly one
`ag_work_resume_proof_evidence_recording_links` row may be created in one
transaction only through exact per-attempt user/Core approval and the existing
writer/helper, route, and Cockpit gate path. It does not add action records,
session binding, Codex continuation, work item/event creation, source-row
mutation, approval, publish, retry, replay, merge, Direct Resume Code,
relay/hosted transfer, or committed-state authority.
