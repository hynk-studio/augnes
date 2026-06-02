# AG Resume Cross-local Continuity Review-Metadata Closeout v0.1

## Larger Goal

AG Resume cross-local continuity is meant to let one local Augnes runtime
recover reviewable work context from another local Augnes runtime without
turning copied context into authority. The larger goal is a recoverable,
auditable handoff pipeline where packet content, mapping decisions, imported
context, foreign proof/evidence refs, sessions, and possible Codex continuation
remain separated until the user/Core explicitly authorizes each next gate.

This closeout freezes the current review-metadata milestone after the
reconciliation candidate lifecycle work. It records what exists, what was
verified, and what remains deliberately out of scope before any future
proof/evidence recording, session binding, or Codex continuation gate.

## Milestone Name

AG Resume Cross-local Continuity Review-Metadata Milestone v0.1

## Status

Closed as a review-metadata milestone.

This closeout adds no runtime behavior, schema, migration, writer, helper,
route, UI, proof/evidence recording, evidence recording, session binding,
Codex execution or continuation, work item/event creation, imported context
mutation, confirmed mapping mutation, proposal mutation, approval, publish,
retry, replay, merge, auto-merge, external posting, or committed-state
authority.

It adds no schema or migration. It adds no writer/helper/route/UI. It adds no
approval, publish, retry, replay, merge, or auto-merge authority.

The milestone is recoverable from the docs, existing smokes, existing browser
reports, existing route/helper/UI inventory, and existing DB table inventory
listed below.

## Current Completed Flow

1. Stage A packet / preview
   - `docs/CROSS_LOCAL_AG_WORK_RESUME_DIRECT_CODE_V0_2.md` defines the
     packet-first direction and keeps Direct Resume Code future-only.
   - `docs/AG_WORK_RESUME_PACKET_PREFLIGHT_V0_1.md` defines packet preflight.
   - `docs/AG_WORK_RESUME_PACKET_BUILDER_PREVIEW_V0_1.md` defines sanitized
     packet preview building.
   - `docs/AG_WORK_RESUME_TARGET_PREVIEW_V0_1.md`,
     `docs/AG_WORK_RESUME_TARGET_PREVIEW_HELPER_V0_1.md`,
     `docs/AG_WORK_RESUME_TARGET_PREVIEW_ROUTE_V0_1.md`, and
     `docs/AG_WORK_RESUME_TARGET_PREVIEW_COCKPIT_PANEL_V0_1.md` define the
     Local B target preview surfaces.
   - `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_V0_1.md`,
     `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_HELPER_V0_1.md`,
     `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_ROUTE_V0_1.md`, and
     `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_COCKPIT_PANEL_V0_1.md`
     define mapping proposal preview. Preview is read-only review metadata and
     creates no records.

2. Stage B proposal record create/read/lifecycle/UI
   - `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_DESIGN_V0_1.md`,
     `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_DB_SCHEMA_DESIGN_V0_1.md`, and
     `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
     define and implement the proposal table foundation.
   - `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md`,
     `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md`, and
     `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md`
     define proposal creation and read review surfaces.
   - `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md`,
     `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md`,
     `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1.md`,
     and
     `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md`
     define proposal lifecycle review metadata updates.

3. Stage C confirmed mapping create/read/UI
   - `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md`,
     `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md`, and
     `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
     define and implement the confirmed mapping table foundation.
   - `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md`,
     `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md`,
     `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md`,
     `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_COCKPIT_PANEL_V0_1.md`, and
     `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_COCKPIT_PANEL_V0_1.md`
     define confirmed mapping create/read/UI review surfaces.

4. Stage D imported context create/read/UI
   - `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md`,
     `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md`, and
     `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
     define and implement the imported context table foundation.
   - `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md`,
     `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md`,
     `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md`,
     `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md`, and
     `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md`
     define imported context create/read/UI review surfaces.

5. proof/evidence/session/Codex gate design
   - `docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`
     defines the future gates from imported context into proof/evidence
     recording, session binding, and Codex continuation. It is design-only.

6. proof/evidence reconciliation design
   - `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`
     defines the future reconciliation contract for imported foreign refs. It
     is design-only and does not record proof/evidence.

7. reconciliation candidate create/read/lifecycle/UI
   - `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`
     and
     `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
     define and implement the candidate table foundation.
   - `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md`,
     `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md`,
     `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md`,
     `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md`,
     `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md`,
     `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md`,
     and
     `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md`
     define candidate create/read/lifecycle/UI review metadata.

## Route/Helper/UI Inventory

### Routes

| Route | Stage | Current authority |
| --- | --- | --- |
| `POST /api/ag-work-resume/target-preview` | Stage A target preview | Read-only preview. No persistence. |
| `POST /api/ag-work-resume/mapping-proposal-preview` | Stage A mapping proposal preview | Read-only preview. No persistence. |
| `GET /api/ag-work-resume/mapping-proposal-records` | Stage B proposal read | Reads proposal review metadata only. |
| `POST /api/ag-work-resume/mapping-proposal-records` | Stage B proposal create | Creates proposal review metadata only. |
| `POST /api/ag-work-resume/mapping-proposal-records/lifecycle-actions` | Stage B proposal lifecycle | Updates existing proposal review metadata only. |
| `GET /api/ag-work-resume/confirmed-mappings` | Stage C confirmed mapping read | Reads confirmed mapping review metadata only. |
| `POST /api/ag-work-resume/confirmed-mappings` | Stage C confirmed mapping create | Creates confirmed mapping identity review metadata only. |
| `GET /api/ag-work-resume/imported-contexts` | Stage D imported context read | Reads imported context review metadata only. |
| `POST /api/ag-work-resume/imported-contexts` | Stage D imported context create | Creates imported context review metadata only. |
| `GET /api/ag-work-resume/proof-evidence-reconciliation-candidates` | Candidate read | Reads reconciliation candidate review metadata only. |
| `POST /api/ag-work-resume/proof-evidence-reconciliation-candidates` | Candidate create | Creates reconciliation candidate review metadata only. |
| `POST /api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions` | Candidate lifecycle | Updates existing candidate review metadata only. |

### Helpers And Scripts

| Command or module | Stage | Current authority |
| --- | --- | --- |
| `npm run ag:resume-preflight` | Stage A packet preflight | Validates packet JSON only. |
| `npm run ag:resume-target-preview` | Stage A target preview | Returns read-only target preview JSON. |
| `npm run ag:resume-mapping-preview` | Stage A mapping proposal preview | Returns read-only mapping proposal preview JSON. |
| `npm run ag:resume-mapping-proposal-record-create` | Stage B proposal create | Creates proposal review metadata only. |
| `npm run ag:resume-mapping-proposal-record-read` | Stage B proposal read | Reads proposal review metadata only. |
| `npm run ag:resume-mapping-proposal-lifecycle-action` | Stage B proposal lifecycle | Updates existing proposal review metadata only. |
| `npm run ag:resume-confirmed-mapping-create` | Stage C confirmed mapping create | Creates confirmed mapping review metadata only. |
| `npm run ag:resume-confirmed-mapping-read` | Stage C confirmed mapping read | Reads confirmed mapping review metadata only. |
| `npm run ag:resume-imported-context-create` | Stage D imported context create | Creates imported context review metadata only. |
| `npm run ag:resume-imported-context-read` | Stage D imported context read | Reads imported context review metadata only. |
| `npm run ag:resume-proof-evidence-reconciliation-candidate-create` | Candidate create | Creates candidate review metadata only. |
| `npm run ag:resume-proof-evidence-reconciliation-candidate-read` | Candidate read | Reads candidate review metadata only. |
| `npm run ag:resume-proof-evidence-reconciliation-candidate-lifecycle-action` | Candidate lifecycle | Updates existing candidate review metadata only. |
| `lib/ag-work-resume-*.ts` and `lib/ag-work-resume-*.mjs` | Shared core | Existing bounded core modules only; no new helper is added by this closeout. |

### UI

All UI in this milestone is existing Cockpit Operator-tab UI in
`components/augnes-cockpit.tsx`. The current panels are:

- AG Resume target preview.
- AG Resume mapping proposal preview.
- AG Resume mapping proposal record read.
- AG Resume mapping proposal lifecycle actions.
- AG Resume confirmed mapping create/read.
- AG Resume imported context create/read.
- AG Resume proof/evidence reconciliation candidate create/read.
- AG Resume proof/evidence reconciliation candidate lifecycle actions.

This closeout PR adds no UI and no browser verification requirement.

## DB Table Inventory

| Table | Stage | Current role | Explicit non-authority |
| --- | --- | --- | --- |
| `ag_work_resume_mapping_proposals` | Stage B | Proposal review metadata and proposal lifecycle review metadata. | Not confirmed mapping, not import, not proof/evidence, not session, not Codex, not approval. |
| `ag_work_resume_confirmed_mappings` | Stage C | Foreign-to-local work identity association review metadata. | Not import, not proof/evidence, not session binding, not Codex authorization, not approval. |
| `ag_work_resume_imported_contexts` | Stage D | Bounded imported context review metadata derived from packet plus confirmed mapping. | Not proof, not evidence, not source of truth, not session binding, not Codex authorization. |
| `ag_work_resume_proof_evidence_reconciliation_candidates` | Candidate review | Candidate review metadata for possible future proof/evidence reconciliation. | `accepted_for_future_recording` is not proof/evidence recording and does not grant session, Codex, work, proposal, approval, publish, retry, replay, or merge authority. |

There is no Stage A preview table. Stage A packet, target preview, and mapping
proposal preview remain read-only or helper/route-returned review material.

## Authority Boundary Matrix

| Surface or action | Current milestone status | Boundary |
| --- | --- | --- |
| Packet preflight and previews | Allowed as read-only review metadata. | No persistence and no authority to continue. |
| Mapping proposal records | Allowed as Stage B review metadata. | Not confirmed mapping, imported context, proof/evidence, session, Codex, approval, publish, retry, replay, or merge authority. |
| Proposal lifecycle actions | Allowed only for existing proposal review metadata. | No replacement proposal creation and no confirmed mapping/import authority. |
| Confirmed mapping records | Allowed as Stage C identity association review metadata. | Does not import context, record proof/evidence, bind sessions, create work, execute Codex, approve, publish, retry, replay, or merge. |
| Imported context records | Allowed as Stage D bounded review metadata. | Imported context is not proof, evidence, committed state authority, session binding, or Codex authorization. |
| Reconciliation candidate records | Allowed as candidate review metadata. | Candidate rows are not proof/evidence rows and are not recording authorization. |
| Candidate lifecycle actions | Allowed only for existing candidate review metadata. | `accepted_for_future_recording` is not proof/evidence recording. `superseded -> revoke` preserves `superseded_by_candidate_id` as audit metadata and does not mutate the replacement row. |
| Proof/evidence recording | Out of scope. | Requires a separately authorized future gate. |
| Evidence recording | Out of scope. | Requires a separately authorized future gate. |
| Session binding | Out of scope. | Requires existing session identity plus separate user/Core approval. |
| Codex continuation | Out of scope. | Requires fresh `codex:read-brief`, required runtime IDs, stop conditions, and explicit approval. |
| Work item/event creation | Out of scope. | Requires separate user/Core authority and design. |
| Imported context mutation beyond existing scoped create/read | Out of scope. | No update/delete/lifecycle authority. |
| Confirmed mapping mutation beyond existing scoped create/read | Out of scope. | No update/delete/lifecycle authority. |
| Proposal mutation beyond existing scoped lifecycle | Out of scope. | No mutation beyond the existing lifecycle contract. |
| Approval/publish/retry/replay/merge/auto-merge | Out of scope. | Remains user/Core/GitHub-gated and is not granted by this milestone. |

## Verification Matrix

The closeout PR should run these checks and record the actual results in the
PR body.

| Check | Purpose |
| --- | --- |
| `npm run typecheck` | Confirms the merged codebase still typechecks after pointer/smoke/doc changes. |
| `npm run smoke:ag-work-resume-review-metadata-closeout` | Verifies this closeout doc, required boundary text, and closeout diff scope. |
| `npm run smoke:ag-work-resume-mapping-import-authority-gate` | Verifies the central AG Resume authority gate still preserves mapping/import boundaries. |
| `npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design` | Verifies proof/evidence/session/Codex gates remain design-only. |
| `npm run smoke:ag-work-resume-proof-evidence-reconciliation-design` | Verifies reconciliation design remains review metadata only. |
| `npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action` | Verifies candidate lifecycle helper behavior and authority boundary. |
| `npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route` | Verifies candidate lifecycle route behavior and authority boundary. |
| `npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel` | Verifies candidate lifecycle UI boundary smoke. |
| `node --check scripts/smoke-ag-work-resume-review-metadata-closeout.mjs` | Syntax-checks the new closeout smoke. |
| `git diff --check` | Checks unstaged diff whitespace. |
| `git diff --cached --check` | Checks staged diff whitespace before commit. |

Browser verification is not applicable for this closeout PR because it changes
no runtime/UI files and introduces no Cockpit behavior.

## Browser Report Inventory

Existing browser reports for the milestone are:

- `reports/browser/2026-05-30-ag-work-resume-target-preview-cockpit-panel-verification.md`
- `reports/browser/2026-05-30-ag-work-resume-target-preview-cockpit-panel-fixture-polish-verification.md`
- `reports/browser/2026-05-31-ag-work-resume-copied-packet-validation-cockpit-panel-verification.md`
- `reports/browser/2026-05-31-ag-work-resume-error-state-cockpit-panel-verification.md`
- `reports/browser/2026-05-31-ag-work-resume-accessibility-keyboard-cockpit-panel-verification.md`
- `reports/browser/2026-05-31-ag-work-resume-mapping-proposal-cockpit-panel-verification.md`
- `reports/browser/2026-05-31-ag-work-resume-mapping-proposal-record-read-cockpit-panel-verification.md`
- `reports/browser/2026-05-31-ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel-verification.md`
- `reports/browser/2026-05-31-ag-work-resume-confirmed-mapping-read-cockpit-panel-verification.md`
- `reports/browser/2026-06-01-ag-work-resume-confirmed-mapping-create-cockpit-panel-verification.md`
- `reports/browser/2026-06-01-ag-work-resume-imported-context-read-cockpit-panel-verification.md`
- `reports/browser/2026-06-01-ag-work-resume-imported-context-create-cockpit-panel-verification.md`
- `reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md`
- `reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md`
- `reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-verification.md`

This closeout adds no browser report because browser verification is not
applicable to a docs-only closeout PR with no runtime/UI changes.

## Explicitly Out Of Scope

- actual proof/evidence recording
- evidence recording
- session binding
- Codex continuation
- Direct Resume Code
- relay/hosted transfer
- work item/event creation
- imported context mutation beyond existing scoped create/read
- confirmed mapping mutation beyond existing scoped create/read
- proposal mutation beyond existing scoped lifecycle
- approval/publish/retry/replay/merge authority
- auto-merge authority
- runtime behavior changes
- schema or migration changes
- writer/helper/route/UI changes

## Next-Gate Decision Options

1. Stop at review-metadata milestone.
2. Design actual proof/evidence recording gate.
3. Design session binding gate.
4. Design Codex continuation gate.

No option is selected by this closeout. A future option requires explicit
user/Core authorization and a separate PR.

The actual proof/evidence recording gate design is tracked in
`docs/AG_WORK_RESUME_ACTUAL_PROOF_EVIDENCE_RECORDING_GATE_DESIGN_V0_1.md`.
It is design-only and does not authorize recording by itself.

The proof/evidence recording schema/integration policy is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_SCHEMA_INTEGRATION_POLICY_V0_1.md`.
It is design-only and does not authorize schema, migration, writer/helper/route/UI,
or actual proof/evidence recording by itself.

The proof/evidence recording bridge-table schema design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_SCHEMA_DESIGN_V0_1.md`.
It is design-only and does not authorize schema, migration, bridge row
creation, verification evidence row creation, action record creation, or actual
proof/evidence recording by itself.

The proof/evidence recording bridge-table migration/DDL policy is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_BRIDGE_TABLE_MIGRATION_POLICY_V0_1.md`.
It is design-only and does not authorize schema, migration, `lib/db/schema.sql`
changes, migration files, bridge table creation, verification evidence row
creation, action record creation, or actual proof/evidence recording by itself.

The schema-only bridge table implementation adds
`ag_work_resume_proof_evidence_recording_links` to `lib/db/schema.sql` as an
empty table with indexes. It does not create bridge rows, evidence rows, action
records, session bindings, work items/events, or actual proof/evidence
recording authority.

The proof/evidence recording writer/helper gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_WRITER_HELPER_GATE_DESIGN_V0_1.md`.
It is design-only and does not add writer/helper implementation, route/UI,
bridge row creation, verification evidence row creation, action record
creation, or actual proof/evidence recording authority by itself.

The proof/evidence recording route gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE_GATE_DESIGN_V0_1.md`.
It is design-only and defines a future route invocation boundary over the
writer/helper. It does not add route implementation, UI/Cockpit controls,
schema/migration, writer/helper changes, bridge rows, verification evidence
rows, action records, or actual proof/evidence recording authority by itself.

The proof/evidence recording Cockpit/UI invocation gate design is tracked in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_COCKPIT_GATE_DESIGN_V0_1.md`.
It is design-only and does not add UI/Cockpit implementation, route changes,
writer/helper behavior changes, schema/migration, proof/evidence recording,
bridge rows, verification evidence rows, action records, or broader recording
authority by itself.

## Required Preconditions Before Actual Proof/Evidence Recording

- user/Core explicit authorization
- design-only PR merged
- schema/integration policy decided
- actor/reason/redaction/failure/rollback policy decided
- side-effect proof plan

## Required Preconditions Before Codex Continuation

- fresh `codex:read-brief` succeeds
- required runtime IDs are present
- stop conditions documented
- user/Core explicit approval

## Closeout Rule

Future PRs that build from this milestone must state which next gate they are
implementing and must restate that this closeout is only review metadata.
Actual proof/evidence recording, session binding, Codex continuation,
Direct Resume Code, relay/hosted transfer, work item/event creation,
imported context mutation beyond existing scoped create/read, confirmed
mapping mutation beyond existing scoped create/read, proposal mutation beyond
existing scoped lifecycle, and approval/publish/retry/replay/merge authority
remain out of scope unless separately authorized.

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
