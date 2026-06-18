# Augnes Start Here For Users And AI

## What Augnes Is

Augnes is a local-first, operator-led runtime for AI-assisted project work. It
keeps committed project state, work items, handoff context, proof-only action
records, and Codex result reports in one local workspace so a human operator,
ChatGPT / MCP clients, and Codex workers can coordinate without giving models
direct authority over durable state.

## Who This Is For

- Human operators who want to run the local Cockpit, inspect work, and decide
  what becomes durable state.
- ChatGPT / MCP users who want read-first state and work context through the
  Augnes bridge.
- Codex workers that need a bounded work contract, source reporting, and a
  manual result-return path.
- Reviewers checking whether a task stayed inside Augnes authority boundaries.

## What Works Today

- Cockpit runs locally for state, work, Perspective, Bridge, and Operator
  review.
- Work Picker can list work items for a scope such as `project:augnes`.
- Work Brief / Work Contract Card can show current task context, expected
  files, expected checks, stop conditions, Core Handoff, and result-return
  instructions.
- ChatGPT / MCP bridge tools can read state and work context through the local
  bridge.
- Codex can use `npm run codex:next-work` for deterministic work discovery
  when no pasted handoff is available.
- Codex can return a manual field-first result report for paste-back through
  `codexResultText` or `codexResultPaste`.

## What Is Preview-only

- Core Handoff and Full Handoff are reviewable handoff packets; they do not
  execute Codex.
- Codex result review through `codexResultText` or `codexResultPaste` is
  preview-only and does not become proof, evidence, approval, state, or work
  closure by itself.
- `docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md` defines
  preview-only research accumulation shapes for `AG-DOGFOOD-RESEARCH-001`.
- `docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md` defines the
  current product-facing research capability preparation lane for
  `AG-RESEARCH-CAPABILITY-LANES-001`.
- `docs/AUGNES_LIVE_RESEARCH_WORK_PICKER_BRIEF_OBSERVATION_V0_1.md` records
  that the live local Work Picker / Work Brief path was observed for the
  research work loop, without adding product behavior.

## What Is Not Implemented Yet

- Research accumulation product lanes are not implemented in the current
  preview; paper/source fetching, crawling, indexing, durable research
  candidate memory, embeddings, RAG, vector search, provider-assisted
  extraction/summary, and human-reviewed perspective promotion need a fresh
  Work Brief/Core Handoff, explicit scope, authority boundaries, and
  verification.
- Automatic Codex execution is not implemented.
- Automatic GitHub fetch, review, merge, publish, or approval controls are not
  implemented.
- Production hosting, production auth, OAuth, and multi-user deployment are not
  implemented.
- New App/MCP tools for research accumulation are not implemented.

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

Use the Cockpit to inspect the active state, Work Picker, Work Brief / Work
Contract Card, Perspective context, bridge status, and operator controls.

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

This read-only profile can show Work Picker and Work Brief / Work Contract
Card context, including Core Handoff and result-return paths. It does not
execute Codex, create branches or PRs, call GitHub, record proof/evidence,
commit/reject state, or widen the Developer Mode tool surface.

Default App/MCP cards now use compact capability summaries. Detailed boundary
text stays available in diagnostics/debug fields and Authority Matrix refs.

Broader local bridge/proof workflows are documented separately and should not
be confused with the read-only ChatGPT work-loop path.

## Codex Quick Start

Use a pasted Core Handoff or Full Handoff as the primary work contract when the
user provides one.

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

## Research Work Loop Example

`AG-RESEARCH-CAPABILITY-LANES-001` is the current repo-backed research
capability preparation item. The historical `AG-DOGFOOD-RESEARCH-001` dogfood
item remains available only when named explicitly. The current preparation loop
is:

1. Human/operator finds the work item through Work Picker or names the work ID.
2. Human/operator opens Work Brief / Work Contract Card.
3. Human/operator copies Core Handoff, or Codex runs `npm run codex:next-work`
   as a fallback.
4. Codex completes the bounded preparation docs/smoke work and uses
   `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`.
5. Human/operator pastes the report through `codexResultText` or
   `codexResultPaste` for preview review.

The research work loop currently prepares capability-lane contract vocabulary
and source/review authority expectations only. It does not ingest papers, fetch
sources, call providers, build retrieval indexes, persist research candidate
memory, or promote perspectives.

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
candidate memory write, no proof/evidence write, no work close/status
mutation, no event creation/mutation, no state commit/reject, no automatic
Codex execution, no automatic GitHub fetch/review/merge/publish, and no
widening of the `work_loop_readonly` Developer Mode tool surface. Future
research capability work is allowed only when a fresh Work Brief or Core
Handoff explicitly scopes the lane, files, checks, and authority boundary.

## Recommended Next Docs

- `README.md`
- `AGENTS.md`
- `docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md`
- `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`
- `docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md`
- `docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md`
- `docs/AUGNES_RESEARCH_WORK_USER_HAPPY_PATH_OBSERVATION_V0_1.md`
- `docs/AUGNES_LIVE_RESEARCH_WORK_PICKER_BRIEF_OBSERVATION_V0_1.md`
- `apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md`
- `docs/AUTHORITY_MATRIX.md`
- `docs/00_INDEX_LATEST.md`
