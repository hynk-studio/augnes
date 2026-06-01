# AG Work Resume Imported Context Create Cockpit Panel v0.1

## Purpose

This document records the bounded Cockpit Operator controls for creating Stage
D AG Resume imported context review metadata through the existing route:

```text
POST /api/ag-work-resume/imported-contexts
```

Imported context remains bounded review metadata only. It is not
proof/evidence, not session binding, not Codex execution or continuation, not
work item/event creation, not confirmed mapping/proposal mutation, and not
approval, publish, retry, replay, or merge authority.

## Relationship To Read Writer Route And Gate Docs

The panel sits on top of the existing imported context POST route documented in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md` and the writer core
documented in `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md`.

Related documents:

- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md`
- `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md`
- `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md`
- `docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`

The read-only Cockpit panel remains separate and uses only GET. This create
panel does not change read route behavior.

Future movement from imported context review metadata into proof/evidence
reconciliation, session binding, or Codex continuation is design-only in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md`.
Those gates remain separate and do not grant approval, publish, retry, replay,
or merge authority.

The proof/evidence reconciliation design in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md` keeps
foreign refs as foreign review metadata until separately reconciled and does
not change this create panel or POST route.
The candidate DB/schema design in
`docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md`
adds no schema implementation, migration, runtime behavior, or panel change.

## Allowed UI

The panel exposes native inputs for:

- `mapping_id`
- `packet_id`
- `packet_hash`
- optional `source_runtime_instance_id`
- optional `foreign_scope`
- optional `foreign_work_id`
- optional `local_scope`
- optional `local_work_id`
- `imported_summary`
- `imported_expected_files` JSON array
- `imported_expected_checks` JSON array
- `foreign_refs_summary` JSON object
- `redaction_report` JSON object
- `created_by`
- `import_reason`
- optional `created_at`

Safe fixture buttons load synthetic public-safe values into local React state
only. They do not call routes and do not persist browser state.

The create action sends exactly one route request to the existing POST route
with a JSON `Content-Type` header and a JSON body containing only supported
route fields. The body does not include `db` or `now`.

## Local Validation

The panel validates before calling the route:

- `mapping_id` is required.
- `packet_id` is required.
- `packet_hash` is required.
- `imported_summary` is required.
- `created_by` is required.
- `import_reason` is required.
- `redaction_report` JSON is required.
- `imported_expected_files`, when supplied, must parse as a JSON array.
- `imported_expected_checks`, when supplied, must parse as a JSON array.
- `foreign_refs_summary`, when supplied, must parse as a JSON object.
- `created_at`, when supplied, must be ISO UTC with millisecond precision.

The route remains canonical validation for active confirmed mapping existence,
mapping status, mapping identity mismatch, packet mismatch, route-supported
fields, and database errors.

## Redaction Validation

The local redaction validation requires `redaction_report` to be a JSON object
with all of these fields explicitly set to `false`:

- `secrets_included`
- `raw_db_paths_included`
- `session_payloads_included`
- `proof_payloads_included`

Unsafe redaction metadata fails locally before the POST route is called.

## Output Rendering

The panel renders:

- HTTP status
- route ok
- writer status
- `import_id`
- `mapping_id`
- foreign and local identities
- packet id/hash
- `imported_summary`
- imported expected files/checks
- foreign refs summary
- redaction report
- `created_by`
- `import_reason`
- authority boundary
- warnings
- failures

## Accessibility

The panel uses native inputs, textareas, and buttons. Inputs have real labels
with `htmlFor`, descriptive `aria-describedby` text, `role="alert"` for local
or route errors, and an `aria-live="polite"` result region.

## Authority Boundary

Visible panel copy states that imported context creation is bounded review
metadata only.

The create surface:

- may create one imported context review metadata row through the existing POST
  route after route/core validation
- does not create, update, or delete through any other route
- does not mutate confirmed mappings
- does not mutate proposals
- does not create work items or work events
- does not record proof/evidence
- does not bind sessions
- does not execute Codex
- does not approve, publish, retry, replay, or merge

Durable approval remains user/Core gated.

## Non-Goals

- No schema or migration.
- No read route behavior change.
- No update route.
- No delete route.
- No lifecycle mutation.
- No proof/evidence recording or controls.
- No session binding.
- No Codex execution or continuation.
- No work item or work event creation.
- No confirmed mapping mutation.
- No proposal mutation.
- No ChatGPT App, MCP/App schema, or bridge tool changes.
- No Direct Resume Code.
- No relay.
- No telemetry, analytics, localStorage, sessionStorage, or indexedDB.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Browser Verification Requirement

Browser verification is required because this slice changes a rendered Cockpit
Operator surface and calls the existing POST imported contexts route. The
verification report is:

`reports/browser/2026-06-01-ag-work-resume-imported-context-create-cockpit-panel-verification.md`

The report covers a successful create from an active confirmed mapping, local
validation errors, route error cases, clear behavior, accessibility/keyboard
observation, unauthorized controls scan, network proof, and DB side-effect
proof.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-imported-context-create-cockpit-panel
npm run smoke:ag-work-resume-imported-context-read-cockpit-panel
npm run smoke:ag-work-resume-imported-context-read
npm run smoke:ag-work-resume-imported-context-route
npm run smoke:ag-work-resume-imported-context-writer
npm run smoke:ag-work-resume-imported-context-db-schema
npm run smoke:ag-work-resume-confirmed-mapping-writer
npm run smoke:ag-work-resume-confirmed-mapping-route
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-imported-context-create-cockpit-panel.mjs
```
