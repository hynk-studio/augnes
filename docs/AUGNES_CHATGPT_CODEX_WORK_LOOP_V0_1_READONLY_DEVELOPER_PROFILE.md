# Augnes ChatGPT-Codex Work Loop v0.1 Read-Only Developer Profile

## Summary

Date: 2026-06-16

This note records the PR #599 follow-up experiment to reduce ChatGPT Developer
Mode host safety friction for the preview-only ChatGPT-Augnes-Codex work loop
v0.1. The implementation adds a narrow App/MCP tool surface selected by
`AUGNES_APP_TOOL_SURFACE=work_loop_readonly`. In that surface, the server
advertises only the two read-only work-loop tools needed for Developer Mode
observation. Direct local and tunnel `/mcp` checks verified the narrowed
surface. A ChatGPT Developer Mode retest was attempted in ChatGPT Atlas, but
the host UI did not expose a usable create/update path for retargeting a draft
connector to the new narrow tunnel, so no new Developer Mode tool invocation,
iframe, or clipboard result is claimed.

A follow-up retry after PR #600 created a fresh narrowed connector and observed
real ChatGPT Developer Mode Work Picker, Work Brief, iframe, and Core copy
behavior in
`docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_DEVELOPER_MODE_READONLY_RETRY.md`.

## Baseline

- Repository: `hynk-studio/augnes`
- Commit checked before this PR: `3d7690a`
- Baseline PR: PR #599,
  `Document Developer Mode work loop host observation`
- Prior Developer Mode note:
  `docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_DEVELOPER_MODE_OBSERVATION.md`
- Snapshot doc:
  `docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_SNAPSHOT.md`

## PR #599 Hypothesis

PR #599 proved that ChatGPT Developer Mode could create and connect an Augnes
DEV app over HTTPS, and that the host listed `augnes_list_work_items READ` and
`augnes_get_work_brief READ`. The first attempted read-only
`augnes_list_work_items` call was blocked by OpenAI safety checks before it
reached the Augnes bridge. That same broader app action list also contained
write-labeled actions such as `augnes_observe`,
`augnes_record_action_result`, and `augnes_record_work_event`.

This follow-up tests the narrower hypothesis: the Developer Mode host safety
check may be sensitive to the broader action surface, so a work-loop-only
read-only tool surface may reduce safety friction.

## Profile

The new profile is selected by:

```text
AUGNES_APP_TOOL_SURFACE=work_loop_readonly
```

The default remains:

```text
AUGNES_APP_TOOL_SURFACE=public
```

The new profile does not change the existing public surface unless the env var
is set.

## Exposed Actions

With `AUGNES_APP_TOOL_SURFACE=work_loop_readonly`, the App/MCP server
advertises only:

- `augnes_list_work_items`
- `augnes_get_work_brief`

Both tools retain:

- `readOnlyHint: true`
- `destructiveHint: false`
- `openWorldHint: true`
- `execution.taskSupport: "forbidden"`
- the existing widget resource URI

## Intentionally Omitted Actions

The narrowed surface intentionally omits legacy public tools and broader bridge
tools, including:

- `search`
- `fetch`
- `open_casefile`
- `get_working_view`
- `explain_strategy`
- `get_boundary_packet`
- `get_continuity_report`
- `navigate_repo`
- `get_governance_audit`
- `augnes_observe`
- `augnes_record_action_result`
- `augnes_record_work_event`
- `augnes_generate_codex_handoff_draft`
- `augnes_review_codex_result_draft`
- publication summary / decision-card bridge tools

No publish, merge, retry, replay, deploy, proof, evidence, work-close, event,
state-commit, Codex execution, shell execution, GitHub, or provider action is
added to the profile.

## Runtime Setup

The observed runtime used an isolated temp DB, non-default local ports, and a
temporary Cloudflare tunnel:

```text
AUGNES_DB_PATH=/tmp/augnes-work-loop-readonly-profile-600.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-work-loop-readonly-profile-600.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-work-loop-readonly-profile-600.db npm run demo:seed
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-work-loop-readonly-profile-600.db npm run dev -- --port 3141
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_APP_TOOL_SURFACE=work_loop_readonly AUGNES_API_BASE_URL=http://localhost:3141 PORT=8901 npm --prefix apps/augnes_apps run dev
cloudflared tunnel --url http://localhost:8901 --no-autoupdate
```

Observed local surfaces:

- Next runtime: `http://localhost:3141`
- App/MCP bridge: `http://localhost:8901/mcp`
- Temporary HTTPS MCP endpoint:
  `https://discovered-acrylic-math-though.trycloudflare.com/mcp`

## Direct MCP Verification

Direct JSON-RPC checks against `http://localhost:8901/mcp` verified:

- `initialize` returned `augnes-console` version `0.1.0`.
- `tools/list` returned exactly:
  - `augnes_list_work_items`
  - `augnes_get_work_brief`
- Both tool descriptors carried the expected read-only annotations and
  `execution.taskSupport: "forbidden"`.

The same `initialize` and `tools/list` checks were also run against the
temporary HTTPS tunnel endpoint and returned the same two-tool narrowed
surface.

Direct local tool calls verified the narrowed profile still supports:

- `augnes_list_work_items(scope=project:augnes)`, with AG-006 present and
  recommended.
- `augnes_get_work_brief(scope=project:augnes, workId=AG-006)` with no
  `codexResult`, returning `needs_result_input`.
- A simulated partially verified completed result, returning conservative
  additional-verification guidance.
- A simulated aligned completed result, returning close-ready guidance.
- A simulated blocked result, returning incomplete-or-blocked guidance.
- AG-006 event spine timeline with one seeded coordination event and
  `created_at_ascending` sort order.
- Result closure preview aliases and follow-up seed preview data.

These direct bridge checks are not Developer Mode observations; they only prove
the new profile is reachable and narrow at the MCP surface.

## ChatGPT Developer Mode Retest

Host used: ChatGPT Atlas with Computer Use.

Observed host path:

- Settings -> Apps opened successfully.
- Advanced settings showed Developer Mode controls and the elevated-risk
  Developer Mode label.
- Developer Mode drafts were visible.
- Existing draft `augnes_test` could be opened.
- The existing draft still pointed at an older temporary Cloudflare `/mcp` URL
  and listed the broader action surface.
- The draft overflow menu exposed only `Edit name` and `Delete`; no URL edit
  or refresh control was visible.
- The visible Connect button would have connected the old broad draft, not the
  new narrowed profile, so it was not used for the retest.

Create/update routes attempted:

- `https://chatgpt.com/apps/create/` returned a ChatGPT 404 page.
- `https://chatgpt.com/apps#settings/Connectors` returned App Preferences, not
  a connector creation form.
- `https://chatgpt.com/apps#settings/Connectors/create` returned App
  Preferences, not a connector creation form.
- The public Apps page `Add more` path opened the app gallery rather than a
  Developer Mode connector creation form.

Result: no new ChatGPT Developer Mode connector was created for the narrowed
profile, and no existing draft was retargeted. No Developer Mode
`augnes_list_work_items` call reached the narrowed bridge. No iframe/widget,
scroll, overflow, or clipboard behavior is claimed from Developer Mode in this
pass.

## Authority Boundaries

This PR preserves the same preview-only authority boundary:

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
- no durable persistence

Local developer shell commands were used only to run an isolated runtime,
bridge, tunnel, smokes, and validation checks.

## Verification

Requested validation for this PR:

```text
npm run typecheck
npm --prefix apps/augnes_apps run typecheck
npm run smoke:chatgpt-work-contract-card
node scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs
node scripts/smoke-work-loop-readonly-developer-profile.mjs
git diff --check
git diff --cached --check
```

Additional app smoke run:

```text
npm --prefix apps/augnes_apps run smoke
```

An extra non-required check, `npm --prefix apps/augnes_apps run invariants`,
was also tried and failed on an existing constellation preview annotation
expectation unrelated to this profile. That failure was not widened in this
PR.

## Skipped Checks

- Developer Mode narrowed-profile app creation: skipped because the observed
  host UI exposed existing drafts and public app gallery navigation, but no
  usable create form for the narrowed tunnel.
- Developer Mode draft retargeting: skipped because the selected draft menu
  exposed only `Edit name` and `Delete`, not URL edit or refresh.
- Developer Mode `augnes_list_work_items` invocation: skipped because no
  narrowed-profile app could be created or retargeted.
- Developer Mode iframe/widget/clipboard observation: skipped because no
  narrowed-profile tool invocation reached the host rendering path.
- Proof/evidence closeout: skipped because this task explicitly preserves no
  proof/evidence writes.

## Remaining Caveats

- The narrowed profile is verified at the source, smoke, local `/mcp`, and
  tunnel `/mcp` levels, but not as a completed ChatGPT Developer Mode tool
  invocation.
- The temporary Cloudflare URL is not durable and is expected to stop working
  after local cleanup.
- The host UI for Developer Mode connector creation appears to have changed
  from the path documented in the Apps SDK docs, or the Create control was not
  available in this account/session surface.
- PR #599's original safety-check blocker remains unresolved until a
  narrowed-profile Developer Mode connector can be created or retargeted.

## Next Recommended Step

Retry the same narrowed profile from a Developer Mode host session that exposes
the connector Create or URL-edit flow. If creation succeeds, verify that the
host action list contains only `augnes_list_work_items READ` and
`augnes_get_work_brief READ`, then attempt `augnes_list_work_items` before any
widget, iframe, or clipboard claims.
