# Augnes

Augnes is a local-first, operator-led work system for long-context AI-assisted
project development. It helps a human operator, ChatGPT / MCP clients, Codex
workers, and local runtime tools coordinate around bounded work without handing
durable project decisions to a model.

The current product shape is organized around four surfaces:

```text
Blank State
= human-facing entry surface

Agent Workplane
= AI/operator-facing work surface

GuideBrief
= cross-surface guidance and context explanation layer

Provider / Runner / Tool Layer
= ChatGPT, Codex, OpenAI API, GitHub, runner, MCP/App, and local bridge power sources
```

Legacy Cockpit has been removed as a product surface. Its useful capabilities
were migrated into Blank State, Agent Workplane, Workplane State Proposal Review,
and Manual Controls Migration review rows.

## What Augnes Can Do Today

- Present a human-facing Blank State at `/` for continuing work, reviewing
  pending proposals, choosing Perspective context, preparing Codex handoff, and
  checking runner DeltaBatch review entry points.
- Present an AI/operator-facing Agent Workplane at `/workbench` with Current
  Working Perspective, Delta Projection, Review Queue, State Proposal Review,
  handoff previews, runner DeltaBatch readback, source refs, trace diagnostics,
  GuideBrief context, and Workplane metrics.
- Keep accepted temporal state transitions in a local SQLite ledger behind an
  explicit user/runtime commit/reject gate.
- Expose read-first ChatGPT / MCP bridge calls such as `augnes_list_work_items`,
  `augnes_get_work_brief`, `augnes_get_guide_brief`,
  `augnes_get_handoff_capsule_preview`, and
  `augnes_get_codex_launch_card_preview` when the local bridge surface is
  enabled.
- Let Codex discover bounded work with `npm run codex:next-work`, use a pasted
  Core Handoff or runtime Work Brief when available, and report whether it used
  runtime or repo fallback context.
- Prepare Codex handoff and result-review drafts without directly executing
  Codex, creating branches, creating PRs, merging, publishing, or committing
  state.
- Compile local observe, plan, and temporal-interpretation previews with
  deterministic mock fallbacks; optional OpenAI-backed flows can be tested when
  a local `OPENAI_API_KEY` is supplied.
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

Useful local surfaces:

```text
/            Blank State human entry
/workbench   Agent Workplane
/perspective Perspective timeline and review context
```

`OPENAI_API_KEY` is optional for the local demo because deterministic mock
fallbacks are included. To test OpenAI-backed observe, plan, and preview flows,
set `OPENAI_API_KEY` in your local environment. Do not commit `.env` or
`.env.local`.

## Three Ways To Use Augnes

### 1. Human/operator local path

Run the local runtime, open Blank State, choose what to continue or review, and
use Agent Workplane for work context, source refs, proposals, handoff previews,
runner readback, and GuideBrief context. Durable decisions remain explicit and
operator-led.

### 2. ChatGPT / MCP path

Start the local runtime first. For the read-only Work Loop surface used by
ChatGPT Developer Mode, start the bridge in a second terminal:

```bash
npm --prefix apps/augnes_apps install
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_APP_TOOL_SURFACE=work_loop_readonly AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
```

Connect ChatGPT Developer Mode, MCP Inspector, or another MCP-compatible client
to:

```text
http://localhost:8787/mcp
```

In `work_loop_readonly` mode, useful calls are:

- `augnes_list_work_items` with args `{ "scope": "project:augnes" }`
- `augnes_get_work_brief` with args
  `{ "scope": "project:augnes", "workId": "AG-RESEARCH-CAPABILITY-LANES-001" }`

The broader bridge-gated App/MCP surface also includes read-only previews for
GuideBrief, Handoff Capsule, Codex Launch Card, Autonomy Contract, runner
preflight, evidence packs, and session traces. These tools are review and
planning surfaces, not execution or state authority.

### 3. Codex worker path

If a Core Handoff, Handoff Capsule, or Codex Launch Card is pasted into a Codex
task, use that handoff as the primary work contract.

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

## Current Architecture Summary

The current read-model path is:

```text
Source records
  -> Augnes Delta Projection
  -> Current Working Perspective
  -> Workplane Context
  -> Blank State / Agent Workplane / State Proposal Review / GuideBrief
```

Most current surfaces are read-only or preview-only. They can show source refs,
fallback reasons, staleness, gaps, authority boundaries, handoff drafts, Codex
Launch Card previews, and review candidates. They do not directly apply memory,
apply Perspective, auto-apply deltas, execute Codex, tick runners, call GitHub,
merge PRs, publish, retry, replay, or deploy.

## Research And Perspective Development Direction

Research Accumulation is moving from preview vocabulary toward product-facing
research capability lanes for Perspective development. The current repo-backed
preparation item is `AG-RESEARCH-CAPABILITY-LANES-001`, which points to:

- `docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md`

The next R&D focus is a review-first path for manually supplied
source/reference/notes material: clear provenance, candidate/review records,
retrieval non-authority rules, and human-reviewed perspective promotion. The
historical dogfood item `AG-DOGFOOD-RESEARCH-001` remains available for explicit
work-id lookup and points to:

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

Codex should not claim a PR URL, host observation, proof/evidence row, event row,
state decision, work close, provider call, or runtime behavior unless it actually
happened.

## Screenshots

The screenshots in `screenshots/` are historical OpenAI Dev Challenge and
Cockpit-era proof captures. They remain useful as evidence of earlier local
runtime, MCP, Perspective, and Codex flows, but they are not the current product
information architecture. Current front-door structure is Blank State + Agent
Workplane + GuideBrief.

More screenshots and supporting proof captures are listed in
`screenshots/README.md`.

## Unsupported / Not Yet Supported

- Augnes is local-first, not a hosted production service.
- External publishing, merging, deployment, and irreversible actions remain
  operator-controlled.
- Research fetching, retrieval, durable research memory, and perspective
  promotion are active development lanes, not automatic default behavior.
- Direct Codex execution, branch creation, PR creation, GitHub review/merge,
  durable memory apply, Perspective apply, runner execution, and delta auto-apply
  require future explicitly scoped authority contracts.
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
- `docs/AUGNES_CURRENT_STATUS_AND_NEXT_TASKS_V0_1.md`
- `docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md`
- `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`
- `apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md`
- `docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md`
- `docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md`
- `docs/AUTHORITY_MATRIX.md`
- `AGENTS.md`
- `docs/00_INDEX_LATEST.md`
