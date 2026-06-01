# AG Resume proof/evidence reconciliation candidate read Cockpit panel verification

Date: 2026-06-01

Surface: Cockpit Operator panel in `components/augnes-cockpit.tsx`

Route under test:

```text
GET /api/ag-work-resume/proof-evidence-reconciliation-candidates
```

Tooling: Codex in-app Browser against `http://localhost:3010` with isolated
temp DB `/tmp/augnes-reconciliation-candidate-read-cockpit-x3GoNf/augnes.db`.

## Fixture

The isolated temp DB was reset and migrated, then seeded before opening
Cockpit with:

- one local work item
- one AG Resume mapping proposal
- one active confirmed mapping
- one imported context row
- two reconciliation candidate rows

Candidate rows were created through the existing reconciliation candidate
writer helper/core. The reviewed fixture row was marked reviewed for the
`reviewed_by` list exercise.

## Exercised Reads

- `candidate_id` fetch: returned the seeded candidate card and read authority
  boundary.
- `import_id` list: returned candidate review metadata for the seeded import.
- `mapping_id` list: returned candidate review metadata for the seeded
  mapping.
- `foreign_ref_type` plus `foreign_ref_id` list: used the safe foreign ref
  fixture button and returned candidate review metadata.
- `local_target_scope` plus `local_target_work_id` list: returned candidate
  review metadata for the local target tuple.
- `status` list: used the safe status fixture button and returned proposed
  candidate review metadata.
- `proposed_by` list: used the safe proposer fixture button and returned
  candidate review metadata.
- `reviewed_by` list: used the safe reviewer fixture button and returned the
  reviewed candidate row.
- `not_found`: `candidate_id=ag-resume-proof-evidence-reconciliation-candidate:not-found-browser`
  returned route error text for not found.

Local validation covered:

- `foreign_ref_id` without `foreign_ref_type` showed
  `foreign_ref_type and foreign_ref_id must be supplied together.`
- `candidate_id` with `limit` showed
  `candidate_id fetch must not be combined with list filters or limit.`
- Clear after success/error returned the panel to `No reconciliation candidate
  read yet.`

## Network Proof

Panel-triggered route calls observed in the local dev server log were only:

```text
GET /api/ag-work-resume/proof-evidence-reconciliation-candidates?candidate_id=...
GET /api/ag-work-resume/proof-evidence-reconciliation-candidates?import_id=...&limit=20
GET /api/ag-work-resume/proof-evidence-reconciliation-candidates?mapping_id=...&limit=20
GET /api/ag-work-resume/proof-evidence-reconciliation-candidates?foreign_ref_type=proof&foreign_ref_id=...&limit=20
GET /api/ag-work-resume/proof-evidence-reconciliation-candidates?local_target_scope=project%3Aaugnes&local_target_work_id=...&limit=20
GET /api/ag-work-resume/proof-evidence-reconciliation-candidates?status=proposed&limit=20
GET /api/ag-work-resume/proof-evidence-reconciliation-candidates?proposed_by=...&limit=20
GET /api/ag-work-resume/proof-evidence-reconciliation-candidates?reviewed_by=...&limit=20
GET /api/ag-work-resume/proof-evidence-reconciliation-candidates?candidate_id=ag-resume-proof-evidence-reconciliation-candidate%3Anot-found-browser
```

No panel-triggered POST occurred. The request body length was `0` for the read
route behavior, and no read call sent a JSON `Content-Type` header. No
proof/evidence, session, Codex, work mutation, imported context mutation,
confirmed mapping mutation, proposal mutation, approval, publication, bridge,
MCP/App, Direct Resume Code, or relay route was called by the panel actions.

The Cockpit shell performs existing read-only bootstrap requests on page load;
the panel actions above only targeted the reconciliation candidate GET route.

## DB Side-Effect Proof

Before and after panel reads:

- `ag_work_resume_proof_evidence_reconciliation_candidates`: `2` rows before,
  `2` rows after.
- Candidate row content unchanged: true.
- `ag_work_resume_imported_contexts`: `1` row before, `1` row after.
- `ag_work_resume_confirmed_mappings`: `1` row before, `1` row after.
- `ag_work_resume_mapping_proposals`: `1` row before, `1` row after.
- `work_items`: `1` row before, `1` row after.
- `sessions`: `0` rows before, `0` rows after.
- `work_events`: `0` rows before, `0` rows after.
- `action_records`: `0` rows before, `0` rows after.
- `verification_evidence_records`: `0` rows before, `0` rows after.

No proof/evidence/session/Codex side effects were created.

## Accessibility And Controls

Accessibility/keyboard observation:

- Native inputs/selects/buttons were used.
- Every input/select has a real `label`/`htmlFor` pairing.
- Every input/select has `aria-describedby`.
- Local/route errors render with `role="alert"`.
- Results render in an `aria-live="polite"` region.

No unauthorized controls were present. The panel did not expose create
candidate, record proof/evidence, bind session, execute Codex, create work
item, approve, publish, retry, replay, or merge controls.

Result: passed
