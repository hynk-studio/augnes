# AG Resume proof/evidence reconciliation candidate create Cockpit panel verification

Date: 2026-06-01

Browser: Codex in-app Browser

Result: passed

## Environment

- App URL: `http://127.0.0.1:3011/`
- Temp DB: `/tmp/augnes-candidate-create-browser-aQAEjZ/augnes.db`
- The DB was reset/migrated outside the repo.
- Seed used existing AG Resume packet, proposal, confirmed mapping, and
  imported context helpers.
- One imported context fixture was marked `revoked` after seed to exercise the
  `imported_context_not_allowed` route error.

## Exercised Cases

- create from active imported context
- omitted mapping_id derives from imported context
- explicit matching mapping_id exercised with duplicate candidate guard
- missing required local validation
- malformed created_at local validation
- unsafe redaction local validation
- imported_context_not_found
- imported_context_not_allowed
- imported_context_mismatch
- duplicate_candidate
- clear after success/error
- accessibility/keyboard observation with native controls and labels
- No unauthorized controls in the create panel

## Network Proof

Observed route calls from the create panel:

```text
POST /api/ag-work-resume/proof-evidence-reconciliation-candidates 201
POST /api/ag-work-resume/proof-evidence-reconciliation-candidates 409
POST /api/ag-work-resume/proof-evidence-reconciliation-candidates 404
POST /api/ag-work-resume/proof-evidence-reconciliation-candidates 409
POST /api/ag-work-resume/proof-evidence-reconciliation-candidates 409
```

The page boot also performed normal Cockpit read requests for shell data. No
`GET /api/ag-work-resume/proof-evidence-reconciliation-candidates` call was
observed from the create panel.

Static source guard verifies:

- JSON content-type
- supported body fields only
- no `db`
- no `now`
- no GET read route call
- no forbidden route calls

## DB Side-Effect Proof

After all browser cases:

```json
{
  "ag_work_resume_proof_evidence_reconciliation_candidates": 1,
  "ag_work_resume_imported_contexts": 2,
  "ag_work_resume_confirmed_mappings": 2,
  "ag_work_resume_mapping_proposals": 2,
  "work_items": 2,
  "sessions": 0,
  "work_events": 0,
  "action_records": 0,
  "verification_evidence_records": 0
}
```

Exactly one candidate row created only on successful create:

```text
candidate_id: ag-resume-proof-evidence-reconciliation-candidate:fc9783f3334b9349818429c5
status: proposed
import_id: ag-resume-imported-context:ce7087ec20484c5db61f10b2
mapping_id: ag-resume-confirmed-mapping:26869698d315bc098296a29e
foreign_ref_type: proof
foreign_ref_id: proof:foreign-public-safe:browser-create-001
local_target_scope: project:augnes
local_target_work_id: AG-BROWSER-RECONCILIATION-CANDIDATE-ACTIVE-LOCAL
```

Imported context rows unchanged by panel actions:

- active row stayed `review_metadata`
- inactive fixture stayed `revoked`

Confirmed mapping rows unchanged by panel actions:

- both mapping rows stayed `active`

Source proposal rows unchanged by panel actions:

- both proposal rows stayed `proposed`

Local work rows unchanged by panel actions:

- both local work rows stayed `in_progress`

Protected tables stayed empty:

- `sessions`: 0
- `work_events`: 0
- `action_records`: 0
- `verification_evidence_records`: 0

No proof/evidence/session/Codex side effects were observed.

## Authority Boundary

The panel creates reconciliation candidate review metadata only through the
existing POST route. It does not record proof/evidence, bind sessions, execute
or continue Codex, create work items/events, mutate imported context rows,
mutate confirmed mapping rows, mutate proposal rows, approve, publish, retry,
replay, or merge.
