# Browser/computer-use verification report for: Work Contract Codex Handoff copy affordance

## Related PR

- PR: https://github.com/hynk-studio/augnes/pull/276
- Work ID: not provided
- Handoff ID: not provided
- Related state keys: `coordination.work_contract_card`

## Date

- Date: 2026-05-30
- Timezone: Asia/Seoul

## Verifier / Surface

- Verifier: Codex via Playwright CLI
- Verification surface: browser
- Target UI surface: `apps/augnes_apps/public/console-widget.html` Work Contract Card / Codex Handoff Preview

## Environment

- Repository branch: `codex/work-contract-card-copy-handoff`
- Source commit before report creation: `9786334`
- Verification PR: https://github.com/hynk-studio/augnes/pull/276
- Node/npm versions: Node v24.13.0, npm 11.6.2
- Operating system: Linux
- Browser or runtime: Playwright-managed Chromium / Chrome for Testing 149.0.7827.3
- Local runtime availability: not used for static widget fixture
- ChatGPT Developer Mode tunnel/session availability: not used
- Local user-home paths are written with `~` in this report.

## Local Startup

- [ ] Augnes runtime startup attempted.
- [ ] Augnes App / MCP bridge startup attempted.
- Commands or skipped reason: browser verification used a static widget fixture served by `python3 -m http.server 4177 --bind 127.0.0.1`; no Augnes runtime, bridge, runtime write route, proof route, or evidence route was started.

## Views Checked

- URL or app surface: `http://127.0.0.1:4177/apps/augnes_apps/public/console-widget.html`
- Cockpit tab or widget/card: Work Contract Card with Codex Handoff Preview
- View state inspected: fixture `work_contract_card` and `codex_handoff_preview` payload injected via widget `postMessage`

## Commands Run

- Command: `bash ~/.codex/skills/playwright/scripts/playwright_cli.sh open http://127.0.0.1:4177/apps/augnes_apps/public/console-widget.html --browser chromium`
- Result: passed
- Notes: opened static widget page; favicon 404 was the only console error.

- Command: `bash ~/.codex/skills/playwright/scripts/playwright_cli.sh run-code --filename /tmp/augnes-widget-copy-verify.js`
- Result: passed
- Notes: returned `buttonCount: 1`, `buttonVisible: true`, `packetVisible: true`, `preIncludesPacket: true`, `visibleForbiddenLabels: []`, `statusText: "Handoff copied."`, and `copyNetworkCalls: []`.

- Command: `bash ~/.codex/skills/playwright/scripts/playwright_cli.sh requests`
- Result: passed
- Notes: after the copy click, Playwright reported no dynamic network requests; only the static widget request was present.

## Tool/API Outputs Compared

- Source output: fixture structured content for Work Contract Card and Codex Handoff Preview
- Rendered view matched at a high level: yes
- Differences: none observed for the scoped fields

## Observations

- [x] UI loads.
- [x] Target card/view renders.
- [x] Missing-data state renders.
- [x] Boundary text visible.
- Notes: the `Copy Codex Handoff` button is visible inside the Codex Handoff Preview near the visible preformatted packet.

## Missing Data / Error States

- Missing-data state inspected: static fixture included the preview packet and expected fields; smoke coverage separately verifies missing optional fields render fallback text.
- Error or unavailable-runtime state inspected: not applicable to this static widget fixture.
- Concrete status shown instead of fabricated data: yes
- Notes: no runtime refs, evidence IDs, proof IDs, action IDs, work-event IDs, or PR refs were fabricated.

## Screenshots / Artifacts

- Screenshot/artifact refs if available: none; no screenshots or media artifacts were committed.
- [x] No secrets captured.
- [x] No raw tokens, private keys, local env values, hidden provider/debug identifiers, or tunnel credentials captured.
- Notes: the temporary Playwright script was stored under `/tmp/augnes-widget-copy-verify.js` and is not part of the repo diff.

## Unauthorized Controls Check

- [x] No Run Codex control visible.
- [x] No commit/reject control visible.
- [x] No approve/publish/retry/replay/external-posting control visible.
- [x] No merge/auto-merge control visible.
- [x] No proof/evidence recording control visible.
- Notes: exactly one button was present, labeled `Copy Codex Handoff`. Clicking it kept the same URL, updated local status to `Handoff copied.`, and produced no `fetch`, `XMLHttpRequest`, `WebSocket`, or `EventSource` calls.

## Authority Boundary Confirmation

- [x] Browser/computer-use verification is observation only.
- [x] It does not approve, publish, retry, replay, externally post, merge, enable auto-merge, commit/reject state, record proof, or record evidence.
- [x] Proof is not approval.
- [x] PR is not merge authority.
- [x] Durable approval remains user/Core gated.
- Notes: verification did not call runtime write routes, GitHub, OpenAI, proof/evidence helpers, or Augnes state mutation routes.

## Skipped Checks And Reasons

- Check: ChatGPT Developer Mode tunnel/session
- Concrete reason: not used; static browser verification was sufficient for this bounded widget behavior.

- Check: screenshots/media artifacts
- Concrete reason: not requested and not needed for the scoped copy/status/network observation.

## Gaps / Follow-ups

- Gap: this verification used static fixture content rather than a live ChatGPT Developer Mode widget session.
- Follow-up: run Developer Mode inspection later if a tunnel/session is explicitly available and scoped.
- Owner: user/Core

## Result

- Result: passed
- Summary: The Codex Handoff Preview renders a single safe copy button, keeps the packet visible, shows local copy status, does not navigate, and does not issue network/write calls on click.

## Notes

- Additional context: raw DB paths remained absent from the normal user-facing fixture flow; the static fixture did not start or depend on an Augnes runtime database.
