# Browser verification report for: AG Resume mapping proposal record read Cockpit panel

## Related PR

- PR: #302
- Work ID: none; proposal record read verification used safe synthetic fixture data only
- Handoff ID: none
- Related state keys: coordination.ag_resume_mapping

## Date

- Date: 2026-05-31
- Timezone: Asia/Seoul
- Local verification time: 2026-05-31 KST

## Verifier / Surface

- Verifier: Codex
- Verification surface: Codex in-app Browser
- Target UI surface: Cockpit Operator tab, AG Resume Mapping Proposal Record Review panel

## Environment

- Repository branch: `codex/ag-resume-mapping-proposal-record-cockpit-panel`
- Browser or runtime: Codex in-app Browser against local Next dev server
- Local runtime DB: `/tmp/augnes-ag-resume-mapping-proposal-record-read-cockpit-panel.db`
- Seeded synthetic proposal id: `ag-resume-mapping-proposal:fixture-cockpit-read-001`
- Screenshot artifact: `/tmp/ag-resume-mapping-proposal-record-read-cockpit-panel.png`

## Local Startup

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-mapping-proposal-record-read-cockpit-panel.db npm run db:reset`
- Result: passed
- Notes: Created an isolated temporary local DB for browser verification only.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-mapping-proposal-record-read-cockpit-panel.db npm run db:migrate`
- Result: passed
- Notes: Confirmed migrations were applied.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-mapping-proposal-record-read-cockpit-panel.db npm run demo:seed`
- Result: passed
- Notes: Seeded demo local state for Cockpit page loading.

- Command: `scripts/ag-work-resume-mapping-proposal-record-create.mjs --file /tmp/augnes-ag-resume-mapping-proposal-record-read-cockpit-panel-input.json`
- Result: passed
- Notes: Used the existing Stage B writer once before UI verification to create a synthetic proposal row in the temp DB. The Cockpit panel itself performed no writes.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-mapping-proposal-record-read-cockpit-panel.db NEXT_TELEMETRY_DISABLED=1 npm run dev -- --port 3118`
- Result: passed
- Notes: Served Cockpit at `http://localhost:3118`.

## Views Checked

- URL or app surface: `http://localhost:3118`
- Cockpit tab or widget/card: Operator tab, AG Resume Mapping Proposal Record Review panel
- View state inspected: initial empty state, status list result, foreign work list result, proposal_id fetch result, not-found result, local validation error, clear interaction, accessibility/keyboard observation, and unauthorized-control scan

## Browser Checks Run

- Command: Browser DOM inspection after opening Operator tab
- Result: passed
- Notes: Confirmed `AG Resume Mapping Proposal Record Review` renders after the mapping proposal preview panel with the read-only boundary copy, proposal id input, foreign work inputs, candidate local work inputs, status menu, limit input, safe fixture buttons, clear button, and `Read proposal records`.

- Command: Browser status list result
- Result: passed
- Notes: Clicked `Load safe status lookup` and `Read proposal records`. Confirmed the panel displayed `Mapping proposal record read result`, reader status `listed`, a proposal record card, read authority boundary, and record authority boundary.

- Command: Browser foreign work list result
- Result: passed
- Notes: Clicked `Clear proposal record inputs`, `Load safe foreign work lookup`, and `Read proposal records`. Confirmed reader status `listed`, `foreign_scope: project:augnes`, `foreign_work_id: AG-FIXTURE-MAPPING-PROPOSAL-001`, and the seeded synthetic proposal record.

- Command: Browser proposal_id fetch result
- Result: passed
- Notes: Clicked `Load safe proposal id lookup` and `Read proposal records` after seeding the temp DB with the matching synthetic proposal id. Confirmed reader status `fetched`, `proposal_id: ag-resume-mapping-proposal:fixture-cockpit-read-001`, single-fetch limit text, proposal metadata, read authority boundary, and record authority boundary.

- Command: Browser not-found result
- Result: passed
- Notes: Moved the seeded row to a different synthetic id outside the UI, then clicked `Read proposal records` with the loaded fixture id. Confirmed route alert `Mapping proposal record read route error: Proposal record not found...`, reader status `not_found`, failure text, and no proposal records returned.

- Command: Browser local validation error
- Result: passed
- Notes: Clicked `Clear proposal record inputs`, then `Read proposal records` with no filters. Confirmed local alert `At least one proposal record read filter is required...` and no stale read result remained visible.

- Command: Browser clear interaction
- Result: passed
- Notes: Clicked `Clear proposal record inputs`. Confirmed proposal id, foreign work, candidate local work, and status inputs cleared, limit reset to `20`, alerts cleared, result cleared, and the empty state returned.

- Command: Browser accessibility/keyboard observation
- Result: passed
- Notes: Confirmed real label/htmlFor associations for proposal id, foreign scope, foreign work id, candidate local scope, candidate local work id, status, and limit controls. Confirmed helper text through `aria-describedby`, grouped controls for fixture, lookup, and read controls, native buttons/input/select elements, zero `role="button"` controls, and a polite live result region labelled `Mapping proposal record read result`.

- Command: Browser no unauthorized controls scan
- Result: passed
- Notes: The panel exposed only fixture buttons, clear, and the read-only proposal record read button. No unauthorized controls appeared for confirm mapping, create mapping, import context, create work item/event, record proof/evidence, bind session, execute/run/start Codex, approve, publish, retry, replay, merge, Direct Resume Code, relay, withdraw, reject, supersede, expire, persistence, or state mutation.

## Additional Focused Pass For PR #302

- Date: 2026-05-31 KST
- Branch: `codex/ag-resume-mapping-proposal-record-cockpit-panel`
- Local runtime DB: `/tmp/augnes-pr302-focused-verification.db`
- Network capture artifact: `/tmp/augnes-pr302-network-log.ndjson`
- Screenshot artifact: `/tmp/augnes-pr302-focused-panel.png`
- Seeded synthetic proposal id: `ag-resume-mapping-proposal:e368e40b16531815077b4a38`
- Seed method: existing `scripts/ag-work-resume-mapping-proposal-record-create.mjs`
  writer helper, using stdin JSON before browser testing. The Cockpit panel did
  not seed, create, update, or mutate the row.

- Command: focused browser panel placement check
- Result: passed
- Notes: Opened Cockpit, clicked the Operator tab, and confirmed the
  `AG Resume Mapping Proposal Record Review` panel rendered after the
  `AG Resume Mapping Proposal Preview` panel. The read-only boundary copy was
  visible.

- Command: focused browser success/not-found/local-validation/clear flows
- Result: passed
- Notes: Exercised status list lookup, `foreign_scope + foreign_work_id` list
  lookup, `candidate_local_scope + candidate_local_work_id` list lookup,
  `proposal_id` single fetch, `proposal_id` not found, missing all filters,
  `proposal_id` combined with status, `proposal_id` combined with limit,
  `foreign_scope` without `foreign_work_id`, `candidate_local_work_id` without
  `candidate_local_scope`, limit `0`, non-integer limit `2.5`, clear after a
  success state, and clear after an error state. Long text values were entered
  with browser keypress events after the high-level fill/type helper reported an
  unavailable virtual clipboard; no product behavior was changed.

- Command: focused browser network inspection through local logging proxy
- Result: passed
- Notes: The focused panel interactions produced exactly five API calls. Every
  call was `GET /api/ag-work-resume/mapping-proposal-records`, request body
  length was `0`, and no read call sent a JSON `Content-Type` header. No `POST`
  occurred. No calls appeared for work, evidence, proof, session, Codex,
  import, Direct Resume Code, relay, approval, publication, bridge, or MCP/App
  routes.

  Captured read calls:

  - `GET /api/ag-work-resume/mapping-proposal-records?status=proposed&limit=20`
  - `GET /api/ag-work-resume/mapping-proposal-records?foreign_scope=project%3Aaugnes&foreign_work_id=AG-FIXTURE-MAPPING-PROPOSAL-001&limit=20`
  - `GET /api/ag-work-resume/mapping-proposal-records?candidate_local_scope=project%3Aaugnes&candidate_local_work_id=AG-FIXTURE-MAPPING-PROPOSAL-001&limit=20`
  - `GET /api/ag-work-resume/mapping-proposal-records?proposal_id=ag-resume-mapping-proposal%3Ae368e40b16531815077b4a38`
  - `GET /api/ag-work-resume/mapping-proposal-records?proposal_id=ag-resume-mapping-proposal%3Anot-found-pr302`

- Command: focused isolated DB side-effect proof after browser interactions
- Result: passed
- Notes: `ag_work_resume_mapping_proposals` row count remained `1`; the seeded
  proposal row remained present with status `proposed`, the same foreign and
  candidate work identifiers, the same proposal reason, and the same
  `created_at` / `updated_at` from writer creation
  (`2026-05-31T09:24:37.336Z`). Full row hash after browser reads:
  `sha256:8aa614967174ab003992d2616e9e02ebc020a4ff4701b4d3cb38329bdeb6f571`.
  Protected table counts matched the pre-browser snapshot:
  `sessions=1`, `work_items=5`, `work_events=6`, `action_records=0`,
  `verification_evidence_records=0`. Confirmed mapping/import/imported-context
  tables remained absent:
  `ag_work_resume_mappings=false`,
  `ag_work_resume_mapping_records=false`,
  `ag_work_resume_confirmed_mappings=false`,
  `ag_work_resume_imports=false`,
  `ag_work_resume_imported_contexts=false`.

## Tool/API Outputs Compared

- Source output: existing `GET /api/ag-work-resume/mapping-proposal-records` route over a seeded temp DB row
- Rendered view matched at a high level: yes
- Differences: `not_found` uses HTTP 404 while still rendering the JSON read result as review metadata.

## Observations

- [x] UI loads.
- [x] Proposal record read panel renders in the Operator tab.
- [x] Labels/helper text are visible and associated.
- [x] Fixture buttons render and are local state only.
- [x] Status list returns `listed`.
- [x] Foreign work list returns `listed`.
- [x] Proposal id fetch returns `fetched`.
- [x] Missing proposal id returns `not_found`.
- [x] Local validation errors appear before route calls and clear stale results.
- [x] Result updates use a polite live region.
- [x] Boundary text is visible.
- [x] No unauthorized controls visible.
- Notes: Browser verification used safe synthetic fixture data, not a user/Core-confirmed real AG Resume Packet.

## Missing Data / Error States

- Missing-data state inspected: yes, via not-found fetch.
- Error or unavailable-runtime state inspected: yes, via no-filter local validation and not-found route response.
- Concrete status shown instead of fabricated data: yes.
- Notes: The panel does not discover local work and does not create proposal records.

## Screenshots / Artifacts

- Screenshot artifact: `/tmp/ag-resume-mapping-proposal-record-read-cockpit-panel.png`
- [x] No secrets captured.
- [x] No raw tokens, private keys, local env values, hidden provider/debug identifiers, or tunnel credentials captured.
- Notes: Browser viewport inspection contained only synthetic fixture JSON and rendered read-only record output.

## Unauthorized Controls Check

- [x] No Confirm mapping control visible.
- [x] No Create mapping control visible.
- [x] No Import context control visible.
- [x] No Create work item/event control visible.
- [x] No Record proof/evidence control visible.
- [x] No Bind session control visible.
- [x] No Execute/Run/Start Codex control visible.
- [x] No Approve/Publish/Retry/Replay control visible.
- [x] No Merge/auto-merge control visible.
- [x] No Direct Resume Code control visible.
- [x] No Relay control visible.
- [x] No Withdraw/Reject/Supersede/Expire control visible.
- Notes: Boundary copy mentions forbidden actions as absences, but no unauthorized controls or route-calling write actions are present.

## Authority Boundary Confirmation

- [x] Browser verification is observation only.
- [x] It does not approve, publish, retry, replay, externally post, merge, enable auto-merge, commit/reject state, record proof, or record evidence.
- [x] Proof is not approval.
- [x] PR is not merge authority.
- [x] Durable approval remains user/Core gated.
- Notes: Verification used only a local temporary DB for page loading and read-only proposal record route calls from the Cockpit panel.

## Skipped Checks And Reasons

- Check: ChatGPT Developer Mode rendering
- Concrete reason: not applicable to Cockpit Operator tab UI.

- Check: MCP/App bridge startup
- Concrete reason: not applicable; this slice does not touch MCP/App tools or bridge behavior.

- Check: Runtime-backed evidence recording
- Concrete reason: evidence recording not authorized for this read-only proposal record Cockpit panel slice.

- Check: Proof-only closeout recording
- Concrete reason: proof-only closeout not authorized for this read-only proposal record Cockpit panel slice.

## Gaps / Follow-ups

- Gap: browser verification used synthetic fixture data, not a user/Core-confirmed real AG Resume Packet.
- Follow-up: mapping confirmation, lifecycle mutation, import, proof/evidence, session binding, and Codex continuation remain separately gated future designs.
- Owner: user/Core for real packet, mapping, import, evidence/proof, session binding, and Codex execution authority.

## Result

- Result: passed
- Summary: Browser verification confirmed the AG Resume Mapping Proposal Record Review panel renders in the Operator tab, uses the existing GET route, lists/fetches synthetic proposal record review metadata, handles not-found and local validation safely, clears state correctly, exposes accessible native controls, announces results politely, and shows no unauthorized controls.
