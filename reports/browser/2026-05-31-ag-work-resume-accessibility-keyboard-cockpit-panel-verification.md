# Browser/computer-use verification report for: AG Resume accessibility and keyboard Cockpit panel coverage

## Related PR

- PR: draft PR pending
- Work ID: none; accessibility and keyboard verification used safe synthetic fixture data only
- Handoff ID: none
- Related state keys: coordination.ag_resume_packet

## Date

- Date: 2026-05-31
- Timezone: Asia/Seoul
- Local verification time: 2026-05-31 11:28:50 KST

## Verifier / Surface

- Verifier: Codex
- Verification surface: Codex in-app Browser
- Target UI surface: Cockpit Operator tab, AG Resume Target Preview panel

## Environment

- Repository branch: codex/ag-resume-accessibility-keyboard-panel
- Source commit before report creation: 8df170e
- Node/npm versions: Node v25.9.0, npm 11.12.1
- Operating system: Darwin arm64
- Browser or runtime: Codex in-app Browser against local Next dev server
- Local runtime availability: temporary local Augnes DB at `/tmp/augnes-ag-resume-accessibility-keyboard-cockpit-panel.db`
- ChatGPT Developer Mode tunnel/session availability: not used

## Local Startup

- [x] Augnes runtime startup attempted.
- [ ] Augnes App / MCP bridge startup attempted.
- Commands or skipped reason: Started the local Cockpit only. MCP/App bridge and ChatGPT Developer Mode were not needed for this Cockpit UI slice.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-accessibility-keyboard-cockpit-panel.db npm run db:reset`
- Result: passed
- Notes: Created an isolated temporary local DB for browser verification only.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-accessibility-keyboard-cockpit-panel.db npm run demo:seed`
- Result: passed
- Notes: Seeded demo local state for Cockpit page loading.

- Command: `AUGNES_DB_PATH=/tmp/augnes-ag-resume-accessibility-keyboard-cockpit-panel.db NEXT_TELEMETRY_DISABLED=1 npm run dev -- --port 3118`
- Result: passed
- Notes: Served Cockpit at `http://localhost:3118`.

## Views Checked

- URL or app surface: `http://localhost:3118`
- Cockpit tab or widget/card: Operator tab, AG Resume Target Preview panel
- View state inspected: initial labels/helper text, labelled control groups, native tabbable controls, copied-packet validation result, full target preview result, packet parse error announcement, Local B context parse error announcement, clear-input state, and unauthorized-control scan

## Browser Checks Run

- Command: Browser DOM inspection for labels/helper text
- Result: passed
- Notes: Confirmed `AG Resume Packet JSON` and `Explicit Local B context JSON` are associated labels for their textareas. Confirmed helper text is linked with `aria-describedby`.

- Command: Browser DOM inspection for grouped controls
- Result: passed
- Notes: Confirmed accessible groups for safe example fixture controls, error-state fixture controls, target preview options, copied-packet validation controls, and full target preview controls.

- Command: Browser DOM inspection for keyboard navigation contract
- Result: passed with runtime limitation
- Notes: Confirmed panel controls are native buttons, native checkbox inputs, and native textareas in tabbable order, with no `role="button"` controls and no custom keyboard shortcut handlers. Browser CUA keypress attempted `TAB` on the focused panel button, but the Browser runtime did not dispatch focus changes in this session, so direct keypress activation was not claimable from Browser. Computer Use access to the Codex app was unavailable with the concrete tool result: `Computer Use is not allowed to use the app 'com.openai.codex' for safety reasons.`

- Command: Browser copied-packet validation by keyboard coverage
- Result: passed with runtime limitation
- Notes: `Validate pasted packet only` remains a native `button type="button"` and is keyboard-addressable by browser semantics. Because direct Browser keypress dispatch was unavailable, the route behavior was exercised with Browser coordinate activation after the native keyboard contract was inspected. Confirmed copied-packet validation returned HTTP status `200`, preflight pass, and `preview.status: context_only`.

- Command: Browser full preview by keyboard coverage
- Result: passed with runtime limitation
- Notes: `Run read-only target preview` remains the only native submit button and is keyboard-addressable by browser semantics. Because direct Browser keypress dispatch was unavailable, the route behavior was exercised with Browser coordinate activation after the native keyboard contract was inspected. Confirmed the full preview rendered `Full target preview result`, HTTP status `200`, and `ready_for_user_core_review`.

- Command: Browser error announcement checks
- Result: passed
- Notes: Malformed packet JSON rendered `Packet validation error:` in a `role="alert"` element, set packet textarea `aria-invalid="true"`, and linked the error in `aria-describedby`. Malformed Local B context JSON rendered `Target preview error:` in a `role="alert"` element, set Local B textarea `aria-invalid="true"`, and linked the error in `aria-describedby`.

- Command: Browser live region checks
- Result: passed
- Notes: Copied-packet validation result uses `aria-live="polite"` and `aria-labelledby="ag-resume-validation-result-heading"`. Full target preview result uses `aria-live="polite"` and `aria-labelledby="ag-resume-target-preview-result-heading"`.

- Command: Browser clear by keyboard coverage
- Result: passed with runtime limitation
- Notes: `Clear AG resume inputs` remains a native `button type="button"` and is keyboard-addressable by browser semantics. Because direct Browser keypress dispatch was unavailable, clear behavior was exercised with Browser coordinate activation after the native keyboard contract was inspected. Confirmed packet/local textareas emptied, checkboxes reset unchecked, alerts cleared, and result headings cleared.

- Command: Browser unauthorized-control scan
- Result: passed
- Notes: No unauthorized controls appeared for Codex execution, merge, approval, publish, retry, replay, proof/evidence recording, session binding, work item creation, mapping creation, Direct Resume Code, relay, import, or persistence.

## Tool/API Outputs Compared

- Source output: in-panel safe synthetic AG Resume Packet fixture, safe synthetic explicit Local B context fixture, malformed packet JSON fixture, and malformed Local B context fixture
- Rendered view matched at a high level: yes
- Differences: direct Browser keypress dispatch did not move focus in this session; behavior checks used Browser coordinate activation after native keyboard semantics were verified.

## Observations

- [x] UI loads.
- [x] Target panel renders.
- [x] labels/helper text are visible and associated.
- [x] Control groups have accessible labels.
- [x] Native buttons, checkboxes, and textareas remain present for keyboard navigation.
- [x] Error announcement states use `role="alert"`.
- [x] Parse errors set textarea `aria-invalid`.
- [x] Result updates use polite live regions.
- [x] Copied-packet validation result renders.
- [x] Full target preview result renders.
- [x] Clear resets error/result states.
- [x] Boundary text visible.
- [x] No unauthorized controls visible.
- Notes: Browser verification used safe synthetic fixture data, not a user/Core-confirmed real AG Resume Packet.

## Missing Data / Error States

- Missing-data state inspected: yes
- Error or unavailable-runtime state inspected: yes, via malformed packet JSON and malformed Local B context JSON fixture flows
- Concrete status shown instead of fabricated data: yes
- Notes: The keypress dispatch limitation is recorded as a tool/runtime gap, not as proof of inaccessible UI. The UI uses native keyboard-operable controls and static smoke coverage guards against custom keyboard regressions.

## Screenshots / Artifacts

- Screenshot/artifact refs if available: Browser viewport screenshots were inspected during verification; no screenshot/media artifact is committed.
- [x] No secrets captured.
- [x] No raw tokens, private keys, local env values, hidden provider/debug identifiers, or tunnel credentials captured.
- Notes: Browser viewport inspection contained only synthetic fixture JSON and rendered read-only preview output.

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

- Check: Direct Browser keypress activation
- Concrete reason: Browser CUA keypress returned without dispatching focus changes in this session; native keyboard contract was verified through semantic DOM inspection and static smoke guards.

- Check: Computer Use keyboard activation against Codex app
- Concrete reason: Computer Use returned `Computer Use is not allowed to use the app 'com.openai.codex' for safety reasons.`

- Check: ChatGPT Developer Mode rendering
- Concrete reason: not applicable to Cockpit Operator tab UI.

- Check: MCP/App bridge startup
- Concrete reason: not applicable; this slice does not touch MCP/App tools or bridge behavior.

- Check: Runtime-backed evidence recording
- Concrete reason: evidence recording not authorized for this Cockpit accessibility and keyboard regression slice.

- Check: Proof-only closeout recording
- Concrete reason: proof-only closeout not authorized for this Cockpit accessibility and keyboard regression slice.

## Gaps / Follow-ups

- Gap: browser verification used synthetic fixture data, not a user/Core-confirmed real AG Resume Packet.
- Gap: direct Browser keypress dispatch was unavailable in this session; smoke coverage and native semantics reduce regression risk, but a future browser runtime with working keypress dispatch should re-run direct keyboard activation.
- Follow-up: keep real AG Resume Packet review paste-only until user/Core explicitly scopes a future authority-gated mapping/import design.
- Owner: user/Core for real packet, mapping, import, evidence/proof, and execution authority.

## Result

- Result: passed with recorded keypress-runtime limitation
- Summary: Browser verification confirmed labels/helper text, accessible control groups, native keyboard-operable controls, alert error states, polite live result regions, copied-packet validation behavior, full target preview behavior, clear reset behavior, and no unauthorized controls. Direct Browser keypress dispatch and Computer Use keyboard activation were unavailable and are recorded with concrete skipped reasons.
