# Augnes ChatGPT-Codex Work Loop v0.1 Host Observation

## Summary

Date: 2026-06-16

This note records a live-ish browser and MCP Inspector observation pass for the
preview-only ChatGPT-Augnes-Codex work loop v0.1 after PR #597. The deterministic
snapshot remains the source of contract coverage; this pass checks host behavior
that smoke tests cannot prove: iframe rendering, scroll reachability, section
visibility, copy controls, long packet readability, result review rendering,
event timeline rendering, and closure guidance rendering.

## Baseline

- Repository: `hynk-studio/augnes`
- Commit checked: `f34721b`
- Baseline PR: PR #597, `Document ChatGPT-Codex work loop snapshot`
- Snapshot doc: `docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_SNAPSHOT.md`
- Observation mode: docs-only, no product behavior changes

## Runtime Setup

The observed runtime used isolated local ports and an isolated temp DB after
setup:

```text
AUGNES_DB_PATH=/tmp/augnes-work-loop-host-observation-597.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-work-loop-host-observation-597.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-work-loop-host-observation-597.db npm run demo:seed
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-work-loop-host-observation-597.db npm run dev -- --port 3137
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3137 PORT=8897 npm --prefix apps/augnes_apps run dev
npx --yes http-server /tmp/augnes-work-loop-host-observation-597 -p 8799 -a 127.0.0.1
npx --yes @modelcontextprotocol/inspector@latest --transport http --server-url http://localhost:8897/mcp
```

Observed local surfaces:

- Next runtime: `http://localhost:3137`
- App/MCP bridge: `http://localhost:8897/mcp`
- Temporary widget harness: `http://127.0.0.1:8799`
- MCP Inspector UI: `http://localhost:6274`
- MCP Inspector proxy: `http://localhost:6277`
- Developer Mode follow-up HTTPS tunnel:
  `https://verbal-morning-reform-downloaded.trycloudflare.com/mcp`
  forwarded to `http://localhost:8897/mcp`

Setup friction: a probe of `npm run db:reset -- --help` and
`npm run demo:seed -- --help` executed the scripts because they do not implement
a help-only mode. That reset the ignored local `data/augnes.db`; git remained
clean. All host observation after that point used the isolated `/tmp` DB above.

A follow-up ChatGPT Developer Mode attempt used the same local runtime and
bridge ports with a second isolated DB path:
`/tmp/augnes-work-loop-host-observation-597-devmode.db`. The HTTPS tunnel was
created with:

```text
cloudflared tunnel --url http://localhost:8897 --no-autoupdate
```

The tunnel `/mcp` endpoint was verified with a read-only JSON-RPC
`initialize` request and returned `augnes-console` version `0.1.0`.

## Host Used

- ChatGPT Developer Mode: partial setup observed, but no tool/widget rendering
  claim. The ChatGPT Apps / Developer Mode New App form was reachable in
  Chrome. The form accepted the app name `Augnes Work Loop Local`, Server URL
  mode, `No Auth`, and the custom MCP risk acknowledgement. Plain
  `http://localhost:8897/mcp` was rejected by the host as an unsafe URL. A
  temporary HTTPS Cloudflare tunnel to the same local bridge was created and
  verified, but the available browser-control paths could not update and submit
  the already-open form: Computer Use could inspect the Chrome window but
  returned `not active` for click/key actions, shell AppleScript keystrokes were
  denied by macOS accessibility permissions, CoreGraphics synthesized clicks did
  not focus the form, and the Chrome extension could list/claim tabs but failed
  on ChatGPT DOM/screenshot interaction. Developer Mode app creation, tool
  invocation, iframe rendering, and clipboard behavior are therefore not
  claimed.
- MCP Inspector: yes. Inspector v0.22.0 connected to the local bridge and ran
  read-only work-loop tools.
- Local browser harness: yes. The harness served the existing
  `apps/augnes_apps/public/console-widget.html` from `/tmp` and posted live
  bridge `structuredContent` payloads into the iframe using the widget host
  message contract.
- In-app Browser: yes. Screenshots and DOM snapshots were captured through the
  browser tool.

## Observed User Path

### Work Picker

`augnes_list_work_items(scope=project:augnes)` returned and rendered a Work
Picker. The iframe view showed:

- candidate count `5`
- recommended work `AG-006`
- work title `Coordination event spine schema and storage`
- visible work IDs for candidates
- next action hints

No write, execute, close, merge, PR, proof, evidence, event, or provider control
was visible in the Work Picker iframe. The picker surface did not expose copy
buttons.

### Work Contract Card

`augnes_get_work_brief(scope=project:augnes, workId=AG-006)` rendered the Work
Contract Card. The first viewport showed the work title, work ID, status,
priority, recent events, linked docs, and current / next step before deep
technical details. Expected files and expected checks remained reachable below
the first viewport. AG-006 had no expected files in the seeded brief and had the
expected curl checks:

```text
curl -sS "http://localhost:3000/api/work/AG-006?scope=project%3Aaugnes" | jq .
curl -sS "http://localhost:3000/api/work/AG-006/brief?scope=project%3Aaugnes" | jq .
```

### Core / Full Handoff

The browser iframe rendered:

- `Copy Codex Handoff`
- `Copy Full Context`
- Core / Full guidance
- read-only copy boundary text
- collapsed Core packet text
- collapsed Full packet text

The long Full Context section could be opened. The packet stayed inside the
details panel with wrapped, scrollable preformatted text. The copy buttons
remained visible and the nested details layout stayed usable after scrolling.

Clipboard observation: clicking both copy controls caused the widget to show a
copy status, including `Full handoff copied.` after the Full Context click.
Independent read-back did not verify a system clipboard write in this host:
`obsTab.clipboard.readText()` still returned the sentinel value, and `pbpaste`
returned zero bytes. Treat clipboard success as unverified for this in-app
Browser host; the manual packet text fallback remains visible via the opened
details sections.

### Codex Result Import / Review

The bridge and browser harness exercised four AG-006 result states:

- no result input: rendered `Needs result input`
- completed but partially verified result: rendered `Additional verification needed`
- aligned completed result: rendered `Close-ready`
- blocked result: rendered blocked / incomplete guidance

The partial result remained conservative because it did not cover the expected
AG-006 curl checks. The aligned result only reached close-ready after the
simulated final report included required closeout sections, explicit no-skipped
and no-remaining-caveats statements, expected curl verification, and the
authority boundary statement.

No invented PR URL, proof ID, evidence ID, screenshot, host observation, or
verification result was observed in the no-result state.

### Work Event Spine Timeline / Inspector

The AG-006 seeded runtime rendered:

- Work event spine section
- Event timeline
- Event inspector
- one seeded event
- `created_at_ascending` timeline ordering in the structured payload
- selected event fields including actor, authority level, source surface, target,
  state keys, and missing fields

An empty-state fixture was also posted through the temporary browser harness
after clearing the seeded coordination event fallback arrays and inspector alias.
The iframe rendered the no-event empty-state text without the seeded event ID.
This fixture was browser-only; it did not mutate runtime state.

### Result Closure / Follow-up Recommendation

The closure panel rendered for all result states. Observed states:

- no result input: `Needs result input`
- partially verified completed result: `Additional verification needed`
- aligned completed result: `Close-ready`
- blocked result: blocked / incomplete guidance

The closure section showed reasons, missing-before-close guidance, verification
still needed, human decision items, and a preview-only follow-up seed. The
boundary text stated that the surface does not close work, update status, create
events, record proof/evidence, execute Codex, call GitHub or providers, create
branches or PRs, submit PR reviews, publish, merge, retry, replay, or deploy.

## MCP Inspector Observation

MCP Inspector v0.22.0 connected to `augnes-console` through the local proxy and
showed the server version `0.1.0`.

Observed through Inspector:

- `Tools` tab listed `List Augnes work items` and `Get Augnes work brief`.
- `List Augnes work items` showed read-only and non-destructive annotations and
  returned structuredContent with AG-006.
- `Get Augnes work brief` with `scope=project:augnes` and `workId=AG-006`
  returned structuredContent containing `work_contract_card`,
  Core / Full copyable handoff fields, `codex_result_review_packet_preview`,
  `work_event_spine_timeline`, and `result_review_closure_preview`.
- Corrected Inspector JSON-mode runs for partial, aligned, and blocked simulated
  `codexResult` inputs returned success and exposed the expected structured
  surfaces.

Inspector caveat: the Inspector DOM retained prior result strings in ways that
made exact recommendation text assertions noisy after repeated runs. Exact
status mapping was therefore taken from the live bridge payloads and local
widget harness, not from substring checks over the whole Inspector page.

## ChatGPT Developer Mode Attempt

Developer Mode was present enough to open the ChatGPT Apps / Developer Mode
New App form. The observed form fields and controls were:

- Name: `Augnes Work Loop Local`
- Connection: `Server URL`
- Initial MCP Server URL: `http://localhost:8897/mcp`
- Authentication: `No Auth`
- Custom MCP risk acknowledgement: checked
- Create button: visible

The host rejected the plain HTTP localhost URL as unsafe. This is consistent
with the Server URL field expecting an HTTPS MCP endpoint. A temporary
Cloudflare quick tunnel was started and verified against the read-only local
bridge:

```text
https://verbal-morning-reform-downloaded.trycloudflare.com/mcp
```

Verification of that endpoint returned the expected MCP initialize response for
`augnes-console` version `0.1.0`. The observation did not proceed to app
creation or tool invocation because the browser-control surfaces available in
this run could not update or submit the form after the HTTPS tunnel was ready.
This is an environment/control-plane limitation, not an observed Augnes product
failure.

## Layout / Scroll / Overflow

Observed layout behavior:

- The host page scroll and iframe scroll were usable.
- Long sections below the first viewport remained reachable.
- Details sections could be opened.
- The expanded Full Context packet remained contained in the card.
- Long packet text wrapped or scrolled inside `pre` blocks.
- Copy buttons remained visible enough at the packet section.
- No horizontal overflow made main text unreadable in the desktop pass.
- A cheap 390px viewport pass showed the work card, AG-006, closure content, and
  copy controls remained present. The mobile pass was a spot check, not a full
  responsive QA matrix.

## Observation Artifacts

Screenshots and payload notes were captured locally under:

```text
/tmp/augnes-work-loop-host-observation-597/
```

Notable local artifacts:

- `01-work-picker.png`
- `02-no-result.png`
- `03-partial-result.png`
- `04-aligned-result.png`
- `05-blocked-result.png`
- `06-copy-controls-after-full.png`
- `07-no-event-fixture.png`
- `08-full-packet-open.png`
- `09-mobile-aligned-top.png`
- `10-mcp-inspector-initial.png` through `18-mcp-inspector-get-brief-*-corrected.png`
- `payloads.json`
- `dom-observations.json`
- `inspector-scenario-results-corrected.json`

The screenshots are local observation artifacts and are not committed in this
docs-only PR.

## Authority Boundaries

No product/App/MCP write authority was added or invoked by this observation
pass:

- no Codex execution from App/MCP
- no shell execution from App/MCP
- no GitHub API calls from product/App/MCP code
- no provider/OpenAI calls
- no proof/evidence writes
- no event creation/mutation
- no work close/status update
- no state commit/reject
- no branch/PR creation from product/App/MCP code
- no PR review submission
- no merge/publish/retry/replay/deploy controls
- no durable lifecycle automation

Only local developer shell commands were used to start the isolated runtime,
bridge, Inspector, browser harness, and temporary HTTPS tunnel. Only read-only
work-loop tools were invoked through the bridge and Inspector. No ChatGPT
Developer Mode tool invocation completed.

## Skipped Checks

- ChatGPT Developer Mode tool/widget rendering: skipped because the Developer
  Mode form was reachable but plain HTTP localhost was rejected as unsafe, and
  after a verified HTTPS tunnel was created, the available browser-control
  surfaces could not update or submit the form. No Developer Mode app creation,
  tool invocation, iframe rendering, or clipboard success is claimed.
- System clipboard success claim: skipped because independent read-back did not
  verify the widget copy status in the in-app Browser host.
- Committed screenshots: skipped to keep the PR documentation-only and avoid
  adding binary artifacts for local-only host screenshots.
- Full mobile QA matrix: skipped because the task called for a cheap responsive
  check only if feasible; a 390px spot check was performed.

## Remaining Caveats

- A real ChatGPT Developer Mode pass is still needed with an HTTPS MCP endpoint
  and a browser session where form input/submission works before claiming
  ChatGPT host-specific iframe and clipboard behavior.
- Clipboard behavior differs between the widget's in-frame status and external
  read-back in this host; treat copy success as unverified unless the actual host
  clipboard path is observed.
- MCP Inspector is good for confirming connection, tool listing, annotations,
  and structuredContent presence, but repeated result runs can leave prior
  strings in the DOM. Use bridge payloads for exact status assertions.
- The local DB script help friction should be handled separately if operators
  need safe `--help` probes for DB scripts.

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

Run one real ChatGPT Developer Mode host pass for the same AG-006 scenarios
using either ChatGPT's Secure MCP Tunnel flow or a verified HTTPS tunnel, then
focus on iframe clipping and clipboard behavior. If that host reveals no layout
or copy-control issues, the v0.1 loop can stay closed as a preview-only
operator path until the project explicitly scopes semi-automation gates or
knowledge accumulation surfaces.
