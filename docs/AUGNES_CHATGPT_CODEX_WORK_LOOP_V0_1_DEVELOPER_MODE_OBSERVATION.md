# Augnes ChatGPT-Codex Work Loop v0.1 Developer Mode Observation

## Summary

Date: 2026-06-16

This note records a real ChatGPT Developer Mode host attempt for the
preview-only ChatGPT-Augnes-Codex work loop v0.1 after PR #598. The pass used
an isolated Augnes runtime, a read-only App/MCP bridge, and a verified HTTPS
MCP endpoint. ChatGPT Developer Mode app creation and connection succeeded, but
the first read-only Augnes work-loop tool invocation was blocked by OpenAI
safety checks before it reached the bridge. No Developer Mode work-loop widget,
iframe, or clipboard behavior is claimed.

## Baseline

- Repository: `hynk-studio/augnes`
- Commit checked: `ff30175`
- Baseline PR: PR #598, `Document work loop v0.1 host observation`
- Snapshot doc: `docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_SNAPSHOT.md`
- Prior host observation doc:
  `docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_HOST_OBSERVATION.md`
- Observation mode: docs-only, no product behavior changes

## HTTPS MCP Endpoint Setup

The observed runtime used isolated local ports and an isolated temp DB:

```text
AUGNES_DB_PATH=/tmp/augnes-developer-mode-observation-598.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-developer-mode-observation-598.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-developer-mode-observation-598.db npm run demo:seed
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-developer-mode-observation-598.db npm run dev -- --port 3139
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3139 PORT=8899 npm --prefix apps/augnes_apps run dev
cloudflared tunnel --url http://localhost:8899 --no-autoupdate
```

Observed local surfaces:

- Next runtime: `http://localhost:3139`
- App/MCP bridge: `http://localhost:8899/mcp`
- Temporary HTTPS MCP endpoint:
  `https://semiconductor-pizza-mills-aspects.trycloudflare.com/mcp`

The HTTPS `/mcp` endpoint was verified before Developer Mode setup with a
read-only JSON-RPC `initialize` request. It returned `augnes-console` version
`0.1.0`.

Direct local bridge checks also confirmed:

- `augnes_list_work_items` with `scope=project:augnes` returned AG-006 as the
  recommended work item.
- `augnes_get_work_brief` with `scope=project:augnes` and `workId=AG-006`
  returned `needs_result_input` result-review state and one seeded event.

These direct bridge checks are not Developer Mode observations; they only prove
the local bridge was ready before ChatGPT host setup.

## Developer Mode Setup Result

The ChatGPT Apps / Developer Mode New App flow was completed in Chrome:

- App name: `Augnes Work Loop Local`
- Connection: `Server URL`
- Server URL: verified HTTPS `/mcp` endpoint above
- Authentication: `No Auth`
- Custom MCP risk acknowledgement: checked
- Host add/connect screen: shown and accepted
- Reference memories and chats: off
- Connected date shown by host: `Jun 16, 2026`
- Review status shown by host: `development`

After connection, the app settings page listed the configured HTTPS URL,
authorization support `None`, authorization used `None`, and the app actions.
Relevant observed read actions included:

- `augnes_list_work_items READ`
- `augnes_get_work_brief READ`

The same app action list also showed existing write-labeled actions such as
`augnes_observe`, `augnes_record_action_result`, and
`augnes_record_work_event`. No write-labeled action was invoked during this
pass.

## Tool Invocations Observed

### Attempt 1: Work Picker

Prompt sent to ChatGPT:

```text
Use Augnes Work Loop Local only. Call the read-only action
augnes_list_work_items with {"scope":"project:augnes"}. Do not call write
actions or non-read actions. Show the Work Picker result if the app renders one.
```

Observed host behavior:

- ChatGPT displayed `Looked for available tools`.
- ChatGPT displayed `Calling tool`.
- ChatGPT reported that it attempted:

```json
{"scope":"project:augnes"}
```

against `Augnes_Work_Loop_Local.augnes_list_work_items`.

Visible blocker:

```text
This tool call was blocked by OpenAI's safety checks. Please double check what you are sending.
```

No Work Picker result was returned or rendered. No request for this ChatGPT
attempt appeared in the local bridge, runtime, or tunnel logs, so the block
occurred before the Augnes App/MCP bridge received a tool invocation.

### Attempt 2: Explicit Single-Call Authorization

Prompt sent to ChatGPT:

```text
I explicitly authorize this connected DEV app to make exactly one read-only
call: Augnes_Work_Loop_Local.augnes_list_work_items with
{"scope":"project:augnes"}. Do not call any write actions or other tools. If
the host blocks it again, report the exact visible blocker.
```

Observed host behavior:

- ChatGPT did not complete the requested Augnes call.
- ChatGPT reported that it inadvertently invoked `genui.search` instead of
  `Augnes_Work_Loop_Local.augnes_list_work_items`.
- ChatGPT repeated the prior visible blocker as the last Augnes blocker:

```text
This tool call was blocked by OpenAI's safety checks. Please double check what you are sending.
```

Again, no Augnes bridge, runtime, or tunnel request was observed for this
follow-up prompt.

## Widget / Iframe Observations

No Developer Mode work-loop widget or iframe rendering is claimed.

Because the read-only `augnes_list_work_items` call was blocked before reaching
the local App/MCP bridge, the following surfaces were not observed in ChatGPT
Developer Mode:

- Work Picker
- Work Contract Card
- Core / Full handoff controls
- Codex result review
- Work Event Spine Timeline / Inspector
- Result Closure / Follow-up Recommendation

## Clipboard Findings

No Developer Mode copy-control or clipboard behavior is claimed.

The host did not render the Work Contract Card or handoff controls, so
`Copy Codex Handoff` and `Copy Full Context` could not be clicked or
independently verified in Developer Mode.

## Screenshots / Artifacts

Computer-use state captures observed the Developer Mode form, connected app
settings, tool list, and blocked tool-call response. No screenshot binaries are
committed in this docs-only PR.

The ChatGPT conversation URL was visible during observation, but it is not used
as proof and should not be treated as durable Augnes evidence.

## Authority Boundaries

No product/App/MCP write authority was added or invoked by this observation
pass:

- no Codex execution from App/MCP
- no shell execution from App/MCP
- no GitHub API calls from product/App/MCP code
- no provider/OpenAI calls from product/App/MCP code
- no proof/evidence writes
- no event creation/mutation
- no work close/status update
- no state commit/reject
- no branch/PR creation from product/App/MCP code
- no PR review submission
- no merge/publish/retry/replay/deploy controls
- no durable lifecycle automation
- no DB schema or migration changes
- no package script behavior changes

A ChatGPT Developer Mode app was created and connected as a host-side
observation step. Only local developer shell commands were used to start the
isolated runtime, bridge, and temporary HTTPS tunnel. Only direct local
read-only bridge checks completed; no ChatGPT Developer Mode Augnes tool
invocation reached the bridge.

## Skipped Checks

- Developer Mode Work Picker rendering: skipped because
  `augnes_list_work_items` was blocked by OpenAI safety checks before reaching
  the bridge.
- Developer Mode Work Contract Card rendering: skipped because the Work Picker
  call did not complete and no `augnes_get_work_brief` Developer Mode call was
  reached.
- Developer Mode result-review scenarios: skipped because no read-only Augnes
  Developer Mode tool invocation reached the bridge.
- Developer Mode event spine and closure rendering: skipped because no
  work-brief Developer Mode result rendered.
- Developer Mode copy/clipboard verification: skipped because the handoff
  controls did not render in Developer Mode.
- Committed screenshots: skipped to keep the PR documentation-only and avoid
  adding binary artifacts for local-only host screenshots.
- Proof/evidence closeout: skipped because this task explicitly preserves no
  proof/evidence writes.

## Remaining Caveats

- A real ChatGPT Developer Mode iframe and clipboard pass is still unobserved.
- The concrete blocker is now narrower than PR #598: app creation and
  connection over a verified HTTPS endpoint succeeded, but the read-only
  Augnes tool invocation was blocked by host safety checks before bridge
  contact.
- The connected DEV app points at a temporary Cloudflare URL. After tunnel
  cleanup, that URL is not expected to remain reachable.
- The app action list includes write-labeled tools from the broader Augnes
  app surface. This pass did not invoke them, but future host validation should
  keep prompts tightly scoped to read-only actions.

## Verification Commands

Minimum validation for this docs-only observation PR:

```text
npm run typecheck
npm --prefix apps/augnes_apps run typecheck
npm run smoke:chatgpt-work-contract-card
node scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs
git diff --check
git diff --cached --check
```

## Next Recommended Step

Before retrying Developer Mode iframe validation, reduce host safety friction:
either expose a narrower read-only-only Developer Mode app surface for the
work-loop tools or identify the exact ChatGPT host safety criterion blocking
`Augnes_Work_Loop_Local.augnes_list_work_items`. Then rerun the same AG-006
Work Picker -> Work Brief -> result-state scenarios and clipboard checks.
