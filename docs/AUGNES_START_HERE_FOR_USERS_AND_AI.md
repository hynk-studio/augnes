# Augnes Start Here For Users And AI

> This file describes the current v0.1 runtime and compatibility workflows.
> Active product direction and target architecture are governed by
> `docs/vnext/00_AUGNES_VNEXT_DOCUMENT_INDEX.md` and
> `docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md`. Manual handoff and result-paste
> paths below remain useful fallbacks, but they are not the target vNext flow.

## What Augnes Is

Augnes is a local-first, operator-led work system for long-context AI-assisted
project development. It keeps committed project state, work items, handoff
context, proof-only action records, runner/Codex review material, and result
reports in one local workspace so a human operator, ChatGPT / MCP clients, Codex
workers, and local runtime tools can coordinate without giving models direct
authority over durable state.

The current front-door structure is:

```text
Blank State
= human-facing entry surface

Agent Workplane
= AI/operator-facing work surface

GuideBrief
= cross-surface guidance and explanation layer

Provider / Runner / Tool Layer
= ChatGPT, Codex, OpenAI API, GitHub, runner, MCP/App, and local bridge power sources
```

Legacy Cockpit has been removed as a product surface. Its useful capabilities
were migrated into Blank State, Agent Workplane, Workplane State Proposal Review,
and Manual Controls Migration review rows.

## Who This Is For

- Human operators who want to start from Blank State, inspect current work, and
  decide what should become durable state.
- AI/operator workflows that need Agent Workplane context, source refs, review
  queues, handoff previews, runner readback, and GuideBrief explanations.
- ChatGPT / MCP users who want read-first state, work, GuideBrief, handoff, and
  Codex Launch Card preview context through the Augnes bridge.
- Codex workers that need a bounded work contract, source reporting, and a manual
  result-return path.
- Reviewers checking whether a task stayed inside Augnes authority boundaries.

## What Works Today

- Blank State runs at `/` as the human-facing entry surface.
- Agent Workplane runs at `/workbench` as the AI/operator-facing work surface.
- Perspective review remains available at `/perspective`.
- Workplane panels show Current Working Perspective, Delta Projection, Review
  Queue, Review Memory Detail, State Proposal Review, Evidence/Handoff context,
  Source Ref Bridge Detail, runner DeltaBatch readback, handoff previews, Codex
  Launch Card preview, run postmortem, trace diagnostics, GuideBrief context,
  intent projection, and metrics.
- ChatGPT / MCP bridge tools can read state, work, GuideBrief, Handoff Capsule,
  Codex Launch Card, Autonomy Contract, runner preflight, evidence packs, and
  session trace context through the local bridge when enabled.
- Codex can use `npm run codex:next-work` for deterministic work discovery when
  no pasted handoff is available.
- Codex can return a manual field-first result report for paste-back through
  `codexResultText` or `codexResultPaste`.

## What Is Preview-only

- Handoff Capsule, Core Handoff, Full Handoff, and Codex Launch Card are
  reviewable handoff packets; they do not execute Codex.
- Codex result review through `codexResultText` or `codexResultPaste` is
  preview-only and does not become proof, evidence, approval, state, or work
  closure by itself.
- State Proposal Review shows proposal diffs, before/after previews, memory and
  Perspective candidates, manual preview rows, stale/fallback warnings, and
  authority boundaries. It does not approve, reject, commit, apply memory, apply
  Perspective, or auto-apply deltas.
- Runner DeltaBatch readback is review context. It is not runner execution,
  runner recovery, runner scheduling, or applied state.
- `docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md` defines
  preview-only research accumulation shapes for `AG-DOGFOOD-RESEARCH-001`.
- `docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md` defines the
  current product-facing research capability preparation lane for
  `AG-RESEARCH-CAPABILITY-LANES-001`.

## What Is Not Implemented Yet

- Direct Codex execution from Augnes surfaces is not implemented.
- Branch creation, PR creation, GitHub review submission, merge, publish, retry,
  replay, and deploy controls are not implemented.
- Durable memory apply, Perspective apply, and delta auto-apply authority
  contracts are not implemented.
- Runner execution/tick/schedule/recovery authority from Workplane is not
  implemented.
- Research accumulation product lanes are not implemented in the current
  preview; paper/source fetching, crawling, indexing, durable research candidate
  memory, embeddings, RAG, vector search, provider-assisted extraction/summary,
  and human-reviewed perspective promotion need a fresh Work Brief/Core Handoff,
  explicit scope, authority boundaries, and verification.
- Production hosting, production auth, OAuth, and multi-user deployment are not
  implemented.

## Human Quick Start

Run the local demo from the repo root:

```bash
npm install
npm run db:reset
npm run db:migrate
npm run demo:seed
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
```

Open:

```text
http://localhost:3000
```

Useful local surfaces:

```text
/            Blank State human entry
/workbench   Agent Workplane
/perspective Perspective timeline and review context
```

## ChatGPT / MCP Quick Start

Start the Augnes runtime first. For the read-only Work Loop surface used by
ChatGPT Developer Mode, start the local bridge:

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

- `augnes_list_work_items` with `{ "scope": "project:augnes" }`
- `augnes_get_work_brief` with
  `{ "scope": "project:augnes", "workId": "AG-RESEARCH-CAPABILITY-LANES-001" }`

This read-only profile can show Work Picker and Work Brief / Work Contract Card
context, including Core Handoff and result-return paths. It does not execute
Codex, create branches or PRs, call GitHub, record proof/evidence,
commit/reject state, or widen the Developer Mode tool surface.

Broader bridge-gated tools remain local operator workflow tools and should not be
confused with public/default read-only behavior.

## Codex Quick Start

Use a pasted Core Handoff, Handoff Capsule, or Codex Launch Card as the primary
work contract when the user provides one.

If a runtime Work Brief is available and `CODEX_WORK_ID` is set, use:

```bash
npm run codex:read-brief
```

If no handoff is pasted, start with:

```bash
npm run codex:next-work -- --scope project:augnes
```

For research work:

```bash
npm run codex:next-work -- --scope project:augnes --prefer-research
npm run codex:next-work -- --scope project:augnes --work-id AG-RESEARCH-CAPABILITY-LANES-001
npm run codex:next-work -- --scope project:augnes --work-id AG-DOGFOOD-RESEARCH-001
```

Codex must report whether the source was `runtime_work_brief`,
`repo_seed_fallback`, `docs_fallback`, or `blocked`.

## Current Work Loop Example

A typical Augnes-on-Augnes work loop is:

1. Human/operator starts from Blank State or names a work ID.
2. Human/operator opens Agent Workplane for source refs, review queue,
   GuideBrief, handoff previews, and related runner/Codex context.
3. Human/operator copies Core Handoff, Handoff Capsule, or Codex Launch Card, or
   Codex runs `npm run codex:next-work` as a fallback.
4. Codex completes the bounded repo work and uses
   `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`.
5. Human/operator pastes the report through `codexResultText` or
   `codexResultPaste` for preview review.
6. Augnes surfaces result-review candidates, action-record draft context, work
   event draft context, and any next user judgment needs.

## Result Report Return Path

Codex should write a field-first report using:

```text
docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md
```

Return the report to the human/operator for manual paste through
`codexResultText` or `codexResultPaste`. The pasted report is candidate review
input only. It is not proof, evidence, state authority, approval, work closure,
or merge authority.

## Authority Boundaries

This guide adds no runtime behavior, no UI behavior, no API routes, no MCP/App
tools, no database migration, no research ingestion, no paper/source fetching,
no provider/OpenAI calls, no embeddings/RAG/vector search, no durable research
candidate memory write, no proof/evidence write, no work close/status mutation,
no event creation/mutation, no state commit/reject, no automatic Codex
execution, no automatic GitHub fetch/review/merge/publish, and no widening of the
`work_loop_readonly` Developer Mode tool surface. Future capability work is
allowed only when a fresh Work Brief or Core Handoff explicitly scopes the lane,
files, checks, and authority boundary.

## Recommended Next Docs

- `README.md`
- `docs/AUGNES_CURRENT_STATUS_AND_NEXT_TASKS_V0_1.md`
- `AGENTS.md`
- `docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md`
- `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`
- `docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md`
- `docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md`
- `apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md`
- `docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md`
- `docs/AUTHORITY_MATRIX.md`
- `docs/00_INDEX_LATEST.md`
