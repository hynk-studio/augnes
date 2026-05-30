# Browser/computer-use verification report for: Work Contract Card Codex Handoff JSON block

## Related PR

- PR: pending
- Work ID: `AG-BROWSER-JSON` local fixture for rendered-widget verification only
- Handoff ID: none
- Related state keys: `coordination.work_contract_card`

## Date

- Date: 2026-05-30
- Timezone: Asia/Seoul

## Verifier / Surface

- Verifier: Codex via Playwright CLI
- Verification surface: browser
- Target UI surface: `apps/augnes_apps/public/console-widget.html` Work Contract Card / Codex Handoff Preview

## Environment

- Repository branch: `codex/handoff-json-block-preflight`
- Browser or runtime: Playwright-managed Chromium / Chrome for Testing
- Local runtime availability: not used
- ChatGPT Developer Mode tunnel/session availability: not used
- Static server: `python3 -m http.server 4179 --bind 127.0.0.1`

## Local Startup

- [ ] Augnes runtime startup attempted.
- [ ] Augnes App / MCP bridge startup attempted.
- Commands or skipped reason: browser verification used a static widget fixture served from the repo checkout. No Augnes runtime, bridge, runtime write route, proof route, evidence route, GitHub, OpenAI, or Codex execution route was started or called.

## Views Checked

- URL or app surface: `http://127.0.0.1:4179/apps/augnes_apps/public/console-widget.html`
- Cockpit tab or widget/card: Work Contract Card with Codex Handoff Preview
- View state inspected: fixture `work_contract_card` and `codex_handoff_preview` payload injected via widget `postMessage`

## Commands Run

- Command: `bash ~/.codex/skills/playwright/scripts/playwright_cli.sh open http://127.0.0.1:4179/apps/augnes_apps/public/console-widget.html --browser chromium`
- Result: passed
- Notes: opened static widget page; favicon 404 was the only console error.

- Command: `bash ~/.codex/skills/playwright/scripts/playwright_cli.sh run-code --filename /tmp/augnes-widget-json-block-verify.js --json`
- Result: passed
- Notes: returned `buttonCount: 1`, `buttons: ["Copy Codex Handoff"]`, `packetVisible: true`, `jsonBeginVisible: true`, `jsonEndVisible: true`, `hintVisible: true`, copied JSON schema `augnes.codex_handoff_preview.v0_1`, all copied `copy_packet` no-execution/no-proof/no-evidence/no-mutate/no-merge booleans `true`, `forbiddenLabels: []`, and `dynamicCalls: []`.

- Command: `bash ~/.codex/skills/playwright/scripts/playwright_cli.sh requests`
- Result: passed
- Notes: after the copy click, Playwright reported no dynamic network requests; only the static widget request was present.

## Tool/API Outputs Compared

- Source output: fixture structured content for Work Contract Card and Codex Handoff Preview
- Rendered view matched at a high level: yes
- Differences: fixture-only browser verification did not call the live Augnes runtime or ChatGPT Developer Mode bridge because this verification was scoped to static widget behavior.

## Observations

- [x] UI loads.
- [x] Target card/view renders.
- [x] JSON delimiters are visible in the copyable packet.
- [x] Local preflight hint text is visible.
- [x] Copy button copies the handoff packet with the structured JSON block.
- [x] Boundary text visible.
- Notes: exactly one button was present, labeled `Copy Codex Handoff`.

## Missing Data / Error States

- Missing-data state inspected: not the focus of this check; existing smoke coverage verifies fallback rendering.
- Error or unavailable-runtime state inspected: not applicable to this static widget fixture.
- Concrete status shown instead of fabricated data: yes
- Notes: no runtime refs, evidence IDs, proof IDs, action IDs, work-event IDs, or PR refs were fabricated.

## Screenshots / Artifacts

- Screenshot/artifact refs if available: none; no screenshots or media artifacts were committed.
- [x] No secrets captured.
- [x] No raw tokens, private keys, local env values, hidden provider/debug identifiers, or tunnel credentials captured.
- Notes: the temporary Playwright script was stored under `/tmp/augnes-widget-json-block-verify.js` and is not part of the repo diff.

## Unauthorized Controls Check

- [x] No Run Codex control visible.
- [x] No commit/reject control visible.
- [x] No approve/publish/retry/replay/external-posting control visible.
- [x] No merge/auto-merge control visible.
- [x] No proof/evidence recording control visible.
- [x] No command-running preflight button visible.
- Notes: the only button was `Copy Codex Handoff`. Clicking it updated local status to `Handoff copied.`, did not navigate, and produced no `fetch`, `XMLHttpRequest`, `WebSocket`, or `EventSource` calls.

## Authority Boundary Confirmation

- [x] Browser/computer-use verification is observation only.
- [x] It does not approve, publish, retry, replay, externally post, merge, enable auto-merge, commit/reject state, record proof, or record evidence.
- [x] Proof is not approval.
- [x] PR is not merge authority.
- [x] Durable approval remains user/Core gated.
- Notes: verification did not call runtime write routes, GitHub, OpenAI, proof/evidence helpers, or Augnes state mutation routes.

## Skipped Checks And Reasons

- Check: live Augnes runtime widget output
- Concrete reason: not used; task forbids runtime calls and this check was scoped to static widget rendering/copy behavior.

- Check: ChatGPT Developer Mode tunnel/session
- Concrete reason: not used; static browser verification was sufficient for the bounded widget behavior.

- Check: screenshots/media artifacts
- Concrete reason: not requested and not needed for the scoped copy/status/network observation.

## Gaps / Follow-ups

- Gap: this verification used static fixture content rather than a live ChatGPT Developer Mode widget session.
- Follow-up: run Developer Mode inspection later if a tunnel/session is explicitly available and scoped.
- Owner: user/Core

## Result

- Result: passed
- Summary: Static browser verification confirmed the Codex Handoff Preview renders a copyable packet with visible JSON delimiters, shows local preflight hint text, copies the structured JSON block, keeps exactly one local copy button, and does not show unauthorized execution/approval/publication/merge/proof/evidence controls or issue dynamic network calls on copy.
