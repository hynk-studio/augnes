# Browser/computer-use verification report for: AG Resume mapping proposal Cockpit panel

## Related PR

- PR: draft PR pending
- Work ID: none; mapping proposal verification used safe synthetic fixture data only
- Handoff ID: none
- Related state keys: coordination.ag_resume_mapping

## Date

- Date: 2026-05-31
- Timezone: Asia/Seoul
- Local verification time: 2026-05-31 14:47:56 KST

## Verifier / Surface

- Verifier: Codex
- Verification surface: Codex in-app Browser
- Target UI surface: Cockpit Operator tab, AG Resume Mapping Proposal Preview panel

## Environment

- Repository branch: codex/ag-resume-mapping-proposal-cockpit-panel
- Source commit before report creation: ad55e01
- Node/npm versions: Node v25.9.0, npm 11.12.1
- Operating system: Darwin 25.5.0 arm64
- Browser or runtime: Codex in-app Browser against local Next dev server
- Local runtime availability: temporary local Augnes DB at `/tmp/augnes-ag-resume-mapping-proposal-cockpit-panel.db`
- ChatGPT Developer Mode tunnel/session availability: not used

## Local Startup

- [x] Augnes runtime startup attempted.
- [ ] Augnes App / MCP bridge startup attempted.
- Commands or skipped reason: Started the local Cockpit only. MCP/App bridge and ChatGPT Developer Mode were not needed for this Cockpit UI slice.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-mapping-proposal-cockpit-panel.db npm run db:reset`
- Result: passed
- Notes: Created an isolated temporary local DB for browser verification only.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-mapping-proposal-cockpit-panel.db npm run demo:seed`
- Result: passed
- Notes: Seeded demo local state for Cockpit page loading.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-mapping-proposal-cockpit-panel.db NEXT_TELEMETRY_DISABLED=1 npm run dev -- --port 3118`
- Result: passed
- Notes: Served Cockpit at `http://localhost:3118`.

## Views Checked

- URL or app surface: `http://localhost:3118`
- Cockpit tab or widget/card: Operator tab, AG Resume Mapping Proposal Preview panel
- View state inspected: initial empty state, safe fixture route call, no-candidate result, conflict result, preflight-failing blocked result, local parse error states, clear-input state, accessibility/keyboard observation, and unauthorized-control scan

## Browser Checks Run

- Command: Browser DOM inspection after opening Operator tab
- Result: passed
- Notes: Confirmed `AG Resume Mapping Proposal Preview` renders after the target preview panel with labels, helper text, grouped controls, strict checkbox, fixture buttons, clear button, and `Run read-only mapping proposal preview`.

- Command: Browser safe fixture route call candidate_review
- Result: passed
- Notes: Clicked `Load safe mapping example packet`, `Load safe mapping example candidates`, and `Run read-only mapping proposal preview`. Confirmed HTTP status `200`, route ok `true`, `preview.status` `candidate_review`, `preview.ok_for_user_core_review` `true`, match confidence, selected candidate summary, questions, recommendations, foreign refs summary, and authority boundary visible.

- Command: Browser no-candidate result
- Result: passed
- Notes: Clicked `Clear mapping proposal inputs`, `Load no-candidate example`, and `Run read-only mapping proposal preview`. Confirmed HTTP status `200`, `preview.status` `needs_candidate`, selected candidate id cleared, and candidates input empty.

- Command: Browser conflict result
- Result: passed
- Notes: Clicked `Clear mapping proposal inputs`, `Load conflicting candidate example`, and `Run read-only mapping proposal preview`. Confirmed HTTP status `409`, `preview.status` `conflict`, conflicts visible, and no unauthorized controls.

- Command: Browser preflight-failing blocked result
- Result: passed
- Notes: Clicked `Clear mapping proposal inputs`, `Load preflight-failing mapping packet`, `Load safe mapping example candidates`, and `Run read-only mapping proposal preview`. Confirmed HTTP status `422`, `preview.status` `blocked`, unsafe packet target policy conflict visible, and result remained read-only.

- Command: Browser local parse error for packet JSON
- Result: passed
- Notes: Entered malformed packet JSON and clicked `Run read-only mapping proposal preview`. Confirmed `Mapping packet error:` appeared in a `role="alert"` element, packet textarea set `aria-invalid="true"`, and no stale result remained visible.

- Command: Browser local parse error for candidate JSON
- Result: passed
- Notes: Loaded the safe packet, entered malformed Local B candidate work items JSON, and clicked `Run read-only mapping proposal preview`. Confirmed `Mapping candidates error:` appeared in a `role="alert"` element, candidate textarea set `aria-invalid="true"`, and no stale result remained visible.

- Command: Browser accessibility/keyboard observation
- Result: passed
- Notes: Confirmed real label/htmlFor associations for packet textarea, candidate textarea, selected candidate id input, and strict checkbox. Confirmed helper text through `aria-describedby`, grouped controls for safe fixtures, error/edge fixtures, input controls, options, and action controls, native buttons/input/checkbox/textarea, zero `role="button"` controls, and a polite live result region labelled `Mapping proposal preview result`.

- Command: Browser clear interaction
- Result: passed
- Notes: Clicked `Clear mapping proposal inputs`. Confirmed packet, candidates, selected candidate id, strict checkbox, alerts, result state, and busy state returned to empty/default UI.

- Command: Browser unauthorized-control scan
- Result: passed
- Notes: The panel exposed only fixture buttons, clear, and the read-only mapping proposal preview button. No unauthorized controls appeared for confirm mapping, create mapping, import context, create work item, record proof/evidence, bind session, execute/run/start Codex, approve, publish, retry, replay, merge, Direct Resume Code, relay, persistence, or state mutation.

## Tool/API Outputs Compared

- Source output: in-panel safe synthetic AG Resume Packet fixture, safe synthetic Local B candidate array, no-candidate fixture state, conflicting candidate fixture, and blocked unsafe-policy packet fixture
- Rendered view matched at a high level: yes
- Differences: blocked and conflict route responses intentionally use non-2xx/409/422 HTTP statuses while still rendering a read-only JSON preview result.

## Observations

- [x] UI loads.
- [x] Mapping proposal panel renders in the Operator tab.
- [x] Labels/helper text are visible and associated.
- [x] Fixture buttons render and are local state only.
- [x] Safe fixture route call returns `candidate_review`.
- [x] No-candidate result returns `needs_candidate`.
- [x] Conflict result returns `conflict`.
- [x] Preflight-failing blocked result returns `blocked`.
- [x] Local parse errors appear before route calls and clear stale results.
- [x] Result updates use a polite live region.
- [x] Boundary text visible.
- [x] No unauthorized controls visible.
- Notes: Browser verification used safe synthetic fixture data, not a user/Core-confirmed real AG Resume Packet.

## Missing Data / Error States

- Missing-data state inspected: yes, via no-candidate fixture.
- Error or unavailable-runtime state inspected: yes, via malformed packet JSON, malformed candidate JSON, conflicting candidate, and blocked unsafe-policy fixture flows.
- Concrete status shown instead of fabricated data: yes.
- Notes: The panel does not discover local work and does not run packet preflight.

## Screenshots / Artifacts

- Screenshot/artifact refs if available: none captured; browser DOM and rendered text/state were inspected during verification.
- [x] No secrets captured.
- [x] No raw tokens, private keys, local env values, hidden provider/debug identifiers, or tunnel credentials captured.
- Notes: Browser viewport inspection contained only synthetic fixture JSON and rendered read-only preview output.

## Unauthorized Controls Check

- [x] No Confirm mapping control visible.
- [x] No Create mapping control visible.
- [x] No Import context control visible.
- [x] No Create work item control visible.
- [x] No Record proof/evidence control visible.
- [x] No Bind session control visible.
- [x] No Execute/Run/Start Codex control visible.
- [x] No Approve/Publish/Retry/Replay control visible.
- [x] No Merge/auto-merge control visible.
- [x] No Direct Resume Code control visible.
- [x] No Relay control visible.
- Notes: Boundary copy mentions forbidden actions as absences, but no unauthorized controls or route-calling write actions are present.

## Authority Boundary Confirmation

- [x] Browser/computer-use verification is observation only.
- [x] It does not approve, publish, retry, replay, externally post, merge, enable auto-merge, commit/reject state, record proof, or record evidence.
- [x] Proof is not approval.
- [x] PR is not merge authority.
- [x] Durable approval remains user/Core gated.
- Notes: Verification used only a local temporary DB for page loading and read-only mapping proposal preview route calls from the Cockpit panel.

## Skipped Checks And Reasons

- Check: ChatGPT Developer Mode rendering
- Concrete reason: not applicable to Cockpit Operator tab UI.

- Check: MCP/App bridge startup
- Concrete reason: not applicable; this slice does not touch MCP/App tools or bridge behavior.

- Check: Runtime-backed evidence recording
- Concrete reason: evidence recording not authorized for this read-only mapping proposal Cockpit panel slice.

- Check: Proof-only closeout recording
- Concrete reason: proof-only closeout not authorized for this read-only mapping proposal Cockpit panel slice.

## Gaps / Follow-ups

- Gap: browser verification used synthetic fixture data, not a user/Core-confirmed real AG Resume Packet.
- Follow-up: mapping confirmation/persistence remains a separately gated future design.
- Owner: user/Core for real packet, mapping, import, evidence/proof, session binding, and Codex execution authority.

## Result

- Result: passed
- Summary: Browser verification confirmed the AG Resume Mapping Proposal Preview panel renders in the Operator tab, safe fixture route call returns `candidate_review`, no-candidate returns `needs_candidate`, conflicting candidate returns `conflict`, unsafe policy returns `blocked`, local parse errors prevent route calls and clear stale results, accessibility semantics are present, result updates are announced politely, and no unauthorized controls appear.
