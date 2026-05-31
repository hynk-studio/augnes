# AG Work Resume Imported Context Record Design v0.1

## Status

This document is design-only. It defines the Stage D AG Resume imported resume
context record contract as a future record design after Stage C confirmed
mapping.

This PR adds no runtime behavior. It adds no schema, no migration, no
writer/helper/route/UI, no import rows, no imported context rows, no work
items, no work events, no proof/evidence records, no session binding, no Codex
execution or continuation, and no approval, publish, retry, replay, merge, or
committed-state authority.

This design adds no DB schema, no migration, no imported context writer, no
helper, no route, no Cockpit UI, no ChatGPT App card, no MCP/App schema, no
bridge tool, no Direct Resume Code, no relay, no telemetry/analytics, and no
localStorage/sessionStorage/indexedDB persistence.

Durable approval remains user/Core gated.

## Purpose

Stage D imported resume context is a future bounded review metadata record
derived from a validated AG Resume packet and an existing active confirmed
mapping. It may preserve selected packet summary material, expected files,
expected checks, foreign refs summary, and redaction metadata for local review.

Imported context is separate from confirmed mapping because Stage C only
associates one foreign work identity with one existing local work identity.
Confirmed mapping does not import packet content. Imported context, if ever
implemented, would be a separate user/Core-gated write that records bounded
review metadata derived from that mapped packet context.

The design-only DB/schema contract for future imported context rows is
documented in
`docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md`. That schema
design remains non-implementation and adds no schema, migration, runtime
behavior, writer/helper/route/UI, proof/evidence, session, Codex, approval,
publish, retry, replay, or merge authority.

Imported context is not proof/evidence. It is not committed state authority.
It is not approval. It does not authorize publish, retry, replay, or merge. It
does not bind sessions. It does not start or continue Codex. Any future Codex
continuation remains a separate gate after local mapping/context review and a
fresh `codex:read-brief`.

## Definitions

- **confirmed mapping**: a Stage C identity association between one foreign
  scope/work id and one existing local scope/work id. A confirmed mapping is
  required before any future imported context record, but it does not itself
  import packet content or grant downstream authority.
- **source packet identity**: packet provenance fields such as `packet_id`,
  `packet_hash`, and `source_runtime_instance_id`. These fields identify the
  reviewed packet material and are not proof/evidence or approval.
- **imported context**: future Stage D bounded review metadata derived from a
  validated AG Resume packet and an active confirmed mapping.
- **imported summary**: a bounded summary copied or derived from the reviewed
  packet for local review. It is not committed project state.
- **imported expected files/checks**: bounded expected-file and expected-check
  lists copied from the reviewed packet for local review. They do not create
  work items, mutate work state, or authorize Codex.
- **foreign refs summary**: a bounded summary of foreign action, evidence,
  proof, evidence-pack, session, Git, or handoff refs. Foreign refs remain
  foreign and must not be reconciled as local records by imported context.
- **redaction report**: metadata showing whether sensitive raw materials were
  excluded, including secrets, raw local DB paths, raw session payloads, and
  raw proof payloads.
- **import actor / user-Core actor**: the explicit user/Core actor or approved
  surface that creates a future imported context record. A route `ok`, smoke
  pass, PR merge, browser pass, or proof row is not this actor.
- **review metadata only**: a record class that helps humans review mapped
  packet context without becoming proof, evidence, committed state, approval,
  session binding, or Codex authority.
- **proof/evidence**: separately authorized local proof or evidence records.
  Imported context must not record proof/evidence and must not treat foreign
  proof/evidence refs as local proof/evidence.
- **session binding**: separately authorized association of a local session with
  known local work. Imported context must not create, bind, or mutate sessions.
- **Codex continuation**: separately authorized Codex work after current local
  state and work brief checks. Imported context must not execute or continue
  Codex.

## Future Record Shape

The following is a future non-implemented imported context record shape. It is
design only, not schema/runtime, not a writer contract, and not a route
contract in this PR.

```json
{
  "import_id": "ag-resume-imported-context:example",
  "record_kind": "ag_work_resume_imported_context",
  "schema": "augnes.ag_work_resume_imported_context.v0_1",
  "status": "review_metadata",
  "mapping_id": "ag-resume-confirmed-mapping:example",
  "foreign_scope": "project:source",
  "foreign_work_id": "AG-FOREIGN-1",
  "local_scope": "project:augnes",
  "local_work_id": "AG-LOCAL-1",
  "packet_id": "resume-packet:example",
  "packet_hash": "sha256:example",
  "source_runtime_instance_id": "runtime-instance:source",
  "imported_summary": "Bounded summary for review.",
  "imported_expected_files": [],
  "imported_expected_checks": [],
  "foreign_refs_summary": {},
  "redaction_report": {
    "secrets_included": false,
    "raw_db_paths_included": false,
    "session_payloads_included": false,
    "proof_payloads_included": false
  },
  "created_by": "user-core:reviewer",
  "import_reason": "User/Core selected this bounded packet summary for local review.",
  "created_at": "2026-06-01T00:00:00.000Z",
  "authority_boundary": {
    "review_metadata_only": true,
    "confirmed_mapping_required": true,
    "proof_recorded": false,
    "evidence_recorded": false,
    "session_bound": false,
    "codex_executed": false,
    "approval_granted": false,
    "merge_authority": false
  }
}
```

`import_id` is not `mapping_id`, not `proposal_id`, and not a proof/evidence
id. `mapping_id` is required traceability to an existing active confirmed
mapping. `import_reason` records why user/Core created or imported this
bounded review metadata. It is review context only and does not grant
approval, publish, retry, replay, merge, proof/evidence, session, Codex, work
item, or committed state authority. Packet identity fields for review traceability only:
`packet_id`, `packet_hash`, and `source_runtime_instance_id`.

## Constraints

Intended future constraints:

- Confirmed mapping must exist and be active.
- Imported context must require `mapping_id`.
- Imported context must require a validated source packet identity.
- `packet_id` and `packet_hash` must match reviewed and expected source
  context.
- `foreign_scope`, `foreign_work_id`, `local_scope`, and `local_work_id` must
  match the active confirmed mapping.
- Imported context must not create work items.
- Imported context must not create work events.
- Imported context must not mutate confirmed mapping rows.
- Imported context must not mutate proposal rows.
- Imported context must not record proof/evidence.
- Imported context must not bind sessions.
- Imported context must not start Codex.
- Imported context must not grant approval, merge, publish, retry, or replay.
- Raw secrets must be excluded.
- Raw local DB paths must be excluded.
- Raw session payloads must be excluded.
- Raw proof payloads must be excluded.

No constraint in this section creates schema, migration, helper, route, UI, or
runtime behavior in this PR.

## Relationship To Confirmed Mapping

Confirmed mapping is an identity association. Imported context is bounded
review metadata derived from a validated packet after that identity association
exists. The two records have different purposes, different authority
boundaries, and must remain separate user/Core-gated stages.

A future imported context record may reference a confirmed mapping for
traceability. Creating imported context must not update, supersede, withdraw,
or revoke a confirmed mapping. Confirmed mapping lifecycle remains separate.

## Authority Boundary

- Imported context is review metadata only.
- Imported context requires an active confirmed mapping.
- Imported context is not proof/evidence.
- Imported context is not session binding.
- Imported context is not Codex execution or continuation.
- Imported context is not committed state authority.
- Imported context is not approval.
- Imported context is not merge, publish, retry, or replay authority.
- Imported context does not create work items or work events.
- Imported context does not mutate confirmed mapping rows.
- Imported context does not mutate proposal rows.
- Imported context does not reconcile foreign proof/evidence/session refs as
  local records.
- Durable approval remains user/Core gated.

## Non-Goals

- No schema/migration.
- No writer/helper/route/UI.
- No imported context DB table.
- No import row creation.
- No Cockpit UI.
- No ChatGPT App card.
- No MCP/App schema.
- No bridge tool.
- No proof/evidence/session reconciliation.
- No Codex continuation.
- No Direct Resume Code.
- No relay.
- No telemetry/analytics/browser persistence.
- No localStorage, sessionStorage, or indexedDB persistence.
- No work item creation.
- No work event creation.
- No approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation.

## Future PR Sequence

1. Imported context design only: this PR.
2. Imported context DB/schema design:
   `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md`.
3. Imported context schema implementation:
   `docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md`.
4. Imported context writer/helper.
5. Imported context route.
6. Imported context read helper/route.
7. Cockpit review UI, only if separately approved.
8. Proof/evidence/session/Codex gates remain separate.

Each future PR must restate the authority boundary and prove it does not grant
unscoped downstream authority.

## Browser Verification

browser verification skipped: no rendered UI/operator surface changed in this design-only imported context slice

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-imported-context-db-schema
npm run smoke:ag-work-resume-imported-context-db-schema-design
npm run smoke:ag-work-resume-imported-context-record-design
npm run smoke:ag-work-resume-confirmed-mapping-create-cockpit-panel
npm run smoke:ag-work-resume-confirmed-mapping-read-cockpit-panel
npm run smoke:ag-work-resume-confirmed-mapping-read
npm run smoke:ag-work-resume-confirmed-mapping-route
npm run smoke:ag-work-resume-confirmed-mapping-writer
npm run smoke:ag-work-resume-mapping-import-authority-gate
git diff --check
git diff --cached --check
node --check scripts/smoke-ag-work-resume-imported-context-record-design.mjs
```
