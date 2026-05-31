# AG Resume confirmed mapping create Cockpit panel browser verification

Date: 2026-06-01
Browser: Codex in-app Browser
Target: `http://localhost:3124/`
DB: `/tmp/augnes-confirmed-mapping-create-fixture-generation.db`

## Setup

- Ran the app with `AUGNES_DB_PATH` pointed at an isolated temp SQLite DB.
- Seeded three Stage B proposal rows:
  - proposed proposal:
    `ag-resume-mapping-proposal:0102d1483462498cff97c354`
  - needs_review proposal:
    `ag-resume-mapping-proposal:3babfff29022a5e82728a4f8`
  - local-work-missing proposal:
    `ag-resume-mapping-proposal:0c46a5f39aeea5585e11ecc9`
- Seeded two local work rows for the successful proposed and needs_review
  cases only.
- Initial DB counts:
  - `work_items`: 2
  - `ag_work_resume_mapping_proposals`: 3
  - `ag_work_resume_confirmed_mappings`: 0
  - `work_events`: 0
  - `action_records`: 0
  - `verification_evidence_records`: 0
  - `sessions`: 0

Screenshots:

- `/tmp/ag-resume-confirmed-mapping-create-cockpit-panel-initial.png`
- `/tmp/ag-resume-confirmed-mapping-create-cockpit-panel-proposed-created.png`
- `/tmp/ag-resume-confirmed-mapping-create-cockpit-panel-needs-review-created.png`
- `/tmp/ag-resume-confirmed-mapping-create-cockpit-panel-cleared.png`

## Browser Steps

- Scenario labels verified:
  - proposed proposal create
  - needs_review proposal create
  - missing required local validation
  - malformed `confirmed_at` local validation
  - duplicate_active_mapping
  - local_work_not_found
- Opened the Cockpit Operator tab and found exactly one AG Resume Confirmed
  Mapping Create panel.
- Loaded `Load safe proposed create fixture` and clicked
  `Create confirmed mapping`.
  - Result: HTTP 201, route ok, writer status `created`.
- Loaded `Load safe matching identity fixture` and clicked
  `Create confirmed mapping`.
  - Result: HTTP 409, writer status `duplicate_active_mapping`.
- Clicked `Clear confirmed mapping create inputs`.
  - Result: cleared error/result state and returned to empty create result.
- Loaded `Load safe needs_review create fixture` and clicked
  `Create confirmed mapping`.
  - Result: HTTP 201, route ok, writer status `created`.
- Clicked clear, then clicked `Create confirmed mapping` with empty inputs.
  - Result: missing required local validation:
    `source_proposal_id is required for confirmed mapping create.`
- Loaded `Load safe proposed create fixture`, changed `confirmed_at` to
  `2026-06-01T00:10:00Z`, and clicked `Create confirmed mapping`.
  - Result: malformed `confirmed_at` local validation:
    `confirmed_at must be an ISO UTC timestamp with millisecond precision.`
- Loaded `Load safe local work missing fixture` and clicked
  `Create confirmed mapping`.
  - Result: HTTP 404, writer status `local_work_not_found`.
- Clicked `Clear confirmed mapping create inputs`.
  - Result: cleared error/result state and returned to empty create result.

## Network Proof

The create panel actions called:

`POST /api/ag-work-resume/confirmed-mappings`

Observed server log lines from the clean run:

```text
POST /api/ag-work-resume/confirmed-mappings 201
POST /api/ag-work-resume/confirmed-mappings 409
POST /api/ag-work-resume/confirmed-mappings 201
POST /api/ag-work-resume/confirmed-mappings 404
```

The create panel made no GET read route call and no
`GET /api/ag-work-resume/confirmed-mappings` read route call during the create
flow. Baseline Cockpit page-load reads were limited to the existing
non-confirmed-mapping dashboard endpoints.

Static source guards in
`scripts/smoke-ag-work-resume-confirmed-mapping-create-cockpit-panel.mjs`
verify the browser-facing create request uses `content-type: application/json`,
`JSON.stringify(requestBody)`, exactly one create-panel `fetch`, supported body
fields only, and no `db` or `now` body fields.

Supported body fields rendered/guarded:

- `source_proposal_id`
- `foreign_scope`
- `foreign_work_id`
- `local_scope`
- `local_work_id`
- `packet_id`
- `packet_hash`
- `source_runtime_instance_id`
- `confirmed_by`
- `confirmation_reason`
- `confirmed_at`

## DB Proof

Final DB counts:

- `work_items`: 2
- `ag_work_resume_mapping_proposals`: 3
- `ag_work_resume_confirmed_mappings`: 2
- `work_events`: 0
- `action_records`: 0
- `verification_evidence_records`: 0
- `sessions`: 0

Created confirmed mapping rows:

- `ag-resume-confirmed-mapping:a20071125874672c16ad872a`
  - source proposal:
    `ag-resume-mapping-proposal:0102d1483462498cff97c354`
  - foreign identity:
    `project:foreign/AG-FIXTURE-CONFIRMED-CREATE-PROPOSED-001`
  - local identity:
    `project:augnes/AG-FIXTURE-CONFIRMED-CREATE-LOCAL-PROPOSED-001`
  - packet id:
    `resume-packet:preview:project-foreign:AG-FIXTURE-CONFIRMED-CREATE-PROPOSED-001`
  - packet hash:
    `sha256:641d5ee85e2e12c0a81d27b928d5d260f52dac893642423766cca2da3e62d912`
- `ag-resume-confirmed-mapping:988837d08cadb209ed20b5dd`
  - source proposal:
    `ag-resume-mapping-proposal:3babfff29022a5e82728a4f8`
  - foreign identity:
    `project:foreign/AG-FIXTURE-CONFIRMED-CREATE-NEEDS-REVIEW-001`
  - local identity:
    `project:augnes/AG-FIXTURE-CONFIRMED-CREATE-LOCAL-NEEDS-REVIEW-001`
  - packet id:
    `resume-packet:preview:project-foreign:AG-FIXTURE-CONFIRMED-CREATE-NEEDS-REVIEW-001`
  - packet hash:
    `sha256:42cf8c32fefbf55c1d37add7336a92ef420a7ddad434094f3b8c91bc4b601c85`

The source proposal rows remained at their seeded statuses:

- proposed
- proposed for the local-work-missing route-error fixture
- needs_review

No local work rows were added by the create panel. The local-work-missing route
error did not insert a confirmed mapping row.

The forbidden import/imported-context tables remained absent:

- `ag_work_resume_imports`: absent
- `ag_work_resume_imported_contexts`: absent

No import, imported context, proof/evidence, session, or Codex side effects
were created.

## Accessibility And Controls

- All create inputs and the confirmation textarea had `label` / `htmlFor`
  associations.
- Inputs exposed `aria-describedby` helper text.
- Local and route errors rendered through the panel alert region.
- The result surface uses a polite live region when a create result is present.
- Native buttons were used; no custom `role="button"` controls were present.
- No unauthorized controls were present.

Allowed buttons observed:

- `Load safe proposed create fixture`
- `Load safe matching identity fixture`
- `Load safe needs_review create fixture`
- `Load safe local work missing fixture`
- `Clear confirmed mapping create inputs`
- `Create confirmed mapping`

No import/imported context/proof/evidence/session/Codex/approval/publish/
retry/replay/merge/Direct Resume Code/relay controls were present.

## Result

Result: passed
