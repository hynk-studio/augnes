# Augnes ChatGPT-Codex Work Loop v0.1 Developer Mode Read-Only Retry

## Summary

Date: 2026-06-16

This note records a clean real ChatGPT Developer Mode retry for the
preview-only ChatGPT-Augnes-Codex work loop v0.1 after PR #600. The retry used
the narrowed `AUGNES_APP_TOOL_SURFACE=work_loop_readonly` profile, created a
fresh HTTPS MCP endpoint, connected a new ChatGPT Developer Mode connector, and
observed read-only Work Picker and Work Brief tool calls rendering inside the
ChatGPT host. Unlike the PR #599 attempt, the read-only calls reached the
Augnes bridge and rendered the widget iframe.

No product behavior changes are included in this PR. This is a docs-only host
observation closeout.

## Baseline

- Repository: `hynk-studio/augnes`
- Commit checked: `77ef134`
- Baseline PR: PR #600,
  `Add read-only work-loop Developer Mode profile`
- Snapshot doc:
  `docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_SNAPSHOT.md`
- Prior Developer Mode blocker:
  `docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_DEVELOPER_MODE_OBSERVATION.md`
- Read-only profile note:
  `docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_READONLY_DEVELOPER_PROFILE.md`
- Observation mode: docs-only, no product behavior changes

## Existing Connector Inventory

Existing ChatGPT Developer Mode settings were inspected before creating the
fresh narrowed connector.

Observed enabled DEV apps:

- `Augnes Constellation Preview Local`
- `Augnes Work Loop Local`
- `GitHub`

Observed drafts:

- `Augnes Work Loop Local`
- `Augnes Constellation Preview Local`

The existing `Augnes Work Loop Local` app was connected on 2026-06-16 and
pointed at the older temporary Cloudflare endpoint:

```text
https://semiconductor-pizza-mills-aspects.trycloudflare.com/mcp
```

That connector still advertised the broader action surface, including
write-labeled actions such as `augnes_generate_codex_handoff_draft`,
`augnes_observe`, `augnes_record_action_result`,
`augnes_record_work_event`, and `augnes_review_codex_result_draft`. Its visible
manage menu exposed `Edit name` and `Delete`, but no safe URL retarget or
metadata refresh path. It was left in place because deleting account-side
connectors was not necessary for this read-only retry and could have removed
unrelated local host setup history.

## Fresh Narrowed Endpoint Setup

The retry used an isolated temp DB, non-default local ports, and a temporary
Cloudflare tunnel:

```text
AUGNES_DB_PATH=/tmp/augnes-developer-mode-readonly-retry-600.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-developer-mode-readonly-retry-600.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-developer-mode-readonly-retry-600.db npm run demo:seed
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-developer-mode-readonly-retry-600.db npm run dev -- --port 3143
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_APP_TOOL_SURFACE=work_loop_readonly AUGNES_API_BASE_URL=http://localhost:3143 PORT=8903 npm --prefix apps/augnes_apps run dev
cloudflared tunnel --url http://localhost:8903 --no-autoupdate
```

Observed local surfaces:

- Next runtime: `http://localhost:3143`
- App/MCP bridge: `http://localhost:8903/mcp`
- Temporary HTTPS MCP endpoint:
  `https://must-populations-technique-during.trycloudflare.com/mcp`

The direct local and HTTPS `/mcp` checks both returned the narrowed tool list:

- `augnes_list_work_items`
- `augnes_get_work_brief`

Both tools were advertised as read-only and non-destructive with
`execution.taskSupport: "forbidden"`. The narrowed endpoint did not advertise
`augnes_observe`, `augnes_record_action_result`,
`augnes_record_work_event`, `augnes_generate_codex_handoff_draft`,
`augnes_review_codex_result_draft`, `search`, `fetch`, or
`open_casefile`.

Direct local tool calls verified readiness before touching Developer Mode:

- `augnes_list_work_items(scope=project:augnes)` returned 5 candidates and
  recommended `AG-006`.
- `augnes_get_work_brief(scope=project:augnes, workId=AG-006)` returned a Work
  Contract Card, Core / Full handoff packets, `needs_result_input` result
  review state, and one seeded AG-006 event.

## Developer Mode Connector Result

A new ChatGPT Developer Mode connector was created through the host settings UI:

- Name: `Augnes Work Loop Readonly`
- Description: `Read-only Augnes work loop picker and brief.`
- URL: `https://must-populations-technique-during.trycloudflare.com/mcp`
- Authentication: `No Auth`
- Reference memories and chats: off
- Custom MCP risk acknowledgement: checked because the host required it

The host connected the app successfully and showed:

- App ID: `asdk_app_6a315711432c8191aab72aff388e4b28`
- Version ID: `asdk_app_v_6a315716ac30819189c2d8b389efc3db`
- Review status: `development`
- Actions:
  - `augnes_get_work_brief READ`
  - `augnes_list_work_items READ`

No write-labeled actions were visible for the new narrowed connector.

## Tool Invocation Result

### Work Picker

Prompt sent in a fresh ChatGPT conversation:

```text
Use the connected Augnes Work Loop Readonly app only. Call the read-only action augnes_list_work_items with {"scope":"project:augnes"}. Do not call write actions, non-read actions, web search, genui, or any other tools. Show the Work Picker result if the app renders one. If the host blocks the call, report the exact visible blocker.
```

Observed host behavior:

- ChatGPT showed `Looked for available tools`.
- ChatGPT showed `Called tool`.
- The connector label was `Augnes Work Loop Readonly`.
- No safety blocker was shown.
- The Work Picker result rendered.
- AG-006 was visible and recommended.
- The visible candidate list included `AG-006`, `AG-004`,
  `AG-TEMPORAL-INTERPRETATION`, `AG-001`, and `AG-000`.
- The rendered boundary text stated that the picker does not execute Codex,
  create branches or PRs, call GitHub or providers, record proof/evidence,
  mutate state, approve, publish, merge, retry, replay, or deploy.

### Work Brief

Follow-up prompt in the same ChatGPT conversation:

```text
Use the connected Augnes Work Loop Readonly app only. Call augnes_get_work_brief with {"scope":"project:augnes","workId":"AG-006"}. Do not call write actions, non-read actions, web search, genui, or any other tools. Show the Work Contract Card if the app renders one.
```

Observed host behavior:

- ChatGPT called the `Augnes Work Loop Readonly` tool successfully.
- No safety blocker was shown.
- The Work Contract Card rendered for `AG-006`.
- The card showed `AG-006 - Coordination event spine schema and storage`,
  status `in_progress`, priority `now`, scope `project:augnes`, summary, and
  next action.
- The widget showed explicit absence of expected files for AG-006 and the
  expected curl checks:

```text
curl -sS "http://localhost:3000/api/work/AG-006?scope=project%3Aaugnes" | jq .
curl -sS "http://localhost:3000/api/work/AG-006/brief?scope=project%3Aaugnes" | jq .
```

The local Next runtime log recorded only read-only GET requests for the host
path:

```text
GET /api/work?scope=project%3Aaugnes 200
GET /api/work/AG-006/brief?scope=project%3Aaugnes 200
```

## Widget And Iframe Observations

Developer Mode rendered the widget in an iframe with the resource:

```text
ui://widget/augnes-console.v2.html
```

The sandbox host URL was under:

```text
persistent-oaistatic-com.web-sandbox.oaiusercontent.com
```

Visible widget header:

```text
Augnes: Evidence & Continuity Console
v1 read-only
profile: public
```

The host also showed a `CSP off` app control near the widget. This was observed
as host UI state, not as an Augnes product failure.

Observed Work Brief sections included:

- Work Contract Card
- related state
- proof and evidence expectations, read-only
- Work Event Spine, read-only
- Event Timeline
- Event Inspector
- Result Closure
- Codex handoff package
- Core / Full handoff recommendation
- Work result review
- prepared pieces preview
- copyable Core packet text
- copyable Full packet text

The AG-006 event spine showed one seeded event:

- event type: `handoff_ready`
- event ID: `event:ag-006-spine-storage-handoff`
- created at: `2026-05-08T00:00:00.000Z`
- payload ref:
  `docs/AUGNES_COORDINATION_SPINE_ROADMAP.md#pr-11-event-spine-schema-and-storage`
- sort order: `created_at_ascending`
- missing fields: `0`
- warnings: `0`

The no-result review and closure state rendered in Developer Mode:

- result review: `Needs result input`
- result input: not provided
- no invented changed files, verification items, skipped checks, remaining
  caveats, PR URL, proof ID, evidence ID, screenshot, or host observation
- closure recommendation: `Needs result input`
- follow-up seed: visible preview-only text asking for Codex final report text,
  changed files, verification commands/results, skipped checks or explicit
  none-skipped statement, remaining caveats, and an authority boundary
  statement

## Layout / Scroll / Overflow

Observed layout behavior:

- ChatGPT page scroll worked.
- The widget iframe remained visible and readable inside the host.
- Deep Work Brief sections were reachable by scrolling.
- Technical details did not dominate the first visible Work Brief view.
- Long expected-check text remained contained.
- The Work Event Spine and Result Closure sections remained readable after
  scrolling.
- No horizontal overflow made the main Work Picker or Work Brief text
  unreadable in the desktop pass.
- The host composer was sticky at the bottom of the page and could overlap the
  lower viewport, but the widget content remained reachable by scrolling.

Mobile/responsive behavior was not rechecked in this Developer Mode pass.

## Clipboard Observations

The `Copy Codex Handoff` control was clicked in Developer Mode after setting the
system clipboard to a sentinel value. Independent `pbpaste` read-back returned
the Core Codex Handoff packet, not the sentinel.

Observed clipboard result:

- copied text length: `8333` bytes
- copied text began with `Core Codex Handoff Packet`
- copied text included the AG-006 title, read-brief start preview, Core usage
  guidance, expected curl checks, memory reuse summary, PR checklist summary,
  and authority boundary text

This verifies the Core handoff copy path in the real ChatGPT Developer Mode
host. `Copy Full Context` remained unverified because the desktop
computer-use attachment went stale before a second trustworthy click/read-back
cycle could be completed.

## Result-State Scenarios

The no-result state was observed through the Developer Mode Work Brief render.
The partially verified completed result, aligned completed result, and blocked
result scenarios were not rerun through ChatGPT Developer Mode in this pass
after the computer-use session stopped reattaching to the active browser
window. Those scenarios remain covered by deterministic smoke and prior local
browser/MCP observation, but this note does not claim Developer Mode rendering
for them.

## Screenshots / Artifacts

Computer-use state captures observed the Developer Mode settings inventory,
new connector action list, Work Picker render, Work Brief render, iframe/widget
content, and Core copy control before the desktop attachment stopped
reattaching. No screenshot binaries are committed in this docs-only PR.

The ChatGPT conversation and connector IDs above are local host observation
notes. They are not durable Augnes proof/evidence rows, and they should not be
treated as externally published validation artifacts.

## Cleanup

The temporary local processes were stopped:

- Cloudflare tunnel
- App/MCP bridge on port `8903`
- Next runtime on port `3143`

Post-cleanup checks found no listeners on ports `3143` or `8903`, and no
remaining `cloudflared` process for the `8903` tunnel.

The account-side `Augnes Work Loop Readonly` connector was left in place. It is
a clearly named test connector, but deleting it would be an account-side host
mutation beyond the minimum needed to document the observation. Because the
temporary Cloudflare tunnel was stopped, its configured URL is expected to be
unreachable after cleanup.

## Authority Boundaries

No product/App/MCP write authority was added or invoked by this observation
pass:

- no Codex execution from App/MCP
- no shell execution from App/MCP
- no product/App/MCP GitHub API calls
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

Local developer shell commands were used only to start and verify the isolated
runtime, bridge, and temporary HTTPS tunnel. ChatGPT Developer Mode invoked only
the narrowed read-only tools.

## Skipped Checks

- Developer Mode partial/aligned/blocked result-state rendering: skipped
  because the computer-use attachment stopped reattaching to the active browser
  after the Work Brief and Core copy observations; deterministic smoke and
  prior local host observation still cover the structured result mappings.
- Developer Mode `Copy Full Context` clipboard read-back: skipped for the same
  stale computer-use reattachment reason. The button was observed, but the
  second click/read-back cycle was not trustworthy enough to claim.
- Mobile/responsive Developer Mode check: skipped to keep this pass focused on
  the real host connector, read-only calls, iframe rendering, and copy behavior.
- Committed screenshots: skipped to keep the PR documentation-only and avoid
  committing local account/session artifacts.
- Account-side connector deletion: skipped because deletion was unnecessary for
  the observation and would mutate ChatGPT account-side connector settings.
- Proof/evidence closeout: skipped because this task explicitly preserves no
  proof/evidence writes.

## Remaining Caveats

- The new `Augnes Work Loop Readonly` connector points at a stopped temporary
  Cloudflare URL after cleanup and should not be treated as durable.
- The Developer Mode host displayed `profile: public` in the widget header even
  though the connected MCP tool surface was narrowed to the two read-only work
  loop tools. The visible ChatGPT action list and direct `/mcp` checks are the
  source of truth for the narrowed surface in this pass.
- Result-state variants beyond no-result still need a future Developer Mode
  observation if host-specific rendering for partial/aligned/blocked results is
  required.
- `Copy Full Context` still needs one trustworthy Developer Mode clipboard
  read-back before it can be marked verified in that host.

## Verification Commands

Minimum validation for this docs-only observation PR:

```text
npm run typecheck
npm --prefix apps/augnes_apps run typecheck
npm run smoke:chatgpt-work-contract-card
node scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs
node scripts/smoke-work-loop-readonly-developer-profile.mjs
git diff --check
git diff --cached --check
```

## Next Recommended Step

Run one focused follow-up Developer Mode pass only if the project needs
host-specific evidence for the partial, aligned, and blocked result-state
renders or `Copy Full Context` clipboard read-back. Otherwise, the v0.1
preview-only loop now has deterministic smoke, local host/MCP observation, and
real ChatGPT Developer Mode evidence for the narrowed Work Picker, Work Brief,
iframe rendering, event/closure no-result surfaces, and Core handoff copy path.
