# AG Work Resume Mapping Proposal Record Writer v0.1

## Purpose

This document records the first Stage B AG Resume mapping proposal record
writer. The slice adds a shared writer core, local helper, and JSON write route
for creating proposal-only rows in `ag_work_resume_mapping_proposals`.

The writer creates only `proposed` or `needs_review` proposal records. A
proposal record is not mapping confirmation, not import authorization, not
proof/evidence authorization, not session binding, not Codex execution
authority, and not merge/publish authority.

## Relationship To Existing Pieces

- Mapping/import authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` keeps proposal
  record creation, confirmed mapping, import, proof/evidence, session binding,
  and Codex continuation as separate stages.
- Stage B record design:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_DESIGN_V0_1.md` defines the
  proposal-only record shape and non-authority rules this writer follows.
- DB/schema implementation:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_DB_SCHEMA_IMPLEMENTATION_V0_1.md`
  documents the table and active-proposal partial unique index used here.
- Stage B lifecycle actions design:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md`
  documents design-only future withdraw, reject, supersede, and expire
  semantics. This writer still only inserts proposal rows and does not update,
  withdraw, reject, supersede, expire, confirm, or import.
- Stage B lifecycle action helper:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md`
  documents the separately scoped helper for existing proposal lifecycle/review
  metadata updates. This writer remains proposal creation only and still does
  not confirm mappings, import context, record proof/evidence, bind sessions,
  execute Codex, approve, publish, retry, replay, or merge.
- Stage A mapping proposal preview route and panel:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_ROUTE_V0_1.md` and
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_COCKPIT_PANEL_V0_1.md`
  remain preview surfaces. This PR adds no Cockpit UI and does not change the
  preview route behavior.

## Shared Writer Core

`lib/ag-work-resume-mapping-proposal-record.ts` exports
`createAgWorkResumeMappingProposalRecord`.

The shared writer core:

- validates the input shape
- requires strict packet preflight
- generates a strict mapping proposal preview
- requires an explicit `selected_candidate_id`
- requires the selected candidate to be present in `candidates`
- requires `proposed_by`
- requires `proposal_reason`
- allows only `proposed` or `needs_review`
- validates `expires_at` as omitted, `null`, or a future ISO timestamp
- rejects `needs_candidate`, `conflict`, and `blocked` preview statuses
- computes packet and preview hashes
- computes a deterministic proposal-specific `proposal_id`
- inserts one row into `ag_work_resume_mapping_proposals` in a transaction
- relies on the DB partial unique index to reject duplicate active proposals
- does not overwrite or update existing rows

## Local Helper

`scripts/ag-work-resume-mapping-proposal-record-create.mjs` reads input from:

1. `AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_INPUT`
2. `--file <path>`
3. stdin

Flags:

- `--json`
- `--help`
- `--file <path>`

The helper prints one JSON object to stdout and writes failure summaries to
stderr. It exits zero only when a proposal record is created. It never calls a
route, network, GitHub, OpenAI, browser, proof/evidence helper, session helper,
work-item writer, import writer, confirmed mapping writer, or Codex execution
path.

## Write Route

`POST /api/ag-work-resume/mapping-proposal-records`

The route accepts JSON request bodies only and delegates creation to the shared
writer core.

## Input Body

```json
{
  "packet": { "...": "AG Resume Packet v0.2" },
  "candidates": [
    {
      "candidate_id": "local-candidate-1",
      "local_scope": "project:augnes",
      "local_work_id": "AG-LOCAL-1",
      "title": "Local work title",
      "status": "in_progress",
      "next_action": "Review mapping proposal",
      "related_state_keys": []
    }
  ],
  "selected_candidate_id": "local-candidate-1",
  "proposed_by": "user-core",
  "proposal_reason": "User/Core requested a durable proposal for later review.",
  "status": "proposed",
  "expires_at": null,
  "source": {
    "reviewed_by_surface": "route",
    "reviewed_at": "2026-05-31T00:00:00.000Z"
  }
}
```

## Output Shape

The writer result includes:

- `ok`
- `status`
- `proposal_id`
- `record`
- `preflight`
- `preview`
- `warnings`
- `failures`
- `authority_boundary`
- `recommended_next_step`

Route output wraps the writer result:

```json
{
  "ok": true,
  "route": "ag_work_resume_mapping_proposal_records.v0_1",
  "result": {},
  "recommended_next_step": "User/Core should review the proposal record. This is not mapping confirmation, import authorization, or Codex execution authority."
}
```

Helper output wraps the same writer result:

```json
{
  "ok": true,
  "helper": "ag_work_resume_mapping_proposal_record_create.v0_1",
  "input_mode": "env",
  "result": {},
  "recommended_next_step": "User/Core should review the proposal record. It is not mapping confirmation, import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority."
}
```

## Status Codes And Exit Codes

Route status codes:

- 201: proposal record created
- 400: invalid JSON or malformed input
- 422: strict preflight failed
- 422: preview status is `needs_candidate` or `blocked`
- 409: preview status is `conflict`
- 409: duplicate active proposal
- 500: unexpected DB error

Helper exit codes:

- 0: proposal record created
- non-zero: invalid input, preflight failure, preview not creatable, duplicate
  active proposal, or DB error

## Validation Rules

- Strict packet preflight is required.
- Generated strict mapping proposal preview is required.
- `selected_candidate_id` must be explicit.
- The selected candidate must be present in the candidate list.
- `proposed_by` is required.
- `proposal_reason` is required and remains free text.
- `status` may be omitted, `proposed`, or `needs_review`.
- `expires_at` may be omitted, `null`, or a future ISO UTC timestamp.
- Preview statuses `blocked`, `conflict`, and `needs_candidate` are rejected.
- Duplicate active proposals are rejected by the DB partial unique index.

## DB Behavior

- Inserts only into `ag_work_resume_mapping_proposals`.
- Uses a DB transaction for the insert and readback.
- Does not overwrite existing proposal rows.
- Does not update existing proposal rows.
- Does not write other tables.
- Does not create confirmed mapping rows.
- Does not create import rows.
- Does not create work items or work events.
- Does not create proof/evidence rows.
- Does not bind sessions.

## Authority Boundary

- Proposal record creation only.
- Not confirmed mapping.
- Not import.
- Not proof/evidence.
- Not session binding.
- Not Codex execution.
- Not approval, publish, retry, replay, merge, auto-merge, external posting, or
  committed-state mutation beyond proposal-only rows.

The writer result authority boundary sets `proposal_record_created: true` only
when a proposal row is inserted. It always keeps confirmed mapping, import,
work item, proof, evidence, session, Codex, approval, publish/retry/replay, and
merge authority flags false.

Durable approval remains user/Core gated.

## Non-Goals

- No Cockpit UI.
- No confirmed mapping.
- No import record.
- No imported resume context.
- No work item.
- No proof/evidence/session behavior.
- No Direct Resume Code.
- No relay.
- No ChatGPT App card.
- No MCP/App tool schema change.
- No bridge tool.
- No localStorage, sessionStorage, indexedDB, telemetry, or analytics.

## Read Surface

`docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md` documents the first
read-only helper and route for listing/fetching proposal records. It performs
no writes and still grants no confirmed mapping, import, proof/evidence,
session, Codex, approval, publish, retry, replay, or merge authority.

## Future Note

Cockpit UI for reviewing proposal records can be separately scoped later.
Confirmed mapping remains Stage C and must use a separate user/Core-gated
design and implementation.

The Stage C confirmed mapping record design is documented in
`docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md`; it is
design-only and adds no schema, migration, writer, helper, route, UI, import,
proof/evidence, session, Codex, approval, publish, retry, replay, or merge
authority.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-mapping-proposal-record-writer
npm run smoke:ag-work-resume-mapping-proposal-db-schema
npm run smoke:ag-work-resume-mapping-proposal-db-schema-design
npm run smoke:ag-work-resume-mapping-proposal-record-design
npm run smoke:ag-work-resume-mapping-proposal-preview-cockpit-panel
npm run smoke:ag-work-resume-mapping-proposal-preview-route
npm run smoke:ag-work-resume-mapping-proposal-preview-helper
npm run smoke:ag-work-resume-mapping-proposal-preview
npm run smoke:ag-work-resume-mapping-import-authority-gate
npm run smoke:ag-work-resume-target-preview-cockpit-panel
npm run smoke:ag-work-resume-target-preview-route
npm run smoke:ag-work-resume-target-preview-helper
npm run smoke:ag-work-resume-target-preview
npm run smoke:ag-work-resume-packet-builder-preview
npm run smoke:ag-work-resume-packet-preflight
npm run smoke:codex-handoff-preflight
npm run smoke:chatgpt-work-contract-card
npm run smoke:current-runtime-codex-handoff-contract
npm run smoke:current-runtime-dogfood-readiness
git diff --check
node --check scripts/ag-work-resume-mapping-proposal-record-create.mjs
node --check scripts/smoke-ag-work-resume-mapping-proposal-record-writer.mjs
```

Also run `db:reset` and `db:migrate` against an isolated temp DB path. Do not
run writer or schema verification against the developer's real local DB.

Browser verification is skipped for this slice with:

```text
browser verification skipped: no rendered UI/operator surface changed in this Stage B writer route/helper slice
```
