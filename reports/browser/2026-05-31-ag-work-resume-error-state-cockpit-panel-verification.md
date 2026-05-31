# Browser/computer-use verification report for: AG Resume error-state Cockpit panel fixtures

## Related PR

- PR: draft PR pending
- Work ID: none; error-state verification used safe synthetic fixture data only
- Handoff ID: none
- Related state keys: coordination.ag_resume_packet

## Date

- Date: 2026-05-31
- Timezone: Asia/Seoul
- Local verification time: 2026-05-31 10:55:44 KST

## Verifier / Surface

- Verifier: Codex
- Verification surface: Codex in-app Browser
- Target UI surface: Cockpit Operator tab, AG Resume Target Preview panel

## Environment

- Repository branch: codex/ag-resume-error-state-cockpit-panel
- Source commit before report creation: b08a1f0
- Node/npm versions: Node v25.9.0, npm 11.12.1
- Operating system: Darwin arm64
- Browser or runtime: Codex in-app Browser against local Next dev server
- Local runtime availability: temporary local Augnes DB at `/tmp/augnes-ag-resume-error-state-cockpit-panel.db`
- ChatGPT Developer Mode tunnel/session availability: not used

## Local Startup

- [x] Augnes runtime startup attempted.
- [ ] Augnes App / MCP bridge startup attempted.
- Commands or skipped reason: Started the local Cockpit only. MCP/App bridge and ChatGPT Developer Mode were not needed for this Cockpit UI slice.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-error-state-cockpit-panel.db npm run db:reset`
- Result: passed
- Notes: Created an isolated temporary local DB for browser verification only.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-error-state-cockpit-panel.db npm run demo:seed`
- Result: passed
- Notes: Seeded demo local state for Cockpit page loading.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-error-state-cockpit-panel.db NEXT_TELEMETRY_DISABLED=1 npm run dev -- --port 3118`
- Result: passed
- Notes: Served Cockpit at `http://localhost:3118`. A `127.0.0.1` attempt was not used because Next dev blocked cross-origin dev resources for that host.

## Views Checked

- URL or app surface: `http://localhost:3118`
- Cockpit tab or widget/card: Operator tab, AG Resume Target Preview panel
- View state inspected: initial panel labels, malformed packet JSON local failure, malformed Local B context local failure, copied-packet validation with malformed Local B ignored, preflight-failing packet route result, clear-input state, and unauthorized-control scan

## Browser Checks Run

- Command: Browser DOM inspection after opening Operator tab
- Result: passed
- Notes: Confirmed visible `Load malformed packet JSON`, `Load malformed Local B context JSON`, `Load preflight-failing packet example`, `Validate pasted packet only`, `Run read-only target preview`, and `Clear AG resume inputs`.

- Command: Browser malformed packet JSON local parse failure
- Result: passed
- Notes: Clicked `Load malformed packet JSON`, then `Validate pasted packet only`. Confirmed local parse error appeared, no copied-packet validation route result appeared, and no full preview route result appeared. The dev server log showed no POST for this malformed packet validation step.

- Command: Browser malformed packet JSON full-preview local parse failure
- Result: passed
- Notes: With the malformed packet still loaded, clicked `Run read-only target preview`. Confirmed local packet parse error appeared and no full preview route result appeared. The dev server log showed no POST for this malformed full-preview step.

- Command: Browser malformed Local B context with packet-only validation
- Result: passed
- Notes: Clicked `Clear AG resume inputs`, `Load safe example packet`, `Load malformed Local B context JSON`, then `Validate pasted packet only`. Confirmed copied-packet validation ignores malformed Local B context, returned HTTP status `200`, preflight pass, and `preview.status: context_only`.

- Command: Browser malformed Local B context JSON local parse failure
- Result: passed
- Notes: With valid packet plus malformed Local B context loaded, clicked `Run read-only target preview`. Confirmed local Local B context parse error appeared and no full preview route result appeared.

- Command: Browser preflight-failing packet shows preflight failure
- Result: passed
- Notes: Clicked `Clear AG resume inputs`, `Load preflight-failing packet example`, then `Validate pasted packet only`. Confirmed route result appeared with HTTP status `422`, preflight ran `true`, preflight ok `false`, preflight status `fail`, failures list visible, and read-only validation boundary text visible.

- Command: Browser clear interaction
- Result: passed
- Notes: Clicked `Clear AG resume inputs`. Confirmed packet and Local B textareas cleared, copied-packet validation errors/results cleared, full-preview errors/results cleared, strict checkbox reset unchecked, and skip-preflight checkbox reset unchecked.

- Command: Browser unauthorized-control scan
- Result: passed
- Notes: The panel exposed only fixture buttons plus `Validate pasted packet only` and `Run read-only target preview`. No unauthorized controls appeared for Codex execution, merge, approval, publish, retry, replay, proof/evidence recording, session binding, work item creation, mapping creation, Direct Resume Code, relay, import, or persistence.

## Tool/API Outputs Compared

- Source output: local-only synthetic malformed packet JSON string, malformed Local B context JSON string, and valid JSON preflight-failing packet fixture
- Rendered view matched at a high level: yes
- Differences: malformed JSON fixtures fail before route calls; preflight-failing valid JSON intentionally calls the existing read-only route and returns a non-authoritative validation failure.

## Observations

- [x] UI loads.
- [x] Target panel renders.
- [x] Error fixture buttons render.
- [x] Malformed packet JSON fails locally before route call.
- [x] Malformed Local B context JSON fails locally before full-preview route call.
- [x] Copied-packet validation ignores malformed Local B context.
- [x] Preflight-failing packet shows preflight failure.
- [x] Clear resets error/result states.
- [x] Boundary text visible.
- [x] No unauthorized controls visible.
- Notes: The preflight-failing packet uses safe policy failure, not fake secrets, raw DB paths, local paths, tunnel URLs, raw OpenAI responses, or screenshots/media.

## Missing Data / Error States

- Missing-data state inspected: yes
- Error or unavailable-runtime state inspected: yes, via malformed packet JSON, malformed Local B context JSON, and preflight-failing packet fixture flows
- Concrete status shown instead of fabricated data: yes
- Notes: Browser verification used synthetic fixture data, not a user/Core-confirmed real AG Resume Packet.

## Screenshots / Artifacts

- Screenshot/artifact refs if available: `/tmp/ag-resume-error-state-cockpit-panel.png`
- [x] No secrets captured.
- [x] No raw tokens, private keys, local env values, hidden provider/debug identifiers, or tunnel credentials captured.
- Notes: The screenshot contains only synthetic fixture JSON and rendered read-only validation output. No screenshot/media artifact is committed.

## Unauthorized Controls Check

- [x] No Run Codex control visible.
- [x] No commit/reject control visible.
- [x] No approve/publish/retry/replay/external-posting control visible.
- [x] No merge/auto-merge control visible.
- [x] No proof/evidence recording control visible.
- [x] No session binding control visible.
- [x] No work item creation or mapping creation control visible.
- [x] No import/persist control visible.
- [x] No Direct Resume Code control visible.
- [x] No relay control visible.
- Notes: Boundary copy may mention forbidden actions as absences, but no unauthorized controls or route-calling write actions are present.

## Authority Boundary Confirmation

- [x] Browser/computer-use verification is observation only.
- [x] It does not approve, publish, retry, replay, externally post, merge, enable auto-merge, commit/reject state, record proof, or record evidence.
- [x] Proof is not approval.
- [x] PR is not merge authority.
- [x] Durable approval remains user/Core gated.
- Notes: Verification used only a local temporary DB for page loading and read-only target-preview route calls from the existing Cockpit panel.

## Skipped Checks And Reasons

- Check: ChatGPT Developer Mode rendering
- Concrete reason: not applicable to Cockpit Operator tab UI.

- Check: MCP/App bridge startup
- Concrete reason: not applicable; this slice does not touch MCP/App tools or bridge behavior.

- Check: Runtime-backed evidence recording
- Concrete reason: evidence recording not authorized for this Cockpit error-state regression slice.

- Check: Proof-only closeout recording
- Concrete reason: proof-only closeout not authorized for this Cockpit error-state regression slice.

## Gaps / Follow-ups

- Gap: browser verification used synthetic fixture data, not a user/Core-confirmed real AG Resume Packet.
- Follow-up: keep real AG Resume Packet review paste-only until user/Core explicitly scopes a future authority-gated mapping/import design.
- Owner: user/Core for real packet, mapping, import, evidence/proof, and execution authority.

## Result

- Result: passed
- Summary: Browser verification confirmed the error-state fixtures render, malformed packet and Local B JSON fail locally before route calls, copied-packet validation ignores malformed Local B context, a safe preflight-failing packet renders a read-only preflight failure result, clear resets all error/result states, and no unauthorized controls appear.
