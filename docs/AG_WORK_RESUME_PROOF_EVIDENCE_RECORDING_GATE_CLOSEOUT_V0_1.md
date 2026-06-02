# AG Resume Proof/Evidence Recording Gate Closeout v0.1

## Larger Goal

AG Resume cross-local continuity now has a bounded path from accepted
reconciliation candidate metadata to local verification evidence while
preserving explicit authority gates. The path lets Local B record that one
reviewed foreign proof/evidence ref has been reconciled into one local
verification evidence row, without turning review metadata, UI success, PR
history, or proof rows into broader approval.

This closeout freezes the first actual AG Resume proof/evidence recording gate
after PR #354. It records the completed design, schema, helper, route, Cockpit,
browser, and DB proof surfaces, and it keeps the next gates separated from this
milestone.

This closeout PR is docs/smoke/package-pointer only. It adds the package
pointer for the closeout smoke and smoke-guard compatibility allowlist updates;
it adds no runtime behavior, route behavior, writer/helper behavior,
UI/Cockpit behavior, schema, migration, hook, plugin, skill, MCP/App tool,
secret-handling, proof/evidence recording, evidence row, bridge link row,
action record, session binding, Codex execution, work item/event, source-row
mutation, approval, publish, retry, replay, merge, auto-merge, external
posting, Direct Resume Code, relay/hosted transfer, or committed-state
authority.

## Milestone Name

AG Resume Proof/Evidence Recording Gate Milestone v0.1

## Status

Closed as a bounded proof/evidence recording gate milestone.

The safe implemented path is available only for the exact per-attempt
user/Core-approved route/helper/UI-mediated recording path already implemented.
This closeout itself does not exercise that path and does not create any
records.

## Completed Flow

- reviewed reconciliation candidate metadata
- `accepted_for_future_recording` candidate lifecycle state
- actual proof/evidence recording gate design
- schema/integration policy
- bridge table schema design
- bridge table migration/DDL policy
- bridge table schema implementation
- writer/helper gate design
- writer/helper implementation
- route gate design
- route implementation
- Cockpit gate design
- Cockpit Operator panel implementation
- browser verification
- DB side-effect proof

## Inventory

### Docs

| Document | Role |
| --- | --- |
| `docs/AG_WORK_RESUME_CROSS_LOCAL_CONTINUITY_REVIEW_METADATA_CLOSEOUT_V0_1.md` | Prior review-metadata milestone closeout and pointer chain. |
| `docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md` | First actual recording gate design. |
| `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md` | Schema/integration policy for first local evidence target. |
| `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md` | Bridge table schema design. |
| `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md` | Migration/DDL policy for the bridge table. |
| `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md` | Writer/helper gate design. |
| `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md` | Route gate design. |
| `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md` | Cockpit invocation gate design. |
| `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` | Mapping/import authority boundary. |
| `docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md` | Proof/evidence/session/Codex gate separation. |
| `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md` | Reconciliation design for imported foreign refs. |
| `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md` | Candidate lifecycle action contract. |
| `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_GATE_CLOSEOUT_V0_1.md` | This milestone closeout and verification matrix. |

### DB Tables

| Table | Milestone role | Authority boundary |
| --- | --- | --- |
| `verification_evidence_records` | First implemented local target for one reconciled proof/evidence recording. | One row may be created only by exact per-attempt user/Core approval through the existing writer/helper, route, and Cockpit gate path. |
| `ag_work_resume_proof_evidence_recording_links` | Bridge link from candidate/import/mapping/foreign ref metadata to the local evidence row. | One row may be created in the same transaction as the evidence row; it is not approval, session binding, Codex continuation, or source-row mutation. |
| `ag_work_resume_proof_evidence_reconciliation_candidates` | Reviewed candidate metadata and lifecycle state. | `accepted_for_future_recording` is necessary but not sufficient; it is not proof/evidence recording. |
| `ag_work_resume_imported_contexts` | Imported context review metadata. | Source rows are not mutated by recording. |
| `ag_work_resume_confirmed_mappings` | Foreign-to-local work identity review metadata. | Source rows are not mutated by recording. |
| `ag_work_resume_mapping_proposals` | Mapping proposal review metadata. | Source rows are not mutated by recording. |
| `action_records` | Explicitly out of scope for this milestone. | No action-record proof path is implemented by this gate. |
| `sessions` | Explicitly out of scope for this milestone. | No session binding is implemented by this gate. |
| `work_items` and `work_events` | Explicitly out of scope for this milestone. | No work item/event creation is implemented by this gate. |

### Writer/Helper

| Item | Role | Boundary |
| --- | --- | --- |
| `lib/ag-work-resume-proof-evidence-recording.ts` | Existing writer/helper implementation. | Creates the bounded evidence row and bridge link in one transaction only after exact validation and approval fields pass. |
| `npm run smoke:ag-work-resume-proof-evidence-recording-writer-helper` | Existing helper smoke. | Proves helper validation, idempotency, allowed side effects, and protected table counts. |
| `npm run smoke:ag-work-resume-proof-evidence-recording-writer-helper-gate-design` | Existing design smoke. | Guards the writer/helper design boundary. |

### Local CLI Helper

| Item | Role | Boundary |
| --- | --- | --- |
| `scripts/ag-work-resume-proof-evidence-recording-create.mjs` | Local helper wrapper for the bounded recording path. | Does not bypass writer/helper validation or grant blanket approval. |
| `npm run ag:resume-proof-evidence-recording-create` | Existing local CLI command. | Requires exact request data; it is not this closeout PR's proof/evidence recording path. |

### Route

| Item | Role | Boundary |
| --- | --- | --- |
| `app/api/ag-work-resume/proof-evidence-recordings/route.ts` | Existing HTTP route implementation. | Calls the existing writer/helper and preserves fail-closed validation. |
| `POST /api/ag-work-resume/proof-evidence-recordings` | Existing route path. | May return recorded, idempotent, or failure results; route success is not broader approval. |
| `npm run smoke:ag-work-resume-proof-evidence-recording-route` | Existing route smoke. | Proves route behavior, unsupported-field rejection, idempotency, and side-effect boundaries. |
| `npm run smoke:ag-work-resume-proof-evidence-recording-route-gate-design` | Existing design smoke. | Guards the route gate design boundary. |

### Cockpit Panel

| Item | Role | Boundary |
| --- | --- | --- |
| `components/augnes-cockpit.tsx` | Existing Cockpit Operator panel implementation. | Calls only the existing proof/evidence recording route and must not weaken route/helper validation. |
| `AG Resume Proof/Evidence Recording Gate` panel | Existing Operator panel. | Presents exact approval controls, local validation, clear/reset, safe fixture, and route result rendering. |
| `npm run smoke:ag-work-resume-proof-evidence-recording-cockpit-panel` | Existing panel smoke. | Guards rendered copy, local validation, route-only fetch, and forbidden control absence. |
| `npm run smoke:ag-work-resume-proof-evidence-recording-cockpit-gate-design` | Existing design smoke. | Guards the Cockpit gate design boundary. |

### Package Scripts

This closeout PR adds the package pointer for the closeout smoke only:

- `npm run smoke:ag-work-resume-proof-evidence-recording-gate-closeout`

Existing package scripts relevant to the milestone include:

- `npm run typecheck`
- `npm run smoke:ag-work-resume-proof-evidence-recording-gate-closeout`
- `npm run smoke:ag-work-resume-proof-evidence-recording-writer-helper`
- `npm run smoke:ag-work-resume-proof-evidence-recording-route`
- `npm run smoke:ag-work-resume-proof-evidence-recording-cockpit-panel`
- `npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema`
- `npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-migration-policy`
- `npm run smoke:ag-work-resume-proof-evidence-recording-schema-integration-policy`
- `npm run smoke:ag-work-resume-actual-proof-evidence-recording-gate-design`
- `npm run smoke:ag-work-resume-review-metadata-closeout`
- `npm run smoke:ag-work-resume-mapping-import-authority-gate`
- `npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design`
- `npm run smoke:ag-work-resume-proof-evidence-reconciliation-design`
- `npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action`
- `npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route`
- `npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel`

The new closeout guard can also be run directly as
`node scripts/smoke-ag-work-resume-proof-evidence-recording-gate-closeout.mjs`.

### Smoke Scripts

| Smoke script | Purpose |
| --- | --- |
| `scripts/smoke-ag-work-resume-proof-evidence-recording-gate-closeout.mjs` | Guards this closeout doc, pointer docs, browser report inventory, and docs-only diff scope. |
| `scripts/smoke-ag-work-resume-proof-evidence-recording-writer-helper.mjs` | Guards writer/helper behavior and side effects. |
| `scripts/smoke-ag-work-resume-proof-evidence-recording-route.mjs` | Guards route behavior and side effects. |
| `scripts/smoke-ag-work-resume-proof-evidence-recording-cockpit-panel.mjs` | Guards Cockpit panel behavior and forbidden controls. |
| `scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-schema.mjs` | Guards implemented bridge table schema. |
| `scripts/smoke-ag-work-resume-proof-evidence-recording-bridge-table-migration-policy.mjs` | Guards bridge table migration/DDL policy. |
| `scripts/smoke-ag-work-resume-proof-evidence-recording-schema-integration-policy.mjs` | Guards schema/integration policy. |
| `scripts/smoke-ag-work-resume-actual-proof-evidence-recording-gate-design.mjs` | Guards actual recording gate design. |
| `scripts/smoke-ag-work-resume-review-metadata-closeout.mjs` | Guards prior review-metadata closeout. |
| `scripts/smoke-ag-work-resume-mapping-import-authority-gate.mjs` | Guards mapping/import authority boundary. |
| `scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs` | Guards proof/evidence/session/Codex separation. |
| `scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs` | Guards proof/evidence reconciliation design. |
| `scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs` | Guards candidate lifecycle helper behavior. |
| `scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route.mjs` | Guards candidate lifecycle route behavior. |
| `scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs` | Guards candidate lifecycle Cockpit panel behavior. |

### Browser Report

| Report | Result |
| --- | --- |
| `reports/browser/2026-06-02-ag-work-resume-proof-evidence-recording-cockpit-verification.md` | Passed; proved the Operator panel, route submit, idempotency, failure path, DB side effects, and protected table counts. |

## Exact Allowed Recording Side Effect

The only implemented recording side effect is:

- one `verification_evidence_records` row
- one `ag_work_resume_proof_evidence_recording_links` row
- created in one transaction
- only through exact per-attempt user/Core approval
- only through the existing writer/helper, route, and Cockpit gate path

The path is idempotent for the exact approved idempotency key and creates no
duplicate rows on repeat.

## Explicitly Out Of Scope

- `action_records` proof path
- session binding
- Codex continuation
- work item/event creation
- imported context mutation
- confirmed mapping mutation
- proposal mutation
- reconciliation candidate mutation
- approval/publish/retry/replay/merge
- auto-merge
- external posting
- Direct Resume Code
- relay/hosted transfer
- committed-state authority
- blanket approval for future recording attempts

## Authority Boundary Matrix

| Surface or action | Milestone status | Boundary |
| --- | --- | --- |
| `accepted_for_future_recording` | Required candidate lifecycle state. | Necessary but not sufficient; it is not proof/evidence recording and not approval. |
| writer/helper | Implemented bounded writer/helper. | May create exactly the evidence row and bridge link in one transaction after exact validation and approval fields pass. |
| route | Implemented bounded route. | Calls only the existing helper; route success is not broader approval. |
| Cockpit panel | Implemented Operator panel. | Calls only the route and preserves route/helper validation; safe fixture is not approval. |
| `verification_evidence_records` row | Allowed exact side effect. | One row may be created per exact approved attempt/idempotency key. |
| bridge link row | Allowed exact side effect. | One `ag_work_resume_proof_evidence_recording_links` row is created with the evidence row in the same transaction. |
| `action_records` | Out of scope. | No action-record proof path is implemented by this milestone. |
| session binding | Out of scope. | No session row or binding is created. |
| Codex continuation | Out of scope. | No Codex execution, continuation, or ChatGPT execution control is created. |
| work item/event creation | Out of scope. | No work item or work event is created. |
| source-row mutation | Out of scope. | Imported context, confirmed mapping, proposal, and reconciliation candidate source rows are not mutated. |
| approval/publish/retry/replay/merge | Out of scope. | No approval, publication, retry, replay, merge, auto-merge, or external posting authority is granted. |
| Direct Resume Code / relay / hosted transfer | Out of scope. | No Direct Resume Code, relay, hosted transfer, or hosted authority is added. |

## Verification Matrix

The closeout PR should run these checks and record actual results in the PR
body or closeout summary.

| Check | Purpose |
| --- | --- |
| `npm run typecheck` | Confirms TypeScript still typechecks after docs/smoke changes. |
| `npm run smoke:ag-work-resume-proof-evidence-recording-writer-helper` | Verifies writer/helper validation, idempotency, allowed evidence/link writes, and protected table counts. |
| `npm run smoke:ag-work-resume-proof-evidence-recording-route` | Verifies route validation, status mapping, idempotency, and allowed route/helper side effects. |
| `npm run smoke:ag-work-resume-proof-evidence-recording-cockpit-panel` | Verifies Cockpit panel boundary copy, local validation, route-only fetch, and forbidden control absence. |
| `npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-schema` | Verifies the bridge table and indexes exist without creating recording rows by migration alone. |
| `npm run smoke:ag-work-resume-proof-evidence-recording-bridge-table-migration-policy` | Verifies migration/DDL policy boundaries. |
| `npm run smoke:ag-work-resume-proof-evidence-recording-schema-integration-policy` | Verifies schema/integration policy boundaries. |
| `npm run smoke:ag-work-resume-actual-proof-evidence-recording-gate-design` | Verifies actual recording gate design boundaries. |
| `npm run smoke:ag-work-resume-review-metadata-closeout` | Verifies the prior review-metadata closeout remains discoverable and bounded. |
| `npm run smoke:ag-work-resume-mapping-import-authority-gate` | Verifies mapping/import authority boundaries remain intact. |
| `npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design` | Verifies proof/evidence/session/Codex gates remain separated. |
| `npm run smoke:ag-work-resume-proof-evidence-reconciliation-design` | Verifies reconciliation design remains review metadata only. |
| `npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action` | Verifies candidate lifecycle helper behavior and authority boundary. |
| `npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route` | Verifies candidate lifecycle route behavior and authority boundary. |
| `npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel` | Verifies candidate lifecycle Cockpit panel boundary. |
| `node --check` over modified `.mjs` scripts | Syntax-checks the new closeout smoke guard. |
| `npm run smoke:ag-work-resume-proof-evidence-recording-gate-closeout` | Runs the package-registered closeout smoke guard. |
| `node scripts/smoke-ag-work-resume-proof-evidence-recording-gate-closeout.mjs` | Verifies this closeout doc, pointer docs, browser report inventory, and closeout diff scope. |
| `git diff --check` | Checks unstaged diff whitespace. |
| `git diff --cached --check` | Checks staged diff whitespace before commit. |

## Browser Report Inventory

Reference:

- `reports/browser/2026-06-02-ag-work-resume-proof-evidence-recording-cockpit-verification.md`

It proved:

- Operator panel visible
- required boundary copy visible
- keyboard flow
- local validation
- safe fixture not approval
- clear/reset
- exact approved route submit returns 201
- idempotent repeat returns 200
- failure path returns 403
- evidence/link rows 0 -> 1 on recorded
- no duplicate rows on idempotent repeat
- no new rows on failure
- protected table counts unchanged

The report also confirmed that no forbidden controls were present for Direct
Resume Code, relay, hosted transfer, session binding, Codex
execution/continuation, work item/event creation, action record creation,
approval, publish, retry, replay, merge, auto-merge, external posting, or
source-row mutation.

## Known Skipped Checks

- `npm run codex:read-brief` returned `CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE`.
- Proof-only closeout record skipped where applicable because this closeout PR
  explicitly forbids creating proof/evidence rows, bridge rows, action records,
  work events, session bindings, or other runtime-backed records, and the local
  Augnes runtime brief was unavailable.
- GitHub visible CI/statusCheckRollup was unavailable or empty when relevant;
  no GitHub-visible CI status is claimed by this closeout doc.

## Next Gate Options

- stop at proof/evidence recording gate v0.1
- design `action_records` proof path
- design session binding gate
- design Codex continuation gate
- design broader operator workflow
- design proof/evidence recording read/report surface, if needed

No next gate is selected by this closeout.

## Preconditions Before `action_records` Proof Path

- explicit user/Core approval
- design-only PR
- schema/integration decision
- rollback/failure policy
- DB side-effect proof plan
- no session/Codex/merge expansion

## Preconditions Before Session Binding

- explicit user/Core approval
- design-only PR
- exact session identity
- stop/revoke conditions
- DB side-effect proof plan
- no Codex continuation by default

## Preconditions Before Codex Continuation

- fresh `codex:read-brief` succeeds
- `CODEX_WORK_ID` or equivalent runtime IDs are available if required
- expected files/checks reviewed
- stop conditions documented
- explicit user/Core approval
- no merge/publish/retry/replay authority by default

## Current Safe Stopping Point

The project can safely stop at:

AG Resume Proof/Evidence Recording Gate Milestone v0.1

with route + Cockpit recording available only under exact per-attempt
user/Core approval.

Stopping here means the implemented system can record the exact bounded
verification evidence/link pair when explicitly approved, while action records,
session binding, Codex continuation, broader operator workflows, read/report
surfaces, Direct Resume Code, relay/hosted transfer, approval, publish, retry,
replay, merge, auto-merge, external posting, and committed-state authority
remain separate future gates.
