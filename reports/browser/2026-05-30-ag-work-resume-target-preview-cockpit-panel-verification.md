# Browser/computer-use verification report for: AG Resume Target Preview Cockpit Panel

## Related PR

- PR: draft PR pending
- Work ID: none; browser verification used a safe synthetic fixture only
- Handoff ID: none
- Related state keys: coordination.ag_resume_packet

## Date

- Date: 2026-05-30
- Timezone: Asia/Seoul

## Verifier / Surface

- Verifier: Codex
- Verification surface: Codex in-app Browser
- Target UI surface: Cockpit Operator tab, AG Resume Target Preview panel

## Environment

- Repository branch: codex/ag-resume-target-preview-cockpit-panel
- Source commit before report creation: a874095
- Node/npm versions: Node v25.9.0, npm 11.12.1
- Operating system: Darwin 25.5.0 arm64
- Browser or runtime: Codex in-app Browser against local Next dev server
- Local runtime availability: temporary local Augnes DB at `/tmp/augnes-ag-resume-target-preview-cockpit-panel.db`
- ChatGPT Developer Mode tunnel/session availability: not used

## Local Startup

- [x] Augnes runtime startup attempted.
- [ ] Augnes App / MCP bridge startup attempted.
- Commands or skipped reason: Started the local Cockpit only. MCP/App bridge and ChatGPT Developer Mode were not needed for this Cockpit UI slice.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-target-preview-cockpit-panel.db npm run db:reset`
- Result: passed
- Notes: Created an isolated temporary local DB for browser verification only.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-target-preview-cockpit-panel.db npm run demo:seed`
- Result: passed
- Notes: Seeded demo local state for Cockpit page loading.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-target-preview-cockpit-panel.db NEXT_TELEMETRY_DISABLED=1 npm run dev -- --port 3117`
- Result: passed
- Notes: Served Cockpit at `http://localhost:3117`.

## Views Checked

- URL or app surface: `http://localhost:3117`
- Cockpit tab or widget/card: Operator tab, AG Resume Target Preview panel
- View state inspected: initial empty state and successful read-only target preview result with safe synthetic packet/local-context fixture

## Browser Checks Run

- Command: Browser DOM inspection after opening Operator tab
- Result: passed
- Notes: Confirmed visible `AG Resume Packet JSON` textarea, `Explicit Local B context JSON` textarea, `strict` checkbox, `skip_preflight` checkbox, disabled `Run read-only target preview` button before packet input, and visible read-only boundary text.

- Command: Browser fixture submission through the panel
- Result: passed
- Notes: Filled a safe synthetic AG Resume Packet and explicit Local B context. The panel posted only to `/api/ag-work-resume/target-preview` through its preview button.

- Command: Browser DOM inspection of result
- Result: passed
- Notes: Confirmed HTTP status `200`, route `ok: true`, `preview.status: ready_for_user_core_review`, `preview.ok_to_continue: true`, preflight `ran: true`, preflight `status: pass`, `recommended_next_step`, foreign action/evidence/session refs, and authority boundaries.

- Command: Browser unauthorized-control scan
- Result: passed
- Notes: The new panel exposed one button, `Run read-only target preview`. No forbidden action button labels were found for execute/run/start Codex, approve, publish, retry, replay, merge, record evidence, record proof, create work item, create mapping record, or bind session.

## Tool/API Outputs Compared

- Source output: safe synthetic AG Resume Packet JSON plus explicit Local B context JSON
- Rendered view matched at a high level: yes
- Differences: fixture data was not imported or persisted. It was submitted only to the read-only target preview route.

## Observations

- [x] UI loads.
- [x] Target panel renders.
- [x] Empty state renders.
- [x] Boundary text visible.
- [x] Route response result renders.
- Notes: Result cards were adjusted after the first screenshot so the long `ready_for_user_core_review` value fits in the narrow Operator column.

## Missing Data / Error States

- Missing-data state inspected: yes
- Error or unavailable-runtime state inspected: not in browser; local JSON parse prevention is covered by `npm run smoke:ag-work-resume-target-preview-cockpit-panel`
- Concrete status shown instead of fabricated data: yes
- Notes: The empty panel displayed a local prompt to paste packet and optional Local B context JSON. Static smoke confirms invalid JSON is parsed locally before route call.

## Screenshots / Artifacts

- Screenshot/artifact refs if available: screenshots captured in the Codex in-app Browser session, not committed.
- [x] No secrets captured.
- [x] No raw tokens, private keys, local env values, hidden provider/debug identifiers, or tunnel credentials captured.
- Notes: The screenshot contained only synthetic fixture JSON and rendered route preview output.

## Unauthorized Controls Check

- [x] No Run Codex control visible.
- [x] No commit/reject control visible.
- [x] No approve/publish/retry/replay/external-posting control visible.
- [x] No merge/auto-merge control visible.
- [x] No proof/evidence recording control visible.
- Notes: The new panel contained two textareas, two checkboxes, and one preview button. No copy/write/persist controls were present.

## Authority Boundary Confirmation

- [x] Browser/computer-use verification is observation only.
- [x] It does not approve, publish, retry, replay, externally post, merge, enable auto-merge, commit/reject state, record proof, or record evidence.
- [x] Proof is not approval.
- [x] PR is not merge authority.
- [x] Durable approval remains user/Core gated.
- Notes: Verification used only a local temporary DB for page loading and one read-only target-preview route call from the new panel.

## Skipped Checks And Reasons

- Check: ChatGPT Developer Mode rendering
- Concrete reason: not applicable to Cockpit Operator tab UI.

- Check: MCP/App bridge startup
- Concrete reason: not applicable; this slice does not touch MCP/App tools or bridge behavior.

## Gaps / Follow-ups

- Gap: browser verification used a synthetic packet/local-context fixture, not a user/Core-confirmed real cross-local packet.
- Follow-up: repeat with a real AG Resume Packet only after user/Core supplies one and confirms the Local B mapping context.
- Owner: user/Core for real packet and mapping authority.

## Result

- Result: passed
- Summary: Browser verification confirmed the Operator tab panel renders, accepts pasted packet/local context JSON, calls the read-only target preview route, displays the required preview/preflight/foreign-ref/authority sections, and exposes no unauthorized write or execution controls.
