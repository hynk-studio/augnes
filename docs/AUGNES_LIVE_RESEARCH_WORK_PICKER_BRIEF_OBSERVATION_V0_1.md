# Augnes Live Research Work Picker Brief Observation v0.1

## Date

2026-06-17

## Baseline Commit

`8651387` (`main` after merged PR #618).

## Scenario Purpose

Run one narrow live local-runtime observation for `AG-DOGFOOD-RESEARCH-001`
before pausing general-user UX polish and preparing larger Research
Accumulation planning work.

This observation follows the prior deterministic happy path:

- `docs/AUGNES_RESEARCH_WORK_USER_HAPPY_PATH_OBSERVATION_V0_1.md`
- `docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md`
- `docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md`

Primary question: can a user/operator find the research work item, open its
Work Brief / Work Contract Card, see enough scope and authority context to
proceed, and use `npm run codex:next-work` as a fallback when live handoff is
unavailable?

## Run Mode

Run mode: live local-runtime observation through direct local API and read-only
MCP bridge JSON-RPC output.

Observed live surfaces:

- Next runtime: `http://localhost:3149`
- App/MCP bridge: `http://localhost:8909/mcp`
- Runtime work route:
  `GET /api/work/AG-DOGFOOD-RESEARCH-001?scope=project%3Aaugnes`
- Runtime brief route:
  `GET /api/work/AG-DOGFOOD-RESEARCH-001/brief?scope=project%3Aaugnes`
- MCP tools:
  - `augnes_list_work_items`
  - `augnes_get_work_brief`

No browser iframe, MCP Inspector, ChatGPT Developer Mode host, screenshot, or
clipboard behavior is claimed.

## Runtime Setup Attempted

Runtime setup succeeded with an isolated temp DB and non-default local ports.

Temp DB path:

```text
/tmp/augnes-live-research-work-picker-brief-observation-619.db
```

The final recordable runtime command used mock mode explicitly so the command
does not name or depend on provider credentials:

```sh
AUGNES_USE_MOCK=true AUGNES_DB_PATH=/tmp/augnes-live-research-work-picker-brief-observation-619.db npm run dev -- --port 3149
```

The read-only bridge command was:

```sh
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_APP_TOOL_SURFACE=work_loop_readonly AUGNES_API_BASE_URL=http://localhost:3149 PORT=8909 npm --prefix apps/augnes_apps run dev
```

Both processes were stopped after the observation.

## Commands Run

Setup:

```sh
AUGNES_DB_PATH=/tmp/augnes-live-research-work-picker-brief-observation-619.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-live-research-work-picker-brief-observation-619.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-live-research-work-picker-brief-observation-619.db npm run demo:seed
AUGNES_USE_MOCK=true AUGNES_DB_PATH=/tmp/augnes-live-research-work-picker-brief-observation-619.db npm run dev -- --port 3149
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_APP_TOOL_SURFACE=work_loop_readonly AUGNES_API_BASE_URL=http://localhost:3149 PORT=8909 npm --prefix apps/augnes_apps run dev
```

Read-only observation probes:

```sh
curl -sS 'http://localhost:3149/api/work/AG-DOGFOOD-RESEARCH-001?scope=project%3Aaugnes'
curl -sS 'http://localhost:3149/api/work/AG-DOGFOOD-RESEARCH-001/brief?scope=project%3Aaugnes'
curl -sS 'http://localhost:8909/healthz'
```

MCP JSON-RPC methods called against `http://localhost:8909/mcp`:

```text
initialize
tools/list
tools/call augnes_list_work_items {"scope":"project:augnes"}
tools/call augnes_get_work_brief {"scope":"project:augnes","workId":"AG-DOGFOOD-RESEARCH-001"}
```

Codex worker discovery checks:

```sh
npm run codex:next-work -- --scope project:augnes --work-id AG-DOGFOOD-RESEARCH-001
npm run codex:next-work -- --scope project:augnes --work-id AG-DOGFOOD-RESEARCH-001 --api-base-url http://localhost:3149
```

## Live URL Or Host Used

- Runtime host used: `http://localhost:3149`
- Bridge host used: `http://localhost:8909/mcp`
- Browser page observed: none.
- Route/tool output observed: yes, through local runtime routes and direct MCP
  JSON-RPC tool calls.

## Whether Work Picker Was Observed

Work Picker was observed through the live read-only MCP bridge output from
`augnes_list_work_items`.

Observed result:

- Candidate count: `6`
- Recommended work ID: `AG-006`
- `AG-DOGFOOD-RESEARCH-001` visible: yes
- `AG-DOGFOOD-RESEARCH-001` recommended: no
- Research handoff instruction:
  `Open this work with augnes_get_work_brief using workId: AG-DOGFOOD-RESEARCH-001.`
- Work Picker boundaries:
  - read-only: `true`
  - state commit/reject: `false`
  - Codex execution: `false`
  - branch or PR creation: `false`
  - proof recording: `false`
  - evidence recording: `false`
  - GitHub calls: `false`
  - persistence: `false`

## Whether AG-DOGFOOD-RESEARCH-001 Was Visible

`AG-DOGFOOD-RESEARCH-001` was visible in the live Work Picker output with:

- Title: `Research accumulation scenario pack for ChatGPT-Augnes-Codex dogfood`
- Status: `in_progress`
- Priority: `normal`
- Summary: operator-led preview-only Research / Paper / Knowledge Accumulation
  dogfood work
- Next step: use Core Codex Handoff, then paste the Codex final report through
  `codexResultText` or `codexResultPaste`
- Expected files count: `4`
- Expected checks count: `2`
- Linked docs count: `1`

The item is identifiable as the research accumulation dogfood work item. It is
not the default recommended item because `AG-006` remains the first active
priority-now item.

## Whether Work Brief / Work Contract Card Was Opened

Work Brief / Work Contract Card was opened through:

```text
augnes_get_work_brief {"scope":"project:augnes","workId":"AG-DOGFOOD-RESEARCH-001"}
```

Observed card output:

- Work Contract Card present: yes
- Work ID: `AG-DOGFOOD-RESEARCH-001`
- Work title: `Research accumulation scenario pack for ChatGPT-Augnes-Codex dogfood`
- Current or next step: use Core Codex Handoff, then paste the Codex final
  report through `codexResultText` or `codexResultPaste`
- Expected files visible:
  - `docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md`
  - `scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs`
  - `package.json`
  - `apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md`
- Expected checks visible in the Work Contract Card:
  - runtime work route check
  - runtime brief route check
- Direct runtime API still showed the seeded docs/smoke checks:
  - `node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs`
  - `git diff --check`

## Whether Core Handoff Path Was Visible

Core Handoff path was visible in the live Work Brief output.

Observed fields:

- `core_current_task_only.core_usage`: `implementation_ready`
- `core_codex_handoff_packet`: present
- `copyable_core_handoff_text`: present
- `full_codex_handoff_packet`: present
- `copyable_full_handoff_text`: present
- Result report template:
  `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`
- Next return path:
  `Paste through codexResultText / codexResultPaste for preview review.`

No browser copy button was clicked or claimed in this PR.

## Whether codex:next-work Fallback Was Checked

`npm run codex:next-work` was checked.

Without a runtime URL, the exact fallback command returned:

- `source`: `repo_seed_fallback`
- `runtime_attempted`: `false`
- `runtime_available`: `false`
- `fallback_reason`: `runtime_not_configured`
- `work_id`: `AG-DOGFOOD-RESEARCH-001`

With `--api-base-url http://localhost:3149`, the helper returned:

- `source`: `runtime_work_brief`
- `runtime_attempted`: `true`
- `runtime_available`: `true`
- `fallback_reason`: `none`
- `work_id`: `AG-DOGFOOD-RESEARCH-001`

This confirms `codex:next-work` remains a usable fallback when no live handoff
is available, and it can use the live runtime when a runtime URL is supplied.

## Whether codexResultText / codexResultPaste Result Return Path Was Visible

The result return path was visible in the live Work Brief output.

Observed:

- `codex_result_review_packet_preview.status`: `needs_result_input`
- `codex_result_import_input_shape`: present
- `codexResultText`: accepted by the `augnes_get_work_brief` input schema
- `codexResultPaste`: accepted by the `augnes_get_work_brief` input schema
- Core current-task-only next return path:
  `Paste through codexResultText / codexResultPaste for preview review.`

This was visible in live MCP tool output and documented from the live path. It
was not verified in a browser iframe or ChatGPT Developer Mode host.

## Whether Preview-only / No-write Boundary Was Visible

Preview-only / no-write boundary was visible in both Work Picker and Work Brief
output.

Observed Work Brief boundaries:

- read-only: `true`
- state commit/reject: `false`
- Codex execution: `false`
- approval authority: `false`
- publish authority: `false`
- retry authority: `false`
- replay authority: `false`
- external posting: `false`
- merge authority: `false`
- auto-merge authority: `false`
- proof recording: `false`
- evidence recording: `false`
- durable approval: `user/Core gated`

Narrative output also stated no work close, no work status update, no event
creation, no event mutation, no proof/evidence write, no state commit/reject,
no Codex execution, no GitHub calls, no PR review submission, no branch/PR
creation, no provider/OpenAI calls, and no publish/merge/retry/replay/deploy
authority.

## User/operator Friction Findings

- The research item is visible and identifiable, but it is third in the
  candidate list and not the recommended work item.
- The Work Picker tells the user exactly how to open it with
  `augnes_get_work_brief`.
- The live Work Brief makes the current task, expected files, expected checks,
  Core Handoff, result return path, and read-only boundary available.
- Non-blocking friction: because this run used port `3149`, the card's route
  check examples showing `localhost:3000` are not literal for this non-default
  observation port. The direct runtime API on `3149` worked, and the normal
  documented default runtime port remains `3000`.

## Codex Worker Friction Findings

- Codex can use the live Work Brief directly when supplied with
  `--api-base-url http://localhost:3149`.
- Codex can still use repo-backed fallback discovery when no runtime URL is
  supplied.
- The live runtime Work Brief expected checks differ from the deterministic
  seed/docs fallback checks: the live card shows runtime route checks, while
  the direct runtime work route and repo fallback show docs/smoke checks.
  This is not blocking, but a worker should report which discovery path it
  used.

## Result Return Friction Findings

- The result return path is visible enough in live tool output:
  `codexResultText` and `codexResultPaste` are accepted input aliases and the
  Core current-task-only section names both.
- The no-result state is explicit: `needs_result_input`.
- Remaining friction is host-level, not contract-level: this PR did not render
  a browser iframe or Developer Mode card, so visible input placement in the
  hosted UI is not claimed.

## What Passed

- Local temp runtime started successfully.
- Read-only App/MCP bridge started successfully in `work_loop_readonly` mode.
- MCP `tools/list` returned only:
  - `augnes_list_work_items`
  - `augnes_get_work_brief`
- Live Work Picker showed `AG-DOGFOOD-RESEARCH-001`.
- Live Work Picker routed to `augnes_get_work_brief` with the research work ID.
- Live Work Brief / Work Contract Card opened for `AG-DOGFOOD-RESEARCH-001`.
- Current task, expected files, expected checks, Core Handoff, result return
  path, and read-only boundaries were available in live output.
- `codex:next-work` fallback worked without a runtime URL.
- `codex:next-work` runtime mode worked with `--api-base-url
  http://localhost:3149`.

## What Failed

No blocking live-path issue was found.

Non-blocking caveat: route check examples in the Work Contract Card used
`localhost:3000` while this observation intentionally used `localhost:3149` to
avoid port conflicts.

## What Was Skipped

- Browser iframe observation: skipped because direct local runtime and MCP
  bridge output was sufficient for this narrow live-path sanity check.
- MCP Inspector: skipped because direct JSON-RPC checks against the local bridge
  covered the required read-only tool path.
- ChatGPT Developer Mode host: skipped because this PR is local-runtime
  observation only and did not require a public tunnel or host registration.
- Clipboard behavior: skipped because no browser copy control was clicked.
- Product UX polish: skipped by scope.
- Research accumulation implementation: skipped by scope.
- Ingestion and persistence: skipped by scope.

## Remaining Caveats

- This was a live local-runtime and MCP bridge observation, not a ChatGPT
  Developer Mode or browser iframe observation.
- The research item is visible but not recommended; a user must intentionally
  choose it from the candidate list.
- The non-default-port check examples are mildly confusing for observers who do
  not use the default `localhost:3000` runtime.
- No paper, provider, ingestion, persistence, proof/evidence, event mutation,
  work status mutation, state decision, automatic Codex execution, or GitHub
  automation behavior was tested or added.

## Authority Boundaries

This PR documents one narrow live or attempted-live observation for the
Research Accumulation Work Picker / Work Brief path. It adds no paper
ingestion, no paper fetching, no provider/OpenAI calls, no embeddings/RAG/vector
search, no DB migration, no durable research state write, no proof/evidence
write, no work close/status mutation, no event creation/mutation, no state
commit/reject, no automatic Codex execution, no automatic GitHub fetch, no PR
review submission, no merge/publish/retry/replay/deploy controls, no App/MCP
tools, and no widening of the `work_loop_readonly` Developer Mode tool surface.

Additional explicit boundaries:

- no paper ingestion
- no paper fetching
- no provider/OpenAI calls
- no embeddings/RAG/vector search
- no DB migration
- no durable research state write
- no proof/evidence write
- no work close/status mutation
- no event creation/mutation
- no state commit/reject
- no automatic Codex execution
- no automatic GitHub fetch/review/merge/publish
- no App/MCP tools
- no work_loop_readonly widening

## Final UX Polish Decision

No blocking live-path issue found; pause general UX polish and proceed to
Research Accumulation preparation.

## Next Recommended Step

Pause general UX polish and proceed to Research Accumulation preparation.
