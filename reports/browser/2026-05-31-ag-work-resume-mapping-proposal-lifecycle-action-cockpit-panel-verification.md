# Browser Verification: AG Resume Mapping Proposal Lifecycle Action Cockpit Panel

Date: 2026-05-31
Related PR: #306 draft
Branch: `codex/ag-resume-mapping-proposal-lifecycle-action-cockpit-panel`

## Environment

- App URL: `http://localhost:3126/?pr306LifecycleCockpit=1780229586327`
- DB: isolated temp DB at `/tmp/augnes-lifecycle-cockpit-LrU9oG/augnes.db`
- Seed method: five synthetic proposal records were created before browser
  testing through the existing Stage B proposal writer/core.
- Seeded records:
  - withdraw target: `ag-resume-mapping-proposal:14dbaabfa7e8585b16181284`
  - reject target: `ag-resume-mapping-proposal:0cd4f4bf115f41014c5d8491`
  - expire target: `ag-resume-mapping-proposal:a6c8a67d51a1426f135947d8`
  - supersede target: `ag-resume-mapping-proposal:94ac2e457834768783757a54`
  - supersede replacement: `ag-resume-mapping-proposal:c7188476bb0f24138b263d32`

## Render And Control Checks

- Opened Cockpit Operator tab.
- Confirmed `AG Resume Mapping Proposal Lifecycle Actions` renders after
  `AG Resume Mapping Proposal Record Review`.
- Confirmed the panel shows prominent authority-boundary copy that lifecycle
  updates are proposal review metadata only and not confirmed mapping, import,
  proof/evidence, session binding, Codex execution, approval, publish, retry,
  replay, or merge authority.
- Confirmed lifecycle controls are bounded to proposal id, lifecycle action,
  reviewed by, review note, optional reviewed at, optional replacement proposal
  id, fixture load buttons, clear, and apply.
- Confirmed no unauthorized controls or button labels for confirm mapping,
  import context, record evidence, bind session, execute Codex, approve,
  publish, retry, replay, or merge.

## Exercised Flows

- Withdraw lifecycle action: updated target from `proposed` to `withdrawn`.
- Reject lifecycle action: updated target from `needs_review` to `rejected`.
- Expire lifecycle action: updated target from `proposed` to `expired`.
- Supersede lifecycle action: updated target from `proposed` to `superseded`
  with `superseded_by_proposal_id` set to the existing replacement proposal id.
- Not-active route handling: attempted `reject` on the withdrawn proposal and
  received `not_active` with an alert:
  `Proposal record ... is withdrawn, not proposed or needs_review.`
- Missing field local validation: submitted the cleared form and saw
  `proposal_id is required for lifecycle action.` with `role="alert"`.
- Clear after success removed the prior result and error state.
- Clear after error removed the validation alert and left no result.
- Result region used `aria-live="polite"`.

## Network Inspection

The browser panel interactions produced only lifecycle route requests in the
dev server request log:

```text
POST /api/ag-work-resume/mapping-proposal-records/lifecycle-actions 200
POST /api/ag-work-resume/mapping-proposal-records/lifecycle-actions 409
POST /api/ag-work-resume/mapping-proposal-records/lifecycle-actions 200
POST /api/ag-work-resume/mapping-proposal-records/lifecycle-actions 200
POST /api/ag-work-resume/mapping-proposal-records/lifecycle-actions 200
```

- Network inspection confirmed only POST /api/ag-work-resume/mapping-proposal-records/lifecycle-actions
  was called by the lifecycle panel.
- The local validation case produced no additional POST.
- No lifecycle-panel calls were made to proposal writer, proposal read, work,
  evidence, proof, session, Codex, import, Direct Resume Code, relay,
  approval, publication, bridge, or MCP/App routes.
- Source guard for the rendered panel request confirms JSON content-type
  `application/json` and a JSON request body built only from supported
  lifecycle fields.

Baseline Cockpit page load still made its normal read-only summary GET calls
outside this panel; those were not triggered by lifecycle action controls.

## DB Proof

After all browser interactions:

- `ag_work_resume_mapping_proposals` proposal row count unchanged: `5`.
- The not-active attempt did not change the withdrawn target beyond the
  original withdraw lifecycle metadata.
- Replacement row unchanged:
  - status remained `proposed`
  - `reviewed_by`, `reviewed_at`, `review_note`, and
    `superseded_by_proposal_id` remained `null`
  - `updated_at` remained its seeded value
- Target lifecycle rows changed only expected lifecycle/review fields:
  `status`, `reviewed_by`, `reviewed_at`, `review_note`, `updated_at`, and for
  supersede only `superseded_by_proposal_id`.
- Protected table counts unchanged:
  - `sessions`: `0`
  - `work_items`: `0`
  - `work_events`: `0`
  - `action_records`: `0`
  - `verification_evidence_records`: `0`
- Confirmed mapping, import, and imported-context tables remained absent:
  - `ag_work_resume_confirmed_mappings`: absent
  - `ag_work_resume_mapping_imports`: absent
  - `ag_work_resume_imports`: absent
  - `ag_work_resume_imported_contexts`: absent
  - `ag_work_resume_mapping_imported_contexts`: absent

## Authority Boundary

PASS. The Cockpit panel calls only the existing lifecycle action route and
updates proposal lifecycle/review metadata only. It creates no proposals,
creates no replacement proposals, creates or confirms no mappings, imports no
context, records no proof/evidence, binds no sessions, executes no Codex,
grants no approval, publish, retry, replay, or merge authority, and adds no
schema, migration, ChatGPT App card, MCP/App schema, bridge tool, telemetry,
analytics, localStorage, sessionStorage, indexedDB, Direct Resume Code, or
relay behavior.
