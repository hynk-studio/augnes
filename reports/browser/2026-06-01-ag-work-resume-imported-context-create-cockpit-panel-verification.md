# AG Resume imported context create Cockpit panel verification

Date: 2026-06-01

Browser: Codex in-app Browser

Route under test: `POST /api/ag-work-resume/imported-contexts`

Result: passed

## Setup

- Isolated temp DB: `/tmp/augnes-ag-resume-imported-context-create-cockpit-panel.db`
- Reset/migrated temp DB with `AUGNES_DB_PATH` pointed at the temp file.
- Seeded local work, proposal rows, an active confirmed mapping, and an
  inactive confirmed mapping through existing AG Resume packet/proposal and
  confirmed mapping helpers before opening Cockpit.
- Active mapping:
  `ag-resume-confirmed-mapping:a57e476df4b547f17498c5ea`
- Inactive mapping:
  `ag-resume-confirmed-mapping:54c7f17122d5c816361bcedc`

## Browser Exercise

- Opened Cockpit at `http://localhost:3210/`.
- Opened the Operator tab.
- Confirmed the panel appears near the AG Resume imported context read panel.
- Exercised create from active confirmed mapping with the safe matching identity
  fixture.
- Exercised missing required local validation.
- Exercised malformed `created_at` local validation.
- malformed created_at local validation passed with the expected local error.
- Exercised unsafe redaction local validation with `{}` redaction metadata,
  which failed locally before POST.
- Exercised `mapping_not_found` route error.
- Exercised `mapping_not_active` route error.
- Exercised `mapping_mismatch` route error.
- Exercised clear after success and after route error.
- Accessibility/keyboard observation: native controls were reachable; labels
  and `aria-describedby` were present. Browser bulk text entry was limited by
  the in-app browser virtual clipboard, so keyboard character events were used
  for the malformed timestamp and unsafe redaction checks.

## Result Observations

Successful create rendered:

- HTTP status `201`
- route ok `true`
- writer status `created`
- import id `ag-resume-imported-context:56d10721067605bd5525c520`
- mapping id `ag-resume-confirmed-mapping:a57e476df4b547f17498c5ea`
- imported context review metadata card
- authority boundary with `review_metadata_only: true`,
  `imported_context_created: true`, and proof/evidence/session/Codex/merge
  authority false

Local validation rendered:

- missing required: `mapping_id is required for imported context create.`
- malformed `created_at`: `created_at must be an ISO UTC timestamp with
  millisecond precision.`
- unsafe redaction: `redaction_report must explicitly set secrets_included:
  false for imported context create.`

Route errors rendered:

- `mapping_not_found` with HTTP `404`
- `mapping_not_active` with HTTP `409`
- `mapping_mismatch` with HTTP `409`

## Network Proof

From create panel interactions, the dev server observed only:

```text
POST /api/ag-work-resume/imported-contexts 201
POST /api/ag-work-resume/imported-contexts 404
POST /api/ag-work-resume/imported-contexts 409
POST /api/ag-work-resume/imported-contexts 409
```

No `GET /api/ag-work-resume/imported-contexts` read-route call was observed
from the create panel. The panel source sends JSON content-type and a JSON body
containing only supported imported context route fields; it excludes `db` and
`now`.

Network proof: no GET read route call was made by the create panel.

Initial Cockpit page load still performed existing read-only app boot GETs for
state/work/perspective summaries. Those were not create panel submissions.

## DB Side-Effect Proof

Before browser create:

- `ag_work_resume_imported_contexts`: count `0`, hash
  `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`
- `ag_work_resume_confirmed_mappings`: count `2`, hash
  `cbaf782b39cd68895ed3465dbb3f2c05023af61c4b652589fa058a4322cda93c`
- `ag_work_resume_mapping_proposals`: count `2`, hash
  `49e3570c0cc759399d2b9a2654bb6b57029195363341ca3d652e28ef163c9aee`
- `work_items`: count `2`, hash
  `93eea6f811d7f808b18d1b56548e4c64c8c206a79b87e46815e871ceb9aaa6b1`
- `sessions`, `work_events`, `action_records`,
  `verification_evidence_records`: count `0`

After browser create and route-error exercises:

- `ag_work_resume_imported_contexts`: count `1`, hash
  `cf604f8c4f056561dcacb3e5b7aee664f8a684589939aba98f8759ebab988999`
- exactly one imported context row created:
  `ag-resume-imported-context:56d10721067605bd5525c520`
- `ag_work_resume_confirmed_mappings`: count `2`, hash unchanged
  `cbaf782b39cd68895ed3465dbb3f2c05023af61c4b652589fa058a4322cda93c`
- `ag_work_resume_mapping_proposals`: count `2`, hash unchanged
  `49e3570c0cc759399d2b9a2654bb6b57029195363341ca3d652e28ef163c9aee`
- `work_items`: count `2`, hash unchanged
  `93eea6f811d7f808b18d1b56548e4c64c8c206a79b87e46815e871ceb9aaa6b1`
- `sessions`, `work_events`, `action_records`,
  `verification_evidence_records`: count `0`

No proof/evidence/session/Codex side effects were created.

## Unauthorized Controls Scan

No unauthorized controls were present in the imported context create panel:

- no proof/evidence controls
- no session binding controls
- no Codex controls
- no work item/event controls
- no confirmed mapping/proposal mutation controls
- no approve, publish, retry, replay, or merge controls
- no Direct Resume Code, relay, bridge, or MCP/App controls

No unauthorized controls.
