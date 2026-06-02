# AG Resume proof/evidence recording Cockpit gate browser verification

Date: 2026-06-02

Result: passed

## Scope

Verified the AG Resume proof/evidence recording Cockpit gate in the Codex in-app Browser against `http://localhost:3138/` using a temporary SQLite database at `/tmp/augnes-proof-evidence-recording-cockpit-browser.db`.

The verification covered the Operator tab panel only. It did not use the real runtime database, did not add runtime routes, and did not modify route/helper/schema behavior.

## Browser surface

- Opened the Operator tab.
- Confirmed the `AG Resume Proof/Evidence Recording Gate` panel appears near the AG Resume proof/evidence reconciliation candidate lifecycle/read panels.
- Confirmed visible boundary copy:
  - `accepted_for_future_recording is not proof/evidence recording.`
  - `Route success is not broader approval.`
  - `Actual recording requires exact user/Core approval for this attempt.`
  - `This UI calls only POST /api/ag-work-resume/proof-evidence-recordings and must not weaken route/helper validation.`
- Confirmed required controls and keyboard flow for `candidate_id`, `import_id`, `mapping_id`, `user_core_approval`, `actor`, `reason`, `redaction_summary`, `trust_provenance_label`, `local_target_scope`, `local_target_work_id`, `expected_idempotency_key`, checkbox, and typed confirmation phrase.

## Local validation

- `Load safe fixture (not approval)` populated fixture fields but left the checkbox unchecked and the typed confirmation phrase blank.
- Missing approval/checkbox/typed confirmation failed before submit with `Exact user/Core approval checkbox is required for proof/evidence recording.`
- Invalid approval JSON failed before submit with `user_core_approval JSON is not valid JSON`.
- Invalid redaction JSON failed before submit with `redaction_summary JSON is not valid JSON`.
- Unsupported or forbidden advanced JSON failed before submit with `redaction_summary JSON includes forbidden field redaction_summary JSON.publish.`
- Clear/reset behavior cleared inputs, JSON textareas, errors, checkbox, typed phrase, and result state.
- After local validation and clear/reset, `verification_evidence_records` remained `0` and `ag_work_resume_proof_evidence_recording_links` remained `0`.

## Route submit

The approved submit used the visible submit button `Record verification evidence` and called `POST /api/ag-work-resume/proof-evidence-recordings`.

Recorded result:

- HTTP status: `201`
- Route result: `recorded`
- `evidence_id`: `evidence:ag-resume-recording:d10e27bc9a382051482c835e`
- `recording_link_id`: `ag-resume-proof-evidence-recording-link:d10e27bc9a382051482c835e`
- `candidate_id`: `ag-resume-proof-evidence-reconciliation-candidate:cockpit-recording-safe-001`
- `target_record_kind`: `verification_evidence`
- `idempotency_key`: `actual-proof-evidence-recording:v0_1:ag-resume-proof-evidence-reconciliation-candidate:cockpit-recording-safe-001:ag-resume-imported-context:cockpit-recording-safe-001:ag-resume-confirmed-mapping:cockpit-recording-safe-001:proof:proof:foreign-public-safe:recording-cockpit-001:project:augnes:AG-COCKPIT-RECORDING-001:verification_evidence`

DB side-effect proof after recorded submit:

- `verification_evidence_records`: `0 -> 1`
- `ag_work_resume_proof_evidence_recording_links`: `0 -> 1`
- `action_records`: `0 -> 0`
- `sessions`: `0 -> 0`
- `work_events`: `0 -> 0`
- `work_items`: `1 -> 1`
- `ag_work_resume_imported_contexts`: `1 -> 1`
- `ag_work_resume_confirmed_mappings`: `1 -> 1`
- `ag_work_resume_mapping_proposals`: `1 -> 1`
- `ag_work_resume_proof_evidence_reconciliation_candidates`: `1 -> 1`

Protected table counts unchanged outside the two allowed insert tables. Source row statuses and `updated_at` values stayed unchanged for the work item, imported context, confirmed mapping, mapping proposal, and reconciliation candidate.

## Idempotent repeat

Submitting the same approved request again returned:

- HTTP status: `200`
- Route result: `idempotent_no_new_write`
- Existing `evidence_id`: `evidence:ag-resume-recording:d10e27bc9a382051482c835e`
- Existing `recording_link_id`: `ag-resume-proof-evidence-recording-link:d10e27bc9a382051482c835e`

DB counts after idempotent repeat stayed:

- `verification_evidence_records`: `1`
- `ag_work_resume_proof_evidence_recording_links`: `1`
- `action_records`: `0`
- `sessions`: `0`
- `work_events`: `0`
- Protected table counts unchanged.

## Failure path

Submitting with an incorrect `expected_idempotency_key` returned:

- HTTP status: `403`
- Route result: `unauthorized_attempt`
- Failure text was public-safe bounded failure text.
- Recommended next step was bounded to re-reading the candidate and approving the exact derived idempotency key.
- No UI authority was gained.

DB counts after the failure path stayed:

- `verification_evidence_records`: `1`
- `ag_work_resume_proof_evidence_recording_links`: `1`
- `action_records`: `0`
- `sessions`: `0`
- `work_events`: `0`
- Protected table counts unchanged.

## Clear/reset and persistence

After route attempts, clear/reset behavior removed form values, JSON payloads, checkbox state, typed phrase, errors, and the rendered result. DB counts did not change. `localStorage` and `sessionStorage` remained empty, and no approval JSON persistence was observed.

## Unauthorized controls scan

The panel exposed exactly these buttons:

- `Load safe fixture (not approval)`
- `Clear proof/evidence recording inputs`
- `Record verification evidence`

No forbidden controls were present for Direct Resume Code, relay, hosted transfer, session binding, Codex execution/continuation, work item/event creation, action record creation, approval, publish, retry, replay, merge, auto-merge, external posting, or source-row mutation.

## Network proof

The browser submit reached the route surface that rendered `POST /api/ag-work-resume/proof-evidence-recordings`, produced route result payloads, and created exactly the route/helper-owned `verification_evidence_records` and `ag_work_resume_proof_evidence_recording_links` rows in the temp DB.

Dev server route trace:

- `POST /api/ag-work-resume/proof-evidence-recordings 201`
- `POST /api/ag-work-resume/proof-evidence-recordings 200`
- `POST /api/ag-work-resume/proof-evidence-recordings 403`

The source smoke additionally guards that the Cockpit panel contains exactly one `fetch` call and that it targets only `AG_RESUME_PROOF_EVIDENCE_RECORDING_ROUTE`.

No external network/fetch beyond the local route was added by this UI slice.

## Authority boundary

- `accepted_for_future_recording` is not proof/evidence recording.
- Route success is not broader approval.
- Actual recording requires exact user/Core approval for this attempt.
- The UI calls only `POST /api/ag-work-resume/proof-evidence-recordings` and must not weaken route/helper validation.
- The recorded path creates exactly one `verification_evidence_records` row and one `ag_work_resume_proof_evidence_recording_links` row through the existing route/helper.
- The idempotent path creates no duplicate rows.
- The failure path creates no new rows and shows only public-safe bounded failure text.
- No action record, session binding, Codex execution/continuation, work item/event, source row mutation, approval, publish, retry, replay, merge, auto-merge, external posting, Direct Resume Code, relay, hosted transfer, or committed-state authority was added.
