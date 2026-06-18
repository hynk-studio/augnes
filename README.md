# Augnes

Augnes is a local-first, operator-led runtime for AI-assisted project work. It
keeps project state, work items, handoff context, proof-only action records,
and Codex result reports in one local workspace so a human operator, ChatGPT /
MCP clients, and Codex workers can coordinate around bounded work without
handing durable decisions to a model.

## What Augnes Can Do Today

- Run a local Cockpit for reviewing committed state, active work, Perspective
  context, bridge activity, and operator controls.
- Keep accepted temporal state transitions in a local SQLite ledger behind an
  explicit user/runtime commit/reject gate.
- Show Work Picker, Work Brief, Work Contract Card, Core Handoff, and Full
  Handoff context for bounded work items.
- Expose read-first ChatGPT / MCP bridge calls such as
  `augnes_list_work_items` and `augnes_get_work_brief`.
- Let Codex discover bounded work with `npm run codex:next-work`, use a
  pasted Core Handoff or runtime Work Brief when available, and report whether
  it used runtime or repo fallback context.
- Accept manual Codex result reports through `codexResultText` or
  `codexResultPaste` for preview review.
- Compile local observe, plan, and temporal-interpretation previews with
  deterministic mock fallbacks; optional OpenAI-backed flows can be tested
  when a local `OPENAI_API_KEY` is supplied.
- Keep proof, evidence, work traces, handoffs, and result reports separate so
  reviewers can inspect what happened without confusing review artifacts with
  approval.

## Quick Start

Run the local demo:

```bash
npm install
npm run db:reset
npm run db:migrate
npm run demo:seed
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
```

Then open:

```text
http://localhost:3000
```

Use the Cockpit to inspect Overview, Work, Perspective, Bridge, and Operator
surfaces. Work Picker and Work Brief / Work Contract Card help a human review
bounded work before a separate Codex session starts.

`OPENAI_API_KEY` is optional for the local demo because deterministic mock
fallbacks are included. To test OpenAI-backed observe, plan, and preview flows,
set `OPENAI_API_KEY` in your local environment. Do not commit `.env` or
`.env.local`.

## Three Ways To Use Augnes

### 1. Human/operator local path

Run the local runtime, open the Cockpit, inspect current state and work, and
decide what should become durable state. This path is the main operator view
for local project continuity.

### 2. ChatGPT / MCP path

Start the local runtime first. For the read-only Work Loop surface used by
ChatGPT Developer Mode, start the bridge in a second terminal:

```bash
npm --prefix apps/augnes_apps install
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_APP_TOOL_SURFACE=work_loop_readonly AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
```

Connect ChatGPT Developer Mode, MCP Inspector, or another MCP-compatible
client to:

```text
http://localhost:8787/mcp
```

In `work_loop_readonly` mode, useful calls are:

- `augnes_list_work_items` with args `{ "scope": "project:augnes" }`
- `augnes_get_work_brief` with args
  `{ "scope": "project:augnes", "workId": "AG-RESEARCH-CAPABILITY-LANES-001" }`

This read-only profile can show Work Picker and Work Brief / Work Contract
Card context, including Core Handoff and result-return paths.
Broader local bridge/proof workflows are documented separately from the
read-only ChatGPT work-loop path.

### 3. Codex worker path

If a Core Handoff or Full Handoff is pasted into a Codex task, use that handoff
as the primary work contract.

If a runtime Work Brief is available and `CODEX_WORK_ID` is set, use:

```bash
npm run codex:read-brief
```

If no handoff is pasted, start with:

```bash
npm run codex:next-work -- --scope project:augnes
```

For the current research capability preparation item:

```bash
npm run codex:next-work -- --scope project:augnes --prefer-research
npm run codex:next-work -- --scope project:augnes --work-id AG-RESEARCH-CAPABILITY-LANES-001
```

For historical dogfood evidence only:

```bash
npm run codex:next-work -- --scope project:augnes --work-id AG-DOGFOOD-RESEARCH-001
```

Codex should report whether discovery came from `runtime_work_brief`,
`repo_seed_fallback`, `docs_fallback`, or `blocked`. Use
`docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md` for the final report, then
return it to the human for manual paste through `codexResultText` or
`codexResultPaste`.

## Research And Perspective Development Direction

Research Accumulation is moving from preview vocabulary toward product-facing
Research capability lanes for Perspective development. The current repo-backed
preparation item is `AG-RESEARCH-CAPABILITY-LANES-001`, which points to:

- `docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md`

The next R&D focus is a review-first path for manually supplied
source/reference/notes material: clear provenance, candidate/review records,
retrieval non-authority rules, and human-reviewed perspective promotion. The
historical dogfood item `AG-DOGFOOD-RESEARCH-001` remains available for
explicit work-id lookup and points to:

- `docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md`
- `docs/AUGNES_RESEARCH_WORK_USER_HAPPY_PATH_OBSERVATION_V0_1.md`
- `docs/AUGNES_LIVE_RESEARCH_WORK_PICKER_BRIEF_OBSERVATION_V0_1.md`

## Result Return Path

Codex result return is manual and preview-first:

1. Codex completes the bounded repo task.
2. Codex writes a field-first result report using
   `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`.
3. The human pastes that report into `codexResultText` or
   `codexResultPaste`.
4. Augnes previews the returned report for review.

Codex should not claim a PR URL, host observation, proof/evidence row, event
row, state decision, work close, provider call, or runtime behavior unless it
actually happened.

## Screenshots

### Cockpit

| Cockpit Overview | Perspective-centered IA |
|---|---|
| <img src="screenshots/12-final-cockpit-overview.png" width="520" alt="Cockpit Overview with five top-level tabs"> | <img src="screenshots/17-final-perspective-current-frame.png" width="520" alt="Perspective tab showing current frame, Ledger Basis, Evidence, Tensions, and Boundary / Next"> |

### AI Surfaces Using Augnes

| ChatGPT state brief | ChatGPT work brief | Codex completion proof |
|---|---|---|
| <img src="screenshots/13-final-chatgpt-state-brief.png" width="320"> | <img src="screenshots/14-final-chatgpt-work-brief.png" width="320"> | <img src="screenshots/15-final-codex-terminal-completion-proof.png" width="320"> |

More screenshots and supporting proof captures are listed in
`screenshots/README.md`.

## Unsupported / Not Yet Supported

- Augnes is local-first, not a hosted production service.
- External publishing, merging, deployment, and irreversible actions remain
  operator-controlled.
- Research fetching, retrieval, durable research memory, and perspective
  promotion are active development lanes, not automatic default behavior.
- Proof, evidence, PRs, and pasted Codex reports are review artifacts, not
  approval authority.

## Security And Boundaries

- No API keys are committed. `.env` and `.env*.local` are ignored.
- Augnes is local-first and operator-led.
- Durable state remains behind explicit user/runtime gates.
- ChatGPT / MCP bridge surfaces remain read-first unless separately scoped.
- Work IDs are trace anchors, not state authority.
- Action records are execution proof, not approval.
- PRs are review artifacts, not merge authority.

## Read Next

- `docs/AUGNES_START_HERE_FOR_USERS_AND_AI.md`
- `docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md`
- `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`
- `apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md`
- `docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md`
- `docs/AUTHORITY_MATRIX.md`
- `AGENTS.md`
- `docs/00_INDEX_LATEST.md`
