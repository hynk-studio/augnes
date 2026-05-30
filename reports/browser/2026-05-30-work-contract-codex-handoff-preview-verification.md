# Browser/computer-use verification report for: Work Contract Card Codex Handoff Preview

## Related PR

- PR: draft pending
- Work ID: AG-PREVIEW local fixture for rendered-widget verification only
- Handoff ID: none
- Related state keys: coordination.work_contract_card

## Date

- Date: 2026-05-30
- Timezone: Asia/Seoul

## Verifier / Surface

- Verifier: Codex
- Verification surface: browser
- Target UI surface: ChatGPT App Work Contract Card widget

## Environment

- Repository branch: codex/work-contract-card-codex-handoff-preview
- Commit: 762d22c with local changes under verification
- Node/npm versions: Node v25.9.0, npm 11.12.1
- Operating system: Darwin 25.5.0 arm64
- Browser or runtime: Codex in-app Browser against local static HTTP server
- Local runtime availability: unavailable at `http://localhost:3000`
- ChatGPT Developer Mode tunnel/session availability: not used

## Local Startup

- [ ] Augnes runtime startup attempted.
- [ ] Augnes App / MCP bridge startup attempted.
- Commands or skipped reason: Augnes runtime availability was checked and `http://localhost:3000` was unavailable. The runtime and bridge were not started for this fixture-only widget check; a local static HTTP server served `apps/augnes_apps/public` at `http://127.0.0.1:8123` for widget-only rendering. Direct `file://` navigation was blocked by browser policy, so the check used local HTTP instead. No runtime write API, Codex execution, GitHub, OpenAI, evidence, or proof route was called.

## Views Checked

- URL or app surface: `http://127.0.0.1:8123/__codex-widget-preview-harness.html`
- Cockpit tab or widget/card: Work Contract Card widget with Codex Handoff Preview
- View state inspected: full preview fixture and missing-data fallback fixture

## Commands Run

- Command: `python3 -m http.server 8123 --bind 127.0.0.1`
- Result: passed
- Notes: Served static widget/harness files locally for browser inspection only.

- Command: Browser frame inspection for full preview fixture
- Result: passed
- Notes: Confirmed Work Contract Card, Codex Handoff Preview, readiness, current runtime label, expected scope, forbidden actions, stop conditions, copyable handoff packet, and preview boundary text rendered.

- Command: Browser frame inspection for missing-data fallback fixture
- Result: passed
- Notes: Confirmed missing expected files, expected checks, related state keys, preview confirmation fallback, and preview boundary text rendered.

## Tool/API Outputs Compared

- Source output: local structuredContent fixture shaped like `augnes_get_work_brief` widget output
- Rendered view matched at a high level: yes
- Differences: fixture-only browser verification did not call the live Augnes runtime because local runtime was unavailable.

## Observations

- [x] UI loads.
- [x] Target card/view renders.
- [x] Missing-data state renders.
- [x] Boundary text visible.
- Notes: Full fixture rendered the preview and copyable handoff packet. Fallback fixture rendered explicit missing-data text without throwing.

## Missing Data / Error States

- Missing-data state inspected: yes
- Error or unavailable-runtime state inspected: local runtime unavailable was recorded as a verification gap; widget fallback state was inspected.
- Concrete status shown instead of fabricated data: yes
- Notes: Missing optional fields rendered fallback text for expected files, expected checks, related state keys, evidence/proof/browser confirmation, and boundary text.

## Screenshots / Artifacts

- Screenshot/artifact refs if available: none
- [x] No secrets captured.
- [x] No raw tokens, private keys, local env values, hidden provider/debug identifiers, or tunnel credentials captured.
- Notes: No screenshots or media artifacts were committed.

## Unauthorized Controls Check

- [x] No Run Codex control visible.
- [x] No commit/reject control visible.
- [x] No approve/publish/retry/replay/external-posting control visible.
- [x] No merge/auto-merge control visible.
- [x] No proof/evidence recording control visible.
- Notes: Exact unauthorized labels were absent. Browser DOM counts were `button=0`, `form=0`, `input=0`, `select=0`, and `textarea=0` for both full and fallback fixtures.

## Authority Boundary Confirmation

- [x] Browser/computer-use verification is observation only.
- [x] It does not approve, publish, retry, replay, externally post, merge, enable auto-merge, commit/reject state, record proof, or record evidence.
- [x] Proof is not approval.
- [x] PR is not merge authority.
- [x] Durable approval remains user/Core gated.
- Notes: The widget remained read-only. The check used local fixture data and did not call runtime, GitHub, OpenAI, proof, evidence, approval, publication, retry, replay, or merge surfaces.

## Skipped Checks And Reasons

- Check: live current-runtime widget output
- Concrete reason: local Augnes runtime unavailable at `http://localhost:3000`

- Check: ChatGPT Developer Mode rendering
- Concrete reason: no ChatGPT Developer Mode tunnel/session available

## Gaps / Follow-ups

- Gap: browser verification used fixture structuredContent rather than live `augnes_get_work_brief` output.
- Follow-up: repeat against a live current Augnes runtime and Developer Mode session when user/Core provides them.
- Owner: user/Core for current runtime and Developer Mode availability

## Result

- Result: passed
- Summary: Local browser verification confirmed the read-only Codex Handoff Preview renders, fallback text renders, copyable handoff packet is inspectable, boundary text is visible, and unauthorized execution/approval/publication/merge/proof/evidence controls are absent.

## Notes

- Additional context: temporary local harness files were used for browser observation and removed before final diff.
