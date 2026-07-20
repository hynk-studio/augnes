# Augnes

Augnes is a local-first, operator-led temporal project substrate for AI-assisted work.
Native hosts such as ChatGPT and Codex execute tasks; Augnes preserves project context,
lineage, reviewed decisions, and durable state across those tasks.

## Product direction

Augnes is being completed around one operability-first flow:

```text
Start Augnes
→ select a project
→ start or accept a task
→ compile project context
→ run Codex / the native host interactively or through bounded automation
→ RunReceipt
→ source-linked assessment/comparison
→ reviewable semantic proposal
→ user decision
→ authorized Transition
→ later context reuse
→ later outcome feedback
```

The active product commitments are:

- provider-neutral, local-first Core
- Resume / Verify / Decide
- project and workspace identity with isolation
- `TaskContextPacket`, `RunReceipt`, `EpisodeDeltaProposal`, and `ReviewDecision`
- source-linked criterion assessment that preserves `unknown` when support is insufficient
- bounded strategic advantage transfer inside the shared R6 assessment boundary
- candidate-level review before any strategic or semantic change can be authorized
- later `ContextUseReview` outcome feedback for reviewed context reuse
- a bounded Automation Spine using policy, grants, runs, receipts, stop conditions, and user control
- minimal Model Gateway with an OpenAI reference adapter
- adapter-backed Codex round trip for interactive and unattended runs
- Project Home, Semantic Workbench, and shared Inspector
- a bounded Personal Perspective lane that reuses the same review, context-selection, and feedback contracts
- migration, backup, restore, update, and recovery

The active sequence is defined in
[`docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`](docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md).

## What works today

- `/` and `/projects/[project_id]` provide Project Home for Resume, current
  coordination, attention, automation state, and the next meaningful action.
- `/workbench` remains a small compatibility landing page rather than a second
  review product.
- `/workbench/semantic-review` provides the canonical Semantic Workbench for
  Verify and Decide, including explicit decision and Transition interactions.
- Existing result deep links remain concise result entries into Workbench and
  the exact receipt-focused shared Inspector.
- `/workbench/inspector` is reached through generated exact links and provides
  authenticated, project-scoped, read-only drill-down. It creates no semantic
  record, decision, gate, Transition, packet, feedback, or automation work and
  invokes no model, provider, or external action.
- `/perspective` provides Perspective and lineage views.
- local SQLite persistence stores durable vNext semantic records and projections.
- deterministic mock paths allow local development without an OpenAI key.
- persisted `TaskContextPacket` input now reaches deterministic or live native hosts without packet copy, and structured results return through one canonical `RunReceipt` authority for Project Home, Workbench, and Inspector review.

## Current development start

One canonical command resolves application-owned local paths, safely creates or
migrates the database, and supervises both the local UI and MCP bridge:

```bash
npm install
npm --prefix apps/augnes_apps install
npm run augnes
```

The command waits for both processes to become ready and prints the effective
loopback UI URL. It automatically selects another bounded loopback port when a
preferred port is occupied. On restart it automatically reconciles provably
owned orphan children and interrupted database preparation; unverifiable local
ownership fails closed without signaling processes or changing data.
`npm run dev` remains a compatibility alias.

From another terminal, the same command surface reports or stops the verified
owned instance:

```bash
npm run augnes -- status
npm run augnes -- stop
npm run augnes -- diagnostics
```

`diagnostics` is an explicit, read-only local surface for resolved data,
configuration, backup, runtime-state, and database paths. Normal start, status,
stop, and health output omit database and backup paths. An absolute
`AUGNES_DB_PATH` remains available as an explicit compatibility override; when
it is absent, Augnes does not adopt `data/augnes.db` from the repository.

`db:migrate` and `demo:seed` remain explicit development commands and are not
part of normal startup. Do not use `db:reset` as a normal start command. It is a
destructive developer operation and must only be used with an absolute
`AUGNES_DB_PATH` that targets an explicitly disposable database.

`OPENAI_API_KEY` is optional. Without it, supported flows use deterministic local fallbacks.

## Canonical verification

The supported public verification surface is:

```bash
npm run typecheck
npm run build
npm test
npm run test:integration
npm run test:authority
npm run test:operability
npm run test:e2e
```

## Development policy

- Advance the end-to-end product flow before adding new framework or process layers.
- Build the minimal Automation Spine across R2–R8 instead of postponing automation until after the manual path is fixed.
- Defer advanced hunt heuristics, generic scheduler replication, unrestricted retry, self-modification, and automatic semantic commit—not bounded automation itself.
- Allow Personal Perspective to progress as a parallel bounded lane when it reuses existing Core contracts and does not block the mainline flow.
- Use focused unit, integration, disposable-database, and browser tests during development.
- Do not make long manual operator pilots a normal PR merge gate.
- Move broad real-user usefulness validation to Alpha, after the core R2–R8 flow is feature-complete.
- Keep irreversible external actions and durable semantic changes under explicit user control.
- Implement strategic analysis as an optional bounded profile inside the shared R6
  assessment → proposal → decision → Transition path, not as a separate Arena,
  strategic engine, or multi-agent subsystem.
- Never let assessment, strategic candidates, model agreement, or outcome feedback
  bypass proposal, decision, or Transition gates.
- Do not add new planning-only documents, passive workflow-stage panels, manual copy UI, feature-specific smoke commands, or separate automation/perspective subsystems by default.

## Active documents

- [`docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md`](docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md) — product identity and north star
- [`docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md`](docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md) — Core and protocol meaning
- [`docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`](docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md) — active implementation order
- [`docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`](docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md) — development and post-Alpha evaluation
- [`docs/REPOSITORY_REDUCTION_SCOPE.md`](docs/REPOSITORY_REDUCTION_SCOPE.md) — repository retention and deletion policy
- [`AGENTS.md`](AGENTS.md) — Codex implementation rules

Historical plans, dogfood reports, closeout records, and compatibility documents are not active sequencing authority.
