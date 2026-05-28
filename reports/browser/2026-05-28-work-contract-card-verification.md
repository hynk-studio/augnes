# Work Contract Card Browser Verification

Browser/computer-use verification report for: PR #265 Work Contract Card.

## Related PR

- PR: #265
- This PR: https://github.com/Aurna-code/augnes/pull/271
- Work ID: `AG-004`
- Handoff ID: none supplied
- Related state keys: `integration.chatgpt_app`, `implementation.stack`

## Date

- Date: 2026-05-28 UTC / 2026-05-29 Asia/Seoul
- Timezone: Asia/Seoul for local command execution

## Verifier / Surface

- Verifier: Codex using Playwright MCP Chromium browser observation
- Verification surface: browser / computer-use via Playwright MCP
- Target UI surface: ChatGPT App Work Contract Card rendered by `apps/augnes_apps/public/console-widget.html`

## Environment

- Repository branch: `codex/work-contract-card-browser-verification`
- Source commit before report creation: `28ab7f6`
- Node/npm versions: Node `v24.13.0`, npm `11.6.2`
- Operating system: Linux WSL2, `5.15.167.4-microsoft-standard-WSL2`
- Browser or runtime: Playwright MCP Chromium using cached Chromium under `/home/hynk1/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome`
- Local runtime availability: available through ephemeral demo DB mode at `http://127.0.0.1:3000`
- ChatGPT Developer Mode tunnel/session availability: not used; no Developer Mode tunnel or session was provided for this local verification

## Local Startup

- [x] Augnes runtime startup attempted.
- [x] Augnes App / MCP bridge startup attempted.
- Commands or skipped reason:

```bash
AUGNES_DB_PATH=/tmp/augnes-browser-verification.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-browser-verification.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-browser-verification.db npm run demo:seed
AUGNES_DB_PATH=/tmp/augnes-browser-verification.db npm run dev -- --port 3000
AUGNES_API_BASE_URL=http://127.0.0.1:3000 CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-004 npm run codex:read-brief
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://127.0.0.1:3000 PORT=8787 npm --prefix apps/augnes_apps run start
curl -fsS http://127.0.0.1:8787/healthz
```

Runtime and bridge startup were run inside a bounded local lifecycle and stopped after extracting the tool result. A temporary localhost harness server at `http://127.0.0.1:8123/harness.html` was used only to let Playwright MCP inspect the existing widget over HTTP; it was not committed.

## Views Checked

- URL or app surface: `http://127.0.0.1:8123/harness.html`
- Cockpit tab or widget/card: existing console widget iframe rendering `panel: work_contract_card`
- View state inspected: Work Contract Card for `CODEX_SCOPE=project:augnes`, `CODEX_WORK_ID=AG-004`

## Commands Run

- Command: `git status --short --branch`
  - Result: passed; branch was clean before edits.
  - Notes: report work started from `origin/main`.
- Command: `AUGNES_DB_PATH=/tmp/augnes-browser-verification.db npm run db:reset`
  - Result: passed.
  - Notes: reset only the temp demo DB.
- Command: `AUGNES_DB_PATH=/tmp/augnes-browser-verification.db npm run db:migrate`
  - Result: passed.
  - Notes: migrations reported current schema/no-op states.
- Command: `AUGNES_DB_PATH=/tmp/augnes-browser-verification.db npm run demo:seed`
  - Result: passed.
  - Notes: seeded `project:augnes` including `AG-004`.
- Command: single-shell local runtime startup plus `npm run codex:read-brief`
  - Result: passed.
  - Notes: read brief returned `AG-004`, title `Codex completion protocol`, status `in_progress`.
- Command: local App/MCP bridge startup plus `curl -fsS http://127.0.0.1:8787/healthz`
  - Result: passed.
  - Notes: bridge health returned `ok: true`, `readOnly: true`, `profile: public`.
- Command: bridge `augnes_get_work_brief` handler for `AG-004`
  - Result: passed.
  - Notes: returned `panel: work_contract_card`, eight authority boundary text entries, zero expected files, two expected checks, and two related state keys.
- Command: Playwright MCP Chromium open and accessibility snapshot for the temporary harness URL
  - Result: passed.
  - Notes: UI rendered the target card; a favicon 404 was the only console error observed.
- Command: `npm run typecheck`
  - Result: passed.
  - Notes: `tsc --noEmit` completed without errors.
- Command: `npm run smoke:browser-verification-report-template`
  - Result: passed.
  - Notes: template/runbook smoke reported required headings, unauthorized-control checks, and authority boundaries present.
- Command: `npm run smoke:chatgpt-work-contract-card`
  - Result: passed.
  - Notes: smoke reported boundary text present, fallback render without throwing, direct network calls absent, and forbidden controls absent.
- Command: `npm run smoke:codex-mcp-augnes-bridge-docs`
  - Result: passed.
  - Notes: smoke reported bridge URL/read tools documented and active MCP config absent.
- Command: `npm run smoke:augnes-operator-plugin-scaffold`
  - Result: passed.
  - Notes: smoke reported plugin scaffold valid and MCP/App mappings absent.
- Command: `npm run smoke:augnes-operator-plugin-hooks`
  - Result: passed.
  - Notes: smoke reported deterministic hook coverage and closeout guard verification.
- Command: `git diff --check`
  - Result: passed.
  - Notes: no whitespace errors reported.

## Tool/API Outputs Compared

- Source output: `augnes_get_work_brief` structured content from the local App/MCP bridge, backed by the local Augnes runtime at `http://127.0.0.1:3000`.
- Rendered view matched at a high level: yes.
- Differences: none material. The structured output had `expected_files_count: 0`; the rendered card showed the expected fallback text, `No expected files are listed in the work brief.`

Source summary:

```text
tool: augnes_get_work_brief
panel: work_contract_card
work_id: AG-004
work_title: Codex completion protocol
work_status: in_progress
priority: now
boundary_text_count: 8
expected_files_count: 0
expected_checks_count: 2
related_state_keys_count: 2
```

Rendered summary:

```text
Work Contract Card
Scope: project:augnes
Work ID: AG-004
Status: in_progress
Priority: now
Recent events: 1
Linked action IDs: 0
Linked PR refs: 0
Linked docs: 1
Expected files: 0, with missing-data fallback text
Expected checks: 2, both curl command checks rendered
Related state keys: integration.chatgpt_app, implementation.stack
```

## Observations

- [x] UI loads.
- [x] Target card/view renders.
- [x] Missing-data state renders.
- [x] Boundary text visible.
- Notes:
  - The widget status changed to `Tool output received. Text output remains authoritative if the panel cannot render.`
  - The panel title rendered as `Work Contract Card`.
  - The missing expected-files fallback rendered without throwing.
  - The proof/evidence expectation section rendered as read-only.
  - The only browser console error captured was a non-blocking `404` for `/favicon.ico` from the temporary harness server.

## Missing Data / Error States

- Missing-data state inspected: yes, `expected_files` was empty in the `AG-004` work brief and rendered `No expected files are listed in the work brief.`
- Error or unavailable-runtime state inspected: no.
- Concrete status shown instead of fabricated data: yes for the inspected missing-data state.
- Notes: unavailable-runtime error state was not inspected because the target verification required a successful runtime-backed Work Contract Card render and the local runtime was available.

## Screenshots / Artifacts

- Screenshot/artifact refs if available: no screenshot or media artifact was captured or committed.
- [x] No secrets captured.
- [x] No raw tokens, private keys, local env values, hidden provider/debug identifiers, or tunnel credentials captured.
- Notes: Playwright MCP generated a transient accessibility snapshot and console log under `.playwright-mcp/`; they were used for local observation only and are not part of the committed report artifact.

## Unauthorized Controls Check

- [x] No Run Codex control visible.
- [x] No commit/reject control visible.
- [x] No approve/publish/retry/replay/external-posting control visible.
- [x] No merge/auto-merge control visible.
- [x] No proof/evidence recording control visible.
- Notes:
  - The rendered target card exposed text, groups, lists, metrics, and details sections only.
  - No button, form, input, select, textarea, link, menu, or click-labeled write control was visible in the rendered card.
  - Boundary text includes prohibited actions as explicit prohibitions, not as controls.

## Authority Boundary Confirmation

- [x] Browser/computer-use verification is observation only.
- [x] It does not approve, publish, retry, replay, externally post, merge, enable auto-merge, commit/reject state, record proof, or record evidence.
- [x] Proof is not approval.
- [x] PR is not merge authority.
- [x] Durable approval remains user/Core gated.
- Notes: this report records an observational browser verification result only.

Visible boundary text confirmed:

```text
This card is read-only.
This card cannot execute Codex.
This card cannot commit or reject Augnes state.
This card cannot approve, publish, retry, replay, externally post, merge, or enable auto-merge.
Proof is not approval.
A PR is not merge authority.
Durable approval remains user/Core gated.
```

## Skipped Checks And Reasons

- Check: ChatGPT Developer Mode tunnel/session.
  - Concrete reason: no Developer Mode tunnel or ChatGPT session was provided or scoped; local Playwright browser observation was used instead.
- Check: MCP Inspector.
  - Concrete reason: the task target was browser/computer-use rendering, and the local App/MCP bridge health check plus direct `augnes_get_work_brief` bridge handler output were sufficient to compare tool output to the rendered widget.
- Check: screenshot/media capture.
  - Concrete reason: the task did not scope committing screenshots or media artifacts, and the accessibility snapshot provided enough observable detail for the report.
- Check: production/current Augnes runtime.
  - Concrete reason: no production/current runtime URL or work ID was supplied; this verification used the scoped ephemeral demo DB.
- Check: proof/evidence recording.
  - Concrete reason: this task requested a browser verification report, not runtime evidence/proof recording; browser verification is observation only.

## Gaps / Follow-ups

- Gap: verification used an ephemeral demo DB, not production/current Augnes state.
  - Follow-up: repeat against a supplied current-runtime work item if user/Core wants production-state validation.
  - Owner: user/Core to provide the runtime/work item.
- Gap: ChatGPT Developer Mode was not inspected.
  - Follow-up: repeat through a Developer Mode tunnel/session if that surface is explicitly scoped.
  - Owner: user/Core to provide the tunnel/session.
- Gap: no screenshot was committed.
  - Follow-up: capture a bounded screenshot artifact only if a future task explicitly scopes screenshot/media artifacts.
  - Owner: future verification task.

## Result

- Result: passed.
- Summary: The Work Contract Card rendered in Chromium from `augnes_get_work_brief` structured content for seeded demo work item `AG-004`. The card displayed missing-data fallback text, authority boundaries, read-only proof/evidence expectations, and no unauthorized controls. The result is observational only and does not approve, merge, commit/reject Augnes state, record proof, or record evidence.

## Notes

- Additional context: the Playwright CLI wrapper was present but not executable, so `bash ~/.codex/skills/playwright/scripts/playwright_cli.sh` was used for CLI diagnostics. The CLI default `chrome` launch failed because no system Chrome existed at `/opt/google/chrome/chrome`; Playwright MCP Chromium browser use succeeded through the existing cached Chromium runtime.
